import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuth } from './lib/auth';
import { LoginPage } from './pages/LoginPage';
import { AgendaPage } from './pages/AgendaPage';
import { MinhasTarefasPage } from './pages/MinhasTarefasPage';
import { AtrasosPage } from './pages/AtrasosPage';
import { RendimentoPage } from './pages/RendimentoPage';
import { ClientesPage, ColaboradoresPage, ObrigacoesPage } from './pages/CadastrosPage';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg text-muted">
        Carregando...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<AgendaPage />} />
        <Route path="tarefas" element={<MinhasTarefasPage />} />
        <Route path="atrasos" element={<AtrasosPage />} />
        <Route path="rendimento" element={<RendimentoPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="colaboradores" element={<ColaboradoresPage />} />
        <Route path="obrigacoes" element={<ObrigacoesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
