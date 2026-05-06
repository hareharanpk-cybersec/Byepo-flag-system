const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const { verifyToken, requireRole, requireActiveOrg } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

/**
 * Helper: resolve actor string from JWT payload for audit logging.
 * Falls back to userId if username/email aren't available in the token.
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

// ─── GET /flags ───────────────────────────────────────────────────────────────
// Returns all flags for the authenticated ORG_ADMIN's organization.
router.get('/', verifyToken, requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const flags = await prisma.featureFlag.findMany({
      where: { orgId: req.user.orgId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(flags);
  } catch (err) {
    console.error('[GET /flags]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /flags ──────────────────────────────────────────────────────────────
// Creates a new feature flag for the authenticated ORG_ADMIN's organization.
router.post(
  '/',
  verifyToken,
  requireRole('ORG_ADMIN'),
  requireActiveOrg,
  [
    body('featureKey')
      .trim()
      .toLowerCase()
      .notEmpty()
      .withMessage('featureKey is required.')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('featureKey may only contain letters, numbers, underscores, and hyphens.'),
  ],
  validate,
  async (req, res) => {
    try {
      const featureKey = req.body.featureKey.toLowerCase().trim();
      const orgId = req.user.orgId;

      const flag = await prisma.featureFlag.create({
        data: { featureKey, orgId },
      });

      const actor = await resolveActor(req.user);
      await prisma.auditLog.create({
        data: {
          orgId,
          action: 'FLAG_CREATED',
          actor,
          target: featureKey
        }
      });

      return res.status(201).json(flag);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Feature key already exists for this organization.' });
      }
      console.error('[POST /flags]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─── PATCH /flags/:id ─────────────────────────────────────────────────────────
router.patch(
  '/:id',
  verifyToken,
  requireRole('ORG_ADMIN'),
  requireActiveOrg,
  [param('id').isUUID().withMessage('Flag ID must be a valid UUID.')],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isDev, isStaging, isProd, rolloutPercentage } = req.body;

      const flag = await prisma.featureFlag.findUnique({ where: { id } });
      if (!flag) {
        return res.status(404).json({ error: 'Feature flag not found.' });
      }

      if (flag.orgId !== req.user.orgId) {
        return res.status(403).json({ error: 'You do not have permission to modify this flag.' });
      }

      const updateData = {};
      if (typeof isDev === 'boolean') updateData.isDev = isDev;
      if (typeof isStaging === 'boolean') updateData.isStaging = isStaging;
      if (typeof isProd === 'boolean') updateData.isProd = isProd;
      if (typeof rolloutPercentage === 'number') updateData.rolloutPercentage = rolloutPercentage;

      const updated = await prisma.featureFlag.update({
        where: { id },
        data: updateData,
      });

      const actor = await resolveActor(req.user);
      await prisma.auditLog.create({
        data: {
          orgId: req.user.orgId,
          action: 'FLAG_UPDATED',
          actor,
          target: flag.featureKey
        }
      });

      return res.json(updated);
    } catch (err) {
      console.error('[PATCH /flags/:id]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─── DELETE /flags/:id ────────────────────────────────────────────────────────
router.delete(
  '/:id',
  verifyToken,
  requireRole('ORG_ADMIN'),
  requireActiveOrg,
  [param('id').isUUID().withMessage('Flag ID must be a valid UUID.')],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const flag = await prisma.featureFlag.findUnique({ where: { id } });
      if (!flag) {
        return res.status(404).json({ error: 'Feature flag not found.' });
      }

      if (flag.orgId !== req.user.orgId) {
        return res.status(403).json({ error: 'You do not have permission to delete this flag.' });
      }

      await prisma.featureFlag.delete({ where: { id } });

      const actor = await resolveActor(req.user);
      await prisma.auditLog.create({
        data: {
          orgId: req.user.orgId,
          action: 'FLAG_DELETED',
          actor,
          target: flag.featureKey
        }
      });

      return res.json({ message: 'Feature flag deleted successfully.' });
    } catch (err) {
      console.error('[DELETE /flags/:id]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─── POST /flags/check ────────────────────────────────────────────────────────
// Checks if a feature flag is enabled for the authenticated user's org.
const crypto = require('crypto');
router.post(
  '/check',
  verifyToken,
  [
    body('featureKey')
      .trim()
      .notEmpty()
      .withMessage('featureKey is required.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { featureKey, environment = 'prod' } = req.body;
      const orgId = req.user.orgId;
      const userId = req.user.userId;

      const flag = await prisma.featureFlag.findUnique({
        where: { featureKey_orgId: { featureKey, orgId } },
      });

      if (!flag) {
        return res.json({ featureKey, enabled: false });
      }

      let isEnabled = false;
      if (environment === 'dev') isEnabled = flag.isDev;
      else if (environment === 'staging') isEnabled = flag.isStaging;
      else isEnabled = flag.isProd;

      if (isEnabled && flag.rolloutPercentage < 100) {
        const hash = crypto.createHash('md5').update(userId + flag.featureKey).digest('hex');
        const bucket = parseInt(hash.substring(0, 8), 16) % 100;
        if (bucket >= flag.rolloutPercentage) {
          isEnabled = false;
        }
      }

      return res.json({
        featureKey,
        enabled: isEnabled,
      });
    } catch (err) {
      console.error('[POST /flags/check]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
