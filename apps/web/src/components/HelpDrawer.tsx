import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCaseById } from '../lib/help-content';

/**
 * Contextual help drawer (NFR-12) — a right-side slide-over that shows the
 * "how-to" for the card it was opened from, pulled from the shared help-content
 * catalog so it always matches the full Help page. Each card passes the relevant
 * `useCaseIds`; the drawer renders those use cases (goal + numbered steps) and
 * links out to the full guide.
 */
export default function HelpDrawer({
  open,
  onClose,
  title,
  useCaseIds,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  useCaseIds: string[];
}) {
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const cases = useCaseIds
    .map((id) => useCaseById(id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`How to: ${title}`}
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close help"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
      />
      {/* Panel */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">How to</p>
            <h2 className="text-lg font-semibold text-brand">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="shrink-0 w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 text-xl leading-none"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {cases.length === 0 && (
            <p className="text-sm text-slate-500">No help is available for this section yet.</p>
          )}
          {cases.map((c) => (
            <article key={c.id} className="space-y-2">
              <h3 className="font-medium text-slate-800">{c.title}</h3>
              <p className="text-sm text-slate-500">{c.goal}</p>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
                {c.steps.map((s, i) => (
                  <li key={i}>
                    <span>{s.text}</span>
                    {s.detail && <p className="text-xs text-slate-500 mt-0.5">{s.detail}</p>}
                  </li>
                ))}
              </ol>
              <Link
                to={`/help#uc-${c.id}`}
                onClick={onClose}
                className="inline-block text-xs text-brand hover:underline"
              >
                Open full guide →
              </Link>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
