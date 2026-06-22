# Cálamo

A dependency-injected markdown editor for React, extracted from the [tintero](https://github.com/user/tintero) CMS.

## Installation

```bash
bun add calamo
```

## Public API

### `<Calamo />` Component

```tsx
import { Calamo } from 'calamo';

<Calamo
  name="content"           // optional: textarea name attribute
  defaultValue=""          // optional: initial markdown content
  id="editor"              // optional: textarea id
  className="..."          // optional: CSS class on the wrapper
  renderPreview={fn}       // required: async (markdown: string) => Promise<string> — returns rendered HTML
  listMedia={fn}           // optional: async () => Promise<CalamoAsset[]> — for the media picker
/>
```

Stores clean markdown. Preview is rendered via the injected `renderPreview` function (server action, API call, or any async fn).

### Toolbar Helpers (pure functions)

```ts
import { toggleWrap, toggleLinePrefix, insertLink, insertImageMarkdown, insertCodeBlock } from 'calamo';

toggleWrap(text: string, selStart: number, selEnd: number, marker: string): SelEdit
toggleLinePrefix(text: string, selStart: number, selEnd: number, prefix: string): SelEdit
insertLink(text: string, selStart: number, selEnd: number, url?: string): SelEdit
insertImageMarkdown(text: string, selStart: number, selEnd: number, url: string, alt?: string): SelEdit
insertCodeBlock(text: string, selStart: number, selEnd: number): SelEdit
```

### Types

```ts
type SelEdit = { text: string; selStart: number; selEnd: number };
type CalamoAsset = { url: string; filename: string };
```

## Philosophy

Cálamo stores clean markdown and delegates all rendering concerns to the consuming app via dependency injection — no bundled markdown parser, no bundled syntax highlighter.
