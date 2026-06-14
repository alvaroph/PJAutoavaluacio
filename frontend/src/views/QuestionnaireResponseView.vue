<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api.js';

const route = useRoute();
const qId = Number(route.params.id);

const questionnaire = ref(null);
const selfScore = ref('');
const itemChecks = ref({});   // itemId -> boolean
const saving = ref(false);
const error = ref('');
const success = ref('');
const loaded = ref(false);

onMounted(async () => {
  try {
    const data = await api.get(`/questionnaires/${qId}/my-response`);
    questionnaire.value = data.questionnaire;

    // Inicialitza els checks amb la resposta anterior (si n'hi ha)
    for (const item of data.questionnaire.items) {
      itemChecks.value[item.id] = false;
    }
    if (data.response) {
      selfScore.value = data.response.selfScore;
      for (const ir of data.response.items) {
        itemChecks.value[ir.itemId] = ir.done;
      }
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    loaded.value = true;
  }
});

async function submit() {
  const score = Number(selfScore.value);
  if (!Number.isFinite(score) || score < 0 || score > 10) {
    error.value = 'La nota d\'autoavaluació ha d\'estar entre 0 i 10';
    return;
  }
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    await api.post(`/questionnaires/${qId}/my-response`, {
      selfScore: score,
      items: questionnaire.value.items.map((item) => ({
        itemId: item.id,
        done: !!itemChecks.value[item.id],
      })),
    });
    success.value = 'Resposta guardada correctament.';
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'my-questionnaires' }">&larr; Les meves pràctiques</RouterLink></p>
    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <template v-if="questionnaire">
      <h1>{{ questionnaire.name }}</h1>
      <p class="muted">{{ questionnaire.course?.name }}</p>

      <p v-if="questionnaire.status !== 'open'" class="alert alert-info">
        El qüestionari està tancat. No pots modificar la teva resposta.
      </p>
      <p v-if="success" class="alert alert-success">{{ success }}</p>

      <form @submit.prevent="submit">
        <!-- Part 1: Autoavaluació -->
        <div class="card">
          <h2>1. Nota d'autoavaluació</h2>
          <p class="muted">Quina nota creus que et mereixes? (de 0 a 10)</p>
          <div style="max-width: 200px">
            <input
              v-model="selfScore"
              type="number"
              min="0"
              max="10"
              step="0.1"
              placeholder="7.5"
              :disabled="questionnaire.status !== 'open'"
              required
            />
          </div>
        </div>

        <!-- Part 2: Ítems fets -->
        <div class="card">
          <h2>2. Funcionalitats implementades</h2>
          <p class="muted">
            Marca el que has implementat. No sabràs el pes de cada apartat fins que el professor publiqui els resultats.
          </p>

          <div
            v-for="item in questionnaire.items"
            :key="item.id"
            class="item-row"
            :class="{ done: itemChecks[item.id] }"
          >
            <label class="item-label">
              <input
                v-model="itemChecks[item.id]"
                type="checkbox"
                :disabled="questionnaire.status !== 'open'"
                style="width: auto; margin-right: 0.6rem"
              />
              {{ item.label }}
            </label>
          </div>
        </div>

        <button
          v-if="questionnaire.status === 'open'"
          class="btn"
          type="submit"
          :disabled="saving || selfScore === ''"
        >
          {{ saving ? 'Guardant...' : 'Guardar resposta' }}
        </button>
      </form>
    </template>

    <p v-else-if="loaded && !error" class="card muted">No s'ha pogut carregar el qüestionari.</p>
  </div>
</template>

<style scoped>
.item-row {
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.4rem;
  border: 1px solid var(--color-border);
  transition: background 0.15s;
}
.item-row.done {
  background: #dcfce7;
  border-color: #86efac;
}
.item-label {
  display: flex;
  align-items: center;
  font-weight: normal;
  margin: 0;
  cursor: pointer;
}
</style>
