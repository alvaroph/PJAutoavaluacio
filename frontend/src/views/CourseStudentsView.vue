<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api.js';
import StudentImportBox from '../components/StudentImportBox.vue';

const route = useRoute();
const courseId = Number(route.params.courseId);

const course = ref(null);
const students = ref([]);
const error = ref('');

async function load() {
  try {
    const [c, s] = await Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/students`),
    ]);
    course.value = c.course;
    students.value = s.students;
  } catch (e) {
    error.value = e.message;
  }
}

async function removeStudent(student) {
  if (!confirm(`Vols treure ${student.name} del curs?`)) return;
  try {
    await api.delete(`/courses/${courseId}/students/${student.id}`);
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'courses' }">&larr; Tornar als cursos</RouterLink></p>
    <h1 v-if="course">Alumnes de {{ course.name }} ({{ course.academicYear }})</h1>
    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <StudentImportBox :course-id="courseId" @imported="load" />

    <div class="card">
      <h2>Alumnes del curs ({{ students.length }})</h2>
      <p v-if="students.length === 0" class="muted">Encara no hi ha alumnes importats.</p>
      <table v-else>
        <thead>
          <tr><th>Nom</th><th>Correu</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id">
            <td>{{ student.name }}</td>
            <td>{{ student.email }}</td>
            <td class="text-right">
              <button class="btn btn-secondary btn-sm" @click="removeStudent(student)">Treure</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
