import puppeteer from "@cloudflare/puppeteer";
import { DurableObject } from "cloudflare:workers";
import { Browser as PuppeteerBrowser, Page } from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
  BROWSER_KV_DEMO: KVNamespace;
  BROWSER_DO: DurableObjectNamespace<Browser_DO>;
  AI: Ai;
}

type AssetHeader = {
  assetUrl: string;
  headers: { [key: string]: string };
};
type HeaderBatch = AssetHeader[];

const JSON_HEADERS = { "content-type": "application/json" };
const BATCH_SIZE = 20;
const SCROLL_LIMIT = 2000;
const VIEWPORT = { width: 1200, height: 3000 };
const KV_TTL = 60 * 30;
const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;



export class Browser_DO extends DurableObject {
	private state: DurableObjectState;
	private env: Env;
	private browser?: PuppeteerBrowser;
	private keptAliveInSeconds: number;
	private storage: DurableObjectStorage;
  
	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.state = state;
		this.env = env;
		this.keptAliveInSeconds = 0;
		this.storage = this.state.storage;
	}
  
	async fetch(request: Request): Promise<Response> {

		const { pathname, searchParams } = new URL(request.url);
		const domain = searchParams.get("url");

		if (!domain) {
			return new Response("Please add a path (/counts, /summary or /servers) and a domain (?url=example.com)", { status: 400 });
		}

		const url = this.formatUrl(domain);
		const batchKey = `${url}_1/`;
		const randomId = this.generateRandomId();
		const DO_STRING_ID = url + randomId;
  
		if (!this.browser || !this.browser.isConnected()) {
			console.log(`Browser DO: Starting new instance`);
			try {
			this.browser = await puppeteer.launch(this.env.MYBROWSER);
			} catch (e) {
			console.log(
				`Browser DO: Could not start browser instance. Error: ${e}`
			);
			}
		}
  
		this.keptAliveInSeconds = 0;
	
		const page: Page = await this.browser.newPage();

		let headersData = await this.env.BROWSER_KV_DEMO.get<HeaderBatch>(batchKey, { type: "json" });

		if (pathname === "/list" || headersData === null) {
			headersData = await this.captureHeaders(this.browser, url);
			if (pathname !== "/list") {
			  await this.storeInKV(headersData, this.env.BROWSER_KV_DEMO, url);
			}
		}

		this.keptAliveInSeconds = 0;
  
		const currentAlarm = await this.storage.getAlarm();
		if (currentAlarm == null) {
		  console.log(`Browser DO: setting alarm`);
		  const TEN_SECONDS = 10 * 1000;
		  await this.storage.setAlarm(Date.now() + TEN_SECONDS);
		}

		switch (pathname) {
			case "/list":
			  return new Response(JSON.stringify(headersData, null, 2), { headers: JSON_HEADERS });
	  
			case "/counts":
			case "/summary":
			  const numberOfBatches = await this.countKeysContainingUrl(this.env.BROWSER_KV_DEMO, url);
			  await this.processBatches(pathname, numberOfBatches, url, DO_STRING_ID);
	  
			  const doResponse = await fetch(`https://parse-headers.framememories.net/getAll_${pathname.slice(1)}?id_string=${DO_STRING_ID}`);
			  const data = await doResponse.json();
	  
			  if (pathname === "/summary") {
				const message = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
				  prompt: `I want a global summary (max of 250 words) of the following inputs: ${JSON.stringify(data)}`,
				});
				return new Response(JSON.stringify(message, null, 2), { headers: JSON_HEADERS });
			  }
	  
			  fetch(`https://parse-headers.framememories.net/reset_${pathname.slice(1)}?id_string=${DO_STRING_ID}`);
			  return new Response(JSON.stringify(data, null, 2), { headers: JSON_HEADERS });
	  
			case "/servers":
			  return new Response("", { status: 200 });
	  
			default:
			  return new Response("Invalid path. Use /counts?url=example.com, /summary?url=example.com, or /servers?url=example.com", { status: 400 });
		  }
	}
  
	async alarm(): Promise<void> {
	  this.keptAliveInSeconds += 10;
  
	  if (this.keptAliveInSeconds < KEEP_BROWSER_ALIVE_IN_SECONDS) {
		console.log(
		  `Browser DO: has been kept alive for ${this.keptAliveInSeconds} seconds. Extending lifespan.`
		);
		await this.storage.setAlarm(Date.now() + 10 * 1000);
	  } else {
		console.log(
		  `Browser DO: exceeded life of ${KEEP_BROWSER_ALIVE_IN_SECONDS}s.`
		);
		if (this.browser) {
		  console.log(`Closing browser.`);
		  await this.browser.close();
		}
	  }
	}

	async captureHeaders(page: Page, url: string): Promise<HeaderBatch> {
		
		const headersList: HeaderBatch = [];
		page.on('response', (response) => {
		  headersList.push({ assetUrl: response.url(), headers: response.headers() });
		});
	  
		await page.goto(url, { waitUntil: 'networkidle2' });
		await page.setViewport(VIEWPORT);
		await this.autoScroll(page, SCROLL_LIMIT);
		await page.close();
	  
		return headersList;
	}
	  
	async storeInKV(headersList: HeaderBatch, kvNamespace: KVNamespace, url: string): Promise<void> {
		  const batchCount = Math.ceil(headersList.length / BATCH_SIZE);
		
		  for (let i = 0; i < batchCount; i++) {
			const batch = headersList.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
			const key = `${url}_${i + 1}/`;
			await kvNamespace.put(key, JSON.stringify(batch), { expirationTtl: KV_TTL });
		  }
	}

	async  autoScroll(page: puppeteer.Page, maxScrolls: number): Promise<void> {
		await page.evaluate(async (maxScrolls) => {
		  await new Promise<void>((resolve) => {
			let totalHeight = 0;
			const distance = 100;
			let scrolls = 0;
	  
			const timer = setInterval(() => {
			  const scrollHeight = document.body.scrollHeight;
			  window.scrollBy(0, distance);
			  totalHeight += distance;
			  scrolls++;
	  
			  if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls) {
				clearInterval(timer);
				resolve();
			  }
			}, 100);
		  });
		}, maxScrolls);
	}
	
	async  countKeysContainingUrl(kvNamespace: KVNamespace, url: string): Promise<number> {
	let count = 0;
	let cursor: string | undefined;
	
	do {
		const { keys, cursor: newCursor } = await kvNamespace.list({ limit: 1000, cursor });
		count += keys.filter(key => key.name.includes(url)).length;
		cursor = newCursor;
	} while (cursor);
	
	return count;
	}
	
	async  processBatches(pathname: string, numberOfBatches: number, url: string, DO_STRING_ID: string): Promise<void> {
	const fetchPromises = [];
	
	for (let i = 0; i < numberOfBatches; i++) {
		fetchPromises.push(
		fetch(`https://parse-headers.framememories.net${pathname}?key=${url}_${i + 1}&id_string=${DO_STRING_ID}`)
		);
	}
	
	await Promise.all(fetchPromises);
	}

	generateRandomId(): string {
		return Math.random().toString(36).substring(2) + Date.now().toString(36);
	}
		
	formatUrl(domain: string): string {
		return domain.startsWith("http://") || domain.startsWith("https://") ? domain : "https://" + domain;
	}
}


export default {
	async fetch(request: Request, env: Env): Promise<Response> {
	  const id = env.BROWSER_DO.idFromName("browser");
	  const obj = env.BROWSER_DO.get(id);
  
	  // Send a request to the Durable Object, then await its response.
	  const resp = await obj.fetch(request.url);
  
	  return resp;
	},
  };

/*
export default {
  async fetch(request, env): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url);
    const domain = searchParams.get("url");

    if (!domain) {
      return new Response("Please add a path (/counts, /summary or /servers) and a domain (?url=example.com)", { status: 400 });
    }

    const url = formatUrl(domain);
    const batchKey = `${url}_1/`;
    const randomId = generateRandomId();
    const DO_STRING_ID = url + randomId;
    let headersData = await env.BROWSER_KV_DEMO.get<HeaderBatch>(batchKey, { type: "json" });

    if (pathname === "/list" || headersData === null) {
      headersData = await captureHeaders(env.MYBROWSER, url);
      if (pathname !== "/list") {
        await storeInKV(headersData, env.BROWSER_KV_DEMO, url);
      }
    }

    switch (pathname) {
      case "/list":
        return new Response(JSON.stringify(headersData, null, 2), { headers: JSON_HEADERS });

      case "/counts":
      case "/summary":
        const numberOfBatches = await countKeysContainingUrl(env.BROWSER_KV_DEMO, url);
        await processBatches(pathname, numberOfBatches, url, DO_STRING_ID);

        const doResponse = await fetch(`https://parse-headers.framememories.net/getAll_${pathname.slice(1)}?id_string=${DO_STRING_ID}`);
        const data = await doResponse.json();

        if (pathname === "/summary") {
          const message = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            prompt: `I want a global summary (max of 250 words) of the following inputs: ${JSON.stringify(data)}`,
          });
          return new Response(JSON.stringify(message, null, 2), { headers: JSON_HEADERS });
        }

        fetch(`https://parse-headers.framememories.net/reset_${pathname.slice(1)}?id_string=${DO_STRING_ID}`);
        return new Response(JSON.stringify(data, null, 2), { headers: JSON_HEADERS });

      case "/servers":
        return new Response("", { status: 200 });

      default:
        return new Response("Invalid path. Use /counts?url=example.com, /summary?url=example.com, or /servers?url=example.com", { status: 400 });
    }
  },
} satisfies ExportedHandler<Env>;
*/



/* 
#######################
####  HELPER FUNCTIONS
#######################
*/

function generateRandomId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function formatUrl(domain: string): string {
  return domain.startsWith("http://") || domain.startsWith("https://") ? domain : "https://" + domain;
}

async function captureHeaders(browserFetcher: Fetcher, url: string): Promise<HeaderBatch> {
  const browser = await puppeteer.launch(browserFetcher);
  const page = await browser.newPage();
  const headersList: HeaderBatch = [];

  page.on('response', (response) => {
    headersList.push({ assetUrl: response.url(), headers: response.headers() });
  });

  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.setViewport(VIEWPORT);
  await autoScroll(page, SCROLL_LIMIT);
  await browser.close();

  return headersList;
}

async function storeInKV(headersList: HeaderBatch, kvNamespace: KVNamespace, url: string): Promise<void> {
	const batchCount = Math.ceil(headersList.length / BATCH_SIZE);
  
	for (let i = 0; i < batchCount; i++) {
	  const batch = headersList.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
	  const key = `${url}_${i + 1}/`;
	  await kvNamespace.put(key, JSON.stringify(batch), { expirationTtl: KV_TTL });
	}
}

async function autoScroll(page: puppeteer.Page, maxScrolls: number): Promise<void> {
  await page.evaluate(async (maxScrolls) => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      let scrolls = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrolls++;

        if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  }, maxScrolls);
}

async function countKeysContainingUrl(kvNamespace: KVNamespace, url: string): Promise<number> {
  let count = 0;
  let cursor: string | undefined;

  do {
    const { keys, cursor: newCursor } = await kvNamespace.list({ limit: 1000, cursor });
    count += keys.filter(key => key.name.includes(url)).length;
    cursor = newCursor;
  } while (cursor);

  return count;
}

async function processBatches(pathname: string, numberOfBatches: number, url: string, DO_STRING_ID: string): Promise<void> {
  const fetchPromises = [];

  for (let i = 0; i < numberOfBatches; i++) {
    fetchPromises.push(
      fetch(`https://parse-headers.framememories.net${pathname}?key=${url}_${i + 1}&id_string=${DO_STRING_ID}`)
    );
  }

  await Promise.all(fetchPromises);
}
