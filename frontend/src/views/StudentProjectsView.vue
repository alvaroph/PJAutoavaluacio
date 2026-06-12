<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api.js';

const projects = ref([]);
const error = ref('');
const loaded = ref(false);

onMounted(async () => {
  try {
    const data = await api.get('/my-projects');
    projects.value = data.projects;
  } catch (e) {
    error.value = e.message;
  } finally {
    loaded.value = true;
  }
});
</script>

<template>
  <div class="container">
    <h1>Els meus projectes</h1>
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
