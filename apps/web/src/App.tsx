import { type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import LoginPage from './pages/LoginPage';
import EstimatesPage from './pages/EstimatesPage';
import EstimateEditorPage from './pages/EstimateEditorPage';
import RateCardsPage from './pages/RateCardsPage';

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
      <header className="bg-brand text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-lg">
            cost-reaper
          </Link>
          {user && (
            <nav className="flex items-center gap-4 text-sm">
              <Link to="/" className="hover:underline">
                Estimates
              </Link>
              <Link to="/rate-cards" className="hover:underline">
                Rate cards
              </Link>
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
            path="/rate-cards"
            element={
              <Protected>
                <RateCardsPage />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
