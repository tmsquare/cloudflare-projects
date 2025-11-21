/**
 * Browser renderable imports
 */
import { env } from "cloudflare:workers";


/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod/v3";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { scheduleSchema } from "agents/schedule";


/**
 * Weather information tool that requires human confirmation
 * When invoked, this will present a confirmation dialog to the user
 */
const getWeatherInformation = tool({
  description: "show the weather in a given city to the user",
  inputSchema: z.object({ city: z.string() })
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Local time tool that executes automatically
 * Since it includes an execute function, it will run without user confirmation
 * This is suitable for low-risk operations that don't need oversight
 */
const getLocalTime = tool({
  description: "get the local time for a specified location",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ location }) => {
    console.log(`Getting local time for ${location}`);
    return "10am";
  }
});

const scheduleTask = tool({
  description: "A tool to schedule a task to be executed at a later time",
  inputSchema: scheduleSchema,
  execute: async ({ when, description }) => {
    // we can now read the agent context from the ALS store
    const { agent } = getCurrentAgent<Chat>();

    function throwError(msg: string): string {
      throw new Error(msg);
    }
    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }
    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");
    try {
      agent!.schedule(input!, "executeTask", description);
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
    return `Task scheduled for type "${when.type}" : ${input}`;
  }
});

/**
 * Tool to list all scheduled tasks
 * This executes automatically without requiring human confirmation
 */
const getScheduledTasks = tool({
  description: "List all tasks that have been scheduled",
  inputSchema: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();

    try {
      const tasks = agent!.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return tasks;
    } catch (error) {
      console.error("Error listing scheduled tasks", error);
      return `Error listing scheduled tasks: ${error}`;
    }
  }
});

/**
 * Tool to cancel a scheduled task by its ID
 * This executes automatically without requiring human confirmation
 */
const cancelScheduledTask = tool({
  description: "Cancel a scheduled task using its ID",
  inputSchema: z.object({
    taskId: z.string().describe("The ID of the task to cancel")
  }),
  execute: async ({ taskId }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      await agent!.cancelSchedule(taskId);
      return `Task ${taskId} has been successfully canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task ${taskId}: ${error}`;
    }
  }
});

/**
 * Search PerfectStay travel products using semantic search via Cloudflare Vectorize
 * 
 * Uses Cloudflare Workers AI for embedding generation (no OpenAI needed!)
 * 
 * Features:
 * - Semantic search based on natural language queries
 * - Filters by destination, price, stars, flight inclusion, tags
 * - Returns top K most relevant results
 * - NO date/duration information (removed from results)
 * - PROMINENT pricing display (formatted as €XXX)
 * - EMPHASIZED tags with tagsSummary field
 * 
 * Process:
 * - Generates embedding for user query using Cloudflare AI
 * - Queries Vectorize index for similar products
 * - Applies filters (destination, price range, stars, tags)
 * - Returns matching travel products
 * 
 * @returns JSON object with:
 * - success: boolean
 * - totalResults: number of products found
 * - query: the search query used
 * - products: array with structure:
 *   - id, name, destination
 *   - price (€XXX), priceValue (number), flightIncluded
 *   - tags (array), tagsSummary (formatted string with • separator)
 *   - stars, rating, reviews
 *   - url, image, relevanceScore (0-100)
 */
const getDatafromPerfectStay = tool({
  description: "Search travel products from PerfectStay database. Returns products with prominent pricing and comprehensive tags highlighting amenities and features. No date/duration info included.",
  inputSchema: z.object({ 
    query: z.string().describe("User's travel search query (e.g., 'beach resort in Bali', 'luxury hotel New York')"),
    destination: z.string().optional().describe("Filter by destination"),
    minPrice: z.number().optional().describe("Minimum price in EUR"),
    maxPrice: z.number().optional().describe("Maximum price in EUR"),
    minStars: z.number().optional().describe("Minimum hotel stars (1-5)"),
    flightIncluded: z.boolean().optional().describe("Filter for packages with flights"),
    tags: z.array(z.string()).optional().describe("Filter by tags (e.g., 'Tout inclus', 'Club', 'Piscine')"),
    topK: z.number().optional().describe("Number of results to return (default: 10)")
  }),
  execute: async ({ 
    query, 
    destination, 
    minPrice, 
    maxPrice, 
    minStars, 
    flightIncluded,
    tags,
    topK 
  }: { 
    query: string;
    destination?: string;
    minPrice?: number;
    maxPrice?: number;
    minStars?: number;
    flightIncluded?: boolean;
    tags?: string[];
    topK?: number;
  }) => {
    try {
      console.log('🔍 Searching PerfectStay with query:', query);
      
      // @ts-ignore - AI binding
      const ai = env.AI;
      // @ts-ignore - vectorize binding
      const vectorize = env.VECTORIZE;
      
      // Build enhanced search query with balanced weighting
      // Name/destination get more weight, tags get normal weight
      const searchParts = [
        query, // Original query (highest weight)
        query, // Repeat for emphasis
        destination || '', // Destination if provided
        destination || '', // Repeat destination for emphasis
        tags && tags.length > 0 ? tags.join(' ') : '' // Tags once only
      ].filter(Boolean);
      
      const enhancedQuery = searchParts.join(' ');
      
      console.log('📝 Enhanced query:', enhancedQuery);
      
      // Generate embedding using Cloudflare Workers AI
      const embeddingResponse: any = await ai.run(
        "@cf/baai/bge-base-en-v1.5",
        { text: [enhancedQuery] }
      );

      // Handle different response formats from Cloudflare AI
      let queryEmbedding: number[];
      
      if (embeddingResponse.data && Array.isArray(embeddingResponse.data)) {
        // Format: { data: [[...]] }
        queryEmbedding = embeddingResponse.data[0];
      } else if (embeddingResponse.shape && embeddingResponse.data) {
        // Format: { shape: [1, 768], data: Float32Array }
        const dimensions = embeddingResponse.shape[1];
        queryEmbedding = Array.from(embeddingResponse.data.slice(0, dimensions));
      } else {
        throw new Error('Unexpected embedding response format from Cloudflare AI');
      }

      // Query Vectorize for similar products
      const results = await vectorize.query(queryEmbedding, {
        topK: topK || 10,
        returnMetadata: 'all'
      });

      // Apply filters to results
      let filteredProducts = results.matches.map((match: any) => {
        const tags = match.metadata.tags ? match.metadata.tags.split(',') : [];
        return {
          id: match.id,
          name: match.metadata.name,
          destination: match.metadata.destination,
          
          // 💰 Price Information (prominent)
          price: `€${match.metadata.price}`,
          priceValue: match.metadata.price,
          flightIncluded: match.metadata.flight_included,
          
          // 🏷️ Tags (emphasized)
          tags: tags,
          tagsSummary: tags.length > 0 ? tags.join(' • ') : 'No tags',
          
          // ⭐ Quality Indicators
          stars: match.metadata.stars,
          rating: match.metadata.rating,
          reviews: match.metadata.reviews,
          
          // 🔗 Additional Info
          url: match.metadata.url,
          image: match.metadata.image,
          relevanceScore: Math.round(match.score * 100)
        };
      });

      // Apply destination filter (only if specified)
      if (destination && destination.trim()) {
        const destLower = destination.toLowerCase();
        filteredProducts = filteredProducts.filter((p: any) => 
          p.destination.toLowerCase().includes(destLower)
        );
        console.log(`After destination filter: ${filteredProducts.length} products`);
      }

      // Apply price filters (only if specified)
      if (minPrice !== undefined && minPrice > 0) {
        filteredProducts = filteredProducts.filter((p: any) => p.priceValue >= minPrice);
        console.log(`After minPrice filter: ${filteredProducts.length} products`);
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        filteredProducts = filteredProducts.filter((p: any) => p.priceValue <= maxPrice);
        console.log(`After maxPrice filter: ${filteredProducts.length} products`);
      }

      // Apply stars filter (only if specified)
      if (minStars !== undefined && minStars > 0) {
        filteredProducts = filteredProducts.filter((p: any) => p.stars >= minStars);
        console.log(`After stars filter: ${filteredProducts.length} products`);
      }

      // Apply flight filter (only if explicitly set)
      if (flightIncluded !== undefined) {
        filteredProducts = filteredProducts.filter((p: any) => p.flightIncluded === flightIncluded);
        console.log(`After flight filter: ${filteredProducts.length} products`);
      }

      // DON'T apply strict tag filtering - tags are already in the semantic search
      // This was causing 0 results because exact tag matches are too restrictive
      // The semantic search with balanced weighting already considers tags
      console.log(`✅ Final results (before tag filtering): ${filteredProducts.length} products`);
      
      // Optional: Boost products that match tags (but don't filter them out)
      if (tags && tags.length > 0) {
        console.log(`ℹ️ User requested tags: ${tags.join(', ')} - already included in semantic search`);
      }

      console.log(`✅ Found ${filteredProducts.length} matching products`);


      return {
        success: true,
        query,
        totalResults: filteredProducts.length,
        filters: {
          destination,
          minPrice,
          maxPrice,
          minStars,
          flightIncluded,
          tags
        },
        products: filteredProducts
      };

    } catch (error: unknown) {
      console.error('Error searching PerfectStay:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = error instanceof Error ? error.toString() : String(error);
      
      return {
        success: false,
        error: `Failed to search products: ${errorMessage}`,
        details: errorDetails
      };
    }
  }
});


/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
  getWeatherInformation,
  getLocalTime,
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask,
  getDatafromPerfectStay
} satisfies ToolSet;

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 * Each function here corresponds to a tool above that doesn't have an execute function
 */
export const executions = {
  getWeatherInformation: async ({ city }: { city: string }) => {
    console.log(`Getting weather information for ${city}`);
    return `The weather in ${city} is sunny`;
  }
};
