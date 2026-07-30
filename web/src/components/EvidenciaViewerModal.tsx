import { useEffect, useId, useState } from 'react';
import { Download, Eye, FileText, X } from 'lucide-react';
import { fetchEvidenciaArquivo, openOrDownloadBlob } from '../lib/api';
import type { Tarefa } from '../types';

type Props = {
  tarefa: Tarefa;
  open: boolean;
  onClose: () => void;
};

export function EvidenciaViewerModal({ tarefa, open, onClose }: Props) {
  const titleId = useId();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTipo, setPreviewTipo] = useState<'image' | 'pdf' | 'none'>('none');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      setPreviewTipo('none');
      setErro(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const holder: { url: string | null } = { url: null };

    async function loadPreview() {
      setLoading(true);
      setErro(null);
      setPreviewUrl(null);
      setPreviewTipo('none');
      try {
        const { blob, mimeType } = await fetchEvidenciaArquivo(tarefa.id);
        if (cancelled) return;

        if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
          const url = URL.createObjectURL(blob);
          holder.url = url;
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          setPreviewTipo(mimeType.startsWith('image/') ? 'image' : 'pdf');
          setPreviewUrl(url);
        } else {
          setPreviewTipo('none');
        }
      } catch (err) {
        if (!cancelled) {
          setErro(err instanceof Error ? err.message : 'Não foi possível carregar a evidência');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
      if (holder.url) URL.revokeObjectURL(holder.url);
    };
  }, [open, tarefa.id]);

  if (!open) return null;

  async function handleAbrirOuBaixar(forceDownload = false) {
    setErro(null);
    try {
      const { blob, filename, mimeType } = await fetchEvidenciaArquivo(tarefa.id);
      if (forceDownload) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || tarefa.evidenciaNomeArquivo || 'evidencia';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
      openOrDownloadBlob(blob, filename || tarefa.evidenciaNomeArquivo || 'evidencia', mimeType);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao abrir evidência');
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-2xl bg-surface text-fg border border-border rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold">
              Evidência da conclusão
            </h2>
            <p className="text-sm text-muted mt-1">
              {tarefa.clienteObrigacao.obrigacao.codigo} ·{' '}
              {tarefa.clienteObrigacao.cliente.razaoSocial}
            </p>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-surface-hover text-muted min-h-11 min-w-11 shrink-0"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-app-bg p-3">
            <div className="text-xs uppercase tracking-wide text-muted mb-1">Descrição</div>
            <p className="text-sm text-fg whitespace-pre-wrap">
              {tarefa.evidenciaDescricao?.trim() || 'Sem descrição informada.'}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-app-bg p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-fg min-w-0">
              <FileText size={16} className="shrink-0 text-muted" />
              <span className="truncate">
                {tarefa.evidenciaNomeArquivo ?? 'Arquivo de evidência'}
              </span>
            </div>

            {loading && <div className="text-sm text-muted">Carregando pré-visualização...</div>}

            {!loading && previewTipo === 'image' && previewUrl && (
              <img
                src={previewUrl}
                alt={tarefa.evidenciaNomeArquivo ?? 'Evidência'}
                className="max-h-80 w-full object-contain rounded-lg border border-border bg-surface"
              />
            )}

            {!loading && previewTipo === 'pdf' && previewUrl && (
              <iframe
                title="Pré-visualização do PDF"
                src={previewUrl}
                className="w-full h-72 sm:h-96 rounded-lg border border-border bg-surface"
              />
            )}

            {!loading && previewTipo === 'none' && !erro && (
              <p className="text-sm text-muted">
                Este tipo de arquivo não tem pré-visualização. Use os botões abaixo para abrir ou
                baixar.
              </p>
            )}

            {erro && (
              <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-3 py-2">
                {erro}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => void handleAbrirOuBaixar(false)}
                className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:opacity-90"
              >
                <Eye size={16} />
                Abrir arquivo
              </button>
              <button
                type="button"
                onClick={() => void handleAbrirOuBaixar(true)}
                className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-sm font-medium"
              >
                <Download size={16} />
                Baixar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
