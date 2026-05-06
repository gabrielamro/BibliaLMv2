import test from 'node:test';
import * as assert from 'node:assert/strict';

import { fitTextLinesToBox } from '../utils/imageCompositor.ts';

const makeMeasureContext = () => {
  let fontSize = 48;
  return {
    get font() {
      return `${fontSize}px serif`;
    },
    set font(value: string) {
      fontSize = Number(value.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? fontSize);
    },
    measureText(text: string) {
      return { width: text.length * fontSize * 0.55 };
    },
  } as unknown as CanvasRenderingContext2D;
};

test('fits long verse text within the available image box', () => {
  const ctx = makeMeasureContext();
  ctx.font = 'bold 48px serif';

  const fit = fitTextLinesToBox(ctx, {
    text: '"Ele estava no princípio com Deus. Todas as coisas foram feitas por intermédio dele, e sem ele nada do que foi feito se fez."',
    maxWidth: 620,
    maxHeight: 260,
    initialFontSize: 48,
    minFontSize: 24,
    lineHeightMultiplier: 1.22,
    applyFontSize: (size) => {
      ctx.font = `bold ${size}px serif`;
    },
  });

  assert.ok(fit.fontSize <= 48);
  assert.ok(fit.lines.length > 1);
  assert.ok(fit.blockHeight <= 260);
  for (const line of fit.lines) {
    assert.ok(ctx.measureText(line).width <= 620);
  }
});
