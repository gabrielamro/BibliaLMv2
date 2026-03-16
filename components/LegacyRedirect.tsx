"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import { useEffect } from 'react';


const LegacyRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Proteção contra ambientes de preview (como AI Studio) que usam URLs 'blob:'
    if (window.location.protocol === 'blob:') return;

    try {
      const hash = window.location.hash;
      
      // Apenas redireciona se houver um hash que pareça uma rota antiga (começa com #/)
      if (hash && hash.startsWith('#/')) {
        const path = hash.substring(2); // Remove '#/'
        
        // Proteção contra loops: não redirecionar se o path resultante já é o atual
        // Remove barras iniciais para comparação justa
        const currentPath = location.pathname.startsWith('/') ? location.pathname.substring(1) : location.pathname;
        const targetPath = path.startsWith('/') ? path.substring(1) : path;

        if (targetPath && targetPath !== currentPath && targetPath !== '') {
            // Remove prefixos legados específicos se necessário
            const cleanPath = targetPath.startsWith('u/') ? targetPath.substring(2) : targetPath;
            if (currentPath !== cleanPath) {
              console.log(`Legacy Redirect: ${hash} -> /${cleanPath}`);
              navigate('/' + cleanPath, { replace: true });
            }
        } else if (targetPath === '' && location.pathname !== '/') {
            navigate('/', { replace: true });
        }
      }
    } catch (e) {
      console.warn("LegacyRedirect: Navegação segura mantida.", e);
    }
  }, []); // Remove location from dependencies to prevent loop

  return null;
};

export default LegacyRedirect;
