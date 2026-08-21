/**
 * Vercel serverless entry point.
 *
 * This file is loaded by Vercel's @vercel/node runtime for every request to
 * /api/*. The Express app (with all routes) is created lazily on first
 * invocation and cached on the module so subsequent requests reuse it
 * (warm starts).
 *
 * Environment variables (MONGODB_URI, JWT_SECRET, etc.) are read from
 * process.env at runtime — they're configured in the Vercel project's
 * Environment Variables settings (NOT in this repo).
 *
 * SECURITY: Never hardcode secrets here. Always read from process.env.
 */

import type { Express } from 'express';

// Cache the app instance across warm invocations to avoid recreating
// it on every request (the in-memory store also survives between
// warm requests on the same serverless instance).
let cachedApp: Express | null = null;

async function getApp(): Promise<Express> {
  if (cachedApp) return cachedApp;

  // Dynamic import so the dotenv/config side-effect only runs when the
  // serverless function is actually invoked (not at module load).
  await import('dotenv/config');
  const { createApiApp } = await import('../server.ts');
  cachedApp = createApiApp();
  return cachedApp;
}

/**
 * Default export — Vercel's @vercel/node runtime calls this for every
 * /api/* request. We forward the request to the Express app.
 */
export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
