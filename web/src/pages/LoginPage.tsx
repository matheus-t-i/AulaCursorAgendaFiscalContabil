import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { User } from '../types';

export function LoginPage() {
  const { user, login, loginDemo, loading } = useAuth();
  const [email, setEmail] = useState('ana@escritorio.com');
  const [senha, setSenha] = useState('senha123');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

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
      setErro(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-slate-900 text-white p-12 flex-col justify-between">
        <div>
          <div className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
            Gestão Contábil
          </div>
          <h1 className="text-4xl font-bold mt-4 leading-tight">
            Agenda fiscal, tarefas e risco de multa em um só painel.
          </h1>
          <p className="text-slate-300 mt-4 max-w-md">
            Acompanhe prazos legais, entregas por colaborador e exposição a multas antes que o cliente
            seja penalizado.
          </p>
        </div>
        <div className="text-sm text-slate-400">Demo · senha padrão: senha123</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-semibold">Entrar</h2>
            <p className="text-slate-500 mt-1">Use e-mail/senha ou escolha um usuário demo.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-slate-600">E-mail</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Senha</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                type="password"
                required
              />
            </label>
            {erro && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{erro}</div>}
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 font-medium disabled:opacity-60"
            >
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Acesso rápido (demo)</div>
            <div className="grid gap-2">
              {(demos ?? []).map((u) => (
                <button
                  key={u.id}
                  onClick={() => loginDemo(u)}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition"
                >
                  <div className="font-medium text-sm">{u.nome}</div>
                  <div className="text-xs text-slate-500">
                    {u.papel} · {u.email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
