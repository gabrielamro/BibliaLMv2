# Refatoracao Conservadora de Responsividade e Fluxo do Front

**Objetivo**

Executar uma varredura geral no front para corrigir problemas de responsividade mobile e inconsistencias de fluxo/rotas, preservando o layout visual atual e sem alterar regras de negocio.

**Escopo**

- Ajustar o shell global do app para reduzir conflitos entre header, bottom nav, barras sticky e areas de scroll.
- Consolidar padroes responsivos compartilhados usados por paginas de criacao, edicao, dashboard e listagem.
- Corrigir fluxos de navegacao quebrados ou fragilizados por aliases de rota e dependencia excessiva de `location.state`.
- Aplicar a base compartilhada nas telas criticas de criacao e edicao.
- Fazer uma passada conservadora em telas secundarias com grids, tabs horizontais e cards com largura rigida.

**Fora de escopo**

- Redesenho visual do produto.
- Mudancas de regra de negocio, dados, seguranca ou permissoes.
- Reescrita profunda das paginas em uma nova arquitetura.

**Diagnostico**

- O app usa um `Layout` global que envolve todas as paginas, inclusive builders e paginas com header proprio.
- Ha concorrencia entre elementos `sticky` e `fixed` no mobile, o que favorece sobreposicao de acao primaria, tabs e campos.
- Existem medidas fixas e `min-width` agressivos em builders, cards e grupos de tabs, causando overflow horizontal ou compressao incorreta.
- O utilitario de rota emula `react-router` sobre `next/navigation`, e parte do fluxo depende de `sessionStorage` para trafegar `state`, o que exige navegacao mais previsivel.
- Rotas e telas de criacao/edicao seguem padroes semelhantes, mas resolvem shell, foco e canvas de maneiras diferentes.

**Abordagem**

1. Refatorar a base compartilhada:
   - criar utilitarios de espacamento seguro para mobile;
   - estabilizar comportamento do `Layout` global;
   - reduzir conflitos entre header mobile, bottom nav e modo foco;
   - alinhar wrappers de largura e overflow.

2. Corrigir navegacao e fluxo:
   - consolidar aliases relevantes;
   - padronizar entradas e retornos dos fluxos de criacao/edicao;
   - manter compatibilidade com URLs existentes via redirecionamento conservador.

3. Aplicar a base nas telas criticas:
   - `PlanBuilderPage`;
   - `CreateStudyPage`;
   - `SermonBuilderPage`;
   - paginas de criacao relacionadas.

4. Fazer varredura em paginas secundarias:
   - corrigir grids fixos no mobile;
   - ajustar tabs com scroll horizontal controlado;
   - padronizar `min-w-0`, truncamento e containers.

**Criterios de sucesso**

- As principais telas de criacao e edicao devem ficar usaveis no mobile sem sobreposicao de elementos fixos.
- O app deve manter o mesmo visual geral, com mudancas apenas estruturais de espacamento, quebra de layout e fluxo.
- Rotas redundantes devem continuar funcionando ou redirecionar de forma segura.
- A base compartilhada deve reduzir a necessidade de correcoes pontuais repetidas.
