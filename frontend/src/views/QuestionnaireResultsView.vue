<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { api, downloadFile } from '../api.js';

const route = useRoute();
const qId = Number(route.params.id);

const questionnaire = ref(null);
const rows = ref([]);
const error = ref('');
const filterName = ref('');
const onlyNotResponded = ref(false);
const sortBy = ref('name');
const sortDir = ref(1);

const statusLabels = { draft: 'Esborrany', open: 'Obert', closed: 'Tancat' };

onMounted(async () => {
  try {
    const data = await api.get(`/questionnaires/${qId}/results`);
    questionnaire.value = data.questionnaire;
    rows.value = data.rows;
  } catch (e) {
    error.value = e.message;
  }
});

const filtered = computed(() => {
  let r = rows.value;
  if (filterName.value) {
    const q = filterName.value.toLowerCase();
    r = r.filter((row) => row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q));
  }
  if (onlyNotResponded.value) r = r.filter((row) => !row.hasResponded);
  return [...r].sort((a, b) => {
    const va = a[sortBy.value];
    const vb = b[sortBy.value];
    if (va === null) return 1;
    if (vb === null) return -1;
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return cmp * sortDir.value;
  });
});

function setSort(key) {
  if (sortBy.value === key) sortDir.value *= -1;
  else { sortBy.value = key; sortDir.value = 1; }
}

function fmt(v) {
  return v === null || v === undefined ? 'Sense dades' : String(v).replace('.', ',');
}

async function exportCsv() {
  error.value = '';
  try {
    await downloadFile(`/questionnaires/${qId}/results/export.csv`, `resultats-questionnaire-${qId}.csv`);
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'questionnaires' }">&larr; Tornar als qüestionaris</RouterLink></p>
    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <template v-if="questionnaire">
      <div class="flex flex-between">
        <div>
          <h1>Resultats: {{ questionnaire.name }}</h1>
          <p class="muted">
            {{ questionnaire.course?.name }} ·
            <span :class="`badge badge-${questionnaire.status === 'open' ? 'open' : questionnaire.status === 'draft' ? 'draft' : 'closed'}`">
              {{ statusLabels[questionnaire.status] }}
            </span>
          </p>
        </div>
        <button class="btn" @click="exportCsv">Exportar CSV</button>
      </div>

      <div class="card">
        <div class="flex" style="margin-bottom: 1rem">
          <input v-model="filterName" placeholder="Cerca per nom o correu" style="max-width: 260px" />
          <label class="flex" style="margin: 0; font-weight: normal">
            <input v-model="onlyNotResponded" type="checkbox" style="width: auto" />
            Només qui no ha respost
          </label>
        </div>

        <p v-if="filtered.length === 0" class="muted">Cap resultat amb aquests filtres.</p>
        <table v-else>
          <thead>
            <tr>
              <th style="cursor: pointer" @click="setSort('name')">Nom</th>
              <th>Correu</th>
              <th class="text-right" style="cursor: pointer" @click="setSort('selfScore')">
                Nota autoavaluació
              </th>
              <th class="text-right" style="cursor: pointer" @click="setSort('itemScore')">
                Nota ítems fets
              </th>
              <th>Ha respost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filtered" :key="row.userId">
              <td>{{ row.name }}</td>
              <td class="muted">{{ row.email }}</td>
              <td class="text-right">{{ fmt(row.selfScore) }}</td>
              <td class="text-right">{{ fmt(row.itemScore) }}</td>
              <td>
                <span :class="row.hasResponded ? 'badge badge-open' : 'badge badge-closed'">
                  {{ row.hasResponded ? 'Sí' : 'No' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="questionnaire.items?.length > 0" class="card" style="margin-top: 1.5rem; background: var(--color-bg)">
          <h2>Ítems i pesos</h2>
          <table>
            <thead><tr><th>Criteri / funcionalitat</th><th class="text-right">% nota</th><th class="text-right">Nota equiv.</th></tr></thead>
            <tbody>
              <tr v-for="item in questionnaire.items" :key="item.id">
                <td>{{ item.label }}</td>
                <td class="text-right">{{ item.weight }}%</td>
                <td class="text-right muted">{{ (Number(item.weight) / 10).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
