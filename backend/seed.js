require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Seeding demo data...\n');

  // ── List existing orgs ─────────────────────────────────────────────────────
  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { users: true, flags: true } } },
    orderBy: { createdAt: 'asc' },
  });
  console.log('── Existing Organizations ──────────────────────────────');
  orgs.forEach(o => console.log(`  ${o.name} | ID: ${o.id} | users: ${o._count.users} | flags: ${o._count.flags}`));

  // ── Pick first org to attach the end user to ───────────────────────────────
  let targetOrg = orgs.find(o => o.name === 'Test Org Alpha') || orgs[0];

  if (!targetOrg) {
    targetOrg = await prisma.organization.create({ data: { name: 'Byepo Demo Org' } });
    console.log(`\n  ✅ Created org: ${targetOrg.name} | ${targetOrg.id}`);
  }

  // ── Ensure admin user exists in targetOrg ──────────────────────────────────
  const adminEmail = 'orgadmin@test.com';
  let adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!adminUser) {
    const hashed = await bcrypt.hash('Admin@5678', 12);
    adminUser = await prisma.user.create({
      data: { email: adminEmail, password: hashed, role: 'ORG_ADMIN', orgId: targetOrg.id },
    });
    console.log(`  ✅ Created ORG_ADMIN: ${adminEmail}`);
  } else {
    console.log(`\n  ℹ️  ORG_ADMIN already exists: ${adminEmail}`);
  }

  // ── Create end user ────────────────────────────────────────────────────────
  const userEmail = 'enduser@test.com';
  let endUser = await prisma.user.findFirst({ where: { email: userEmail } });
  if (!endUser) {
    const hashed = await bcrypt.hash('User@1234', 12);
    endUser = await prisma.user.create({
      data: { email: userEmail, password: hashed, role: 'END_USER', orgId: targetOrg.id },
    });
    console.log(`  ✅ Created END_USER: ${userEmail}`);
  } else {
    console.log(`  ℹ️  END_USER already exists: ${userEmail}`);
  }

  // ── Ensure demo feature flags exist ────────────────────────────────────────
  const flagKeys = [
    { featureKey: 'dark_mode', isDev: true, isStaging: true, isProd: true },
    { featureKey: 'beta_checkout', isDev: true, isStaging: false, isProd: false },
    { featureKey: 'new_dashboard', isDev: true, isStaging: true, isProd: true },
    { featureKey: 'ai_assistant', isDev: true, isStaging: false, isProd: false },
  ];

  console.log('\n── Feature Flags ───────────────────────────────────────');
  for (const { featureKey, isDev, isStaging, isProd } of flagKeys) {
    const existing = await prisma.featureFlag.findUnique({
      where: { featureKey_orgId: { featureKey, orgId: targetOrg.id } },
    });
    if (!existing) {
      await prisma.featureFlag.create({ data: { featureKey, isDev, isStaging, isProd, orgId: targetOrg.id } });
      console.log(`  ✅ Created flag: ${featureKey} (prod: ${isProd ? 'ENABLED' : 'disabled'})`);
    } else {
      console.log(`  ℹ️  Flag exists: ${featureKey} (prod: ${existing.isProd ? 'ENABLED' : 'disabled'})`);
    }
  }

  // ── Final Summary ──────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('                     CREDENTIALS                          ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n  🔐 SUPER ADMIN  → http://localhost:3001');
  console.log(`     Email    : ${process.env.SUPER_ADMIN_EMAIL}`);
  console.log(`     Password : ${process.env.SUPER_ADMIN_PASSWORD}`);
  console.log('\n  🏢 ORG ADMIN   → http://localhost:3002');
  console.log(`     Email    : ${adminEmail}`);
  console.log(`     Password : Admin@5678`);
  console.log(`     Org      : ${targetOrg.name}`);
  console.log(`     Org ID   : ${targetOrg.id}`);
  console.log('\n  👤 END USER    → http://localhost:3003');
  console.log(`     Email    : ${userEmail}`);
  console.log(`     Password : User@1234`);
  console.log(`     Org      : ${targetOrg.name}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
