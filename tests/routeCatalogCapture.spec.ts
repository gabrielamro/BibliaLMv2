import fs from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { buildCaptureEntries, discoverAppRoutes } from '../scripts/lib/routeCatalog.mjs';

const ROOT_DIR = process.cwd();
const APP_DIR = path.join(ROOT_DIR, 'app');
const OUTPUT_ROOT = path.join(ROOT_DIR, 'docs', 'mockups', 'route-catalog');
const MANIFEST_PATH = path.join(OUTPUT_ROOT, 'manifest.json');
const REPORT_PATH = path.join(OUTPUT_ROOT, 'README.md');

const FALLBACK_PARAMS = {
  username: process.env.CATALOG_USERNAME ?? 'pastor',
  cellSlug: process.env.CATALOG_CELL_SLUG ?? 'celula-central',
  churchSlug: process.env.CATALOG_CHURCH_SLUG ?? 'igreja-central',
  planId: process.env.CATALOG_PLAN_ID ?? 'plano-demo',
  slug: process.env.CATALOG_SLUG ?? 'demo',
  token: process.env.CATALOG_TOKEN ?? 'demo-token',
  studyId: process.env.CATALOG_STUDY_ID ?? 'estudo-demo',
  postId: process.env.CATALOG_POST_ID ?? 'post-demo',
  moduleId: process.env.CATALOG_MODULE_ID ?? 'modulo-1',
  bookId: process.env.CATALOG_BOOK_ID ?? 'genesis',
};

const AUTH = {
  username: process.env.CATALOG_AUTH_USER ?? 'pastor',
  password: process.env.CATALOG_AUTH_PASSWORD ?? '123456',
};

async function collectPageFiles(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectPageFiles(fullPath, acc);
      continue;
    }

    if (entry.isFile() && entry.name === 'page.tsx') {
      acc.push(path.relative(ROOT_DIR, fullPath).replaceAll('\\', '/'));
    }
  }

  return acc;
}

async function ensureOutputDir() {
  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
}

async function attemptLogin(page: import('@playwright/test').Page) {
  try {
    await page.goto('/intro', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const loginButton = page.getByTestId('landing-login-btn').first();
    if (await loginButton.isVisible({ timeout: 5000 })) {
      await loginButton.click();
    }

    await page.getByTestId('auth-modal-heading').waitFor({ timeout: 10000 });

    const identifierInput = page.locator('input[placeholder*="e-mail"]').first();
    const passwordInput = page.locator('input[placeholder="Sua senha"]').first();

    await identifierInput.fill(AUTH.username);
    await passwordInput.fill(AUTH.password);
    await page.getByTestId('auth-submit-btn').click();
    await page.waitForTimeout(4000);

    const currentUrl = page.url();
    const headingStillVisible = await page.getByTestId('auth-modal-heading').isVisible().catch(() => false);

    return {
      success: !headingStillVisible && !currentUrl.includes('/intro'),
      currentUrl,
      headingStillVisible,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function captureRoute(page: import('@playwright/test').Page, entry: any, sessionLabel: string) {
  try {
    await page.goto(entry.materializedRoute, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    await page.screenshot({
      path: entry.screenshotPath,
      fullPage: true,
      animations: 'disabled',
    });

    return {
      ...entry,
      ok: true,
      sessionLabel,
      finalUrl: page.url(),
      title: await page.title(),
    };
  } catch (error) {
    return {
      ...entry,
      ok: false,
      sessionLabel,
      finalUrl: page.url(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildMarkdownReport(results: any[], loginResult: any) {
  const successful = results.filter((item) => item.ok);
  const failed = results.filter((item) => !item.ok);

  const lines = [
    '# Route Catalog',
    '',
    `- Total routes: \`${results.length}\``,
    `- Captured: \`${successful.length}\``,
    `- Failed: \`${failed.length}\``,
    `- Auth login: \`${loginResult.success ? 'success' : 'failed'}\``,
    '',
    '## Results',
    '',
  ];

  for (const result of results) {
    lines.push(`### ${result.materializedRoute}`);
    lines.push('');
    lines.push(`- Source: \`${result.filePath}\``);
    lines.push(`- Session: \`${result.sessionLabel}\``);
    lines.push(`- Status: \`${result.ok ? 'captured' : 'failed'}\``);
    lines.push(`- Final URL: \`${result.finalUrl ?? 'n/a'}\``);
    if (result.error) {
      lines.push(`- Error: \`${result.error}\``);
    }
    if (result.ok) {
      const relativeImage = path.relative(OUTPUT_ROOT, result.screenshotPath).replaceAll('\\', '/');
      lines.push(`- Screenshot: [${path.basename(result.screenshotPath)}](${relativeImage})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

test('capture route catalog', async ({ browser, page }) => {
  test.setTimeout(10 * 60 * 1000);

  await ensureOutputDir();

  const pageFiles = await collectPageFiles(APP_DIR);
  const routes = discoverAppRoutes(pageFiles);
  const captureEntries = buildCaptureEntries(routes, FALLBACK_PARAMS, OUTPUT_ROOT);

  const authContext = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const authPage = await authContext.newPage();
  const loginResult = await attemptLogin(authPage);
  const results = [];

  for (const entry of captureEntries) {
    const useAuth = entry.requiresAuth && loginResult.success;
    const activePage = useAuth ? authPage : page;
    const sessionLabel = useAuth ? 'auth' : 'public';
    const result = await captureRoute(activePage, entry, sessionLabel);
    results.push(result);
    console.log(`${result.ok ? 'OK' : 'FAIL'} ${entry.materializedRoute}`);
  }

  await fs.writeFile(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        loginResult,
        routes: results,
      },
      null,
      2,
    ),
    'utf8',
  );

  await fs.writeFile(REPORT_PATH, buildMarkdownReport(results, loginResult), 'utf8');

  await authContext.close();

  expect(results.filter((item) => item.ok).length).toBeGreaterThan(0);
});
