<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api.js';
import EvaluationForm from '../components/EvaluationForm.vue';

const route = useRoute();
const projectId = Number(route.params.projectId);

const project = ref(null);
const group = ref(null);
const initialScores = ref({});
const alreadyVoted = ref(false);
const error = ref('');
const success = ref('');
const saving = ref(false);
const loaded = ref(false);

async function load() {
  try {
    const data = await api.get(`/projects/${projectId}/my-group`);
    project.value = data.project;
    group.value = data.group;

    const mine = await api.get(`/projects/${projectId}/my-evaluations`);
    const scores = {};
    for (const evaluation of mine.evaluations) {
      scores[evaluation.evaluatedUserId] = evaluation.score;
    }
    initialScores.value = scores;
    alreadyVoted.value = mine.evaluations.length >= data.group.members.length && data.group.members.length > 0;
  } catch (e) {
    error.value = e.message;
  } finally {
    loaded.value = true;
  }
}

async function save(evaluations) {
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    await api.post(`/projects/${projectId}/my-evaluations`, { evaluations });
    success.value = 'Has guardat correctament les valoracions.';
    alreadyVoted.value = true;
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'my-projects' }">&larr; Els meus projectes</RouterLink></p>
    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <template v-if="project && group">
      <h1>{{ project.name }}</h1>
      <p class="muted">El teu grup: <strong>{{ group.name }}</strong></p>

      <p v-if="project.status === 'draft'" class="alert alert-info">La votació encara no està oberta.</p>
      <p v-else-if="project.status !== 'open'" class="alert alert-info">
        La votació està tancada. Ja no pots modificar les teves valoracions.
      </p>
      <template v-else>
        <p v-if="alreadyVoted" class="alert alert-success">
          Ja has completat la votació. Pots modificar les valoracions mentre la votació estigui oberta.
        </p>
        <p v-else class="alert alert-warning">Encara no has completat la votació.</p>
      </template>

      <p v-if="success" class="alert alert-success">{{ success }}</p>

      <div class="card">
        <h2>Valoracions</h2>
        <p class="muted">
          Posa una nota de 0 a 10 a tu mateix (autoavaluació) i a cada company del grup (coavaluació).
        </p>
        <EvaluationForm
          :members="group.members"
          :score-decimals="project.scoreDecimals"
          :initial-scores="initialScores"
          :disabled="project.status !== 'open'"
          :saving="saving"
          @submit="save"
        />
      </div>
    </template>

    <p v-else-if="loaded && !error" class="card muted">No s'ha pogut carregar el projecte.</p>
  </div>
</template>
