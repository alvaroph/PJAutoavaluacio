<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api.js';

const courses = ref([]);
const projects = ref([]);
const error = ref('');

onMounted(async () => {
  try {
    const [c, p] = await Promise.all([api.get('/courses'), api.get('/projects')]);
    courses.value = c.courses.filter((course) => course.status === 'active');
    projects.value = p.projects.slice(0, 6);
  } catch (e) {
    error.value = e.message;
  }
});

const statusLabels = { draft: 'Esborrany', open: 'Votació oberta', closed: 'Votació tancada', archived: 'Arxivat' };
</script>

<template>
  <div class="container">
    <h1>Panell del professor</h1>
    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div class="card">
      <h2>Accessos ràpids</h2>
      <div class="flex">
        <RouterLink class="btn" :to="{ name: 'courses' }">Gestionar cursos</RouterLink>
        <RouterLink class="btn" :to="{ name: 'projects' }">Gestionar projectes</RouterLink>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <h2>Cursos actius</h2>
        <p v-if="courses.length === 0" class="muted">Encara no hi ha cursos. Crea'n un des de «Gestionar cursos».</p>
        <table v-else>
          <tbody>
            <tr v-for="course in courses" :key="course.id">
              <td>
                <strong>{{ course.name }}</strong>
                <span class="muted"> · {{ course.academicYear }}</span>
              </td>
              <td class="text-right">
                <RouterLink :to="{ name: 'course-students', params: { courseId: course.id } }">
                  {{ course._count.students }} alumnes
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2>Projectes recents</h2>
        <p v-if="projects.length === 0" class="muted">Encara no hi ha projectes.</p>
        <table v-else>
          <tbody>
            <tr v-for="project in projects" :key="project.id">
              <td>
                <strong>{{ project.name }}</strong>
                <span class="muted"> · {{ project.course.name }}</span>
              </td>
              <td><span :class="`badge badge-${project.status}`">{{ statusLabels[project.status] }}</span></td>
              <td class="text-right">
                <RouterLink :to="{ name: 'project-results', params: { projectId: project.id } }">Resultats</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
