import React from 'react';
import { User, ImageIcon } from 'lucide-react';

interface AuthorityBlockProps {
  data: any;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
}

export const AuthorityBlock: React.FC<AuthorityBlockProps> = ({ data, onUpdate, isEditing }) => {
  const handleNameChange = (e: React.FocusEvent<HTMLElement>) => {
    onUpdate?.({ ...data, name: e.currentTarget.textContent || '' });
  };

  const handleBioChange = (e: React.FocusEvent<HTMLElement>) => {
    onUpdate?.({ ...data, bio: e.currentTarget.textContent || '' });
  };

  return (
    <div className="w-full h-full flex items-center justify-center py-12 px-6">
      <div className="text-center max-w-2xl bg-gray-50 dark:bg-gray-800/50 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative group">
        <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-6 overflow-hidden ring-4 ring-bible-gold/20 relative group/photo">
          {data.photo ? (
            <img src={data.photo} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User size={40} />
            </div>
          )}
          
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur p-2 rounded-xl shadow-2xl text-center">
                <ImageIcon size={16} className="mx-auto mb-1 text-bible-gold" />
                <input 
                  type="text" 
                  value={data.photo || ''} 
                  onChange={(e) => onUpdate?.({ ...data, photo: e.target.value })}
                  placeholder="URL da foto"
                  className="w-32 px-2 py-1 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-[10px] outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
        
        <h3 
          className={`text-base font-bold text-bible-ink dark:text-white mb-2 outline-none transition-all ${isEditing ? 'hover:bg-bible-gold/5 focus:bg-bible-gold/5 rounded-lg px-2 py-1 ring-1 ring-transparent focus:ring-bible-gold/20' : ''}`}
          contentEditable={isEditing}
          onBlur={handleNameChange}
          suppressContentEditableWarning
        >
          {data.name || 'Nome do Autor'}
        </h3>
        
        <p 
          className={`text-gray-600 dark:text-gray-400 outline-none transition-all ${isEditing ? 'hover:bg-bible-gold/5 focus:bg-bible-gold/5 rounded-lg px-2 py-1 ring-1 ring-transparent focus:ring-bible-gold/20' : ''}`}
          contentEditable={isEditing}
          onBlur={handleBioChange}
          suppressContentEditableWarning
        >
          {data.bio || 'Uma breve bio sobre o autor...'}
        </p>
      </div>
    </div>
  );
};
