# 📈 BíbliaLM - SEO Strategy & Roadmap

> **VISÃO:** Tornar o BíbliaLM a referência orgânica número 1 para "Estudo Bíblico com IA" e "Gestão Eclesiástica Digital" no Brasil.

## 1. Diagnóstico Atual (SPA - Single Page Application)
*   **Força:** Velocidade de navegação (Client-side routing).
*   **Fraqueza:** Crawlers de redes sociais (Facebook/WhatsApp bot) não executam JS, resultando em previews quebrados sem SSR (Server Side Rendering).
*   **Oportunidade:** Cauda Longa (Long Tail) através de páginas de versículos e estudos públicos.

## 2. Roadmap de Implementação

### Q2 - Fundação Técnica (Technical SEO)
- [x] **Meta Tags Dinâmicas:** Títulos e descrições únicos por rota.
- [ ] **Canonical Tags:** Implementar para evitar canibalização de conteúdo.
- [ ] **Dados Estruturados (JSON-LD):**
  - `Schema.org/Church` para páginas de Igreja.
  - `Schema.org/CreativeWork` para Estudos e Sermões.
- [ ] **Gerador de Sitemap:** Ferramenta no Admin para listar todas as URLs públicas (Igrejas, Perfis, Estudos).

### Q3 - Conteúdo & Programmatic SEO
- [ ] **Landing Pages de Versículos:** Criar rotas estáticas `/biblia/joao-3-16` otimizadas para busca ("explicação joão 3:16").
- [ ] **Breadcrumbs:** Navegação estruturada para ajudar o Google a entender a hierarquia (Home > Estudos > Novo Testamento).
- [ ] **Otimização de Imagens (Alt Text):** Garantir que todas as Artes Sacras geradas tenham texto alternativo descritivo automático.

### Q4 - Autoridade & Performance
- [ ] **Link Building:** Incentivar igrejas a linkarem seus perfis no BíbliaLM em seus sites oficiais.
- [ ] **Core Web Vitals:** Manter LCP < 2.5s e CLS < 0.1.
- [ ] **Open Graph (OG) Images Dinâmicas:** Gerar thumbnail com título do estudo via Cloud Function para compartilhamento rico.

## 3. Guia de Redação para Títulos (Meta Title)
*   **Home:** BíbliaLM - Inteligência Artificial para Estudo Bíblico
*   **Igreja:** [Nome da Igreja] em [Cidade] - Cultos e Células | BíbliaLM
*   **Estudo:** [Título do Estudo] - Esboço e Teologia | [Nome do Autor]
*   **Versículo:** [Livro Cap:Ver] - Explicação e Contexto Bíblico

---
*Documento vivo. Atualize conforme evolução.*