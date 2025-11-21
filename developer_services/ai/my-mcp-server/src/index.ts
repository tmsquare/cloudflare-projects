import { Hono } from 'hono';
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Each MCP connection is stateful
// Backed by a Durable Object
type State = { counter: number };

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env, State> {
	server = new McpServer({
		name: "MCP Server Demo",
		version: "1.0.0",
	});

	initialState: State = {
		counter: 1,
	};

	async init() {

		// -----------------------------------------------------------------------
		// ---------------------- Simple addition tool  --------------------------
		// -----------------------------------------------------------------------
		this.server.tool(
			"add",
			"Adds two numbers.",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			}),
		);

		
		// -----------------------------------------------------------------------
		// -------------- Calculator tool with multiple operations ---------------
		// -----------------------------------------------------------------------
		this.server.tool(
			"calculate",
			"Perform calculations between two numbers.",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);

		// -----------------------------------------------------------------------
		// ---------------------------- Calling APIs -----------------------------
		// -----------------------------------------------------------------------
		this.server.tool(
			"get_weather",
			"Fetch current weather information for a given location (latitude and longitude).",
			{
				lat: z.number().describe("Latitude of the location."),
				lon: z.number().describe("Longitude of the location."),
			},
			async ({ lat, lon }) => {
				const apiKey = this.env.OPEN_WEATHER_API_TOKEN;
				const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

				const response = await fetch(url);
				const data = await response.json();

				return {
					content: [{ type: "text", text: JSON.stringify(data) }],
				};
			},
		);

		this.server.tool(
			"get_filtered_subdomains",
			"Fetch and filter subdomains for a given domain using SecurityTrails API. Filters by keywords: 'secure', 'vpn', 'access', 'remote', 'api'.",
			{
				domain: z.string().describe("The root domain to fetch subdomains for, e.g. example.com"),
			},
			async ({ domain }) => {
				const cleanedDomain = domain.trim().toLowerCase();
				const keywords = ["secure", "vpn", "access", "remote", "api"];
				const apiKey = this.env.SECURITYTRAILS_API_KEY;
				const BASE_URL = `https://api.securitytrails.com/v1/domain/${cleanedDomain}/subdomains`;

				const params = new URLSearchParams({ children_only: "false" });

				
				type SecurityTrailsResponse = {
					subdomains: string[];
				};

				const response = await fetch(`${BASE_URL}?${params}`, {
				method: "GET",
				headers: {
					accept: "application/json",
					apikey: apiKey,
					"User-Agent": "SecurityTrails-Client/1.0",
				},
				});

				if (!response.ok) {
				return {
					content: [
					{
						type: "text",
						text: `Failed to fetch subdomains: ${response.status} ${response.statusText}`,
					},
					],
				};
				}

				const data = (await response.json()) as SecurityTrailsResponse;

				if (!data || !Array.isArray(data.subdomains)) {
				return {
					content: [
					{
						type: "text",
						text: "No subdomains found or unexpected response structure.",
					},
					],
				};
				}

				const filtered = data.subdomains.filter((sub: string) =>
				keywords.some((keyword) => sub.toLowerCase().includes(keyword))
				);

				return {
				content: [
					{
					type: "text",
					text: `Filtered subdomains for "${domain}":\n\n` +
						(filtered.length > 0
						? filtered.map((s) => `- ${s}.${cleanedDomain}`).join("\n")
						: "No matching subdomains found."),
					},
				],
				};
			}
		);

		this.server.tool(
			"get_all_subdomains",
			"Fetch and filter subdomains for a given domain using SecurityTrails API. Filters by keywords: 'secure', 'vpn', 'access', 'remote', 'api'.",
			{
				domain: z.string().describe("The root domain to fetch subdomains for, e.g. example.com"),
			},
			async ({ domain }) => {
				const cleanedDomain = domain.trim().toLowerCase();
				const apiKey = this.env.SECURITYTRAILS_API_KEY;
				const BASE_URL = `https://api.securitytrails.com/v1/domain/${cleanedDomain}/subdomains`;

				const params = new URLSearchParams({ children_only: "false" });

				
				type SecurityTrailsResponse = {
					subdomains: string[];
				};

				const response = await fetch(`${BASE_URL}?${params}`, {
				method: "GET",
				headers: {
					accept: "application/json",
					apikey: apiKey,
					"User-Agent": "SecurityTrails-Client/1.0",
				},
				});

				if (!response.ok) {
				return {
					content: [
					{
						type: "text",
						text: `Failed to fetch subdomains: ${response.status} ${response.statusText}`,
					},
					],
				};
				}

				const data = (await response.json()) as SecurityTrailsResponse;

				if (!data || !Array.isArray(data.subdomains)) {
				return {
					content: [
					{
						type: "text",
						text: "No subdomains found or unexpected response structure.",
					},
					],
				};
				}

				return {
				content: [
					{
					type: "text",
					text: `Filtered subdomains for "${domain}":\n\n` +
						(data.subdomains.length > 0
						? data.subdomains.map((s) => `- ${s}.${cleanedDomain}`).join("\n")
						: "No matching subdomains found."),
					},
				],
				};
			}
		);

		/*
		this.server.tool(
			"get_dns_map_with_ip_info",
			"Get A, CNAME, MX, and NS records for subdomains, including IP ownership for A records",
			{
				subdomains: z.array(z.string()).describe("List of subdomains to resolve"),
			},
			async ({ subdomains }) => {
				const recordTypes = ["A", "CNAME", "MX", "NS"];

				const fetchDNS = async (subdomain: string, type: string) => {
				try {
					const res = await fetch(`https://1.1.1.1/dns-query?name=${subdomain}&type=${type}`, {
					headers: {
						accept: "application/dns-json",
					},
					});
					const json = (await res.json()) as {
					Answer?: { name: string; type: number; TTL: number; data: string }[];
					};
					return json.Answer || [];
				} catch (e) {
					return [];
				}
				};

				const fetchIPInfo = async (ip: string) => {
				try {
					const res = await fetch(`https://ipinfo.io/${ip}/json`);
					const json = (await res.json()) as {
					org?: string;
					asn?: { name?: string };
					};
					return json.org || json.asn?.name || "Unknown";
				} catch {
					return "Unknown";
				}
				};

				const dnsMap: Record<
				string,
				{
					A: { ip: string; owner: string }[];
					CNAME: string[];
					MX: string[];
					NS: string[];
				}
				> = {};

				for (const sub of subdomains) {
				dnsMap[sub] = { A: [], CNAME: [], MX: [], NS: [] };

				for (const type of recordTypes) {
					const answers = await fetchDNS(sub, type);

					if (type === "A") {
					for (const ans of answers) {
						const ip = ans.data;
						const owner = await fetchIPInfo(ip);
						dnsMap[sub].A.push({ ip, owner });
					}
					} else {
					dnsMap[sub][type as "CNAME" | "MX" | "NS"] = answers.map((a) => a.data);
					}
				}
				}

				return {
				content: [
					{
					type: "text",
					text: JSON.stringify(dnsMap, null, 2),
					},
				],
				};

			}
		);
		*/

		this.server.tool(
			"get_dns_map_with_ip_info",
			"Fetch DNS map (A, CNAME, MX, NS) for a list of subdomains and return WHOIS owner of the A record IPs using an external API.",
			{
				subdomains: z.array(z.string()).describe("List of subdomains to inspect."),
			},
			async ({ subdomains }) => {
				const fetch = require("node-fetch");

				const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
				const dnsURL = "https://1.1.1.1/dns-query";
				const headers = { accept: "application/dns-json" };
				const apiKey = this.env.WHOIS_API_KEY;

				const dnsMap: Record<
				string,
				{
					A: { ip: string; owner: string }[];
					CNAME: string[];
					MX: string[];
					NS: string[];
				}
				> = {};

				const uniqueIps = new Set<string>();

				// Step 1: DNS Queries
				for (const sub of subdomains) {
				const A: string[] = [];
				const CNAME: string[] = [];
				const MX: string[] = [];
				const NS: string[] = [];

				for (const type of ["A", "CNAME", "MX", "NS"]) {
					const url = `${dnsURL}?name=${sub}&type=${type}`;
					try {
					const res = await fetch(url, { headers });
					const json = await res.json();
					if (json.Answer) {
						json.Answer.forEach((ans: any) => {
						if (type === "A") A.push(ans.data);
						else if (type === "CNAME") CNAME.push(ans.data);
						else if (type === "MX") MX.push(ans.data);
						else if (type === "NS") NS.push(ans.data);
						});
					}
					} catch (err) {
					console.error(`DNS fetch error for ${type} on ${sub}:`, err);
					}
				}

				A.forEach((ip) => uniqueIps.add(ip));

				dnsMap[sub] = {
					A: A.map((ip) => ({ ip, owner: "" })), // placeholder
					CNAME,
					MX,
					NS,
				};
				}

				// Step 2: WHOIS API Lookup for IPs
				const ipOwnerMap: Record<string, string> = {};

				for (const ip of uniqueIps) {
				const whoisURL = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&ip=${ip}&outputFormat=JSON`;
				try {
					const res = await fetch(whoisURL);
					const data = await res.json();
					const owner = data.WhoisRecord?.registryData?.orgName ||
								data.WhoisRecord?.registryData?.registrant?.organization ||
								data.WhoisRecord?.registryData?.netname ||
								"Unknown";
					ipOwnerMap[ip] = owner;
					await sleep(1000); // Rate limiting: 1 second between requests
				} catch (err) {
					console.error(`WHOIS API error for ${ip}:`, err);
					ipOwnerMap[ip] = "Unknown";
				}
				}

				// Step 3: Fill in owners
				for (const sub of Object.keys(dnsMap)) {
				dnsMap[sub].A = dnsMap[sub].A.map(({ ip }) => ({
					ip,
					owner: ipOwnerMap[ip] || "Unknown",
				}));
				}

				return {
				content: [
					{
					type: "text",
					text: JSON.stringify(dnsMap, null, 2),
					},
				],
				};
			}
		);

		// -----------------------------------------------------------------------
		// ------------------------------- Counter -------------------------------
		// -----------------------------------------------------------------------

		// Simple resource: counter
		this.server.resource(`counter`, `mcp://resource/counter`, (uri) => {
			return {
				contents: [{ uri: uri.href, text: String(this.state.counter) }],
			};
		});

		// Tool to increment the counter
		this.server.tool(
			"increment",
			"Increment the counter, stored in the MCP",
			{ a: z.number() },
			async ({ a }) => {
				this.setState({ ...this.state, counter: this.state.counter + a });

				return {
					content: [
						{
							type: "text",
							text: String(`Added ${a}, total is now ${this.state.counter}`),
						},
					],
				};
			},
		);

		// -----------------------------------------------------------------------
		// --------------------------- Using Bindings ----------------------------
		// -----------------------------------------------------------------------
		this.server.tool(
			"generate_image",
			"Generate an image using the `flux-1-schnell` model. Works best with 8 steps.",
			{
				prompt: z
					.string()
					.describe("A text description of the image you want to generate."),
				steps: z
					.number()
					.min(4)
					.max(8)
					.default(4)
					.describe(
						"The number of diffusion steps; higher values can improve quality but take longer. Must be between 4 and 8, inclusive.",
					),
			},
			async ({ prompt, steps }) => {
				const response = await this.env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
					prompt,
					steps,
				});

				return {
					content: [{ type: "image", data: response.image!, mimeType: "image/jpeg" }],
				};
			},
		);
	}
}


export interface Env {
	AI: Ai;
	OPEN_WEATHER_API_TOKEN: string;
	SECURITYTRAILS_API_KEY: string;
	WHOIS_API_KEY: string;
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// SSE routes
app.get('/sse', (c) => {
	return MyMCP.serveSSE("/sse").fetch(c.req.raw, c.env, c.executionCtx);
});

app.post('/sse/message', (c) => {
	return MyMCP.serveSSE("/sse").fetch(c.req.raw, c.env, c.executionCtx);
});

// MCP route
app.all('/mcp', (c) => {
	return MyMCP.serve("/mcp").fetch(c.req.raw, c.env, c.executionCtx);
});

// Health check route
app.get('/', (c) => {
	return c.json({ 
		message: "MCP Server is running",
		version: "1.0.0",
		endpoints: ["/mcp", "/sse", "/sse/message"]
	});
});

// 404 handler
app.notFound((c) => {
	return c.text('Not found', 404);
});

export default app;