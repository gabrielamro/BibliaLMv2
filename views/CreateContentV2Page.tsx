'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Eye,
  LayoutTemplate,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Wand2,
  X,
} from 'lucide-react';

import SEO from '../components/SEO';
import { ContentBuilder, BlockProperties, BlockRenderer, Block, BlockType, blockLabels, buildBaseBlocks, createBlock } from '../components/Builder';
import { useHeader } from '../contexts/HeaderContext';
import { useNavigate } from '../utils/router';

type FlowStatus = 'draft' | 'preview' | 'published';
type TemplateColumns = 1 | 2 | 3;
type LayoutWidth = '1/1' | '1/2' | '1/3' | '2/3';
type LayoutAlign = 'left' | 'center' | 'right';

const v2BaseBlocks: BlockType[] = [
  'hero',
  'hero-split',
  'slide',
  'study-content',
  'study-outline',
  'related-verses',
  'reflection-question',
  'footer',
];

const estudoProfundoV3Blocks: BlockType[] = [
  'hero',
  'biblical',
  'rich-text',
  'study-outline',
  'references-chain',
  'rich-text',
  'biblical',
  'references-chain',
  'reflection-question',
  'authority',
  'cta',
  'footer',
];

const pillClassName =
  'inline-flex items-center gap-2 rounded-full border border-[#d7c7aa] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8c6b3e]';

const GRID_UNITS = 6;
const layoutWidthToUnits: Record<LayoutWidth, number> = {
  '1/1': 6,
  '1/2': 3,
  '1/3': 2,
  '2/3': 4,
};

const widthOptionsByTemplate: Record<TemplateColumns, LayoutWidth[]> = {
  1: ['1/1'],
  2: ['1/2', '1/1'],
  3: ['1/3', '1/2', '2/3', '1/1'],
};

export default function CreateContentV2Page() {
  const navigate = useNavigate();
  const { setTitle, setBreadcrumbs, resetHeader } = useHeader();
  const [blocks, setBlocks] = useState<Block[]>(() => buildBaseBlocks(estudoProfundoV3Blocks));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<'mobile' | 'tablet' | 'desktop' | 'full'>('desktop');
  const [templateColumns, setTemplateColumns] = useState<TemplateColumns>(2);
  const [isEditing, setIsEditing] = useState(true);
  const [flowStatus, setFlowStatus] = useState<FlowStatus>('draft');
  const [lastAction, setLastAction] = useState('Builder V2 pronto para edicao.');
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  useEffect(() => {
    setTitle('Criar Conteudo V2');
    setBreadcrumbs([
      { label: 'Estudio Criativo', onClick: () => navigate('/?tab=criar') },
      { label: 'Conteudo', onClick: () => navigate('/criar-conteudo') },
      { label: 'Criar Conteudo V2' },
    ]);
    return () => resetHeader();
  }, [navigate, resetHeader, setBreadcrumbs, setTitle]);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  );

  const statusLabel = useMemo(() => {
    if (flowStatus === 'published') return 'Publicado em simulacao';
    if (flowStatus === 'preview') return 'Preview ativo';
    return 'Rascunho local';
  }, [flowStatus]);

  const previewWidthLabel = useMemo(() => {
    if (templateColumns === 1) return 'preview 1 coluna';
    if (templateColumns === 2) return 'preview 2 colunas';
    return 'preview 3 colunas';
  }, [templateColumns]);

  const topBlockTypes: BlockType[] = ['hero', 'hero-split', 'slide'];
  const footerBlockTypes: BlockType[] = ['footer'];

  const topBlocks = useMemo(() => blocks.filter((block) => topBlockTypes.includes(block.type)), [blocks]);
  const footerBlocks = useMemo(() => blocks.filter((block) => footerBlockTypes.includes(block.type)), [blocks]);
  const flowBlocks = useMemo(
    () => blocks.filter((block) => !topBlockTypes.includes(block.type) && !footerBlockTypes.includes(block.type)),
    [blocks],
  );

  const updateBlock = (id: string, data: Record<string, any>) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, data: { ...block.data, ...data } } : block)));
  };

  const addBlock = (type: BlockType, index?: number) => {
    const newBlock = createBlock(type);
    setBlocks((prev) => {
      const next = [...prev];
      if (typeof index === 'number') next.splice(index, 0, newBlock);
      else next.push(newBlock);
      return next;
    });
    setSelectedBlockId(newBlock.id);
    setLastAction(`Bloco "${blockLabels[type].label}" adicionado na V2.`);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
    setLastAction('Bloco removido do canvas V2.');
  };

  const duplicateBlock = (id: string, index: number) => {
    const block = blocks.find((item) => item.id === id);
    if (!block) return;
    const duplicated = { ...block, id: `${block.id}-copy-${Date.now()}`, data: JSON.parse(JSON.stringify(block.data)) };
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
    setSelectedBlockId(duplicated.id);
    setLastAction(`Bloco "${blockLabels[block.type].label}" duplicado.`);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const saveDraft = () => {
    setFlowStatus('draft');
    setIsEditing(true);
    setLastAction('Rascunho salvo localmente no builder V2.');
  };

  const openPreview = () => {
    setFlowStatus('preview');
    setIsEditing(false);
    setLastAction('Preview do builder V2 atualizado.');
  };

  const publishSimulation = () => {
    setFlowStatus('published');
    setIsEditing(false);
    setLastAction('Publicado em simulacao a partir do builder V2.');
  };

  const getAllowedWidths = (columns: TemplateColumns) => widthOptionsByTemplate[columns];

  const normalizeLegacyWidth = (block: Block): LayoutWidth => {
    const explicitWidth = block.data?.layoutWidth;
    if (explicitWidth === '1/1' || explicitWidth === '1/2' || explicitWidth === '1/3' || explicitWidth === '2/3') {
      return explicitWidth;
    }

    const legacySpan = Number(block.data?.layoutSpan);
    if (!Number.isFinite(legacySpan)) {
      return block.type === 'study-outline' || block.type === 'related-verses' ? '1/3' : '1/1';
    }

    if (templateColumns === 1) return '1/1';
    if (templateColumns === 2) return legacySpan >= 2 ? '1/1' : '1/2';
    if (legacySpan >= 3) return '1/1';
    if (legacySpan === 2) return '2/3';
    return '1/3';
  };

  const getBlockWidth = (block: Block): LayoutWidth => {
    const width = normalizeLegacyWidth(block);
    const allowed = getAllowedWidths(templateColumns);
    if (allowed.includes(width)) return width;
    if (width === '1/3' && templateColumns === 2) return '1/2';
    if (width === '2/3' && templateColumns === 2) return '1/1';
    return '1/1';
  };

  const getBlockUnits = (block: Block) => layoutWidthToUnits[getBlockWidth(block)];
  const getBlockAlign = (block: Block): LayoutAlign => {
    const align = block.data?.layoutAlign;
    if (align === 'left' || align === 'center' || align === 'right') return align;
    return 'left';
  };
  const cycleBlockWidth = (id: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block;

        const currentWidth = getBlockWidth(block);
        const cycle =
          templateColumns === 1
            ? ['1/1']
            : templateColumns === 2
              ? (['1/1', '1/2'] as LayoutWidth[])
              : (['1/1', '1/2', '1/3'] as LayoutWidth[]);
        const currentIndex = cycle.indexOf(currentWidth);
        const nextWidth = cycle[(currentIndex + 1) % cycle.length] ?? cycle[0];

        return {
          ...block,
          data: {
            ...block.data,
            layoutWidth: nextWidth,
          },
        };
      }),
    );
    setLastAction('Largura do bloco ajustada pela barra de acao.');
  };

  const buildPreviewRows = (items: Block[]) => {
    const rows: Array<Array<{ block: Block; units: number; width: LayoutWidth; align: LayoutAlign }>> = [];
    let currentRow: Array<{ block: Block; units: number; width: LayoutWidth; align: LayoutAlign }> = [];
    let used = 0;

    for (const block of items) {
      const width = getBlockWidth(block);
      const units = layoutWidthToUnits[width];
      const align = getBlockAlign(block);
      if (used + units > GRID_UNITS) {
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [{ block, units, width, align }];
        used = units;
      } else {
        currentRow.push({ block, units, width, align });
        used += units;
      }

      if (used === GRID_UNITS) {
        rows.push(currentRow);
        currentRow = [];
        used = 0;
      }
    }

    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
  };

  const previewRows = useMemo(() => buildPreviewRows(flowBlocks), [flowBlocks, templateColumns]);
  const builderRows = useMemo(() => buildPreviewRows(blocks), [blocks, templateColumns]);
  const blockGridColumns = useMemo(() => {
    const placements = new Map<string, string>();

    for (const row of builderRows) {
      if (row.length === 1) {
        const [{ block, units, align }] = row;
        let start = 1;

        if (align === 'center') start = Math.floor((GRID_UNITS - units) / 2) + 1;
        if (align === 'right') start = GRID_UNITS - units + 1;

        placements.set(block.id, `${start} / span ${units}`);
        continue;
      }

      let cursor = 1;
      for (const item of row) {
        placements.set(item.block.id, `${cursor} / span ${item.units}`);
        cursor += item.units;
      }
    }

    return placements;
  }, [builderRows]);

  return (
    <>
      <SEO title="Criar Conteudo V2" description="Builder V2 com shell moderna e novos blocos editoriais." />

      <main
        data-testid="create-content-v2-shell"
        className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(215,199,170,0.25),_transparent_34%),linear-gradient(180deg,_#f8f3ea_0%,_#f2ece2_100%)] text-[#2d241c]"
      >
        <div className="flex h-full flex-col gap-4 px-4 py-4 lg:px-5">
          <section className="shrink-0 rounded-[32px] border border-[#e6dbc9] bg-white/76 p-4 shadow-[0_24px_80px_rgba(59,44,25,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/criar-conteudo')}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ddd1bf] bg-white text-[#233048] transition hover:-translate-y-0.5 hover:shadow-lg"
                  aria-label="Voltar para criar conteudo"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <p className={pillClassName}>Merge V1 + shell V2</p>
                  <h1 className="mt-3 font-serif text-3xl text-[#1f2b3f] sm:text-4xl">Criar Conteudo V2</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5f5245] sm:text-base">
                    A V2 agora usa a engine real de blocos do builder e adiciona os blocos editoriais da imagem dentro de uma interface mais moderna.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:min-w-[440px]">
                <div className="rounded-2xl border border-[#ddd1bf] bg-[#fbf7f0] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c6b3e]">Status</p>
                  <p className="mt-2 text-sm font-medium text-[#233048]">{statusLabel}</p>
                </div>
                <div className="rounded-2xl border border-[#233048]/10 bg-[#1f2b3f] px-4 py-3 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7c7aa]">Ultima acao</p>
                  <p className="mt-2 text-sm font-medium text-white/88">{lastAction}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => { setIsEditing(true); setLastAction('Modo de edicao ativado.'); }} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${isEditing ? 'bg-[#1f2b3f] text-white shadow-lg' : 'border border-[#ddd1bf] bg-white text-[#5c534b]'}`}>
                <LayoutTemplate size={16} />
                Editar
              </button>
              <button type="button" onClick={openPreview} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${!isEditing ? 'bg-[#b3874c] text-white shadow-lg' : 'border border-[#ddd1bf] bg-white text-[#5c534b]'}`}>
                <Eye size={16} />
                Preview
              </button>
              <button type="button" onClick={saveDraft} className="inline-flex items-center gap-2 rounded-full border border-[#ddd1bf] bg-white px-4 py-2 text-sm font-semibold text-[#5c534b] transition hover:-translate-y-0.5 hover:shadow-lg">
                <Save size={16} />
                Salvar rascunho
              </button>
              <button type="button" onClick={publishSimulation} className="inline-flex items-center gap-2 rounded-full bg-[#1f2b3f] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">
                <Wand2 size={16} />
                Publicar simulacao
              </button>

              <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#e2d6c5] bg-[#faf7f2] p-1">
                {[
                  { key: 'mobile', icon: Smartphone },
                  { key: 'tablet', icon: Tablet },
                  { key: 'desktop', icon: Monitor },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = canvasWidth === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCanvasWidth(item.key as 'mobile' | 'tablet' | 'desktop')}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${active ? 'bg-white text-[#b3874c] shadow' : 'text-[#7c7064]'}`}
                      aria-label={`Canvas ${item.key}`}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e2d6c5] bg-[#faf7f2] p-1">
                {[1, 2, 3].map((count) => {
                  const active = templateColumns === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setTemplateColumns(count as TemplateColumns);
                        setLastAction(`Template ajustado para ${count} ${count === 1 ? 'coluna' : 'colunas'}.`);
                      }}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${active ? 'bg-white text-[#b3874c] shadow' : 'text-[#7c7064]'}`}
                      aria-label={`Template ${count} ${count === 1 ? 'coluna' : 'colunas'}`}
                    >
                      {count} {count === 1 ? 'coluna' : 'colunas'}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            data-testid="create-content-v2-workspace"
            className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]"
          >
            <aside className="overflow-hidden rounded-[30px] border border-[#eadfcf] bg-white/84 shadow-[0_20px_60px_rgba(59,44,25,0.08)]">
              <div className="flex h-full min-h-0 flex-col p-5">
                <p className={pillClassName}>
                  <Plus size={14} />
                  Biblioteca de Blocos
                </p>
                <h2 className="mt-4 font-serif text-2xl text-[#1f2b3f]">Painel esquerdo</h2>
                <p className="mt-2 text-sm leading-7 text-[#67594c]">
                  O builder da V1 segue por baixo, mas a V2 ganha uma biblioteca visual mais clara para montar o layout editorial.
                </p>

                <div className="mt-6 grid min-h-0 flex-1 auto-rows-max gap-3 overflow-y-auto pr-1">
                  {(Object.keys(blockLabels) as BlockType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addBlock(type)}
                      className="flex items-start gap-3 rounded-[24px] border border-[#efe5d7] bg-[#fcfaf7] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${blockLabels[type].color}`}>
                        <Sparkles size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1f2b3f]">{blockLabels[type].label}</p>
                        <p className="mt-1 text-xs leading-6 text-[#6d6154]">{blockLabels[type].description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-[32px] border border-[#eadfcf] bg-[#f6f1e8] p-4 shadow-[0_22px_70px_rgba(59,44,25,0.08)]">
                <div className="mb-4 flex items-center justify-between rounded-[24px] border border-[#e6dbc9] bg-white/70 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c6b3e]">Canvas V2</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-gray-900">Editor estilo estúdio</h2>
                  </div>
                  <div className="rounded-full border border-[#e2d6c5] bg-[#faf7f2] px-3 py-1 text-xs font-semibold text-[#7b6f62]">
                    {isEditing ? 'edicao em tempo real' : previewWidthLabel}
                  </div>
                </div>

                <div data-testid="create-content-v2-canvas-workspace" className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                  <div
                    className={`mx-auto min-h-full overflow-visible rounded-[2rem] border border-[#e5d8c7] bg-white shadow-[0_30px_80px_rgba(31,43,63,0.12)] ${
                      canvasWidth === 'mobile'
                        ? 'max-w-[375px]'
                        : canvasWidth === 'tablet'
                          ? 'max-w-[768px]'
                          : 'max-w-none'
                    }`}
                  >
                  {isEditing ? (
                    <ContentBuilder
                      blocks={blocks}
                      selectedBlockId={selectedBlockId}
                      onSelectBlock={setSelectedBlockId}
                      onEditBlock={(id) => {
                        setSelectedBlockId(id);
                        setIsPropertiesOpen(true);
                      }}
                      onCycleBlockWidth={cycleBlockWidth}
                      onUpdateBlock={updateBlock}
                      onMoveBlock={moveBlock}
                      onDuplicateBlock={duplicateBlock}
                      onRemoveBlock={removeBlock}
                      onAddBlock={addBlock}
                      isEditing={isEditing}
                      canvasWidth={canvasWidth}
                      authorName="BibliaLM"
                      layoutGridUnits={GRID_UNITS}
                      getBlockLayoutUnits={getBlockUnits}
                      getBlockLayoutWidth={getBlockWidth}
                      getBlockLayoutAlign={getBlockAlign}
                      getBlockGridColumn={(block) => blockGridColumns.get(block.id)}
                    />
                  ) : (
                    <div className="space-y-6 p-4 sm:p-6 xl:p-8">
                      {topBlocks.map((block) => (
                        <BlockRenderer key={block.id} block={block} isEditing={false} authorName="BibliaLM" canvasWidth={canvasWidth} />
                      ))}
                      {previewRows.map((row, rowIndex) => (
                        <div
                          key={`row-${rowIndex}`}
                          data-testid={`preview-row-${rowIndex}`}
                          className="grid gap-6"
                          style={{ gridTemplateColumns: `repeat(${GRID_UNITS}, minmax(0, 1fr))` }}
                        >
                          {row.map(({ block, units, width, align }, itemIndex) => {
                            let start = 1;
                            if (row.length === 1) {
                              if (align === 'center') start = Math.floor((GRID_UNITS - units) / 2) + 1;
                              if (align === 'right') start = GRID_UNITS - units + 1;
                            } else {
                              start = row.slice(0, itemIndex).reduce((sum, item) => sum + item.units, 1);
                            }

                            return (
                            <div
                              key={block.id}
                              data-testid={`preview-block-${block.id}`}
                              data-span={units}
                              data-units={units}
                              data-width={width}
                              data-align={align}
                              style={{ gridColumn: `${start} / span ${units}` }}
                            >
                              <BlockRenderer block={block} isEditing={false} authorName="BibliaLM" canvasWidth={canvasWidth} />
                            </div>
                            );
                          })}
                        </div>
                      ))}
                      {footerBlocks.map((block) => (
                        <BlockRenderer key={block.id} block={block} isEditing={false} authorName="BibliaLM" canvasWidth={canvasWidth} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </section>

          {isEditing && selectedBlock && isPropertiesOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1f2b3f]/35 px-4 py-6 backdrop-blur-sm">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Propriedades do bloco"
                className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#e2d6c5] bg-white shadow-[0_40px_120px_rgba(31,43,63,0.22)]"
              >
                <div className="flex items-center justify-between border-b border-[#efe5d7] bg-[#fcfaf7] px-6 py-4">
                  <div>
                    <p className={pillClassName}>Propriedades do bloco</p>
                    <h2 className="mt-3 font-serif text-2xl text-[#1f2b3f]">{blockLabels[selectedBlock.type].label}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPropertiesOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ddd1bf] bg-white text-[#233048] transition hover:-translate-y-0.5 hover:shadow-lg"
                    aria-label="Fechar propriedades"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-[#efe5d7] bg-[#fcfaf7] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c6b3e]">Estrutura da linha</p>
                      <p className="mt-2 text-sm leading-7 text-[#67594c]">
                        Defina a fracao real do bloco na linha. A V2 usa uma grade de 6 unidades, entao `1/2` ocupa metade da tela e `1/3` ocupa um terco, no estilo page builder.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {getAllowedWidths(templateColumns).map((width) => {
                          const active = getBlockWidth(selectedBlock) === width;
                          const units = layoutWidthToUnits[width];

                          return (
                            <button
                              key={width}
                              type="button"
                              onClick={() => updateBlock(selectedBlock.id, { layoutWidth: width })}
                              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${active ? 'bg-[#1f2b3f] text-white shadow' : 'border border-[#ddd1bf] bg-white text-[#5c534b]'}`}
                              aria-label={`Largura ${width}`}
                            >
                              {width}
                              <span className="ml-2 text-[10px] opacity-70">{units}/6</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[#efe5d7] bg-[#fcfaf7] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c6b3e]">Alinhamento do bloco</p>
                      <p className="mt-2 text-sm leading-7 text-[#67594c]">
                        Quando o bloco estiver sozinho na linha, voce pode manter a esquerda, centralizar ou encostar a direita.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          { key: 'left' as const, label: 'esquerda', icon: AlignLeft },
                          { key: 'center' as const, label: 'centro', icon: AlignCenter },
                          { key: 'right' as const, label: 'direita', icon: AlignRight },
                        ].map((option) => {
                          const Icon = option.icon;
                          const active = getBlockAlign(selectedBlock) === option.key;

                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => updateBlock(selectedBlock.id, { layoutAlign: option.key })}
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${active ? 'bg-[#1f2b3f] text-white shadow' : 'border border-[#ddd1bf] bg-white text-[#5c534b]'}`}
                              aria-label={`Alinhamento ${option.label}`}
                            >
                              <Icon size={14} />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <BlockProperties
                      block={selectedBlock}
                      onUpdate={(data) => updateBlock(selectedBlock.id, data)}
                      isEditing={isEditing}
                      onClose={() => setIsPropertiesOpen(false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
