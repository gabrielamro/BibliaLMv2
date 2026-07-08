import React, { useCallback, useState, useEffect, useRef } from 'react';
import { EditorTopBar } from '../../UnifiedEditor/components/EditorTopBar';

interface StudyOutlineBlockProps {
  data: any;
  isEditing: boolean;
  onUpdate?: (data: any) => void;
  editor?: any;
}

const useScrollSpy = (itemCount: number, enabled: boolean) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!enabled || itemCount === 0) return;

    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-study-section]');
      if (sections.length === 0) return;

      let currentIndex = 0;
      const scrollY = window.scrollY + 200;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        if (absoluteTop <= scrollY) {
          currentIndex = index;
        }
      });

      setActiveIndex(currentIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [itemCount, enabled]);

  return activeIndex;
};

export const StudyOutlineBlock: React.FC<StudyOutlineBlockProps> = ({ data, isEditing, onUpdate, editor }) => {
  const rootRef = useRef<HTMLElement | null>(null);
  const items = Array.isArray(data.items) ? data.items : [];
  const enableScrollSpy = data.enableScrollSpy && !isEditing;
  const spyActiveIndex = useScrollSpy(items.length, enableScrollSpy);
  const activeIndex = enableScrollSpy ? spyActiveIndex : (typeof data.activeIndex === 'number' ? data.activeIndex : 0);

  const getReaderRoot = useCallback(() => rootRef.current?.closest('.reader-content') || document, []);
  const normalizeSectionTitle = useCallback((value: string) => (
    value.replace(/^\s*\d+[\).\-\s]+/, '').replace(/\s+/g, ' ').trim().toLowerCase()
  ), []);

  const indexStudySections = useCallback(() => {
    const readerRoot = getReaderRoot();
    const headings = Array.from(
      readerRoot.querySelectorAll<HTMLElement>('.rtb-editor h2, .rtb-editor h3, .focused-prose h2, .focused-prose h3')
    ).filter((heading) => heading.offsetParent !== null);

    headings.forEach((heading) => heading.removeAttribute('data-study-section'));

    const usedHeadings = new Set<HTMLElement>();
    items.forEach((item: string, index: number) => {
      const normalizedItem = normalizeSectionTitle(item);
      const matchingHeading = headings.find((heading) => {
        if (usedHeadings.has(heading)) return false;
        return normalizeSectionTitle(heading.textContent || '').includes(normalizedItem);
      });
      const fallbackHeading = headings.find((heading) => !usedHeadings.has(heading));
      const target = matchingHeading || fallbackHeading;
      if (!target) return;

      usedHeadings.add(target);
      target.setAttribute('data-study-section', String(index));
      target.style.scrollMarginTop = '112px';
    });
  }, [getReaderRoot, items, normalizeSectionTitle]);

  useEffect(() => {
    if (!isEditing) return;
    
    const syncHeadings = () => {
      const h2s = document.querySelectorAll('.rtb-editor h2');
      const foundHeadings = Array.from(h2s).map(h => h.textContent || '').filter(Boolean);
      
      // Se os itens mudaram, atualiza o bloco
      if (JSON.stringify(foundHeadings) !== JSON.stringify(items)) {
        onUpdate?.({ ...data, items: foundHeadings });
      }

      // Marcar as seções para o scroll spy (mesmo em edição para manter consistência)
      h2s.forEach((h2, idx) => {
        h2.setAttribute('data-study-section', String(idx));
      });
    };

    const observer = new MutationObserver(syncHeadings);
    
    const editorEl = document.querySelector('.rtb-editor');
    if (editorEl) {
      observer.observe(editorEl, { childList: true, subtree: true, characterData: true });
      syncHeadings();
    }
    
    return () => observer.disconnect();
  }, [isEditing, items, onUpdate, data]);

  // Efeito adicional para garantir que o scroll spy funcione no modo visualização
  useEffect(() => {
    if (isEditing) return;
    const readerRoot = getReaderRoot();
    const scheduleIndex = () => {
      requestAnimationFrame(indexStudySections);
      window.setTimeout(indexStudySections, 120);
    };

    scheduleIndex();

    const observerTarget = readerRoot === document ? document.body : readerRoot;
    const observer = new MutationObserver(scheduleIndex);
    observer.observe(observerTarget, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [getReaderRoot, indexStudySections, isEditing]);

  const scrollToSection = (index: number) => {
    if (enableScrollSpy) return;
    
    indexStudySections();
    const target = getReaderRoot().querySelector(`[data-study-section="${index}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onUpdate?.({ ...data, activeIndex: index });
    }
  };

  const handleItemClick = (index: number) => {
    if (enableScrollSpy) {
      indexStudySections();
      const target = getReaderRoot().querySelector(`[data-study-section="${index}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      scrollToSection(index);
    }
  };

  return (
    <section ref={rootRef} className="flex h-full min-h-[420px] w-full flex-col rounded-[32px] border border-gray-100 bg-white p-6 shadow-lg dark:border-white/5 dark:bg-bible-darkPaper md:p-8">
      {isEditing && editor && (
        <div className="mb-4 bg-white/50 rounded-2xl overflow-hidden border border-bible-gold/10">
          <EditorTopBar editor={editor} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c]">{data.title || 'Sumário'}</p>
        <p className="mt-1 text-sm text-[#7b6c5e]">{data.description}</p>

        {enableScrollSpy && (
          <div className="mt-4 flex items-center gap-2 text-[10px] text-[#b3874c]">
            <div className="flex-1 h-1.5 bg-[#eee2d2] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#b3874c] transition-all duration-300 ease-out"
                style={{ width: `${items.length > 0 ? ((activeIndex + 1) / items.length) * 100 : 0}%` }}
              />
            </div>
            <span className="font-bold">{activeIndex + 1}/{items.length}</span>
          </div>
        )}

        <div className="mt-5 flex-1 space-y-2">
          {items.map((item: string, index: number) => (
            <button
              key={`${item}-${index}`}
              onClick={() => handleItemClick(index)}
              className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                index === activeIndex
                  ? 'border-[#c7a56f] bg-[#b3874c] text-white shadow-lg'
                  : 'border-[#eee2d2] bg-[#fcfaf7] text-[#5d5248] hover:border-[#b3874c]/50 cursor-pointer'
              }`}
            >
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${index === activeIndex ? 'bg-white/20' : 'bg-[#f4e8d4] text-[#b3874c]'}`}>
                {index + 1}
              </span>
              <span className="font-medium text-left flex-1">{item}</span>
              {index === activeIndex && (
                <span className="text-white/60">●</span>
              )}
            </button>
          ))}
          {isEditing && items.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#d7c7aa] px-4 py-3 text-sm text-[#8c6b3e]">Adicione itens do roteiro no painel lateral.</p>
          )}
        </div>
      </div>
    </section>
  );
};
