import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, formatDate } from '../lib/api';
import { localDateKey, toDateOnlyKey } from '../lib/dateOnly';
import { PageHeader, SemaforoBadge, StatusBadge } from '../components/ui';
import type { Cliente, Colaborador, Semaforo, Tarefa } from '../types';

type AgendaResponse = {
  mes: number;
  ano: number;
  dias: Array<{
    data: string;
    total: number;
    pretos: number;
    vermelhos: number;
    amarelos: number;
    verdes: number;
    cinzas: number;
  }>;
  tarefas: Tarefa[];
};

export function AgendaPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(new Date());
  const [area, setArea] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');

  const mes = cursor.getMonth() + 1;
  const ano = cursor.getFullYear();

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api<Cliente[]>('/clientes'),
  });
  const { data: colaboradores } = useQuery({
    queryKey: ['colaboradores'],
    queryFn: () => api<Colaborador[]>('/colaboradores'),
  });

  const qs = new URLSearchParams({ mes: String(mes), ano: String(ano) });
  if (area) qs.set('area', area);
  if (clienteId) qs.set('clienteId', clienteId);
  if (responsavelId) qs.set('responsavelId', responsavelId);

  const { data, isLoading } = useQuery({
    queryKey: ['agenda', mes, ano, area, clienteId, responsavelId],
    queryFn: () => api<AgendaResponse>(`/dashboard/agenda?${qs}`),
  });

  const diasCalendario = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const contagemPorDia = useMemo(() => {
    const map = new Map<string, AgendaResponse['dias'][number]>();
    data?.dias.forEach((d) => map.set(d.data, d));
    return map;
  }, [data]);

  const tarefasDoDia = useMemo(() => {
    if (!diaSelecionado || !data) return [];
    const key = localDateKey(diaSelecionado);
    return data.tarefas.filter((t) => toDateOnlyKey(t.dataVencimento) === key);
  }, [data, diaSelecionado]);

  function corDia(info?: AgendaResponse['dias'][number]) {
    if (!info || info.total === 0) return '';
    if (info.pretos > 0) return 'ring-2 ring-slate-900';
    if (info.vermelhos > 0) return 'ring-2 ring-rose-400';
    if (info.amarelos > 0) return 'ring-2 ring-amber-300';
    return 'ring-1 ring-emerald-300';
  }

  return (
    <div>
      <PageHeader
        title="Agenda Fiscal"
        subtitle="Prazos legais cruzados com tarefas da equipe"
        actions={
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg border bg-white hover:bg-slate-50"
              onClick={() => setCursor((c) => addMonths(c, -1))}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-40 text-center font-medium capitalize">
              {format(cursor, 'MMMM yyyy', { locale: ptBR })}
            </div>
            <button
              className="p-2 rounded-lg border bg-white hover:bg-slate-50"
              onClick={() => setCursor((c) => addMonths(c, 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="">Todas as áreas</option>
          <option value="FISCAL">Fiscal</option>
          <option value="CONTABIL">Contábil</option>
          <option value="DP">DP</option>
          <option value="SOCIETARIO">Societário</option>
        </select>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
        >
          <option value="">Todos os clientes</option>
          {(clientes ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.razaoSocial}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={responsavelId}
          onChange={(e) => setResponsavelId(e.target.value)}
        >
          <option value="">Todos os responsáveis</option>
          {(colaboradores ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-slate-500">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {diasCalendario.map((dia) => {
              const key = localDateKey(dia);
              const info = contagemPorDia.get(key);
              const noMes = isSameMonth(dia, cursor);
              const selecionado = diaSelecionado && isSameDay(dia, diaSelecionado);
              return (
                <button
                  key={key}
                  onClick={() => setDiaSelecionado(dia)}
                  className={`min-h-20 rounded-lg p-1.5 text-left transition ${
                    noMes ? 'bg-slate-50 hover:bg-emerald-50' : 'bg-white text-slate-300'
                  } ${selecionado ? 'bg-emerald-100 ring-2 ring-emerald-500' : ''} ${corDia(info)}`}
                >
                  <div className="text-xs font-medium">{format(dia, 'd')}</div>
                  {info && info.total > 0 && noMes && (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-700">
                        {info.total} tarefa{info.total > 1 ? 's' : ''}
                      </div>
                      <div className="flex gap-0.5">
                        {info.pretos > 0 && <span className="w-2 h-2 rounded-full bg-slate-900" />}
                        {info.vermelhos > 0 && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                        {info.amarelos > 0 && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                        {info.verdes > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                        {info.cinzas > 0 && <span className="w-2 h-2 rounded-full bg-slate-400" />}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {isLoading && <div className="text-sm text-slate-500 mt-3">Carregando...</div>}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold mb-3">
            {diaSelecionado
              ? format(diaSelecionado, "d 'de' MMMM", { locale: ptBR })
              : 'Selecione um dia'}
          </h2>
          <div className="space-y-3 max-h-[32rem] overflow-auto">
            {tarefasDoDia.length === 0 && (
              <div className="text-sm text-slate-500">Nenhuma tarefa neste dia.</div>
            )}
            {tarefasDoDia.map((t) => (
              <div key={t.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm">{t.clienteObrigacao.obrigacao.codigo}</div>
                  <SemaforoBadge value={t.semaforo as Semaforo} />
                </div>
                <div className="text-xs text-slate-600">{t.clienteObrigacao.cliente.razaoSocial}</div>
                <div className="text-xs text-slate-500">{t.clienteObrigacao.obrigacao.nome}</div>
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge value={t.status} />
                  <span className="text-xs text-slate-500">
                    {t.responsavel?.nome ?? 'Sem responsável'} · {formatDate(t.dataVencimento)}
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
