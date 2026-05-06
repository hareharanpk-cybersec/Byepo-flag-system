const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const { verifyToken, requireRole, requireActiveOrg } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

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

// All user management routes require a verified org admin token
router.use(verifyToken, requireRole('ORG_ADMIN'));

// ─── GET /users ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.orgId;

    const users = await prisma.user.findMany({
      where: { orgId, role: 'END_USER' },
      select: { id: true, email: true, username: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(users);
  } catch (err) {
    console.error('[GET /users]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /users ─────────────────────────────────────────────────────────────
router.post(
  '/',
  requireActiveOrg,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password')
      .trim()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, username, password } = req.body;
      const orgId = req.user.orgId;

      const hashed = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashed,
          role: 'END_USER',
          orgId,
        },
        select: { id: true, email: true, username: true, createdAt: true },
      });

      const actor = await resolveActor(req.user);
      await prisma.auditLog.create({
        data: {
          orgId,
          action: 'USER_CREATED',
          actor,
          target: username || email
        }
      });

      return res.status(201).json(user);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Email already registered.' });
      }
      console.error('[POST /users]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─── DELETE /users/:id ───────────────────────────────────────────────────────
router.delete('/:id', requireActiveOrg, async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.orgId;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.orgId !== orgId || user.role !== 'END_USER') {
      return res.status(404).json({ error: 'User not found or access denied.' });
    }

    await prisma.user.delete({ where: { id } });

    const actor = await resolveActor(req.user);
    await prisma.auditLog.create({
      data: {
        orgId,
        action: 'USER_DELETED',
        actor,
        target: user.username || user.email
      }
    });

    return res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /users/:id]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
