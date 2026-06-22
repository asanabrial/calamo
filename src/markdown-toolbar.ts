// Pure, framework-free selection-transform helpers for the MarkdownEditor toolbar.
// All functions are (text, selStart, selEnd, ...params) => SelEdit.
// No React, no DOM, no Next.js — freely unit-testable in Bun.

export interface SelEdit {
  text: string;
  selStart: number;
  selEnd: number;
}

// ============================================================
// toggleWrap
// ============================================================

/**
 * Wraps or unwraps the selection in an inline marker (e.g. `**`, `*`, `` ` ``).
 *
 * - Selection: if already wrapped → unwrap (remove both surrounding markers).
 *   Otherwise → wrap (add markers around selection, selection covers inner text).
 * - No selection: insert marker+marker at cursor, cursor positioned between them.
 */
export function toggleWrap(
  text: string,
  selStart: number,
  selEnd: number,
  marker: string
): SelEdit {
  const m = marker.length;

  if (selStart === selEnd) {
    // No selection — insert pair, cursor between
    const newText = text.slice(0, selStart) + marker + marker + text.slice(selStart);
    return { text: newText, selStart: selStart + m, selEnd: selStart + m };
  }

  // Check if already wrapped
  const before = text.slice(selStart - m, selStart);
  const after = text.slice(selEnd, selEnd + m);
  if (before === marker && after === marker) {
    // Unwrap
    const newText =
      text.slice(0, selStart - m) + text.slice(selStart, selEnd) + text.slice(selEnd + m);
    return { text: newText, selStart: selStart - m, selEnd: selEnd - m };
  }

  // Wrap
  const newText =
    text.slice(0, selStart) + marker + text.slice(selStart, selEnd) + marker + text.slice(selEnd);
  return { text: newText, selStart: selStart + m, selEnd: selEnd + m };
}

// ============================================================
// toggleLinePrefix
// ============================================================

/**
 * Prepends a prefix to every line touched by the selection.
 * If ALL touched lines already start with the prefix, removes it (toggle off).
 * Returned selStart/selEnd span the modified line block.
 */
export function toggleLinePrefix(
  text: string,
  selStart: number,
  selEnd: number,
  prefix: string
): SelEdit {
  // Expand to full-line boundaries
  let lineStart = selStart;
  while (lineStart > 0 && text[lineStart - 1] !== "\n") {
    lineStart--;
  }

  // selEnd may be at a newline — find end of the last touched line
  let lineEnd = selEnd;
  // If selEnd is exactly at a newline (or start of next line), the preceding line is the last touched
  // We need to find the end of the last touched line (exclusive of the newline char at lineEnd if selEnd points to it)
  while (lineEnd < text.length && text[lineEnd] !== "\n") {
    lineEnd++;
  }

  const block = text.slice(lineStart, lineEnd);
  const lines = block.split("\n");

  const allPrefixed = lines.every((line) => line.startsWith(prefix));

  const newLines = allPrefixed
    ? lines.map((line) => line.slice(prefix.length))
    : lines.map((line) => prefix + line);

  const newBlock = newLines.join("\n");
  const newText = text.slice(0, lineStart) + newBlock + text.slice(lineEnd);

  return {
    text: newText,
    selStart: lineStart,
    selEnd: lineStart + newBlock.length,
  };
}

// ============================================================
// insertLink
// ============================================================

/**
 * Inserts a markdown link at the cursor or wraps a selection.
 *
 * - With selection: `[selectedText](url)` — cursor after closing `)`.
 * - No selection: `[](url)` — cursor inside `[]` at selStart+1.
 */
export function insertLink(
  text: string,
  selStart: number,
  selEnd: number,
  url: string = ""
): SelEdit {
  const before = text.slice(0, selStart);
  const sel = text.slice(selStart, selEnd);
  const after = text.slice(selEnd);

  if (selStart === selEnd) {
    // No selection: [](url)
    const token = `[](${url})`;
    const newText = before + token + after;
    return { text: newText, selStart: selStart + 1, selEnd: selStart + 1 };
  }

  // Selection becomes link text
  const token = `[${sel}](${url})`;
  const newText = before + token + after;
  const cursorPos = selStart + token.length;
  return { text: newText, selStart: cursorPos, selEnd: cursorPos };
}

// ============================================================
// insertImageMarkdown
// ============================================================

/**
 * Inserts an image snippet at the cursor or replaces a selection.
 *
 * - With selection and no explicit alt: selection text becomes alt.
 * - Empty/omitted alt + no selection: produces `![](url)`.
 * - Cursor is positioned immediately after the closing `)`.
 */
export function insertImageMarkdown(
  text: string,
  selStart: number,
  selEnd: number,
  url: string,
  alt?: string
): SelEdit {
  const before = text.slice(0, selStart);
  const sel = text.slice(selStart, selEnd);
  const after = text.slice(selEnd);

  // Determine alt text: explicit alt > selection text > empty string
  const altText = alt !== undefined ? alt : sel;

  const token = `![${altText}](${url})`;
  const newText = before + token + after;
  const cursorPos = selStart + token.length;

  return { text: newText, selStart: cursorPos, selEnd: cursorPos };
}

// ============================================================
// insertCodeBlock
// ============================================================

/**
 * Wraps the selection in a fenced code block, or inserts an empty one.
 *
 * - With selection: ` ```\n{sel}\n``` ` at the selection position.
 * - No selection: ` ```\n\n``` ` with cursor on the inner blank line.
 */
export function insertCodeBlock(
  text: string,
  selStart: number,
  selEnd: number
): SelEdit {
  const before = text.slice(0, selStart);
  const sel = text.slice(selStart, selEnd);
  const after = text.slice(selEnd);

  if (selStart === selEnd) {
    // No selection: empty fenced block, cursor on inner blank line
    const fence = "```";
    const insert = `\n${fence}\n\n${fence}`;
    const newText = before + insert + after;
    // Cursor after before + "\n```\n" = selStart + 1 + 3 + 1 = selStart + 5
    const cursorPos = selStart + 1 + 3 + 1; // "\n```\n"
    return { text: newText, selStart: cursorPos, selEnd: cursorPos };
  }

  // With selection: wrap in fenced block
  const fence = "```";
  const token = `${fence}\n${sel}\n${fence}`;
  const newText = before + token + after;
  const cursorPos = selStart + token.length;
  return { text: newText, selStart: cursorPos, selEnd: cursorPos };
}
