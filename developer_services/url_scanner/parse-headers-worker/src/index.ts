import { DurableObject } from "cloudflare:workers";



export interface Env {
	BROWSER_KV_DEMO: KVNamespace;
	HEADERS_COUNTS_OBJECT: DurableObjectNamespace<HeadersCountsOBJECT>;
	AI: Ai;
}

type AssetHeader = {
	assetUrl: string;
	headers: { [key: string]: string };
};
type HeaderBatch = AssetHeader[];


export class HeadersCountsOBJECT extends DurableObject {
	private state: DurableObjectState;
	private storage: DurableObjectStorage;
	private counts: { [key: string]: number };
	private summaries: string[];
	private env: Env;

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.state = state;
		this.env = env;
		this.storage = state.storage;
		this.counts = this.initializeCounts();
		this.summaries = []; 
	}

	/*
		COUNTS
	*/

	// Initializes the counts object
	private initializeCounts(): { [key: string]: number } {
		return {
			images: 0,
			css: 0,
			js: 0,
			html: 0,
			fonts: 0,
			videos: 0,
			json: 0,
			others: 0,
		};
	}

	// Fetches all asset counts
	async getAssets(): Promise<{ [key: string]: number }> {
		await this.loadCountsState();
		return this.counts;
	}

	// Increments a specific asset count
	async incrementAsset(type: keyof typeof this.counts): Promise<void> {
		if (type in this.counts) {
			this.counts[type]++;
			await this.saveCountsState();
		}
	}

	// Decrements a specific asset count
	async decrementAsset(type: keyof typeof this.counts): Promise<void> {
		if (type in this.counts && this.counts[type] > 0) {
			this.counts[type]--;
			await this.saveCountsState();
		}
	}

	// Resets all asset counts
	async resetAssets(): Promise<void> {
		this.counts = this.initializeCounts();
		await this.saveCountsState();
	}

	// Saves the current counts state to storage
	private async saveCountsState(): Promise<void> {
		await this.storage.put('counts', this.counts);
	}

	// Loads the counts state from storage
	private async loadCountsState(): Promise<void> {
		const savedCounts = await this.storage.get<{ [key: string]: number }>('counts');
		if (savedCounts) {
			this.counts = savedCounts;
		}
	}

	// Counts asset types from a given set of headers and updates the state
	async countAssetTypes(assets: AssetHeader[]): Promise<void> {
		const assetTypeMap: { [key: string]: keyof typeof this.counts } = {
			'image/': 'images',
			'text/css': 'css',
			'application/javascript': 'js',
			'application/x-javascript': 'js',
			'text/javascript': 'js',
			'text/html': 'html',
			'font/': 'fonts',
			'application/json/': 'json',
			'video/': 'videos',
		};

		const extensionMap: { [key: string]: keyof typeof this.counts } = {
			'jpg': 'images', 'jpeg': 'images', 'png': 'images', 'gif': 'images', 'webp': 'images',
			'bmp': 'images', 'tiff': 'images', 'svg': 'images', 'css': 'css', 'js': 'js',
			'html': 'html', 'woff': 'fonts', 'woff2': 'fonts', 'ttf': 'fonts', 'otf': 'fonts',
			'eot': 'fonts', 'mp4': 'videos', 'webm': 'videos', 'ogg': 'videos', 'avi': 'videos',
			'mkv': 'videos', 'm4v': 'videos', 'json': 'json',
		};

		for (const { headers, assetUrl } of assets) {
			const contentType = headers['content-type']?.toLowerCase();
			let extension = assetUrl.split('.').pop()?.toLowerCase();

			if (contentType) {
				for (const [key, value] of Object.entries(assetTypeMap)) {
					if (contentType.includes(key) || extensionMap[extension || ''] === value) {
						await this.incrementAsset(value);
						extension = undefined; // Prevents double-counting by extension
						break;
					}
				}
			} else if (extension && extensionMap[extension]) {
				await this.incrementAsset(extensionMap[extension]);
			} else {
				await this.incrementAsset('others');
			}
		}
	}

	/*
		SUMMARIES
	*/
	// Fetches all asset counts
	async getSummaries(): Promise<string[]> {
		await this.loadSummariesState();
		return this.summaries;
	}

	// Increments a specific asset count
	async addSummary(message: string): Promise<void> {
		this.summaries.push(message);
		await this.saveSummariesState();
	}

	// Decrements a specific asset count
	async deleteLastSummary(message: string): Promise<void> {
		this.summaries.pop();
		await this.saveSummariesState();
	}

	// Resets all asset counts
	async resetSummaries(): Promise<void> {
		this.summaries = [];
		await this.saveSummariesState();
	}

	// Saves the current counts state to storage
	private async saveSummariesState(): Promise<void> {
		await this.storage.put('summaries', this.summaries);
	}

	// Loads the counts state from storage
	private async loadSummariesState(): Promise<void> {
		const savedSummaries = await this.storage.get<string[]>('summaries');
		if (savedSummaries) {
			this.summaries = savedSummaries;
		}
	}

	// Generate a summary from a given set of headers and updates the state
	async generateNewSummary(assets: AssetHeader[]): Promise<void> {
		const message = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
			prompt: "Given the following HTTP headers, I want a short consise summary (max of 250 words) of" +
				"what are the key insights, good practices and bad practices, which providers are used: " +
				JSON.stringify(assets)
		  }
		);

		await this.addSummary(JSON.stringify(message));
	}
}


export default {
	async fetch(request, env, ctx): Promise<Response> {
		const { pathname, searchParams } = new URL(request.url);
		const key = searchParams.get("key");
		const id_string = searchParams.get("id_string");

		if (!id_string) {
			return new Response("Missing id_string parameter", { status: 400 });
		}

		let id: DurableObjectId = env.HEADERS_COUNTS_OBJECT.idFromName(id_string);
		let stub = env.HEADERS_COUNTS_OBJECT.get(id);
		let normalizedKey;

		switch (pathname) {
			case "/counts":
				if (!key) {
					return new Response("Missing key parameter", { status: 400 });
				}
				normalizedKey = new URL(key).toString(); // normalize the key
				const headersData = await env.BROWSER_KV_DEMO.get<HeaderBatch>(normalizedKey, { type: "json" });
			
				if (!headersData) {
					return new Response("No data found for the provided key", { status: 404 });
				}
				
				await stub.countAssetTypes(headersData as AssetHeader[]);
				return new Response("Counts calculated");
			case "/reset_counts":
				await stub.resetAssets();
				return new Response("Counts reset successfully");
			case "/getAll_counts":
				const counts = await stub.getAssets();
				return new Response(JSON.stringify(counts, null, 2), {
					headers: {
						"content-type": "application/json",
					},
				});
			case "/summary":
				if (!key) {
					return new Response("Missing key parameter", { status: 400 });
				}
				normalizedKey = new URL(key).toString(); // normalize the key
				const HeadersData = await env.BROWSER_KV_DEMO.get<HeaderBatch>(normalizedKey, { type: "json" });
			
				if (!HeadersData) {
					return new Response("No data found for the provided key", { status: 404 });
				}
				
				await stub.generateNewSummary(HeadersData as AssetHeader[]);
				return new Response("Summary generated");
			case "/getAll_summary":
				const summaries = await stub.getSummaries();
				return new Response(JSON.stringify(summaries, null, 2), {
					headers: {
						"content-type": "application/json",
					},
				});
			case "/reset_summary":
				await stub.resetSummaries();
				return new Response("Summaries reset successfully");
			

			default:
				return new Response("Invalid path. Use /count, /getAll, or /reset", { status: 400 });
		}
	},
} satisfies ExportedHandler<Env>;