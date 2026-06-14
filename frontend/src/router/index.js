import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

import LoginView from '../views/LoginView.vue';
import TeacherDashboardView from '../views/TeacherDashboardView.vue';
import CoursesView from '../views/CoursesView.vue';
import CourseStudentsView from '../views/CourseStudentsView.vue';
import ProjectsView from '../views/ProjectsView.vue';
import ProjectGroupsView from '../views/ProjectGroupsView.vue';
import ProjectResultsView from '../views/ProjectResultsView.vue';
import QuestionnairesView from '../views/QuestionnairesView.vue';
import QuestionnaireEditView from '../views/QuestionnaireEditView.vue';
import QuestionnaireResultsView from '../views/QuestionnaireResultsView.vue';
import StudentProjectsView from '../views/StudentProjectsView.vue';
import StudentEvaluationView from '../views/StudentEvaluationView.vue';
import StudentQuestionnairesView from '../views/StudentQuestionnairesView.vue';
import QuestionnaireResponseView from '../views/QuestionnaireResponseView.vue';

const routes = [
  { path: '/login', name: 'login', component: LoginView },

  // Rutes de professor
  { path: '/', name: 'dashboard', component: TeacherDashboardView, meta: { role: 'teacher' } },
  { path: '/courses', name: 'courses', component: CoursesView, meta: { role: 'teacher' } },
  { path: '/courses/:courseId/students', name: 'course-students', component: CourseStudentsView, meta: { role: 'teacher' } },
  { path: '/projects', name: 'projects', component: ProjectsView, meta: { role: 'teacher' } },
  { path: '/projects/:projectId/groups', name: 'project-groups', component: ProjectGroupsView, meta: { role: 'teacher' } },
  { path: '/projects/:projectId/results', name: 'project-results', component: ProjectResultsView, meta: { role: 'teacher' } },
  { path: '/questionnaires', name: 'questionnaires', component: QuestionnairesView, meta: { role: 'teacher' } },
  { path: '/questionnaires/:id/edit', name: 'questionnaire-edit', component: QuestionnaireEditView, meta: { role: 'teacher' } },
  { path: '/questionnaires/:id/results', name: 'questionnaire-results', component: QuestionnaireResultsView, meta: { role: 'teacher' } },

  // Rutes d'alumne
  { path: '/my-projects', name: 'my-projects', component: StudentProjectsView, meta: { role: 'student' } },
  { path: '/projects/:projectId/evaluate', name: 'evaluate', component: StudentEvaluationView, meta: { role: 'student' } },
  { path: '/my-questionnaires', name: 'my-questionnaires', component: StudentQuestionnairesView, meta: { role: 'student' } },
  { path: '/questionnaires/:id/respond', name: 'questionnaire-respond', component: QuestionnaireResponseView, meta: { role: 'student' } },
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
