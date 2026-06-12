import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireTeacher);

const EMAIL_REGEX = /^[^\s@;,]+@[^\s@;,]+\.[^\s@;,]+$/;

// Analitza el text enganxat pel professor. Accepta "Nom Cognoms;correu" o
// "Nom Cognoms<TAB>correu" (una línia per alumne) i marca cada fila amb el
// seu estat perquè la previsualització pugui mostrar errors corregibles.
function parseStudentList(text, existingEmails) {
  const rows = [];
  const seen = new Set();
  const lines = (text || '').split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.includes(';') ? line.split(';') : line.split(/\t+/);
    const name = (parts[0] || '').trim();
    const email = (parts[1] || '').trim().toLowerCase();
    const row = { line: i + 1, name, email, status: 'ok', message: null };

    if (!name || !email) {
      row.status = 'error';
      row.message = 'Falta el nom o el correu (format esperat: Nom Cognoms;correu)';
    } else if (!EMAIL_REGEX.test(email)) {
      row.status = 'error';
      row.message = 'El correu no té un format vàlid';
    } else if (!email.endsWith('@' + config.allowedDomain)) {
      row.status = 'error';
      row.message = `El correu no pertany al domini ${config.allowedDomain}`;
    } else if (seen.has(email)) {
      row.status = 'error';
      row.message = 'Correu duplicat dins del llistat';
    } else if (existingEmails.has(email)) {
      row.status = 'warning';
      row.message = 'Aquest alumne ja és al curs (s\'ometrà)';
    }

    if (row.status !== 'error') seen.add(email);
    rows.push(row);
  }
  return rows;
}

async function getCourseOr404(courseId, res) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    res.status(404).json({ error: 'Curs no trobat' });
    return null;
  }
  return course;
}

async function getExistingEmails(courseId) {
  const enrolled = await prisma.courseStudent.findMany({
    where: { courseId },
    include: { user: { select: { email: true } } },
  });
  return new Set(enrolled.map((e) => e.user.email));
}

// POST /api/courses/:courseId/students/import-preview { text }
router.post('/:courseId/students/import-preview', async (req, res) => {
  const courseId = Number(req.params.courseId);
  if (!(await getCourseOr404(courseId, res))) return;

  const rows = parseStudentList(req.body?.text, await getExistingEmails(courseId));
  res.json({
    rows,
    summary: {
      total: rows.length,
      ok: rows.filter((r) => r.status === 'ok').length,
      warnings: rows.filter((r) => r.status === 'warning').length,
      errors: rows.filter((r) => r.status === 'error').length,
    },
  });
});

// POST /api/courses/:courseId/students/import-confirm { text }
// Es torna a validar al backend: la previsualització del frontend no és cap garantia.
router.post('/:courseId/students/import-confirm', async (req, res) => {
  const courseId = Number(req.params.courseId);
  if (!(await getCourseOr404(courseId, res))) return;

  const rows = parseStudentList(req.body?.text, await getExistingEmails(courseId));
  const errors = rows.filter((r) => r.status === 'error');
  if (errors.length > 0) {
    return res.status(400).json({ error: 'El llistat conté errors. Corregeix-los abans d\'importar.', rows });
  }

  const toImport = rows.filter((r) => r.status === 'ok');
  let imported = 0;
  for (const row of toImport) {
    // No es degrada mai el rol d'un professor que aparegui al llistat
    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: {},
      create: { name: row.name, email: row.email, role: 'student' },
    });
    await prisma.courseStudent.upsert({
      where: { courseId_userId: { courseId, userId: user.id } },
      update: {},
      create: { courseId, userId: user.id },
    });
    imported++;
  }

  res.json({ ok: true, imported, skipped: rows.length - imported });
});

// GET /api/courses/:courseId/students
router.get('/:courseId/students', async (req, res) => {
  const courseId = Number(req.params.courseId);
  if (!(await getCourseOr404(courseId, res))) return;

  const enrolled = await prisma.courseStudent.findMany({
    where: { courseId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: 'asc' } },
  });
  res.json({ students: enrolled.map((e) => e.user) });
});

// DELETE /api/courses/:courseId/students/:userId — treure un alumne del curs
router.delete('/:courseId/students/:userId', async (req, res) => {
  const courseId = Number(req.params.courseId);
  const userId = Number(req.params.userId);
  try {
    await prisma.courseStudent.delete({ where: { courseId_userId: { courseId, userId } } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Alumne no trobat en aquest curs' });
  }
});

export default router;
