import { vi, describe, it, expect } from 'vitest';
import { normalizeUrl } from './';

describe('normalizeUrl', () => {
  it('should convert to lowercase', () => {
    expect.assertions(2);

    expect(normalizeUrl('', 'HTTP://EXAMPLE.COM')).toBe('http://example.com/');
    expect(normalizeUrl('PATH', 'http://EXAMPLE.COM')).toBe('http://example.com/PATH');
  });

  it('should remove default ports', () => {
    expect.assertions(2);

    expect(normalizeUrl('', 'http://example.com:80')).toBe('http://example.com/');
    expect(normalizeUrl('', 'https://example.com:443')).toBe('https://example.com/');
  });

  it('should not remove non-default ports', () => {
    expect.assertions(2);

    expect(normalizeUrl('', 'http://example.com:8080')).toBe('http://example.com:8080/');
    expect(normalizeUrl('', 'https://example.com:8443')).toBe('https://example.com:8443/');
  });

  it('should handle URLs with both query parameters and fragments', () => {
    expect(normalizeUrl('/?query=1#fragment', 'http://example.com')).toBe('http://example.com/');
    expect(normalizeUrl('/path?query=1#fragment', 'http://example.com')).toBe('http://example.com/path');
  });

  it('should handle URLs with fragments', () => {
    expect.assertions(2);

    expect(normalizeUrl('/#fragment', 'http://example.com')).toBe('http://example.com/');
    expect(normalizeUrl('/path#fragment', 'http://example.com')).toBe('http://example.com/path');
  });

  it('should throw error due to an invalid URL', () => {
    expect.assertions(2);

    vi.spyOn(console, 'error');
    expect(normalizeUrl('/potato', 'some-non-url')).toBeNull();
    expect(console.error).toHaveBeenNthCalledWith(1, 'Error normalizing URL: /potato');
  });
});


