import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('views/MyCultosPage.tsx'), 'utf8');
const managementSource = readFileSync(resolve('services/churchManagementService.ts'), 'utf8');

test('resumo mobile ocupa uma faixa unica e revela rotulos sob demanda', () => {
  assert.match(source, /data-testid="cultos-mobile-summary"/);
  assert.match(source, /grid grid-cols-5/);
  assert.match(source, /sm:hidden/);
  assert.match(source, /aria-label={`\$\{summary\.label\}: \$\{summary\.value\}`}/);
  assert.match(source, /aria-expanded={isOpen}/);
  assert.match(source, /role="tooltip"/);
  assert.match(source, /group-hover:block/);
  assert.match(source, /group-focus-visible:block/);
  assert.match(source, /onClick=\{\(\) => setActiveSummaryLabel/);
});

test('agenda carrega proximos cultos publicados da igreja com estados reais', () => {
  assert.match(source, /getUserChurchMembership\(userId\)/);
  assert.match(managementSource, /from\('memberships'\)/);
  assert.match(managementSource, /eq\('user_id', userId\)/);
  assert.match(source, /getServicesByChurchRange/);
  assert.match(source, /status: \['published', 'checkin_open', 'live', 'in_progress'\]/);
  assert.match(source, /rangeEnd\.setDate\(rangeEnd\.getDate\(\) \+ 60\)/);
  assert.match(source, /limit: 1/);
  assert.match(source, /data-testid="upcoming-church-services"/);
  assert.match(source, /Próximo culto da sua igreja/);
  assert.match(source, /data-testid="next-church-service"/);
  assert.match(source, /href={`\/culto\/\$\{nextChurchService\.slug\}`}/);
  assert.match(source, /Ver mais cultos/);
  assert.match(source, /Nenhum próximo culto foi publicado pela igreja/);
});
