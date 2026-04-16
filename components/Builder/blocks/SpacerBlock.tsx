import React from 'react';
import { Move, Maximize2 } from 'lucide-react';

interface SpacerBlockProps {
  data: {
    layoutWidth?: '1/1' | '1/2' | '1/3';
    height?: number;
    backgroundColor?: string;
  };
  isEditing: boolean;
  onUpdate?: (data: any) => void;
}

export const SpacerBlock: React.FC<SpacerBlockProps> = ({ data, isEditing, onUpdate }) => {
  const height = data.height || 40;
  
  // Mapear largura para classes Tailwind
  const widthClasses = {
    '1/1': 'w-full',
    '1/2': 'w-1/2 mx-auto',
    '1/3': 'w-1/3 mx-auto'
  };

  const containerStyle: React.CSSProperties = {
    height: `${height}px`,
    backgroundColor: data.backgroundColor || 'transparent',
    transition: 'all 0.3s ease'
  };

  if (isEditing) {
    return (
      <div 
        className={`${widthClasses[data.layoutWidth || '1/1']} group relative flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl hover:border-bible-gold/30 transition-all overflow-hidden`}
        style={containerStyle}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-4">
             <button 
               onClick={() => onUpdate?.({ ...data, layoutWidth: '1/3' })}
               className={`p-1.5 rounded-lg text-[10px] font-bold ${data.layoutWidth === '1/3' ? 'bg-bible-gold text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`}
             >
               1/3
             </button>
             <button 
               onClick={() => onUpdate?.({ ...data, layoutWidth: '1/2' })}
               className={`p-1.5 rounded-lg text-[10px] font-bold ${data.layoutWidth === '1/2' ? 'bg-bible-gold text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`}
             >
               1/2
             </button>
             <button 
               onClick={() => onUpdate?.({ ...data, layoutWidth: '1/1' })}
               className={`p-1.5 rounded-lg text-[10px] font-bold ${data.layoutWidth === '1/1' || !data.layoutWidth ? 'bg-bible-gold text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`}
             >
               1/1
             </button>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
               onClick={() => onUpdate?.({ ...data, height: Math.max(10, height - 20) })}
               className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"
             >
               <Move size={14} className="rotate-90" />
             </button>
             <span className="text-[10px] font-mono font-bold text-bible-gold">{height}px</span>
             <button 
               onClick={() => onUpdate?.({ ...data, height: height + 20 })}
               className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"
             >
               <Maximize2 size={14} />
             </button>
          </div>
        </div>
        
        {/* Placeholder label when not hovered */}
        <div className="group-hover:hidden text-[10px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest flex items-center gap-2">
          <Move size={12} />
          Espaçador {data.layoutWidth || '1/1'}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={widthClasses[data.layoutWidth || '1/1']}
      style={containerStyle}
    />
  );
};
