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
    <div class="login-card">
      <div class="login-logo-wrap">
        <img src="/logo.jpg" alt="Institut Pedralbes" class="login-logo" />
      </div>
      <h1 class="login-title">Autoavaluació de projectes</h1>
      <p class="login-subtitle">Eina d'autoavaluació i coavaluació de projectes de l'Institut Pedralbes</p>

      <div class="login-body">
        <template v-if="authConfig.googleEnabled && clientId">
          <div ref="googleButton" class="google-btn"></div>
          <p class="hint">Només s'accepten comptes del domini <strong>inspedralbes.cat</strong></p>
        </template>
        <p v-else-if="!authConfig.devLogin" class="alert alert-warning">
          El login amb Google encara no està configurat (falta GOOGLE_CLIENT_ID).
        </p>

        <div v-if="authConfig.devLogin" class="dev-login">
          <div class="dev-badge">Mode desenvolupament</div>
          <form @submit.prevent="devLogin">
            <div class="form-row">
              <label>Correu electrònic</label>
              <input v-model="devEmail" type="email" placeholder="algu@inspedralbes.cat" required />
            </div>
            <div class="form-row">
              <label>Rol (si l'usuari és nou)</label>
              <select v-model="devRole">
                <option value="teacher">Professor/a</option>
                <option value="student">Alumne/a</option>
              </select>
            </div>
            <button class="btn login-btn" type="submit" :disabled="busy">
              {{ busy ? 'Entrant…' : 'Entrar' }}
            </button>
          </form>
        </div>

        <p v-if="error" class="alert alert-error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, #F2F5F8 0%, #E4F6FB 100%);
  padding: 1rem;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,.10), 0 2px 8px rgba(0,0,0,.06);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
}

.login-logo-wrap {
  background: var(--color-dark);
  border-bottom: 4px solid var(--color-primary);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-logo {
  height: 56px;
  display: block;
  background: #fff;
  padding: 6px 14px;
  border-radius: 8px;
}

.login-title {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  text-align: center;
  padding: 1.5rem 2rem 0.25rem;
}

.login-subtitle {
  font-size: 0.85rem;
  color: var(--color-muted);
  text-align: center;
  margin: 0 0 0;
  padding: 0 2rem 1.25rem;
  line-height: 1.5;
}

.login-body {
  padding: 0 2rem 2rem;
}

.google-btn {
  display: flex;
  justify-content: center;
  margin: 1.25rem 0 0.75rem;
}

.hint {
  font-size: 0.8rem;
  color: var(--color-muted);
  text-align: center;
  margin: 0;
}

.dev-login {
  border-top: 1px solid var(--color-border);
  padding-top: 1.25rem;
  margin-top: 1.25rem;
}

.dev-badge {
  display: inline-block;
  background: #FFFBEB;
  color: #92400E;
  border: 1px solid #FDE68A;
  font-size: 0.72rem;
  font-weight: 600;
  font-family: var(--font-heading);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  margin-bottom: 1rem;
}

.login-btn {
  width: 100%;
  justify-content: center;
  padding: 0.65rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 0.25rem;
}
</style>
