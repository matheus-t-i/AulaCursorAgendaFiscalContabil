import { Router } from 'express';
import type { Prisma, StatusTarefa } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { updateResponsavelSchema, updateStatusSchema } from '../../lib/schemas.js';
import { authRequired, requirePapel } from '../../middleware/auth.js';
import { gerarTarefasCompetencias } from '../../domain/geracao.js';
import { calcularSemaforo, isAtrasada, estimarMulta } from '../../domain/risco.js';
import { hojeDateOnly } from '../../domain/vencimento.js';

export const tarefasRouter = Router();

const includeTarefa = {
  responsavel: { select: { id: true, nome: true, area: true } },
  clienteObrigacao: {
    include: {
      cliente: { select: { id: true, razaoSocial: true, cnpj: true, uf: true, municipio: true } },
      obrigacao: true,
    },
  },
} satisfies Prisma.TarefaInclude;

tarefasRouter.get('/', authRequired, async (req, res, next) => {
  try {
    const {
      competencia,
      responsavelId,
      clienteId,
      status,
      area,
      risco,
      mes,
      ano,
    } = req.query;

    const where: Prisma.TarefaWhereInput = {};

    if (competencia) where.competencia = String(competencia);
    if (responsavelId) where.responsavelId = String(responsavelId);
    if (status) where.status = String(status) as StatusTarefa;

    if (clienteId || area) {
      where.clienteObrigacao = {
        ...(clienteId ? { clienteId: String(clienteId) } : {}),
        ...(area ? { obrigacao: { area: String(area) as never } } : {}),
      };
    }

    if (mes && ano) {
      const m = Number(mes);
      const a = Number(ano);
      const inicio = new Date(a, m - 1, 1);
      const fim = new Date(a, m, 0);
      where.dataVencimento = { gte: inicio, lte: fim };
    }

    // Colaborador só vê as próprias tarefas
    if (req.user?.papel === 'COLABORADOR') {
      where.responsavelId = req.user.id;
    }

    const tarefas = await prisma.tarefa.findMany({
      where,
      include: includeTarefa,
      orderBy: [{ dataVencimento: 'asc' }, { prioridade: 'desc' }],
    });

    const feriados = await prisma.feriado.findMany();
    const feriadosInfo = feriados.map((f) => ({
      data: f.data,
      abrangencia: f.abrangencia,
      uf: f.uf,
      municipio: f.municipio,
    }));

    let resultado = tarefas.map((t) => {
      const atrasada = isAtrasada(t.status, t.dataVencimento);
      const semaforo = calcularSemaforo(t.status, t.dataVencimento, undefined, feriadosInfo);
      const multaEstimada = atrasada
        ? estimarMulta({
            multaBase: Number(t.clienteObrigacao.obrigacao.multaBase),
            multaPercentual: Number(t.clienteObrigacao.obrigacao.multaPercentual),
            criticidade: t.clienteObrigacao.obrigacao.criticidade,
          })
        : 0;

      return { ...t, atrasada, semaforo, multaEstimada };
    });

    if (risco === 'atrasadas') {
      resultado = resultado.filter((t) => t.atrasada);
    } else if (risco === 'criticos') {
      resultado = resultado.filter((t) => t.semaforo === 'PRETO' || t.semaforo === 'VERMELHO');
    }

    res.json(resultado);
  } catch (e) {
    next(e);
  }
});

tarefasRouter.post('/gerar', authRequired, requirePapel('GESTOR'), async (req, res, next) => {
  try {
    const horizonte = Number(req.body?.horizonteMeses ?? 3);
    const resultado = await gerarTarefasCompetencias(prisma, horizonte);
    res.json(resultado);
  } catch (e) {
    next(e);
  }
});

tarefasRouter.get('/:id', authRequired, async (req, res, next) => {
  try {
    const tarefa = await prisma.tarefa.findUnique({
      where: { id: req.params.id },
      include: {
        ...includeTarefa,
        eventos: {
          orderBy: { criadoEm: 'asc' },
          include: { autor: { select: { id: true, nome: true } } },
        },
      },
    });
    if (!tarefa) throw new AppError(404, 'Tarefa não encontrada');
    res.json(tarefa);
  } catch (e) {
    next(e);
  }
});

tarefasRouter.patch('/:id/status', authRequired, async (req, res, next) => {
  try {
    const data = updateStatusSchema.parse(req.body);
    const tarefa = await prisma.tarefa.findUnique({ where: { id: req.params.id } });
    if (!tarefa) throw new AppError(404, 'Tarefa não encontrada');

    if (
      req.user?.papel === 'COLABORADOR' &&
      tarefa.responsavelId !== req.user.id
    ) {
      throw new AppError(403, 'Você só pode alterar suas próprias tarefas');
    }

    const dataConclusao =
      data.status === 'CONCLUIDA' ? hojeDateOnly() : data.status === 'DISPENSADA' ? null : null;

    const updated = await prisma.tarefa.update({
      where: { id: tarefa.id },
      data: {
        status: data.status,
        protocolo: data.protocolo ?? tarefa.protocolo,
        observacao: data.observacao ?? tarefa.observacao,
        dataConclusao: data.status === 'CONCLUIDA' ? dataConclusao : null,
        eventos: {
          create: {
            statusAnterior: tarefa.status,
            statusNovo: data.status,
            autorId: req.user?.id,
            observacao: data.observacao,
          },
        },
      },
      include: includeTarefa,
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

tarefasRouter.patch('/:id/responsavel', authRequired, requirePapel('GESTOR'), async (req, res, next) => {
  try {
    const data = updateResponsavelSchema.parse(req.body);
    const tarefa = await prisma.tarefa.findUnique({ where: { id: req.params.id } });
    if (!tarefa) throw new AppError(404, 'Tarefa não encontrada');

    const updated = await prisma.tarefa.update({
      where: { id: tarefa.id },
      data: {
        responsavelId: data.responsavelId,
        eventos: {
          create: {
            statusAnterior: tarefa.status,
            statusNovo: tarefa.status,
            responsavelAnteriorId: tarefa.responsavelId,
            responsavelNovoId: data.responsavelId,
            autorId: req.user?.id,
            observacao: data.observacao ?? 'Responsável alterado',
          },
        },
      },
      include: includeTarefa,
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});
