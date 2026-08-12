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

const selectClass =
  'w-full sm:w-auto rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg';

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
    if (info.pretos > 0) return 'ring-2 ring-slate-900 dark:ring-slate-100';
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
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              className="p-2.5 min-h-11 min-w-11 rounded-lg border border-border bg-surface hover:bg-surface-hover"
              onClick={() => setCursor((c) => addMonths(c, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0 flex-1 sm:min-w-40 text-center font-medium capitalize text-fg">
              {format(cursor, 'MMMM yyyy', { locale: ptBR })}
            </div>
            <button
              className="p-2.5 min-h-11 min-w-11 rounded-lg border border-border bg-surface hover:bg-surface-hover"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <select className={selectClass} value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Todas as áreas</option>
          <option value="FISCAL">Fiscal</option>
          <option value="CONTABIL">Contábil</option>
          <option value="DP">DP</option>
          <option value="SOCIETARIO">Societário</option>
        </select>
        <select
          className={selectClass}
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
          className={selectClass}
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

      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-3 bg-surface rounded-xl border border-border shadow-sm p-3 sm:p-4 overflow-x-auto">
          <div className="min-w-[18rem]">
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] sm:text-xs font-medium text-muted">
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
                    className={`min-h-12 sm:min-h-20 rounded-lg p-1 sm:p-1.5 text-left transition ${
                      noMes ? 'bg-muted-bg hover:bg-emerald-50 dark:hover:bg-emerald-950/40' : 'bg-surface text-muted/50'
                    } ${selecionado ? 'bg-emerald-100 dark:bg-emerald-950/60 ring-2 ring-accent' : ''} ${corDia(info)}`}
                  >
                    <div className="text-[10px] sm:text-xs font-medium">{format(dia, 'd')}</div>
                    {info && info.total > 0 && noMes && (
                      <div className="mt-0.5 sm:mt-1 space-y-0.5">
                        <div className="hidden sm:block text-[10px] font-semibold text-fg">
                          {info.total} tarefa{info.total > 1 ? 's' : ''}
                        </div>
                        <div className="flex gap-0.5 flex-wrap">
                          {info.pretos > 0 && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-900 dark:bg-slate-100" />
                          )}
                          {info.vermelhos > 0 && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" />
                          )}
                          {info.amarelos > 0 && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400" />
                          )}
                          {info.verdes > 0 && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                          )}
                          {info.cinzas > 0 && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400" />
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {isLoading && <div className="text-sm text-muted mt-3">Carregando...</div>}
        </div>

        <div className="lg:col-span-2 bg-surface rounded-xl border border-border shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-fg">
            {diaSelecionado
              ? format(diaSelecionado, "d 'de' MMMM", { locale: ptBR })
              : 'Selecione um dia'}
          </h2>
          <div className="space-y-3 max-h-[32rem] overflow-auto">
            {tarefasDoDia.length === 0 && (
              <div className="text-sm text-muted">Nenhuma tarefa neste dia.</div>
            )}
            {tarefasDoDia.map((t) => (
              <div key={t.id} className="border border-border rounded-lg p-3 space-y-2 bg-app-bg/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm text-fg">{t.clienteObrigacao.obrigacao.codigo}</div>
                  <SemaforoBadge value={t.semaforo as Semaforo} />
                </div>
                <div className="text-xs text-muted">{t.clienteObrigacao.cliente.razaoSocial}</div>
                <div className="text-xs text-muted">{t.clienteObrigacao.obrigacao.nome}</div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge value={t.status} />
                  <span className="text-xs text-muted">
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
