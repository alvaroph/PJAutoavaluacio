import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Troba el grup de l'alumne dins del projecte. Retorna null si no en té.
async function findMyGroup(projectId, userId) {
  const membership = await prisma.groupMember.findFirst({
    where: { userId, group: { projectId } },
    include: {
      group: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { user: { name: 'asc' } },
          },
        },
      },
    },
  });
  return membership?.group || null;
}

function validateScore(score, decimals) {
  const value = Number(score);
  if (!Number.isFinite(value)) return { error: 'La nota ha de ser numèrica' };
  if (value < 0 || value > 10) return { error: 'La nota ha d\'estar entre 0 i 10' };
  const factor = 10 ** decimals;
  if (Math.round(value * factor) !== value * factor) {
    return { error: `La nota només pot tenir ${decimals} decimal(s)` };
  }
  return { value };
}

// GET /api/my-projects — projectes amb votació oberta o tancada on l'alumne té grup
router.get('/my-projects', async (req, res) => {
  const memberships = await prisma.groupMember.findMany({
    where: {
      userId: req.user.id,
      group: { project: { status: { in: ['open', 'closed'] } } },
    },
    include: {
      group: {
        include: {
          project: { include: { course: { select: { id: true, name: true } } } },
        },
      },
    },
  });
  const projects = memberships.map((m) => ({
    id: m.group.project.id,
    name: m.group.project.name,
    description: m.group.project.description,
    status: m.group.project.status,
    course: m.group.project.course,
    groupName: m.group.name,
  }));
  res.json({ projects });
});

// GET /api/projects/:projectId/my-group
router.get('/projects/:projectId/my-group', async (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, description: true, status: true, scoreDecimals: true },
  });
  if (!project) return res.status(404).json({ error: 'Projecte no trobat' });

  const group = await findMyGroup(projectId, req.user.id);
  if (!group) return res.status(403).json({ error: 'No formes part de cap grup d\'aquest projecte' });

  res.json({
    project,
    group: { id: group.id, name: group.name, members: group.members.map((m) => m.user) },
  });
});

// GET /api/projects/:projectId/my-evaluations
router.get('/projects/:projectId/my-evaluations', async (req, res) => {
  const projectId = Number(req.params.projectId);
  const group = await findMyGroup(projectId, req.user.id);
  if (!group) return res.status(403).json({ error: 'No formes part de cap grup d\'aquest projecte' });

  const evaluations = await prisma.evaluation.findMany({
    where: { projectId, evaluatorUserId: req.user.id },
  });
  res.json({
    evaluations: evaluations.map((e) => ({
      evaluatedUserId: e.evaluatedUserId,
      score: Number(e.score),
      type: e.type,
      updatedAt: e.updatedAt,
    })),
  });
});

// POST /api/projects/:projectId/my-evaluations { evaluations: [{ evaluatedUserId, score }] }
// Ha d'incloure l'autoavaluació i una nota per a cada company del grup.
// Mentre la votació estigui oberta, cada enviament substitueix l'anterior.
router.post('/projects/:projectId/my-evaluations', async (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: 'Projecte no trobat' });
  if (project.status !== 'open') {
    return res.status(403).json({ error: 'La votació no està oberta' });
  }

  const group = await findMyGroup(projectId, req.user.id);
  if (!group) return res.status(403).json({ error: 'No formes part de cap grup d\'aquest projecte' });

  const items = req.body?.evaluations;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No s\'ha rebut cap valoració' });
  }

  const memberIds = new Set(group.members.map((m) => m.userId));
  const expected = new Set(memberIds);
  const validated = [];

  for (const item of items) {
    const evaluatedUserId = Number(item?.evaluatedUserId);
    if (!memberIds.has(evaluatedUserId)) {
      return res.status(403).json({ error: 'Només pots valorar membres del teu grup' });
    }
    const { value, error } = validateScore(item?.score, project.scoreDecimals);
    if (error) return res.status(400).json({ error });
    if (!expected.delete(evaluatedUserId)) {
      return res.status(400).json({ error: 'Hi ha valoracions repetides per al mateix alumne' });
    }
    validated.push({ evaluatedUserId, score: value });
  }

  if (expected.size > 0) {
    return res.status(400).json({ error: 'Et falten valoracions per completar (tu mateix i tots els companys del grup)' });
  }

  await prisma.$transaction(
    validated.map(({ evaluatedUserId, score }) =>
      prisma.evaluation.upsert({
        where: {
          projectId_evaluatorUserId_evaluatedUserId: {
            projectId,
            evaluatorUserId: req.user.id,
            evaluatedUserId,
          },
        },
        update: { score, groupId: group.id },
        create: {
          projectId,
          groupId: group.id,
          evaluatorUserId: req.user.id,
          evaluatedUserId,
          score,
          type: evaluatedUserId === req.user.id ? 'self' : 'peer',
        },
      })
    )
  );

  res.json({ ok: true, saved: validated.length });
});

export default router;
