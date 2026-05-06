const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, requireRole, requireActiveOrg } = require('../middleware/auth');
const crypto = require('crypto');

/**
 * Helper: resolve actor string from JWT payload for audit logging.
 */
async function resolveActor(user) {
  if (user.userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { username: true, email: true },
      });
      if (dbUser) return dbUser.username || dbUser.email;
    } catch (_) {
      // fallback
    }
    return user.userId;
  }
  return 'SUPER_ADMIN';
}

router.use(verifyToken);
router.use(requireRole('ORG_ADMIN'));

// Get API keys
router.get('/', async (req, res) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { orgId: req.user.orgId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(keys);
  } catch (err) {
    console.error('[GET /api-keys]', err);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create API key
router.post('/', requireActiveOrg, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const key = `byepo_${crypto.randomBytes(32).toString('hex')}`;
    const newKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        orgId: req.user.orgId
      }
    });

    const actor = await resolveActor(req.user);
    await prisma.auditLog.create({
      data: {
        orgId: req.user.orgId,
        action: 'API_KEY_CREATED',
        actor,
        target: name
      }
    });

    res.json(newKey);
  } catch (err) {
    console.error('[POST /api-keys]', err);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Revoke API key
router.delete('/:id', requireActiveOrg, async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = await prisma.apiKey.findFirst({
      where: { id, orgId: req.user.orgId }
    });

    if (!apiKey) return res.status(404).json({ error: 'API key not found' });

    await prisma.apiKey.delete({ where: { id } });

    const actor = await resolveActor(req.user);
    await prisma.auditLog.create({
      data: {
        orgId: req.user.orgId,
        action: 'API_KEY_REVOKED',
        actor,
        target: apiKey.name
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api-keys]', err);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

module.exports = router;
