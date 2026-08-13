import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader } from '../components/ui';
import type { ReativacaoPedido } from '../types';

const inputClass =
  'mt-1 w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-accent';

export function ConfiguracoesPage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const isGestor = user?.papel === 'GESTOR';

  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: '',
    senhaNova: '',
    confirmarSenha: '',
  });
  const [senhaMsg, setSenhaMsg] = useState('');
  const [senhaErro, setSenhaErro] = useState('');

  const [confirmTexto, setConfirmTexto] = useState('');
  const [apagarErro, setApagarErro] = useState('');
  const [mostrarApagar, setMostrarApagar] = useState(false);

  const { data: reativacoes = [], isLoading: carregandoPedidos } = useQuery({
    queryKey: ['reativacoes'],
    queryFn: () => api<ReativacaoPedido[]>('/auth/reativacoes'),
    enabled: isGestor,
  });

  const alterarSenha = useMutation({
    mutationFn: () =>
      api('/auth/senha', {
        method: 'PATCH',
        body: JSON.stringify(senhaForm),
      }),
    onSuccess: () => {
      setSenhaMsg('Senha atualizada com sucesso.');
      setSenhaErro('');
      setSenhaForm({ senhaAtual: '', senhaNova: '', confirmarSenha: '' });
    },
    onError: (err: Error) => {
      setSenhaMsg('');
      setSenhaErro(err.message);
    },
  });

  const desativarConta = useMutation({
    mutationFn: () =>
      api('/auth/desativar-conta', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      logout();
    },
    onError: (err: Error) => {
      setApagarErro(err.message);
    },
  });

  const aprovar = useMutation({
    mutationFn: (id: string) =>
      api(`/auth/reativacoes/${id}/aprovar`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reativacoes'] }),
  });

  const recusar = useMutation({
    mutationFn: (id: string) =>
      api(`/auth/reativacoes/${id}/recusar`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reativacoes'] }),
  });

  function handleSenha(e: FormEvent) {
    e.preventDefault();
    setSenhaMsg('');
    setSenhaErro('');
    if (senhaForm.senhaNova !== senhaForm.confirmarSenha) {
      setSenhaErro('A confirmação não confere com a nova senha.');
      return;
    }
    if (senhaForm.senhaNova.length < 6) {
      setSenhaErro('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    alterarSenha.mutate();
  }

  function handleApagar(e: FormEvent) {
    e.preventDefault();
    setApagarErro('');
    if (confirmTexto.trim().toUpperCase() !== 'APAGAR') {
      setApagarErro('Digite APAGAR para confirmar.');
      return;
    }
    desativarConta.mutate();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações"
        subtitle="Senha da conta, desativação e pedidos de reativação"
      />

      <section className="bg-surface border border-border rounded-xl p-4 sm:p-5 max-w-xl">
        <h2 className="text-base font-semibold text-fg">Mudar senha</h2>
        <p className="text-sm text-muted mt-1">
          Informe a senha atual e defina uma nova senha de acesso.
        </p>
        <form onSubmit={handleSenha} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm text-muted">Senha atual</span>
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              required
              value={senhaForm.senhaAtual}
              onChange={(e) => setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Nova senha</span>
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={senhaForm.senhaNova}
              onChange={(e) => setSenhaForm({ ...senhaForm, senhaNova: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Confirmar nova senha</span>
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={senhaForm.confirmarSenha}
              onChange={(e) => setSenhaForm({ ...senhaForm, confirmarSenha: e.target.value })}
            />
          </label>
          {senhaErro && (
            <div className="text-sm text-rose-600 dark:text-rose-400">{senhaErro}</div>
          )}
          {senhaMsg && (
            <div className="text-sm text-emerald-700 dark:text-emerald-400">{senhaMsg}</div>
          )}
          <button
            type="submit"
            disabled={alterarSenha.isPending}
            className="bg-accent hover:opacity-90 text-accent-fg px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 min-h-11"
          >
            {alterarSenha.isPending ? 'Salvando...' : 'Atualizar senha'}
          </button>
        </form>
      </section>

      {isGestor && (
        <section className="bg-surface border border-border rounded-xl p-4 sm:p-5">
          <h2 className="text-base font-semibold text-fg">Pedidos de reativação</h2>
          <p className="text-sm text-muted mt-1">
            Contas desativadas que solicitaram voltar ao sistema.
          </p>

          {carregandoPedidos && <div className="mt-4 text-sm text-muted">Carregando...</div>}

          {!carregandoPedidos && reativacoes.length === 0 && (
            <div className="mt-4 text-sm text-muted">Nenhum pedido pendente.</div>
          )}

          {reativacoes.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm min-w-[32rem]">
                <thead className="bg-muted-bg text-xs uppercase text-muted">
                  <tr>
                    <th className="text-left px-3 py-2">Colaborador</th>
                    <th className="text-left px-3 py-2">Solicitado em</th>
                    <th className="text-right px-3 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reativacoes.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-fg">{p.colaborador.nome}</div>
                        <div className="text-xs text-muted">{p.colaborador.email}</div>
                      </td>
                      <td className="px-3 py-3 text-fg">
                        {new Date(p.criadoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={aprovar.isPending || recusar.isPending}
                            onClick={() => aprovar.mutate(p.id)}
                            className="px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 min-h-10"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            disabled={aprovar.isPending || recusar.isPending}
                            onClick={() => recusar.mutate(p.id)}
                            className="px-3 py-1.5 rounded-lg text-sm border border-border bg-surface hover:bg-surface-hover text-fg disabled:opacity-60 min-h-10"
                          >
                            Recusar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(aprovar.error || recusar.error) && (
            <div className="mt-3 text-sm text-rose-600 dark:text-rose-400">
              {(aprovar.error as Error | null)?.message ||
                (recusar.error as Error | null)?.message}
            </div>
          )}
        </section>
      )}

      <section className="border border-rose-300 dark:border-rose-800 rounded-xl p-4 sm:p-5 max-w-xl bg-rose-50/50 dark:bg-rose-950/20">
        <h2 className="text-base font-semibold text-rose-800 dark:text-rose-300">Apagar conta</h2>
        <p className="text-sm text-rose-700/90 dark:text-rose-300/90 mt-1">
          Sua conta será desativada (soft-delete). Você perderá o acesso imediatamente. Um gestor
          precisará aprovar se você solicitar a reativação depois.
        </p>

        {!mostrarApagar ? (
          <button
            type="button"
            onClick={() => setMostrarApagar(true)}
            className="mt-4 border border-rose-400 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/40 px-4 py-2.5 rounded-lg text-sm font-medium min-h-11"
          >
            Quero apagar minha conta
          </button>
        ) : (
          <form onSubmit={handleApagar} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm text-rose-800 dark:text-rose-300">
                Digite <strong>APAGAR</strong> para confirmar
              </span>
              <input
                className={inputClass}
                value={confirmTexto}
                onChange={(e) => setConfirmTexto(e.target.value)}
                placeholder="APAGAR"
                required
              />
            </label>
            {apagarErro && (
              <div className="text-sm text-rose-600 dark:text-rose-400">{apagarErro}</div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={desativarConta.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 min-h-11"
              >
                {desativarConta.isPending ? 'Desativando...' : 'Confirmar desativação'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarApagar(false);
                  setConfirmTexto('');
                  setApagarErro('');
                }}
                className="border border-border bg-surface hover:bg-surface-hover text-fg px-4 py-2.5 rounded-lg text-sm min-h-11"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      <p className="text-xs text-muted">
        Precisa de ajuda? Volte à <Link className="text-accent underline" to="/">agenda</Link>.
      </p>
    </div>
  );
}
