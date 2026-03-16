"use client";
import { useNavigate } from '../../utils/router';


import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Share2, Eye, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';

import { LogoIcon } from '../LogoIcon';

export interface HeaderBadge {
    label: string;
    icon?: React.ReactNode;
}

export interface StandardHeaderProps {
    title: string;
    subtitle?: string;
    authorName?: string;
    authorPhoto?: string;
    coverUrl?: string;
    badges?: HeaderBadge[];
    metrics?: {
        views?: number;
        shares?: number;
        date?: string;
    };
    actions?: React.ReactNode;
    extraFooter?: React.ReactNode;
    onShare?: () => void;
    showLogo?: boolean;
    hideBackButton?: boolean;
    progress?: number;
}

const StandardHeader: React.FC<StandardHeaderProps> = ({
    title,
    subtitle,
    authorName,
    authorPhoto,
    coverUrl,
    badges = [],
    metrics,
    actions,
    extraFooter,
    onShare,
    showLogo,
    hideBackButton,
    progress
}) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // When header is fully visible, isScrolled is false. When it starts leaving, isScrolled becomes true.
                setIsScrolled(!entry.isIntersecting);
            },
            { threshold: [0.9] }
        );

        if (headerRef.current) {
            observer.observe(headerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const isLongSubtitle = subtitle && subtitle.length > 300;
    const displaySubtitle = isLongSubtitle && !isExpanded
        ? `${subtitle.substring(0, 300)}...`
        : subtitle;

    return (
        <div className="relative bg-bible-leather dark:bg-black text-white overflow-hidden">
            {/* Background Cover */}
            <div className="absolute inset-0 z-0">
                {coverUrl ? (
                    <img src={coverUrl} className="w-full h-full object-cover opacity-40" alt="Cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-bible-leather to-black opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bible-leather dark:from-[#0a0a0a] via-bible-leather/80 to-transparent" />
            </div>

            {/* Navigation Bar - Sticky Modernized */}
            <nav className={`sticky top-0 z-[60] flex justify-between items-center p-4 md:p-6 transition-all duration-300 ${isScrolled ? 'bg-bible-leather/90 dark:bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-lg pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]' : ''}`}>
                <div className="flex items-center gap-4 z-10 relative">
                    {!hideBackButton && (
                        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                </div>

                {/* Mini Title Appears on Scroll (Absolutely Centered) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none w-[60%]">
                    {showLogo && !isScrolled && (
                        <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => navigate('/')}>
                            <LogoIcon className="w-6 h-6 text-bible-gold" />
                            <span className="font-serif font-bold text-lg hidden md:inline">Bíblia<span className="text-bible-gold">LM</span></span>
                        </div>
                    )}
                    <h2 className={`font-serif font-bold text-base md:text-lg text-white truncate transition-all duration-300 text-center ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        {title}
                    </h2>
                </div>

                <div className="flex gap-2 z-10 relative">
                    {onShare && (
                        <button onClick={onShare} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors cursor-pointer pointer-events-auto">
                            <Share2 size={20} />
                        </button>
                    )}
                </div>
            </nav>

            {/* Anchor for scroll observation */}
            <div ref={headerRef} className="absolute top-0 left-0 w-full h-10 -z-10" />

            {/* Hero Content */}
            <div className={`relative z-10 max-w-7xl mx-auto px-6 pt-2 md:pt-4 pb-6 md:pb-8 text-center md:text-left transition-opacity duration-300 ${isScrolled ? 'opacity-30' : 'opacity-100'}`}>

                {/* Badges */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                    {badges.map((badge, idx) => (
                        <div key={idx} className="inline-flex items-center gap-2 bg-bible-gold/20 backdrop-blur-md px-3 py-1 rounded-full border border-bible-gold/30 text-bible-gold text-[10px] font-black uppercase tracking-widest">
                            {badge.icon} {badge.label}
                        </div>
                    ))}
                </div>

                <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif font-black leading-tight mb-4 drop-shadow-2xl text-white">
                    {title}
                </h1>

                {/* Meta Info Bar */}
                {/* Meta Info Bar - REORGANIZED FOR MOBILE */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 md:py-6 border-y border-white/10 mt-6 md:mt-8">
                    {authorName && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                                {authorPhoto ? <img src={authorPhoto} className="w-full h-full object-cover" /> : <User size={16} className="text-bible-gold" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Criado por</p>
                                <p className="text-xs md:text-sm font-bold text-white truncate">{authorName}</p>
                            </div>
                        </div>
                    )}

                    {progress !== undefined && (
                        <div className="flex-1 max-w-xs w-full">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] md:text-[10px] font-black text-bible-gold uppercase tracking-widest">{progress}% Concluído</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-bible-gold shadow-[0_0_10px_#c5a059] transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {actions && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 md:pt-0">
                            {actions}
                        </div>
                    )}
                </div>

                {extraFooter && (
                    <div className="mt-4 md:mt-6 w-full overflow-hidden">
                        {extraFooter}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StandardHeader;
