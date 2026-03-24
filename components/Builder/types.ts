export type BlockType = 'hero' | 'authority' | 'biblical' | 'video' | 'footer' | 'study-content' | 'slide';

export interface Block {
  id: string;
  type: BlockType;
  data: any;
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
