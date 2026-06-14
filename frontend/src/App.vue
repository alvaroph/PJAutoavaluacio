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
      <div class="brand">
        <div class="brand-logo">
          <img src="/logo.jpg" alt="Institut Pedralbes" />
        </div>
        <div class="brand-text">
          <span class="brand-name">Institut Pedralbes</span>
          <span class="brand-app">Autoavaluació de projectes</span>
        </div>
      </div>
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
      <span class="user-info">{{ auth.user.name }}</span>
      <button class="btn btn-sm" style="background:rgba(0,180,216,.15);color:var(--color-primary);border:1px solid rgba(0,180,216,.3);" @click="logout">Sortir</button>
    </div>
  </header>
  <main>
    <RouterView />
  </main>
</template>
