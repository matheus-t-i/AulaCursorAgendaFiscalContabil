export type Papel = 'GESTOR' | 'COLABORADOR';
export type Area = 'FISCAL' | 'CONTABIL' | 'DP' | 'SOCIETARIO';
export type StatusTarefa =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_CLIENTE'
  | 'CONCLUIDA'
  | 'DISPENSADA';
export type Semaforo = 'PRETO' | 'VERMELHO' | 'AMARELO' | 'VERDE' | 'CINZA';

export type User = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  cargo?: string;
  area?: Area;
};

export type Colaborador = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  area: Area;
  capacidadeMensal: number;
  papel: Papel;
  ativo: boolean;
};

export type Cliente = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  regimeTributario: string;
  temFolha: boolean;
  uf: string;
  municipio: string;
  responsavelPadraoId?: string | null;
  ativo: boolean;
  responsavelPadrao?: { id: string; nome: string } | null;
  _count?: { obrigacoes: number };
  obrigacoes?: ClienteObrigacao[];
};

export type Obrigacao = {
  id: string;
  codigo: string;
  nome: string;
  area: Area;
  esfera: string;
  periodicidade: string;
  regraVencimento: string;
  dia: number | null;
  mesesDefasagem: number;
  criticidade: string;
  multaBase: string | number;
  multaPercentual: string | number;
  baseLegal?: string | null;
  regimesAplicaveis: string[];
  requerFolha: boolean;
  ativo: boolean;
};

export type ClienteObrigacao = {
  id: string;
  clienteId: string;
  obrigacaoId: string;
  responsavelId?: string | null;
  ativo: boolean;
  obrigacao: Obrigacao;
  responsavel?: { id: string; nome: string } | null;
};

export type Tarefa = {
  id: string;
  competencia: string;
  dataVencimento: string;
  status: StatusTarefa;
  prioridade: string;
  responsavelId?: string | null;
  dataConclusao?: string | null;
  protocolo?: string | null;
  observacao?: string | null;
  esforcoEstimado: number;
  atrasada?: boolean;
  semaforo?: Semaforo;
  multaEstimada?: number;
  responsavel?: { id: string; nome: string; area?: Area } | null;
  clienteObrigacao: {
    cliente: { id: string; razaoSocial: string; cnpj?: string };
    obrigacao: Obrigacao;
  };
};

export type Resumo = {
  total: number;
  atrasadas: number;
  vencendoHoje: number;
  emAndamento: number;
  concluidas: number;
  exposicaoMulta: number;
  pendentes: number;
};
