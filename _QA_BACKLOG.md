# 📋 Backlog de QA - BíbliaLM

Gerado em: 12/03/2026, 15:46:36

## ⚠️ Status Geral: PROBLEMAS ENCONTRADOS

Alguns fluxos falharam e requerem atenção.

### 🚨 Problemas Identificados
- **Autenticação**: Falha no fluxo de cadastro ou login.
- **Funcionalidades**: Problemas detectados na Bíblia ou Chat.

### 📝 Log de Erro Técnico
```

Running 5 tests using 3 workers

  ok 2 [chromium] › tests\auth.spec.ts:61:3 › Authentication Flow › should login with the created user (5.0s)
  x  3 [chromium] › tests\features.spec.ts:49:3 › Core Features › should browse the Bible and see verses (23.9s)
  -  4 [chromium] › tests\features.spec.ts:60:3 › Core Features › should interact with AI Chat (Obreiro IA)
  -  5 [chromium] › tests\features.spec.ts:74:3 › Core Features › should view the social feed
  x  1 [chromium] › tests\auth.spec.ts:13:3 › Authentication Flow › should register a new user (30.6s)


  1) [chromium] › tests\auth.spec.ts:13:3 › Authentication Flow › should register a new user ───────

    [31mTest timeout of 30000ms exceeded.[39m

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
    [2m  - waiting for getByRole('button', { name: 'Cadastrar', exact: true })[22m
    [2m    - locator resolved to <button type="submit" class="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">Cadastrar</button>[22m
    [2m  - attempting click action[22m
    [2m    - waiting for element to be visible, enabled and stable[22m
    [2m  - element was detached from the DOM, retrying[22m


      51 |     // Submit - Use exact match to avoid ambiguity with "Entrar" or others
      52 |     const cadastrarBtn = page.getByRole('button', { name: 'Cadastrar', exact: true });
    > 53 |     await cadastrarBtn.click();
         |                        ^
      54 |
      55 |     // Verification: Wait for navigation or modal to close
      56 |     await expect(page).toHaveURL(/.*localhost:3010\//, { timeout: 15000 });
        at C:\Users\gabri\Downloads\biblialm\tests\auth.spec.ts:53:24

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results\auth-Authentication-Flow-should-register-a-new-user-chromium\test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results\auth-Authentication-Flow-should-register-a-new-user-chromium\error-context.md

  2) [chromium] › tests\features.spec.ts:49:3 › Core Features › should browse the Bible and see verses 

    Error: [2mexpect([22m[31mlocator[39m[2m).not.[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator:  getByRole('button', { name: 'Entrar', exact: true }).first()
    Expected: not visible
    Received: visible
    Timeout:  15000ms

    Call log:
    [2m  - Expect "not toBeVisible" with timeout 15000ms[22m
    [2m  - waiting for getByRole('button', { name: 'Entrar', exact: true }).first()[22m
    [2m    18 × locator resolved to <button class="bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-bible-gold dark:hover:bg-gray-200 transition-all shadow-lg flex items-center gap-2">…</button>[22m
    [2m       - unexpected value "visible"[22m


      36 |                 
      37 |                 // Wait for modal to disappear and redirect to '/' to settle
    > 38 |                 await expect(enterBtn).not.toBeVisible({ timeout: 15000 });
         |                                            ^
      39 |                 await page.waitForURL('**/', { timeout: 15000 });
      40 |                 await page.waitForLoadState('networkidle');
      41 |             }
        at C:\Users\gabri\Downloads\biblialm\tests\features.spec.ts:38:44

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results\features-Core-Features-sho-41901-se-the-Bible-and-see-verses-chromium\test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results\features-Core-Features-sho-41901-se-the-Bible-and-see-verses-chromium\error-context.md

  2 failed
    [chromium] › tests\auth.spec.ts:13:3 › Authentication Flow › should register a new user ────────
    [chromium] › tests\features.spec.ts:49:3 › Core Features › should browse the Bible and see verses 
  2 did not run
  1 passed (44.3s)

```
