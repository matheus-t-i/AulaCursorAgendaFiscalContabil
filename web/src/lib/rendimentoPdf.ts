import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

export type RankingItemPdf = {
  colaborador: { nome: string; area: string; cargo: string };
  pontualidade: number;
  volumeCompetencia: number;
  volumeEntregue: number;
  atrasoMedioDias: number;
  percentualCarga: number;
  cargaAtual: number;
  capacidadeMensal: number;
  tempoMedioCicloHoras: number | null;
};

export type RendimentoPdfInput = {
  competencia: string;
  ranking: RankingItemPdf[];
  pontualidadeMedia: number;
  volumeTotal: number;
  sobrecarregados: number;
};

/** Formata YYYY-MM como "Julho de 2026" (pt-BR). */
export function formatCompetenciaExtenso(competencia: string): string {
  const [anoStr, mesStr] = competencia.split('-');
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  if (!ano || !mes || mes < 1 || mes > 12) return competencia;
  const d = new Date(ano, mes - 1, 1);
  const raw = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function competenciaAtualLocal(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

export function emitirRelatorioRendimentoPdf(input: RendimentoPdfInput): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const competenciaLabel = formatCompetenciaExtenso(input.competencia);
  const geradoEm = new Date().toLocaleString('pt-BR');
  const total = input.ranking.length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('Relatório de Rendimento da Equipe', marginX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(`Competência: ${competenciaLabel}`, marginX, 26);
  doc.text(`Gerado em: ${geradoEm}`, marginX, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Resumo do período', marginX, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Pontualidade média: ${input.pontualidadeMedia}%`, marginX, 48);
  doc.text(`Volume entregue no mês: ${input.volumeTotal}`, marginX + 70, 48);
  doc.text(
    `Sobrecarregados (carga atual > 90%): ${input.sobrecarregados}`,
    marginX + 145,
    48,
  );

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Obs.: pontualidade, volume, atraso e ciclo referem-se à competência selecionada; a carga % é snapshot atual (tarefas abertas).',
    marginX,
    54,
  );

  const body = input.ranking.map((r, i) => {
    const volume = r.volumeCompetencia ?? r.volumeEntregue;
    return [
      `${i + 1}º`,
      r.colaborador.nome,
      r.colaborador.area,
      `${r.pontualidade}%`,
      String(volume),
      `${r.atrasoMedioDias}d`,
      `${r.percentualCarga}%`,
      r.tempoMedioCicloHoras != null ? String(r.tempoMedioCicloHoras) : '—',
    ];
  });

  let tableFinalY = 58;

  // Alinhamento por coluna — head e body usam o mesmo halign (via columnStyles + reforço em didParseCell).
  const colAlign: Record<number, 'left' | 'center'> = {
    0: 'center',
    1: 'left',
    2: 'left',
    3: 'center',
    4: 'center',
    5: 'center',
    6: 'center',
    7: 'center',
  };

  autoTable(doc, {
    startY: 58,
    head: [
      [
        'Posição',
        'Nome',
        'Área',
        'Pontualidade',
        'Volume no mês',
        'Atraso médio',
        'Carga atual',
        'Ciclo (h)',
      ],
    ],
    body,
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      // halign vem de columnStyles / didParseCell — não forçar aqui
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      1: { halign: 'left', cellWidth: 48 },
      2: { halign: 'left', cellWidth: 36 },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 30 },
      5: { halign: 'center', cellWidth: 28 },
      6: { halign: 'center', cellWidth: 26 },
      7: { halign: 'center', cellWidth: 22 },
    },
    didParseCell: (data) => {
      const align = colAlign[data.column.index];
      if (align) data.cell.styles.halign = align;

      if (data.section !== 'body') return;
      const rowIndex = data.row.index;
      const isTop3 = rowIndex < 3;
      const isBottom = total >= 4 && rowIndex >= Math.max(total - 2, 3);

      if (isTop3) {
        data.cell.styles.fillColor = [236, 253, 245];
        if (data.column.index === 0) {
          data.cell.styles.textColor = [4, 120, 87];
        }
      } else if (isBottom) {
        data.cell.styles.fillColor = [255, 241, 242];
        if (data.column.index === 0) {
          data.cell.styles.textColor = [190, 18, 60];
        }
      }
    },
    didDrawPage: (data) => {
      tableFinalY = data.cursor?.y ?? tableFinalY;
    },
    margin: { left: marginX, right: marginX },
  });

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Documento de uso interno — destinado à reunião mensal com colaboradores. Ranking: melhor → pior (pontualidade, depois volume).',
    marginX,
    Math.min(tableFinalY + 10, pageHeight - 12),
  );

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  doc.save(`rendimento-equipe-${input.competencia}.pdf`);
}
