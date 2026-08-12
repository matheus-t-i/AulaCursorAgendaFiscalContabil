import { useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, GripVertical, Paperclip } from 'lucide-react';
import { api, formatDate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader, SemaforoDot } from '../components/ui';
import { EvidenciaConclusaoModal } from '../components/EvidenciaConclusaoModal';
import { EvidenciaViewerModal } from '../components/EvidenciaViewerModal';
import type { StatusTarefa, Tarefa } from '../types';

const COLUNAS: Array<{ status: StatusTarefa; titulo: string }> = [
  { status: 'PENDENTE', titulo: 'Pendente' },
  { status: 'EM_ANDAMENTO', titulo: 'Em andamento' },
  { status: 'AGUARDANDO_CLIENTE', titulo: 'Aguard. cliente' },
  { status: 'CONCLUIDA', titulo: 'Concluída' },
];

type ConclusaoPendente = {
  tarefa: Tarefa;
};

function temEvidencia(t: Tarefa) {
  return Boolean(t.evidenciaNomeArquivo || t.evidenciaDescricao);
}

export function MinhasTarefasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<StatusTarefa | null>(null);
  const [conclusao, setConclusao] = useState<ConclusaoPendente | null>(null);
  const [conclusaoErro, setConclusaoErro] = useState<string | null>(null);
  const [evidenciaView, setEvidenciaView] = useState<Tarefa | null>(null);

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
    mutationFn: async ({
      id,
      status,
      evidencia,
    }: {
      id: string;
      status: StatusTarefa;
      evidencia?: { descricao: string; arquivo: File };
    }) => {
      if (status === 'CONCLUIDA' && evidencia) {
        const form = new FormData();
        form.append('status', status);
        form.append('evidenciaDescricao', evidencia.descricao);
        form.append('arquivo', evidencia.arquivo);
        return api(`/tarefas/${id}/status`, { method: 'PATCH', body: form });
      }

      return api(`/tarefas/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      qc.invalidateQueries({ queryKey: ['resumo'] });
      qc.invalidateQueries({ queryKey: ['agenda'] });
      qc.invalidateQueries({ queryKey: ['atrasos'] });
      setConclusao(null);
      setConclusaoErro(null);
    },
    onError: (err) => {
      setConclusaoErro(err instanceof Error ? err.message : 'Falha ao concluir tarefa');
    },
  });

  function porStatus(status: StatusTarefa) {
    return tarefas.filter((t) => t.status === status);
  }

  function solicitarMudancaStatus(tarefa: Tarefa, status: StatusTarefa) {
    if (tarefa.status === status) return;
    if (status === 'CONCLUIDA') {
      setConclusaoErro(null);
      setConclusao({ tarefa });
      return;
    }
    mutStatus.mutate({ id: tarefa.id, status });
  }

  function onDragStart(e: DragEvent, tarefa: Tarefa) {
    e.dataTransfer.setData('text/plain', tarefa.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(tarefa.id);
  }

  function onDragEnd() {
    setDraggingId(null);
    setDropTarget(null);
  }

  function onDragOver(e: DragEvent, status: StatusTarefa) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== status) setDropTarget(status);
  }

  function onDragLeave(e: DragEvent, status: StatusTarefa) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dropTarget === status) setDropTarget(null);
  }

  function onDrop(e: DragEvent, status: StatusTarefa) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setDraggingId(null);
    setDropTarget(null);
    if (!id) return;
    const tarefa = tarefas.find((t) => t.id === id);
    if (!tarefa) return;
    solicitarMudancaStatus(tarefa, status);
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

      {isLoading && <div className="text-muted">Carregando...</div>}

      <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 xl:grid-cols-4 md:overflow-visible md:pb-0">
        {COLUNAS.map((col) => (
          <div
            key={col.status}
            onDragOver={(e) => onDragOver(e, col.status)}
            onDragLeave={(e) => onDragLeave(e, col.status)}
            onDrop={(e) => onDrop(e, col.status)}
            className={`bg-muted-bg rounded-xl p-3 min-h-[22rem] sm:min-h-[28rem] min-w-[260px] sm:min-w-[280px] md:min-w-0 shrink-0 md:shrink transition ${
              dropTarget === col.status ? 'ring-2 ring-accent bg-emerald-50/60 dark:bg-emerald-950/40' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-sm text-fg">{col.titulo}</h3>
              <span className="text-xs bg-surface rounded-full px-2 py-0.5 border border-border text-fg">
                {porStatus(col.status).length}
              </span>
            </div>
            <div className="space-y-2">
              {porStatus(col.status).map((t) => (
                <div
                  key={t.id}
                  className={`bg-surface rounded-lg border border-border p-3 shadow-sm space-y-2 ${
                    draggingId === t.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      draggable
                      title="Arrastar tarefa"
                      aria-label="Arrastar tarefa"
                      role="button"
                      tabIndex={0}
                      onDragStart={(e) => onDragStart(e, t)}
                      onDragEnd={onDragEnd}
                      className="mt-0.5 shrink-0 p-1 rounded text-muted hover:text-fg hover:bg-surface-hover cursor-grab active:cursor-grabbing touch-none select-none"
                    >
                      <GripVertical size={16} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm leading-tight text-fg">
                          {t.clienteObrigacao.obrigacao.codigo}
                        </div>
                        <SemaforoDot value={t.semaforo} />
                      </div>
                      <div className="text-xs text-muted line-clamp-2">
                        {t.clienteObrigacao.cliente.razaoSocial}
                      </div>
                      <div className="text-[11px] text-muted">
                        Comp. {t.competencia} · vence {formatDate(t.dataVencimento)}
                      </div>
                      {user?.papel === 'GESTOR' && (
                        <div className="text-[11px] text-muted">
                          {t.responsavel?.nome ?? 'Sem responsável'}
                        </div>
                      )}

                      {t.status === 'CONCLUIDA' && (
                        temEvidencia(t) ? (
                          <button
                            type="button"
                            onClick={() => setEvidenciaView(t)}
                            className="w-full text-left flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 rounded-md px-2 py-1.5 transition cursor-pointer"
                          >
                            <Paperclip size={12} className="mt-0.5 shrink-0" />
                            <span className="min-w-0 flex-1">
                              <span className="font-medium line-clamp-1">
                                {t.evidenciaNomeArquivo ?? 'Evidência'}
                              </span>
                              {t.evidenciaDescricao && (
                                <span className="block text-muted line-clamp-2 mt-0.5">
                                  {t.evidenciaDescricao}
                                </span>
                              )}
                              <span className="mt-1 inline-flex items-center gap-1 font-medium text-emerald-800 dark:text-emerald-200">
                                <Eye size={12} />
                                Ver evidência
                              </span>
                            </span>
                          </button>
                        ) : (
                          <div className="text-[11px] text-muted bg-muted-bg rounded-md px-2 py-1.5">
                            Sem evidência anexada (tarefa concluída antes da exigência).
                          </div>
                        )
                      )}

                      <select
                        className="w-full text-xs rounded border border-border px-2 py-1.5 bg-muted-bg text-fg min-h-9 cursor-pointer"
                        value={t.status}
                        onChange={(e) =>
                          solicitarMudancaStatus(t, e.target.value as StatusTarefa)
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {conclusao && (
        <EvidenciaConclusaoModal
          open
          tarefa={conclusao.tarefa}
          submitting={mutStatus.isPending}
          error={conclusaoErro}
          onClose={() => {
            if (mutStatus.isPending) return;
            setConclusao(null);
            setConclusaoErro(null);
          }}
          onConfirm={({ descricao, arquivo }) => {
            setConclusaoErro(null);
            mutStatus.mutate({
              id: conclusao.tarefa.id,
              status: 'CONCLUIDA',
              evidencia: { descricao, arquivo },
            });
          }}
        />
      )}

      {evidenciaView && (
        <EvidenciaViewerModal
          open
          tarefa={evidenciaView}
          onClose={() => setEvidenciaView(null)}
        />
      )}
    </div>
  );
}
