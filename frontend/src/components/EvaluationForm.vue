<script setup>
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth.js';

const props = defineProps({
  members: { type: Array, required: true },
  scoreDecimals: { type: Number, default: 1 },
  initialScores: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
});
const emit = defineEmits(['submit']);

const auth = useAuthStore();
const scores = ref({});

watch(
  () => props.initialScores,
  (initial) => {
    const next = {};
    for (const member of props.members) {
      next[member.id] = initial[member.id] ?? '';
    }
    scores.value = next;
  },
  { immediate: true }
);

const step = computed(() => (props.scoreDecimals === 0 ? 1 : props.scoreDecimals === 1 ? 0.1 : 0.01));

const validationError = computed(() => {
  for (const member of props.members) {
    const raw = scores.value[member.id];
    if (raw === '' || raw === null || raw === undefined) {
      return 'Et falten valoracions per completar';
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      return 'Totes les notes han d\'estar entre 0 i 10';
    }
  }
  return null;
});

function submit() {
  if (validationError.value) return;
  emit(
    'submit',
    props.members.map((member) => ({
      evaluatedUserId: member.id,
      score: Number(scores.value[member.id]),
    }))
  );
}
</script>

<template>
  <form @submit.prevent="submit">
    <table>
      <thead>
        <tr>
          <th>Alumne valorat</th>
          <th>Tipus de valoració</th>
          <th style="width: 120px">Nota (0-10)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in members" :key="member.id">
          <td>
            <strong v-if="member.id === auth.user.id">Jo mateix ({{ member.name }})</strong>
            <template v-else>{{ member.name }}</template>
          </td>
          <td>{{ member.id === auth.user.id ? 'Autoavaluació' : 'Coavaluació' }}</td>
          <td>
            <input
              v-model="scores[member.id]"
              type="number"
              min="0"
              max="10"
              :step="step"
              :disabled="disabled"
              required
            />
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="!disabled && validationError" class="muted" style="margin-top: 0.75rem">
      {{ validationError }}
    </p>

    <button v-if="!disabled" class="btn" type="submit" :disabled="saving || !!validationError" style="margin-top: 0.75rem">
      {{ saving ? 'Guardant...' : 'Guardar valoracions' }}
    </button>
  </form>
</template>
