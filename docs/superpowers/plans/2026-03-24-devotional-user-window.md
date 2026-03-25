# Devotional User Window Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que o Pão Diário oficial do dia seja a primeira opção para usuários logados, com fallback adaptativo que evita repetir a mesma referência bíblica para o mesmo usuário por 6 meses.

**Architecture:** A resolução do devocional sai das views e passa para um serviço dedicado. Esse serviço combina o devocional oficial do dia, o histórico do usuário, um pool de fallback em `daily_devotionals` e uma geração IA de último recurso, persistindo a entrega diária do usuário para manter consistência durante o dia.

**Tech Stack:** Next.js, TypeScript, Supabase, node:test com `ts-node/esm`

---

## Chunk 1: Domínio e persistência

### Task 1: Criar resolvedor de devocional

**Files:**
- Create: `services/devotionalResolver.ts`
- Test: `tests/devotionalResolver.test.ts`

- [ ] Escrever teste que prioriza o devocional oficial quando a referência não foi vista nos últimos 6 meses
- [ ] Rodar o teste e confirmar falha
- [ ] Implementar a lógica mínima de normalização de referência e escolha do candidato
- [ ] Rodar o teste e confirmar sucesso

### Task 2: Adicionar persistência de entrega diária por usuário

**Files:**
- Modify: `services/supabase.ts`
- Modify: `services/devotionalResolver.ts`
- Test: `tests/devotionalResolver.test.ts`

- [ ] Escrever teste para reaproveitar a entrega já resolvida no mesmo dia
- [ ] Rodar o teste e confirmar falha
- [ ] Adicionar helpers de leitura/gravação em `settings` para a resolução diária do usuário
- [ ] Adicionar leitura do histórico recente e lookup de devotionals por `content_id`/`date`
- [ ] Rodar o teste e confirmar sucesso

## Chunk 2: Fallback adaptativo

### Task 3: Selecionar fallback elegível do catálogo

**Files:**
- Modify: `services/devotionalResolver.ts`
- Test: `tests/devotionalResolver.test.ts`

- [ ] Escrever teste para escolher o próximo devocional com `verseReference` ainda não visto pelo usuário
- [ ] Rodar o teste e confirmar falha
- [ ] Implementar seleção por fila ordenada e janela de 6 meses
- [ ] Rodar o teste e confirmar sucesso

### Task 4: Gerar fallback novo quando o catálogo não tiver candidato

**Files:**
- Modify: `services/devotionalResolver.ts`
- Modify: `services/pastorAgent.ts` ou provedores de IA, se necessário
- Test: `tests/devotionalResolver.test.ts`

- [ ] Escrever teste para fallback gerado quando todos os candidatos existentes repetem
- [ ] Rodar o teste e confirmar falha
- [ ] Implementar geração com referências proibidas e persistência da entrega resolvida
- [ ] Rodar o teste e confirmar sucesso

## Chunk 3: Integração na UI

### Task 5: Integrar com `DevotionalPage`

**Files:**
- Modify: `views/DevotionalPage.tsx`

- [ ] Trocar carregamento direto do banco pelo resolvedor central
- [ ] Padronizar `content_id` salvo para usar o identificador resolvido do devocional
- [ ] Manter comportamento visual e ações atuais

### Task 6: Integrar com `Inicio03`

**Files:**
- Modify: `views/Inicio03.tsx`

- [ ] Trocar carregamento direto do banco/IA pelo resolvedor central
- [ ] Remover geração paralela local para evitar divergência
- [ ] Preservar render atual do card e o fluxo de navegação

## Chunk 4: Verificação

### Task 7: Validar solução

**Files:**
- Modify: `package.json` se for necessário expor comando de teste

- [ ] Rodar `node --loader ts-node/esm --test tests/devotionalResolver.test.ts`
- [ ] Rodar `npm run build`
- [ ] Revisar impactos nas telas de devocional e início
