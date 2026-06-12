import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

import LoginView from '../views/LoginView.vue';
import TeacherDashboardView from '../views/TeacherDashboardView.vue';
import CoursesView from '../views/CoursesView.vue';
import CourseStudentsView from '../views/CourseStudentsView.vue';
import ProjectsView from '../views/ProjectsView.vue';
import ProjectGroupsView from '../views/ProjectGroupsView.vue';
import ProjectResultsView from '../views/ProjectResultsView.vue';
import StudentProjectsView from '../views/StudentProjectsView.vue';
import StudentEvaluationView from '../views/StudentEvaluationView.vue';

const routes = [
  { path: '/login', name: 'login', component: LoginView },

  // Rutes de professor
  { path: '/', name: 'dashboard', component: TeacherDashboardView, meta: { role: 'teacher' } },
  { path: '/courses', name: 'courses', component: CoursesView, meta: { role: 'teacher' } },
  { path: '/courses/:courseId/students', name: 'course-students', component: CourseStudentsView, meta: { role: 'teacher' } },
  { path: '/projects', name: 'projects', component: ProjectsView, meta: { role: 'teacher' } },
  { path: '/projects/:projectId/groups', name: 'project-groups', component: ProjectGroupsView, meta: { role: 'teacher' } },
  { path: '/projects/:projectId/results', name: 'project-results', component: ProjectResultsView, meta: { role: 'teacher' } },

  // Rutes d'alumne
  { path: '/my-projects', name: 'my-projects', component: StudentProjectsView, meta: { role: 'student' } },
  { path: '/projects/:projectId/evaluate', name: 'evaluate', component: StudentEvaluationView, meta: { role: 'student' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.loaded) await auth.fetchMe();

  if (to.name === 'login') {
    if (!auth.isAuthenticated) return true;
    return auth.isTeacher ? { name: 'dashboard' } : { name: 'my-projects' };
  }

  if (!auth.isAuthenticated) return { name: 'login' };

  // El frontend només decideix la navegació: els permisos reals es comproven al backend
  if (to.meta.role === 'teacher' && !auth.isTeacher) return { name: 'my-projects' };
  if (to.meta.role === 'student' && !auth.isStudent) return { name: 'dashboard' };
  return true;
});

export default router;
