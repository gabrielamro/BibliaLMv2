import type {
  StudyBlockType,
  StudyEditorBlock,
  StudyLegacyLayoutWidth,
} from '../../types';

export type BlockType = StudyBlockType;
export type BlockLayoutWidth = StudyLegacyLayoutWidth;

// Os renderers legados ainda possuem dados heterogêneos. O `any` fica restrito
// a este adapter enquanto o documento canônico usa `StudyEditorBlock`.
export type Block = StudyEditorBlock<Record<string, any>>;

export interface ContentData {
  id?: string;
  type: 'article' | 'devotional' | 'series';
  status: 'draft' | 'published';
  slug: string;
  blocks: Block[];
  meta: {
    title: string;
    description: string;
    coverImage?: string;
    visibility?: 'public' | 'invitation';
    tags: string[];
  };
  stats: {
    views: number;
    comments: number;
    shares: number;
  };
  createdAt: string;
  updatedAt: string;
}
