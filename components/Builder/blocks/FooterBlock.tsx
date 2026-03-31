import React from 'react';
import { MessageCircle, Share2 } from 'lucide-react';

interface FooterBlockProps {
  data: any;
  isEditing: boolean;
}

export const FooterBlock: React.FC<FooterBlockProps> = ({ data, isEditing }) => (
  <div className="w-full py-4 px-6">
    <div className="text-center">
      {data.tagline && (
        <p className="text-bible-gold font-bold text-lg mb-6 tracking-wide uppercase">{data.tagline}</p>
      )}
      {data.showSocial && (
        <div className="flex justify-center gap-6 mb-8">
          <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-bible-gold hover:text-white transition-all transform hover:scale-110">
            <MessageCircle size={24} />
          </a>
          <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-bible-gold hover:text-white transition-all transform hover:scale-110">
            <Share2 size={24} />
          </a>
        </div>
      )}
      <div className="w-16 h-[1px] bg-white/20 mx-auto mb-6" />
      <p className="text-sm text-white/50 font-medium tracking-tight">{data.copyright}</p>
    </div>
  </div>
);
