"use client";
import { useNavigate } from '../utils/router';


import React from 'react';
import { ArrowLeft, Scroll } from 'lucide-react';

import SEO from '../components/SEO';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto p-6 md:p-12">
      <SEO title="Termos de Uso" />
      <div className="max-w-3xl mx-auto">
        
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
            <div className="w-14 h-14 bg-bible-gold/10 rounded-2xl flex items-center justify-center text-bible-gold">
              <Scroll size={32} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Termos de Uso</h1>
          </div>

          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 font-sans leading-relaxed space-y-6">
            <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <h3>1. Aceitação dos Termos</h3>
            <p>Ao acessar e usar o BíbliaLM, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.</p>

            <h3>2. Uso da Licença</h3>
            <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site BíbliaLM, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título.</p>

            <h3>3. Inteligência Artificial</h3>
            <p>O BíbliaLM utiliza modelos de Inteligência Artificial (Google Gemini) para gerar conteúdo, estudos e respostas. Embora nos esforcemos pela precisão teológica, o conteúdo gerado pela IA pode conter imprecisões. Recomendamos sempre conferir as referências bíblicas diretamente nas Escrituras (Atos 17:11).</p>

            <h3>4. Conduta do Usuário</h3>
            <p>Você concorda em usar o "Reino" (área social) de forma respeitosa e edificante. Conteúdo ofensivo, herético, discurso de ódio ou spam resultará no banimento imediato da conta.</p>

            <h3>5. Assinaturas e Pagamentos</h3>
            <p>Os planos premium oferecem acesso a recursos avançados de IA e gestão eclesiástica. O cancelamento pode ser feito a qualquer momento, mas não oferecemos reembolso por períodos parciais não utilizados, salvo exigência legal.</p>

            <h3>6. Limitação de Responsabilidade</h3>
            <p>Em nenhum caso o BíbliaLM ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em BíbliaLM.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
