import { expect, test } from '@playwright/test';

test('empty top-level paragraphs do not break two half-width blocks into separate rows', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 20000 });

  const layout = await page.evaluate(async () => {
    const sandbox = document.createElement('div');
    sandbox.className = 'ProseMirror';
    sandbox.style.width = '1000px';
    sandbox.style.position = 'fixed';
    sandbox.style.left = '0';
    sandbox.style.top = '0';
    sandbox.style.visibility = 'hidden';
    sandbox.innerHTML = `
      <div data-type="custom-block" layoutwidth="1/2" style="height: 120px; background: rgb(240, 230, 210);"></div>
      <p><br class="ProseMirror-trailingBreak"></p>
      <div data-type="custom-block" layoutwidth="1/2" style="height: 120px; background: rgb(230, 220, 200);"></div>
    `;
    document.body.appendChild(sandbox);

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const blocks = Array.from(sandbox.children).filter(
      (child) => child instanceof HTMLElement && child.getAttribute('data-type') === 'custom-block',
    ) as HTMLElement[];
    if (blocks.length !== 2) {
      throw new Error(`Expected 2 custom blocks, found ${blocks.length}`);
    }

    const firstBox = blocks[0].getBoundingClientRect();
    const secondBox = blocks[1].getBoundingClientRect();

    const result = {
      firstTop: firstBox.top,
      secondTop: secondBox.top,
    };
    sandbox.remove();
    return result;
  });

  expect(Math.abs(layout.firstTop - layout.secondTop)).toBeLessThan(8);
});
