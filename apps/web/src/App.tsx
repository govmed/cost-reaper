import { type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
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

/** Top navigation, in display order. `admin: true` items show only for Admins. */
const NAV_ITEMS: { to: string; label: string; admin?: boolean }[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/', label: 'Estimates' },
  { to: '/sow', label: 'Statements of Work' },
  { to: '/rate-cards', label: 'Rate Cards' },
  { to: '/workflows', label: 'Workflows', admin: true },
  { to: '/checklist-rules', label: 'Checklist Rules', admin: true },
  { to: '/reference-data', label: 'Reference Data', admin: true },
  { to: '/cloud-prices', label: 'Cloud Prices' },
  { to: '/fx-rates', label: 'FX Rates', admin: true },
  { to: '/users', label: 'Users', admin: true },
  { to: '/roles', label: 'Roles' },
  { to: '/guide', label: 'User Guide' },
  { to: '/estimation-guide', label: 'Estimation Guide' },
  { to: '/help', label: 'Help' },
];

function Protected({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-30 bg-brand text-white px-5 py-3 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-lg">
            cost-reaper
          </Link>
          {user && (
            <nav className="flex items-center gap-4 text-sm">
              {NAV_ITEMS.filter((i) => !i.admin || user.role === 'ADMIN').map((i) => (
                <Link key={i.to} to={i.to} className="hover:underline">
                  {i.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="opacity-90">
              {user.email} · {user.role}
            </span>
            <button onClick={logout} className="underline hover:no-underline">
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
    </div>
  );
}
