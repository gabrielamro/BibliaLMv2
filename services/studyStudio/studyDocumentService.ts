import { supabase } from '../supabase';
import type { StudyDocumentV2 } from '../../types';

export class StudyRevisionConflictError extends Error {
  constructor() {
    super('Este estudo foi atualizado em outra sessão. Recarregue a versão mais recente antes de salvar.');
    this.name = 'StudyRevisionConflictError';
  }
}

export interface PersistedStudyDocument {
  id: string;
  revision: number;
  document: StudyDocumentV2;
  updatedAt: string;
}

export const studyDocumentService = {
  load: async (id: string): Promise<PersistedStudyDocument | null> => {
    const { data, error } = await supabase
      .from('public_studies')
      .select('id, revision, document, updated_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      revision: Number(data.revision || 0),
      document: data.document as StudyDocumentV2,
      updatedAt: data.updated_at,
    };
  },

  save: async (
    id: string,
    document: StudyDocumentV2,
    expectedRevision: number,
  ): Promise<PersistedStudyDocument> => {
    const nextRevision = expectedRevision + 1;
    const updatedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from('public_studies')
      .update({
        document: {
          ...document,
          revision: nextRevision,
          updatedAt,
        },
        schema_version: 2,
        revision: nextRevision,
        title: document.title,
        description: document.description,
        status: document.status,
        updated_at: updatedAt,
      })
      .eq('id', id)
      .eq('revision', expectedRevision)
      .select('id, revision, document, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new StudyRevisionConflictError();
    return {
      id: data.id,
      revision: Number(data.revision),
      document: data.document as StudyDocumentV2,
      updatedAt: data.updated_at,
    };
  },
};
