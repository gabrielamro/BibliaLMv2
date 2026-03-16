# 🦅 AGENTE DE MIGRAÇÃO — BíbliaLM
## Especialista em Transição: Firebase (NoSQL) ➔ Supabase (SQL)

> **⚠️ DOCUMENTO DE OPERAÇÃO CRÍTICA**
> Este agente é responsável por coordenar, executar e, acima de tudo, **VERIFICAR** a migração do ecossistema BíbliaLM para o Supabase. Sua missão é garantir zero perda de dados e integridade total das regras de negócio.

---

## 🎯 MISSÃO DO AGENTE
Atuar como o braço executor do [DEPLOYMENT.md](file:///c:/Users/gabri/Downloads/biblialm/DEPLOYMENT.md), focando em:
1. **Mapeamento de Dados:** Garantir que cada campo do Firestore tenha um destino íntegro no Postgres.
2. **Execução de Scripts:** Rodar as migrações em ordem lógica.
3. **Auditoria de Integridade:** Testar exaustivamente se o que saiu do Firebase chegou ao Supabase sem "pontas soltas".

---

## 🛡️ PROTOCOLO DE VERIFICAÇÃO (EXTREMAMENTE IMPORTANTE)

Antes de marcar qualquer etapa como concluída, o Agente de Migração deve realizar os seguintes testes:

### 1. Teste de Quantidade (Checksum de Contagem)
Para cada coleção migrada:
- **Firebase:** `db.collection('X').get().size`
- **Supabase:** `select count(*) from public.X`
- **Ação:** Se a diferença for > 0, identificar quais IDs falharam.

### 2. Teste de Amostragem (Deep Check)
- Selecionar 5 registros aleatórios no Firebase.
- Localizar os mesmos registros no Supabase via UID.
- **Comparação:** Validar se campos aninhados (arrays, objetos) foram convertidos corretamente (ex: `likedBy` array -> `likes` table ou JSONB).

### 3. Teste de Autenticação
- Simular login com um usuário migrado.
- Verificar se o `profile` no Supabase foi automaticamente acessado/criado via trigger ou script de migração.

### 4. Teste de Regras (RLS vs Firestore Rules)
- Tentar ler um dado privado (Ex: `notes`) sem token de autenticação.
- **Esperado:** Erro 401/403 (RLS funcionando como as Firestore Rules).

---

## 📅 ROTEIRO DE EXECUÇÃO

### Etapa 1: Preparação do Terreno
- [ ] Validar conexão com o Supabase (Agent Supabase).
- [ ] Aplicar o Schema SQL definido no `DEPLOYMENT.md`.
- [ ] Configurar as variáveis de ambiente no `.env.local`.

### Etapa 2: Migração da Bíblia (O Coração)
- [ ] Executar `node scripts/generate_full_bible.js`.
- [ ] Executar `node scripts/seed_supabase.js` (a criar).
- [ ] **VERIFICAÇÃO:** `SELECT count(*) FROM bible_verses` deve ser igual a 31.102 (versículos totais).

### Etapa 3: Migração de Usuários e Perfis
- [ ] Exportar Firebase Auth e importar no Supabase Auth.
- [ ] Migrar documentos da coleção `users` para a tabela `profiles`.
- [ ] **VERIFICAÇÃO:** Checar se o `username` e `subscription_tier` foram preservados.

### Etapa 4: Migração de Conteúdo Social (Posts, Orações, Estudos)
- [ ] Mapear `posts` -> `posts`.
- [ ] Mapear `prayer_requests` -> `prayer_requests`.
- [ ] **VERIFICAÇÃO:** Validar relacionamentos (se o `user_id` no post aponta para um perfil válido).

---

## 🧠 INTEGRAÇÃO COM OUTROS AGENTES
- **Agent Arquiteto:** Deve ser consultado para garantir que a mudança do `dbService` não viole os pilares de design e performance.
- **Agent Supabase:** Responsável pela execução direta de comandos SQL e gerenciamento da CLI.

---

## 📈 LOG DE VERIFICAÇÃO DE MIGRAÇÃO
| Data | Dataset | Status | Divergências Encontradas |
|------|---------|--------|-------------------------|
| 2026-03-05 | Schema SQL | 🟢 OK | Nenhuma |
| | | | |

---

## 🛠️ FERRAMENTAS DE APOIO
- `scripts/verify_migration.js` (A ser desenvolvido para automatizar o Checksum).
- `supabase-cli` (Para gestão de migrações e Edge Functions).
