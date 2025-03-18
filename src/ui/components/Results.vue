<script lang="ts" setup>
import { shallowRef } from 'vue';

interface Props {
  results: any[];
  filters: string[];
}

const props = defineProps<Props>();

const visible = shallowRef<string>();

const toggleVisibility = (url: string) => {
  visible.value = visible.value === url ? undefined : url;
};

const calculateTotalViolations = (violations: any[]) => violations.filter((violation) => props.filters.includes(violation.impact)).length;
</script>

<template>
  <section class="rounded-sm mb-4" v-for="(result, i) in results" :key="result.url">
    <div class="p-4 bg-gray-900 rounded-sm flex justify-between cursor-pointer items-center" @click="toggleVisibility(result.url)">
      {{ i + 1 }}.
      <a class="underline" :href="result.url" target="_blank">{{ result.url }}</a>
      {{ calculateTotalViolations(result.violations) }} Violations
    </div>

    <div v-show="visible === result.url">
      <template v-for="(violation, j) in result.violations" :key="j" >
        <div class="mb-8 p-4 rounder-sm bg-gray-700" :data-impact="violation.impact" v-if="filters.includes(violation.impact)">
          <div>
            <strong>Violation:</strong> {{ violation.id }} ({{ violation.impact || 'impact not specified' }})
          </div>
          <div>
            <strong>Description:</strong> {{ violation.description }}
          </div>
          <div>
            <strong>Help:</strong> {{ violation.help }}
          </div>
          <div>
            <strong>Help URL:</strong> <a :href="violation.helpurl" target="_blank">{{ violation.helpurl }}</a>
          </div>
          <div v-if="violation.tags?.length">
            <strong>WCAG Reference:</strong> {{ violation.tags.join(", ") }}
          </div>
          <div class="my-3 mb-6 ml-8 p-4 bg-gray-600" v-for="node in violation.nodes">
            <div>Element: {{ node.target }}</div>
            <div>HTML snippet: <pre class="overflow-x-auto rounder-sm bg-gray-800 text-wrap p-2" v-html="node.html" /></div>
            <div v-if="node.failureSummary">Failure Summary: {{ node.failureSummary }}</div>
            <div v-if="node.xpath">XPath: {{ node.xpath }}</div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>