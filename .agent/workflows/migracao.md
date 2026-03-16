---
description: Auxiliar na migração do Firebase para o Supabase com testes e verificações
---

Este workflow guia a migração segura, garantindo que nenhum dado seja perdido.

### 1. Verificar Status Inicial
// turbo
1. Verifique se as variáveis de ambiente do Supabase estão configuradas:
   `Get-Content .env`

2. Liste os arquivos de serviço atuais para identificar dependências de Firebase:
   `ls services/`

### 2. Preparar o Schema
1. Abra o [DEPLOYMENT.md](file:///c:/Users/gabri/Downloads/biblialm/DEPLOYMENT.md) e copie o SQL da Seção 2.
2. Execute o SQL no Editor SQL do Supabase.

### 3. Migrar Dados da Bíblia
// turbo
1. Gere o JSON da Bíblia:
   `node scripts/generate_full_bible.js`

2. (Em breve) Execute o script de seed:
   `node scripts/seed_supabase.js`

### 4. Auditoria de Dados
Este passo é crucial para garantir que nada ficou de fora.

1. Execute o script de verificação (a ser criado):
   `node scripts/verify_migration.js`

2. Compare as contagens de registros entre Firebase e Supabase.

### 5. Atualizar Código Frontend
1. Migrar `services/firebase.ts` para usar o Agente Supabase ou a nova lib.
2. Atualizar o `_ARCHITECT_AGENT.md` para refletir o novo Backend.

---
**Dica:** Sempre execute `node scripts/verify_migration.js` após migrar cada coleção (users, posts, etc).
