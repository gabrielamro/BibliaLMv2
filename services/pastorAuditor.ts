
import * as bigPickle from './bigPickleService';

export interface AuditoriaResult {
    approved: boolean;
    correctedContent?: string;
    foundation: string;
    source: string;
    observations: string;
    limitations: string[];
    issues: string[];
}

const PASTOR_AUDITOR_PROMPT = `Você é o Pastor Auditor do BibliaLM. Revise e valide o conteúdo gerado pela IA.

## Regras de Auditoria:
1. Verifique se o conteúdo tem tom pastoral, sábio e acolhedor
2. Confirme que está fundamentado em fontes bíblicas reais
3. Identifique possíveis alucinações, exageros ou invenções
4. Diferencie fato bíblico de interpretação pastoral
5. Verifique se citações bíblicas estão corretas

## Se identificar problemas:
- Corrija o trecho problematico
- Adicione fundamento bíblico quando necessário
- Ajuste o tom pastoral se preciso
- Sinalize limitações interpretativas

## Formato de saída (JSON):
{
    "approved": boolean,
    "correctedContent": "conteúdo corrigido se necessário",
    "foundation": "base teológica utilizada",
    "source": "fontes bíblicas citadas",
    "observations": "observações pastorais",
    "limitations": ["limitações identificadas"],
    "issues": ["problemas encontrados"]
}`;

export const auditarConteudo = async (content: string, type: 'chat' | 'study' | 'podcast' | 'prayer' | 'devotional' | 'general'): Promise<AuditoriaResult> => {
    try {
        const prompt = `Tipo de conteúdo: ${type}\n\nConteúdo a auditar:\n${content}\n\n${PASTOR_AUDITOR_PROMPT}`;
        
        const response = await fetch("https://opencode.ai/zen/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_BIGPICKLE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "big-pickle",
                messages: [
                    { 
                        role: "system", 
                        content: "Você é o Pastor Auditor do BibliaLM. Revise o conteúdo com rigor teológico e retorne APENAS JSON válido."
                    },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
        
        return {
            approved: result.approved ?? true,
            correctedContent: result.correctedContent,
            foundation: result.foundation || "Verificação não disponível",
            source: result.source || "Não especificado",
            observations: result.observations || "",
            limitations: result.limitations || [],
            issues: result.issues || []
        };
    } catch (e) {
        console.error("Erro na auditoria:", e);
        return {
            approved: true,
            foundation: "Auditoria falhou - liberando por padrão",
            source: "N/A",
            observations: "Erro ao processar auditoria",
            limitations: ["Auditoria indisponível"],
            issues: []
        };
    }
};

export const auditarEPublicar = async (
    generator: () => Promise<string>,
    type: 'chat' | 'study' | 'podcast' | 'prayer' | 'devotional' | 'general',
    autoFix: boolean = true
): Promise<{ content: string; audit: AuditoriaResult }> => {
    const content = await generator();
    const audit = await auditarConteudo(content, type);
    
    if (!audit.approved && autoFix && audit.correctedContent) {
        return {
            content: audit.correctedContent,
            audit
        };
    }
    
    return { content, audit };
};
