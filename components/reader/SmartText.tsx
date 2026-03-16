"use client";


import React, { useMemo } from 'react';
import { BIBLICAL_ENTITIES } from '../../constants';

interface SmartTextProps {
  text: string;
  enabled: boolean;
}

// Conjuntos para verificação rápida (O(1))
const DIVINE_SET = new Set(BIBLICAL_ENTITIES.DIVINE.map(s => s.toLowerCase()));
const PEOPLE_SET = new Set(BIBLICAL_ENTITIES.PEOPLE.map(s => s.toLowerCase()));

// Combina todas as entidades para criar uma única expressão regular de busca
// Ordenamos por tamanho (do maior para o menor) para que nomes compostos (ex: "Espírito Santo")
// tenham prioridade sobre nomes simples ("Espírito").
const ALL_NAMES = [...BIBLICAL_ENTITIES.DIVINE, ...BIBLICAL_ENTITIES.PEOPLE]
    .filter(n => n)
    .sort((a, b) => b.length - a.length);

// Cria a Regex com suporte a Unicode (\p{L}) para lidar corretamente com acentos do PT-BR.
// (?<!\p{L}) = Lookbehind negativo: garante que não há uma letra antes (ex: evita 'Adeus' match 'Deus')
// (?!\p{L})  = Lookahead negativo: garante que não há uma letra depois
const ENTITY_REGEX = new RegExp(`(?<!\\p{L})(${ALL_NAMES.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?!\\p{L})`, 'gui');

const SmartText: React.FC<SmartTextProps> = React.memo(({ text, enabled }) => {
  
  const processedNodes = useMemo(() => {
    // Se desativado, retorna texto puro.
    // Alteração: Deidades sempre são destacadas por reverência, mesmo se SmartMode off? 
    // Por enquanto respeitamos a prop enabled, mas o SettingsContext agora tem default true.
    if (!enabled) return <>{text}</>;

    // 1. Dividir por aspas duplas (retas ou curvas) para identificar falas.
    // REMOVIDO aspas simples (') para evitar quebrar palavras como "d'água" ou "d'Ele".
    const quoteParts = text.split(/([“"].*?[”"])/g);

    return quoteParts.map((part, i) => {
       // Verifica se este pedaço é uma citação (começa e termina com aspas duplas)
       const isQuote = part.match(/^[“"].*[”"]$/);
       
       // 2. Dentro do pedaço (seja fala ou narração), buscar as entidades
       const subParts = part.split(ENTITY_REGEX);

       const elements = subParts.map((token, j) => {
           const lower = token.toLowerCase();

           // Verifica Divindade (Prioridade Visual: Dourado/Amarelo)
           if (DIVINE_SET.has(lower)) {
               return (
                   <span key={`${i}-${j}`} className="font-bold text-yellow-600 dark:text-yellow-500">
                       {token}
                   </span>
               );
           }
           
           // Verifica Personagens (Prioridade Visual: Azul)
           if (PEOPLE_SET.has(lower)) {
               return (
                   <span key={`${i}-${j}`} className="font-bold text-blue-600 dark:text-blue-400">
                       {token}
                   </span>
               );
           }

           // Texto comum
           return <span key={`${i}-${j}`}>{token}</span>;
       });

       // Se for citação, envolve tudo em negrito suave para destacar que é fala
       if (isQuote) {
           return (
               <span key={i} className="font-bold text-gray-900 dark:text-gray-100">
                   {elements}
               </span>
           );
       }
       
       // Narração normal (cinza/neutro)
       return <span key={i} className="text-gray-700 dark:text-gray-300">{elements}</span>;
    });

  }, [text, enabled]);

  return <span className="smart-text-content">{processedNodes}</span>;
});

export default SmartText;
