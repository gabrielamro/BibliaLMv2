# Massa QA completa do Culto+

O gerador `scripts/seed_full_qa_fixture.mjs` cria um cenário isolado e repetível para validar o ecossistema sem depender de dados pessoais reais.

## Personas

| Persona | Cobertura esperada |
| --- | --- |
| Membro | Bíblia, conteúdo pessoal, igreja, solicitações e escala própria |
| Pastor | Minha visão e Workspace Pastoral, sem acesso operacional automático |
| Gestor | Minha visão e Gestão da Igreja, aprovações, equipes, cultos e permissões |
| Líder | Liderança e voluntariado somente no time concedido |
| Visitante | Minha visão, segue a igreja, mas não possui vínculo de membro |

As senhas não são versionadas. O comando de criação gera ou reutiliza o arquivo local ignorado `.qa-fixture.local.json`.

## Comandos

```bash
npm run qa:plan
npm run qa:seed
npm run qa:validate
npm run qa:cleanup
```

`qa:seed` é idempotente: atualiza as cinco contas com IDs fixos, recria apenas os dados marcados da massa e valida os logins ao final.

## Cobertura funcional

- Igreja, vínculo de membro, seguidor externo e célula.
- Gestor, pastor, líder, voluntário e estados pausado/revogado.
- Três equipes, nove funções e equipe sem liderança.
- Oito cultos em preparação, sem equipe, aguardando voluntários, aguardando confirmação, check-in, ao vivo, concluído e arquivado.
- Designações, vagas, convites e participações em todos os estados aceitos pelo banco.
- Seis tipos de formulário QR e solicitações em todos os estados do inbox.
- Candidaturas de voluntariado pendente, aprovada e recusada com nova tentativa.
- Notificações não lidas, lidas, descartadas e eventos operacionais.
- Bíblia, notas, oração, estudo, plano, quiz, Maná e insígnia.
- Os onze tipos de conteúdo do Reino nas cinco visibilidades.

Todos os registros da massa usam IDs determinísticos, prefixo `[QA]` ou a chave `cultoplus_full_qa_v1`, permitindo auditoria e remoção segura.
