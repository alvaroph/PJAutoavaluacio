<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api.js';

const projects = ref([]);
const enrollmentProjects = ref([]);
const error = ref('');
const enrollError = ref('');
const loaded = ref(false);

onMounted(async () => {
  try {
    const [p, e] = await Promise.all([
      api.get('/my-projects'),
      api.get('/my-enrollment-projects'),
    ]);
    projects.value = p.projects;
    enrollmentProjects.value = e.projects;
  } catch (e) {
    error.value = e.message;
  } finally {
    loaded.value = true;
  }
});

async function join(project, groupId) {
  enrollError.value = '';
  try {
    await api.post(`/groups/${groupId}/join`, {});
    const res = await api.get('/my-enrollment-projects');
    enrollmentProjects.value = res.projects;
  } catch (e) {
    enrollError.value = e.message;
  }
}

async function leave(project, groupId) {
  enrollError.value = '';
  if (!confirm(`Vols abandonar el grup de «${project.name}»?`)) return;
  try {
    await api.delete(`/groups/${groupId}/leave`);
    const res = await api.get('/my-enrollment-projects');
    enrollmentProjects.value = res.projects;
  } catch (e) {
    enrollError.value = e.message;
  }
}
</script>

<template>
  <div class="container">
    <!-- SECCIÓ D'INSCRIPCIÓ A GRUPS -->
    <div v-if="enrollmentProjects.length > 0">
      <h1>Inscripció a grups</h1>
      <p v-if="enrollError" class="alert alert-error">{{ enrollError }}</p>

      <div v-for="project in enrollmentProjects" :key="project.id" class="card">
        <div class="flex flex-between" style="align-items: baseline;">
          <h2>{{ project.name }}</h2>
          <span class="muted">{{ project.course.name }}</span>
        </div>
        <p v-if="project.description" class="muted">{{ project.description }}</p>

        <div class="grid grid-2" style="margin-top: 0.75rem;">
          <div
            v-for="group in project.groups"
            :key="group.id"
            :class="['card', { 'card-highlight': project.myGroupId === group.id }]"
            style="margin: 0;"
          >
            <div class="flex flex-between" style="align-items: center;">
              <strong>{{ group.name }}</strong>
              <span class="badge badge-open" v-if="project.myGroupId === group.id">El teu grup</span>
            </div>
            <ul style="margin: 0.5rem 0; padding-left: 1.2rem;" v-if="group.members.length">
              <li v-for="m in group.members" :key="m.id">{{ m.name }}</li>
            </ul>
            <p v-else class="muted" style="font-size: 0.85rem;">Encara sense membres</p>
            <div style="margin-top: 0.5rem;">
              <button
                v-if="project.myGroupId === group.id"
                class="btn btn-danger btn-sm"
                @click="leave(project, group.id)"
              >
                Abandonar grup
              </button>
              <button
                v-else-if="project.myGroupId === null"
                class="btn btn-sm"
                @click="join(project, group.id)"
              >
                Unir-se
              </button>
            </div>
          </div>
        </div>
        <p v-if="project.groups.length === 0" class="muted">Encara no hi ha grups creats.</p>
      </div>
    </div>

    <!-- SECCIÓ DE PROJECTES ACTIUS (avaluació) -->
    <h1 :style="enrollmentProjects.length > 0 ? 'margin-top: 2rem;' : ''">Els meus projectes</h1>
    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <p v-if="loaded && projects.length === 0" class="card muted">
      Ara mateix no participes en cap projecte amb votació activa.
    </p>

    <div class="grid grid-2">
      <div v-for="project in projects" :key="project.id" class="card">
        <h2>{{ project.name }}</h2>
        <p class="muted">{{ project.course.name }} · {{ project.groupName }}</p>
        <p v-if="project.description">{{ project.description }}</p>
        <div v-if="project.status === 'open'">
          <span class="badge badge-open">Votació oberta</span>
          <p>
            <RouterLink class="btn" :to="{ name: 'evaluate', params: { projectId: project.id } }">
              Valorar el meu grup
            </RouterLink>
          </p>
        </div>
        <div v-else>
          <span class="badge badge-closed">Votació tancada</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-highlight {
  border: 2px solid var(--color-primary, #4f46e5);
}
</style>
