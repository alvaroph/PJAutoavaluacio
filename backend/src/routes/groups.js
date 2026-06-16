import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();

const groupInclude = {
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: 'asc' } },
  },
};

function serializeGroup(group) {
  return {
    id: group.id,
    projectId: group.projectId,
    name: group.name,
    members: group.members.map((m) => m.user),
  };
}

// GET /api/projects/:projectId/groups
// Retorna els grups del projecte i els alumnes del curs que encara no en tenen.
router.get('/projects/:projectId/groups', requireAuth, requireTeacher, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: 'Projecte no trobat' });

  const groups = await prisma.group.findMany({
    where: { projectId },
    include: groupInclude,
    orderBy: { name: 'asc' },
  });
  const enrolled = await prisma.courseStudent.findMany({
    where: { courseId: project.courseId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: 'asc' } },
  });
  const assigned = new Set(groups.flatMap((g) => g.members.map((m) => m.userId)));
  const unassigned = enrolled.map((e) => e.user).filter((u) => !assigned.has(u.id));

  res.json({ groups: groups.map(serializeGroup), unassignedStudents: unassigned });
});

// POST /api/projects/:projectId/groups { name }
router.post('/projects/:projectId/groups', requireAuth, requireTeacher, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Cal el nom del grup' });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: 'Projecte no trobat' });

  const group = await prisma.group.create({
    data: { projectId, name: name.trim() },
    include: groupInclude,
  });
  res.status(201).json({ group: serializeGroup(group) });
});

// PUT /api/groups/:groupId { name }
router.put('/groups/:groupId', requireAuth, requireTeacher, async (req, res) => {
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Cal el nom del grup' });
  try {
    const group = await prisma.group.update({
      where: { id: Number(req.params.groupId) },
      data: { name: name.trim() },
      include: groupInclude,
    });
    res.json({ group: serializeGroup(group) });
  } catch {
    res.status(404).json({ error: 'Grup no trobat' });
  }
});

// DELETE /api/groups/:groupId
router.delete('/groups/:groupId', requireAuth, requireTeacher, async (req, res) => {
  try {
    await prisma.group.delete({ where: { id: Number(req.params.groupId) } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Grup no trobat' });
  }
});

// POST /api/groups/:groupId/members { userId }
// Mou l'alumne si ja era en un altre grup del mateix projecte: un alumne
// només pot estar en un grup per projecte.
router.post('/groups/:groupId/members', requireAuth, requireTeacher, async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.body?.userId);
  if (!userId) return res.status(400).json({ error: 'Cal indicar l\'alumne (userId)' });

  const group = await prisma.group.findUnique({ where: { id: groupId }, include: { project: true } });
  if (!group) return res.status(404).json({ error: 'Grup no trobat' });

  // El grup no pot tenir alumnes d'un altre curs
  const enrollment = await prisma.courseStudent.findUnique({
    where: { courseId_userId: { courseId: group.project.courseId, userId } },
  });
  if (!enrollment) {
    return res.status(400).json({ error: 'L\'alumne no pertany al curs d\'aquest projecte' });
  }

  await prisma.$transaction([
    prisma.groupMember.deleteMany({
      where: { userId, group: { projectId: group.projectId } },
    }),
    prisma.groupMember.create({ data: { groupId, userId } }),
  ]);

  const updated = await prisma.group.findUnique({ where: { id: groupId }, include: groupInclude });
  res.status(201).json({ group: serializeGroup(updated) });
});

// DELETE /api/groups/:groupId/members/:userId
router.delete('/groups/:groupId/members/:userId', requireAuth, requireTeacher, async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.params.userId);
  try {
    await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'L\'alumne no és en aquest grup' });
  }
});

// ─── RUTES D'ALUMNE ────────────────────────────────────────────────────────

// GET /api/groups/project/:projectId — grups del projecte + el grup de l'alumne autenticat
router.get('/groups/project/:projectId', requireAuth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: 'Projecte no trobat' });

  const groups = await prisma.group.findMany({
    where: { projectId },
    include: groupInclude,
    orderBy: { name: 'asc' },
  });

  const myMembership = groups.find((g) =>
    g.members.some((m) => m.userId === req.user.id),
  );

  res.json({
    groups: groups.map(serializeGroup),
    enrollmentOpen: project.enrollmentOpen,
    myGroupId: myMembership?.id ?? null,
  });
});

// POST /api/groups/:groupId/join — alumne s'uneix a un grup
router.post('/groups/:groupId/join', requireAuth, async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = req.user.id;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { project: true },
  });
  if (!group) return res.status(404).json({ error: 'Grup no trobat' });

  if (!group.project.enrollmentOpen) {
    return res.status(403).json({ error: 'La inscripció a grups d\'aquest projecte és tancada' });
  }

  const enrollment = await prisma.courseStudent.findUnique({
    where: { courseId_userId: { courseId: group.project.courseId, userId } },
  });
  if (!enrollment) {
    return res.status(403).json({ error: 'No estàs matriculat al curs d\'aquest projecte' });
  }

  const existingMembership = await prisma.groupMember.findFirst({
    where: { userId, group: { projectId: group.projectId } },
  });
  if (existingMembership) {
    return res.status(409).json({ error: 'Ja pertanys a un grup d\'aquest projecte' });
  }

  await prisma.groupMember.create({ data: { groupId, userId } });
  const updated = await prisma.group.findUnique({ where: { id: groupId }, include: groupInclude });
  res.status(201).json({ group: serializeGroup(updated) });
});

// DELETE /api/groups/:groupId/leave — alumne abandona un grup
router.delete('/groups/:groupId/leave', requireAuth, async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = req.user.id;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { project: true },
  });
  if (!group) return res.status(404).json({ error: 'Grup no trobat' });

  if (!group.project.enrollmentOpen) {
    return res.status(403).json({ error: 'La inscripció a grups d\'aquest projecte és tancada' });
  }

  try {
    await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'No ets membre d\'aquest grup' });
  }
});

export default router;
