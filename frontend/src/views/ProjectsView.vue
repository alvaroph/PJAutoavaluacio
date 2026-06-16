<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { api } from '../api.js';
import FilterBar from '../components/FilterBar.vue';

const projects = ref([]);
const allProjects = ref([]);
const courses = ref([]);
const error = ref('');
const message = ref('');
const showForm = ref(false);
const saving = ref(false);
const form = ref({ courseId: '', name: '', description: '', scoreDecimals: 1 });

const filters = ref({ courseId: '', status: '', search: '' });

const statusLabels = { draft: 'Esborrany', open: 'Votació oberta', closed: 'Votació tancada', archived: 'Arxivat' };
const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

const enrollmentLabels = { true: 'Inscripció oberta', false: 'Inscripció tancada' };

async function load() {
  try {
    const [p, c] = await Promise.all([api.get('/projects'), api.get('/courses')]);
    allProjects.value = p.projects;
    courses.value = c.courses.filter((course) => course.status === 'active');
    applyFilters();
  } catch (e) {
    error.value = e.message;
  }
}

function applyFilters() {
  let result = allProjects.value;
  const { courseId, status, search } = filters.value;
  if (courseId) result = result.filter((p) => p.courseId === Number(courseId));
  if (status) result = result.filter((p) => p.status === status);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q),
    );
  }
  projects.value = result;
}

watch(filters, applyFilters, { deep: true });

async function createProject() {
  saving.value = true;
  error.value = '';
  try {
    await api.post('/projects', { ...form.value, courseId: Number(form.value.courseId) });
    form.value = { courseId: '', name: '', description: '', scoreDecimals: 1 };
    showForm.value = false;
    await load();
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function openVoting(project, force = false) {
  error.value = '';
  message.value = '';
  try {
    await api.post(`/projects/${project.id}/open`, force ? { force: true } : {});
    message.value = `Votació oberta per a «${project.name}».`;
    await load();
  } catch (e) {
    if (e.data?.requiresConfirmation) {
      if (confirm(`${e.message}\n\nVols obrir la votació igualment?`)) {
        return openVoting(project, true);
      }
    } else {
      error.value = e.message;
    }
  }
}

async function closeVoting(project) {
  if (!confirm(`Vols tancar la votació de «${project.name}»? Els alumnes ja no podran modificar les seves valoracions.`)) return;
  error.value = '';
  try {
    await api.post(`/projects/${project.id}/close`);
    message.value = `Votació tancada per a «${project.name}».`;
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

async function archiveProject(project) {
  try {
    await api.put(`/projects/${project.id}`, { status: 'archived' });
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

async function toggleEnrollment(project) {
  const newValue = !project.enrollmentOpen;
  const action = newValue ? 'obrir' : 'tancar';
  if (!confirm(`Vols ${action} la inscripció de grups per a «${project.name}»?`)) return;
  error.value = '';
  try {
    await api.patch(`/projects/${project.id}/enrollment`, { enrollmentOpen: newValue });
    message.value = newValue
      ? `Inscripció de grups oberta per a «${project.name}».`
      : `Inscripció de grups tancada per a «${project.name}». Els grups queden congelats.`;
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
      <h1>Projectes</h1>
      <button class="btn" @click="showForm = !showForm">
        {{ showForm ? 'Cancel·lar' : 'Crear projecte' }}
      </button>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <p v-if="message" class="alert alert-success">{{ message }}</p>

    <div v-if="showForm" class="card">
      <h2>Nou projecte</h2>
      <form @submit.prevent="createProject">
        <div class="form-row">
          <label>Curs</label>
          <select v-model="form.courseId" required>
            <option value="" disabled>Tria un curs</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }} ({{ course.academicYear }})
            </option>
          </select>
        </div>
        <div class="form-row">
          <label>Nom</label>
          <input v-model="form.name" placeholder="Projecte intermodular DAW" required />
        </div>
        <div class="form-row">
          <label>Descripció (opcional)</label>
          <textarea v-model="form.description" rows="2"></textarea>
        </div>
        <div class="form-row">
          <label>Decimals de les notes</label>
          <select v-model.number="form.scoreDecimals">
            <option :value="0">Notes enteres (8)</option>
            <option :value="1">Un decimal (7,5)</option>
            <option :value="2">Dos decimals (7,25)</option>
          </select>
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

      <p v-if="allProjects.length > 0 && projects.length === 0" class="muted">
        No s'han trobat projectes amb aquests filtres.
      </p>
      <p v-else-if="allProjects.length === 0" class="muted">Encara no hi ha cap projecte.</p>
      <table v-else>
        <thead>
          <tr>
            <th>Projecte</th>
            <th>Curs</th>
            <th>Grups</th>
            <th>Estat</th>
            <th>Inscripció</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in projects" :key="project.id">
            <td>
              <strong>{{ project.name }}</strong>
              <div v-if="project.description" class="muted">{{ project.description }}</div>
            </td>
            <td>{{ project.course.name }}</td>
            <td>{{ project._count.groups }}</td>
            <td><span :class="`badge badge-${project.status}`">{{ statusLabels[project.status] }}</span></td>
            <td>
              <span :class="`badge badge-${project.enrollmentOpen ? 'open' : 'closed'}`">
                {{ project.enrollmentOpen ? 'Oberta' : 'Tancada' }}
              </span>
            </td>
            <td class="text-right">
              <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'project-groups', params: { projectId: project.id } }">
                Grups
              </RouterLink>
              <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'project-results', params: { projectId: project.id } }">
                Resultats
              </RouterLink>
              <button
                :class="project.enrollmentOpen ? 'btn btn-danger btn-sm' : 'btn btn-secondary btn-sm'"
                @click="toggleEnrollment(project)"
              >
                {{ project.enrollmentOpen ? 'Tancar inscripció' : 'Obrir inscripció' }}
              </button>
              <button v-if="project.status === 'draft' || project.status === 'closed'" class="btn btn-sm" @click="openVoting(project)">
                Obrir votació
              </button>
              <button v-if="project.status === 'open'" class="btn btn-danger btn-sm" @click="closeVoting(project)">
                Tancar votació
              </button>
              <button v-if="project.status === 'closed'" class="btn btn-secondary btn-sm" @click="archiveProject(project)">
                Arxivar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
