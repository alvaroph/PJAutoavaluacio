import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireTeacher);

// GET /api/courses
router.get('/', async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: [{ status: 'asc' }, { academicYear: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { students: true, projects: true } } },
  });
  res.json({ courses });
});

// POST /api/courses
router.post('/', async (req, res) => {
  const { name, description, academicYear } = req.body || {};
  if (!name || !academicYear) {
    return res.status(400).json({ error: 'Calen el nom i l\'any acadèmic' });
  }
  const course = await prisma.course.create({
    data: { name: name.trim(), description: description?.trim() || null, academicYear: academicYear.trim() },
  });
  res.status(201).json({ course });
});

// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: Number(req.params.id) },
    include: { _count: { select: { students: true, projects: true } } },
  });
  if (!course) return res.status(404).json({ error: 'Curs no trobat' });
  res.json({ course });
});

// PUT /api/courses/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, academicYear, status } = req.body || {};
  if (status && !['active', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Estat no vàlid' });
  }
  try {
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(academicYear !== undefined && { academicYear: academicYear.trim() }),
        ...(status !== undefined && { status }),
      },
    });
    res.json({ course });
  } catch {
    res.status(404).json({ error: 'Curs no trobat' });
  }
});

// DELETE /api/courses/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Curs no trobat' });
  }
});

export default router;
