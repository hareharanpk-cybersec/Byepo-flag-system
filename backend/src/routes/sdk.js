const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Middleware to verify x-api-key
const verifyApiKey = async (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ error: 'Missing x-api-key header' });

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { org: true }
    });

    if (!apiKey) return res.status(401).json({ error: 'Invalid API key' });

    req.orgId = apiKey.orgId;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /sdk/v1/flags
// Evaluates flags for a specific user and environment
router.get('/flags', verifyApiKey, async (req, res) => {
  const { userId, environment = 'prod' } = req.query;

  try {
    const flags = await prisma.featureFlag.findMany({
      where: { orgId: req.orgId }
    });

    const evaluatedFlags = {};

    flags.forEach(flag => {
      let isEnabled = false;

      // 1. Check environment
      if (environment === 'dev') isEnabled = flag.isDev;
      else if (environment === 'staging') isEnabled = flag.isStaging;
      else isEnabled = flag.isProd; // prod is default

      // 2. Check percentage rollout (if enabled in environment and percentage < 100)
      if (isEnabled && flag.rolloutPercentage < 100) {
        if (!userId) {
          // If no userId is provided, percentage rollout fails (or we could default to false)
          isEnabled = false;
        } else {
          // Hash the userId + featureKey to deterministically assign a bucket 0-99
          const hash = crypto.createHash('md5').update(userId + flag.featureKey).digest('hex');
          const bucket = parseInt(hash.substring(0, 8), 16) % 100;
          
          if (bucket >= flag.rolloutPercentage) {
            isEnabled = false;
          }
        }
      }

      evaluatedFlags[flag.featureKey] = isEnabled;
    });

    res.json(evaluatedFlags);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flags' });
  }
});

module.exports = router;
