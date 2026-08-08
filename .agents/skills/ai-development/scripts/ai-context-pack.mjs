#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : ''; };
const task = value('--task') || 'general';
const route = value('--route');
const root = process.cwd();
const common = ['_ARCHITECT_AGENT.md', '_PROJECT_CONTEXT.md', 'types.ts', 'constants.ts', 'package.json'];
const byTask = { frontend: ['moduleThemes.ts', 'components/CultoPlusPageShell.tsx', 'app/globals.css'], supabase: ['services/supabase.ts'], api: ['services/retryWithBackoff.ts'], bug: [], general: [] };
const files = [...common, ...(byTask[task] ?? [])].filter((file) => existsSync(path.join(root, file)));
console.log(JSON.stringify({ task, route: route || null, purpose: 'minimal-context-pack', files, guidance: ['Read only relevant sections.', 'Use rg before opening large files.', 'Run ai-diff-guard before expensive validation.'] }, null, 2));
