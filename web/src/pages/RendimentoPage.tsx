import { useQuery } from '@tanstack/react-query';
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
  const { data, isLoading } = useQuery({
    queryKey: ['rendimento'],
    queryFn: () => api<RendimentoResponse>('/dashboard/rendimento'),
  });

  const mediaPont =
    data && data.ranking.length > 0
      ? Math.round(
          (data.ranking.reduce((s, r) => s + r.pontualidade, 0) / data.ranking.length) * 10,
        ) / 10
      : 0;

  const sobrecarregados = data?.ranking.filter((r) => r.percentualCarga > 90).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Rendimento da Equipe"
        subtitle={`Competência de referência: ${data?.competencia ?? '—'}`}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card title="Pontualidade média" value={`${mediaPont}%`} accent="emerald" />
        <Card
          title="Volume no mês"
          value={data?.serieMensal.at(-1)?.volume ?? '—'}
          accent="sky"
        />
        <Card
          title="Sobrecarregados"
          value={sobrecarregados}
          subtitle="Carga acima de 90% da capacidade"
          accent="amber"
        />
      </div>

      {isLoading && <div className="text-slate-500 mb-4">Carregando...</div>}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="font-semibold mb-4">Pontualidade nos últimos meses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.serieMensal ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="competencia" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pontualidadeMedia"
                  name="Pontualidade %"
                  stroke="#059669"
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="font-semibold mb-4">Volume entregue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.serieMensal ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="competencia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="volume" name="Concluídas" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold">Ranking da equipe</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Colaborador</th>
                <th className="text-right px-4 py-3">Pontualidade</th>
                <th className="text-right px-4 py-3">Volume</th>
                <th className="text-right px-4 py-3">Atraso médio</th>
                <th className="text-right px-4 py-3">Carga</th>
                <th className="text-right px-4 py-3">Ciclo (h)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.ranking ?? []).map((r) => (
                <tr key={r.colaborador.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.colaborador.nome}</div>
                    <div className="text-xs text-slate-500">
                      {r.colaborador.area} · {r.colaborador.cargo}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                    {r.pontualidade}%
                  </td>
                  <td className="px-4 py-3 text-right">{r.volumeEntregue}</td>
                  <td className="px-4 py-3 text-right">{r.atrasoMedioDias}d</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        r.percentualCarga > 90
                          ? 'text-rose-600 font-semibold'
                          : r.percentualCarga > 70
                            ? 'text-amber-600'
                            : 'text-slate-700'
                      }
                    >
                      {r.percentualCarga}%
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {r.cargaAtual}/{r.capacidadeMensal}h
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.tempoMedioCicloHoras ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
