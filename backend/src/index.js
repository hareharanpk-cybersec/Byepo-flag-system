require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authRouter = require('./routes/auth');
const orgsRouter = require('./routes/organizations');
const flagsRouter = require('./routes/flags');
const usersRouter = require('./routes/users');
const sdkRouter = require('./routes/sdk');
const apiKeysRouter = require('./routes/apiKeys');
const auditRouter = require('./routes/audit');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Rate Limiting on /auth/* ─────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
});

app.use('/auth', authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/organizations', orgsRouter);
app.use('/flags', flagsRouter);
app.use('/users', usersRouter);
app.use('/sdk/v1', sdkRouter);
app.use('/api-keys', apiKeysRouter);
app.use('/audit-logs', auditRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

// ─── Background Deletion Task ────────────────────────────────────────────────
// Runs every hour to permanently delete orgs past their scheduled deletion time
setInterval(async () => {
  try {
    const orgsToDelete = await prisma.organization.findMany({
      where: {
        status: 'PENDING_DELETION',
        deletionScheduledAt: { lte: new Date() },
      },
    });

    for (const org of orgsToDelete) {
      console.log(`[Cleanup] Permanently deleting organization: ${org.name} (${org.id})`);
      // Cascading delete relies on Prisma's relation settings, but we manually delete related models
      // if not configured. Assuming schema has standard relation constraints, we should delete in order:
      await prisma.$transaction([
        prisma.auditLog.deleteMany({ where: { orgId: org.id } }),
        prisma.apiKey.deleteMany({ where: { orgId: org.id } }),
        prisma.featureFlag.deleteMany({ where: { orgId: org.id } }),
        prisma.user.deleteMany({ where: { orgId: org.id } }),
        prisma.organization.delete({ where: { id: org.id } }),
      ]);
      console.log(`[Cleanup] Deleted org ${org.id}`);
    }
  } catch (err) {
    console.error('[Cleanup Error]', err);
  }
}, 60 * 60 * 1000); // 1 hour

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Feature Flag API running on http://localhost:${PORT}`);
});
