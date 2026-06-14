<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api.js';

const questionnaires = ref([]);
const error = ref('');
const loaded = ref(false);

onMounted(async () => {
  try {
    const data = await api.get('/questionnaires/student/my-questionnaires');
    questionnaires.value = data.questionnaires;
  } catch (e) {
    error.value = e.message;
  } finally {
    loaded.value = true;
  }
});
</script>

<template>
  <div class="container">
    <h1>Les meves pràctiques</h1>
    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <p v-if="loaded && questionnaires.length === 0" class="card muted">
      Ara mateix no hi ha cap qüestionari de pràctiques obert per als teus cursos.
    </p>

    <div class="grid grid-2">
      <div v-for="q in questionnaires" :key="q.id" class="card">
        <h2>{{ q.name }}</h2>
        <p class="muted">{{ q.course?.name }}</p>
        <p v-if="q.description">{{ q.description }}</p>

        <div v-if="q.status === 'open'">
          <span v-if="q.hasResponded" class="badge badge-open" style="margin-bottom: 0.5rem; display: inline-block">
            Respost
          </span>
          <span v-else class="badge badge-closed" style="margin-bottom: 0.5rem; display: inline-block">
            Pendent
          </span>
          <p>
            <RouterLink class="btn" :to="{ name: 'questionnaire-respond', params: { id: q.id } }">
              {{ q.hasResponded ? 'Modificar la meva resposta' : 'Respondre el qüestionari' }}
            </RouterLink>
          </p>
        </div>
        <div v-else>
          <span class="badge badge-closed">Tancat</span>
          <p v-if="q.hasResponded">
            <RouterLink class="btn btn-secondary" :to="{ name: 'questionnaire-respond', params: { id: q.id } }">
              Veure la meva resposta
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
