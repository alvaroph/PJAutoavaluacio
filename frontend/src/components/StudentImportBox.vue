<script setup>
import { ref } from 'vue';
import { api } from '../api.js';

const props = defineProps({
  courseId: { type: [Number, String], required: true },
});
const emit = defineEmits(['imported']);

const text = ref('');
const preview = ref(null);
const error = ref('');
const success = ref('');
const busy = ref(false);

async function doPreview() {
  error.value = '';
  success.value = '';
  busy.value = true;
  try {
    preview.value = await api.post(`/courses/${props.courseId}/students/import-preview`, { text: text.value });
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}

async function doConfirm() {
  error.value = '';
  busy.value = true;
  try {
    const result = await api.post(`/courses/${props.courseId}/students/import-confirm`, { text: text.value });
    success.value = `Importats ${result.imported} alumnes (${result.skipped} omesos).`;
    text.value = '';
    preview.value = null;
    emit('imported');
  } catch (e) {
    error.value = e.message;
    if (e.data?.rows) preview.value = { rows: e.data.rows, summary: null };
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="card">
    <h2>Importar alumnes</h2>
    <p class="muted">
      Enganxa un llistat amb una línia per alumne: <code>Nom Cognoms;correu@inspedralbes.cat</code>
      (també s'accepta separat per tabulació).
    </p>

    <div class="form-row">
      <textarea v-model="text" rows="8" placeholder="Maria Garcia;maria.garcia@inspedralbes.cat&#10;Joan Puig;joan.puig@inspedralbes.cat"></textarea>
    </div>

    <div class="flex">
      <button class="btn btn-secondary" :disabled="busy || !text.trim()" @click="doPreview">Previsualitzar</button>
      <button
        class="btn"
        :disabled="busy || !preview || preview.summary?.errors > 0 || preview.summary?.ok === 0"
        @click="doConfirm"
      >
        Confirmar importació
      </button>
    </div>

    <p v-if="error" class="alert alert-error" style="margin-top: 1rem">{{ error }}</p>
    <p v-if="success" class="alert alert-success" style="margin-top: 1rem">{{ success }}</p>

    <div v-if="preview" style="margin-top: 1rem">
      <p v-if="preview.summary" class="muted">
        {{ preview.summary.ok }} correctes ·
        {{ preview.summary.warnings }} avisos ·
        {{ preview.summary.errors }} errors
      </p>
      <p v-if="preview.summary?.errors > 0" class="alert alert-warning">
        Corregeix les línies amb error al quadre de text i torna a previsualitzar.
      </p>
      <table>
        <thead>
          <tr><th>Línia</th><th>Nom</th><th>Correu</th><th>Estat</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in preview.rows" :key="row.line">
            <td>{{ row.line }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.email }}</td>
            <td>
              <span v-if="row.status === 'ok'" class="badge badge-open">OK</span>
              <span v-else-if="row.status === 'warning'" class="badge badge-draft">{{ row.message }}</span>
              <span v-else class="badge badge-closed">{{ row.message }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
