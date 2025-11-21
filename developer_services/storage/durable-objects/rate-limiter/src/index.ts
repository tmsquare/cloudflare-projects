/*
import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/message", (c) => {
  return c.text("Hello Hono!");
});

export default app;
*/

// Define our environment interface
interface Env {
  RATE_LIMITER: DurableObjectNamespace;
}

// Import Hono and middleware
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { parse } from 'cookie';

// Type definitions for our rate limiter response
interface RateLimiterResult {
  blocked: boolean;
  cooldown?: boolean;
  blockExpiry?: number;
  errorCount?: number;
}

// Client identification utilities
function generateClientId(request: Request): string {
  // Get the session ID from cookie or create a new one
  //const cookieSessionId = getCookie(request, 'session_id');

  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parse(cookieHeader);
  const cookieSessionId = cookies['session_id'];
  
  // Build a simple fingerprint from available data
  const userAgent = request.headers.get('user-agent') || '';
  const cfData = (request as any).cf || {};
  const country = cfData.country || '';
  const browser = cfData.browser || '';
  const clientIp = request.headers.get('CF-Connecting-IP') || '';
  
  // Create a composite identifier (partially from cookie, partially from fingerprinting)
  if (cookieSessionId) {
    // If we have a cookie, primarily use that but append part of the fingerprint
    // This way even if the cookie is stolen, the fingerprint components add security
    return `${cookieSessionId}:${userAgent.slice(0, 20)}:${country}`;
  } else {
    // If no cookie yet, use a fingerprint-based approach to create a temporary ID
    return `fp:${userAgent}:${clientIp}:${country}:${browser}`;
  }
}

// Create our Durable Object for rate limiting
export class RateLimiterDO {
  private state: DurableObjectState;
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime: Map<string, number> = new Map();
  private blockStatus: Map<string, boolean> = new Map();
  private blockExpiry: Map<string, number> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
    // Load stored data
    this.state.blockConcurrencyWhile(async () => {
      const storedErrorCounts = await this.state.storage.get('errorCounts') as Map<string, number>;
      const storedLastErrorTime = await this.state.storage.get('lastErrorTime') as Map<string, number>;
      const storedBlockStatus = await this.state.storage.get('blockStatus') as Map<string, boolean>;
      const storedBlockExpiry = await this.state.storage.get('blockExpiry') as Map<string, number>;
      
      if (storedErrorCounts) this.errorCounts = storedErrorCounts;
      if (storedLastErrorTime) this.lastErrorTime = storedLastErrorTime;
      if (storedBlockStatus) this.blockStatus = storedBlockStatus;
      if (storedBlockExpiry) this.blockExpiry = storedBlockExpiry;
    });
  }

  // Clean up expired records
  private cleanupExpiredRecords(): void {
    const now = Date.now();
    
    // Clean up expired blocks
    for (const [clientId, expiry] of this.blockExpiry.entries()) {
      if (expiry < now) {
        this.blockStatus.delete(clientId);
        this.blockExpiry.delete(clientId);
      }
    }
    
    // Clean up expired error counts (reset after 60 seconds)
    for (const [clientId, time] of this.lastErrorTime.entries()) {
      if (now - time > 60000) { // 60 seconds
        this.errorCounts.delete(clientId);
        this.lastErrorTime.delete(clientId);
      }
    }
  }

  // Save state to storage
  private async saveState(): Promise<void> {
    await this.state.storage.put('errorCounts', this.errorCounts);
    await this.state.storage.put('lastErrorTime', this.lastErrorTime);
    await this.state.storage.put('blockStatus', this.blockStatus);
    await this.state.storage.put('blockExpiry', this.blockExpiry);
  }

  // Handle rate limiting logic
  async handle(request: Request): Promise<Response> {
    // Parse the request data
    const data = await request.json<{
      clientId: string;
      hadError: boolean;
      method: string;
      path: string;
    }>();
    
    // Clean up expired blocks and counts
    this.cleanupExpiredRecords();
    
    const { clientId, hadError } = data;
    const now = Date.now();
    
    // Check if client is blocked
    if (this.blockStatus.get(clientId)) {
      const expiry = this.blockExpiry.get(clientId) || 0;
      return new Response(JSON.stringify({
        blocked: true,
        blockExpiry: expiry,
        cooldown: false
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If request had an error, update tracking
    if (hadError) {
      // Get current error count or initialize to 0
      const currentCount = this.errorCounts.get(clientId) || 0;
      const newCount = currentCount + 1;
      
      // Update error tracking
      this.errorCounts.set(clientId, newCount);
      this.lastErrorTime.set(clientId, now);
      
      // Progressive rate limiting strategy
      if (newCount >= 10) {
        // Severe: Block for 30 minutes
        this.blockStatus.set(clientId, true);
        this.blockExpiry.set(clientId, now + 30 * 60 * 1000);
        await this.saveState();
        return new Response(JSON.stringify({
          blocked: true,
          blockExpiry: now + 30 * 60 * 1000,
          cooldown: false,
          errorCount: newCount
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (newCount >= 5) {
        // Moderate: Block for 5 minutes
        this.blockStatus.set(clientId, true);
        this.blockExpiry.set(clientId, now + 5 * 60 * 1000);
        await this.saveState();
        return new Response(JSON.stringify({
          blocked: true,
          blockExpiry: now + 5 * 60 * 1000,
          cooldown: false,
          errorCount: newCount
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (newCount >= 3) {
        // Light: Add a cooldown of 10 seconds but don't block
        await this.saveState();
        return new Response(JSON.stringify({
          blocked: false,
          cooldown: true,
          blockExpiry: now + 10 * 1000,
          errorCount: newCount
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Save state changes
      await this.saveState();
    }
    
    // Client is not blocked and hasn't reached thresholds
    return new Response(JSON.stringify({
      blocked: false,
      cooldown: false,
      errorCount: this.errorCounts.get(clientId) || 0
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create our Hono app
const app = new Hono<{ Bindings: Env }>();

// Middleware to check rate limits
async function rateLimiterMiddleware(c: any, next: () => Promise<void>) {
  const request = c.req.raw;
  const env = c.env;
  const url = new URL(request.url);
  
  // Only apply rate limiting to sensitive endpoints
  if (request.method === "POST" && (
      url.pathname === "/panier" || 
      url.pathname === "/checkout" || 
      url.pathname.startsWith("/api/")
    )) {
    
    // Generate a client identifier
    const clientId = generateClientId(request);
    
    // Get a stub for the rate limiter DO
    const id = env.RATE_LIMITER.idFromName(clientId);
    const rateLimiterObj = env.RATE_LIMITER.get(id);
    
    // Check if the client is allowed to proceed
    const rateLimiterRequest = new Request("https://rate-limiter.internal/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        hadError: false, // We'll check this later after processing
        method: request.method,
        path: url.pathname
      })
    });
    
    const rateLimiterResponse = await rateLimiterObj.fetch(rateLimiterRequest);
    const rateLimiterResult: RateLimiterResult = await rateLimiterResponse.json();
    
    // If the client is blocked, return a 403
    if (rateLimiterResult.blocked) {
      const remainingSeconds = Math.ceil((rateLimiterResult.blockExpiry! - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          error: "Too many errors. Please try again later.",
          retryAfter: remainingSeconds
        }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": remainingSeconds.toString()
          }
        }
      );
    }
    
    // If the client is in cooldown, add a small delay
    if (rateLimiterResult.cooldown) {
      // Simulate a slight delay for clients that are making too many errors
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Add or update the session cookie for better tracking
    if (!getCookie(request, 'session_id')) {
      const sessionId = crypto.randomUUID();
      c.header('Set-Cookie', `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
    }
    
    // Let the request proceed
    await next();
    
    // Check if the response indicates an error
    if (c.res.status === 400) {
      // Update the rate limiter with the error
      const updateRequest = new Request("https://rate-limiter.internal/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          hadError: true,
          method: request.method,
          path: url.pathname
        })
      });
      
      const updateResponse = await rateLimiterObj.fetch(updateRequest);
      const updateResult: RateLimiterResult = await updateResponse.json();
      
      // If this error caused a block, update the response accordingly
      if (updateResult.blocked) {
        const remainingSeconds = Math.ceil((updateResult.blockExpiry! - Date.now()) / 1000);
        return new Response(
          JSON.stringify({
            error: "Too many errors. You have been temporarily blocked.",
            retryAfter: remainingSeconds
          }), {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": remainingSeconds.toString()
            }
          }
        );
      }
    }
    
    return c.res;
  }
  
  // For non-rate-limited endpoints, just proceed
  await next();
}

// Apply the middleware globally
app.use('*', rateLimiterMiddleware);

// Specify the routes that need protection
app.post('/panier', async (c) => {
  // Forward the request to the origin
  try {
    const originResponse = await fetch(c.req.raw);
    // Return the origin's response
    return new Response(originResponse.body, {
      status: originResponse.status,
      headers: originResponse.headers
    });
  } catch (error) {
    // Handle any errors
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

// Worker entry point
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  }
};

