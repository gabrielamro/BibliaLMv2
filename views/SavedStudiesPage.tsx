"use client";
import { useNavigate } from '../utils/router';

import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { SavedStudy, Note } from '../types';
import {
  PlusCircle, BookOpen, Trash2, Search, Loader2,
  PenTool, FileText, Globe,
} from 'lucide-react';
import SEO from '../components/SEO';
import StandardCard from '../components/ui/StandardCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { getEditDestinationForContent } from '../utils/contentEditing';

const SavedStudiesPage: React.FC = () => {
  const { currentUser, showNotification } = useAuth();
  const { setTitle, setIcon, resetHeader } = useHeader();
  const navigate = useNavigate();

  const [studies, setStudies] = useState<SavedStudy[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<'drafts' | 'published' | 'notes'>('drafts');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'study' | 'note' | null>(null);

  useEffect(() => {
    setTitle('Workspace Pessoal');
    setIcon(<PenTool size={20} />);
    return () => resetHeader();
  }, [setTitle, setIcon, resetHeader]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        const [studiesData, publicStudiesData, notesData] = await Promise.all([
          dbService.getAll(currentUser.uid, 'studies'),
          dbService.getAll(currentUser.uid, 'public_studies'),
          dbService.getAll(currentUser.uid, 'notes'),
        ]);
        const normalize = (data: any[]) => data.map(s => {
          let blocks = s.blocks;
          let meta = s.meta;
          try { if (typeof blocks === 'string') blocks = JSON.parse(blocks); } catch(e) { blocks = []; }
          try { if (typeof meta === 'string') meta = JSON.parse(meta); } catch(e) { meta = {}; }
          return { ...s, blocks, meta };
        });

        setStudies([...normalize(studiesData as any[]), ...normalize(publicStudiesData as any[])]);
        setNotes(notesData as Note[]);
      } catch (e) {
        console.error(e);
        showNotification('Erro ao carregar dados.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, showNotification]);

  const filteredContent = useMemo(() => {
    let content: any[] = [];

    if (activeTab === 'drafts') {
      content = studies.filter((s) => s.status !== 'published');
    } else if (activeTab === 'published') {
      content = studies.filter((s) => s.status === 'published');
    } else {
      content = notes;
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      content = content.filter(
        (i) =>
          i.title?.toLowerCase().includes(lower) ||
          i.content?.toLowerCase().includes(lower) ||
          i.analysis?.toLowerCase().includes(lower),
      );
    }
    return content;
  }, [activeTab, studies, notes, searchTerm]);

  const handleEditStudy = (e: React.MouseEvent, study: SavedStudy) => {
    e.stopPropagation();
    const destination = getEditDestinationForContent({ ...study, type: 'study' });
    if (destination) {
      navigate(destination.path, { state: destination.state });
    }
  };

  const handleViewPublic = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/v/${id}`);
  };

  const confirmDelete = async () => {
    if (!currentUser || !deleteId) return;
    try {
      if (deleteType === 'study') {
        const study = studies.find((s) => s.id === deleteId);
        const isPublicStudyBlock = 'blocks' in (study || {});
        if (study?.status === 'published' && !isPublicStudyBlock) {
          await dbService.unpublishStudy(currentUser.uid, deleteId);
        }
        const endpoint = isPublicStudyBlock ? 'public_studies' : 'studies';
        await dbService.delete(currentUser.uid, endpoint, deleteId);
        setStudies((prev) => prev.filter((s) => s.id !== deleteId));
      } else {
        await dbService.delete(currentUser.uid, 'notes', deleteId);
        setNotes((prev) => prev.filter((n) => n.id !== deleteId));
      }
      showNotification('Item excluido.', 'success');
    } catch (e) {
      showNotification('Erro ao excluir.', 'error');
    } finally {
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'sermon':
        return 'Sermao';
      case 'devocional':
        return 'Devocional';
      case 'podcast':
        return 'Podcast';
      case 'modulo':
        return 'Trilha';
      default:
        return 'Estudo';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
      <SEO title="Workspace Pessoal" />

      <div className="max-w-6xl mx-auto pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex w-full md:w-auto gap-2 flex-1">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-bible-darkPaper border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 ring-bible-gold/30"
              />
            </div>
          </div>

          <div className="flex w-full md:w-auto justify-end">
            <button
              onClick={() => navigate('/criar-conteudo')}
              className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
            >
              <PlusCircle size={16} /> Novo
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar border-b border-gray-100 dark:border-gray-800">
          {[
            { id: 'drafts', label: 'Rascunhos', icon: <FileText size={14} /> },
            { id: 'published', label: 'Publicados', icon: <Globe size={14} /> },
            { id: 'notes', label: 'Anotacoes', icon: <BookOpen size={14} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-6 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
                activeTab === t.id
                  ? 'border-bible-gold text-bible-leather dark:text-bible-gold bg-bible-gold/5'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-bible-gold" size={32} /></div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              {activeTab === 'notes' ? <BookOpen size={24} /> : <FileText size={24} />}
            </div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Nenhum item encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {filteredContent.map((item: any) => (
              <StandardCard
                key={item.id}
                title={item.title || 'Sem titulo'}
                subtitle={activeTab === 'notes' ? item.content : (item.sourceText || 'Sem descricao')}
                imageUrl={item.meta?.coverImage || item.coverUrl}
                visibility={item.meta?.visibility}
                badges={activeTab !== 'notes'
                  ? [
                      { label: getSourceLabel(item.source), color: 'bg-blue-50 text-blue-600' },
                      { label: item.status === 'published' ? 'Publico' : 'Rascunho', color: item.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500' },
                    ]
                  : [{ label: 'Nota', color: 'bg-yellow-50 text-yellow-600' }]}
                metrics={activeTab === 'published' ? item.metrics : undefined}
                actionLabel={activeTab === 'published' ? 'Ver Artigo' : 'Editar'}
                onAction={(e) => {
                  if (activeTab === 'published') handleViewPublic(e, item.id);
                  else if (activeTab === 'drafts') handleEditStudy(e, item);
                }}
                onSecondaryAction={() => {
                  setDeleteId(item.id);
                  setDeleteType(activeTab === 'notes' ? 'note' : 'study');
                }}
                secondaryIcon={<Trash2 size={14} />}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Item"
        message="Tem certeza? Esta acao nao pode ser desfeita."
        variant="danger"
        confirmText="Excluir"
      />
    </div>
  );
};

export default SavedStudiesPage;
