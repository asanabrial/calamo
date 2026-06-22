"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { MediaPickerModal } from "./media-picker-modal";
import {
  insertCodeBlock,
  insertImageMarkdown,
  insertLink,
  toggleLinePrefix,
  toggleWrap,
  type SelEdit,
} from "./markdown-toolbar";

export interface CalamoAsset {
  url: string;
  filename: string;
  alt?: string;
}

export interface CalamoProps {
  name?: string;
  defaultValue?: string;
  id?: string;
  className?: string;
  renderPreview: (md: string) => Promise<string>;
  listMedia?: () => Promise<CalamoAsset[]>;
}

interface PendingSel {
  selStart: number;
  selEnd: number;
}

export function Calamo({
  name = "body",
  defaultValue = "",
  id,
  className,
  renderPreview,
  listMedia,
}: CalamoProps) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSel = useRef<PendingSel | null>(null);

  // Restore selection after value update
  useLayoutEffect(() => {
    const sel = pendingSel.current;
    const el = textareaRef.current;
    if (sel && el) {
      el.selectionStart = sel.selStart;
      el.selectionEnd = sel.selEnd;
      el.focus();
      pendingSel.current = null;
    }
  }, [value]);

  function applyEdit(fn: (text: string, selStart: number, selEnd: number) => SelEdit) {
    const el = textareaRef.current;
    if (!el) return;
    const selStart = el.selectionStart;
    const selEnd = el.selectionEnd;
    const result = fn(value, selStart, selEnd);
    pendingSel.current = { selStart: result.selStart, selEnd: result.selEnd };
    setValue(result.text);
  }

  async function handlePreviewTab() {
    setTab("preview");
    setIsPreviewLoading(true);
    try {
      const html = await renderPreview(value);
      setPreviewHtml(html);
    } finally {
      setIsPreviewLoading(false);
    }
  }

  const btnClass =
    "px-2 py-1 text-xs font-mono rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-500";

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-t transition-colors focus:outline-none ${
      active
        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 border border-b-white dark:border-zinc-700 dark:border-b-zinc-800"
        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
    }`;

  return (
    <div
      className={
        className ??
        "rounded-md border border-zinc-300 dark:border-zinc-700 overflow-hidden"
      }
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 pt-1 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={tabClass(tab === "write")}
        >
          Write
        </button>
        <button
          type="button"
          onClick={handlePreviewTab}
          className={tabClass(tab === "preview")}
        >
          Preview
        </button>
      </div>

      {/* Toolbar */}
      {tab === "write" && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-700">
          <button
            type="button"
            title="Bold"
            onClick={() => applyEdit((t, s, e) => toggleWrap(t, s, e, "**"))}
            className={btnClass}
          >
            B
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => applyEdit((t, s, e) => toggleWrap(t, s, e, "*"))}
            className={btnClass}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            title="Inline Code"
            onClick={() => applyEdit((t, s, e) => toggleWrap(t, s, e, "`"))}
            className={btnClass}
          >
            {"`"}
          </button>
          <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1" aria-hidden="true" />
          <button
            type="button"
            title="Heading"
            onClick={() => applyEdit((t, s, e) => toggleLinePrefix(t, s, e, "## "))}
            className={btnClass}
          >
            H2
          </button>
          <button
            type="button"
            title="Quote"
            onClick={() => applyEdit((t, s, e) => toggleLinePrefix(t, s, e, "> "))}
            className={btnClass}
          >
            {`"`}
          </button>
          <button
            type="button"
            title="List"
            onClick={() => applyEdit((t, s, e) => toggleLinePrefix(t, s, e, "- "))}
            className={btnClass}
          >
            &#8226;
          </button>
          <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1" aria-hidden="true" />
          <button
            type="button"
            title="Link"
            onClick={() => applyEdit((t, s, e) => insertLink(t, s, e))}
            className={btnClass}
          >
            Link
          </button>
          {listMedia ? (
            <button
              type="button"
              title="Image"
              onClick={() => setMediaOpen(true)}
              className={btnClass}
            >
              Img
            </button>
          ) : null}
          <button
            type="button"
            title="Code Block"
            onClick={() => applyEdit((t, s, e) => insertCodeBlock(t, s, e))}
            className={btnClass}
          >
            {`{}`}
          </button>
        </div>
      )}

      {/* Write tab */}
      {tab === "write" && (
        <textarea
          ref={textareaRef}
          name={name}
          id={id}
          required
          rows={20}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="block w-full bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500 transition-colors font-mono text-xs resize-y"
        />
      )}

      {/* Preview tab */}
      {tab === "preview" && (
        <div className="min-h-[20rem] bg-white dark:bg-zinc-800 px-4 py-3">
          {isPreviewLoading ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 animate-pulse">
              Rendering preview…
            </p>
          ) : (
            <div
              className="prose prose-zinc dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
      )}

      {/* Media Picker Modal */}
      {listMedia ? (
        <MediaPickerModal
          open={mediaOpen}
          listMedia={listMedia}
          onClose={() => setMediaOpen(false)}
          onSelect={(asset) => {
            setMediaOpen(false);
            applyEdit((t, s, e) =>
              insertImageMarkdown(t, s, e, asset.url, asset.alt ?? asset.filename)
            );
          }}
        />
      ) : null}
    </div>
  );
}
