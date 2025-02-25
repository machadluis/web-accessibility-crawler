<script setup lang="ts">
import { computed } from 'vue';

enum IssueType {
  CRITICAL,
  SERIOUS,
  MODERATE,
  MINOR,
}

interface Props {
  results: {
    ruleImpact: {
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
    };
    totalViolations: number;
  }[];
}

const props = defineProps<Props>();

const summary = computed(() => props.results.reduce((acc, page) => {
  acc.critical += page.ruleImpact.critical ?? 0;
  acc.serious += page.ruleImpact.serious ?? 0;
  acc.moderate += page.ruleImpact.moderate ?? 0;
  acc.minor += page.ruleImpact.minor ?? 0;

  return acc;
}, { critical: 0, serious: 0, moderate: 0, minor: 0 }));

const totalIssues = computed(() => props.results?.reduce((sum: number, page) => sum + page.totalViolations, 0));

const issues = computed(() => [
  { label: 'Critical', amount: summary.value.critical, type: IssueType.CRITICAL },
  { label: 'Serious', amount: summary.value.serious, type: IssueType.SERIOUS },
  { label: 'Moderate', amount: summary.value.moderate, type: IssueType.MODERATE },
  { label: 'Minor', amount: summary.value.minor, type: IssueType.MINOR },
])
</script>

<template>
  <section class="mb-4 rouder-sm bg-gray-900 p-4">
    <div class="flex mb-4 justify-end">Total Issues: {{ totalIssues }}</div>
    <div  class="flex justify-between" v-for="issue in issues" :key="issue.label">
      {{ issue.label }}
      <span>
        <i v-for="(_, i) in issue.amount" :class="{
          'bg-red-500': issue.type === IssueType.CRITICAL,
          'bg-orange-500': issue.type === IssueType.SERIOUS,
          'bg-yellow-500': issue.type === IssueType.MODERATE,
          'bg-gray-500': issue.type === IssueType.MINOR,
        }" class="size-4 inline-block ml-1 text-xs text-black px-1.5">{{ i + 1 }}</i>
      </span>
    </div>
  </section>
</template>