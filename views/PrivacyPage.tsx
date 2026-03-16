"use client";
import { useNavigate } from '../utils/router';


import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

import SEO from '../components/SEO';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto p-6 md:p-12">
      <SEO title="Política de Privacidade" />
      <div className="max-w-3xl mx-auto">
        
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Política de Privacidade</h1>
          </div>

          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 font-sans leading-relaxed space-y-6">
            <p>Sua privacidade é importante para nós. É política do BíbliaLM respeitar a sua privacidade em relação a qualquer informação que possamos coletar no site BíbliaLM.</p>

            <h3>1. Coleta de Dados</h3>
            <p>Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.</p>
            <ul>
              <li><strong>Dados de Conta:</strong> Nome, e-mail e foto (via Google/Apple Auth) para criar seu perfil.</li>
              <li><strong>Dados de Uso:</strong> Progresso de leitura, orações postadas e estudos criados são armazenados para sincronização entre dispositivos.</li>
            </ul>

            <h3>2. Uso de Dados</h3>
            <p>Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</p>

            <h3>3. Compartilhamento</h3>
            <p>Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei. O conteúdo que você posta publicamente no "Reino" (Feed, Igrejas) é visível para outros usuários.</p>

            <h3>4. Cookies e Tecnologias</h3>
            <p>Utilizamos armazenamento local e cookies para manter sua sessão ativa e salvar preferências de leitura (tema, fonte).</p>

            <h3>5. Compromisso do Usuário</h3>
            <p>O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o BíbliaLM oferece no site e com caráter enunciativo, mas não limitativo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
