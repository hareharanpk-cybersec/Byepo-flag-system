const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * verifyToken — Verify Bearer JWT from Authorization header.
 * Attaches decoded payload { userId, role, orgId } to req.user.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId || null,
      role: decoded.role,
      orgId: decoded.orgId || null,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * requireRole(role) — Return 403 if req.user.role does not match required role.
 */
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: `Forbidden. Requires role: ${role}.` });
  }
  next();
};

/**
 * requireSuperAdmin — Return 403 if req.user.role is not SUPER_ADMIN.
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden. Super admin access required.' });
  }
  next();
};

/**
 * requireActiveOrg — Return 403 if req.user.orgId points to an org that is PENDING_DELETION.
 * Used for mutation routes (POST, PATCH, DELETE) to prevent changes.
 */
const requireActiveOrg = async (req, res, next) => {
  if (!req.user || !req.user.orgId) {
    return res.status(400).json({ error: 'No organization context found.' });
  }
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.orgId },
      select: { status: true },
    });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }
    if (org.status === 'PENDING_DELETION') {
      return res.status(403).json({ error: 'Organization is scheduled for deletion. Modifications are disabled.' });
    }
    next();
  } catch (err) {
    console.error('[requireActiveOrg]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { verifyToken, requireRole, requireSuperAdmin, requireActiveOrg };
