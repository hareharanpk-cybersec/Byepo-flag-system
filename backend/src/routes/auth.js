const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const { validate } = require('../middleware/validate');

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

// ─── POST /auth/super-admin/login ────────────────────────────────────────────
router.post(
  '/super-admin/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').trim().notEmpty().withMessage('Password required.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (
        email !== process.env.SUPER_ADMIN_EMAIL ||
        password !== process.env.SUPER_ADMIN_PASSWORD
      ) {
        return res.status(401).json({ error: 'Invalid super admin credentials.' });
      }

      const token = jwt.sign({ role: 'SUPER_ADMIN' }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token });
    } catch (err) {
      console.error('[super-admin/login]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);


// ─── POST /auth/admin/login ───────────────────────────────────────────────────
router.post(
  '/admin/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').trim().notEmpty().withMessage('Password required.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findFirst({
        where: { email, role: 'ORG_ADMIN' },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { userId: user.id, role: 'ORG_ADMIN', orgId: user.orgId },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({ token });
    } catch (err) {
      console.error('[admin/login]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─── POST /auth/user/login ────────────────────────────────────────────────────
router.post(
  '/user/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').trim().notEmpty().withMessage('Password required.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findFirst({
        where: { email, role: 'END_USER' },
        include: { org: { select: { name: true } } },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { userId: user.id, role: 'END_USER', orgId: user.orgId, orgName: user.org.name },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({ token });
    } catch (err) {
      console.error('[user/login]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─── POST /auth/forgot-password ─────────────────────────────────────────────
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required.')],
  validate,
  async (req, res) => {
    try {
      const { email } = req.body;
      const user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        // Return success even if user not found to prevent email enumeration
        return res.json({ message: 'If that email exists, a reset link has been sent.' });
      }

      // Generate a 64-char reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry }
      });

      // Simulated email sending
      console.log(`\n\n=== PASSWORD RESET EMAIL ===\nTo: ${email}\nLink: http://localhost:3000/reset-password?token=${resetToken}\n============================\n\n`);

      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
      console.error('[forgot-password]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─── POST /auth/reset-password ──────────────────────────────────────────────
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  ],
  validate,
  async (req, res) => {
    try {
      const { token, password } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired token.' });
      }

      const hashed = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      return res.json({ message: 'Password reset successfully.' });
    } catch (err) {
      console.error('[reset-password]', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
