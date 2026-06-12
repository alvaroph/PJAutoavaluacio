<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth.js';

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <header v-if="auth.isAuthenticated" class="topbar">
    <div class="flex">
      <span class="brand">Autoavaluació de projectes</span>
      <nav v-if="auth.isTeacher">
        <RouterLink :to="{ name: 'dashboard' }">Inici</RouterLink>
        <RouterLink :to="{ name: 'courses' }">Cursos</RouterLink>
        <RouterLink :to="{ name: 'projects' }">Projectes</RouterLink>
      </nav>
      <nav v-else>
        <RouterLink :to="{ name: 'my-projects' }">Els meus projectes</RouterLink>
      </nav>
    </div>
    <div class="flex">
      <span class="muted">{{ auth.user.name }} ({{ auth.user.role }})</span>
      <button class="btn btn-secondary btn-sm" @click="logout">Sortir</button>
    </div>
  </header>
  <main>
    <RouterView />
  </main>
</template>
