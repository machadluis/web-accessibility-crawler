<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';

const emit = defineEmits(['filtersChange']);

const levels = [
  { label: 'Critical', value: 'critical' },
  { label: 'Serious', value: 'serious' },
  { label: 'Moderate/Mild', value: 'moderate' },
  { label: 'Minor', value: 'minor' },
]

const selectedFilters = shallowRef(levels.map(level => level.value));
onMounted(() => emit('filtersChange', selectedFilters.value));
</script>

<template>
  <h2 class="text-white mb-4 px-6">Filter Issues By Severity:</h2>
  <div class="flex mb-8 rounder-sm p-3 bg-gray-900 gap-8">
    <label v-for="level in levels" :key="level.value">
      <input
        type="checkbox"
        :value="level.value"
        v-model="selectedFilters"
        @change="() => emit('filtersChange', selectedFilters)"
      />
      {{ level.label }}
    </label>
  </div>
</template>