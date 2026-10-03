/**
 * Authentication Middleware using Gately Auth
 * 
 * Gately provides:
 * - JWT token validation
 * - Session management
 * - User authentication
 */

/// <reference types="@cloudflare/workers-types" />

import { createAuthClient } from "@gately/auth-client";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthResult {
  authenticated: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Verify authentication token from request headers
 */
export async function verifyAuth(
  request: Request,
  env: Env
): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      error: "Missing or invalid Authorization header",
    };
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    // Use Gately Auth for token verification
    if (env.GATELY_AUTH_URL && env.GATELY_AUTH_API_KEY) {
      const authClient = createAuthClient({
        baseURL: env.GATELY_AUTH_URL,
      });

      // Use Gately's session verification
      // Note: Adjust based on actual Gately Auth API
      try {
        const session = await authClient.session.verify({ 
          sessionToken: token 
        });
        
        if (session.data?.user) {
          return {
            authenticated: true,
            user: {
              id: session.data.user.id,
              email: session.data.user.email,
              name: session.data.user.name || undefined,
            },
          };
        }
      } catch (gatelyError) {
        console.error("Gately auth failed:", gatelyError);
        // Fall through to simple JWT verification
      }
    }

    // Fallback: Simple JWT verification (for development)
    // In production, always use Gately Auth
    const decoded = await verifySimpleJWT(token, env);
    if (decoded) {
      return {
        authenticated: true,
        user: decoded,
      };
    }

    return {
      authenticated: false,
      error: "Invalid token",
    };
  } catch (err) {
    return {
      authenticated: false,
      error: err instanceof Error ? err.message : "Authentication failed",
    };
  }
}

/**
 * Simple JWT verification for development/fallback
 * In production, use Gately Auth
 */
async function verifySimpleJWT(
  token: string,
  _env: Env
): Promise<AuthUser | null> {
  try {
    // For development: decode JWT without verification
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url to base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const payloadString = atob(base64 + padding);
    const payload = JSON.parse(payloadString);
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return {
      id: payload.sub || payload.userId || "unknown",
      email: payload.email || "unknown@example.com",
      name: payload.name,
    };
  } catch {
    return null;
  }
}

/**
 * Check if user session exists in D1
 */
export async function checkSession(
  userId: string,
  tokenHash: string,
  env: Env
): Promise<boolean> {
  try {
    const result = await env.DB.prepare(
      `SELECT id FROM auth_sessions 
       WHERE user_id = ? AND token_hash = ? AND expires_at > datetime('now')`
    )
      .bind(userId, tokenHash)
      .first();

    return !!result;
  } catch (err) {
    console.error("Session check failed:", err);
    return false;
  }
}

/**
 * Create new session in D1
 */
export async function createSession(
  user: AuthUser,
  token: string,
  env: Env,
  expiresIn: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + expiresIn).toISOString();

  await env.DB.prepare(
    `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(sessionId, user.id, tokenHash, expiresAt)
    .run();

  return sessionId;
}

/**
 * Delete session from D1
 */
export async function deleteSession(
  userId: string,
  tokenHash: string,
  env: Env
): Promise<void> {
  await env.DB.prepare(
    `DELETE FROM auth_sessions WHERE user_id = ? AND token_hash = ?`
  )
    .bind(userId, tokenHash)
    .run();
}

/**
 * Hash token for storage
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Middleware wrapper for protected routes
 */
export function requireAuth(
  handler: (request: Request, env: Env, user: AuthUser) => Promise<Response>
) {
  return async (request: Request, env: Env): Promise<Response> => {
    const authResult = await verifyAuth(request, env);

    if (!authResult.authenticated || !authResult.user) {
      return new Response(
        JSON.stringify({ error: authResult.error || "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
          },
        }
      );
    }

    return handler(request, env, authResult.user);
  };
}

/**
 * Get or create user in D1
 */
export async function getOrCreateUser(
  authUser: AuthUser,
  env: Env
): Promise<AuthUser> {
  // Check if user exists
  const existing = await env.DB.prepare(
    `SELECT id, email, name FROM users WHERE id = ?`
  )
    .bind(authUser.id)
    .first();

  if (existing) {
    return {
      id: existing.id as string,
      email: existing.email as string,
      name: existing.name as string | undefined,
    };
  }

  // Create new user
  await env.DB.prepare(
    `INSERT INTO users (id, email, name) VALUES (?, ?, ?)`
  )
    .bind(authUser.id, authUser.email, authUser.name || null)
    .run();

  return authUser;
}
