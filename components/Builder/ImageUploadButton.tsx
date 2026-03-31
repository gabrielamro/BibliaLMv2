import React, { useRef, useState } from 'react';
import { Upload, Loader2, ImagePlus } from 'lucide-react';
import { uploadBlob } from '../../services/supabase';

interface ImageUploadButtonProps {
  onUpload: (url: string) => void;
  className?: string;
  label?: string;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({ 
  onUpload, 
  className = "", 
  label = "Upload" 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const extension = file.name.split('.').pop();
      const path = `content/${Date.now()}.${extension}`;
      const url = await uploadBlob(file, path);
      onUpload(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-bible-gold/10 text-bible-gold hover:bg-bible-gold hover:text-white transition-all rounded-lg text-[10px] font-bold uppercase whitespace-nowrap disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ImagePlus size={14} />
        )}
        {isUploading ? 'Enviando...' : label}
      </button>
    </div>
  );
};
