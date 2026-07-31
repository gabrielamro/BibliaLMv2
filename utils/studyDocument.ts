import type {
  StudyDocumentV2,
  StudyEditorBlock,
  StudyLayoutSpan,
  StudyLegacyLayoutWidth,
} from '../types';

const WIDTH_TO_SPAN: Record<StudyLegacyLayoutWidth, StudyLayoutSpan> = {
  '1/1': 12,
  '2/3': 8,
  '1/2': 6,
  '1/3': 4,
};

const SPAN_TO_WIDTH: Record<StudyLayoutSpan, StudyLegacyLayoutWidth> = {
  12: '1/1',
  8: '2/3',
  6: '1/2',
  4: '1/3',
};

const isLegacyWidth = (value: unknown): value is StudyLegacyLayoutWidth =>
  value === '1/1' || value === '2/3' || value === '1/2' || value === '1/3';

export const getStudyBlockSpan = (block: Pick<StudyEditorBlock, 'layout' | 'layoutWidth' | 'data'>): StudyLayoutSpan => {
  if (block.layout?.span && [12, 8, 6, 4].includes(block.layout.span)) {
    return block.layout.span;
  }
  const dataWidth = (block.data as Record<string, unknown> | undefined)?.layoutWidth;
  const width = isLegacyWidth(block.layoutWidth)
    ? block.layoutWidth
    : isLegacyWidth(dataWidth)
      ? dataWidth
      : '1/1';
  return WIDTH_TO_SPAN[width];
};

export const getStudyBlockWidth = (block: Pick<StudyEditorBlock, 'layout' | 'layoutWidth' | 'data'>): StudyLegacyLayoutWidth =>
  SPAN_TO_WIDTH[getStudyBlockSpan(block)];

export const normalizeStudyBlocks = <TBlock extends StudyEditorBlock<Record<string, any>>>(blocks: TBlock[]): TBlock[] => {
  const normalized = blocks.map((block) => {
    const span = getStudyBlockSpan(block);
    const width = SPAN_TO_WIDTH[span];
    return {
      ...block,
      layout: { span },
      layoutWidth: width,
      data: {
        ...block.data,
        layoutWidth: width,
      },
    };
  });

  // O primeiro template premium gravava 1/2 + 1/3, mas era exibido
  // artificialmente como 70% + 30%. A migração preserva essa composição.
  return normalized.map((block, index) => {
    const next = normalized[index + 1];
    if (
      block.type === 'biblical' &&
      block.layout?.span === 6 &&
      next?.type === 'study-outline' &&
      next.layout?.span === 4
    ) {
      return {
        ...block,
        layout: { span: 8 },
        layoutWidth: '2/3',
        data: { ...block.data, layoutWidth: '2/3' },
      };
    }
    return block;
  });
};

export const parseStudyBlocks = (value: unknown): StudyEditorBlock<Record<string, any>>[] => {
  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(parsed)) {
    return normalizeStudyBlocks(parsed.filter((item): item is StudyEditorBlock<Record<string, any>> =>
      Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.type === 'string'),
    ));
  }
  if (parsed && typeof parsed === 'object' && (parsed as any).type === 'doc') {
    const blocks = Array.isArray((parsed as any).content)
      ? (parsed as any).content
        .filter((node: any) => node?.type === 'customBlock' && node?.attrs?.blockData)
        .map((node: any) => ({
          ...node.attrs.blockData,
          layoutWidth: node.attrs.layoutWidth ?? node.attrs.blockData.layoutWidth,
        }))
      : [];
    return normalizeStudyBlocks(blocks);
  }
  return [];
};

export const createStudyDocumentV2 = (
  input: Partial<StudyDocumentV2> & Pick<StudyDocumentV2, 'title' | 'blocks' | 'context'>,
): StudyDocumentV2 => ({
  schemaVersion: 2,
  revision: Math.max(0, input.revision ?? 0),
  context: input.context,
  title: input.title,
  description: input.description ?? '',
  category: input.category ?? 'Geral',
  tags: input.tags ?? [],
  bibleReference: input.bibleReference,
  blocks: normalizeStudyBlocks(input.blocks as StudyEditorBlock<Record<string, any>>[]),
  status: input.status ?? 'draft',
  updatedAt: input.updatedAt ?? new Date().toISOString(),
  id: input.id,
});
