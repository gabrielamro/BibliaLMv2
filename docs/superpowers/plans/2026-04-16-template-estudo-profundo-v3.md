# Template Estudo Profundo V3 - Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar template padrão "Estudo Profundo V3" para estudos bíblicos com blocos otimizados para conversão (funil de aquisição).

**Architecture:** Novo template baseado no existente CreateContentV2Page.tsx, incorporando BiblicalBlock com hyperlink, StudyOutlineBlock com scroll spy, e ReflectionQuestionBlock com CTA de conversão. Estrutura em grid responsivo 12 colunas.

**Tech Stack:** Next.js App Router, React 18, TypeScript, TailwindCSS, Supabase, Playwright.

---

## Chunk 1: Preparação e Configuração

### Task 1: Criar branch de desenvolvimento

**Files:**
- Modify: `docs/superpowers/specs/2026-04-16-template-estudo-profundo-roadmap.md`

- [ ] **Step 1: Criar branch feature/template-estudo-profundo-v3**

```bash
git checkout -b feature/template-estudo-profundo-v3
```

- [ ] **Step 2: Verificar estrutura atual dos blocos**

```bash
ls -la components/Builder/blocks/
```

- [ ] **Step 3: Commitar inicio**

```bash
git add docs/superpowers/specs/
git commit -m "docs: add estudo profundo v3 roadmap"
```

---

## Chunk 2: BiblicalBlock com Hyperlink

### Task 2: Adicionar propriedade enableHyperlink ao BiblicalBlock

**Files:**
- Modify: `components/Builder/blocks/BiblicalBlock.tsx:1-177`
- Modify: `components/Builder/constants.ts:93-101`
- Modify: `components/Builder/types.ts`

- [ ] **Step 1: Adicionar tipo BiblicalBlockData atualizado em types.ts**

```typescript
// components/Builder/types.ts
interface BiblicalBlockData {
  verse: string;
  text: string;
  reference: string;
  style: 'classic' | 'modern' | 'royal' | 'minimal' | 'card';
  showImage: boolean;
  imageUrl?: string;
  enableHyperlink: boolean; // NEW
  showCta: boolean;
  ctaText: string;
  ctaStyle: string;
  padding: number;
}
```

- [ ] **Step 2: Atualizar defaultBlockData em constants.ts**

```typescript
biblical: {
  verse: 'Joao 3:16',
  text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna.',
  reference: 'Joao 3:16',
  style: 'classic',
  showImage: false,
  enableHyperlink: true, // NEW
  showCta: false,
  ctaText: 'Ver na Biblia',
  ctaStyle: 'solid',
  padding: 8
},
```

- [ ] **Step 3: Modificar BiblicalBlock.tsx para incluir hyperlink**

Adicionar após a referência (linha ~129):

```tsx
{/* Hyperlink para Biblioteca Biblica */}
{(data.enableHyperlink || isEditing) && (
  <div className="mt-6 flex justify-center">
    <button 
      onClick={() => {
        // Simular busca do versículo na biblioteca
        const ref = data.reference || data.verse;
        window.dispatchEvent(new CustomEvent('open-bible-verse', { detail: { reference: ref } }));
      }}
      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-bible-gold hover:text-bible-gold/80 bg-bible-gold/5 hover:bg-bible-gold/10 rounded-lg transition-all border border-bible-gold/20 hover:border-bible-gold/40"
    >
      <BookOpen size={14} />
      {isEditing ? 'Habilitar link para bíblia' : 'Ver na Bíblia'}
    </button>
  </div>
)}
```

- [ ] **Step 4: Adicionar toggle no toolbar de estilos**

No toolbar do BiblicalBlock (após o botão de imagem):

```tsx
<button 
  onClick={() => onUpdate?.({ ...data, enableHyperlink: !data.enableHyperlink })}
  className={`p-2 rounded-xl transition-all ${data.enableHyperlink ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
  title="Habilitar/Desabilitar link bíblico"
>
  <BookOpen size={16} />
</button>
```

- [ ] **Step 5: Commitar**

```bash
git add components/Builder/
git commit -m "feat: add hyperlink support to BiblicalBlock"
```

---

## Chunk 3: StudyOutlineBlock com Scroll Spy

### Task 3: Implementar scroll spy no StudyOutlineBlock

**Files:**
- Modify: `components/Builder/blocks/StudyOutlineBlock.tsx:1-48`
- Modify: `components/Builder/constants.ts:156-163`

- [ ] **Step 1: Atualizar tipo StudyOutlineData**

```typescript
interface StudyOutlineData {
  title: string;
  description: string;
  items: string[];
  activeIndex: number;
  enableScrollSpy: boolean; // NEW
  padding: number;
  layoutWidth: string;
}
```

- [ ] **Step 2: Implementar scroll spy hook no componente**

Adicionar no topo do StudyOutlineBlock.tsx:

```tsx
import { useState, useEffect } from 'react';

const useScrollSpy = (itemCount: number) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-study-section]');
      let currentIndex = 0;
      
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 200) {
          currentIndex = index;
        }
      });
      
      setActiveIndex(currentIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [itemCount]);

  return activeIndex;
};
```

- [ ] **Step 3: Modificar componente para usar scroll spy**

```tsx
export const StudyOutlineBlock: React.FC<StudyOutlineBlockProps> = ({ data, isEditing, onUpdate }) => {
  const items = Array.isArray(data.items) ? data.items : [];
  const enableScrollSpy = data.enableScrollSpy && !isEditing;
  const [localActiveIndex, setLocalActiveIndex] = useState(data.activeIndex || 0);
  const spyIndex = enableScrollSpy ? useScrollSpy(items.length) : localActiveIndex;
  
  const activeIndex = enableScrollSpy ? spyIndex : (data.activeIndex || 0);

  // Adicionar data-study-section nos H2 do rich-text (via MutationObserver)
  useEffect(() => {
    if (!enableScrollSpy) return;
    
    const observer = new MutationObserver(() => {
      const h2s = document.querySelectorAll('.rtb-editor h2');
      h2s.forEach((h2, idx) => {
        h2.setAttribute('data-study-section', String(idx));
      });
    });
    
    const editor = document.querySelector('.rtb-editor');
    if (editor) {
      observer.observe(editor, { childList: true, subtree: true });
    }
    
    return () => observer.disconnect();
  }, [enableScrollSpy]);

  // Handler para scroll suave
  const scrollToSection = (index: number) => {
    const sections = document.querySelectorAll('[data-study-section]');
    const target = sections[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (!enableScrollSpy) {
        setLocalActiveIndex(index);
        onUpdate?.({ ...data, activeIndex: index });
      }
    }
  };

  return (
    <section className="rounded-[32px] border border-gray-100 dark:border-white/5 bg-white dark:bg-bible-darkPaper p-6 md:p-8 shadow-lg w-full h-full sticky top-4">
      <div className="p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c]">{data.title || 'Template'}</p>
        <p className="mt-1 text-sm text-[#7b6c5e]">{data.description}</p>
        
        {/* Progress indicator */}
        {enableScrollSpy && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-[#b3874c]">
            <div className="flex-1 h-1 bg-[#eee2d2] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#b3874c] transition-all duration-300"
                style={{ width: `${((activeIndex + 1) / items.length) * 100}%` }}
              />
            </div>
            <span>{activeIndex + 1}/{items.length}</span>
          </div>
        )}
        
        <div className="mt-5 space-y-2">
          {items.map((item: string, index: number) => (
            <button
              key={`${item}-${index}`}
              onClick={() => scrollToSection(index)}
              className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                index === activeIndex
                  ? 'border-[#c7a56f] bg-[#b3874c] text-white shadow-lg'
                  : 'border-[#eee2d2] bg-[#fcfaf7] text-[#5d5248] hover:border-[#b3874c]/50'
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
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 4: Atualizar defaultBlockData**

```typescript
'study-outline': {
  title: 'Neste Estudo',
  description: 'Navegue pelas secoes do estudo',
  items: ['Introducao', 'Contexto Historico', 'Mergulho nas Escrituras', 'Aplicacao Pratica', 'Reflexao Final'],
  activeIndex: 0,
  enableScrollSpy: true, // NEW
  padding: 4,
  layoutWidth: '1/3'
},
```

- [ ] **Step 5: Commitar**

```bash
git add components/Builder/
git commit -m "feat: add scroll spy to StudyOutlineBlock"
```

---

## Chunk 4: ReflectionQuestionBlock com CTA de Conversão

### Task 4: Adicionar modal de gancho para usuarios nao logados

**Files:**
- Modify: `components/Builder/blocks/ReflectionQuestionBlock.tsx:1-261`

- [ ] **Step 1: Adicionar estado para modal de conversao**

Adicionar no inicio do componente (apos os imports):

```tsx
// Modal de conversao para usuarios nao logados
const ConversionModal = ({ isOpen, onClose, onLogin }: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-bible-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-bible-gold" />
          </div>
          
          <h3 className="text-xl font-bold text-bible-ink dark:text-white mb-2">
            Suas reflexoes merecem ser guardadas
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Crie uma conta gratuita para salvar suas reflexoes, acessar de qualquer lugar e acompanhar sua jornada espiritual.
          </p>
          
          <div className="space-y-3 mb-6">
            {['Salve reflexoes sem limites', 'Acesse de qualquer dispositivo', 'Receba inspiracao diaria'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-left">
                <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
          
          <button
            onClick={onLogin}
            className="w-full py-4 bg-gradient-to-r from-bible-gold to-amber-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Criar Conta Gratuita
          </button>
          
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            Agora nao, obrigado
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Adicionar estado e handler para o modal**

```tsx
const [showConversionModal, setShowConversionModal] = useState(false);
const { currentUser, earnMana, showNotification } = useAuth();

// Modificar handleSaveReflection
const handleSaveReflection = async () => {
  if (!reflection.trim()) return;

  // Verificar se usuario esta logado
  if (!currentUser) {
    setShowConversionModal(true);
    return;
  }
  
  // ... resto do codigo original
};
```

- [ ] **Step 3: Adicionar o modal no render**

```tsx
// Modo leitura (preview / publicado)
return (
  <>
    <ConversionModal
      isOpen={showConversionModal}
      onClose={() => setShowConversionModal(false)}
      onLogin={() => {
        setShowConversionModal(false);
        // Redirecionar para login
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }}
    />
    
    <section className="rounded-[32px] border border-gray-100 dark:border-white/5 bg-white dark:bg-bible-darkPaper p-6 md:p-8 shadow-lg w-full h-full">
      {/* ... resto do conteudo original */}
    </section>
  </>
);
```

- [ ] **Step 4: Commitar**

```bash
git add components/Builder/
git commit -m "feat: add conversion modal to ReflectionQuestionBlock"
```

---

## Chunk 5: Novo Bloco - ReferencesChain

### Task 5: Criar bloco ReferencesChain para versículos encadeados

**Files:**
- Create: `components/Builder/blocks/ReferencesChainBlock.tsx`
- Modify: `components/Builder/constants.ts`
- Modify: `components/Builder/types.ts`
- Modify: `components/Builder/BlockRenderer.tsx`

- [ ] **Step 1: Criar arquivo do componente**

```tsx
// components/Builder/blocks/ReferencesChainBlock.tsx
"use client";

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from '../../../utils/router';

interface ReferencesChainBlockProps {
  data: {
    title: string;
    description: string;
    references: Array<{
      reference: string;
      text: string;
      summary: string;
    }>;
    showExpandAll: boolean;
    padding: number;
  };
  isEditing?: boolean;
  onUpdate?: (data: any) => void;
}

const VerseModal = ({ 
  reference, 
  text, 
  onClose, 
  onLogin 
}: { 
  reference: string; 
  text: string; 
  onClose: () => void;
  onLogin: () => void;
}) => {
  const { currentUser } = useAuth();
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
          <X size={18} />
        </button>
        
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-bible-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} className="text-bible-gold" />
          </div>
          <div>
            <p className="text-xs font-bold text-bible-gold uppercase tracking-wider">{reference}</p>
            {!currentUser && (
              <button onClick={onLogin} className="text-[10px] text-violet-600 hover:underline">
                Cadastre-se para ver mais versiculos
              </button>
            )}
          </div>
        </div>
        
        <blockquote className="text-xl font-serif italic text-bible-ink dark:text-white leading-relaxed mb-4">
          "{text}"
        </blockquote>
        
        {!currentUser && (
          <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl">
            <p className="text-sm text-violet-700 dark:text-violet-300 mb-3">
              Acesse a biblioteca completa da BibliaLM
            </p>
            <button
              onClick={onLogin}
              className="w-full py-2 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors"
            >
              Criar Conta Gratuita
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ReferencesChainBlock: React.FC<ReferencesChainBlockProps> = ({ data, isEditing = false, onUpdate }) => {
  const [expandedRefs, setExpandedRefs] = useState<Set<number>>(new Set());
  const [selectedVerse, setSelectedVerse] = useState<{ reference: string; text: string } | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const references = data.references || [];
  
  const toggleExpand = (index: number) => {
    setExpandedRefs(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  
  const handleVerseClick = (ref: { reference: string; text: string }) => {
    if (!currentUser) {
      setSelectedVerse(ref);
    } else {
      // Se logado, expandir inline
      const index = references.findIndex(r => r.reference === ref.reference);
      toggleExpand(index);
    }
  };
  
  // Modo edicao
  if (isEditing) {
    return (
      <section className="rounded-[28px] border-2 border-dashed border-[#e2ceb0] dark:border-gray-700 bg-white/50 dark:bg-bible-darkPaper/50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c] mb-2">
          {data.title || 'Referencias Encadeadas'}
        </p>
        <p className="text-sm text-[#7b6c5e] mb-4">
          {data.description || 'Lista de versiculos conectados ao tema'}
        </p>
        
        <div className="space-y-3">
          {references.length > 0 ? references.map((ref, i) => (
            <div key={i} className="p-4 bg-[#fcfaf7] rounded-xl border border-[#eee2d2]">
              <p className="text-sm font-bold text-[#b3874c]">{ref.reference}</p>
            </div>
          )) : (
            <p className="text-xs text-[#8c6b3e] italic">
              Adicione versiculos no painel lateral
            </p>
          )}
        </div>
      </section>
    );
  }
  
  // Modo leitura
  return (
    <>
      {selectedVerse && (
        <VerseModal
          reference={selectedVerse.reference}
          text={selectedVerse.text}
          onClose={() => setSelectedVerse(null)}
          onLogin={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
        />
      )}
      
      <section className="rounded-[28px] border border-[#eadfcf] bg-white/82 p-5 shadow-[0_22px_60px_rgba(59,44,25,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c]">
              {data.title || 'Referencias'}
            </p>
            <p className="text-sm text-[#7b6c5e]">{data.description}</p>
          </div>
          {!currentUser && (
            <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
              Cadastre-se
            </span>
          )}
        </div>
        
        {/* Visual de cadeia/thread */}
        <div className="relative pl-4">
          {/* Linha vertical conectando */}
          <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#c5a059] via-[#c5a059] to-transparent" />
          
          <div className="space-y-4">
            {references.map((ref, index) => {
              const isExpanded = expandedRefs.has(index);
              const isLocked = !currentUser && !isExpanded;
              
              return (
                <div key={index} className="relative">
                  {/* Indicador de conexao */}
                  <div className={`absolute -left-4 top-4 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all ${
                    isExpanded 
                      ? 'bg-[#c5a059] border-[#c5a059] text-white' 
                      : 'bg-white border-[#c5a059] text-[#c5a059]'
                  }`}>
                    {isExpanded ? <ChevronUp size={12} /> : <BookOpen size={10} />}
                  </div>
                  
                  <div className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-[#c5a059] bg-[#fffbf0] p-4'
                      : 'border-[#efe3d3] bg-[#fcfaf7] p-4 hover:border-[#c5a059]/50 cursor-pointer'
                  } ${isLocked ? 'opacity-75' : ''}`}
                  onClick={() => handleVerseClick(ref)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#b3874c]">{ref.reference}</h3>
                      {isLocked && (
                        <span className="text-[10px] text-violet-600 flex items-center gap-1">
                          <ExternalLink size={10} />
                          Login
                        </span>
                      )}
                    </div>
                    
                    {isExpanded && (
                      <>
                        <p className="mt-3 text-sm leading-7 text-[#66594c] italic">"{ref.text}"</p>
                        {ref.summary && (
                          <p className="mt-2 text-xs text-[#8c6b3e]">{ref.summary}</p>
                        )}
                      </>
                    )}
                    
                    {!isExpanded && (
                      <p className="mt-1 text-xs text-[#8c6b3e]">{ref.summary}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* CTA para usuarios nao logados */}
        {!currentUser && references.length > 0 && (
          <button
            onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
            className="w-full mt-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
          >
            Ver todos os versiculos na biblioteca
          </button>
        )}
      </section>
    </>
  );
};
```

- [ ] **Step 2: Registrar no constants.ts**

```typescript
'references-chain': {
  label: 'Referencias Encadeadas',
  description: 'Versiculos conectados em formato de cadeia',
  color: 'bg-teal-600 text-white'
},
'references-chain': {
  title: 'Referencias Encadeadas',
  description: 'Versiculos conectados ao tema principal',
  references: [
    { reference: 'Salmos 118:1', text: 'O Senhor e o meu pastor...', summary: 'A gratidao como resposta ao amor de Deus.' },
    { reference: 'Colossenses 3:17', text: 'Tudo o que fizeres...', summary: 'Viver com gratidao em todas as circunstancias.' }
  ],
  showExpandAll: true,
  padding: 4
},
```

- [ ] **Step 3: Registrar no types.ts**

```typescript
type BlockType = 
  | 'hero' 
  | 'authority' 
  | 'biblical' 
  | 'video' 
  | 'study-content' 
  | 'slide' 
  | 'hero-split' 
  | 'study-outline' 
  | 'related-verses' 
  | 'reflection-question' 
  | 'footer' 
  | 'rich-text' 
  | 'spacer'
  | 'references-chain'; // NEW
```

- [ ] **Step 4: Registrar no BlockRenderer.tsx**

```tsx
import { ReferencesChainBlock } from './blocks/ReferencesChainBlock';

const BLOCK_RENDERERS: Record<BlockType, React.FC<any>> = {
  // ... existing
  'references-chain': ReferencesChainBlock,
};

case 'references-chain':
  return <ReferencesChainBlock data={block.data} isEditing={isEditing} />;
```

- [ ] **Step 5: Commitar**

```bash
git add components/Builder/
git commit -m "feat: add ReferencesChainBlock for connected verses"
```

---

## Chunk 6: Template Estudo Profundo V3

### Task 6: Criar template "Estudo Profundo V3" na V2

**Files:**
- Modify: `views/CreateContentV2Page.tsx`
- Modify: `components/Builder/constants.ts`

- [ ] **Step 1: Definir template V3 em constants.ts**

```typescript
// Novo template padrao
export const TEMPLATES = {
  'estudo-profundo-v3': {
    name: 'Estudo Profundo V3',
    description: 'Template otimizado para conversao com blocos de hyperlink e CTA',
    blocks: [
      // 1. Hero Impactante
      { type: 'hero', layoutWidth: '1/1' },
      // 2. Versiculo ancora com hyperlink
      { type: 'biblical', layoutWidth: '1/1' },
      // 3-5. Contexto + Roteiro + Versiculos relacionados
      { type: 'rich-text', layoutWidth: '2/3' }, // Contexto Historico
      { type: 'study-outline', layoutWidth: '1/3' },
      // 6. Corpo do estudo
      { type: 'rich-text', layoutWidth: '1/1' },
      // 7-8. Destaque + References chain
      { type: 'biblical', layoutWidth: '1/2' }, // Destaque
      { type: 'references-chain', layoutWidth: '1/2' },
      // 9. Pergunta ao coracao (GANCHO)
      { type: 'reflection-question', layoutWidth: '1/1' },
      // 10-11. Bio + CTA
      { type: 'authority', layoutWidth: '1/2' },
      { type: 'rich-text', layoutWidth: '1/2' }, // CTA block
      // 12. Rodape
      { type: 'footer', layoutWidth: '1/1' },
    ] as const,
  },
};
```

- [ ] **Step 2: Criar bloco CTA customizado**

Adicionar em `constants.ts`:

```typescript
export const defaultBlockData = {
  // ... existing
  cta: {
    headline: 'Crie seus proprios estudos',
    subheadline: 'Junte-se a comunidade BibleLM para acesso ilimitado',
    primaryText: 'Comecar Gratuitamente',
    secondaryText: 'Ver mais estudos',
    primaryStyle: 'gradient', // gradient, solid, outline
    backgroundStyle: 'warm', // warm, cool, neutral
    padding: 8
  },
};
```

- [ ] **Step 3: Criar CTABlock**

```tsx
// components/Builder/blocks/CTABlock.tsx
"use client";

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from '../../../utils/router';

interface CTABlockProps {
  data: {
    headline: string;
    subheadline: string;
    primaryText: string;
    secondaryText: string;
    primaryStyle: string;
    backgroundStyle: string;
    padding: number;
  };
  isEditing?: boolean;
}

const CTA_STYLES = {
  gradient: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white',
  solid: 'bg-bible-gold text-white',
  outline: 'border-2 border-bible-gold text-bible-gold hover:bg-bible-gold/5',
};

const BG_STYLES = {
  warm: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20',
  cool: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-violet-900/20',
  neutral: 'bg-gray-50 dark:bg-gray-900',
};

export const CTABlock: React.FC<CTABlockProps> = ({ data, isEditing = false }) => {
  const navigate = useNavigate();
  
  return (
    <section className={`rounded-[28px] p-8 md:p-12 ${BG_STYLES[data.backgroundStyle as keyof typeof BG_STYLES] || BG_STYLES.warm}`}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 bg-white/80 dark:bg-gray-800/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Sparkles className="text-bible-gold" size={28} />
        </div>
        
        <h3 className="text-2xl md:text-3xl font-bold text-bible-ink dark:text-white mb-3">
          {data.headline || 'Crie seus proprios estudos'}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {data.subheadline || 'Junte-se a comunidade BibleLM'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/login?redirect=/criar-conteudo')}
            className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold shadow-xl transition-all hover:shadow-2xl hover:scale-105 active:scale-95 ${
              CTA_STYLES[data.primaryStyle as keyof typeof CTA_STYLES] || CTA_STYLES.gradient
            }`}
          >
            {data.primaryText || 'Comecar Gratuitamente'}
            <ArrowRight size={18} />
          </button>
          
          <button
            onClick={() => navigate('/estudos')}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
          >
            {data.secondaryText || 'Ver mais estudos'}
          </button>
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 4: Registrar CTABlock no sistema**

```typescript
// constants.ts
cta: {
  label: 'Bloco de CTA',
  description: 'Chamada para acao com botoes',
  color: 'bg-violet-600 text-white'
},
cta: {
  headline: 'Crie seus proprios estudos',
  subheadline: 'Junte-se a comunidade BibleLM para acesso ilimitado',
  primaryText: 'Comecar Gratuitamente',
  secondaryText: 'Ver mais estudos',
  primaryStyle: 'gradient',
  backgroundStyle: 'warm',
  padding: 8
},
```

- [ ] **Step 5: Atualizar CreateContentV2Page para usar novo template**

```tsx
const v3Blocks: BlockType[] = [
  'hero',
  'biblical',
  'rich-text', // Contexto
  'study-outline',
  'rich-text', // Corpo
  'biblical',  // Destaque
  'references-chain',
  'reflection-question',
  'authority',
  'cta',
  'footer',
];
```

- [ ] **Step 6: Commitar**

```bash
git add components/Builder/ views/
git commit -m "feat: add Estudo Profundo V3 template with CTA block"
```

---

## Chunk 7: Testes e Verificação

### Task 7: Verificar implementacao com testes

**Files:**
- Create: `tests/template-estudo-profundo-v3.spec.ts`

- [ ] **Step 1: Criar teste de smoke para BiblicalBlock com hyperlink**

```typescript
// tests/template-estudo-profundo-v3.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Template Estudo Profundo V3', () => {
  test('BiblicalBlock renders with hyperlink enabled', async ({ page }) => {
    await page.goto('/criar-conteudo-v2');
    
    // Adicionar BiblicalBlock se necessario
    await page.click('button:has-text("Versiculo em Destaque")');
    
    // Verificar que hyperlink button existe
    const hyperlinkBtn = page.locator('button:has-text("Ver na Biblia")');
    await expect(hyperlinkBtn).toBeVisible();
  });

  test('StudyOutline has scroll spy functionality', async ({ page }) => {
    await page.goto('/criar-conteudo-v2');
    
    // Adicionar StudyOutline se necessario
    await page.click('button:has-text("Template")');
    
    // Verificar que progress indicator existe
    const progress = page.locator('text=1/');
    await expect(progress).toBeVisible();
  });

  test('ReflectionQuestion shows conversion modal for non-logged users', async ({ page }) => {
    await page.goto('/criar-conteudo-v2');
    
    // Adicionar ReflectionQuestion
    await page.click('button:has-text("Pergunta ao Coracao")');
    
    // Clicar em salvar reflexao
    const saveBtn = page.locator('button:has-text("Salvar Reflexao")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      
      // Verificar modal de conversao
      const modal = page.locator('text=Suas reflexoes merecem ser guardadas');
      await expect(modal).toBeVisible();
    }
  });

  test('ReferencesChain renders locked verses for non-logged users', async ({ page }) => {
    await page.goto('/criar-conteudo-v2');
    
    // Adicionar ReferencesChain se existir
    const refsChainBtn = page.locator('button:has-text("Referencias Encadeadas")');
    if (await refsChainBtn.isVisible()) {
      await refsChainBtn.click();
      
      // Verificar elementos de cadeia
      const chainLine = page.locator('.space-y-4 > .relative');
      await expect(chainLine.first()).toBeVisible();
    }
  });
});
```

- [ ] **Step 2: Rodar testes**

```bash
npx playwright test tests/template-estudo-profundo-v3.spec.ts --project=chromium
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npm run typecheck 2>&1 | head -50
```

- [ ] **Step 4: Commitar**

```bash
git add tests/
git commit -m "test: add smoke tests for Estudo Profundo V3"
```

---

## Chunk 8: Polimento Final

### Task 8: Ajustes finais e documentação

**Files:**
- Modify: `README.md` (se existir seção de templates)

- [ ] **Step 1: Verificar responsividade mobile**

Testar manualmente em:
- [ ] Hero com imagem reduz em mobile
- [ ] Grid colapsa para 1 coluna
- [ ] Roteiro fica sticky ou colapsável

- [ ] **Step 2: Verificar acessibilidade**

```bash
# Verificar contraste de cores
# Verificar labels ARIA
# Verificar navegação por teclado
```

- [ ] **Step 3: Testar em ambiente staging (se disponível)**

```bash
# Deploy staging
npm run build && npm run start
```

- [ ] **Step 4: Documentar novo template**

Adicionar ao README ou docs:
```markdown
## Templates Disponiveis

### Estudo Profundo V3
Template otimizado para aquisição de usuarios, com:
- Versiculos clicáveis (link para biblioteca)
- Roteiro com scroll spy
- Gancho de conversao na reflexao
- Referencias encadeadas
```

- [ ] **Step 5: Commitar cambios finais**

```bash
git add .
git commit -m "chore: finalize Estudo Profundo V3 template"
```

---

## Resumo das Tasks

| Task | Descrição | Prioridade |
|------|-----------|------------|
| 1 | Branch e setup | Alta |
| 2 | BiblicalBlock com hyperlink | Alta |
| 3 | StudyOutline com scroll spy | Alta |
| 4 | ReflectionQuestion CTA conversao | Alta |
| 5 | ReferencesChain block | Media |
| 6 | Template V3 completo | Alta |
| 7 | Testes e verificacao | Alta |
| 8 | Polimento final | Baixa |

---

**Progresso:** `0/8` chunks iniciados
