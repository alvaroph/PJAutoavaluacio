<script setup>
import { onMounted, ref, watch } from 'vue';
import { api } from '../api.js';
import FilterBar from '../components/FilterBar.vue';

const allQuestionnaires = ref([]);
const questionnaires = ref([]);
const courses = ref([]);
const error = ref('');
const showForm = ref(false);
const saving = ref(false);

const filters = ref({ courseId: '', status: '', search: '' });

const form = ref({ courseId: '', name: '', description: '' });
const statusLabels = { draft: 'Esborrany', open: 'Obert', closed: 'Tancat' };
const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

async function load() {
  try {
    const [q, c] = await Promise.all([api.get('/questionnaires'), api.get('/courses')]);
    allQuestionnaires.value = q.questionnaires;
    courses.value = c.courses.filter((c) => c.status === 'active');
    applyFilters();
  } catch (e) {
    error.value = e.message;
  }
}

function applyFilters() {
  let result = allQuestionnaires.value;
  const { courseId, status, search } = filters.value;
  if (courseId) result = result.filter((q) => q.courseId === Number(courseId));
  if (status) result = result.filter((q) => q.status === status);
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (q) => q.name.toLowerCase().includes(s) || (q.description || '').toLowerCase().includes(s),
    );
  }
  questionnaires.value = result;
}

watch(filters, applyFilters, { deep: true });

async function create() {
  saving.value = true;
  error.value = '';
  try {
    await api.post('/questionnaires', { ...form.value, courseId: Number(form.value.courseId) });
    form.value = { courseId: '', name: '', description: '' };
    showForm.value = false;
    await load();
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function changeStatus(q, action) {
  error.value = '';
  try {
    await api.post(`/questionnaires/${q.id}/${action}`);
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <div class="flex flex-between">
      <h1>Qüestionaris de pràctiques</h1>
      <button class="btn" @click="showForm = !showForm">
        {{ showForm ? 'Cancel·lar' : 'Nou qüestionari' }}
      </button>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div v-if="showForm" class="card">
      <h2>Nou qüestionari</h2>
      <form @submit.prevent="create">
        <div class="form-row">
          <label>Curs</label>
          <select v-model="form.courseId" required>
            <option value="" disabled>Tria un curs</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }} ({{ c.academicYear }})</option>
          </select>
        </div>
        <div class="form-row">
          <label>Nom de la pràctica</label>
          <input v-model="form.name" placeholder="Pràctica 1 – CRUD bàsic" required />
        </div>
        <div class="form-row">
          <label>Descripció (opcional)</label>
          <textarea v-model="form.description" rows="2"></textarea>
        </div>
        <button class="btn" type="submit" :disabled="saving">Crear</button>
      </form>
    </div>

    <div class="card">
      <FilterBar
        v-model="filters"
        :courses="courses"
        :statuses="statusOptions"
      />

      <p v-if="allQuestionnaires.length > 0 && questionnaires.length === 0" class="muted">
        No s'han trobat pràctiques amb aquests filtres.
      </p>
      <p v-else-if="allQuestionnaires.length === 0" class="muted">Encara no hi ha cap qüestionari.</p>
      <table v-else>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Curs</th>
            <th>Ítems</th>
            <th>Respostes</th>
            <th>Estat</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="q in questionnaires" :key="q.id">
            <td><strong>{{ q.name }}</strong></td>
            <td>{{ q.course?.name }}</td>
            <td>{{ q._count?.items ?? 0 }}</td>
            <td>{{ q._count?.responses ?? 0 }}</td>
            <td>
              <span :class="`badge badge-${q.status === 'open' ? 'open' : q.status === 'draft' ? 'draft' : 'closed'}`">
                {{ statusLabels[q.status] }}
              </span>
            </td>
            <td class="text-right">
              <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'questionnaire-edit', params: { id: q.id } }">
                Editar
              </RouterLink>
              <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'questionnaire-results', params: { id: q.id } }">
                Resultats
              </RouterLink>
              <button v-if="q.status === 'draft' || q.status === 'closed'" class="btn btn-sm" @click="changeStatus(q, 'open')">
                Obrir
              </button>
              <button v-if="q.status === 'open'" class="btn btn-danger btn-sm" @click="changeStatus(q, 'close')">
                Tancar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
