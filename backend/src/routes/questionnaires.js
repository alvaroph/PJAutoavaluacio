import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();

const itemSelect = { id: true, label: true, weight: true, order: true };

function serializeItem(item) {
  return { id: item.id, label: item.label, weight: Number(item.weight), order: item.order };
}

function serializeQuestionnaire(q, withItems = false) {
  const out = {
    id: q.id,
    courseId: q.courseId,
    name: q.name,
    description: q.description,
    status: q.status,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
  if (q.course) out.course = q.course;
  if (withItems && q.items) out.items = q.items.map(serializeItem);
  if (q._count !== undefined) out._count = q._count;
  return out;
}

function validateWeights(items) {
  const total = items.reduce((s, i) => s + Number(i.weight), 0);
  // Toleràncua d'1 punt per errors d'arrodoniment
  if (Math.abs(total - 100) > 1) {
    return `La suma dels percentatges ha de ser 100 (ara és ${total.toFixed(2)})`;
  }
  return null;
}

// ─── RUTES DE PROFESSOR ────────────────────────────────────────────────────

// GET /api/questionnaires?courseId=&status=&search=
router.get('/', requireAuth, requireTeacher, async (req, res) => {
  const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
  const status = req.query.status || undefined;
  const search = req.query.search?.trim() || undefined;

  const where = {};
  if (courseId) where.courseId = courseId;
  if (status) where.status = status;
  if (search) where.OR = [
    { name: { contains: search } },
    { description: { contains: search } },
  ];

  const qs = await prisma.questionnaire.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: {
      course: { select: { id: true, name: true, academicYear: true } },
      _count: { select: { items: true, responses: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ questionnaires: qs.map((q) => serializeQuestionnaire(q)) });
});

// POST /api/questionnaires  { courseId, name, description?, items?: [{label, weight}] }
router.post('/', requireAuth, requireTeacher, async (req, res) => {
  const { courseId, name, description, items } = req.body || {};
  if (!courseId || !name?.trim()) {
    return res.status(400).json({ error: 'Calen el curs i el nom del qüestionari' });
  }
  const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
  if (!course) return res.status(404).json({ error: 'Curs no trobat' });

  if (Array.isArray(items) && items.length > 0) {
    const err = validateWeights(items);
    if (err) return res.status(400).json({ error: err });
  }

  const q = await prisma.questionnaire.create({
    data: {
      courseId: course.id,
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: req.user.id,
      items: Array.isArray(items)
        ? {
            create: items.map((item, i) => ({
              label: item.label.trim(),
              weight: Number(item.weight),
              order: i,
            })),
          }
        : undefined,
    },
    include: {
      course: { select: { id: true, name: true, academicYear: true } },
      items: { orderBy: { order: 'asc' }, select: itemSelect },
    },
  });
  res.status(201).json({ questionnaire: serializeQuestionnaire(q, true) });
});

// GET /api/questionnaires/:id
router.get('/:id', requireAuth, requireTeacher, async (req, res) => {
  const q = await prisma.questionnaire.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      course: { select: { id: true, name: true, academicYear: true } },
      items: { orderBy: { order: 'asc' }, select: itemSelect },
      _count: { select: { responses: true } },
    },
  });
  if (!q) return res.status(404).json({ error: 'Qüestionari no trobat' });
  res.json({ questionnaire: serializeQuestionnaire(q, true) });
});

// PUT /api/questionnaires/:id  { name?, description? }
router.put('/:id', requireAuth, requireTeacher, async (req, res) => {
  const { name, description } = req.body || {};
  try {
    const q = await prisma.questionnaire.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
      include: {
        course: { select: { id: true, name: true, academicYear: true } },
        items: { orderBy: { order: 'asc' }, select: itemSelect },
        _count: { select: { responses: true } },
      },
    });
    res.json({ questionnaire: serializeQuestionnaire(q, true) });
  } catch {
    res.status(404).json({ error: 'Qüestionari no trobat' });
  }
});

// POST /api/questionnaires/:id/items  { label, weight }
router.post('/:id/items', requireAuth, requireTeacher, async (req, res) => {
  const qId = Number(req.params.id);
  const q = await prisma.questionnaire.findUnique({ where: { id: qId }, include: { items: true } });
  if (!q) return res.status(404).json({ error: 'Qüestionari no trobat' });
  if (q.status !== 'draft') {
    return res.status(400).json({ error: 'Només es poden afegir ítems mentre el qüestionari és un esborrany' });
  }
  const { label, weight } = req.body || {};
  if (!label?.trim() || weight === undefined) {
    return res.status(400).json({ error: 'Calen la descripció i el percentatge de l\'ítem' });
  }
  const item = await prisma.questionnaireItem.create({
    data: { questionnaireId: qId, label: label.trim(), weight: Number(weight), order: q.items.length },
    select: itemSelect,
  });
  res.status(201).json({ item: serializeItem(item) });
});

// PUT /api/questionnaire-items/:itemId  { label?, weight?, order? }
router.put('/items/:itemId', requireAuth, requireTeacher, async (req, res) => {
  const { label, weight, order } = req.body || {};
  try {
    const item = await prisma.questionnaireItem.update({
      where: { id: Number(req.params.itemId) },
      data: {
        ...(label !== undefined && { label: label.trim() }),
        ...(weight !== undefined && { weight: Number(weight) }),
        ...(order !== undefined && { order: Number(order) }),
      },
      select: itemSelect,
    });
    res.json({ item: serializeItem(item) });
  } catch {
    res.status(404).json({ error: 'Ítem no trobat' });
  }
});

// DELETE /api/questionnaire-items/:itemId
router.delete('/items/:itemId', requireAuth, requireTeacher, async (req, res) => {
  try {
    await prisma.questionnaireItem.delete({ where: { id: Number(req.params.itemId) } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Ítem no trobat' });
  }
});

// POST /api/questionnaires/:id/open
router.post('/:id/open', requireAuth, requireTeacher, async (req, res) => {
  const q = await prisma.questionnaire.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: true },
  });
  if (!q) return res.status(404).json({ error: 'Qüestionari no trobat' });
  if (q.items.length === 0) {
    return res.status(400).json({ error: 'Cal afegir almenys un ítem abans d\'obrir el qüestionari' });
  }
  const weightErr = validateWeights(q.items);
  if (weightErr) return res.status(400).json({ error: weightErr });

  const updated = await prisma.questionnaire.update({
    where: { id: q.id },
    data: { status: 'open' },
  });
  res.json({ questionnaire: { id: updated.id, status: updated.status } });
});

// POST /api/questionnaires/:id/close
router.post('/:id/close', requireAuth, requireTeacher, async (req, res) => {
  const q = await prisma.questionnaire.findUnique({ where: { id: Number(req.params.id) } });
  if (!q) return res.status(404).json({ error: 'Qüestionari no trobat' });
  if (q.status !== 'open') return res.status(400).json({ error: 'El qüestionari no està obert' });
  const updated = await prisma.questionnaire.update({
    where: { id: q.id },
    data: { status: 'closed' },
  });
  res.json({ questionnaire: { id: updated.id, status: updated.status } });
});

// GET /api/questionnaires/:id/results
router.get('/:id/results', requireAuth, requireTeacher, async (req, res) => {
  const data = await computeResults(Number(req.params.id));
  if (!data) return res.status(404).json({ error: 'Qüestionari no trobat' });
  res.json(data);
});

// GET /api/questionnaires/:id/results/export.csv
router.get('/:id/results/export.csv', requireAuth, requireTeacher, async (req, res) => {
  const data = await computeResults(Number(req.params.id));
  if (!data) return res.status(404).json({ error: 'Qüestionari no trobat' });

  function fmt(v) {
    if (v === null || v === undefined) return 'Sense dades';
    return String(v).replace('.', ',');
  }
  function esc(v) {
    const s = String(v ?? '');
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const header = ['Curs', 'Qüestionari', 'Nom', 'Correu', 'Nota autoavaluació', 'Nota ítems fets', 'Ha respost'];
  const lines = [header.join(';')];
  for (const r of data.rows) {
    lines.push([
      esc(data.questionnaire.course.name),
      esc(data.questionnaire.name),
      esc(r.name),
      esc(r.email),
      fmt(r.selfScore),
      fmt(r.itemScore),
      r.hasResponded ? 'Sí' : 'No',
    ].join(';'));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="resultats-questionnaire-${data.questionnaire.id}.csv"`);
  res.send('﻿' + lines.join('\r\n'));
});

// ─── RUTES D'ALUMNE ────────────────────────────────────────────────────────

// GET /api/my-questionnaires — qüestionaris oberts dels cursos en què l'alumne és matriculat
router.get('/student/my-questionnaires', requireAuth, async (req, res) => {
  const enrollments = await prisma.courseStudent.findMany({
    where: { userId: req.user.id },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const qs = await prisma.questionnaire.findMany({
    where: { courseId: { in: courseIds }, status: { in: ['open', 'closed'] } },
    include: {
      course: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Afegeix si l'alumne ja ha respost
  const responses = await prisma.questionnaireResponse.findMany({
    where: { userId: req.user.id, questionnaireId: { in: qs.map((q) => q.id) } },
    select: { questionnaireId: true },
  });
  const respondedIds = new Set(responses.map((r) => r.questionnaireId));

  res.json({
    questionnaires: qs.map((q) => ({
      id: q.id,
      name: q.name,
      description: q.description,
      status: q.status,
      course: q.course,
      itemCount: q._count.items,
      hasResponded: respondedIds.has(q.id),
    })),
  });
});

// GET /api/questionnaires/:id/my-response
router.get('/:id/my-response', requireAuth, async (req, res) => {
  const qId = Number(req.params.id);
  const q = await prisma.questionnaire.findUnique({
    where: { id: qId },
    include: {
      course: { select: { id: true, name: true } },
      // Els pesos NO s'envien a l'alumne
      items: { orderBy: { order: 'asc' }, select: { id: true, label: true, order: true } },
    },
  });
  if (!q) return res.status(404).json({ error: 'Qüestionari no trobat' });

  // Comprova que l'alumne pertany al curs
  const enrolled = await prisma.courseStudent.findUnique({
    where: { courseId_userId: { courseId: q.courseId, userId: req.user.id } },
  });
  if (!enrolled) return res.status(403).json({ error: 'No estàs matriculat a aquest curs' });

  const response = await prisma.questionnaireResponse.findUnique({
    where: { questionnaireId_userId: { questionnaireId: qId, userId: req.user.id } },
    include: { itemResponses: true },
  });

  res.json({
    questionnaire: {
      id: q.id, name: q.name, description: q.description, status: q.status, course: q.course,
      items: q.items,
    },
    response: response
      ? {
          selfScore: Number(response.selfScore),
          updatedAt: response.updatedAt,
          items: response.itemResponses.map((ir) => ({ itemId: ir.itemId, done: ir.done })),
        }
      : null,
  });
});

// POST /api/questionnaires/:id/my-response  { selfScore, items: [{itemId, done}] }
router.post('/:id/my-response', requireAuth, async (req, res) => {
  const qId = Number(req.params.id);
  const q = await prisma.questionnaire.findUnique({
    where: { id: qId },
    include: { items: { select: { id: true } } },
  });
  if (!q) return res.status(404).json({ error: 'Qüestionari no trobat' });
  if (q.status !== 'open') return res.status(403).json({ error: 'El qüestionari no està obert' });

  const enrolled = await prisma.courseStudent.findUnique({
    where: { courseId_userId: { courseId: q.courseId, userId: req.user.id } },
  });
  if (!enrolled) return res.status(403).json({ error: 'No estàs matriculat a aquest curs' });

  const { selfScore, items } = req.body || {};
  const score = Number(selfScore);
  if (!Number.isFinite(score) || score < 0 || score > 10) {
    return res.status(400).json({ error: 'La nota d\'autoavaluació ha d\'estar entre 0 i 10' });
  }
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Falta la llista d\'ítems' });
  }

  const validItemIds = new Set(q.items.map((i) => i.id));
  for (const item of items) {
    if (!validItemIds.has(Number(item.itemId))) {
      return res.status(400).json({ error: 'Ítem no vàlid' });
    }
  }

  // Upsert de la resposta principal
  const existing = await prisma.questionnaireResponse.findUnique({
    where: { questionnaireId_userId: { questionnaireId: qId, userId: req.user.id } },
  });

  let response;
  if (existing) {
    response = await prisma.questionnaireResponse.update({
      where: { id: existing.id },
      data: { selfScore: score },
    });
    // Actualitza els ítems
    await prisma.questionnaireItemResponse.deleteMany({ where: { responseId: existing.id } });
  } else {
    response = await prisma.questionnaireResponse.create({
      data: { questionnaireId: qId, userId: req.user.id, selfScore: score },
    });
  }

  await prisma.questionnaireItemResponse.createMany({
    data: items.map((item) => ({
      responseId: response.id,
      itemId: Number(item.itemId),
      done: !!item.done,
    })),
  });

  res.json({ ok: true });
});

// ─── CÀLCUL DE RESULTATS (ús intern) ──────────────────────────────────────

async function computeResults(questionnaireId) {
  const q = await prisma.questionnaire.findUnique({
    where: { id: questionnaireId },
    include: {
      course: { select: { id: true, name: true, academicYear: true } },
      items: { orderBy: { order: 'asc' } },
    },
  });
  if (!q) return null;

  // Alumnes matriculats al curs
  const enrolled = await prisma.courseStudent.findMany({
    where: { courseId: q.courseId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: 'asc' } },
  });

  const responses = await prisma.questionnaireResponse.findMany({
    where: { questionnaireId },
    include: { itemResponses: true },
  });
  const responseByUser = new Map(responses.map((r) => [r.userId, r]));

  const rows = enrolled.map(({ user }) => {
    const resp = responseByUser.get(user.id);
    let selfScore = null;
    let itemScore = null;
    if (resp) {
      selfScore = Number(resp.selfScore);
      const doneIds = new Set(resp.itemResponses.filter((ir) => ir.done).map((ir) => ir.itemId));
      itemScore = q.items.reduce((sum, item) => sum + (doneIds.has(item.id) ? Number(item.weight) / 10 : 0), 0);
      itemScore = Math.round(itemScore * 100) / 100;
    }
    return { userId: user.id, name: user.name, email: user.email, selfScore, itemScore, hasResponded: !!resp };
  });

  return { questionnaire: q, rows };
}

export default router;
