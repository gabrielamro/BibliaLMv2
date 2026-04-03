import React from 'react';
import { Eye, Share2, Image as ImageIcon, CheckCircle2, Lock, Calendar } from 'lucide-react';

export interface CardBadge {
    label: string;
    color: string; // Tailwind class like 'bg-purple-100 text-purple-600'
    icon?: React.ReactNode;
}

export interface StandardCardProps {
    title: string;
    subtitle: string;
    imageUrl?: string;
    coverUrl?: string; // Alias for imageUrl
    author?: string;
    badges?: CardBadge[];
    metrics?: {
        views?: number;
        shares?: number;
        completions?: number;
    };
    progress?: number; // 0 to 100
    actionLabel: string;
    onAction: (e: React.MouseEvent) => void;
    onSecondaryAction?: (e: React.MouseEvent) => void;
    secondaryIcon?: React.ReactNode;
    onShare?: (e: React.MouseEvent) => void;
    statusLabel?: string; // e.g. "Rascunho", "Publicado"
    statusColor?: string; // e.g. "bg-green-500"
    visibility?: 'public' | 'invitation';
    date?: string;
    onPreview?: (e: React.MouseEvent) => void;
    onClick?: () => void;
}

const StandardCard: React.FC<StandardCardProps> = ({
    title,
    subtitle,
    imageUrl,
    coverUrl,
    author,
    badges = [],
    metrics,
    progress,
    actionLabel,
    onAction,
    onSecondaryAction,
    secondaryIcon,
    onShare,
    statusLabel,
    statusColor,
    visibility,
    date,
    onPreview,
    onClick
}) => {
    const displayImage = coverUrl || imageUrl;
    return (
        <div 
            onClick={(e) => {
                if (onPreview) onPreview(e);
                else if (onClick) onClick();
            }}
            className="bg-white dark:bg-bible-darkPaper rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-all group cursor-pointer relative overflow-hidden flex flex-col h-full animate-in fade-in"
        >
            {/* Thumbnail Area */}
            <div className="h-40 bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                {displayImage ? (
                    <img src={displayImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={title} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-bible-gold/5">
                        <ImageIcon className="text-bible-gold/20" size={48} />
                    </div>
                )}
                
                {/* Top Status Badge & Visibility */}
                <div className="absolute top-3 right-3 flex gap-2">
                    {visibility === 'invitation' && (
                        <div className="w-6 h-6 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm" title="Apenas convite">
                            <Lock size={12} />
                        </div>
                    )}
                    {statusLabel && (
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase backdrop-blur-md shadow-sm text-white ${statusColor || 'bg-gray-900/50'}`}>
                            {statusLabel}
                        </span>
                    )}
                </div>

                {/* Progress Bar Overlay (If provided) */}
                {progress !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20 backdrop-blur-sm">
                        <div 
                            className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-green-500' : 'bg-bible-gold'}`} 
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                    {/* Badges Row */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {badges.map((badge, idx) => (
                            <span key={idx} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${badge.color}`}>
                                {badge.icon} {badge.label}
                            </span>
                        ))}
                    </div>

                    <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-2 group-hover:text-bible-gold transition-colors">
                        {title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {subtitle}
                    </p>
                </div>
                
                {/* Author & Info */}
                {author && (
                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">
                         Por: <span className="text-bible-gold">{author}</span>
                     </p>
                )}
                 
                {date && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mb-4">
                        <Calendar size={12} className="shrink-0" />
                        <span>Criado em {date}</span>
                    </div>
                )}

                {/* Footer Metrics & Actions */}
                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                        {progress !== undefined ? (
                            <span className={`font-bold ${progress >= 100 ? 'text-green-600' : 'text-bible-gold'}`}>
                                {progress >= 100 ? 'Concluído' : `${Math.round(progress)}%`}
                            </span>
                        ) : (
                            <>
                                {metrics?.views !== undefined && (
                                    <span className="flex items-center gap-1" title="Visualizações">
                                        <Eye size={12}/> {metrics.views}
                                    </span>
                                )}
                                {metrics?.shares !== undefined && (
                                    <span className="flex items-center gap-1" title="Compartilhamentos">
                                        <Share2 size={12}/> {metrics.shares}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        {onPreview && (
                            <button onClick={(e) => { e.stopPropagation(); onPreview(e); }} className="p-1.5 bg-bible-gold/10 text-bible-gold rounded hover:bg-bible-gold hover:text-white transition-colors" title="Visualizar">
                                <Eye size={14} />
                            </button>
                        )}
                        {onShare && (
                            <button onClick={(e) => { e.stopPropagation(); onShare(e); }} className="p-1.5 bg-bible-gold/10 text-bible-gold rounded hover:bg-bible-gold hover:text-white transition-colors" title="Compartilhar link">
                                <Share2 size={14} />
                            </button>
                        )}
                        {onSecondaryAction && (
                            <button onClick={(e) => { e.stopPropagation(); onSecondaryAction(e); }} className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded hover:bg-bible-gold hover:text-white transition-colors">
                                {secondaryIcon || <Share2 size={14} />}
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onAction(e); }} className={`px-3 py-1.5 text-white dark:text-black rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity ${progress !== undefined && progress >= 100 ? 'bg-green-600' : 'bg-bible-leather dark:bg-bible-gold'}`}>
                            {progress !== undefined && progress >= 100 ? 'Revisar' : actionLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StandardCard;