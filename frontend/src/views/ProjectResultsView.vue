<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api, downloadFile } from '../api.js';
import ResultsTable from '../components/ResultsTable.vue';

const route = useRoute();
const projectId = Number(route.params.projectId);

const project = ref(null);
const results = ref([]);
const error = ref('');

const statusLabels = { draft: 'Esborrany', open: 'Votació oberta', closed: 'Votació tancada', archived: 'Arxivat' };

onMounted(async () => {
  try {
    const data = await api.get(`/projects/${projectId}/results`);
    project.value = data.project;
    results.value = data.results;
  } catch (e) {
    error.value = e.message;
  }
});

async function exportCsv() {
  error.value = '';
  try {
    await downloadFile(`/projects/${projectId}/results/export.csv`, `resultats-${project.value?.name || projectId}.csv`);
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'projects' }">&larr; Tornar als projectes</RouterLink></p>
    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <template v-if="project">
      <div class="flex flex-between">
        <div>
          <h1>Resultats de «{{ project.name }}»</h1>
          <p class="muted">
            {{ project.course.name }} ·
            <span :class="`badge badge-${project.status}`">{{ statusLabels[project.status] }}</span>
          </p>
        </div>
        <button class="btn" @click="exportCsv">Exportar CSV</button>
      </div>

      <div class="card">
        <p v-if="results.length === 0" class="muted">
          Encara no hi ha resultats. Comprova que el projecte té grups amb alumnes.
        </p>
        <ResultsTable v-else :results="results" />
      </div>
    </template>
  </div>
</template>
