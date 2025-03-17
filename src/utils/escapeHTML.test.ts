import { describe, it, expect } from 'vitest';
import { escapeHTML } from './';

describe('escapeHTML', () => {
  it('should escape special characters', () => {
    expect.assertions(1);

    const input = `<div>Test & "escape" 'HTML'</div>`;
    const expectedOutput = '&lt;div&gt;Test &amp; &quot;escape&quot; &#039;HTML&#039;&lt;/div&gt;';
    expect(escapeHTML(input)).toBe(expectedOutput);
  });

  it('should return an empty string when input is empty', () => {
    expect.assertions(1);

    expect(escapeHTML('')).toBe('');
  });

  it('should not alter strings with no special characters', () => {
    expect.assertions(1);

    const input = 'No special characters';
    expect(escapeHTML(input)).toBe(input);
  });

  it('should escape only the special characters and leave the rest unchanged', () => {
    expect.assertions(1);

    const input = 'Hello <world> & "everyone"';
    const expectedOutput = 'Hello &lt;world&gt; &amp; &quot;everyone&quot;';
    expect(escapeHTML(input)).toBe(expectedOutput);
  });

  it('should handle strings with only special characters', () => {
    expect.assertions(1);

    const input = '<>&"\'';
    const expectedOutput = '&lt;&gt;&amp;&quot;&#039;';
    expect(escapeHTML(input)).toBe(expectedOutput);
  });
});

