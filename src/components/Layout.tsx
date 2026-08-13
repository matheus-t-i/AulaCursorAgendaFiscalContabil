import { useEffect, useState } from 'react';
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
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  Settings,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme, type ThemePreference } from '../lib/theme';
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
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

function ThemeSelector() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] uppercase tracking-wide text-sidebar-muted px-1">Tema</div>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-sidebar-hover/80 p-1">
        {themeOptions.map(({ value, label, icon: Icon }) => {
          const active = preference === value;
          return (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={active}
              onClick={() => setPreference(value)}
              className={`flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] transition ${
                active
                  ? 'bg-accent text-accent-fg'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { data: resumo } = useQuery({
    queryKey: ['resumo'],
    queryFn: () => api<Resumo>('/dashboard/resumo'),
  });

  return (
    <>
      <div className="p-5 border-b border-sidebar-border">
        <div className="text-xs uppercase tracking-widest text-sidebar-muted">Escritório</div>
        <div className="font-semibold text-lg leading-tight mt-1 text-sidebar-fg">Agenda Fiscal</div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition min-h-11 ${
                isActive
                  ? 'bg-accent text-accent-fg'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <ThemeSelector />
        {resumo && (
          <div className="text-xs space-y-1 bg-sidebar-hover/60 rounded-lg p-3">
            <div className="flex justify-between">
              <span className="text-sidebar-muted">Atrasadas</span>
              <span className="text-rose-400 font-semibold">{resumo.atrasadas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sidebar-muted">Risco multa</span>
              <span className="text-amber-300 font-semibold">{money(resumo.exposicaoMulta)}</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate text-sidebar-fg">{user?.nome}</div>
            <div className="text-xs text-sidebar-muted truncate">{user?.papel}</div>
          </div>
          <button
            onClick={logout}
            className="p-2.5 min-h-11 min-w-11 rounded-lg hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-fg"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex bg-app-bg text-fg">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar text-sidebar-fg flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-sidebar text-sidebar-fg flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border lg:hidden">
              <span className="font-semibold text-sidebar-fg">Menu</span>
              <button
                type="button"
                className="p-2.5 min-h-11 min-w-11 rounded-lg hover:bg-sidebar-hover text-sidebar-muted"
                aria-label="Fechar"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col flex-1 min-h-0">
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-surface/95 backdrop-blur px-4 py-3">
          <button
            type="button"
            className="p-2.5 min-h-11 min-w-11 rounded-lg border border-border bg-surface hover:bg-surface-hover"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-muted">Escritório</div>
            <div className="font-semibold truncate">Agenda Fiscal</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
