// Crea els usuaris professor/admin inicials a partir de variables d'entorn.
// Format: ADMIN_EMAILS="aperezh@inspedralbes.cat" TEACHER_EMAILS="altre@inspedralbes.cat,un.mes@inspedralbes.cat"
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseEmails(value) {
  return (value || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function nameFromEmail(email) {
  return email
    .split('@')[0]
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

async function upsertWithRole(email, role) {
  await prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, name: nameFromEmail(email), role },
  });
  console.log(`[seed] ${email} -> ${role}`);
}

async function main() {
  for (const email of parseEmails(process.env.ADMIN_EMAILS)) {
    await upsertWithRole(email, 'admin');
  }
  for (const email of parseEmails(process.env.TEACHER_EMAILS)) {
    await upsertWithRole(email, 'teacher');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
