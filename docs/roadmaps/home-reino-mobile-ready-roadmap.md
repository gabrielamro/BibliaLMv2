# Roadmap Home Reino Mobile Ready

## Objetivo

Organizar a aba Reino da Home em secoes reaproveitaveis para Web agora e para um futuro app iOS/Android com React Native + Expo.

## Fase 1 - Home Web

- Trocar "Notificacoes Sociais" por "Mencoes".
- Mostrar no CTA apenas notificacoes em que o usuario foi mencionado com `@usuario`, marcado ou vinculado a uma postagem de mencao.
- Criar "Seu Feed" com postagens em evidencia, ordenadas por engajamento.
- Criar "Sua Igreja" mostrando apenas posts da igreja do usuario.
- Criar CTA "Grupos" com uma entrada para cada grupo do usuario.
- Limitar cada secao de posts a 3 itens.
- Renderizar posts em grid de 3 por linha no desktop, mantendo o layout principal atual.

## Fase 2 - Reuso Mobile

- Manter regras em `utils/kingdomHomeFeed.ts`, sem acoplar filtros ao componente.
- Manter carregamento em `hooks/useKingdomFeed.ts`, reaproveitavel como base para hooks de React Native.
- Compartilhar `types.ts` e a camada `services/supabase.ts` entre Web e app Expo.

## Fase 3 - App iOS/Android

- Criar app Expo com TypeScript.
- Reaproveitar tipos, Supabase auth e filtros da Home Reino.
- Recriar apenas componentes visuais em React Native.
- Validar notificacoes push para mencoes e marcacoes.
