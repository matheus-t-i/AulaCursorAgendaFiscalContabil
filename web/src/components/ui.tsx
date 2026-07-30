import type { Semaforo, StatusTarefa } from '../types';

const SEM_CORES: Record<Semaforo, string> = {
  PRETO: 'bg-slate-900 text-white',
  VERMELHO: 'bg-rose-500 text-white',
  AMARELO: 'bg-amber-400 text-slate-900',
  VERDE: 'bg-emerald-500 text-white',
  CINZA: 'bg-slate-300 text-slate-700',
};

const SEM_DOT: Record<Semaforo, string> = {
  PRETO: 'bg-slate-900',
  VERMELHO: 'bg-rose-500',
  AMARELO: 'bg-amber-400',
  VERDE: 'bg-emerald-500',
  CINZA: 'bg-slate-300',
};

export function SemaforoBadge({ value }: { value?: Semaforo }) {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${SEM_CORES[value]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${value === 'CINZA' ? 'bg-slate-500' : 'bg-white/80'}`} />
      {value}
    </span>
  );
}

export function SemaforoDot({ value }: { value?: Semaforo }) {
  if (!value) return <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />;
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${SEM_DOT[value]}`} title={value} />;
}

const STATUS_LABEL: Record<StatusTarefa, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_CLIENTE: 'Aguard. cliente',
  CONCLUIDA: 'Concluída',
  DISPENSADA: 'Dispensada',
};

const STATUS_COR: Record<StatusTarefa, string> = {
  PENDENTE: 'bg-slate-100 text-slate-700',
  EM_ANDAMENTO: 'bg-sky-100 text-sky-800',
  AGUARDANDO_CLIENTE: 'bg-violet-100 text-violet-800',
  CONCLUIDA: 'bg-emerald-100 text-emerald-800',
  DISPENSADA: 'bg-slate-200 text-slate-500',
};

export function StatusBadge({ value }: { value: StatusTarefa }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COR[value]}`}>
      {STATUS_LABEL[value]}
    </span>
  );
}

export function Card({
  title,
  value,
  subtitle,
  accent = 'slate',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: 'slate' | 'rose' | 'amber' | 'emerald' | 'sky';
}) {
  const accents = {
    slate: 'border-slate-200',
    rose: 'border-rose-300',
    amber: 'border-amber-300',
    emerald: 'border-emerald-300',
    sky: 'border-sky-300',
  };
  return (
    <div className={`bg-white rounded-xl border ${accents[accent]} shadow-sm p-4`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
