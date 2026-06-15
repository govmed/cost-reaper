import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { useRefLabeler } from './lib/refLabels';
import BrandLogo from './components/BrandLogo';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EstimatesPage from './pages/EstimatesPage';
import EstimateEditorPage from './pages/EstimateEditorPage';
import PrintSummaryPage from './pages/PrintSummaryPage';
import RateCardsPage from './pages/RateCardsPage';
import UsersPage from './pages/UsersPage';
import CloudPricesPage from './pages/CloudPricesPage';
import ReferenceDataPage from './pages/ReferenceDataPage';
import FxRatesPage from './pages/FxRatesPage';
import HelpPage from './pages/HelpPage';
import WorkflowPage from './pages/WorkflowPage';
import WorkflowsRepoPage from './pages/WorkflowsRepoPage';
import ChecklistRulesPage from './pages/ChecklistRulesPage';
import ChecklistRuleSetsPage from './pages/ChecklistRuleSetsPage';
import SowListPage from './pages/SowListPage';
import SowEditorPage from './pages/SowEditorPage';
import SowPrintPage from './pages/SowPrintPage';
import SsoCallbackPage from './pages/SsoCallbackPage';
import RolesPage from './pages/RolesPage';
import UserGuidePage from './pages/UserGuidePage';
import EstimationGuidePage from './pages/EstimationGuidePage';

type NavLink = { to: string; label: string; admin?: boolean };
type NavGroup = { label: string; items: NavLink[] };
type NavEntry = NavLink | NavGroup;

/**
 * Top navigation. A few primary destinations sit as direct links; the rest are
 * grouped under tidy dropdown menus so the strip stays uncluttered. `admin: true`
 * items show only for Admins; a group with no visible items is hidden entirely.
 */
const NAV: NavEntry[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/', label: 'Estimates' },
  { to: '/sow', label: 'SOW' },
  {
    label: 'Pricing',
    items: [
      { to: '/rate-cards', label: 'Rate Cards' },
      { to: '/cloud-prices', label: 'Cloud Prices' },
      { to: '/fx-rates', label: 'FX Rates', admin: true },
    ],
  },
  {
    label: 'Governance',
    items: [
      { to: '/workflows', label: 'Workflows', admin: true },
      { to: '/checklist-rules', label: 'Checklist Rules', admin: true },
      { to: '/roles', label: 'Roles' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/users', label: 'Users', admin: true },
      { to: '/reference-data', label: 'Reference Data', admin: true },
    ],
  },
  {
    label: 'Docs',
    items: [
      { to: '/guide', label: 'User Guide' },
      { to: '/estimation-guide', label: 'Estimation Guide' },
      { to: '/help', label: 'Help' },
    ],
  },
];

const isGroup = (e: NavEntry): e is NavGroup => (e as NavGroup).items !== undefined;

function routeActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/' || pathname.startsWith('/estimates');
  return pathname === to || pathname.startsWith(`${to}/`);
}

const navItemClass = (active: boolean) =>
  `px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
    active
      ? 'bg-white/15 text-white font-medium'
      : 'text-white/80 hover:bg-white/10 hover:text-white'
  }`;

/** Professional top nav: direct links + grouped dropdown menus (FE-47/usability). */
function TopNav({ isAdmin }: { isAdmin: boolean }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  // Close the open menu on an outside click or when the route changes.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  useEffect(() => setOpen(null), [pathname]);

  return (
    <nav ref={ref} className="flex items-center gap-1 flex-wrap">
      {NAV.map((entry) => {
        if (!isGroup(entry)) {
          return (
            <Link
              key={entry.to}
              to={entry.to}
              className={navItemClass(routeActive(pathname, entry.to))}
            >
              {entry.label}
            </Link>
          );
        }
        const items = entry.items.filter((i) => !i.admin || isAdmin);
        if (items.length === 0) return null;
        const groupActive = items.some((i) => routeActive(pathname, i.to));
        const isOpen = open === entry.label;
        return (
          <div key={entry.label} className="relative">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : entry.label)}
              aria-expanded={isOpen}
              className={`${navItemClass(groupActive || isOpen)} inline-flex items-center gap-1`}
            >
              {entry.label}
              <span
                aria-hidden
                className={`text-[0.6rem] transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            </button>
            {isOpen && (
              <div className="absolute left-0 mt-1 min-w-[12rem] rounded-lg bg-white py-1 text-slate-700 shadow-lg ring-1 ring-black/5 z-40">
                {items.map((i) => (
                  <Link
                    key={i.to}
                    to={i.to}
                    className={`block px-3 py-1.5 text-sm hover:bg-slate-100 ${
                      routeActive(pathname, i.to) ? 'bg-slate-50 font-medium text-brand' : ''
                    }`}
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function Protected({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// The signed-in user's role badge. Its own component so the ROLE reference fetch
// only runs once a user exists (not on the login screen). Label is DB-driven
// (FR-29) and falls back to the raw role code until it loads.
function RolePill({ role }: { role: string }) {
  const roleLabeler = useRefLabeler('ROLE');
  return (
    <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
      {roleLabeler.label(role)}
    </span>
  );
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-30 bg-brand text-white px-5 py-2.5 flex items-center justify-between gap-4 shadow-sm print:hidden">
        <div className="flex items-center gap-5 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 whitespace-nowrap">
            <BrandLogo className="h-7" />
            <span className="leading-tight">
              <span className="block text-lg font-semibold tracking-tight">Kerdos</span>
              <span className="block text-[0.6rem] font-medium uppercase tracking-[0.18em] text-white/70">
                Veridion LLC
              </span>
            </span>
          </Link>
          {user && <TopNav isAdmin={user.role === 'ADMIN'} />}
        </div>
        {user && (
          <div className="flex items-center gap-3 text-sm whitespace-nowrap">
            <span className="hidden md:inline text-white/80">{user.email}</span>
            <RolePill role={user.role} />
            <button
              onClick={logout}
              className="rounded-md border border-white/25 px-2.5 py-1 text-sm hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto p-5">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sso/callback" element={<SsoCallbackPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <EstimatesPage />
              </Protected>
            }
          />
          <Route
            path="/estimates/:id"
            element={
              <Protected>
                <EstimateEditorPage />
              </Protected>
            }
          />
          <Route
            path="/estimates/:id/print"
            element={
              <Protected>
                <PrintSummaryPage />
              </Protected>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <DashboardPage />
              </Protected>
            }
          />
          <Route
            path="/rate-cards"
            element={
              <Protected>
                <RateCardsPage />
              </Protected>
            }
          />
          <Route
            path="/users"
            element={
              <Protected>
                <UsersPage />
              </Protected>
            }
          />
          <Route
            path="/cloud-prices"
            element={
              <Protected>
                <CloudPricesPage />
              </Protected>
            }
          />
          <Route
            path="/reference-data"
            element={
              <Protected>
                <ReferenceDataPage />
              </Protected>
            }
          />
          <Route
            path="/fx-rates"
            element={
              <Protected>
                <FxRatesPage />
              </Protected>
            }
          />
          <Route
            path="/help"
            element={
              <Protected>
                <HelpPage />
              </Protected>
            }
          />
          <Route
            path="/roles"
            element={
              <Protected>
                <RolesPage />
              </Protected>
            }
          />
          <Route
            path="/guide"
            element={
              <Protected>
                <UserGuidePage />
              </Protected>
            }
          />
          <Route
            path="/estimation-guide"
            element={
              <Protected>
                <EstimationGuidePage />
              </Protected>
            }
          />
          <Route
            path="/workflows"
            element={
              <Protected>
                <WorkflowsRepoPage />
              </Protected>
            }
          />
          <Route
            path="/workflows/:id"
            element={
              <Protected>
                <WorkflowPage />
              </Protected>
            }
          />
          <Route
            path="/checklist-rules"
            element={
              <Protected>
                <ChecklistRuleSetsPage />
              </Protected>
            }
          />
          <Route
            path="/checklist-rules/:id"
            element={
              <Protected>
                <ChecklistRulesPage />
              </Protected>
            }
          />
          <Route
            path="/sow"
            element={
              <Protected>
                <SowListPage />
              </Protected>
            }
          />
          <Route
            path="/sow/:id"
            element={
              <Protected>
                <SowEditorPage />
              </Protected>
            }
          />
          <Route
            path="/sow/:id/print"
            element={
              <Protected>
                <SowPrintPage />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="mt-8 border-t border-slate-200 py-4 text-center text-xs text-slate-400 print:hidden">
        <span className="font-medium text-slate-500">Kerdos</span> — Project Cost Estimator · &copy;{' '}
        {new Date().getFullYear()} Veridion LLC
      </footer>
    </div>
  );
}
