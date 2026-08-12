import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { Card, PageHeader } from '../components/ui';
import { useTheme } from '../lib/theme';
import {
  competenciaAtualLocal,
  emitirRelatorioRendimentoPdf,
  formatCompetenciaExtenso,
} from '../lib/rendimentoPdf';

type RendimentoResponse = {
  competencia: string;
  ranking: Array<{
    colaborador: { id: string; nome: string; area: string; cargo: string };
    pontualidade: number;
    volumeEntregue: number;
    volumeCompetencia: number;
    atrasoMedioDias: number;
    cargaAtual: number;
    capacidadeMensal: number;
    percentualCarga: number;
    tempoMedioCicloHoras: number | null;
  }>;
  serieMensal: Array<{
    competencia: string;
    pontualidadeMedia: number;
    volume: number;
  }>;
};

export function RendimentoPage() {
  const [competencia, setCompetencia] = useState(competenciaAtualLocal);
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';

  const chartGrid = isDark ? '#1f2937' : '#e2e8f0';
  const chartTick = isDark ? '#94a3b8' : '#64748b';
  const chartTooltipStyle = {
    backgroundColor: isDark ? '#111827' : '#ffffff',
    border: `1px solid ${chartGrid}`,
    borderRadius: 8,
    color: isDark ? '#e5e7eb' : '#0f172a',
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['rendimento', competencia],
    queryFn: () =>
      api<RendimentoResponse>(
        `/dashboard/rendimento?competencia=${encodeURIComponent(competencia)}`,
      ),
  });

  const ranking = data?.ranking ?? [];
  const total = ranking.length;

  const mediaPont =
    total > 0
      ? Math.round((ranking.reduce((s, r) => s + r.pontualidade, 0) / total) * 10) / 10
      : 0;

  const volumeMes = ranking.reduce((s, r) => s + r.volumeCompetencia, 0);
  const sobrecarregados = ranking.filter((r) => r.percentualCarga > 90).length;

  function handleEmitirPdf() {
    if (!data || ranking.length === 0) return;
    emitirRelatorioRendimentoPdf({
      competencia: data.competencia,
      ranking: data.ranking,
      pontualidadeMedia: mediaPont,
      volumeTotal: volumeMes,
      sobrecarregados,
    });
  }

  return (
    <div>
      <PageHeader
        title="Rendimento da Equipe"
        subtitle={`Competência: ${formatCompetenciaExtenso(competencia)}`}
        actions={
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="font-medium">Mês</span>
              <input
                type="month"
                value={competencia}
                onChange={(e) => {
                  if (e.target.value) setCompetencia(e.target.value);
                }}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 min-h-11"
              />
            </label>
            <button
              type="button"
              onClick={handleEmitirPdf}
              disabled={!data || ranking.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 min-h-11"
            >
              <FileDown className="h-4 w-4" />
              Emitir PDF
            </button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card title="Pontualidade média" value={`${mediaPont}%`} accent="emerald" />
        <Card title="Volume no mês" value={data ? volumeMes : '—'} accent="sky" />
        <Card
          title="Sobrecarregados"
          value={sobrecarregados}
          subtitle="Carga atual acima de 90% da capacidade"
          accent="amber"
        />
      </div>

      {(isLoading || isFetching) && (
        <div className="text-muted mb-4">Carregando...</div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
          <h3 className="font-semibold mb-4 text-fg">Pontualidade nos últimos meses</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.serieMensal ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="competencia" tick={{ fontSize: 12, fill: chartTick }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: chartTick }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ color: chartTick }} />
                <Line
                  type="monotone"
                  dataKey="pontualidadeMedia"
                  name="Pontualidade %"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
          <h3 className="font-semibold mb-4 text-fg">Volume entregue</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.serieMensal ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="competencia" tick={{ fontSize: 12, fill: chartTick }} />
                <YAxis tick={{ fontSize: 12, fill: chartTick }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="volume" name="Concluídas" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold flex flex-wrap items-center justify-between gap-2 text-fg">
          <span>Ranking da equipe</span>
          <span className="text-xs font-normal text-muted">
            Melhor → pior (pontualidade, depois volume no mês)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[40rem]">
            <thead className="bg-muted-bg text-muted text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 w-16">Pos.</th>
                <th className="text-left px-4 py-3">Colaborador</th>
                <th className="text-right px-4 py-3">Pontualidade</th>
                <th className="text-right px-4 py-3">Volume</th>
                <th className="text-right px-4 py-3">Atraso médio</th>
                <th className="text-right px-4 py-3">Carga atual</th>
                <th className="text-right px-4 py-3">Ciclo (h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranking.map((r, index) => {
                const pos = index + 1;
                const isTop3 = index < 3;
                const isBottom = total >= 4 && index >= Math.max(total - 2, 3);
                const rowBg = isTop3
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                  : isBottom
                    ? 'bg-rose-50/60 dark:bg-rose-950/30'
                    : 'hover:bg-surface-hover';

                return (
                  <tr key={r.colaborador.id} className={rowBg}>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isTop3
                            ? 'font-bold text-emerald-700 dark:text-emerald-300'
                            : isBottom
                              ? 'font-semibold text-rose-700 dark:text-rose-300'
                              : 'font-semibold text-muted'
                        }
                      >
                        {pos}º
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-fg">{r.colaborador.nome}</div>
                      <div className="text-xs text-muted">
                        {r.colaborador.area} · {r.colaborador.cargo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-300">
                      {r.pontualidade}%
                    </td>
                    <td className="px-4 py-3 text-right text-fg">{r.volumeCompetencia}</td>
                    <td className="px-4 py-3 text-right text-fg">{r.atrasoMedioDias}d</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          r.percentualCarga > 90
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : r.percentualCarga > 70
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-fg'
                        }
                      >
                        {r.percentualCarga}%
                      </span>
                      <div className="text-[10px] text-muted">
                        {r.cargaAtual}/{r.capacidadeMensal}h
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-fg">
                      {r.tempoMedioCicloHoras ?? '—'}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && ranking.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Nenhum colaborador no ranking para esta competência.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
