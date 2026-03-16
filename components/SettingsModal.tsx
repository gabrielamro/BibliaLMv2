
import React from 'react';
import { Type, X, AlignJustify, Maximize2, Sparkles } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, updateSettings, isFocusMode, onToggleFocus }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-in fade-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-sans font-semibold text-gray-900 dark:text-white">Aparência</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Focus Mode Toggle */}
        {onToggleFocus && (
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Maximize2 size={16} />
                    <span>Modo Foco</span>
                </div>
                <button 
                    onClick={onToggleFocus}
                    className={`w-10 h-5 rounded-full relative transition-colors ${isFocusMode ? 'bg-bible-gold' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isFocusMode ? 'translate-x-5' : ''}`} />
                </button>
            </div>
        )}

        {/* Smart Reading Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Sparkles size={16} className={settings.smartReadingMode ? "text-purple-500" : ""} />
                <span>Leitura Inteligente</span>
            </div>
            <button 
                onClick={() => updateSettings({ smartReadingMode: !settings.smartReadingMode })}
                className={`w-10 h-5 rounded-full relative transition-colors ${settings.smartReadingMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.smartReadingMode ? 'translate-x-5' : ''}`} />
            </button>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
            <Type size={16} />
            <span>Tamanho da Fonte</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs">A</span>
            <input 
              type="range" 
              min="1" 
              max="5" 
              step="1"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-bible-gold"
            />
            <span className="text-xl">A</span>
          </div>
        </div>

        {/* Font Family */}
        <div>
           <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
            <Type size={16} />
            <span>Estilo da Fonte</span>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
            <button 
              onClick={() => updateSettings({ fontFamily: 'serif' })}
              className={`flex-1 py-1 text-sm rounded-md transition-all font-serif ${settings.fontFamily === 'serif' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
            >
              Serifa
            </button>
            <button 
              onClick={() => updateSettings({ fontFamily: 'sans' })}
              className={`flex-1 py-1 text-sm rounded-md transition-all font-sans ${settings.fontFamily === 'sans' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
            >
              Sans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
