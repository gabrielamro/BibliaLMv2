import React from 'react';
import RichTextEditor from '../../RichTextEditor';
import { buildWrittenContentHtml } from '../utils';

interface StudyContentBlockProps {
  data: any;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
  authorName?: string;
}

export const StudyContentBlock: React.FC<StudyContentBlockProps> = ({ data, onUpdate, isEditing, authorName }) => {
  const studyTemplate = buildWrittenContentHtml();

  return (
    <div className="relative group">
      {/* Design Background Layer */}
      {data.backgroundColor && data.backgroundColor !== 'transparent' && data.backgroundColor !== '#ffffff' && (
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-grid-slate-100 dark:bg-grid-slate-700/20" />
      )}

      {/* Editor/Content Area */}
      <div className="w-full relative z-10 font-inherit">
        {isEditing ? (
          <div className="w-full font-inherit">
            <RichTextEditor
              content={data.content || studyTemplate}
              onChange={(newContent) => onUpdate?.({ ...data, content: newContent })}
              placeholder="Comece a escrever seu conteúdo bíblico profundo..."
            />
          </div>
        ) : (
          <div
            className="rich-editor-content prose prose-slate dark:prose-invert prose-sm md:prose-base max-w-none transition-all duration-500 font-inherit w-full overflow-x-auto break-words"
            dangerouslySetInnerHTML={{ __html: data.content || studyTemplate }}
          />
        )}
      </div>

      {/* End spacing */}
      {!isEditing && (
        <div className="h-12" />
      )}
    </div>
  );
};
