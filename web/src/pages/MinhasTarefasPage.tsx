import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatDate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader, SemaforoDot } from '../components/ui';
import type { StatusTarefa, Tarefa } from '../types';

const COLUNAS: Array<{ status: StatusTarefa; titulo: string }> = [
  { status: 'PENDENTE', titulo: 'Pendente' },
  { status: 'EM_ANDAMENTO', titulo: 'Em andamento' },
  { status: 'AGUARDANDO_CLIENTE', titulo: 'Aguard. cliente' },
  { status: 'CONCLUIDA', titulo: 'Concluída' },
];

export function MinhasTarefasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ['tarefas', user?.id],
    queryFn: () => {
      const qs =
        user?.papel === 'COLABORADOR'
          ? `?responsavelId=${user.id}`
          : '';
      return api<Tarefa[]>(`/tarefas${qs}`);
    },
  });

  const mutStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusTarefa }) =>
      api(`/tarefas/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      qc.invalidateQueries({ queryKey: ['resumo'] });
      qc.invalidateQueries({ queryKey: ['agenda'] });
      qc.invalidateQueries({ queryKey: ['atrasos'] });
    },
  });

  function porStatus(status: StatusTarefa) {
    return tarefas.filter((t) => t.status === status);
  }

  return (
    <div>
      <PageHeader
        title="Minhas Tarefas"
        subtitle={
          user?.papel === 'GESTOR'
            ? 'Visão kanban de todas as entregas da equipe'
            : 'Suas entregas por status'
        }
      />

      {isLoading && <div className="text-slate-500">Carregando...</div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUNAS.map((col) => (
          <div key={col.status} className="bg-slate-100/80 rounded-xl p-3 min-h-[28rem]">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-sm">{col.titulo}</h3>
              <span className="text-xs bg-white rounded-full px-2 py-0.5 border">
                {porStatus(col.status).length}
              </span>
            </div>
            <div className="space-y-2">
              {porStatus(col.status).map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm leading-tight">
                      {t.clienteObrigacao.obrigacao.codigo}
                    </div>
                    <SemaforoDot value={t.semaforo} />
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2">
                    {t.clienteObrigacao.cliente.razaoSocial}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Comp. {t.competencia} · vence {formatDate(t.dataVencimento)}
                  </div>
                  {user?.papel === 'GESTOR' && (
                    <div className="text-[11px] text-slate-500">
                      {t.responsavel?.nome ?? 'Sem responsável'}
                    </div>
                  )}
                  <div className="pt-1">
                    <select
                      className="w-full text-xs rounded border border-slate-200 px-2 py-1.5 bg-slate-50"
                      value={t.status}
                      onChange={(e) =>
                        mutStatus.mutate({
                          id: t.id,
                          status: e.target.value as StatusTarefa,
                        })
                      }
                    >
                      {COLUNAS.map((c) => (
                        <option key={c.status} value={c.status}>
                          {c.titulo}
                        </option>
                      ))}
                      <option value="DISPENSADA">Dispensada</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
