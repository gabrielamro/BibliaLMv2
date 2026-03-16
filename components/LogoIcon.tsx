
import React from 'react';

interface LogoIconProps {
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className = "w-8 h-8" }) => {
  // Ícone de Livro Aberto Dourado (Open Book)
  // Baseado no modelo visual fornecido: traço elegante, páginas abertas simétricas.
  return (
    <div className={`${className} text-bible-gold flex items-center justify-center`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    </div>
  );
};
