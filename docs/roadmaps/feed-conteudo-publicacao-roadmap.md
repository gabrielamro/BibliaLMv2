# Roadmap — Conteúdo do ecossistema no Feed

## Objetivo

Transformar ações relevantes do Culto+ em publicações úteis no Reino sem publicar automaticamente, duplicar conteúdo ou expor audiências restritas.

## Entregue na v2.6.0

- Contrato central `kingdomPublishingService`.
- Origem (`source_type`/`source_id`), metadados estruturados e deduplicação.
- RLS por público, seguidores, igreja, grupo, privado e proprietário.
- Quiz funcional com card de pontuação e retorno destacado ao Feed.
- Pão Diário integrado ao contrato central.
- Oração, reflexão, sentimento e check-in integrados ao mesmo contrato.
- Card específico para check-in.
- Criação retorna o registro persistido; edição e exclusão propagam erros.

## Próxima onda

1. Adicionar prévia reutilizável antes de publicar resultados, planos e marcos.
2. Oferecer compartilhamento opcional ao concluir plano de leitura, meta diária e sequência.
3. Publicar eventos de culto: check-in oficial, resumo, testemunho e escala concluída.
4. Levar orações atendidas ao Feed com consentimento e sem expor o pedido original.
5. Adicionar cards para podcast, convite de sala e encontro de célula.
6. Criar painel de saúde com origem, falha, duplicação, publicação e engajamento.

## Critérios permanentes

- Nunca publicar sem ação explícita do usuário.
- Nunca usar `user_metadata` como autorização.
- Toda audiência deve ser validada no banco por RLS.
- Todo produtor deve usar o contrato central e receber o ID criado.
- Cards devem tolerar dados legados sem quebrar o Feed.
