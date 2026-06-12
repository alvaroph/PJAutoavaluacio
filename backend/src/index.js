import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import coursesRoutes from './routes/courses.js';
import studentsRoutes from './routes/students.js';
import projectsRoutes from './routes/projects.js';
import groupsRoutes from './routes/groups.js';
import evaluationsRoutes from './routes/evaluations.js';
import resultsRoutes from './routes/results.js';

const app = express();

app.use(cors({ origin: config.appUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
// Les rutes d'alumne van primer: el router de projectes aplica requireTeacher
// a tot /api/projects/* i interceptaria /api/projects/:id/my-group.
app.use('/api', evaluationsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/courses', studentsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api', groupsRoutes);
app.use('/api', resultsRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no trobada' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error intern del servidor' });
});

app.listen(config.port, () => {
  console.log(`API escoltant al port ${config.port}`);
});
