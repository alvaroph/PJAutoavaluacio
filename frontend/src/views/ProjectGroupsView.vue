<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api.js';
import GroupCard from '../components/GroupCard.vue';

const route = useRoute();
const projectId = Number(route.params.projectId);

const project = ref(null);
const groups = ref([]);
const unassigned = ref([]);
const error = ref('');
const message = ref('');
const newGroupName = ref('');

async function load() {
  try {
    const [p, g] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/groups`),
    ]);
    project.value = p.project;
    groups.value = g.groups;
    unassigned.value = g.unassignedStudents;
  } catch (e) {
    error.value = e.message;
  }
}

async function run(action) {
  error.value = '';
  try {
    await action();
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

function createGroup() {
  const name = newGroupName.value.trim() || `Grup ${groups.value.length + 1}`;
  run(() => api.post(`/projects/${projectId}/groups`, { name }));
  newGroupName.value = '';
}

const renameGroup = (group, name) => run(() => api.put(`/groups/${group.id}`, { name }));
const addMember = (group, userId) => run(() => api.post(`/groups/${group.id}/members`, { userId }));
const removeMember = (group, member) => run(() => api.delete(`/groups/${group.id}/members/${member.id}`));

function removeGroup(group) {
  if (!confirm(`Vols eliminar «${group.name}»?`)) return;
  run(() => api.delete(`/groups/${group.id}`));
}

async function toggleEnrollment() {
  const newValue = !project.value.enrollmentOpen;
  const action = newValue ? 'obrir' : 'tancar';
  if (!confirm(`Vols ${action} la inscripció de grups? ${newValue ? 'Els alumnes podran afegir-se als grups.' : 'Els grups quedaran congelats i cap alumne podrà modificar la seva assignació.'}`)) return;
  error.value = '';
  message.value = '';
  try {
    const res = await api.patch(`/projects/${projectId}/enrollment`, { enrollmentOpen: newValue });
    project.value = res.project;
    message.value = newValue
      ? 'Inscripció oberta. Els alumnes ja es poden afegir als grups.'
      : 'Inscripció tancada. Els grups estan congelats.';
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'projects' }">&larr; Tornar als projectes</RouterLink></p>
    <div v-if="project" class="flex flex-between" style="align-items: center;">
      <h1>Grups de «{{ project.name }}»</h1>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span :class="`badge badge-${project.enrollmentOpen ? 'open' : 'closed'}`">
          Inscripció {{ project.enrollmentOpen ? 'oberta' : 'tancada' }}
        </span>
        <button
          :class="project.enrollmentOpen ? 'btn btn-danger btn-sm' : 'btn btn-sm'"
          @click="toggleEnrollment"
        >
          {{ project.enrollmentOpen ? 'Tancar inscripció' : 'Obrir inscripció' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <p v-if="message" class="alert alert-success">{{ message }}</p>

    <p v-if="unassigned.length > 0" class="alert alert-warning">
      Hi ha {{ unassigned.length }} alumne(s) del curs sense grup.
    </p>
    <p v-else-if="groups.length > 0" class="alert alert-success">
      Tots els alumnes del curs tenen grup assignat.
    </p>

    <div class="grid" style="grid-template-columns: 280px 1fr; align-items: start">
      <div class="card">
        <h2>Sense grup ({{ unassigned.length }})</h2>
        <p v-if="unassigned.length === 0" class="muted">Cap alumne pendent.</p>
        <ul v-else style="margin: 0; padding-left: 1.2rem">
          <li v-for="student in unassigned" :key="student.id">{{ student.name }}</li>
        </ul>
        <hr style="border: none; border-top: 1px solid var(--color-border); margin: 1rem 0" />
        <div class="form-row">
          <label>Nou grup</label>
          <input v-model="newGroupName" :placeholder="`Grup ${groups.length + 1}`" @keyup.enter="createGroup" />
        </div>
        <button class="btn" @click="createGroup">Crear grup</button>
      </div>

      <div>
        <p v-if="groups.length === 0" class="card muted">Encara no hi ha grups. Crea el primer grup.</p>
        <GroupCard
          v-for="group in groups"
          :key="group.id"
          :group="group"
          :unassigned-students="unassigned"
          @rename="renameGroup"
          @remove="removeGroup"
          @add-member="addMember"
          @remove-member="removeMember"
        />
      </div>
    </div>
  </div>
</template>
