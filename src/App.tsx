import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

const AuthLoading = () => (
  <div className="min-h-dvh bg-black flex items-center justify-center text-[#E1E0CC]">Loading...</div>
);

function RequireAuth({ isAuthenticated, children }: { isAuthenticated: boolean | null; children: ReactNode }) {
  if (isAuthenticated === null) return <AuthLoading />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireGuest({ isAuthenticated, children }: { isAuthenticated: boolean | null; children: ReactNode }) {
  if (isAuthenticated === null) return <AuthLoading />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

interface AnimatedRoutesProps {
  isAuthenticated: boolean | null;
  user: AuthUser | null;
  refreshAuth: () => Promise<boolean>;
}

function AnimatedRoutes({ isAuthenticated, user, refreshAuth }: AnimatedRoutesProps) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <RequireGuest isAuthenticated={isAuthenticated}>
              <Login onAuthChange={refreshAuth} />
            </RequireGuest>
          }
        />
        <Route
          path="/signup"
          element={
            <RequireGuest isAuthenticated={isAuthenticated}>
              <Signup onAuthChange={refreshAuth} />
            </RequireGuest>
          }
        />
        <Route
          path="/dashboard/:habitId?"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Dashboard user={user} />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshAuth = () =>
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(data.authenticated);
        setUser(data.user || null);
        return Boolean(data.authenticated);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      });

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <Router>
      <AnimatedRoutes isAuthenticated={isAuthenticated} user={user} refreshAuth={refreshAuth} />
    </Router>
  );
}
