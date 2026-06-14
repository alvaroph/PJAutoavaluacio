<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api.js';

const route = useRoute();
const qId = Number(route.params.id);

const questionnaire = ref(null);
const error = ref('');
const message = ref('');
const newItem = ref({ label: '', weight: '' });
const addingItem = ref(false);

const totalWeight = computed(() =>
  (questionnaire.value?.items || []).reduce((s, i) => s + Number(i.weight), 0)
);
const weightOk = computed(() => Math.abs(totalWeight.value - 100) <= 1);

async function load() {
  try {
    const data = await api.get(`/questionnaires/${qId}`);
    questionnaire.value = data.questionnaire;
  } catch (e) {
    error.value = e.message;
  }
}

async function run(action) {
  error.value = '';
  message.value = '';
  try {
    await action();
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

async function addItem() {
  if (!newItem.value.label.trim() || newItem.value.weight === '') return;
  addingItem.value = true;
  await run(() =>
    api.post(`/questionnaires/${qId}/items`, {
      label: newItem.value.label.trim(),
      weight: Number(newItem.value.weight),
    })
  );
  newItem.value = { label: '', weight: '' };
  addingItem.value = false;
}

async function removeItem(item) {
  if (!confirm(`Eliminar «${item.label}»?`)) return;
  await run(() => api.delete(`/questionnaires/items/${item.id}`));
}

async function updateItemLabel(item, label) {
  if (!label.trim() || label === item.label) return;
  await run(() => api.put(`/questionnaires/items/${item.id}`, { label }));
}

async function updateItemWeight(item, weight) {
  const w = Number(weight);
  if (!Number.isFinite(w) || w === Number(item.weight)) return;
  await run(() => api.put(`/questionnaires/items/${item.id}`, { weight: w }));
}

async function changeStatus(action) {
  await run(async () => {
    await api.post(`/questionnaires/${qId}/${action}`);
    message.value = action === 'open' ? 'Qüestionari obert.' : 'Qüestionari tancat.';
  });
}

onMounted(load);
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'questionnaires' }">&larr; Tornar als qüestionaris</RouterLink></p>
    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <p v-if="message" class="alert alert-success">{{ message }}</p>

    <template v-if="questionnaire">
      <div class="flex flex-between">
        <div>
          <h1>{{ questionnaire.name }}</h1>
          <p class="muted">{{ questionnaire.course?.name }}</p>
        </div>
        <div class="flex">
          <RouterLink class="btn btn-secondary" :to="{ name: 'questionnaire-results', params: { id: qId } }">
            Veure resultats
          </RouterLink>
          <button
            v-if="questionnaire.status === 'draft' || questionnaire.status === 'closed'"
            class="btn"
            :disabled="!weightOk || questionnaire.items.length === 0"
            @click="changeStatus('open')"
          >
            Obrir
          </button>
          <button v-if="questionnaire.status === 'open'" class="btn btn-danger" @click="changeStatus('close')">
            Tancar
          </button>
        </div>
      </div>

      <div v-if="questionnaire.status !== 'draft'" class="alert alert-info">
        El qüestionari {{ questionnaire.status === 'open' ? 'està obert' : 'està tancat' }}.
        {{ questionnaire.status === 'draft' ? '' : 'Els ítems no es poden modificar mentre no sigui un esborrany.' }}
      </div>

      <div class="card">
        <div class="flex flex-between">
          <h2>Ítems de la pràctica</h2>
          <span :class="weightOk ? 'badge badge-open' : 'badge badge-closed'">
            Total: {{ totalWeight.toFixed(1) }}% / 100%
          </span>
        </div>
        <p class="muted">
          Cada ítem té un % de la nota final. L'alumne <strong>no veu</strong> el %, només la descripció.
        </p>

        <p v-if="questionnaire.items.length === 0" class="muted">Afegeix el primer ítem.</p>
        <table v-else>
          <thead>
            <tr>
              <th style="width: 60%">Descripció de la funcionalitat</th>
              <th style="width: 15%">% nota</th>
              <th>Nota equiv.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in questionnaire.items" :key="item.id">
              <td>
                <input
                  :value="item.label"
                  :disabled="questionnaire.status !== 'draft'"
                  style="width: 100%"
                  @blur="updateItemLabel(item, $event.target.value)"
                />
              </td>
              <td>
                <input
                  :value="item.weight"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  :disabled="questionnaire.status !== 'draft'"
                  style="width: 80px"
                  @blur="updateItemWeight(item, $event.target.value)"
                />
              </td>
              <td class="muted text-right">{{ (Number(item.weight) / 10).toFixed(2) }}</td>
              <td class="text-right">
                <button
                  v-if="questionnaire.status === 'draft'"
                  class="btn btn-danger btn-sm"
                  @click="removeItem(item)"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="questionnaire.status === 'draft'" class="flex" style="margin-top: 1rem; gap: 0.5rem">
          <input v-model="newItem.label" placeholder="Descripció del criteri o funcionalitat" style="flex: 1" />
          <input
            v-model="newItem.weight"
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="% (p. ex. 20)"
            style="width: 110px"
          />
          <button
            class="btn"
            :disabled="addingItem || !newItem.label.trim() || newItem.weight === ''"
            @click="addItem"
          >
            Afegir
          </button>
        </div>

        <p v-if="!weightOk && questionnaire.items.length > 0" class="alert alert-warning" style="margin-top: 0.75rem">
          La suma dels % ha de ser exactament 100 per poder obrir el qüestionari (ara: {{ totalWeight.toFixed(1) }}%).
        </p>
      </div>
    </template>
  </div>
</template>
