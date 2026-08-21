/**
 * MINIMAL Vercel serverless entry point for testing.
 * This file contains NO external imports — just inline Express setup.
 * If this works on Vercel, the issue is with server.ts imports.
 */

import type { Express, Request, Response } from 'express';

let cachedApp: Express | null = null;

async function getApp(): Promise<Express> {
  if (cachedApp) return cachedApp;

  const express = (await import('express')).default;
  const app: Express = express();
  app.use(express.json({ limit: '15mb' }));

  // Minimal health endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'PlayBeat Digital API Engine (minimal)',
      version: '2.4.0-minimal',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Minimal login endpoint — hardcoded admin fallback only
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    // Hardcoded admin fallback — always works
    if (email.trim().toLowerCase() === 'admin@playbeat.digital' && password === 'playbeat1122') {
      return res.json({
        success: true,
        user: {
          id: 'usr-admin-default',
          name: 'PlayBeat Super Admin',
          email: 'admin@playbeat.digital',
          role: 'super_admin',
          twoFactorEnabled: false,
          addresses: [],
          totalSpent: 0,
          ordersCount: 0,
          wishlist: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
        token: 'pb_hardcoded_' + Date.now(),
      });
    }
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  });

  cachedApp = app;
  return app;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
