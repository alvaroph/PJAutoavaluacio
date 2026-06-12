import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireTeacher);

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Calcula el resum per alumne d'un projecte:
// autoavaluació, mitjana de coavaluacions rebudes, recompte i estat de participació.
async function computeResults(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { course: { select: { id: true, name: true, academicYear: true } } },
  });
  if (!project) return null;

  const groups = await prisma.group.findMany({
    where: { projectId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { name: 'asc' },
  });
  const evaluations = await prisma.evaluation.findMany({ where: { projectId } });

  const rows = [];
  for (const group of groups) {
    for (const member of group.members) {
      const userId = member.userId;
      const self = evaluations.find((e) => e.type === 'self' && e.evaluatedUserId === userId);
      const peerReceived = evaluations.filter((e) => e.type === 'peer' && e.evaluatedUserId === userId);
      const given = evaluations.filter((e) => e.evaluatorUserId === userId);

      // Ha votat = s'ha valorat a si mateix i a tots els companys del seu grup
      const hasVoted = given.length >= group.members.length && group.members.length > 0;
      const lastVotedAt = given.length
        ? given.reduce((max, e) => (e.updatedAt > max ? e.updatedAt : max), given[0].updatedAt)
        : null;

      const peerAverage = peerReceived.length
        ? round(peerReceived.reduce((sum, e) => sum + Number(e.score), 0) / peerReceived.length, 2)
        : null;

      rows.push({
        course: project.course.name,
        project: project.name,
        group: group.name,
        userId,
        name: member.user.name,
        email: member.user.email,
        selfScore: self ? Number(self.score) : null,
        peerAverage,
        peerCount: peerReceived.length,
        hasVoted,
        lastVotedAt,
      });
    }
  }
  rows.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  return { project, rows };
}

// Format numèric amb coma decimal per a entorns catalans/castellans
function formatNumber(value) {
  if (value === null || value === undefined) return 'Sense dades';
  return String(value).replace('.', ',');
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/projects/:projectId/results
router.get('/projects/:projectId/results', async (req, res) => {
  const data = await computeResults(Number(req.params.projectId));
  if (!data) return res.status(404).json({ error: 'Projecte no trobat' });
  res.json({
    project: {
      id: data.project.id,
      name: data.project.name,
      status: data.project.status,
      course: data.project.course,
    },
    results: data.rows,
  });
});

// GET /api/projects/:projectId/results/export.csv
// Separador ';' per obrir-lo directament amb Excel en configuració catalana/castellana.
router.get('/projects/:projectId/results/export.csv', async (req, res) => {
  const data = await computeResults(Number(req.params.projectId));
  if (!data) return res.status(404).json({ error: 'Projecte no trobat' });

  const header = [
    'Curs', 'Projecte', 'Grup', 'Nom', 'Correu',
    'Autoavaluació', 'Coavaluació rebuda', 'Nre. coavaluacions rebudes',
    'Ha votat', 'Última votació',
  ];
  const lines = [header.join(';')];
  for (const r of data.rows) {
    lines.push([
      csvEscape(r.course),
      csvEscape(r.project),
      csvEscape(r.group),
      csvEscape(r.name),
      csvEscape(r.email),
      formatNumber(r.selfScore),
      formatNumber(r.peerAverage),
      r.peerCount,
      r.hasVoted ? 'Sí' : 'No',
      r.lastVotedAt ? new Date(r.lastVotedAt).toISOString() : '',
    ].join(';'));
  }

  const filename = `resultats-projecte-${data.project.id}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // BOM perquè Excel detecti UTF-8 i mostri bé els accents
  res.send('\uFEFF' + lines.join('\r\n'));
});

export default router;
