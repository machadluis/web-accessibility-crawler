<script lang="ts" setup>
const emit = defineEmits(['export']);
</script>

<template>
  <div class="footer">
    <button class="p-3 bg-gray-800 text-white rounded-sm transition-colors hover:bg-gray-700 cursor-pointer" type="button" @click="emit('export')">
      Export
    </button>
  </div>
</template>
