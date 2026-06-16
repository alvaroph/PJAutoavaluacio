<script setup>
const props = defineProps({
  courses: { type: Array, default: () => [] },
  statuses: { type: Array, default: () => [] },
  modelValue: {
    type: Object,
    default: () => ({ courseId: '', status: '', search: '' }),
  },
});

const emit = defineEmits(['update:modelValue']);

function set(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>

<template>
  <div class="filter-bar">
    <select
      v-if="courses.length"
      :value="modelValue.courseId"
      @change="set('courseId', $event.target.value)"
    >
      <option value="">Tots els cursos</option>
      <option v-for="c in courses" :key="c.id" :value="c.id">
        {{ c.name }} ({{ c.academicYear }})
      </option>
    </select>

    <select
      v-if="statuses.length"
      :value="modelValue.status"
      @change="set('status', $event.target.value)"
    >
      <option value="">Tots els estats</option>
      <option v-for="s in statuses" :key="s.value" :value="s.value">
        {{ s.label }}
      </option>
    </select>

    <input
      type="search"
      placeholder="Cerca..."
      :value="modelValue.search"
      @input="set('search', $event.target.value)"
    />
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.filter-bar select,
.filter-bar input {
  flex: 1;
  min-width: 140px;
}
</style>
