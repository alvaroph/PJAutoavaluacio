import { defineStore } from 'pinia';
import { api, setToken, getToken } from '../api.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loaded: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    isTeacher: (state) => ['teacher', 'admin'].includes(state.user?.role),
    isStudent: (state) => state.user?.role === 'student',
  },
  actions: {
    // Envia la credencial de Google al backend, que la valida i retorna el JWT propi
    async loginWithGoogle(credential) {
      const data = await api.post('/auth/google', { credential });
      setToken(data.token);
      this.user = data.user;
    },
    async fetchMe() {
      if (!getToken()) {
        this.loaded = true;
        return;
      }
      try {
        const data = await api.get('/auth/me');
        this.user = data.user;
      } catch {
        setToken(null);
        this.user = null;
      } finally {
        this.loaded = true;
      }
    },
    logout() {
      setToken(null);
      this.user = null;
    },
  },
});
