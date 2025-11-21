import { routeAgentRequest, type Schedule } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";

import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";


// Cloudflare AI Gateway
//const openai = createOpenAI({
//   apiKey: env.OPENAI_API_KEY,
//   baseURL: env.GATEWAY_BASE_URL,
//});

import { openai } from "@ai-sdk/openai";
const model = openai("gpt-4o-2024-11-20");

// Create a Workers AI instance
//import { createWorkersAI } from 'workers-ai-provider';
//import { env } from "cloudflare:workers";
//const workersai = createWorkersAI({ binding: env.AI });
//const model = workersai("@cf/meta/llama-4-scout-17b-16e-instruct")


/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Collect all tools, including MCP tools
    const allTools = {
      ...tools,
      ...this.mcp.getAITools(),
    };

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions
        });

        // Build system prompt
        const systemPrompt = `You are a helpful travel assistant that helps users plan holidays and trips.

**Important Instructions:**

1. When users ask about travel/hotels, use the getDatafromPerfectStay tool
2. Extract all relevant information from user's message:
   - Destination (city, country, region)
   - Price budget (min/max)
   - Hotel features/amenities (spa, pool, beach, etc.)
   - Star rating preferences
   - Flight inclusion needs
3. Be smart about interpreting user requests:
   - "aqua park" or "water park" → add as tag
   - Budget mentioned → use minPrice/maxPrice
   - Location mentioned → use destination parameter
4. IMPORTANT: Don't be too restrictive - if user asks about "aqua park holidays" but doesn't specify location, search WITHOUT destination filter to get results

**Response Format - IMPORTANT:**
When the getDatafromPerfectStay tool returns results:
2. present the full JSON results in a code block like this:

\`\`\`json
{
  "products": [/* product data */]
}
\`\`\`

3. The JSON will be automatically rendered as beautiful product cards with:
   - Hotel images and names
   - Prominent pricing (€XXX)
   - Tags and amenities badges
   - Star ratings and reviews
   - Direct booking links

4. DO NOT manually list hotels or describe each one
5. DO NOT mention dates or duration - focus on price and amenities
6. Keep your intro brief and let the visual cards do the talking

**Example response:**
"[AI Summary from tool]

Voici les meilleures offres que j'ai trouvées pour vous:

\`\`\`json
{JSON data here}
\`\`\`
"

Keep responses brief and natural.`;

        const result = streamText({
          system: systemPrompt,
          messages: convertToModelMessages(processedMessages),
          model,
          tools: allTools,
          // Type boundary: streamText expects specific tool types, but base class uses ToolSet
          // This is safe because our tools satisfy ToolSet interface (verified by 'satisfies' in tools.ts)
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10)
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`
          }
        ],
        metadata: {
          createdAt: new Date()
        }
      }
    ]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/check-open-ai-key") {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      return Response.json({
        success: hasOpenAIKey
      });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "OPENAI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
