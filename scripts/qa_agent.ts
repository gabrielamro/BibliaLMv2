import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function runQA() {
  console.log('🚀 Iniciando Agente QA BíbliaLM...');
  
  const backlogPath = path.join(process.cwd(), '_QA_BACKLOG.md');
  let backlogContent = `# 📋 Backlog de QA - BíbliaLM\n\nGerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
  
  try {
    console.log('🧪 Executando testes de fluxo...');
    // Corrigindo para usar node para npx por causa da política de execução
    const npxPath = "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npx-cli.js";
    const result = execSync(`node "${npxPath}" playwright test`, { stdio: 'pipe', encoding: 'utf-8' });
    
    backlogContent += `## ✅ Status Geral: SUCESSO\n\nTodos os fluxos críticos foram validados com sucesso.\n\n### Detalhes da Execução\n\`\`\`\n${result}\n\`\`\`\n`;
    console.log('✅ Testes concluídos com sucesso!');
  } catch (error: any) {
    console.error('❌ Falha detectada em um ou mais testes.');
    
    backlogContent += `## ⚠️ Status Geral: PROBLEMAS ENCONTRADOS\n\nAlguns fluxos falharam e requerem atenção.\n\n### 🚨 Problemas Identificados\n`;
    
    const output = error.stdout || error.stderr || error.message;
    
    // Simples parsing de falhas (pode ser melhorado)
    if (output.includes('Authentication Flow')) {
      backlogContent += `- **Autenticação**: Falha no fluxo de cadastro ou login.\n`;
    }
    if (output.includes('Core Features')) {
      backlogContent += `- **Funcionalidades**: Problemas detectados na Bíblia ou Chat.\n`;
    }

    backlogContent += `\n### 📝 Log de Erro Técnico\n\`\`\`\n${output}\n\`\`\`\n`;
  }

  fs.writeFileSync(backlogPath, backlogContent);
  console.log(`\n📄 Backlog atualizado em: ${backlogPath}`);
}

runQA();
