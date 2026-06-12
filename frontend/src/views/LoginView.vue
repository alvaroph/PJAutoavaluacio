<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const error = ref('');
const googleButton = ref(null);

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

async function handleCredential(response) {
  error.value = '';
  try {
    await auth.loginWithGoogle(response.credential);
    router.push(auth.isTeacher ? { name: 'dashboard' } : { name: 'my-projects' });
  } catch (e) {
    error.value = e.message;
  }
}

function initGoogle() {
  if (!window.google?.accounts?.id) {
    // L'script GSI encara es carrega: reintenta fins que estigui disponible
    setTimeout(initGoogle, 200);
    return;
  }
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredential,
    hd: 'inspedralbes.cat',
  });
  window.google.accounts.id.renderButton(googleButton.value, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    width: 280,
  });
}

onMounted(() => {
  if (!clientId) {
    error.value = 'Falta configurar VITE_GOOGLE_CLIENT_ID';
    return;
  }
  initGoogle();
});
</script>

<template>
  <div class="login-page">
    <div class="card login-card">
      <h1>Autoavaluació i coavaluació de projectes</h1>
      <p class="muted">Institut Pedralbes</p>
      <div ref="googleButton" class="google-btn"></div>
      <p v-if="error" class="alert alert-error">{{ error }}</p>
      <p class="muted small">
        Només s'accepten comptes del domini <strong>inspedralbes.cat</strong>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  max-width: 420px;
  text-align: center;
  padding: 2.5rem 2rem;
}
.google-btn {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}
.small { font-size: 0.85rem; }
</style>
