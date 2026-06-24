import { describe, expect, test } from "bun:test";
import {
  toggleWrap,
  toggleLinePrefix,
  insertLink,
  insertImageMarkdown,
  insertCodeBlock,
  insertHorizontalRule,
  insertTable,
} from "../src/markdown-toolbar";

// ============================================================
// Domain 1: toggleWrap
// ============================================================

describe("toggleWrap", () => {
  test("wraps selection in bold markers", () => {
    const result = toggleWrap("Hello world", 6, 11, "**");
    expect(result).toEqual({ text: "Hello **world**", selStart: 8, selEnd: 13 });
  });

  test("unwraps already-wrapped bold selection", () => {
    const result = toggleWrap("Hello **world**", 8, 13, "**");
    expect(result).toEqual({ text: "Hello world", selStart: 6, selEnd: 11 });
  });

  test("no selection — inserts marker pair with cursor between", () => {
    const result = toggleWrap("Hello", 5, 5, "*");
    expect(result).toEqual({ text: "Hello**", selStart: 6, selEnd: 6 });
  });

  test("wraps at position 0 with backtick", () => {
    const result = toggleWrap("world", 0, 5, "`");
    expect(result).toEqual({ text: "`world`", selStart: 1, selEnd: 6 });
  });
});

// ============================================================
// Domain 2: toggleLinePrefix
// ============================================================

describe("toggleLinePrefix", () => {
  test("adds heading prefix to single line", () => {
    const result = toggleLinePrefix("Hello\nWorld", 0, 5, "## ");
    expect(result.text).toBe("## Hello\nWorld");
    expect(result.selStart).toBe(0);
    expect(result.selEnd).toBe("## Hello".length);
  });

  test("removes existing heading prefix from single line", () => {
    const result = toggleLinePrefix("## Hello\nWorld", 3, 8, "## ");
    expect(result.text).toBe("Hello\nWorld");
    // selStart = lineStart = 0, selEnd = lineStart + "Hello".length = 5
    expect(result.selStart).toBe(0);
    expect(result.selEnd).toBe(5);
  });

  test("adds list prefix to all touched lines in multi-line selection", () => {
    const result = toggleLinePrefix("Line1\nLine2\nLine3", 0, 11, "- ");
    // Selection covers "Line1\nLine2" (indices 0..10 = chars L,i,n,e,1,\n,L,i,n,e,2)
    expect(result.text).toBe("- Line1\n- Line2\nLine3");
  });

  test("removes list prefix from all lines when all already prefixed", () => {
    // "- A\n- B\n- C" — selStart=0, selEnd=11 touches "- A\n- B\n- "
    // All 3 lines touched are prefixed, so remove
    const result = toggleLinePrefix("- A\n- B\n- C", 0, 11, "- ");
    expect(result.text).toBe("A\nB\nC");
  });
});

// ============================================================
// Domain 3: insertLink
// ============================================================

describe("insertLink", () => {
  test("selection becomes link text", () => {
    const result = insertLink("visit site", 6, 10, "https://example.com");
    expect(result.text).toBe("visit [site](https://example.com)");
    // cursor after closing )
    const expected = "visit [site](https://example.com)".length;
    expect(result.selStart).toBe(expected);
    expect(result.selEnd).toBe(expected);
  });

  test("no selection — empty brackets with cursor inside", () => {
    const result = insertLink("click here", 5, 5, "https://example.com");
    expect(result.text).toBe("click[](https://example.com) here");
    // cursor inside [], i.e. selStart = 5+1 = 6
    expect(result.selStart).toBe(6);
    expect(result.selEnd).toBe(6);
  });
});

// ============================================================
// Domain 4: insertImageMarkdown
// ============================================================

describe("insertImageMarkdown", () => {
  test("inserts with explicit alt, no selection", () => {
    const result = insertImageMarkdown("Hello world", 5, 5, "/uploads/a.png", "dog");
    expect(result.text).toBe("Hello![dog](/uploads/a.png) world");
    expect(result.selStart).toBe(27);
    expect(result.selEnd).toBe(27);
  });

  test("selection becomes alt text when alt omitted", () => {
    const result = insertImageMarkdown("my photo here", 3, 8, "/uploads/d.png");
    expect(result.text).toBe("my ![photo](/uploads/d.png) here");
    expect(result.selStart).toBe(27);
    expect(result.selEnd).toBe(27);
  });

  test("empty alt with no selection produces ![](url)", () => {
    const result = insertImageMarkdown("abc", 1, 1, "/uploads/e.png");
    expect(result.text).toBe("a![](/uploads/e.png)bc");
    expect(result.selStart).toBe(20);
    expect(result.selEnd).toBe(20);
  });

  test("inserts at position 0", () => {
    const result = insertImageMarkdown("world", 0, 0, "/uploads/b.png", "cat");
    expect(result.text).toBe("![cat](/uploads/b.png)world");
    expect(result.selStart).toBe(22);
    expect(result.selEnd).toBe(22);
  });

  test("inserts at end of text", () => {
    const result = insertImageMarkdown("Hello", 5, 5, "/uploads/c.png", "x");
    expect(result.text).toBe("Hello![x](/uploads/c.png)");
    expect(result.selStart).toBe(25);
    expect(result.selEnd).toBe(25);
  });
});

// ============================================================
// Domain 5: insertCodeBlock
// ============================================================

describe("insertCodeBlock", () => {
  test("wraps selection in fenced code block", () => {
    const result = insertCodeBlock("before\ncode line\nafter", 7, 16);
    expect(result.text).toContain("```\ncode line\n```");
    // outer lines intact
    expect(result.text).toContain("before\n");
    expect(result.text).toContain("\nafter");
  });

  test("no selection — empty fenced block with cursor on inner blank line", () => {
    const result = insertCodeBlock("above\nbelow", 5, 5);
    expect(result.text).toBe("above\n```\n\n```\nbelow");
    // cursor is on the empty inner line: after "above\n```\n" = 10
    expect(result.selStart).toBe(10);
    expect(result.selEnd).toBe(10);
  });
});

// ============================================================
// Domain 6: toggleWrap — Strikethrough
// ============================================================

describe("toggleWrap — strikethrough", () => {
  test("wraps selected text in ~~ markers", () => {
    const result = toggleWrap("Hello world", 6, 11, "~~");
    expect(result).toEqual({ text: "Hello ~~world~~", selStart: 8, selEnd: 13 });
  });

  test("unwraps already-wrapped ~~text~~", () => {
    const result = toggleWrap("Hello ~~world~~", 8, 13, "~~");
    expect(result).toEqual({ text: "Hello world", selStart: 6, selEnd: 11 });
  });

  test("no selection — inserts ~~~~ at cursor, selStart = cursor+2", () => {
    const result = toggleWrap("Hello", 5, 5, "~~");
    expect(result).toEqual({ text: "Hello~~~~", selStart: 7, selEnd: 7 });
  });
});

// ============================================================
// Domain 7: toggleLinePrefix — Ordered list
// ============================================================

describe("toggleLinePrefix — ordered list", () => {
  test("adds '1. ' prefix to a line", () => {
    const result = toggleLinePrefix("Buy milk\nBuy eggs", 0, 8, "1. ");
    expect(result.text).toBe("1. Buy milk\nBuy eggs");
  });

  test("removes '1. ' prefix if all lines already have it", () => {
    const result = toggleLinePrefix("1. Buy milk\n1. Buy eggs", 0, 11, "1. ");
    expect(result.text).toBe("Buy milk\n1. Buy eggs");
  });
});

// ============================================================
// Domain 8: toggleLinePrefix — Task list
// ============================================================

describe("toggleLinePrefix — task list", () => {
  test("adds '- [ ] ' prefix to a line", () => {
    const result = toggleLinePrefix("Write tests\nImplement", 0, 11, "- [ ] ");
    expect(result.text).toBe("- [ ] Write tests\nImplement");
  });

  test("removes '- [ ] ' prefix if all lines already have it", () => {
    const result = toggleLinePrefix("- [ ] Write tests\n- [ ] Implement", 0, 17, "- [ ] ");
    expect(result.text).toBe("Write tests\n- [ ] Implement");
  });
});

// ============================================================
// Domain 9: insertHorizontalRule
// ============================================================

describe("insertHorizontalRule", () => {
  test("empty doc — inserts \\n\\n---\\n\\n, cursor at end", () => {
    const result = insertHorizontalRule("", 0, 0);
    expect(result.text).toBe("\n\n---\n\n");
    expect(result.selStart).toBe(7);
    expect(result.selEnd).toBe(7);
  });

  test("mid-document — inserts at cursor, cursor lands after the block", () => {
    const result = insertHorizontalRule("before", 6, 6);
    expect(result.text).toBe("before\n\n---\n\n");
    // "before" = 6, block = "\n\n---\n\n" = 7, cursor = 6 + 7 = 13
    expect(result.selStart).toBe(13);
    expect(result.selEnd).toBe(13);
  });

  test("with selection — selection is replaced, cursor after block", () => {
    const result = insertHorizontalRule("before REPLACE after", 7, 14);
    expect(result.text).toBe("before \n\n---\n\n after");
    expect(result.selStart).toBe(14);
    expect(result.selEnd).toBe(14);
  });
});

// ============================================================
// Domain 10: insertTable
// ============================================================

describe("insertTable", () => {
  test("empty doc — inserts full GFM table skeleton, cursor at end", () => {
    const block = "\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |\n\n";
    const result = insertTable("", 0, 0);
    expect(result.text).toBe(block);
    expect(result.selStart).toBe(block.length);
    expect(result.selEnd).toBe(block.length);
  });

  test("mid-doc — inserts at cursor, cursor after block", () => {
    const block = "\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |\n\n";
    const result = insertTable("before", 6, 6);
    expect(result.text).toBe("before" + block);
    expect(result.selStart).toBe(6 + block.length);
    expect(result.selEnd).toBe(6 + block.length);
  });
});
