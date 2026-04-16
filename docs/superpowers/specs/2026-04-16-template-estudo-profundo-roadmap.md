# Roadmap: Template Padrão de Estudo Bíblico - "Estudo Profundo"

> **Data:** 2026-04-16  
> **Objetivo:** Criar modelo padrão rico para estudos bíblicos que funcione como **funil de aquisição de usuários**  
> **Foco:** Estudos teologicamente robustos e bem fundamentados

---

## 1. Visão Integrada

### 1.1 Proposta de Valor
- **Diferencial:** "Estudo Profundo" - conteúdo teologicamente robusto com hyperlinks bíblicos, contexto histórico e aplicação pastoral
- **Métrica de sucesso:** Visitantes → Cadastro para acesso a mais estudos + Obreiro IA para dúvidas

### 1.2 Fluxo de Conversão
```
Visitante encontra estudo (SEO/Compartilhamento)
    ↓
Consome conteúdo gratuito (hero + biblical + outline)
    ↓
Interage com reflexão (Reflection Question)
    ↓
[GANCHO] "Salve suas reflexões para acessar depois"
    ↓
Cadastro/Login para desbloquear + estudos + Obreiro IA
    ↓
Usuário qualificado para jornada/discipulado
```

---

## 2. Estrutura do Template (Ordem dos Blocos)

### 2.1 Mapa de Blocos - "Estudo Profundo V3"

| # | Bloco | Propósito | Largura | Responsável |
|---|-------|-----------|---------|------------|
| 1 | **Hero Impactante** | Gancho visual + título + autor | 1/1 | Frontend + Pastor |
| 2 | **Versículo âncora** | Autoridade bíblica + link clicável | 1/1 | Pastor + Frontend |
| 3 | **Contexto Histórico** | Background cultural/temporal | 1/2 | Pastor |
| 4 | **Roteiro do Estudo** | Navegação rápida (sidebar) | 1/4 | Frontend |
| 5 | **Versículos Relacionados** | Prova social bíblica | 1/4 | Pastor |
| 6 | **Corpo do Estudo** | Texto principal rico | 1/1 | Pastor + Frontend |
| 7 | **Destaque de Passagem** | Citação-chave destacada | 1/2 | Pastor |
| 8 | **Referências链** | Grupo de versículos conectados | 1/2 | Pastor |
| 9 | **Pergunta ao Coração** | CTA de reflexão (GANCHO) | 1/1 | Pastor |
| 10 | **Bio do Autor** | Autoridade + CTA de seguir | 1/2 | Frontend + Pastor |
| 11 | **CTA Final** | "Crie seu estudo" ou "Junte-se" | 1/2 | CPO |
| 12 | **Rodapé** | Links + marca | 1/1 | Frontend |

### 2.2 Wireframe Simplificado

```
┌─────────────────────────────────────────────────────────────┐
│  HERO (1/1) - Imagem + Título + Autor + Categoria          │
├─────────────────────────────────────────────────────────────┤
│  VERSÍCULO ÂNCORA (1/1) - "João 3:16" [clique para ver]   │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────┐ ┌──────────────┬───────────────┐ │
│ │ CONTEXTO HISTÓRICO    │ │ ROTEIRO      │ VERSÍCULOS    │ │
│ │ (1/2)                 │ │ DO ESTUDO    │ RELACIONADOS  │ │
│ │                       │ │ (1/4)        │ (1/4)         │ │
│ └───────────────────────┘ └──────────────┴───────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  CORPO DO ESTUDO (1/1) - Seções ricas com H2 + blockquote  │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────┐ ┌───────────────────────────────┐│
│ │ DESTAQUE DE PASSAGEM  │ │ REFERÊNCIAS链                  ││
│ │ (1/2)                 │ │ (1/2)                         ││
│ └───────────────────────┘ └───────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  PERGUNTA AO CORAÇÃO (1/1) - [GANCHO DE CONVERSÃO]         │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────┐ ┌───────────────────────────────┐│
│ │ BIO DO AUTOR          │ │ CTA FINAL                      ││
│ │ (1/2)                 │ │ "Crie seu estudo"              ││
│ └───────────────────────┘ └───────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  RODAPÉ (1/1) - Links + BibleLM                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Especificações por Bloco

### 3.1 Hero Impactante
**Responsável:** Frontend + Pastor

**Elementos:**
- Imagem de fundo full-width (ou gradiente bíblico)
- Badge de categoria (ex: "Evangelismo", "Discipulado")
- Título em destaque (H1, max 60 chars)
- Subtítulo/hook (max 120 chars)
- Nome do autor com avatar
- Data de publicação
- Tempo estimado de leitura

**Estilo Visual:**
- Altura mínima: 400px mobile / 500px desktop
- Overlay escuro para legibilidade
- Tipografia: Serifada para título, Sans para meta

**Conversão:**
- CTA secundário discreto: "Salvar para depois"

### 3.2 Versículo Âncora
**Responsável:** Pastor + Frontend

**Elementos:**
- Referência bíblica clicável (hiperlink para leitura na Bíblia)
- Texto do versículo em destaque
- Indicador visual de "versículo clicável"
- Estilos disponíveis: Classic, Modern, Royal, Minimal

**Funcionalidade:**
- Ao clicar, abre modal/biblioteca com texto completo
- [GANCHO] Se não logado: modal de cadastro para "ver mais versículos"

**Validação Pastoral:**
- Versículo deve ser contextual e relevante ao tema
- Incluir tradução oficial (NVI preferencialmente)

### 3.3 Contexto Histórico
**Responsável:** Pastor

**Elementos:**
- Título: "Contexto Histórico" ou "Mergulho no Texto"
- Período/timeframe (ex: "Século I d.C., Palestina")
- Quem escreveu, para quem, por quê
- Conexão com o Antigo/Novo Testamento
- Significado cultural relevante

**Estilo:**
- Background sutil (não compete com versículo)
- Ícone de livro antigo
- Texto em coluna única (max 700px)

### 3.4 Roteiro do Estudo
**Responsável:** Frontend

**Elementos:**
- Título: "Neste Estudo"
- Lista de seções numeradas
- Indicador de seção atual (scroll spy)
- Ícones por seção

**Funcionalidade:**
- Scroll suave para seção ao clicar
- Destaque da seção atual ao fazer scroll
- Progresso visual ("3 de 5 seções")

### 3.5 Versículos Relacionados
**Responsável:** Pastor

**Elementos:**
- 3-5 versículos de apoio
- Cada card: Referência + resumo (max 80 chars)
- Clicável para expandir texto

**Conversão:**
- [GANCHO] "Veja todos os versículos" → modal/biblioteca

### 3.6 Corpo do Estudo
**Responsável:** Pastor + Frontend

**Estrutura de Seções:**
```
1. Introdução (H2)
   - Parágrafo de abertura
   - Pergunta disparadora

2. [Seção Principal 1] (H2)
   - Texto explicativo
   - Bloco de citação bíblica
   - Subseção A (H3)
   - Subseção B (H3)

3. [Seção Principal 2] (H2)
   - Texto + aplicabilidade

4. [Seção Principal 3] (H2)
   - Passos práticos (lista)

5. Conclusão (H2)
   - Resumo + oração
```

**Elementos Rich Text:**
- H2 com borda lateral dourada
- Blockquote estilizado com versículo
- Listas numeradas/bullets
- Caixas de destaque (Passos Práticos)
- Imagens inline (opcional)

### 3.7 Destaque de Passagem
**Responsável:** Pastor

**Elementos:**
- Citação-chave do estudo (max 150 chars)
- Referência
- Background destacado (card ou citação)

**Estilo:**
- Tipografia grande (serifada)
- Ícone de aspas
- Borda dourada

### 3.8 Referências链
**Responsável:** Pastor

**Elementos:**
- Grupo de versículos conectados ao tema
- Exibição em formato de "cadeia" ou lista
- Clicável para expandir

**Funcionalidade:**
- [GANCHO] "Explore mais versículos" → requer cadastro

### 3.9 Pergunta ao Coração (GANCHO PRINCIPAL)
**Responsável:** Pastor + CPO

**Elementos:**
- Título: "Pergunta ao Coração" ou "Pausa para Reflexão"
- Pergunta reflexiva (curta, impactante)
- Textarea para usuário escrever reflexão
- Botão: "Salvar Reflexão"

**Fluxo de Conversão:**
1. Visitante escreve reflexão
2. Clica "Salvar Reflexão"
3. [GANCHO] Sistema detecta: não logado
4. Modal: "Salve suas reflexões e acesse de qualquer lugar"
5. CTA: "Criar conta gratuita" ou "Fazer login"

**Validação Pastoral:**
- Pergunta deve ser pessoal e aplicável
- Não genérica demais
- Exemplo: "Como Deus quer usar esta verdade na sua família esta semana?"

### 3.10 Bio do Autor
**Responsável:** Frontend + Pastor

**Elementos:**
- Foto do autor (circular)
- Nome
- Título/credenciais (ex: "Pastor, Teólogo")
- Bio curta (max 150 chars)
- Links sociais

**Estilo:**
- Card elegante com borda sutil
- Tom pastoral e acolhedor

### 3.11 CTA Final
**Responsável:** CPO

**Elementos:**
- Headline: "Crie seus próprios estudos"
- Subheadline: "Junte-se à comunidade BibleLM"
- Botão principal: "Começar Gratuitamente"
- Botão secundário: "Ver mais estudos"

**Posicionamento:**
- Ao lado da bio do autor
- Background destacado (gradiente suave)

### 3.12 Rodapé
**Responsável:** Frontend

**Elementos:**
- Logo BibleLM
- Links: Sobre, Contato, Termos
- Redes sociais
- Copyright

---

## 4. Melhorias nos Blocos Existentes

### 4.1 BiblicalBlock - Adicionar Hiperlink
```typescript
// Nova propriedade: enableHyperlink
interface BiblicalBlockData {
  verse: string;
  text: string;
  reference: string;
  enableHyperlink: boolean; // NEW
  hyperlinkUrl?: string; // NEW - gerado automaticamente
}
```

**Comportamento:**
- Se `enableHyperlink: true`, referência é clicável
- Abre leitura completa na Bíblia (interna ou externa)
- [GANCHO] Se não logado: modal de cadastro

### 4.2 StudyOutlineBlock - Scroll Spy
```typescript
interface StudyOutlineData {
  items: string[];
  activeIndex: number;
  enableScrollSpy: boolean; // NEW
}
```

### 4.3 ReflectionQuestionBlock - CTA de Conversão
**Mudança:** Ao detectar usuário não logado, mostrar CTA antes de salvar.

### 4.4 Novo Bloco: ReferencesChain (Versículos链)
**Propósito:** Exibir versículos conectados em formato visual de "cadeia".

---

## 5. Blueprint de Cores e Tipografia

### 5.1 Paleta de Cores
| Token | Hex | Uso |
|-------|-----|-----|
| `--bible-gold` | #c5a059 | Primária, destaques |
| `--bible-gold-light` | #fde68a | Fundos claros |
| `--bible-ink` | #1c1917 | Texto principal |
| `--bible-paper` | #faf7f3 | Background |
| `--bible-sage` | #5c7a5c | Acentos secundários |

### 5.2 Tipografia
| Elemento | Fonte | Tamanho |
|----------|-------|---------|
| H1 (Título estudo) | Playfair Display | 2.5rem |
| H2 (Seções) | Lora | 1.5rem |
| H3 (Subseções) | Lora | 1.25rem |
| Body | Lora | 1.0625rem |
| Meta/UI | Inter | 0.875rem |

---

## 6. Responsividade

### Mobile (< 768px)
- Hero: altura reduzida (300px)
- Blocos em coluna única
- Roteiro: colapsável (accordion)
- Versículos relacionados: carrossel horizontal
- Reflection Question: sticky no final

### Tablet (768px - 1024px)
- Grid 2 colunas para ctx + outline
- Roteiro sempre visível

### Desktop (> 1024px)
- Grid completo conforme wireframe
- Roteiro sticky na lateral

---

## 7. Gancho de Conversão - Fluxo Detalhado

### 7.1 Pontos de Gancho
1. **Versículo clicável:** "Quer ver o versículo completo? Crie sua conta."
2. **Versículos relacionados expandidos:** "Quer acesso ilimitado à biblioteca? Cadastre-se."
3. **Reflection Question:** "Salve suas reflexões para acessar de qualquer lugar."
4. **Bio do autor:** "Quer criar seus próprios estudos?"

### 7.2 Modal de Gancho
- Headline contextual
- Benefícios (3 bullets)
- 2 CTAs: "Criar conta" (primário) + "Agora não" (secundário)
- Não intrusivo (pode fechar)

### 7.3 Gamificação (Opcional)
- "Você salvou 1 reflexão esta semana"
- Badge: "Reflexivo" após 5 reflexões

---

## 8. Métricas de Sucesso

| Métrica | Meta | Ferramenta |
|---------|------|------------|
| Taxa de conversão (visitante → cadastro) | > 5% | Analytics |
| Tempo médio na página | > 3 min | Analytics |
| Scroll depth médio | > 70% | Heatmap |
| Taxa de reflexão salva | > 10% | DB |
| Estudo compartilhado | > 2% | UTM params |

---

## 9. Roadmap de Implementação

### Fase 1: Template Base (MVP)
- [ ] Criar novo template "Estudo Profundo V3"
- [ ] Ajustar BiblicalBlock com hyperlink
- [ ] Implementar scroll spy no StudyOutline
- [ ] Criar modal de gancho básico
- [ ] Testar em mobile

### Fase 2: Otimização de Conversão
- [ ] A/B test: CTA positions
- [ ] Implementar tracking de ganchos
- [ ] Refinar copy do modal
- [ ] Adicionar gamificação (opcional)

### Fase 3: Polimento Pastoral
- [ ] Validar estrutura teológica com Pastor
- [ ] Criar templates por categoria
- [ ] Adicionar mais blocos temáticos
- [ ] Internacionalização (pt-BR primeiro)

---

## 10. Próximos Passos

1. **Validar** este roadmap com as três especialidades
2. **Priorizar** funcionalidades por impacto de conversão
3. **Criar** documentação técnica dos novos blocos
4. **Implementar** em ambiente de staging
5. **Testar** com usuários reais

---

**Autores do Roadmap:**
- 👑 CPO (Funil + Métricas)
- 🎨 Frontend Designer (Layout + UX)
- ✝️ Pastor (Conteúdo + Teologia)
