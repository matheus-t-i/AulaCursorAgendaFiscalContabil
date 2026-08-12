import { useQuery } from '@tanstack/react-query';
import { api, formatDate, money } from '../lib/api';
import { Card, PageHeader, StatusBadge } from '../components/ui';
import type { Tarefa } from '../types';

type AtrasosResponse = {
  totalAtrasadas: number;
  exposicaoTotal: number;
  ranking: Array<{
    clienteId: string;
    razaoSocial: string;
    qtd: number;
    exposicao: number;
    tarefas: Tarefa[];
  }>;
  tarefas: Tarefa[];
};

export function AtrasosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['atrasos'],
    queryFn: () => api<AtrasosResponse>('/dashboard/atrasos'),
  });

  return (
    <div>
      <PageHeader
        title="Atrasos e Risco"
        subtitle="Exposição estimada a multas por tarefas vencidas e não entregues"
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card
          title="Tarefas atrasadas"
          value={data?.totalAtrasadas ?? '—'}
          accent="rose"
        />
        <Card
          title="Exposição total"
          value={data ? money(data.exposicaoTotal) : '—'}
          subtitle="Estimativa ponderada por criticidade"
          accent="amber"
        />
        <Card
          title="Clientes em risco"
          value={data?.ranking.length ?? '—'}
          accent="slate"
        />
      </div>

      {isLoading && <div className="text-muted">Carregando...</div>}

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-fg">Ranking de clientes</div>
          <div className="divide-y divide-border">
            {(data?.ranking ?? []).map((r, i) => (
              <div key={r.clienteId} className="px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-sm font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-fg">{r.razaoSocial}</div>
                  <div className="text-xs text-muted">
                    {r.qtd} obrigação{r.qtd > 1 ? 'ões' : ''} atrasada{r.qtd > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="font-semibold text-amber-700 dark:text-amber-300 text-sm shrink-0">
                  {money(r.exposicao)}
                </div>
              </div>
            ))}
            {data && data.ranking.length === 0 && (
              <div className="p-6 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                Nenhum atraso no momento. Bom trabalho!
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-fg">Detalhe das tarefas</div>
          <div className="divide-y divide-border max-h-[32rem] overflow-auto">
            {(data?.tarefas ?? []).map((t) => (
              <div key={t.id} className="px-4 py-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm text-fg">
                    {t.clienteObrigacao.obrigacao.codigo} ·{' '}
                    {t.clienteObrigacao.cliente.razaoSocial}
                  </div>
                  <div className="text-sm font-semibold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                    {money(t.multaEstimada ?? 0)}
                  </div>
                </div>
                <div className="text-xs text-muted">
                  Venceu em {formatDate(t.dataVencimento)} · Comp. {t.competencia}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={t.status} />
                  <span className="text-xs text-muted">
                    {t.responsavel?.nome ?? 'Sem responsável'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
