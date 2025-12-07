/**
 * Escaping utilities for safe HTML and Markdown handling
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Unescape HTML entities back to original characters
 */
export function unescapeHtml(text: string): string {
  if (!text) return '';

  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

/**
 * Escape HTML special characters while preserving code fences and inline code
 * This prevents XSS while allowing code samples to work correctly
 */
export function escapeHtmlSafe(text: string): string {
  if (!text) return '';

  // Detect code fences (``` ... ```)
  const codeFenceRegex = /```[\s\S]*?```/g;
  const codeFences: string[] = [];

  // Extract code fences and replace with placeholders
  let escaped = text.replace(codeFenceRegex, (match) => {
    const placeholder = `§§§CODEFENCE${codeFences.length}§§§`;
    codeFences.push(match);
    return placeholder;
  });

  // Also protect inline code (`...`)
  const inlineCodeRegex = /`[^`]+`/g;
  const inlineCodes: string[] = [];

  escaped = escaped.replace(inlineCodeRegex, (match) => {
    const placeholder = `§§§INLINECODE${inlineCodes.length}§§§`;
    inlineCodes.push(match);
    return placeholder;
  });

  // Escape HTML in remaining text
  escaped = escapeHtml(escaped);

  // Restore inline code
  inlineCodes.forEach((code, i) => {
    escaped = escaped.replace(`§§§INLINECODE${i}§§§`, code);
  });

  // Restore code fences
  codeFences.forEach((fence, i) => {
    escaped = escaped.replace(`§§§CODEFENCE${i}§§§`, fence);
  });

  return escaped;
}

/**
 * Escape Markdown syntax characters to prevent structure breaking
 * Preserves code fences (```) - content inside is not escaped
 */
export function escapeMarkdownSyntax(text: string): string {
  if (!text) return '';

  // Detect code fences (``` ... ```)
  const codeFenceRegex = /```[\s\S]*?```/g;
  const codeFences: string[] = [];

  // Extract code fences and replace with placeholders
  // Use a placeholder that won't be escaped
  let escaped = text.replace(codeFenceRegex, (match) => {
    const placeholder = `§§§CODEFENCE${codeFences.length}§§§`;
    codeFences.push(match);
    return placeholder;
  });

  // Escape Markdown syntax
  escaped = escaped
    // Escape heading markers at start of line
    .replace(/^(#{1,6})\s/gm, (match) => match.replace(/#/g, '\\#'))
    // Escape other Markdown syntax
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  // Restore code fences
  codeFences.forEach((fence, i) => {
    escaped = escaped.replace(`§§§CODEFENCE${i}§§§`, fence);
  });

  return escaped;
}

/**
 * Unescape Markdown syntax characters
 */
export function unescapeMarkdownSyntax(text: string): string {
  if (!text) return '';

  return text
    .replace(/\\#/g, '#')
    .replace(/\\\*/g, '*')
    .replace(/\\_/g, '_')
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')');
}
