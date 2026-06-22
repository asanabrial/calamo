"use client";

import { useEffect, useRef, useState } from "react";
import type { CalamoAsset } from "./calamo";

interface MediaPickerModalProps {
  open: boolean;
  listMedia: () => Promise<CalamoAsset[]>;
  onClose: () => void;
  onSelect: (asset: CalamoAsset) => void;
}

/**
 * Inner panel that renders only when the modal is open.
 * By creating a new instance each time `open` becomes true, state is naturally
 * reset without setState-in-effect violations.
 */
function MediaPickerPanel({
  listMedia,
  onClose,
  onSelect,
}: {
  listMedia: () => Promise<CalamoAsset[]>;
  onClose: () => void;
  onSelect: (asset: CalamoAsset) => void;
}) {
  // null = loading, array = loaded
  const [assets, setAssets] = useState<CalamoAsset[] | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [manualAlt, setManualAlt] = useState("");
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Fetch assets on mount (panel is only mounted when open)
  useEffect(() => {
    let cancelled = false;
    listMedia()
      .then((list) => {
        if (!cancelled) setAssets(list);
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [listMedia]);

  // Focus close button on mount
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  // Escape key closes the modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleManualConfirm() {
    if (!manualUrl.trim()) return;
    onSelect({ url: manualUrl.trim(), filename: manualUrl.trim(), alt: manualAlt.trim() || undefined });
    onClose();
  }

  const loading = assets === null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-label="Select image"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-lg bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Select Image
          </h2>
          <button
            ref={firstFocusRef}
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Asset grid */}
          <section>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Uploaded media
            </p>
            {loading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 animate-pulse">
                Loading…
              </p>
            ) : assets.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                No uploads found. Use the manual URL below.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {assets.map((asset) => (
                  <button
                    key={asset.url}
                    type="button"
                    onClick={() => {
                      onSelect(asset);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 p-1.5 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.alt ?? asset.filename}
                      className="w-full h-16 object-cover rounded"
                    />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate w-full text-center">
                      {asset.filename}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Manual URL input */}
          <section className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Or enter URL manually
            </p>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="https://example.com/image.png"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <input
                type="text"
                placeholder="Alt text (optional)"
                value={manualAlt}
                onChange={(e) => setManualAlt(e.target.value)}
                className="block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <button
                type="button"
                disabled={!manualUrl.trim()}
                onClick={handleManualConfirm}
                className="rounded-md bg-zinc-900 dark:bg-zinc-50 px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                Insert image
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * MediaPickerModal — conditionally renders the panel so state is always fresh.
 */
export function MediaPickerModal({
  open,
  listMedia,
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  if (!open) return null;
  return (
    <MediaPickerPanel listMedia={listMedia} onClose={onClose} onSelect={onSelect} />
  );
}
