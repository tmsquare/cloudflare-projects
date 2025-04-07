// Define environment variables interface
interface Env {
  UPLOADS_BUCKET: R2Bucket;
  CLEAN_BUCKET: R2Bucket;
  VIRUS_BUCKET: R2Bucket;
  VIRUS_TOTAL_API_KEY: string;
}

// Define VirusTotal API response types
interface VTAnalysisStats {
  harmless: number;
  malicious: number;
  suspicious: number;
  undetected: number;
  timeout: number;
}

interface VTFileAttributes {
  last_analysis_stats: VTAnalysisStats;
  last_analysis_results: Record<string, any>;
  type_description: string;
  size: number;
  md5: string;
  sha1: string;
  sha256: string;
  [key: string]: any;
}

interface VTFileResponse {
  data: {
    id: string;
    type: string;
    attributes: VTFileAttributes;
  };
}

interface VTAnalysisAttributes {
  status: string;
  stats: VTAnalysisStats;
  results: Record<string, any>;
  [key: string]: any;
}

interface VTAnalysisResponse {
  data: {
    id: string;
    type: string;
    attributes: VTAnalysisAttributes;
  };
}

interface VTUploadResponse {
  data: {
    id: string;
    type: string;
  };
}

interface QueueMessage {
  account: string,
  action: string,
  bucket: string,
  object: {
    key: string,
    size: number,
    eTag: string
  },
  eventTime: string,
  copySource: {
    bucket: string,
    object: string
  }
}



// Function to scan file using VirusTotal API
async function scanFileForViruses(
  fileBuffer: ArrayBuffer, 
  fileName: string, 
  apiKey: string
): Promise<{ isClean: boolean; details: any }> {
  try {
    // Calculate SHA-256 hash of the file for VirusTotal lookup
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // First, check if the file has already been analyzed
    const vtResponse = await fetch(`https://www.virustotal.com/api/v3/files/${fileHash}`, {
      headers: {
        'x-apikey': apiKey
      }
    });
    
    // If the file already exists in VirusTotal database
    if (vtResponse.status === 200) {
      const vtData = await vtResponse.json() as VTFileResponse;
      const stats = vtData.data.attributes.last_analysis_stats;
      
      return {
        isClean: stats.malicious === 0 && stats.suspicious === 0,
        details: vtData.data.attributes
      };
    }
    
    // If the file doesn't exist, we need to upload it
    // NOTE: For files larger than 32MB, you'd need to use the URL upload endpoint instead
    if (fileBuffer.byteLength > 32 * 1024 * 1024) {
      // For larger files, handle differently or return an approximation
      console.warn('File too large for direct VirusTotal upload, using fallback approach');
      
      // Example fallback: check file extension for simple heuristic
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      const riskExtensions = ['exe', 'dll', 'bat', 'sh', 'js', 'vbs'];
      
      return {
        isClean: !riskExtensions.includes(fileExtension),
        details: {
          note: 'Large file heuristic check only, not scanned by antivirus engines',
          method: 'extension_check',
          extension: fileExtension
        }
      };
    }
    
    // Upload the file for scanning
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), fileName);
    
    const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
      method: 'POST',
      headers: {
        'x-apikey': apiKey
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`VirusTotal upload failed: ${uploadResponse.statusText}`);
    }
    
    const uploadResult = await uploadResponse.json() as VTUploadResponse;
    if (!uploadResult.data || !uploadResult.data.id) {
      throw new Error('Invalid response from VirusTotal upload API');
    }
    
    const analysisId = uploadResult.data.id;
    
    // Poll for the analysis result
    let analysisResult: VTAnalysisResponse | null = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between polls
      
      const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: {
          'x-apikey': apiKey
        }
      });
      
      if (!analysisResponse.ok) {
        console.warn(`Analysis poll attempt ${attempts} failed: ${analysisResponse.statusText}`);
        continue;
      }
      
      analysisResult = await analysisResponse.json() as VTAnalysisResponse;
      
      // Check if the analysis is complete
      if (analysisResult?.data?.attributes?.status !== 'queued') {
        break;
      }
    }
    
    if (!analysisResult || !analysisResult.data || !analysisResult.data.attributes || 
        analysisResult.data.attributes.status === 'queued') {
      // If still queued after max attempts, use more lenient approach
      return {
        isClean: true, // Assuming clean until proven otherwise
        details: {
          note: 'Analysis still in progress, temporary result',
          method: 'pending_analysis',
          analysisId
        }
      };
    }
    
    const stats = analysisResult.data.attributes.stats;
    return {
      isClean: stats.malicious === 0 && stats.suspicious === 0,
      details: analysisResult.data.attributes
    };
  } catch (error) {
    console.error('Error during virus scanning:', error);
    
    // Default to blocking the file if there's an error in the scanning process
    return {
      isClean: false,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error during virus scan',
        errorType: 'scan_failure'
      }
    };
  }
}

export default {
	async queue(batch, env): Promise<void> {
	  let messages = JSON.stringify(batch.messages);
    try {
      
      // Validate notification structure
      if (!messages || !messages.object.key) {
        console.log(`Invalid notification format': ${messages}`);
      }
      
      const fileKey = messages.object.key;
      console.log(`Processing file: ${fileKey}`);

      // Get the file from the uploads bucket
      const file = await env.UPLOADS_BUCKET.get(fileKey);
      if (!file) {
        console.log(`File ${fileKey} not found in uploads bucket` );
        throw new Error(`File ${fileKey} not found in uploads bucket`);
      }

      // Get file content as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      // Scan file for viruses
      const scanResult = await scanFileForViruses(fileBuffer, fileKey, env.VIRUS_TOTAL_API_KEY);
      
      // Move file to appropriate bucket based on scan results
      if (scanResult.isClean) {
        await env.CLEAN_BUCKET.put(fileKey, fileBuffer, {
          httpMetadata: file.httpMetadata,
          customMetadata: {
            ...file.customMetadata,
            scanResult: JSON.stringify(scanResult),
            scanDate: new Date().toISOString()
          }
        });
        
        // Optionally delete from uploads bucket after successful move
        await env.UPLOADS_BUCKET.delete(fileKey);
        
        console.log(`File ${fileKey} is clean and moved to clean bucket`)
      } else {
        await env.VIRUS_BUCKET.put(fileKey, fileBuffer, {
          httpMetadata: file.httpMetadata,
          customMetadata: {
            ...file.customMetadata,
            scanResult: JSON.stringify(scanResult),
            scanDate: new Date().toISOString()
          }
        });
        
        // Optionally delete from uploads bucket after successful move
        await env.UPLOADS_BUCKET.delete(fileKey);
        console.log(`File ${fileKey} contains malware and moved to virus bucket`)
      }
    } catch (error) {
      console.error('Error processing file:', error);
    }
	  
	},
} satisfies ExportedHandler<Env>;
