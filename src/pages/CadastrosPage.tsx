import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PageHeader } from '../components/ui';
import type { Cliente, Colaborador, Obrigacao } from '../types';
import { useAuth } from '../lib/auth';
import {
  cnpjPlaceholder,
  formatCnpj,
  isCnpjValido,
  maskCnpj,
  mensagemErroCnpj,
  onlyCnpjChars,
} from '../lib/cnpj';

const inputClass =
  'border border-border rounded-lg px-3 py-2 text-sm bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-accent';

export function ClientesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [cnpjTouched, setCnpjTouched] = useState(false);
  const [form, setForm] = useState({
    razaoSocial: '',
    cnpj: '',
    regimeTributario: 'SIMPLES',
    temFolha: false,
    uf: 'SP',
    municipio: '',
    responsavelPadraoId: '',
    vincularPacoteRegime: true,
  });

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api<Cliente[]>('/clientes'),
  });
  const { data: colaboradores = [] } = useQuery({
    queryKey: ['colaboradores'],
    queryFn: () => api<Colaborador[]>('/colaboradores'),
  });

  const cnpjErro = mensagemErroCnpj(form.cnpj);
  const cnpjOk = isCnpjValido(form.cnpj);

  const criar = useMutation({
    mutationFn: () =>
      api('/clientes', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          cnpj: formatCnpj(form.cnpj),
          responsavelPadraoId: form.responsavelPadraoId || null,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      setAberto(false);
      setCnpjTouched(false);
      setForm({
        razaoSocial: '',
        cnpj: '',
        regimeTributario: 'SIMPLES',
        temFolha: false,
        uf: 'SP',
        municipio: '',
        responsavelPadraoId: '',
        vincularPacoteRegime: true,
      });
    },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro e pacote de obrigações por regime"
        actions={
          user?.papel === 'GESTOR' && (
            <button
              onClick={() => setAberto((v) => !v)}
              className="bg-accent hover:opacity-90 text-accent-fg px-4 py-2 rounded-lg text-sm font-medium min-h-11 w-full sm:w-auto"
            >
              {aberto ? 'Fechar' : 'Novo cliente'}
            </button>
          )
        }
      />

      {aberto && (
        <form
          className="bg-surface border border-border rounded-xl p-4 mb-6 grid sm:grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setCnpjTouched(true);
            if (!cnpjOk) return;
            criar.mutate();
          }}
        >
          <input
            className={inputClass}
            placeholder="Razão social"
            required
            value={form.razaoSocial}
            onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
          />
          <div>
            <input
              className={`w-full ${inputClass} font-mono tracking-wide uppercase ${
                cnpjTouched && cnpjErro
                  ? 'border-rose-400 focus:ring-rose-500'
                  : cnpjOk
                    ? 'border-emerald-400'
                    : ''
              }`}
              placeholder={cnpjPlaceholder(form.cnpj)}
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              required
              maxLength={18}
              value={form.cnpj}
              onBlur={() => setCnpjTouched(true)}
              onChange={(e) => {
                setForm({ ...form, cnpj: maskCnpj(e.target.value) });
              }}
            />
            <div className="mt-1 text-[11px] text-muted">
              {/[A-Z]/i.test(onlyCnpjChars(form.cnpj))
                ? 'CNPJ alfanumérico · AA.AAA.AAA/AAAA-DV'
                : 'CNPJ numérico · 00.000.000/0000-00'}
              {' · '}DV sempre numérico
            </div>
            {cnpjTouched && cnpjErro && (
              <div className="mt-1 text-xs text-rose-600 dark:text-rose-400">{cnpjErro}</div>
            )}
          </div>
          <select
            className={inputClass}
            value={form.regimeTributario}
            onChange={(e) => setForm({ ...form, regimeTributario: e.target.value })}
          >
            <option value="MEI">MEI</option>
            <option value="SIMPLES">Simples</option>
            <option value="PRESUMIDO">Presumido</option>
            <option value="REAL">Lucro Real</option>
          </select>
          <input
            className={inputClass}
            placeholder="Município"
            required
            value={form.municipio}
            onChange={(e) => setForm({ ...form, municipio: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="UF"
            maxLength={2}
            required
            value={form.uf}
            onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
          />
          <select
            className={inputClass}
            value={form.responsavelPadraoId}
            onChange={(e) => setForm({ ...form, responsavelPadraoId: e.target.value })}
          >
            <option value="">Responsável padrão</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={form.temFolha}
              onChange={(e) => setForm({ ...form, temFolha: e.target.checked })}
            />
            Tem folha de pagamento
          </label>
          <label className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={form.vincularPacoteRegime}
              onChange={(e) => setForm({ ...form, vincularPacoteRegime: e.target.checked })}
            />
            Vincular pacote do regime
          </label>
          <button
            type="submit"
            className="sm:col-span-2 bg-sidebar text-sidebar-fg rounded-lg py-2.5 text-sm disabled:opacity-50 min-h-11"
            disabled={criar.isPending || (cnpjTouched && !cnpjOk)}
          >
            Salvar
          </button>
          {criar.isError && (
            <div className="sm:col-span-2 text-sm text-rose-600 dark:text-rose-400">
              {(criar.error as Error).message}
            </div>
          )}
        </form>
      )}

      {isLoading && <div className="text-muted">Carregando...</div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[36rem]">
            <thead className="bg-muted-bg text-xs uppercase text-muted">
              <tr>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Regime</th>
                <th className="text-left px-4 py-3">Local</th>
                <th className="text-left px-4 py-3">Responsável</th>
                <th className="text-right px-4 py-3">Obrigações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-3">
                    <div className="font-medium text-fg">{c.razaoSocial}</div>
                    <div className="text-xs text-muted font-mono">{formatCnpj(c.cnpj)}</div>
                  </td>
                  <td className="px-4 py-3 text-fg">{c.regimeTributario}</td>
                  <td className="px-4 py-3 text-fg">
                    {c.municipio}/{c.uf}
                  </td>
                  <td className="px-4 py-3 text-fg">{c.responsavelPadrao?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-fg">{c._count?.obrigacoes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ColaboradoresPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    cargo: '',
    area: 'FISCAL',
    capacidadeMensal: 160,
    papel: 'COLABORADOR',
    senha: 'senha123',
  });

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['colaboradores'],
    queryFn: () => api<Colaborador[]>('/colaboradores'),
  });

  const criar = useMutation({
    mutationFn: () =>
      api('/colaboradores', {
        method: 'POST',
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['colaboradores'] });
      setAberto(false);
    },
  });

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        subtitle="Equipe do escritório e capacidade de esforço"
        actions={
          user?.papel === 'GESTOR' && (
            <button
              onClick={() => setAberto((v) => !v)}
              className="bg-accent hover:opacity-90 text-accent-fg px-4 py-2 rounded-lg text-sm font-medium min-h-11 w-full sm:w-auto"
            >
              {aberto ? 'Fechar' : 'Novo colaborador'}
            </button>
          )
        }
      />

      {aberto && (
        <form
          className="bg-surface border border-border rounded-xl p-4 mb-6 grid sm:grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            criar.mutate();
          }}
        >
          <input
            className={inputClass}
            placeholder="Nome"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="E-mail"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Cargo"
            required
            value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })}
          />
          <select
            className={inputClass}
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
          >
            <option value="FISCAL">Fiscal</option>
            <option value="CONTABIL">Contábil</option>
            <option value="DP">DP</option>
            <option value="SOCIETARIO">Societário</option>
          </select>
          <select
            className={inputClass}
            value={form.papel}
            onChange={(e) => setForm({ ...form, papel: e.target.value })}
          >
            <option value="COLABORADOR">Colaborador</option>
            <option value="GESTOR">Gestor</option>
          </select>
          <input
            className={inputClass}
            type="number"
            placeholder="Capacidade mensal (h)"
            value={form.capacidadeMensal}
            onChange={(e) => setForm({ ...form, capacidadeMensal: Number(e.target.value) })}
          />
          <input
            className={`${inputClass} sm:col-span-2`}
            type="password"
            placeholder="Senha inicial"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
          />
          <button
            type="submit"
            className="sm:col-span-2 bg-sidebar text-sidebar-fg rounded-lg py-2.5 text-sm min-h-11"
          >
            Salvar
          </button>
        </form>
      )}

      {isLoading && <div className="text-muted">Carregando...</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lista.map((c) => (
          <div key={c.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm">
            <div className="font-semibold text-fg">{c.nome}</div>
            <div className="text-xs text-muted mt-0.5">{c.email}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="bg-muted-bg text-fg px-2 py-0.5 rounded-full">{c.area}</span>
              <span className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                {c.papel}
              </span>
              <span className="bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200 px-2 py-0.5 rounded-full">
                {c.capacidadeMensal}h/mês
              </span>
            </div>
            <div className="text-sm text-muted mt-3">{c.cargo}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ObrigacoesPage() {
  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['obrigacoes'],
    queryFn: () => api<Obrigacao[]>('/obrigacoes'),
  });

  return (
    <div>
      <PageHeader
        title="Catálogo de Obrigações"
        subtitle="Obrigações fiscais, contábeis e de DP com regra de vencimento"
      />

      {isLoading && <div className="text-muted">Carregando...</div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[48rem]">
            <thead className="bg-muted-bg text-xs uppercase text-muted">
              <tr>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Área</th>
                <th className="text-left px-4 py-3">Periodicidade</th>
                <th className="text-left px-4 py-3">Vencimento</th>
                <th className="text-left px-4 py-3">Criticidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((o) => (
                <tr key={o.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-fg">{o.codigo}</td>
                  <td className="px-4 py-3">
                    <div className="text-fg">{o.nome}</div>
                    <div className="text-xs text-muted">{o.baseLegal}</div>
                  </td>
                  <td className="px-4 py-3 text-fg">{o.area}</td>
                  <td className="px-4 py-3 text-fg">{o.periodicidade}</td>
                  <td className="px-4 py-3 text-xs text-fg">
                    {o.regraVencimento}
                    {o.dia ? ` · dia ${o.dia}` : ''}
                    <div className="text-muted">defasagem {o.mesesDefasagem}m</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        o.criticidade === 'CRITICA'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          : o.criticidade === 'ALTA'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                            : 'bg-muted-bg text-fg'
                      }`}
                    >
                      {o.criticidade}
                    </span>
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
