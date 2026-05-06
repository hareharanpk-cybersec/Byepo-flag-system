const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireRole('ORG_ADMIN'));

// Get audit logs
router.get('/', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { orgId: req.user.orgId },
      orderBy: { timestamp: 'desc' },
      take: 100 // limit to last 100
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
