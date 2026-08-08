import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('views/MyCultosPage.tsx'), 'utf8');
const managementSource = readFileSync(resolve('services/churchManagementService.ts'), 'utf8');

test('resumo mobile ocupa uma faixa unica e revela rotulos sob demanda', () => {
  assert.match(source, /data-testid="cultos-mobile-summary"/);
  assert.match(source, /grid grid-cols-3/);
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
  assert.match(source, /churchMembership\?\.churchSlug \? `\/igreja\/\$\{churchMembership\.churchSlug\}` : '\/social\/igrejas'/);
  assert.doesNotMatch(source, /href="\/culto"/);
  assert.match(source, /Nenhum próximo culto foi publicado pela igreja/);
});

test('a página de memória não carrega mais a operação de escalas', () => {
  for (const contract of ['PersonalCultosOperations', 'listUserCultoAssignments', 'listUserTeams', 'listMemberSubmissions']) {
    assert.doesNotMatch(source, new RegExp(contract));
  }

  assert.doesNotMatch(source, /href="#escala"/);
  assert.match(source, /data-testid="my-cultos-scales-link"/);
  assert.match(source, /data-testid="my-cultos-scales-shortcut"/);
  assert.match(source, /MY_SCALES_ROUTE/);
});
