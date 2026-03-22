# Plano de Implementacao: Inicio03 como Home Real

Data: 2026-03-18

Objetivo:
Substituir a Home autenticada atual pelo `inicio03`, conectando a nova experiencia a dados e fluxos reais do BibliaLM sem duplicar o topo global e sem manter promessas falsas na UI.

Escopo confirmado:
- O `/` autenticado passa a usar `Inicio03`
- O topo compartilhado do `Layout` deixa de aparecer na Home para o `inicio03` assumir esse papel
- Avatar, perfil, notificacoes, busca, configuracoes, mana, progresso, Pao Diario, jornadas/salas e CTAs precisam refletir o sistema real
- Tudo que aparecer na Home deve existir de fato; se nao existir, precisa ser removido, adaptado ou implementado

Arquivos principais:
- `app/page.tsx`
- `views/Inicio03.tsx`
- `components/Layout.tsx`
- `hooks/useWisdomStream.ts`
- `services/supabase.ts`
- `components/HomeDashboard.tsx`

Plano em etapas:

1. Migracao estrutural
- Trocar a Home autenticada do `/` para `Inicio03`
- Preservar o redirecionamento para `/intro` quando nao houver usuario

2. Shell e topo
- Ajustar `Layout` para ocultar o header global apenas no `/`
- Manter sidebar, dropdowns, modais e infraestrutura global funcionando

3. Dados reais no Inicio03
- Trocar mocks de usuario por `useAuth`
- Alimentar mana com `userProfile.lifetimeXp`
- Alimentar streak e progresso com `useWisdomStream`
- Resolver versiculo e Pao Diario do dia com fontes reais
- Carregar planos/salas do pastor via `getUserCustomPlans`

4. Integracoes do topo
- Avatar abre `/perfil`
- Busca abre `OmniSearch`
- Sino abre painel de notificacoes
- Engrenagem abre menu de configuracoes/atalhos reais
- Icone de mana leva ao manual/sistema correspondente

5. Honestidade funcional da UI
- Mapear cada CTA do `inicio03`
- Conectar o que ja existe
- Ajustar ou remover o que estava apenas mockado
- Manter destaque para IA, continuidade, comunidade e pastoral por intencao de uso

6. Validacao final
- Conferir experiencia mobile e desktop
- Conferir diferencas entre usuario comum e pastor
- Conferir ausencia de header duplicado
- Executar verificacoes locais viaveis

Riscos conhecidos:
- Parte das experiencias sociais e de jornadas ainda nao tem backend completo
- Alguns blocos do mock precisarao ser adaptados para preview honesto ou redirecionamento real
- A Home atual usa contratos reais menores do que os prometidos visualmente no mock
