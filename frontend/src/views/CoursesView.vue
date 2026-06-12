<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api.js';

const courses = ref([]);
const error = ref('');
const showForm = ref(false);
const form = ref({ name: '', description: '', academicYear: '' });
const saving = ref(false);

async function load() {
  try {
    const data = await api.get('/courses');
    courses.value = data.courses;
  } catch (e) {
    error.value = e.message;
  }
}

async function createCourse() {
  saving.value = true;
  error.value = '';
  try {
    await api.post('/courses', form.value);
    form.value = { name: '', description: '', academicYear: '' };
    showForm.value = false;
    await load();
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function toggleArchive(course) {
  try {
    await api.put(`/courses/${course.id}`, {
      status: course.status === 'active' ? 'archived' : 'active',
    });
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
      <h1>Cursos</h1>
      <button class="btn" @click="showForm = !showForm">
        {{ showForm ? 'Cancel·lar' : 'Crear curs' }}
      </button>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div v-if="showForm" class="card">
      <h2>Nou curs</h2>
      <form @submit.prevent="createCourse">
        <div class="form-row">
          <label>Nom curt</label>
          <input v-model="form.name" placeholder="2DAW" required />
        </div>
        <div class="form-row">
          <label>Nom descriptiu (opcional)</label>
          <input v-model="form.description" placeholder="Segon de Desenvolupament d'Aplicacions Web" />
        </div>
        <div class="form-row">
          <label>Any acadèmic</label>
          <input v-model="form.academicYear" placeholder="2026-2027" required />
        </div>
        <button class="btn" type="submit" :disabled="saving">Crear</button>
      </form>
    </div>

    <div class="card">
      <p v-if="courses.length === 0" class="muted">Encara no hi ha cap curs.</p>
      <table v-else>
        <thead>
          <tr>
            <th>Curs</th>
            <th>Any acadèmic</th>
            <th>Alumnes</th>
            <th>Projectes</th>
            <th>Estat</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courses" :key="course.id">
            <td>
              <strong>{{ course.name }}</strong>
              <div v-if="course.description" class="muted">{{ course.description }}</div>
            </td>
            <td>{{ course.academicYear }}</td>
            <td>{{ course._count.students }}</td>
            <td>{{ course._count.projects }}</td>
            <td>
              <span :class="course.status === 'active' ? 'badge badge-active' : 'badge badge-archived'">
                {{ course.status === 'active' ? 'Actiu' : 'Arxivat' }}
              </span>
            </td>
            <td class="text-right">
              <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'course-students', params: { courseId: course.id } }">
                Alumnes
              </RouterLink>
              <button class="btn btn-secondary btn-sm" @click="toggleArchive(course)">
                {{ course.status === 'active' ? 'Arxivar' : 'Reactivar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
