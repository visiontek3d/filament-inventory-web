import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import AuthPage from './pages/AuthPage';
import FilamentListPage from './pages/FilamentListPage';
import FilamentDetailPage from './pages/FilamentDetailPage';
import FilamentAddEditPage from './pages/FilamentAddEditPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d0d0d' }}>
      <div className="spinner" />
    </div>
  );

  if (!session) return <AuthPage />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                       element={<Navigate to="/filaments" replace />} />
        <Route path="/filaments"              element={<FilamentListPage />} />
        <Route path="/filaments/new"          element={<FilamentAddEditPage />} />
        <Route path="/filaments/:id"          element={<FilamentDetailPage />} />
        <Route path="/filaments/:id/edit"     element={<FilamentAddEditPage />} />
        <Route path="/settings"               element={<SettingsPage />} />
        <Route path="*"                       element={<Navigate to="/filaments" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
