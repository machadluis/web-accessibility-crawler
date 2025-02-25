<script setup lang="ts">
import { shallowRef } from 'vue';

import Filters from './components/Filters.vue';
import Summary from './components/Summary.vue';
import Results from './components/Results.vue';
import Footer from './components/Footer.vue';

import results from '../../accessibility-results/accessibility-results.json' with { type: 'json' };

const onExport = () => {
  if (!results.length) {
    console.error("No data to export.");
    return;
  }
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Overview\nReport Date:,Total Violations:\n";
  const reportDate = new Date().toISOString();
  const totalViolations = results.reduce((sum, page) => sum + page.totalViolations, 0);
  csvContent += `${reportDate},${totalViolations}\n\n`;
  csvContent +=
    "Page Summary\nURL,Relative Path,Total Violations,WCAG 2A,WCAG 2AA,WCAG 2.1A,WCAG 2.1AA\n";
  results.forEach((page) => {
    csvContent += `${page.url},${page.relativePath},${page.totalViolations},${page.wcagCompliance.wcag2a},${page.wcagCompliance.wcag2aa},${page.wcagCompliance.wcag21a},${page.wcagCompliance.wcag21aa}\n`;
  });
  csvContent += "\n\n";
  csvContent +=
    "Violation Details\nURL,Violation ID,Impact,Description,Help,Help URL,Tags,Element,HTML Snippet,Failure Summary,XPath\n";
  results.forEach((page) => {
    page.violations.forEach((violation) => {
      violation.nodes.forEach((node) => {
        const formattedHtmlSnippet = node.html
          .replace(/(?:\r\n|\r|\n)/g, " ")
          .replace(/"/g, '""');
        csvContent += `${page.url},${violation.id},${violation.impact},"${
          violation.description
        }","${violation.help}",${
          violation.helpUrl
        },"${violation.tags.join("; ")}","${
          node.target
        }","${formattedHtmlSnippet}","${node.failureSummary || "N/A"}",${
          node.xpath
        }\n`;
      });
    });
  });

  const encodedUri = encodeURI(csvContent);
  const downloadLink = document.createElement("a");
  downloadLink.setAttribute("href", encodedUri);
  downloadLink.setAttribute("download", "accessibility_results.csv");
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

const filters = shallowRef<string[]>([]);

const onFiltersChange = (newFilters: string[]) => filters.value = newFilters;
</script>

<template>
  <div class="max-w-[1200px] mx-auto p-4 rounded-m bg-gray-600">
    <h1 class="text-2xl bg-gray-900 p-6 text-white rounder-sm mb-8">
      Accessibility Test Results
    </h1>

    <Filters @filtersChange="onFiltersChange" />

    <template v-if="results.length">
      <Summary :results="results" />
      <Results :results="results" :filters="filters" />

      <Footer @export="onExport"/>
    </template>
  </div>
</template>

<style scoped>
</style>
