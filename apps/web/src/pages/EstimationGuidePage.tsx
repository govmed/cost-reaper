import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ESTIMATION_GUIDE } from '../lib/estimation-guide-content';
import type { GuideSection } from '../lib/user-guide-content';

/** Estimation Guide (NFR-12) — methodology & training at /estimation-guide. */
export default function EstimationGuidePage() {
  const location = useLocation();

  useEffect(() => {
    const id = location.hash.replace(/^#/, '');
    if (!id) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-2', 'ring-brand', 'ring-offset-2');
      window.setTimeout(() => el.classList.remove('ring-2', 'ring-brand', 'ring-offset-2'), 1600);
    }, 60);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Estimation Guide</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          How to build a good estimate — techniques, uncertainty, pricing, and pitfalls. For how to
          use the app, see the{' '}
          <Link to="/guide" className="text-brand hover:underline">
            User Guide
          </Link>
          .
        </p>
      </div>

      <div className="grid lg:grid-cols-[16rem_1fr] gap-6 items-start">
        <nav className="lg:sticky lg:top-20 bg-white border border-slate-200 rounded-xl p-4 text-sm">
          <div className="text-xs uppercase tracking-wide text-slate-400">Contents</div>
          <ul className="mt-1 space-y-0.5">
            {ESTIMATION_GUIDE.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-slate-600 hover:text-brand hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-5">
          {ESTIMATION_GUIDE.map((s) => (
            <Section key={s.id} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ s }: { s: GuideSection }) {
  return (
    <article
      id={s.id}
      className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 scroll-mt-20 transition-shadow"
    >
      <h2 className="text-lg font-semibold text-brand">{s.title}</h2>
      {s.body.map((p, i) => (
        <p key={i} className="text-sm text-slate-700 leading-relaxed">
          {p}
        </p>
      ))}
      {s.bullets && (
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
          {s.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {s.links && s.links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {s.links.map((l) => (
            <Link
              key={l.to + l.label}
              to={l.to}
              className="text-xs font-medium text-brand border border-brand/40 rounded px-2.5 py-1 hover:bg-teal-50"
            >
              {l.label} →
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
