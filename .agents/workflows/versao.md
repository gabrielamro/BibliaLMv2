---
description: Controle de versão Git — salvar, listar e restaurar versões do BíbliaLM
---

# Workflow de Controle de Versão

## 1. Salvar a versão atual (checkpoint)

Sempre que uma funcionalidade ou ajuste visual estiver pronto e funcionando, salve uma versão:

```powershell
git -C "c:\Users\gabri\Downloads\biblialm" add .
git -C "c:\Users\gabri\Downloads\biblialm" commit -m "feat: descrição do que foi feito"
```

Exemplos de mensagens de commit:
- `feat: pão diário com fallback de IA`
- `fix: corrigido tamanho das fontes da DevotionalPage`
- `style: ajuste de espaçamentos e first-letter capitular`
- `chore: atualizado .gitignore`

---

## 2. Ver o histórico de versões

```powershell
git -C "c:\Users\gabri\Downloads\biblialm" log --oneline --graph
```

---

## 3. Ver o que mudou desde o último commit

```powershell
git -C "c:\Users\gabri\Downloads\biblialm" diff
```

Ver apenas quais arquivos mudaram:
```powershell
git -C "c:\Users\gabri\Downloads\biblialm" diff --name-only
```

---

## 4. Restaurar um arquivo para a versão de um commit anterior

Se um arquivo específico foi alterado e precisa ser revertido:

```powershell
# 1. Liste os commits para pegar o hash
git -C "c:\Users\gabri\Downloads\biblialm" log --oneline

# 2. Restaure o arquivo para a versão do commit desejado (ex: abc1234)
git -C "c:\Users\gabri\Downloads\biblialm" checkout abc1234 -- views/DevotionalPage.tsx
```

---

## 5. Desfazer TODAS as mudanças não salvas

Se algo quebrou e você quer voltar ao último commit salvo:

```powershell
git -C "c:\Users\gabri\Downloads\biblialm" checkout -- .
```

> ⚠️ Isso descarta TODAS as alterações não commitadas. Use com cuidado.

---

## 6. Criar uma "branch" para testar algo novo sem risco

```powershell
# Criar e entrar na nova branch
git -C "c:\Users\gabri\Downloads\biblialm" checkout -b feature/nome-da-feature

# Voltar para a branch principal
git -C "c:\Users\gabri\Downloads\biblialm" checkout main

# Mesclar a branch se ficou bom
git -C "c:\Users\gabri\Downloads\biblialm" merge feature/nome-da-feature
```

---

## 7. Ver status atual

```powershell
git -C "c:\Users\gabri\Downloads\biblialm" status
```
