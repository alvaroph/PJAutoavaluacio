<script setup>
import { ref } from 'vue';

const props = defineProps({
  group: { type: Object, required: true },
  unassignedStudents: { type: Array, default: () => [] },
});
const emit = defineEmits(['rename', 'remove', 'add-member', 'remove-member']);

const editing = ref(false);
const newName = ref(props.group.name);
const selectedStudent = ref('');

function saveName() {
  if (newName.value.trim() && newName.value !== props.group.name) {
    emit('rename', props.group, newName.value.trim());
  }
  editing.value = false;
}

function addSelected() {
  if (selectedStudent.value) {
    emit('add-member', props.group, Number(selectedStudent.value));
    selectedStudent.value = '';
  }
}
</script>

<template>
  <div class="card">
    <div class="flex flex-between">
      <h2 v-if="!editing" style="margin: 0">{{ group.name }}</h2>
      <input v-else v-model="newName" style="max-width: 200px" @keyup.enter="saveName" />
      <div class="flex">
        <button v-if="!editing" class="btn btn-secondary btn-sm" @click="editing = true; newName = group.name">
          Canviar nom
        </button>
        <button v-else class="btn btn-sm" @click="saveName">Desar</button>
        <button class="btn btn-danger btn-sm" @click="emit('remove', group)">Eliminar</button>
      </div>
    </div>

    <p v-if="group.members.length === 0" class="muted">Sense alumnes assignats.</p>
    <table v-else>
      <tbody>
        <tr v-for="member in group.members" :key="member.id">
          <td>{{ member.name }}</td>
          <td class="muted">{{ member.email }}</td>
          <td class="text-right">
            <button class="btn btn-secondary btn-sm" @click="emit('remove-member', group, member)">Treure</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="flex" style="margin-top: 0.75rem">
      <select v-model="selectedStudent" style="max-width: 280px">
        <option value="" disabled>Afegir alumne...</option>
        <option v-for="student in unassignedStudents" :key="student.id" :value="student.id">
          {{ student.name }}
        </option>
      </select>
      <button class="btn btn-sm" :disabled="!selectedStudent" @click="addSelected">Afegir</button>
    </div>
  </div>
</template>
