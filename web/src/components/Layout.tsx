import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarDays,
  CheckSquare,
  AlertTriangle,
  BarChart3,
  Users,
  Building2,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api, money } from '../lib/api';
import type { Resumo } from '../types';

const links = [
  { to: '/', label: 'Agenda Fiscal', icon: CalendarDays },
  { to: '/tarefas', label: 'Minhas Tarefas', icon: CheckSquare },
  { to: '/atrasos', label: 'Atrasos e Risco', icon: AlertTriangle },
  { to: '/rendimento', label: 'Rendimento', icon: BarChart3 },
  { to: '/clientes', label: 'Clientes', icon: Building2 },
  { to: '/colaboradores', label: 'Colaboradores', icon: Users },
  { to: '/obrigacoes', label: 'Catálogo', icon: BookOpen },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { data: resumo } = useQuery({
    queryKey: ['resumo'],
    queryFn: () => api<Resumo>('/dashboard/resumo'),
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div className="text-xs uppercase tracking-widest text-slate-400">Escritório</div>
          <div className="font-semibold text-lg leading-tight mt-1">Agenda Fiscal</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-3">
          {resumo && (
            <div className="text-xs space-y-1 bg-slate-800/60 rounded-lg p-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Atrasadas</span>
                <span className="text-rose-400 font-semibold">{resumo.atrasadas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risco multa</span>
                <span className="text-amber-300 font-semibold">{money(resumo.exposicaoMulta)}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.nome}</div>
              <div className="text-xs text-slate-400 truncate">{user?.papel}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
