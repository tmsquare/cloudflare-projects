/**
 * Script to preprocess PerfectStay data and upload to Vectorize using Cloudflare AI
 * 
 * This worker reads perfectstay.json from R2 bucket and uploads to Vectorize.
 * 
 * Usage:
 * 1. Deploy: wrangler deploy -c wrangler.upload.jsonc
 * 2. Visit the deployed URL to trigger upload
 * 3. Delete worker after: wrangler delete perfectstay-uploader
 */

interface Product {
  id: string;
  slug: string;
  destination: string;
  name: string;
  stars: number;
  tripadvisor_rating: number;
  tripadvisor_reviews: number;
  price_eur: number;
  price_type: string;
  nights: number;
  flight_included: boolean;
  tags: string[];
  url: string;
  images: string[];
}

interface PerfectStayData {
  products: Product[];
}

interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: Record<string, string | number | boolean>;
}

interface Env {
  AI: any;
  VECTORIZE: any;
  R2: R2Bucket;
}

/**
 * Create a searchable text representation of each product
 * Focuses on: name, destination, and tags (balanced weighting)
 */
function createProductText(product: Product): string {
  // Primary search fields - repeated for higher weight
  const name = product.name || 'Unknown';
  const destination = product.destination || 'Unknown';
  
  // Tags without excessive repetition
  const tags = product.tags && Array.isArray(product.tags) && product.tags.length > 0 
    ? product.tags.join(' ') 
    : '';
  
  // Build search text: name and destination get more weight
  const parts = [
    name,
    destination, 
    name, // Repeat name for emphasis
    destination, // Repeat destination for emphasis
    tags,
    `${product.stars || 0} stars`, // Basic quality indicator
    product.flight_included ? 'flight included' : ''
  ].filter(Boolean);
  
  return parts.join(' ');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      console.log('Reading perfectstay.json from R2 bucket...');
      
      // Read from R2 bucket
      const object = await env.R2.get('perfectstay.json');
      
      if (!object) {
        return new Response(JSON.stringify({
          success: false,
          error: 'perfectstay.json not found in R2 bucket "perfectstay-travel"'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const rawData = await object.text();
      console.log(`File size: ${rawData.length} bytes`);
      
      const data: PerfectStayData = JSON.parse(rawData);

      if (!data.products || !Array.isArray(data.products)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid JSON structure: missing or invalid "products" array'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log(`Found ${data.products.length} products`);

      const batchSize = 100; // Process 100 at a time
      const allVectors: VectorizeVector[] = [];

      for (let i = 0; i < data.products.length; i += batchSize) {
        try {
          const batch = data.products.slice(i, i + batchSize);
          console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.products.length / batchSize)}...`);
        
        // Create text for all products in batch
        const texts = batch.map((product, idx) => {
          try {
            return createProductText(product);
          } catch (err) {
            console.error(`Error creating text for product ${idx} (ID: ${product.id}):`, err);
            throw err;
          }
        });
        
        console.log(`Generated ${texts.length} text descriptions`);
        
        // Generate embeddings for the batch using Cloudflare AI
        console.log(`Calling AI.run with ${texts.length} texts...`);
        let embeddingResponse: any;
        
        try {
          embeddingResponse = await env.AI.run(
            "@cf/baai/bge-base-en-v1.5",
            { text: texts }
          );
        } catch (aiError) {
          console.error(`AI.run failed:`, aiError);
          throw new Error(`AI model failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
        }

        console.log(`AI response received`);
        console.log(`Full response:`, JSON.stringify(embeddingResponse).substring(0, 1000));
        
        if (!embeddingResponse) {
          throw new Error('AI response is null or undefined');
        }

        console.log(`Response type:`, typeof embeddingResponse);
        console.log(`Response keys:`, Object.keys(embeddingResponse));
        console.log(`Has data:`, 'data' in embeddingResponse);
        console.log(`Has shape:`, 'shape' in embeddingResponse);

        // Handle response - it could be { data: number[][] } or { shape: number[], data: number[] }
        let embeddings: number[][];
        
        if (embeddingResponse.data && Array.isArray(embeddingResponse.data) && embeddingResponse.data.length > 0) {
          // Check if first element is an array (Format 1) or number (Format 2)
          if (Array.isArray(embeddingResponse.data[0])) {
            // Format 1: { data: [[...], [...]] }
            console.log(`✓ Using nested array format, got ${embeddingResponse.data.length} embeddings`);
            embeddings = embeddingResponse.data;
          } else {
            // Format 2: { data: [flat array], shape: [n, dim] }
            console.log(`✓ Using flat array with shape`);
            const shape = embeddingResponse.shape || [texts.length, 768];
            const [numTexts, dimensions] = shape;
            console.log(`Reshaping ${embeddingResponse.data.length} values into ${numTexts}x${dimensions}`);
            
            embeddings = [];
            for (let i = 0; i < numTexts; i++) {
              const start = i * dimensions;
              const end = start + dimensions;
              const slice = embeddingResponse.data.slice(start, end);
              embeddings.push(Array.isArray(slice) ? slice : Array.from(slice));
            }
            console.log(`✓ Reshaped into ${embeddings.length} embeddings of ${embeddings[0]?.length} dimensions`);
          }
        } else {
          const errorDetails = {
            responseType: typeof embeddingResponse,
            hasData: 'data' in embeddingResponse,
            hasShape: 'shape' in embeddingResponse,
            dataType: embeddingResponse.data ? typeof embeddingResponse.data : 'undefined',
            dataIsArray: embeddingResponse.data ? Array.isArray(embeddingResponse.data) : false,
            dataLength: embeddingResponse.data?.length,
            keys: Object.keys(embeddingResponse),
            sample: JSON.stringify(embeddingResponse).substring(0, 500)
          };
          throw new Error(`Unexpected embedding response: ${JSON.stringify(errorDetails)}`);
        }

        // Create vectors with metadata
        console.log(`Creating vectors with metadata for ${embeddings.length} embeddings...`);
        
        if (embeddings.length !== batch.length) {
          throw new Error(`Mismatch: got ${embeddings.length} embeddings but ${batch.length} products`);
        }
        
        const vectors: VectorizeVector[] = embeddings.map((vector, idx) => {
          const product = batch[idx];
          
          if (!product) {
            throw new Error(`Product at index ${idx} is undefined`);
          }
          
          if (!vector || !Array.isArray(vector) || vector.length === 0) {
            throw new Error(`Invalid embedding at index ${idx}: ${typeof vector}, length: ${vector?.length}`);
          }
          
          return {
            id: String(product.id),
            values: vector,
            metadata: {
              slug: product.slug || '',
              destination: product.destination || '',
              name: product.name || '',
              stars: product.stars || 0,
              rating: product.tripadvisor_rating || 0,
              reviews: product.tripadvisor_reviews || 0,
              price: product.price_eur || 0,
              nights: product.nights || 0,
              flight_included: product.flight_included || false,
              tags: (product.tags && Array.isArray(product.tags)) ? product.tags.join(',') : '',
              url: product.url || '',
              image: (product.images && Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : '',
              searchText: texts[idx] || ''
            }
          };
        });
        
        console.log(`✓ Created ${vectors.length} vectors`);

          // Upload to Vectorize
          console.log(`Uploading ${vectors.length} vectors to Vectorize...`);
          await env.VECTORIZE.upsert(vectors);
          allVectors.push(...vectors);
          
          console.log(`Batch complete! Total uploaded: ${allVectors.length}/${data.products.length} vectors`);
        } catch (batchError) {
          console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, batchError);
          throw new Error(`Batch ${Math.floor(i / batchSize) + 1} failed: ${batchError instanceof Error ? batchError.message : String(batchError)}`);
        }
      }

      console.log('\n Done! All data uploaded to Vectorize.');
      
      return new Response(JSON.stringify({
        success: true,
        totalUploaded: allVectors.length,
        message: 'All products uploaded to Vectorize successfully!'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
