import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { Monitor, Moon, Sun } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme, type ThemePreference } from '../lib/theme';
import type { User } from '../types';

const themeOptions: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export function LoginPage() {
  const { user, login, loginDemo, loading } = useAuth();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('ana@escritorio.com');
  const [senha, setSenha] = useState('senha123');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [modoReativacao, setModoReativacao] = useState(false);
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenhaNova, setConfirmarSenhaNova] = useState('');

  const { data: demos } = useQuery({
    queryKey: ['usuarios-demo'],
    queryFn: () => api<User[]>('/auth/usuarios-demo'),
  });

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await login(email, senha);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AGUARDANDO_APROVACAO') {
        navigate('/aguardando-aprovacao', { state: { email } });
        return;
      }
      if (err instanceof ApiError && err.code === 'CONTA_INATIVA') {
        setModoReativacao(true);
        setErro(err.message);
        return;
      }
      setErro(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setEnviando(false);
    }
  }

  async function handleReativacao(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (senhaNova.length < 6) {
      setErro('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (senhaNova !== confirmarSenhaNova) {
      setErro('A confirmação não confere com a nova senha.');
      return;
    }
    setEnviando(true);
    try {
      await api('/auth/solicitar-reativacao', {
        method: 'POST',
        body: JSON.stringify({ email, senhaNova }),
      });
      navigate('/aguardando-aprovacao', { state: { email } });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AGUARDANDO_APROVACAO') {
        navigate('/aguardando-aprovacao', { state: { email } });
        return;
      }
      setErro(err instanceof Error ? err.message : 'Falha ao solicitar reativação');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-app-bg text-fg">
      <div className="hidden lg:flex bg-sidebar text-sidebar-fg p-12 flex-col justify-between">
        <div>
          <div className="text-accent text-sm font-semibold tracking-widest uppercase">
            Gestão Contábil
          </div>
          <h1 className="text-4xl font-bold mt-4 leading-tight">
            Agenda fiscal, tarefas e risco de multa em um só painel.
          </h1>
          <p className="text-sidebar-muted mt-4 max-w-md">
            Acompanhe prazos legais, entregas por colaborador e exposição a multas antes que o cliente
            seja penalizado.
          </p>
        </div>
        <div className="text-sm text-sidebar-muted">Demo · senha padrão: senha123</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-fg">
                {modoReativacao ? 'Solicitar reativação' : 'Entrar'}
              </h2>
              <p className="text-muted mt-1">
                {modoReativacao
                  ? 'Informe uma nova senha. Um gestor precisará aprovar o acesso.'
                  : 'Use e-mail/senha ou escolha um usuário demo.'}
              </p>
            </div>
            <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 shrink-0">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={preference === value}
                  onClick={() => setPreference(value)}
                  className={`p-2 rounded-md transition ${
                    preference === value
                      ? 'bg-accent text-accent-fg'
                      : 'text-muted hover:bg-surface-hover hover:text-fg'
                  }`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {!modoReativacao ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm text-muted">E-mail</span>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-muted">Senha</span>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  type="password"
                  required
                />
              </label>
              {erro && (
                <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-3 py-2">
                  {erro}
                </div>
              )}
              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-accent hover:opacity-90 text-accent-fg rounded-lg py-2.5 font-medium disabled:opacity-60 min-h-11"
              >
                {enviando ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoReativacao(true);
                  setErro('');
                }}
                className="w-full text-sm text-muted hover:text-fg underline underline-offset-2 min-h-10"
              >
                Conta desativada? Solicitar reativação
              </button>
            </form>
          ) : (
            <form onSubmit={handleReativacao} className="space-y-4">
              <label className="block">
                <span className="text-sm text-muted">E-mail da conta</span>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-muted">Nova senha</span>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  value={senhaNova}
                  onChange={(e) => setSenhaNova(e.target.value)}
                  type="password"
                  required
                  minLength={6}
                />
              </label>
              <label className="block">
                <span className="text-sm text-muted">Confirmar nova senha</span>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  value={confirmarSenhaNova}
                  onChange={(e) => setConfirmarSenhaNova(e.target.value)}
                  type="password"
                  required
                  minLength={6}
                />
              </label>
              {erro && (
                <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-3 py-2">
                  {erro}
                </div>
              )}
              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-accent hover:opacity-90 text-accent-fg rounded-lg py-2.5 font-medium disabled:opacity-60 min-h-11"
              >
                {enviando ? 'Enviando...' : 'Enviar pedido de reativação'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoReativacao(false);
                  setErro('');
                  setSenhaNova('');
                  setConfirmarSenhaNova('');
                }}
                className="w-full text-sm text-muted hover:text-fg underline underline-offset-2 min-h-10"
              >
                Voltar ao login
              </button>
            </form>
          )}

          {!modoReativacao && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted mb-2">Acesso rápido (demo)</div>
              <div className="grid gap-2">
                {(demos ?? []).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => loginDemo(u)}
                    className="text-left px-3 py-2.5 rounded-lg border border-border bg-surface hover:border-accent hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
                  >
                    <div className="font-medium text-sm text-fg">{u.nome}</div>
                    <div className="text-xs text-muted">
                      {u.papel} · {u.email}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
