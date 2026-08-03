"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    BookMarked,
    BookOpen,
    Check,
    ChevronDown,
    ChevronRight,
    History,
    Languages,
    Moon,
    Search,
    Sun,
    UserRound,
    X,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { BIBLE_BOOKS_LIST, DAILY_BIBLE_VERSES } from "../../constants";
import { bibleService } from "../../services/bibleService";
import { getBibleBookAutocomplete } from "../../utils/bibleBookAutocomplete";
import {
    BIBLE_VERSIONS,
    DEFAULT_BIBLE_VERSION,
    findBibleVersion,
    shouldAskToSaveBibleVersion,
} from "../../utils/bibleVersionPreferences";
import { resolveBibleSearchNavigation } from "../../utils/bibleSearchNavigation";
import { searchMatch } from "../../utils/textUtils";
import { useNavigate } from "../../utils/router";

const BOOK_CHAPTER_COUNTS: Record<string, number> = {
    gn: 50, ex: 40, lv: 27, nm: 36, dt: 34, js: 24, jz: 21, rt: 4,
    "1sm": 31, "2sm": 24, "1rs": 22, "2rs": 25, "1cr": 29, "2cr": 36,
    ed: 10, ne: 13, et: 10, jo: 42, sl: 150, pv: 31, ec: 12, ct: 8,
    is: 66, jr: 52, lm: 5, ez: 48, dn: 12, os: 14, jl: 3, am: 9,
    ob: 1, jn: 4, mq: 7, na: 3, hc: 3, sf: 3, ag: 2, zc: 14, ml: 4,
    tb: 14, jdt: 16, sab: 19, eclo: 51, br: 6, "1mc": 16, "2mc": 15,
    mt: 28, mc: 16, lc: 24, joao: 21, at: 28, rm: 16, "1co": 16,
    "2co": 13, gl: 6, ef: 6, fp: 4, cl: 4, "1ts": 5, "2ts": 3,
    "1tm": 6, "2tm": 4, tt: 3, fm: 1, hb: 13, tg: 5, "1pe": 5,
    "2pe": 3, "1jo": 5, "2jo": 1, "3jo": 1, jd: 1, ap: 22,
};

type BookCategoryId = "all" | "pentateuch" | "historical" | "poetic" | "prophets" | "gospels" | "letters";
type BibleCollectionId = "all" | "old" | "new" | "catholic";

const BIBLE_COLLECTIONS: Array<{
    id: BibleCollectionId;
    label: string;
    testament?: "old" | "new" | "apocryphal";
}> = [
    { id: "all", label: "Toda a Bíblia" },
    { id: "old", label: "Antigo Testamento", testament: "old" },
    { id: "new", label: "Novo Testamento", testament: "new" },
    { id: "catholic", label: "Bíblia Católica", testament: "apocryphal" },
];

const BOOK_CATEGORIES: Array<{ id: BookCategoryId; label: string }> = [
    { id: "all", label: "Todos" },
    { id: "pentateuch", label: "Pentateuco" },
    { id: "historical", label: "Históricos" },
    { id: "poetic", label: "Poéticos" },
    { id: "prophets", label: "Profetas" },
    { id: "gospels", label: "Evangelhos" },
    { id: "letters", label: "Cartas" },
];

const CATEGORY_BOOK_IDS: Record<Exclude<BookCategoryId, "all">, Set<string>> = {
    pentateuch: new Set(["gn", "ex", "lv", "nm", "dt"]),
    historical: new Set([
        "js", "jz", "rt", "1sm", "2sm", "1rs", "2rs", "1cr", "2cr", "ed", "ne", "et",
        "tb", "jdt", "1mc", "2mc", "at",
    ]),
    poetic: new Set(["jo", "sl", "pv", "ec", "ct", "sab", "eclo"]),
    prophets: new Set([
        "is", "jr", "lm", "ez", "dn", "os", "jl", "am", "ob", "jn", "mq", "na", "hc",
        "sf", "ag", "zc", "ml", "br", "ap",
    ]),
    gospels: new Set(["mt", "mc", "lc", "joao"]),
    letters: new Set([
        "rm", "1co", "2co", "gl", "ef", "fp", "cl", "1ts", "2ts", "1tm", "2tm", "tt",
        "fm", "hb", "tg", "1pe", "2pe", "1jo", "2jo", "3jo", "jd",
    ]),
};

const BOOK_ABBREVIATIONS: Record<string, string> = {
    gn: "Gn", ex: "Êx", lv: "Lv", nm: "Nm", dt: "Dt", js: "Js", jz: "Jz", rt: "Rt",
    jo: "Jó", sl: "Sl", pv: "Pv", ec: "Ec", ct: "Ct", mt: "Mt", mc: "Mc", lc: "Lc",
    joao: "Jo", at: "At", rm: "Rm", ap: "Ap",
};

const BOOK_TONES = [
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
];

const NUMBER_FORMAT = new Intl.NumberFormat("pt-BR");

interface LastReading {
    bookId: string;
    chapter: number;
}

interface LibraryProps {
    onSelectBook: (bookId: string, chapter?: number, verse?: number | null, highlightVerses?: number[]) => void;
}

function getBookAbbreviation(bookId: string, name: string) {
    if (BOOK_ABBREVIATIONS[bookId]) return BOOK_ABBREVIATIONS[bookId];
    const numberedBook = name.match(/^(\d)\s+(.+)/);
    if (numberedBook) return `${numberedBook[1]}${numberedBook[2].slice(0, 1)}`;
    return name.slice(0, 2);
}

const Library: React.FC<LibraryProps> = ({ onSelectBook }) => {
    const navigate = useNavigate();
    const { currentUser, userProfile, showNotification, openLogin } = useAuth();
    const { settings, toggleTheme, updateSettings, saveBibleVersionAsDefault } = useSettings();

    const [activeCollection, setActiveCollection] = useState<BibleCollectionId>("all");
    const [activeCategory, setActiveCategory] = useState<BookCategoryId>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
    const [isDefaultPromptDismissed, setIsDefaultPromptDismissed] = useState(false);
    const [localLastReading, setLocalLastReading] = useState<LastReading | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const versionMenuRef = useRef<HTMLDivElement>(null);

    const activeVersion = settings.bibleVersion || DEFAULT_BIBLE_VERSION;
    const defaultVersion = settings.defaultBibleVersion || DEFAULT_BIBLE_VERSION;
    const activeVersionOption = findBibleVersion(activeVersion) || BIBLE_VERSIONS[0];
    const showDefaultVersionPrompt = !isDefaultPromptDismissed
        && shouldAskToSaveBibleVersion(activeVersion, defaultVersion);

    useEffect(() => {
        setIsDefaultPromptDismissed(false);
    }, [activeVersion]);

    useEffect(() => {
        try {
            const storedReading = localStorage.getItem("biblia_last_read");
            if (storedReading) {
                const parsed = JSON.parse(storedReading) as Partial<LastReading>;
                if (
                    parsed.bookId
                    && BIBLE_BOOKS_LIST.some((book) => book.id === parsed.bookId)
                    && Number.isFinite(Number(parsed.chapter))
                ) {
                    setLocalLastReading({ bookId: parsed.bookId, chapter: Math.max(1, Number(parsed.chapter)) });
                }
            }

        } catch {
            setLocalLastReading(null);
        }
    }, [userProfile?.uid]);

    useEffect(() => {
        const closeVersionMenu = (event: MouseEvent) => {
            if (versionMenuRef.current && !versionMenuRef.current.contains(event.target as Node)) {
                setIsVersionMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", closeVersionMenu);
        return () => document.removeEventListener("mousedown", closeVersionMenu);
    }, []);

    const bookAutocomplete = useMemo(
        () => getBibleBookAutocomplete(searchTerm, BIBLE_BOOKS_LIST, 4),
        [searchTerm],
    );

    const bibleMatch = useMemo(
        () => searchTerm.trim() ? bibleService.parseReference(searchTerm.trim()) : null,
        [searchTerm],
    );

    const filteredBooks = useMemo(() => {
        const trimmed = searchTerm.trim();
        const activeCollectionOption = BIBLE_COLLECTIONS.find((option) => option.id === activeCollection);
        let books = activeCollectionOption?.testament
            ? BIBLE_BOOKS_LIST.filter((book) => book.testament === activeCollectionOption.testament)
            : BIBLE_BOOKS_LIST;

        if (trimmed) {
            books = books.filter((book) => searchMatch(trimmed.toLowerCase(), book.name, book.id));
        }
        if (activeCategory !== "all") {
            books = books.filter((book) => CATEGORY_BOOK_IDS[activeCategory].has(book.id));
        }
        return books;
    }, [activeCategory, activeCollection, searchTerm]);

    const getBookProgress = (bookId: string) => {
        const readCount = userProfile?.progress?.readChapters?.[bookId]?.length || 0;
        const total = BOOK_CHAPTER_COUNTS[bookId] || 1;
        return Math.min(100, Math.round((readCount / total) * 100));
    };

    const profileLastReading = useMemo<LastReading | null>(() => {
        const bookId = userProfile?.progress?.lastActiveBookId;
        if (!bookId || !BIBLE_BOOKS_LIST.some((book) => book.id === bookId)) return null;
        return {
            bookId,
            chapter: Math.max(1, Number(userProfile?.progress?.lastActiveChapter || 1)),
        };
    }, [userProfile?.progress?.lastActiveBookId, userProfile?.progress?.lastActiveChapter]);

    const hasReadingHistory = Boolean(profileLastReading || localLastReading);
    const lastReading = profileLastReading || localLastReading || { bookId: "gn", chapter: 1 };
    const lastBook = BIBLE_BOOKS_LIST.find((book) => book.id === lastReading.bookId) || BIBLE_BOOKS_LIST[0];
    const lastBookProgress = getBookProgress(lastBook.id);

    const readingPlan = userProfile?.readingPlan;
    const completedPlanDays = new Set(readingPlan?.completedDays || []).size;
    const parsedPlanDuration = Number(readingPlan?.planType || 365);
    const planDuration = Number.isFinite(parsedPlanDuration) && parsedPlanDuration > 0 ? parsedPlanDuration : 365;
    const planProgress = readingPlan?.isActive
        ? Math.min(100, Math.round((completedPlanDays / planDuration) * 100))
        : 0;

    const verseOfDay = DAILY_BIBLE_VERSES[new Date().getDate() % DAILY_BIBLE_VERSES.length] || DAILY_BIBLE_VERSES[0];

    const handleDirectBibleSelection = async () => {
        if (!bibleMatch) return;

        const navigationResult = await resolveBibleSearchNavigation(searchTerm, {
            parseReference: (input) => bibleService.parseReference(input),
            getTextByReference: (input) => bibleService.getTextByReference(input, activeVersion),
        });
        if (navigationResult) {
            onSelectBook(
                navigationResult.routeState.bookId,
                navigationResult.routeState.chapter,
                navigationResult.routeState.scrollToVerse ?? null,
                navigationResult.routeState.highlightVerses ?? [],
            );
            return;
        }

        onSelectBook(bibleMatch.bookId, bibleMatch.chapter, bibleMatch.startVerse);
    };

    const handleProfileAction = () => {
        if (currentUser) navigate("/perfil");
        else openLogin("/bibliasagrada");
    };

    return (
        <div
            data-testid="bible-library"
            className="flex h-full min-h-0 flex-col bg-[#fdfbf7] text-[#0b2347] dark:bg-[#0b0b0c] dark:text-gray-100"
        >
            <header className="sticky top-0 z-40 border-b border-[#e8e2da] bg-[#fdfbf7]/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0b0c]/95">
                <div className="flex min-h-[84px] w-full items-center gap-3 px-4 py-3 md:px-6 xl:px-8">
                    <div className="hidden min-w-[250px] md:block">
                        <h1 className="text-2xl font-black tracking-tight text-[#0b2347] xl:text-3xl dark:text-white">Bíblia Sagrada</h1>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Leia, estude e acompanhe sua jornada.</p>
                    </div>

                    <div className="relative min-w-0 flex-1">
                        <Search
                            aria-hidden="true"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0b2347]/70 dark:text-gray-400"
                            size={20}
                        />
                        <input
                            ref={inputRef}
                            type="search"
                            placeholder="Buscar livro ou passagem..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="h-12 w-full rounded-xl border border-[#d9dee7] bg-white pl-12 pr-11 text-sm text-[#0b2347] outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                            aria-label="Buscar livro ou passagem bíblica"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-red-600 dark:hover:bg-white/10"
                                aria-label="Limpar busca"
                            >
                                <X size={16} />
                            </button>
                        )}

                        {!bibleMatch && bookAutocomplete.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#e5dfd7] bg-white shadow-2xl dark:border-white/10 dark:bg-[#171719]">
                                {bookAutocomplete.map((suggestion) => (
                                    <button
                                        key={suggestion.id}
                                        type="button"
                                        onClick={() => setSearchTerm(suggestion.completion)}
                                        className="flex min-h-14 w-full items-center justify-between gap-3 border-b border-[#f0ebe5] px-4 text-left transition last:border-0 hover:bg-emerald-50 dark:border-white/10 dark:hover:bg-emerald-500/10"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                <BookOpen size={17} />
                                            </span>
                                            <span>
                                                <strong className="block text-sm">{suggestion.name}</strong>
                                                <small className="text-xs text-gray-500">Completar referência</small>
                                            </span>
                                        </span>
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{suggestion.completion}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div ref={versionMenuRef} className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsVersionMenuOpen((current) => !current)}
                            className="flex h-12 min-w-[82px] items-center justify-center gap-2 rounded-xl border border-[#d9dee7] bg-white px-3 text-xs font-black text-[#0b2347] transition hover:border-emerald-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                            aria-label="Selecionar versão da Bíblia"
                            aria-expanded={isVersionMenuOpen}
                        >
                            <Languages size={18} />
                            <span>{activeVersionOption.label}</span>
                            <ChevronDown size={15} />
                        </button>

                        {isVersionMenuOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[#e5dfd7] bg-white shadow-2xl dark:border-white/10 dark:bg-[#171719]">
                                {BIBLE_VERSIONS.map((version) => {
                                    const isSelected = activeVersion === version.id;
                                    return (
                                        <button
                                            key={version.id}
                                            type="button"
                                            onClick={() => {
                                                updateSettings({ bibleVersion: version.id });
                                                setIsVersionMenuOpen(false);
                                            }}
                                            className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left transition ${isSelected
                                                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                                                : "text-[#0b2347] hover:bg-[#f7f3ee] dark:text-gray-200 dark:hover:bg-white/5"
                                                }`}
                                        >
                                            <span>
                                                <strong className="block text-xs">{version.label}</strong>
                                                <small className="text-[11px] text-gray-500">{version.desc}</small>
                                            </span>
                                            {isSelected && <Check size={15} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d9dee7] bg-white text-[#0b2347] transition hover:border-emerald-600 sm:flex dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                        aria-label={settings.theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
                    >
                        {settings.theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button
                        type="button"
                        onClick={handleProfileAction}
                        className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#07523f] text-white transition hover:bg-[#063f32] lg:flex"
                        aria-label={currentUser ? "Abrir perfil" : "Entrar na conta"}
                    >
                        {userProfile?.photoURL ? (
                            <img src={userProfile.photoURL} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <UserRound size={21} />
                        )}
                    </button>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <main className="w-full space-y-5 px-4 py-5 pb-28 md:px-6 md:py-6 xl:px-8">
                    {showDefaultVersionPrompt && (
                        <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[#0b2347] sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-gray-100">
                            <p className="text-sm font-semibold">Deseja deixar a versão {activeVersionOption.label} como padrão?</p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const saved = await saveBibleVersionAsDefault(activeVersion);
                                        setIsDefaultPromptDismissed(true);
                                        showNotification(
                                            saved
                                                ? `Versão ${activeVersionOption.label} definida como padrão.`
                                                : "Versão padrão salva neste dispositivo. Execute a migration para salvar no perfil.",
                                            saved ? "success" : "warning",
                                        );
                                    }}
                                    className="min-h-10 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white"
                                >
                                    Usar como padrão
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsDefaultPromptDismissed(true)}
                                    className="min-h-10 rounded-xl px-3 text-xs font-bold text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-white/5"
                                >
                                    Agora não
                                </button>
                            </div>
                        </section>
                    )}

                    {bibleMatch && (
                        <button
                            type="button"
                            onClick={handleDirectBibleSelection}
                            className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl bg-[#063f54] px-5 py-3 text-left text-white shadow-sm transition hover:bg-[#053647] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                        >
                            <span className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><BookOpen size={19} /></span>
                                <span>
                                    <small className="block text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">Acesso direto</small>
                                    <strong className="block text-lg">Ler {bibleMatch.formatted}</strong>
                                </span>
                            </span>
                            <ChevronRight size={20} />
                        </button>
                    )}

                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
                        <section aria-label="Livros da Bíblia" className="min-w-0">
                            <div
                                className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
                                aria-label="Filtros dos livros bíblicos"
                            >
                                <div className="min-w-0">
                                  <div className="mb-2 flex min-h-5 items-center justify-between gap-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5f6f86] dark:text-gray-400">Coleções bíblicas</p>
                                    {(searchTerm.trim() || activeCollection !== "all" || activeCategory !== "all") && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSearchTerm("");
                                          setActiveCollection("all");
                                          setActiveCategory("all");
                                        }}
                                        className="module-focus rounded-md px-1.5 py-0.5 text-[11px] font-bold text-[#0b5c48] hover:underline dark:text-emerald-300"
                                      >
                                        Todos os livros
                                      </button>
                                    )}
                                  </div>
                                  <div
                                    role="tablist"
                                    aria-label="Testamentos e cânon bíblico"
                                    className="flex min-w-0 gap-2 overflow-x-auto pb-1 no-scrollbar"
                                  >
                                    {BIBLE_COLLECTIONS.filter((collection) => collection.id !== "all").map((collection) => {
                                        const active = activeCollection === collection.id;
                                        const bookTone = collection.id === "old"
                                            ? "border-amber-700 bg-gradient-to-br from-amber-700 to-amber-950 text-amber-100"
                                            : collection.id === "new"
                                                ? "border-emerald-700 bg-gradient-to-br from-emerald-600 to-emerald-950 text-emerald-100"
                                                : "border-violet-700 bg-gradient-to-br from-violet-600 to-fuchsia-950 text-violet-100";
                                        return (
                                            <button
                                                key={collection.id}
                                                type="button"
                                                role="tab"
                                                aria-selected={active}
                                                aria-controls="bible-books-grid"
                                                onClick={() => {
                                                    setActiveCollection(collection.id);
                                                    setActiveCategory("all");
                                                }}
                                                className={`module-focus group flex min-h-14 shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${active
                                                    ? "border-[#a66d36] bg-[#fff8eb] text-[#5b3518] shadow-sm ring-2 ring-[#c88a45]/20 dark:border-[#c9a45c] dark:bg-[#c9a45c]/10 dark:text-[#f2d996]"
                                                    : "border-[#ded8d0] bg-white text-[#42516c] hover:border-[#a66d36] dark:border-white/10 dark:bg-white/[0.035] dark:text-gray-300 dark:hover:border-[#c9a45c]"
                                                    }`}
                                            >
                                                <span aria-hidden="true" className={`relative flex h-10 w-8 shrink-0 items-center justify-center rounded-r-md rounded-l-sm border shadow-sm ${bookTone}`}>
                                                    <span className="absolute inset-y-0 left-1 w-px bg-white/30" />
                                                    <BookOpen size={15} />
                                                </span>
                                                <span className="whitespace-nowrap text-xs font-bold">{collection.label}</span>
                                            </button>
                                        );
                                    })}
                                  </div>
                                </div>

                                <div className="w-full shrink-0 sm:w-52 lg:pb-1">
                                    <label
                                        htmlFor="bible-category-filter"
                                        className="mb-4 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#5f6f86] dark:text-gray-400"
                                    >
                                        Categoria
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="bible-category-filter"
                                            aria-label="Categoria dos livros"
                                            aria-controls="bible-books-grid"
                                            value={activeCategory}
                                            onChange={(event) => setActiveCategory(event.target.value as BookCategoryId)}
                                            className="module-focus min-h-11 w-full appearance-none rounded-xl border border-[#ded8d0] bg-white py-2 pl-3.5 pr-10 text-sm font-bold text-[#42516c] transition hover:border-[#a66d36] dark:border-white/10 dark:bg-[#17202b] dark:text-gray-200 dark:hover:border-[#c9a45c]"
                                        >
                                            {BOOK_CATEGORIES.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#74451f] dark:text-[#c9a45c]"
                                            size={17}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div
                                id="bible-books-grid"
                                data-testid="bible-books-grid"
                                className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4"
                            >
                                {filteredBooks.map((book, index) => {
                                    const progress = getBookProgress(book.id);
                                    const chapterCount = BOOK_CHAPTER_COUNTS[book.id] || 1;
                                    return (
                                        <button
                                            key={book.id}
                                            type="button"
                                            data-testid={`bible-book-${book.id}`}
                                            onClick={() => onSelectBook(book.id)}
                                            className="group relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl border border-[#e5e0da] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:min-h-[182px] sm:p-5 dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-emerald-500/60"
                                        >
                                            <span className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-medium ${BOOK_TONES[index % BOOK_TONES.length]}`}>
                                                {getBookAbbreviation(book.id, book.name)}
                                            </span>
                                            <strong className="mt-4 block text-base text-[#0b2347] dark:text-white">{book.name}</strong>
                                            <span className="mt-1 line-clamp-2 text-xs leading-5 text-[#4f6380] dark:text-gray-400">{book.subtitle}</span>
                                            <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px] text-gray-500">
                                                <span>{chapterCount} capítulo{chapterCount === 1 ? "" : "s"}</span>
                                                <ChevronRight className="transition group-hover:translate-x-0.5 group-hover:text-emerald-700" size={16} />
                                            </span>
                                            {progress > 0 && (
                                                <span className="absolute inset-x-0 bottom-0 h-1 bg-[#ece8e2] dark:bg-white/10">
                                                    <span
                                                        className={`block h-full ${progress === 100 ? "bg-emerald-500" : "bg-[#096a52]"}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {filteredBooks.length === 0 && (
                                <div className="mt-5 rounded-2xl border border-dashed border-[#dcd6cf] bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-white/[0.025]">
                                    <BookOpen className="mx-auto text-gray-300" size={42} />
                                    <h3 className="mt-4 font-bold text-[#0b2347] dark:text-white">Nenhum livro encontrado</h3>
                                    <p className="mt-1 text-sm text-gray-500">Tente buscar por outro nome ou referência.</p>
                                </div>
                            )}
                        </section>

                        <aside
                            data-testid="bible-reading-summary"
                            aria-labelledby="reading-summary-title"
                            className="overflow-hidden rounded-2xl border border-[#e4ded5] bg-white p-4 xl:sticky xl:top-[105px] dark:border-white/10 dark:bg-white/[0.035]"
                        >
                            <h2 id="reading-summary-title" className="px-1 pb-4 text-xl font-black text-[#0b2347] dark:text-white">Sua leitura</h2>

                            <section
                                data-testid="bible-continue-reading"
                                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#062a4e] via-[#073b4c] to-[#075b4a] p-5 text-white"
                            >
                                <div className="pointer-events-none absolute -bottom-10 -right-8 h-36 w-36 rounded-full border border-emerald-200/10" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                                    {hasReadingHistory ? "Continuar leitura" : "Começar leitura"}
                                </p>
                                <h3 className="mt-3 font-serif text-3xl">{lastBook.name} {lastReading.chapter}</h3>
                                <div className="mt-5 flex items-center gap-3">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(lastBookProgress, hasReadingHistory ? 4 : 0)}%` }} />
                                    </div>
                                    <span className="text-xs font-bold">{lastBookProgress}%</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectBook(lastBook.id, lastReading.chapter)}
                                    className="relative mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    <BookOpen size={17} /> {hasReadingHistory ? "Continuar" : "Começar"}
                                </button>
                            </section>

                            <div className="divide-y divide-[#ede8e2] dark:divide-white/10">
                                <section className="py-5">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><BookMarked size={18} /></span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Plano em andamento</h3>
                                            <p className="mt-2 truncate font-serif text-base text-[#193557] dark:text-gray-100">
                                                {readingPlan?.isActive ? "Plano de leitura" : "Defina sua meta de leitura"}
                                            </p>
                                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e8e4df] dark:bg-white/10">
                                                <div className="h-full rounded-full bg-[#08765a]" style={{ width: `${planProgress}%` }} />
                                            </div>
                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                <span className="text-xs text-gray-500">
                                                    {readingPlan?.isActive ? `${completedPlanDays} de ${planDuration} dias` : "Ainda não configurado"}
                                                </span>
                                                <button type="button" onClick={() => navigate("/plano")} className="min-h-9 text-xs font-bold text-[#0b5c48] hover:underline dark:text-emerald-300">
                                                    {readingPlan?.isActive ? "Continuar" : "Configurar"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="py-5">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><Sun size={18} /></span>
                                        <div>
                                            <h3 className="text-sm font-bold text-violet-700 dark:text-violet-300">Verso do dia</h3>
                                            <blockquote className="mt-2 font-serif text-base leading-7 text-[#193557] dark:text-gray-200">“{verseOfDay.text}”</blockquote>
                                            <p className="mt-2 text-xs font-bold text-violet-700 dark:text-violet-300">{verseOfDay.ref}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid grid-cols-3 gap-2 py-5 text-center" aria-label="Resumo da sua constância">
                                    <div>
                                        <strong className="block text-sm text-[#0b2347] dark:text-white">{NUMBER_FORMAT.format(userProfile?.stats?.daysStreak || 0)}</strong>
                                        <span className="text-[10px] text-gray-500">dias</span>
                                    </div>
                                    <div className="border-x border-[#ede8e2] dark:border-white/10">
                                        <strong className="block text-sm text-[#0b2347] dark:text-white">{NUMBER_FORMAT.format(userProfile?.lifetimeXp || 0)}</strong>
                                        <span className="text-[10px] text-gray-500">Maná</span>
                                    </div>
                                    <div>
                                        <strong className="block text-sm text-[#0b2347] dark:text-white">{NUMBER_FORMAT.format(userProfile?.stats?.totalChaptersRead || 0)}</strong>
                                        <span className="text-[10px] text-gray-500">capítulos</span>
                                    </div>
                                </section>

                                <section className="flex items-center justify-between gap-3 pt-4 text-xs">
                                    <span className="font-semibold text-[#d9480f]">{NUMBER_FORMAT.format(userProfile?.stats?.totalNotes || 0)} notas</span>
                                    <span className="font-semibold text-amber-700 dark:text-amber-300">{NUMBER_FORMAT.format(userProfile?.stats?.totalVersesMarked || 0)} marcados</span>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/historico")}
                                        className="flex min-h-9 items-center gap-1 font-bold text-[#0b5c48] hover:underline dark:text-emerald-300"
                                        aria-label="Abrir histórico"
                                    >
                                        <History size={15} /> <span className="sr-only">Histórico</span>
                                    </button>
                                </section>
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Library;
