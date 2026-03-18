
import { BIBLE_BOOKS_LIST, BIBLE_DATA } from "../constants";
import { getBibleChapter as fetchFromAI } from "./pastorAgent";
import { dbService, supabase } from "./supabase";
import { Chapter } from "../types";
import { searchMatch, normalizeText } from "../utils/textUtils";

export const bibleService = {
    /**
     * Helper para esperar o estado do Auth resolver antes de operações sensíveis
     */
    async awaitAuth() {
        const { data } = await supabase.auth.getSession();
        return data.session?.user ?? null;
    },

    /**
     * Obtém um capítulo da Bíblia, verificando múltiplas camadas de cache.
     * Ordem: Hardcoded Data -> LocalStorage -> Supabase (Cloud) -> API Gemini
     */
    async getChapter(bookId: string, chapterNum: number): Promise<Chapter | null> {
        const bookMeta = BIBLE_BOOKS_LIST.find(b => b.id === bookId);
        if (!bookMeta) return null;

        // 1. Dados Offline
        const offlineBook = BIBLE_DATA.find(b => b.id === bookId);
        if (offlineBook) {
            const offlineChapter = offlineBook.chapters.find(c => c.number === chapterNum);
            if (offlineChapter) return offlineChapter;
        }

        // 2. Cache Persistente Local
        const cacheKey = `bible_content_${bookId}_${chapterNum}`;
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (e) { console.error(e); }

        // 3. Cache Global (Supabase)
        try {
            const cloudChapterDoc = await dbService.getBibleChapter(bookId, chapterNum);
            if (cloudChapterDoc) {
                const cloudChapter: Chapter = {
                    number: (cloudChapterDoc as any).number || chapterNum,
                    verses: cloudChapterDoc.verses || []
                };
                try { localStorage.setItem(cacheKey, JSON.stringify(cloudChapter)); } catch (e) { }
                return cloudChapter;
            }
        } catch (e: any) {
            console.warn("Supabase cache check failed", e);
        }

        // 4. API IA (Último Recurso)
        try {
            const data = await fetchFromAI(bookMeta.name, chapterNum);
            if (data) {
                try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) { }
                const currentUser = await this.awaitAuth();
                if (currentUser) {
                    dbService.saveBibleChapter(bookId, chapterNum, data).catch(() => { });
                }
                return data;
            }
        } catch (e) { console.error("AI Fetch error:", e); }

        return null;
    },

    /**
     * Busca o texto de um versículo específico e retorna a referência formatada corretamente.
     */
    async getVerseText(ref: string): Promise<{ text: string, formattedRef: string } | null> {
        // Regex flexível para capturar "Livro Cap:Ver" ou "1 Livro Cap.Ver" ou "Livro Cap Ver"
        const match = ref.trim().match(/^([1-3]?\s?[a-zà-ú\ç\ã\õ\s]+)\s+(\d+)[:\.;\s](\d+)$/i);

        if (!match) return null;

        const bookPart = match[1].trim();
        const chapterStr = match[2];
        const verseStr = match[3];

        // Busca inteligente do livro: Tenta match exato primeiro, depois aproximação
        const normalizedBookPart = normalizeText(bookPart);
        const book = BIBLE_BOOKS_LIST.find(b =>
            normalizeText(b.name) === normalizedBookPart || b.id === normalizedBookPart
        ) || BIBLE_BOOKS_LIST.find(b => searchMatch(bookPart, b.name, b.id));

        if (!book) return null;

        const chapter = parseInt(chapterStr);
        const verse = parseInt(verseStr);

        try {
            const chapterData = await this.getChapter(book.id, chapter);
            if (chapterData && chapterData.verses) {
                const verseData = chapterData.verses.find(v => v.number === verse);
                if (verseData) {
                    return {
                        text: verseData.text,
                        // Retorna a referência "canônica" (Nome Oficial do Livro + Cap:Ver)
                        formattedRef: `${book.name} ${chapter}:${verse}`
                    };
                }
            }
        } catch (e) {
            console.error("Erro ao buscar versículo localmente", e);
        }

        return null;
    },

    /**
     * Parseia uma string de referência para dados estruturados.
     * Suporta: "João 3:16", "Sl 1 1-2", "Gn 1"
     */
    parseReference(input: string): {
        bookId: string;
        chapter: number;
        startVerse: number;
        endVerse?: number;
        formatted: string;
        bookName: string;
    } | null {
        // Regex para: Livro Capitulo (VersoInicial (- VersoFinal)?)?
        const regex = /^([1-3]?\s?[a-zà-ú\ç\ã\õ\s]+)\s+(\d+)(?:[:\.\s](\d+)(?:[-,\s](\d+))?)?$/i;
        const match = input.trim().match(regex);

        if (!match) return null;

        const bookPart = match[1].trim();
        const chapter = parseInt(match[2]);
        const startVerse = match[3] ? parseInt(match[3]) : 1; // Se não especificado, assume versículo 1 (ou cap todo, tratado na UI)
        const endVerse = match[4] ? parseInt(match[4]) : undefined;

        const normalizedBookPart = normalizeText(bookPart);
        const book = BIBLE_BOOKS_LIST.find(b =>
            normalizeText(b.name) === normalizedBookPart || b.id === normalizedBookPart
        ) || BIBLE_BOOKS_LIST.find(b => searchMatch(bookPart, b.name, b.id));

        if (!book) return null;

        let formatted = `${book.name} ${chapter}`;
        if (startVerse && match[3]) { // Só adiciona se o usuário digitou
            formatted += `:${startVerse}`;
            if (endVerse) formatted += `-${endVerse}`;
        }

        return {
            bookId: book.id,
            bookName: book.name,
            chapter,
            startVerse,
            endVerse,
            formatted
        };
    },

    /**
     * Busca texto flexível: Capítulo Inteiro, Versículo Único ou Intervalo
     * Ex: "João 3", "João 3:16", "João 3:1-10", "Gênesis 2 10 11"
     */
    async getTextByReference(ref: string): Promise<{ text: string, formattedRef: string, meta?: { bookId: string, chapter: number, verses: number[] } } | null> {
        const parsed = this.parseReference(ref);
        if (!parsed) return null;

        try {
            const chapterData = await this.getChapter(parsed.bookId, parsed.chapter);
            if (!chapterData || !chapterData.verses) return null;

            let selectedVerses = chapterData.verses;

            // Se usuário especificou versículos
            if (ref.includes(':') || ref.match(/\d\s\d/)) {
                if (parsed.endVerse) {
                    // Intervalo
                    const minV = Math.min(parsed.startVerse, parsed.endVerse);
                    const maxV = Math.max(parsed.startVerse, parsed.endVerse);
                    selectedVerses = chapterData.verses.filter(v => v.number >= minV && v.number <= maxV);
                } else {
                    // Único
                    selectedVerses = chapterData.verses.filter(v => v.number === parsed.startVerse);
                }
            }

            if (selectedVerses.length === 0) return null;

            const textBody = selectedVerses.map(v =>
                selectedVerses.length > 1 ? `[${v.number}] ${v.text}` : v.text
            ).join(' ');

            return {
                text: textBody,
                formattedRef: parsed.formatted,
                meta: {
                    bookId: parsed.bookId,
                    chapter: parsed.chapter,
                    verses: selectedVerses.map(v => v.number)
                }
            };

        } catch (e) {
            console.error("Erro na busca avançada", e);
            return null;
        }
    },

    prefetchNext(bookId: string, currentChapter: number) {
        setTimeout(() => { this.getChapter(bookId, currentChapter + 1); }, 3000);
    }
};
