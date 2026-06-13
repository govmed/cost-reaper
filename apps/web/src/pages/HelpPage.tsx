import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HELP_CATEGORIES,
  searchUseCases,
  useCasesByCategory,
  type UseCase,
} from '../lib/help-content';

/** Scroll to + briefly highlight a use case by its anchor id (deep-link target). */
function flashUseCase(id: string): void {
  const el = document.getElementById(`uc-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.add('ring-2', 'ring-brand', 'ring-offset-2');
  window.setTimeout(() => el.classList.remove('ring-2', 'ring-brand', 'ring-offset-2'), 1800);
}

export default function HelpPage() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchUseCases(query), [query]);
  const visible = useMemo(() => new Set(results.map((u) => u.id)), [results]);

  // Deep-link: navigating to /help#uc-<id> scrolls to and flashes that use case.
  useEffect(() => {
    const hash = location.hash.replace(/^#/, '');
    if (!hash.startsWith('uc-')) return;
    const id = hash.slice(3);
    // Defer so the section is mounted before we scroll.
    const t = window.setTimeout(() => flashUseCase(id), 60);
    return () => window.clearTimeout(t);
  }, [location.hash, query]);

  const categories = HELP_CATEGORIES.map((c) => ({
    category: c,
    items: useCasesByCategory(c).filter((u) => visible.has(u.id)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Help &amp; use cases</h1>
          <p className="text-slate-500 text-sm">
            Step-by-step guides for every task. Links elsewhere in the app deep-link straight to the
            relevant guide.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guides… (e.g. cloud, upcharge, rate card)"
          className="border border-slate-300 rounded px-3 py-2 text-sm w-72"
        />
      </div>

      <div className="grid lg:grid-cols-[16rem_1fr] gap-6 items-start">
        {/* Table of contents */}
        <nav className="lg:sticky lg:top-4 space-y-4 text-sm bg-white border border-slate-200 rounded-xl p-4">
          {categories.length === 0 && <p className="text-slate-400">No guides match “{query}”.</p>}
          {categories.map((g) => (
            <div key={g.category}>
              <div className="text-xs uppercase tracking-wide text-slate-400">{g.category}</div>
              <ul className="mt-1 space-y-0.5">
                {g.items.map((u) => (
                  <li key={u.id}>
                    <a
                      href={`#uc-${u.id}`}
                      onClick={() => flashUseCase(u.id)}
                      className="text-slate-600 hover:text-brand hover:underline"
                    >
                      {u.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Use cases */}
        <div className="space-y-8">
          {categories.map((g) => (
            <section key={g.category} className="space-y-4">
              <h2 className="text-lg font-semibold text-brand border-b border-slate-200 pb-1">
                {g.category}
              </h2>
              {g.items.map((u) => (
                <UseCaseCard key={u.id} u={u} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function UseCaseCard({ u }: { u: UseCase }) {
  return (
    <article
      id={`uc-${u.id}`}
      className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 scroll-mt-20 transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-slate-900">{u.title}</h3>
          <p className="text-sm text-slate-500">{u.goal}</p>
        </div>
        <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 whitespace-nowrap">
          {u.persona}
        </span>
      </div>

      <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-700">
        {u.steps.map((s, i) => (
          <li key={i}>
            <span>{s.text}</span>
            {s.detail && <div className="ml-5 text-slate-500 text-xs mt-0.5">{s.detail}</div>}
          </li>
        ))}
      </ol>

      {u.related && u.related.length > 0 && (
        <div className="text-xs text-slate-500">
          See also:{' '}
          {u.related.map((rid, i) => (
            <span key={rid}>
              {i > 0 && ', '}
              <a href={`#uc-${rid}`} className="text-brand hover:underline">
                {rid}
              </a>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100">
        {u.route && (
          <Link
            to={u.route}
            className="text-xs font-medium text-white bg-brand rounded px-2.5 py-1 hover:opacity-90"
          >
            Go there →
          </Link>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          {u.featureIds.map((f) => (
            <span
              key={f}
              className="text-[11px] font-mono rounded bg-teal-50 text-teal-700 px-1.5 py-0.5"
              title="Requirement / feature ID"
            >
              {f}
            </span>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-slate-300 font-mono" title="Deep-link anchor">
          #uc-{u.id}
        </span>
      </div>
    </article>
  );
}
