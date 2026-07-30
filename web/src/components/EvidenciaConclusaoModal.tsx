import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { FileUp, X } from 'lucide-react';
import type { Tarefa } from '../types';

type Props = {
  tarefa: Tarefa;
  open: boolean;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (payload: { descricao: string; arquivo: File }) => void;
};

export function EvidenciaConclusaoModal({
  tarefa,
  open,
  submitting,
  error,
  onClose,
  onConfirm,
}: Props) {
  const titleId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDescricao('');
    setArquivo(null);
    setLocalError(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [open, tarefa.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const desc = descricao.trim();
    if (!desc) {
      setLocalError('Informe a descrição da evidência.');
      return;
    }
    if (!arquivo) {
      setLocalError('Anexe um arquivo como evidência.');
      return;
    }
    onConfirm({ descricao: desc, arquivo });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar"
        disabled={submitting}
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-lg bg-surface text-fg border border-border rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              Evidência de conclusão
            </h2>
            <p className="text-sm text-muted mt-1">
              Para concluir{' '}
              <span className="font-medium text-fg">
                {tarefa.clienteObrigacao.obrigacao.codigo}
              </span>{' '}
              · {tarefa.clienteObrigacao.cliente.razaoSocial}, anexe um arquivo e descreva a
              entrega.
            </p>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-surface-hover text-muted min-h-11 min-w-11"
            disabled={submitting}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-fg">Descrição da evidência</span>
            <textarea
              className="mt-1 w-full min-h-28 rounded-lg border border-border bg-app-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent resize-y"
              placeholder="Ex.: Declaração enviada no portal, protocolo 12345, comprovante anexado..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              disabled={submitting}
            />
          </label>

          <div>
            <span className="text-sm font-medium text-fg">Arquivo</span>
            <label className="mt-1 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-app-bg px-4 py-6 cursor-pointer hover:bg-surface-hover transition">
              <FileUp className="text-muted" size={22} />
              <span className="text-sm text-muted text-center">
                {arquivo ? (
                  <span className="text-fg font-medium">{arquivo.name}</span>
                ) : (
                  'Clique para selecionar o arquivo'
                )}
              </span>
              {arquivo && (
                <span className="text-xs text-muted">
                  {(arquivo.size / 1024).toFixed(1)} KB
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                className="sr-only"
                disabled={submitting}
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {(localError || error) && (
            <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-3 py-2">
              {localError || error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-11 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Concluindo...' : 'Concluir tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
