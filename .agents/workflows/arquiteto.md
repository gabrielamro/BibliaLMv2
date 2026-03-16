---
description: Agente Arquiteto — Auditar e proteger o sistema BíbliaLM contra alterações não autorizadas, manter release notes e commitar versões
---

# Workflow do Arquiteto BíbliaLM

## Quando usar este workflow

- Ao término de uma sessão de trabalho (salvar release + commit)
- Para auditar se alterações respeitam os pilares do sistema
- Para registrar manualmente uma mudança no changelog

---

## 1. Ler o estado atual do projeto

Antes de qualquer ação, leia os documentos mestres:

```
_ARCHITECT_AGENT.md   → Regras inegociáveis e protocolo
_RELEASENOTES.md      → Histórico de versões
```

---

## 2. Verificar o que mudou desde o último commit

```powershell
git -C "c:\Users\gabri\Downloads\biblialm" diff --name-only
```

Analisar cada arquivo alterado e classificar o tipo de mudança:
- `feat` — nova funcionalidade
- `fix` — correção de bug
- `style` — alteração visual/CSS sem lógica
- `refactor` — reorganização sem mudança de comportamento
- `chore` — configuração, infraestrutura
- `docs` — documentação

---

## 3. Atualizar o `_RELEASENOTES.md`

Adicionar **no topo** do arquivo a nova entrada seguindo o template:

```markdown
## [vX.Y.Z] - YYYY-MM-DD (Título descritivo)
### Tipo: Feature | Fix | Style | Refactor | Infrastructure
- **Resumo:** Descrição clara do que foi feito e por quê.
- **Arquivos Afetados:**
  - `views/ComponenteX.tsx` (descrição da mudança)
- **Hash Git:** (preencher após o commit)
- **Contexto Técnico:** Detalhes importantes para futuras manutenções.
```

**Convenção de versão SemVer:**
| Mudança | Versão |
|---|---|
| Novo módulo grande | MAJOR v2.0.0 |
| Feature / melhoria | MINOR v1.7.0 |
| Fix / style / ajuste | PATCH v1.6.1 |

---

## 4. Commitar as alterações com mensagem semântica

```powershell
git -C "c:\Users\gabri\Downloads\biblialm" add .
git -C "c:\Users\gabri\Downloads\biblialm" commit -m "tipo(escopo): descrição — vX.Y.Z"
```

Exemplos reais:
```
feat(devocional): fallback IA em 3 camadas — v1.6.0
fix(supabase): maybeSingle corrige erro 406 — v1.6.0
style(devocional): ajuste de espaçamentos e capitular — v1.6.2
chore(infra): git init + workflow de versão — v1.6.3
```

---

## 5. Confirmar o histórico

```powershell
git -C "c:\Users\gabri\Downloads\biblialm" log --oneline --graph
```

---

## 6. Cheklist de auditoria (opcional)

Antes de commitar, verificar:

```
[ ] Nenhum componente chama o banco diretamente (fora de services/)
[ ] Chaves de API não expostas em código client-side
[ ] Design mantém estética "papel e tinta" (dourado, couro, limpo)
[ ] Sistema de cotas de IA intacto (checkFeatureAccess presente)
[ ] Hierarquia de roles respeitada (free → bronze → silver → gold → pastor → admin)
[ ] Acessibilidade mantida (fontes legíveis, botões acessíveis)
```
