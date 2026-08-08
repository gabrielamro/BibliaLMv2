# BibliaLM v2

Santuario digital de estudo biblico com IA, construido em Next.js 16, React 18 e TypeScript.

## Stack atual

- Next.js 16
- React 18
- TypeScript
- Tailwind CSS 4
- Supabase para dados e autenticacao
- Cloudflare Workers AI como provedor server-side de texto
- Google GenAI para recursos multimodais e Groq/OpenRouter como fallbacks opcionais
- Firebase App Hosting para deploy

## Pre-requisitos

- Node.js 20
- npm

## Configuracao local

1. Instale as dependencias:
   `npm install`
2. Crie o arquivo local de ambiente:
   `Copy-Item .env.example .env.local`
3. Preencha as variaveis obrigatorias em `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
4. Os modelos padrao sao `@cf/meta/llama-3.1-8b-instruct-fast` para texto e `@cf/black-forest-labs/flux-1-schnell` para imagens. Para troca-los, defina `CLOUDFLARE_AI_MODEL` e `CLOUDFLARE_IMAGE_MODEL`.
5. Para recursos multimodais e fallbacks legados, configure quando necessario:
   - `NEXT_PUBLIC_API_KEY`
   - `NEXT_PUBLIC_GROQ_API_KEY`
   - `NEXT_PUBLIC_OPENROUTER_API_KEY`
   - `NEXT_PUBLIC_BIGPICKLE_API_KEY`
6. Rode o app:
   `npm run dev`

Aplicacao local: `http://localhost:3010`

## Scripts principais

- `npm run dev`: sobe o ambiente local
- `npm run build`: gera o build de producao
- `npm run start`: executa o build
- `npm run lint`: roda lint
- `npm run make-admin`: script utilitario de permissao
- `npm run check-profile`: script utilitario de validacao

## Variaveis de ambiente

O runtime atual usa as seguintes variaveis:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (somente servidor)
- `CLOUDFLARE_ACCOUNT_ID` (somente servidor)
- `CLOUDFLARE_API_TOKEN` (somente servidor)
- `CLOUDFLARE_AI_MODEL` (opcional)
- `CLOUDFLARE_IMAGE_MODEL` (opcional)
- `NEXT_PUBLIC_API_KEY`
- `NEXT_PUBLIC_GROQ_API_KEY`
- `NEXT_PUBLIC_OPENROUTER_API_KEY`
- `NEXT_PUBLIC_BIGPICKLE_API_KEY`
- `GEMINI_API_KEY` apenas como compatibilidade secundaria em alguns fluxos

As credenciais `SUPABASE_SERVICE_ROLE_KEY` e `CLOUDFLARE_API_TOKEN` nunca devem usar o prefixo `NEXT_PUBLIC_`. Configure-as como secrets no provedor de deploy.

## Agentes locais

A pasta `.agents/skills` contem skills locais para orientar agentes no workspace do BibliaLM. Elas nao fazem parte do runtime da aplicacao web; servem como camada de operacao para desenvolvimento, produto, pastoral e deploy.

## Deploy

O projeto esta preparado para Firebase App Hosting com runtime `nodejs20`.
