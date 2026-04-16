export type BlockType =
  | 'hero'
  | 'authority'
  | 'biblical'
  | 'video'
  | 'footer'
  | 'study-content'
  | 'slide'
  | 'hero-split'
  | 'study-outline'
  | 'related-verses'
  | 'reflection-question'
  | 'references-chain'
  | 'cta'
  | 'rich-text'
  | 'spacer';

export interface Block {
  id: string;
  type: BlockType;
  data: any;
  layoutWidth?: '1/1' | '1/2' | '1/3' | '2/3';
}

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
