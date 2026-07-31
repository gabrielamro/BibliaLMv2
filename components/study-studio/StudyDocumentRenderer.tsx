'use client';

import React from 'react';
import { BlockRenderer } from '../Builder/BlockRenderer';
import type { StudyEditorBlock } from '../../types';
import { getStudyBlockSpan, parseStudyBlocks } from '../../utils/studyDocument';

interface StudyDocumentRendererProps {
  blocks: unknown;
  canvasWidth?: 'mobile' | 'tablet' | 'desktop' | 'full';
  studyId?: string;
  studyTitle?: string;
  className?: string;
}

export const StudyDocumentRenderer: React.FC<StudyDocumentRendererProps> = ({
  blocks,
  canvasWidth = 'desktop',
  studyId,
  studyTitle,
  className = '',
}) => {
  const normalizedBlocks = React.useMemo(() => parseStudyBlocks(blocks), [blocks]);
  const isMobile = canvasWidth === 'mobile';

  return (
    <div
      data-testid="study-document-renderer"
      data-canvas-width={canvasWidth}
      className={`grid w-full grid-cols-12 items-stretch gap-x-3 gap-y-8 ${className}`}
    >
      {normalizedBlocks.map((block: StudyEditorBlock<Record<string, any>>) => {
        const span = isMobile ? 12 : getStudyBlockSpan(block);
        return (
          <div
            key={block.id}
            data-block-type={block.type}
            data-layout-span={span}
            className="min-w-0"
            style={{ gridColumn: `span ${span} / span ${span}` }}
          >
            <BlockRenderer
              block={block}
              isEditing={false}
              canvasWidth={canvasWidth}
              layoutWidth={block.layoutWidth}
              studyId={studyId}
              studyTitle={studyTitle}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StudyDocumentRenderer;
