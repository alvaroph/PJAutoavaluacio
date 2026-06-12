import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireTeacher);

const projectInclude = {
  course: { select: { id: true, name: true, academicYear: true } },
  _count: { select: { groups: true } },
};

// GET /api/projects?courseId=
router.get('/', async (req, res) => {
  const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
  const projects = await prisma.project.findMany({
    where: courseId ? { courseId } : undefined,
    include: projectInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ projects });
});

// POST /api/projects
router.post('/', async (req, res) => {
  const { courseId, name, description, scoreDecimals } = req.body || {};
  if (!courseId || !name) {
    return res.status(400).json({ error: 'Calen el curs i el nom del projecte' });
  }
  const decimals = scoreDecimals === undefined ? 1 : Number(scoreDecimals);
  if (![0, 1, 2].includes(decimals)) {
    return res.status(400).json({ error: 'Els decimals han de ser 0, 1 o 2' });
  }
  const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
  if (!course) return res.status(404).json({ error: 'Curs no trobat' });

  const project = await prisma.project.create({
    data: {
      courseId: course.id,
      name: name.trim(),
      description: description?.trim() || null,
      scoreDecimals: decimals,
      createdBy: req.user.id,
    },
    include: projectInclude,
  });
  res.status(201).json({ project });
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: Number(req.params.id) },
    include: projectInclude,
  });
  if (!project) return res.status(404).json({ error: 'Projecte no trobat' });
  res.json({ project });
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, scoreDecimals, status } = req.body || {};
  if (scoreDecimals !== undefined && ![0, 1, 2].includes(Number(scoreDecimals))) {
    return res.status(400).json({ error: 'Els decimals han de ser 0, 1 o 2' });
  }
  if (status !== undefined && !['draft', 'open', 'closed', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Estat no vàlid' });
  }
  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(scoreDecimals !== undefined && { scoreDecimals: Number(scoreDecimals) }),
        ...(status !== undefined && { status }),
      },
      include: projectInclude,
    });
    res.json({ project });
  } catch {
    res.status(404).json({ error: 'Projecte no trobat' });
  }
});

// POST /api/projects/:id/open { force? }
// No es pot obrir sense grups; si hi ha alumnes del curs sense grup s'avisa
// i cal confirmar amb force=true.
router.post('/:id/open', async (req, res) => {
  const id = Number(req.params.id);
  const project = await prisma.project.findUnique({
    where: { id },
    include: { groups: { include: { members: true } } },
  });
  if (!project) return res.status(404).json({ error: 'Projecte no trobat' });
  if (project.status === 'archived') {
    return res.status(400).json({ error: 'No es pot obrir un projecte arxivat' });
  }
  if (project.groups.length === 0) {
    return res.status(400).json({ error: 'No es pot obrir la votació: el projecte no té cap grup' });
  }

  const courseStudentCount = await prisma.courseStudent.count({ where: { courseId: project.courseId } });
  const assignedIds = new Set(project.groups.flatMap((g) => g.members.map((m) => m.userId)));
  const withoutGroup = courseStudentCount - assignedIds.size;

  if (withoutGroup > 0 && !req.body?.force) {
    return res.status(409).json({
      error: `Hi ha ${withoutGroup} alumne(s) del curs sense grup. Torna a enviar amb force=true per obrir igualment.`,
      studentsWithoutGroup: withoutGroup,
      requiresConfirmation: true,
    });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { status: 'open' },
    include: projectInclude,
  });
  res.json({ project: updated });
});

// POST /api/projects/:id/close
router.post('/:id/close', async (req, res) => {
  const id = Number(req.params.id);
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return res.status(404).json({ error: 'Projecte no trobat' });
  if (project.status !== 'open') {
    return res.status(400).json({ error: 'La votació no està oberta' });
  }
  const updated = await prisma.project.update({
    where: { id },
    data: { status: 'closed' },
    include: projectInclude,
  });
  res.json({ project: updated });
});

export default router;
