import { vi, describe, it, expect } from 'vitest';
import axe from "axe-core";

import { parseIssues } from './';

describe('parseIssues', () => {
  it('should return an empty violations array when there are no issues', () => {
    expect.assertions(1);

    const expected = {
      url: 'http://example.com',
      relativePath: '/some-path',
      totalViolations: 0,
      wcagCompliance: { wcag2a: 0, wcag2aa: 0, wcag21a: 0, wcag21aa: 0 },
      ruleImpact: { minor: 0, moderate: 0, serious: 0, critical: 0 },
      violations: [],
      compliancePercentage: '100.00',
      totalRequirements: 55,
    };

    expect(parseIssues([], 'http://example.com', '/some-path')).toEqual(expected);
  });

  it('should return the correct data when there are issues', () => {
    expect.assertions(1);

    const violations = [
      {
        id: 'some-id',
        impact: 'serious' as axe.ImpactValue,
        description: 'Some description',
        help: 'Some help',
        helpUrl: 'http://example.com/help',
        tags: ['wcag2a'],
        nodes: [],
      },
    ];

    const expected = {
      url: 'http://example.com',
      relativePath: '/some-path',
      totalViolations: 1,
      wcagCompliance: { wcag2a: 1, wcag2aa: 0, wcag21a: 0, wcag21aa: 0 },
      ruleImpact: { minor: 0, moderate: 0, serious: 1, critical: 0 },
      violations: [
        {
          id: 'some-id',
          impact: 'serious',
          description: 'Some description',
          help: 'Some help',
          helpUrl: 'http://example.com/help',
          tags: ['wcag2a'],
          nodes: [],
        },
      ],
      compliancePercentage: '98.18',
      totalRequirements: 55,
    };

    expect(parseIssues(violations, 'http://example.com', '/some-path')).toEqual(expected);
  });
});
