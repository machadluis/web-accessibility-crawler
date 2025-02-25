
import axe from "axe-core";

import { escapeHTML } from "./";

const TOTAL_CRITERIA = 55;

interface ViolationData extends Partial<axe.AxeResults> {
  relativePath: string;
  totalViolations: number;
  wcagCompliance: {
    wcag2a: number;
    wcag2aa: number;
    wcag21a: number;
    wcag21aa: number;
  };
  ruleImpact: {
    minor: number;
    moderate: number;
    serious: number;
    critical: number;
  };
  compliancePercentage: string;
  totalRequirements: number;
}

export default (violations: axe.AxeResults['violations'], pageUrl: string, relativePath: string) => {
  const compliancePercentage = ((TOTAL_CRITERIA - violations.length) / TOTAL_CRITERIA) * 100;

  const violationsData: ViolationData = {
    url: pageUrl,
    relativePath: relativePath,
    totalViolations: violations.length,
    wcagCompliance: { wcag2a: 0, wcag2aa: 0, wcag21a: 0, wcag21aa: 0 },
    ruleImpact: { minor: 0, moderate: 0, serious: 0, critical: 0 },
    violations: [],
    compliancePercentage: compliancePercentage.toFixed(2),
    totalRequirements: TOTAL_CRITERIA,
  };

  violations.forEach((violation) => {
    violation.tags.forEach((tag) => {
      if (violationsData.wcagCompliance.hasOwnProperty(tag)) {
        violationsData.wcagCompliance[tag] += 1;
      }
    });

    if (violation.impact && violationsData.ruleImpact.hasOwnProperty(violation.impact)) {
      violationsData.ruleImpact[violation.impact] += 1;
    }

    violationsData.violations!.push({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      // @ts-ignore
      nodes: violation.nodes.map((node) => ({
        target: node.target.join(", "),
        html: escapeHTML(node.html),
        failureSummary: node.failureSummary,
        xpath: node.xpath?.join(", "),
      })),
    });
  });

  return violationsData;
};