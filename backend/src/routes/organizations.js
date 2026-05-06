const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const { verifyToken, requireSuperAdmin, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

// ─── ORG ADMIN ROUTES ─────────────────────────────────────────────────────────
router.get('/me', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.orgId },
      include: {
        _count: { select: { users: true, flags: true } },
      },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });
    return res.json(org);
  } catch (err) {
    console.error('[GET /organizations/me]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/export', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const [org, flags, users, apiKeys, auditLogs] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.featureFlag.findMany({ where: { orgId } }),
      prisma.user.findMany({ where: { orgId }, select: { id: true, username: true, email: true, role: true, createdAt: true } }),
      prisma.apiKey.findMany({ where: { orgId }, select: { id: true, name: true, key: true, createdAt: true } }),
      prisma.auditLog.findMany({ where: { orgId }, orderBy: { timestamp: 'desc' } })
    ]);

    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const exportData = {
      exportedAt: new Date().toISOString(),
      organization: org,
      flags,
      users,
      apiKeys,
      auditLogs,
    };

    res.setHeader('Content-disposition', `attachment; filename=byepo-export-${org.name.replace(/\s+/g, '-').toLowerCase()}.json`);
    res.setHeader('Content-type', 'application/json');
    return res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error('[GET /organizations/export]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── SUPER ADMIN ROUTES ───────────────────────────────────────────────────────
router.use(requireSuperAdmin);

const bcrypt = require('bcrypt');

// ─── POST /organizations ──────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Organization name is required.')
      .isString()
      .withMessage('Organization name must be a string.'),
    body('adminEmail').isEmail().normalizeEmail().withMessage('Valid admin email required.'),
    body('adminUsername').trim().notEmpty().withMessage('Admin username is required.'),
    body('adminPassword')
      .trim()
      .isLength({ min: 8 })
      .withMessage('Admin password must be at least 8 characters.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, adminEmail, adminUsername, adminPassword } = req.body;

      const hashed = await bcrypt.hash(adminPassword, 12);

      const result = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({ data: { name } });
        
        // Ensure email isn't already taken across the entire system
        const existingUser = await tx.user.findUnique({ where: { email: adminEmail } });
        if (existingUser) {
          throw new Error('EMAIL_EXISTS');
        }

        const adminUser = await tx.user.create({
          data: {
            email: adminEmail,
            username: adminUsername,
            password: hashed,
            role: 'ORG_ADMIN',
            orgId: org.id,
          },
          select: { id: true, email: true, username: true, role: true },
        });

        return { org, adminUser };
      });

      return res.status(201).json(result);
    } catch (err) {
      if (err.message === 'EMAIL_EXISTS') {
        return res.status(409).json({ error: 'Admin email already registered.' });
      }
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Organization name already exists.' });
      }
      console.error('[POST /organizations]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─── GET /organizations ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true, flags: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orgs);
  } catch (err) {
    console.error('[GET /organizations]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
// ─── POST /organizations/:id/schedule-deletion ──────────────────────────────
router.post('/:id/schedule-deletion', async (req, res) => {
  try {
    const orgId = req.params.id;
    // We already verified the captcha on the frontend, but typically it could be verified here if needed.
    // For this plan, we just accept the action since requireSuperAdmin is present.
    
    // Set status to PENDING_DELETION and schedule for 24h from now
    const deletionScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        status: 'PENDING_DELETION',
        deletionScheduledAt,
      },
    });

    return res.json({ message: 'Organization scheduled for deletion.', org });
  } catch (err) {
    console.error('[POST /organizations/:id/schedule-deletion]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
// ─── GET /organizations/:id/details ─────────────────────────────────────────
router.get('/:id/details', async (req, res) => {
  try {
    const orgId = req.params.id;
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: { select: { id: true, email: true, username: true, role: true, createdAt: true } },
        flags: true,
      },
    });

    if (!org) return res.status(404).json({ error: 'Organization not found.' });
    return res.json(org);
  } catch (err) {
    console.error('[GET /organizations/:id/details]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── PATCH /organizations/:id/admin-password ────────────────────────────────
router.patch(
  '/:id/admin-password',
  [
    body('newPassword')
      .trim()
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters.'),
  ],
  validate,
  async (req, res) => {
    try {
      const orgId = req.params.id;
      const { newPassword } = req.body;

      // Find the ORG_ADMIN user for this org
      const adminUser = await prisma.user.findFirst({
        where: { orgId, role: 'ORG_ADMIN' },
      });

      if (!adminUser) {
        return res.status(404).json({ error: 'Admin user not found for this organization.' });
      }

      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashed },
      });

      return res.json({ message: 'Admin password updated successfully.' });
    } catch (err) {
      console.error('[PATCH /organizations/:id/admin-password]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
