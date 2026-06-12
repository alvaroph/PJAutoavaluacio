<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const error = ref('');
const googleButton = ref(null);
const authConfig = ref({ googleEnabled: false, devLogin: false });
const devEmail = ref('');
const devRole = ref('teacher');
const busy = ref(false);

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function goHome() {
  router.push(auth.isTeacher ? { name: 'dashboard' } : { name: 'my-projects' });
}

async function handleCredential(response) {
  error.value = '';
  try {
    await auth.loginWithGoogle(response.credential);
    goHome();
  } catch (e) {
    error.value = e.message;
  }
}

async function devLogin() {
  error.value = '';
  busy.value = true;
  try {
    await auth.loginDev(devEmail.value, devRole.value);
    goHome();
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
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

onMounted(async () => {
  try {
    authConfig.value = await api.get('/auth/config');
  } catch {
    // si l'API no respon, ho indiquem en intentar entrar
  }
  if (authConfig.value.googleEnabled && clientId) {
    initGoogle();
  }
});
</script>

<template>
  <div class="login-page">
    <div class="card login-card">
      <h1>Autoavaluació i coavaluació de projectes</h1>
      <p class="muted">Institut Pedralbes</p>

      <template v-if="authConfig.googleEnabled && clientId">
        <div ref="googleButton" class="google-btn"></div>
        <p class="muted small">
          Només s'accepten comptes del domini <strong>inspedralbes.cat</strong>
        </p>
      </template>
      <p v-else-if="!authConfig.devLogin" class="alert alert-warning">
        El login amb Google encara no està configurat (falta GOOGLE_CLIENT_ID).
      </p>

      <div v-if="authConfig.devLogin" class="dev-login">
        <p class="alert alert-warning small">
          Mode desenvolupament actiu: entra sense Google. Desactiva
          <code>AUTH_DEV_MODE</code> abans de posar-ho en producció.
        </p>
        <form @submit.prevent="devLogin">
          <div class="form-row">
            <label>Correu</label>
            <input v-model="devEmail" type="email" placeholder="algu@inspedralbes.cat" required />
          </div>
          <div class="form-row">
            <label>Rol (si l'usuari encara no existeix)</label>
            <select v-model="devRole">
              <option value="teacher">Professor</option>
              <option value="student">Alumne</option>
            </select>
          </div>
          <button class="btn" type="submit" :disabled="busy">Entrar (mode desenvolupament)</button>
        </form>
      </div>

      <p v-if="error" class="alert alert-error">{{ error }}</p>
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
  width: 100%;
  text-align: center;
  padding: 2.5rem 2rem;
}
.google-btn {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}
.small { font-size: 0.85rem; }
.dev-login {
  margin-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.25rem;
  text-align: left;
}
</style>
