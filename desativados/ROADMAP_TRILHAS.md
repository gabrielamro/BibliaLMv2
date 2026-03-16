# Roadmap: Evolução do Sistema de Trilhas Bíblicas (TrackReader 2.0)

Este documento centraliza as estratégias, melhorias de código e novas funcionalidades para tornar a funcionalidade de "Trilhas de Leitura Guiadas" o mais terapêutica, funcional e polida possível.

## Fase 1: Fundação Terapêutica & Correção de Fluxo (Atual - CPO) ✅
- [x] O usuário é levado da galeria de trilhas (`TracksPage`) diretamente para um ambiente contido e focado (`TrackReaderPage`).
- [x] Eliminar redirecionamentos duros que lançam o usuário direto na parte genérica do app (`/biblia`).
- [x] Implementação de visualização "Passo a Passo" na tela da Trilha.
- [x] Ajuste do Prompt da IA (`geminiService.ts`) para forçar Capítulos e Livros únicos por passo, exterminando os textos duplicados nas trilhas sequenciais.
- [x] Orientada a IA a expor, no devocional da trilha, uma explicação prática de *como os versículos referentes a este passo específico vão lhe ajudar*.
- [x] Botão final do último passo mudado para "Concluir" em vez de "Próximo". Voltar à galeria após conclusão.

## Fase 2: Imersão e Gamificação (Próximo Passo - CTO / Engenharia) 🚀
- [ ] **Integração com Gamificação:** 
   - Ao clicar em "Concluir" no último passo da trilha, disparar a engine de Gamificação (`useAuth().addExperience()` ou equivalente) para conferir Maná e/ou a Badge de "Trilha Concluída".
   - Atualmente a trilha volta para a Home/Galeria, mas não recompensa o esforço.
- [ ] **Histórico e Persistência de Leitura:**
   - Salvar no banco (Supabase) quais passos da trilha já foram completados, para que o usuário não necessite fechar a trilha de uma única vez.
   - Atualizar interface na `TracksPage` para exibir marcadores "Em andamento: 3/5 passos".
- [ ] **Mídia e Áudio:**
   - Aproveitar os créditos de "Podcasts/TTS" (Text to Speech) para gerar um botão de Play no Devocional de cada Passo. (Voice-over automático de consolação usando TTS do Edge ou API similar).
   - Injetar música clássica/lofi ambiente opcional que toca em loop leve no fundo apenas durante o uso da trilha interativa (`TrackReaderPage`). O "Modo Santuário".

## Fase 3: Comunidade Pastoral 👨‍💼
- [ ] **Criação de Trilhas Pastorais (Pastoral Workspace):**
   - Permitir que autoridades e pastores desenhem as Trilhas Guiadas manualmente e enviem para a igreja.
   - Possibilitar a anexação de vídeos curtos do Púlpito em determinados `steps` da trilha.

## Teste Integrado QA
1. **Verificação de Duplicação:** Gerar trilha com "Ansiedade" e verificar na UI e na Console se há IDs e capítulos perfeitamente diferentes em 1 a 5.
2. **Crash/Boundary Test:** Usar um ID de livro inexistente ou capítulo inválido (`/trilhas/abc`) para confirmar se o Error State está contendo o app para evitar freeze do cliente.
3. **Responsive Display:** Validar botões flutuantes Next/Prev rodando nativamente no limite inferior de browsers de telas Edge-to-Edge no Mobile (Safari Bottom / Android Navbar).
