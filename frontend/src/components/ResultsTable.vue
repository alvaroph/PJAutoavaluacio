<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  results: { type: Array, required: true },
});

const filterGroup = ref('');
const filterName = ref('');
const onlyNotVoted = ref(false);
const sortBy = ref('name');
const sortDir = ref(1);

const groups = computed(() => [...new Set(props.results.map((r) => r.group))]);

const filtered = computed(() => {
  let rows = props.results;
  if (filterGroup.value) rows = rows.filter((r) => r.group === filterGroup.value);
  if (filterName.value) {
    const q = filterName.value.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }
  if (onlyNotVoted.value) rows = rows.filter((r) => !r.hasVoted);

  return [...rows].sort((a, b) => {
    const key = sortBy.value;
    const va = a[key];
    const vb = b[key];
    if (va === null) return 1;
    if (vb === null) return -1;
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return cmp * sortDir.value;
  });
});

function setSort(key) {
  if (sortBy.value === key) sortDir.value *= -1;
  else {
    sortBy.value = key;
    sortDir.value = 1;
  }
}

function fmt(value) {
  return value === null || value === undefined ? 'Sense dades' : String(value).replace('.', ',');
}
</script>

<template>
  <div>
    <div class="flex" style="margin-bottom: 1rem">
      <select v-model="filterGroup" style="max-width: 180px">
        <option value="">Tots els grups</option>
        <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
      </select>
      <input v-model="filterName" placeholder="Cerca per nom o correu" style="max-width: 240px" />
      <label class="flex" style="margin: 0; font-weight: normal">
        <input v-model="onlyNotVoted" type="checkbox" style="width: auto" />
        Només qui no ha votat
      </label>
    </div>

    <p v-if="filtered.length === 0" class="muted">Cap resultat amb aquests filtres.</p>
    <table v-else>
      <thead>
        <tr>
          <th style="cursor: pointer" @click="setSort('group')">Grup</th>
          <th style="cursor: pointer" @click="setSort('name')">Nom</th>
          <th>Correu</th>
          <th class="text-right" style="cursor: pointer" @click="setSort('selfScore')">Autoavaluació</th>
          <th class="text-right" style="cursor: pointer" @click="setSort('peerAverage')">Coavaluació rebuda</th>
          <th class="text-right">Nre. rebudes</th>
          <th>Ha votat</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filtered" :key="row.userId">
          <td>{{ row.group }}</td>
          <td>{{ row.name }}</td>
          <td class="muted">{{ row.email }}</td>
          <td class="text-right">{{ fmt(row.selfScore) }}</td>
          <td class="text-right">{{ fmt(row.peerAverage) }}</td>
          <td class="text-right">{{ row.peerCount }}</td>
          <td>
            <span :class="row.hasVoted ? 'badge badge-open' : 'badge badge-closed'">
              {{ row.hasVoted ? 'Sí' : 'No' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
