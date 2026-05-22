# Culto+ - Manual de Utilizacao

## Visao Geral

O Culto+ e a funcionalidade de acompanhamento digital do culto no BibliaLM.

Com ele, a igreja pode:

- Criar cultos com tema, pastor, data, horario, banner e versiculo-chave.
- Montar a timeline liturgica do culto.
- Publicar uma OnePage publica para membros e visitantes.
- Permitir check-in, anotacoes privadas, reacoes, pedidos de oracao e posts no feed.
- Gerenciar ministerios e escalas.
- Controlar o modo Culto Ao Vivo.
- Usar IA Crista como apoio pastoral e devocional.
- Acompanhar analytics e exportar relatorios.

## 1. Preparacao Inicial

Antes de usar em producao, aplique o schema do Supabase:

1. Abra o painel do Supabase.
2. Entre em SQL Editor.
3. Rode o conteudo de `scripts/create_culto_plus.sql`.
4. Confirme que as tabelas foram criadas.
5. Teste com pelo menos um usuario gestor e um usuario membro.

Tabelas principais criadas:

- `church_services`
- `service_checkins`
- `service_visits`
- `service_notes`
- `service_reactions`
- `service_prayer_requests`
- `service_prayer_intercessions`
- `service_verse_saves`
- `service_ministries`
- `service_ministry_members`
- `service_schedule_assignments`
- `service_live_states`
- `service_ai_contents`

Observacao: o app tem fallback local em `localStorage`, mas a persistencia compartilhada entre usuarios depende do Supabase.

## 2. Acesso do Pastor ou Gestor

O gestor acessa o Culto+ pelo Workspace Pastoral.

Caminho esperado:

1. Entrar no BibliaLM com uma conta vinculada a uma igreja.
2. Acessar `Workspace Pastoral`.
3. Abrir a area `Culto+` ou `Acompanhamento de Culto`.
4. Clicar em `Novo culto`.

Se o perfil nao estiver vinculado a uma igreja, o app bloqueia a criacao e mostra um aviso.

## 3. Criar um Culto

Ao criar um culto, preencha:

- Nome do culto.
- Tipo do culto.
- Status.
- Tema da mensagem.
- Pastor responsavel.
- Banner por URL ou upload.
- Horario de inicio.
- Horario final.
- Versiculo-chave.
- Texto do versiculo.

Tipos disponiveis:

- Domingo
- Jovens
- Mulheres
- Celula
- Conferencia
- Vigilia
- Santa Ceia
- Outro

Status disponiveis:

- `Rascunho`: visivel para gestao.
- `Publicado`: aparece na pagina publica.
- `Ao vivo`: ativa a experiencia de culto em tempo real.
- `Encerrado`: culto finalizado, mas ainda acessivel.

Depois de preencher, clique em `Publicar OnePage`.

## 4. Montar a Timeline Liturgica

A timeline e o roteiro do culto.

Etapas padrao:

- Liturgia de Entrada.
- Abertura.
- Adoracao e Louvor.
- Liturgia da Palavra.
- Dizimo / Oferta / Resposta.
- Encerramento.

Para cada etapa, o gestor pode definir:

- Horario.
- Nome da etapa.
- Responsavel.
- Observacoes.

Exemplos de observacoes:

- Musicas.
- Tom.
- Links de slides.
- QR Code PIX.
- Avisos.
- Texto biblico.
- Instrucao para equipe.

Use os botoes de seta para reorganizar as etapas.

## 5. OnePage do Culto

Cada culto publicado gera uma pagina publica:

`/culto/[serviceSlug]`

Nessa pagina, o membro ou visitante ve:

- Banner do culto.
- Nome e tema.
- Data e horario.
- Igreja.
- Versiculo-chave.
- Status do culto.
- Timeline liturgica.
- Momento atual.
- QR de check-in.

A pagina tambem aparece na pagina publica da igreja:

- Bloco de proximos cultos.
- Aba `Cultos`.
- Ultimos posts vinculados ao culto, quando houver.

## 6. Check-in

O check-in exige login.

Fluxo:

1. Membro abre a OnePage.
2. Clica em `Fazer check-in`.
3. O app registra a presenca.
4. O gestor ve o total no painel do culto.

Tambem existe QR Code de check-in:

1. Gestor baixa ou exibe o QR.
2. Membro aponta a camera.
3. O link abre com `?checkin=1`.
4. Se estiver logado, o check-in e iniciado.
5. Se nao estiver logado, o app solicita login.

O sistema evita check-in duplicado por usuario no mesmo culto.

## 7. Visitas

Toda abertura da OnePage registra uma visita unica por sessao.

Essa contagem:

- Nao exige login.
- Usa identificador de sessao.
- Ajuda o gestor a comparar visitantes e check-ins.

## 8. Anotacoes do Sermon

O membro logado pode criar anotacoes privadas.

Fluxo:

1. Abrir a OnePage.
2. Escrever em `Minhas anotacoes`.
3. Clicar em `Salvar anotacao`.

As anotacoes:

- Sao privadas por usuario.
- Entram apenas como contagem agregada no painel.
- Nao aparecem para o gestor em texto aberto.

## 9. Reacoes do Culto

O membro logado pode reagir com:

- Amem.
- Gloria.
- Aleluia.

As reacoes aparecem como contadores na OnePage e no painel.

Durante o culto ao vivo, esses dados sao atualizados periodicamente.

## 10. Feed do Culto

O membro pode postar sobre o culto.

Exemplos:

- Frase da pregacao.
- Testemunho.
- Reflexao.
- Palavra recebida.

Ao publicar:

- O post fica vinculado ao culto por `service_id`.
- O post aparece no feed do culto.
- O post tambem aparece no contexto da igreja.
- O card pode mostrar selo `Culto+`.

## 11. Pedidos de Oracao

Na OnePage, o membro logado pode enviar pedido de oracao.

Tipos:

- Publico: aparece na OnePage.
- Privado: fica restrito pela regra de acesso definida no banco.

Outros membros podem clicar em `Estou orando`.

O sistema registra:

- Pedido.
- Culto.
- Igreja.
- Autor.
- Quantidade de intercessores.

## 12. Versiculo-chave

Se o culto tiver versiculo-chave, o membro pode salva-lo.

Fluxo:

1. Abrir a OnePage.
2. Ir ao bloco `Versiculo-chave`.
3. Clicar em `Salvar versiculo`.

O gestor ve a quantidade agregada de versiculos salvos.

## 13. Ministerios

No painel do culto, o gestor pode criar ministerios.

Exemplos:

- Louvor.
- Midia.
- Recepcao.
- Intercessao.
- Infantil.
- Jovens.
- Danca.

Para criar:

1. Abrir o painel do culto.
2. Ir em `Escalas e ministerios`.
3. Preencher `Novo ministerio`.
4. Clicar em `Criar ministerio`.

## 14. Vincular Membros a Ministerios

Depois de criar ministerios, vincule membros.

Fluxo:

1. Selecionar o ministerio.
2. Selecionar o membro.
3. Informar funcao opcional.
4. Clicar em `Vincular`.

Exemplos de funcao:

- Vocal.
- Violao.
- Camera.
- Projecao.
- Recepcao porta principal.

## 15. Escalas por Culto

Para criar uma escala:

1. Abrir o painel de um culto.
2. Selecionar ministerio.
3. Selecionar membro.
4. Informar funcao naquele culto.
5. Clicar em `Criar escala`.

Cada escala pode ter status:

- Pendente.
- Confirmado.
- Recusado.
- Substituido.

Acoes disponiveis:

- Confirmar.
- Recusar.
- Registrar lembrete.
- Escolher substituto.

## 16. Culto Ao Vivo

O modo Culto Ao Vivo permite que o operador sincronize a OnePage dos membros.

Fluxo do operador:

1. Abrir o painel do culto.
2. Ir em `Culto ao vivo`.
3. Preencher:
   - Versiculo atual.
   - Texto biblico.
   - Explicacao pastoral breve.
4. Clicar na etapa da timeline que deve ser enviada.

Quando isso acontece:

- O culto muda para status `Ao vivo`, se ainda nao estiver.
- A tabela `service_live_states` e atualizada.
- A OnePage busca o estado ao vivo periodicamente.
- O membro ve a etapa atual, versiculo e explicacao.

Uso recomendado:

- Avancar uma etapa por vez.
- Usar explicacoes curtas.
- Evitar textos longos durante o culto.
- Conferir se a OnePage esta atualizando em um celular real.

## 17. IA Crista

A IA Crista e um apoio, nao substitui a direcao pastoral.

Para membros, gera:

- Resumo do sermão.
- Devocional baseado na mensagem.
- Oracao baseada na pregacao.
- Plano semanal.
- Perguntas para reflexao.

Para pastor, gera:

- Estrutura de culto.
- Sugestao de liturgia.
- Sugestao de versiculos.
- Estimativa de duracao.
- Resumo pos-culto.

Controle de acesso:

- Toda chamada passa por `checkFeatureAccess('aiSermonBuilder')`.
- O uso incrementa contagem de `analysis`.
- Se a IA externa falhar, o sistema retorna um fallback pastoral basico.

Boa pratica:

- Revisar todo conteudo antes de publicar.
- Diferenciar resumo, interpretacao e aplicacao.
- Nao tratar a IA como autoridade doutrinaria.

## 18. Analytics

O painel do culto mostra:

- Visitantes.
- Check-ins.
- Posts.
- Anotacoes privadas agregadas.
- Pedidos de oracao.
- Versiculos salvos.
- Reacoes.
- Escalas.
- Pendencias.
- Taxa de engajamento.

A taxa de engajamento compara a quantidade de interacoes com as visitas registradas.

## 19. Exportacao CSV

O gestor pode exportar relatorio CSV do culto.

Fluxo:

1. Abrir o painel do culto.
2. Ir em `Analytics avancado`.
3. Clicar em `Exportar CSV`.

O CSV inclui:

- Dados do culto.
- Igreja.
- Tema.
- Inicio.
- Visitantes.
- Check-ins.
- Posts.
- Anotacoes.
- Pedidos de oracao.
- Versiculos salvos.
- Reacoes por tipo.
- Escalas.
- Pendencias.
- Engajamento percentual.

## 20. Premium e Limites

O Culto+ possui matriz de recursos por plano.

Plano gratuito:

- Limite mensal de cultos.
- Recursos basicos.

Planos superiores:

- Mais cultos ou ilimitado.
- IA.
- Escalas.
- QR avancado.
- Branding.
- Exportacoes.
- Analytics avancado.

O painel mostra:

- Nome do plano.
- Quantidade de cultos usados no mes.
- Limite mensal.
- Recursos ativos.

## 21. Pagina da Igreja

Na pagina publica da igreja, o Culto+ adiciona:

- Bloco `Proximos Cultos`.
- CTA para participar.
- Aba `Cultos`.
- Destaque para culto ao vivo.
- Historico simples.
- Ultimos posts vinculados ao culto.

Isso ajuda o membro a encontrar o proximo culto em poucos cliques.

## 22. Checklist de Uso no Domingo

Antes do culto:

- Criar culto.
- Conferir data e horario.
- Conferir banner.
- Conferir versiculo-chave.
- Conferir timeline.
- Criar escalas.
- Enviar lembretes.
- Testar QR Code.
- Abrir a OnePage em um celular.

Durante o culto:

- Colocar status `Ao vivo`.
- Avancar etapas no painel.
- Enviar Momento da Palavra.
- Monitorar check-ins.
- Acompanhar reacoes.

Depois do culto:

- Encerrar status.
- Ver analytics.
- Exportar CSV.
- Gerar resumo pos-culto com IA.
- Ver posts vinculados.
- Acompanhar pedidos de oracao.

## 23. Problemas Comuns

### O culto nao aparece na pagina da igreja

Verifique:

- Se o status esta `Publicado` ou `Ao vivo`.
- Se o culto esta vinculado ao `church_id` correto.
- Se o script SQL foi aplicado.
- Se a pagina da igreja foi recarregada.

### Check-in nao registra

Verifique:

- Se o usuario esta logado.
- Se o usuario ja fez check-in nesse culto.
- Se `service_checkins` existe no Supabase.
- Se RLS permite insert para o proprio usuario.

### OnePage nao sincroniza ao vivo

Verifique:

- Se o operador clicou em uma etapa.
- Se existe registro em `service_live_states`.
- Se o status do culto esta `Ao vivo`.
- Se a pagina do membro foi mantida aberta por alguns segundos.

### IA nao gera conteudo

Verifique:

- Se o usuario tem acesso a `aiSermonBuilder`.
- Se a integracao de IA esta disponivel.
- Se a cota de uso nao foi excedida.
- Se o fallback apareceu no lugar da resposta externa.

### Escalas nao aparecem

Verifique:

- Se existem ministerios.
- Se ha membros vinculados a igreja.
- Se `service_schedule_assignments` existe.
- Se o painel aberto corresponde ao culto certo.

## 24. Arquivos Tecnicos Relacionados

- `components/culto-plus/CultoPlusManager.tsx`
- `components/culto-plus/CultoPlusOnePage.tsx`
- `components/culto-plus/ChurchServicesPreview.tsx`
- `services/cultoPlusService.ts`
- `scripts/create_culto_plus.sql`
- `views/public/ChurchProfilePage.tsx`
- `components/social/FeedPostCard.tsx`
- `types.ts`

## 25. Recomendacao de Operacao

Para usar com seguranca em uma igreja real:

1. Comece com um culto de teste.
2. Use uma igreja de homologacao.
3. Teste com tres perfis:
   - Pastor/gestor.
   - Membro logado.
   - Visitante sem login.
4. Valide check-in, anotacoes, feed e pedidos de oracao.
5. Rode o culto ao vivo com um celular aberto como membro.
6. Somente depois use no culto oficial.

