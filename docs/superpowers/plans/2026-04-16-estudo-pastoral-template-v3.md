# Template Estudo Pastoral - Roadmap Otimizado V3

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar o template do editor `/criar-conteudo-v3` com roadmap otimizado baseado em estudo real (Salmo 91), melhorando UX, coesão visual, fluxo narrativo e referências bíblicas.

**Architecture:** Adicionar novo template "Estudo Pastoral" em constants.ts com dados reais default (Salmo 91), atualizar buildBaseBlocks para usar a nova estrutura, e ajustar o CreateContentV3Page para carregar o novo template por padrão.

**Tech Stack:** Next.js, React, TypeScript, TailwindCSS, componentes Builder existentes.

---

## Chunk 1: Definir Template Pastoral em Constants

### Task 1: Adicionar novo template em constants.ts

**Files:**
- Modify: `components/Builder/constants.ts:1-225`

- [ ] **Step 1: Adicionar novos dados default para Estudo Pastoral (baseado em Salmo 91)**

Adicionar ao final de `defaultBlockData`:

```typescript
  'estudo-pastoral': {
    title: "Salmo 91: O Abrigo do Altíssimo",
    subtitle: "Uma promessa de proteção divina para quem busca refúgio em Deus",
    ctaText: "Começar Estudo",
    verse: "Salmo 91:1-2",
    verseText: "Aquele que habita no abrigo do Altíssimo, sob a sombra do Onipotente descansará. Direi do SENHOR: Ele é o meu Deus, o meu refúgio, o meu alto refúgio, o meu Deus, em quem confio.",
    outlineItems: [
      "1. A Promessa do Abrigo",
      "2. A Proteção Divina", 
      "3. A Fidelidade de Deus",
      "4. Aplicação para Hoje",
      "5. Reflexão Pessoal"
    ],
    relatedVerses: [
      { reference: "Salmo 32:7", summary: "O SENHOR é o nosso refúgio e proteção." },
      { reference: "Salmo 121:5-8", summary: "O SENHOR guarda você de todo mal." },
      { reference: "2 Timóteo 1:7", summary: "Deus não nos deu espírito de medo." }
    ],
    reflectionQuestion: "Você tem buscado refúgio em Deus ou em outras fontes de proteção?",
    ctaHeadline: "Continue aprofundando",
    ctaSubheadline: "Explore mais estudos do Saltério ou crie seu próprio estudo",
    authorName: "Pastor(a)",
    authorBio: "Um servo dedicado ao crescimento espiritual da comunidade.",
    padding: 4
  }
```

- [ ] **Step 2: Commitar as mudanças**

```bash
git add components/Builder/constants.ts
git commit -m "feat: add estudo-pastoral template defaults based on Salmo 91"
```

---

## Chunk 2: Atualizar Utils para BuildBaseBlocks

### Task 2: Criar função para buildBaseBlocks com template pastoral

**Files:**
- Modify: `components/Builder/utils.ts:84-103`

- [ ] **Step 1: Adicionar template de estudo pastoral**

Adicionar ao final de utils.ts:

```typescript
export const ESTUDO_PASTORAL_BLOCK_TYPES = [
  'hero',
  'study-outline',
  'biblical',
  'rich-text',
  'references-chain',
  'biblical',
  'rich-text',
  'biblical',
  'related-verses',
  'reflection-question',
  'cta',
  'authority',
  'footer'
] as const;

export const ESTUDO_PASTORAL_LAYOUT = [
  { type: 'hero', layoutWidth: '1/1' as const },
  { type: 'study-outline', layoutWidth: '1/3' as const },
  { type: 'biblical', layoutWidth: '1/1' as const },
  { type: 'rich-text', layoutWidth: '2/3' as const },
  { type: 'references-chain', layoutWidth: '1/3' as const },
  { type: 'biblical', layoutWidth: '1/2' as const },
  { type: 'rich-text', layoutWidth: '1/2' as const },
  { type: 'biblical', layoutWidth: '1/2' as const },
  { type: 'related-verses', layoutWidth: '1/3' as const },
  { type: 'reflection-question', layoutWidth: '1/1' as const },
  { type: 'cta', layoutWidth: '1/2' as const },
  { type: 'authority', layoutWidth: '1/2' as const },
  { type: 'footer', layoutWidth: '1/1' as const },
];

export const buildEstudoPastoralBlocks = (): Block[] => {
  return ESTUDO_PASTORAL_LAYOUT.map((item, index) => {
    const block = createBlock(item.type);
    block.layoutWidth = item.layoutWidth;
    
    // Pre-populate with Salmo 91 data
    if (block.type === 'hero') {
      block.data = { ...block.data, 
        title: "Salmo 91: O Abrigo do Altíssimo",
        subtitle: "Uma promessa de proteção divina para quem busca refúgio em Deus",
        ctaText: "Começar Estudo"
      };
    }
    if (block.type === 'study-outline') {
      block.data = { ...block.data,
        items: [
          "1. A Promessa do Abrigo",
          "2. A Proteção Divina",
          "3. A Fidelidade de Deus",
          "4. Aplicação para Hoje",
          "5. Reflexão Pessoal"
        ],
        enableScrollSpy: true
      };
    }
    if (block.type === 'biblical' && index === 2) {
      block.data = { ...block.data,
        verse: "Salmo 91:1-2",
        text: "Aquele que habita no abrigo do Altíssimo, sob a sombra do Onipotente descansará. Direi do SENHOR: Ele é o meu Deus, o meu refúgio, o meu alto refúgio, o meu Deus, em quem confio.",
        reference: "Salmo 91:1-2",
        enableHyperlink: true
      };
    }
    if (block.type === 'references-chain') {
      block.data = { ...block.data,
        references: [
          { reference: "Salmo 32:7", text: "Tu és o meu refúgio...", summary: "Deus como nosso abrigo seguro" },
          { reference: "Salmo 121:5-8", text: "O SENHOR é o guarda...", summary: "Proteção constante dia e noite" }
        ]
      };
    }
    if (block.type === 'related-verses') {
      block.data = { ...block.data,
        verses: [
          { reference: "Salmo 32:7", summary: "O SENHOR é o nosso refúgio e proteção." },
          { reference: "Salmo 121:5-8", summary: "O SENHOR guarda você de todo mal." },
          { reference: "2 Timóteo 1:7", summary: "Deus não nos deu espírito de medo." }
        ]
      };
    }
    if (block.type === 'reflection-question') {
      block.data = { ...block.data,
        question: "Você tem buscado refúgio em Deus ou em outras fontes de proteção?",
        support: "Reflita sobre as áreas da sua vida onde você precisa confiar mais na proteção divina."
      };
    }
    if (block.type === 'cta') {
      block.data = { ...block.data,
        headline: "Continue aprofundando",
        subheadline: "Explore mais estudos do Saltério ou crie seu próprio estudo",
        primaryText: "Ver mais estudos",
        secondaryText: "Criar meu estudo"
      };
    }
    
    return block;
  });
};
```

- [ ] **Step 2: Commitar as mudanças**

```bash
git add components/Builder/utils.ts
git commit -m "feat: add buildEstudoPastoralBlocks with Salmo 91 default data"
```

---

## Chunk 3: Atualizar CreateContentV3Page

### Task 3: Usar novo template pastoral como padrão

**Files:**
- Modify: `views/CreateContentV3Page.tsx:69-97`

- [ ] **Step 1: Importar nova função e substituir template padrão**

No topo do arquivo, adicionar import:

```typescript
import { buildEstudoPastoralBlocks } from '../components/Builder/utils';
```

Na linha ~215 (onde buildBaseBlocks é chamado), substituir:

```typescript
// ANTIGO:
const blocks = buildBaseBlocks(estudoProfundoV3Layout);

// NOVO:
const blocks = buildEstudoPastoralBlocks();
```

- [ ] **Step 2: Atualizar título padrão do estudo**

Na linha ~220 onde meta.title é definido:

```typescript
// ANTIGO:
meta: { ...prev.meta, title: 'Novo Estudo Profundo V3' }

// NOVO:
meta: { ...prev.meta, title: 'Salmo 91: O Abrigo do Altíssimo' }
```

- [ ] **Step 3: Commitar as mudanças**

```bash
git add views/CreateContentV3Page.tsx
git commit -m "feat: use estudo pastoral template as default in V3 editor"
```

---

## Chunk 4: Verificação

### Task 4: Verificar implementação

**Files:**
- Modify: `views/CreateContentV3Page.tsx`
- Modify: `components/Builder/utils.ts`
- Modify: `components/Builder/constants.ts`

- [ ] **Step 1: Rodar typecheck**

```bash
npm run typecheck
```

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

- [ ] **Step 3: Testar manualmente**

Acessar `http://localhost:3010/criar-conteudo-v3` e verificar:
- [ ] Template carrega com dados do Salmo 91
- [ ] Todos os 13 blocos aparecem na ordem correta
- [ ] Índice lateral (study-outline) mostra as 5 seções
- [ ] Bloco bíblico principal mostra Salmo 91:1-2
- [ ] Referências encadeadas têm Salmo 32:7 e 121:5-8
- [ ] Pergunta ao coração está populada
- [ ] CTA tem headline correto

- [ ] **Step 4: Commitar verificação**

```bash
git commit -m "chore: verify estudo pastoral template works correctly"
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `components/Builder/constants.ts` | Adicionar defaultBlockData para estudo-pastoral |
| `components/Builder/utils.ts` | Adicionar buildEstudoPastoralBlocks() com dados do Salmo 91 |
| `views/CreateContentV3Page.tsx` | Usar buildEstudoPastoralBlocks() como template padrão |

**Resultado:** Novo template "Estudo Pastoral" com 13 blocos otimizados para UX, fluxo narrativo pastoral real, referências bíblicas em destaque, e ready para o usuário editar e publicar diretamente.