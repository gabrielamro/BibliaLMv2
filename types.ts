
export type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold' | 'pastor' | 'admin';
export type MoodType = 'feliz' | 'grato' | 'paz' | 'cansado' | 'ansioso' | 'triste' | 'blessed' | 'thoughtful' | 'help' | 'fire';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type ContentType = 'study' | 'quiz' | 'plan' | 'room' | 'article' | 'track' | 'note';
export type BibleCategory = 'Pentateuco' | 'Históricos' | 'Poéticos' | 'Proféticos' | 'Evangelhos' | 'Epístolas' | 'Revelação' | 'Geral';
export type StudySource = 'leitura' | 'devocional' | 'chat' | 'podcast' | 'sermon' | 'geral' | 'plano' | 'modulo' | 'trilha';
export type ActionType = 'reading_chapter' | 'daily_goal' | 'devotional' | 'deep_study' | 'create_image' | 'share_content' | 'mark_verse' | 'create_sermon' | 'use_chat' | 'quiz_completion' | 'social_follow' | 'prayer_wall' | 'create_note' | 'social_like' | 'social_post' | 'start_module' | 'create_study' | 'join_plan' | 'create_evaluation' | 'finish_track' | 'collect_artifact' | 'social_interaction';
export type PlanScope = 'all' | 'new_testament' | 'old_testament';
export type PlanDuration = '7' | '30' | '90' | '180' | '365' | string;
export type PlanningFrequency = 'daily' | 'weekly' | 'monthly';

// --- NEW MODULES ---

export interface ReadingTrack {
  id: string;
  title: string;
  description: string;
  authorId: string; // 'system-ai' ou UID do pastor
  authorName: string;
  churchId?: string; // Se for conteúdo local
  scope: 'global' | 'church' | 'personal';
  tags: string[];
  steps: TrackStep[];
  createdAt: string;
  completions?: number;
}

export interface TrackStep {
  id: string;
  bookId: string;
  chapter: number;
  verses?: string; // ex: "1-10"
  comment?: string; // Comentário pastoral ou da IA sobre este passo
  devotionalHtml?: string;
  commentAuthor?: 'pastor' | 'ai';
  videoUrl?: string; // Phase 3: Vídeos curtos do púlpito
  isCompleted?: boolean; // Estado local visual (não salvo no banco por enquanto para simplificar)
}

export interface GuidedPrayer {
  id: string;
  title: string;
  content: string; // HTML ou texto rico
  category: 'morning' | 'night' | 'anxiety' | 'warfare' | 'gratitude' | 'family' | 'general';
  authorId: string;
  authorName: string;
  generatedBy?: 'pastor' | 'ai'; // Adicionado para autoria
  churchId?: string;
  audioUrl?: string; // URL do Storage ou gerado via TTS
  isTemplate: boolean; // Se true, pode ser usado como base para gerar outros
  createdAt: string;
  likes?: number;
  shares?: number; // Adicionado para compartilhamentos
}

// --- METRICS ---
export interface ContentMetrics {
  views: number;
  shares: number;
  completions?: number;
  likes?: number;
}

// --- LANDING PAGE CMS ---
export interface LandingPageConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  featureSectionTitle: string;
  featureSectionDesc: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaButtonText: string;
}

// --- HOME DASHBOARD CMS (SANTUÁRIO) ---
export interface HomeConfig {
  hero: {
    type: 'verse_of_day' | 'custom';
    customTitle?: string;
    customSubtitle?: string;
    customImageUrl?: string;
    customLink?: string; // Route path
  };
  shortcuts: {
    devotional: { label: string; active: boolean };
    readingPlan: { label: string; active: boolean };
    activeJourneys: { label: string; active: boolean };
  };
  sections: {
    discovery: { active: boolean; title: string };
    profileWidget: { active: boolean };
    quickAccess: { active: boolean };
    prayerWidget: { active: boolean };
  };
  promoBanners: Banner[];
}

// --- WISDOM STREAM TYPES ---
export type FeedItemType = 'hero_reading' | 'devotional' | 'ranking_duel' | 'flash_quiz' | 'social_echo' | 'journey_continue' | 'creative_challenge' | 'plan_goal';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  priority: number;
  data: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'badge' | 'social';
  timestamp: string;
  read: boolean;
  link?: string;
  icon?: string;
}

// --- CMS TYPES ---
export interface Banner {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  active: boolean;
  priority: number;
  type: 'hero' | 'alert';
  createdAt?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  fontFamily: 'serif' | 'sans';
  lineHeight: 'normal' | 'relaxed';
  smartReadingMode?: boolean; // Novo campo
}

// --- WORKSPACE & CONTENT TYPES (GENESIS PROJECT) ---

export interface UserContent {
  id: string;
  authorId: string;
  authorName?: string;
  title: string;
  description?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isPublic: boolean;
  coverUrl?: string;
}

// --- STUDIOS / ARTICLES (Esboços) ---
export interface SavedStudy extends UserContent {
  userId?: string; // Deprecated: use authorId
  userName?: string; // Deprecated: use authorName
  userUsername?: string;
  userPhoto?: string;
  sourceText: string;
  analysis: string;
  userThoughts?: string;
  audioScript?: string;
  source: StudySource;
  publishedAt?: string;
  category?: string;
  serviceSchedule?: any[];
  metrics?: ContentMetrics;

  // Novos campos para o Púlpito 2.0
  presentationDate?: string; // ISO String para data do culto
  estimatedDuration?: number; // em minutos
  occasion?: string; // ex: "Culto de Jovens", "Santa Ceia"

  // Novos campos para o Estúdio Pastoral / Academia
  frequency?: 'daily' | 'weekly' | 'monthly';
  visibility?: 'public' | 'private_invite' | 'private';

  // Seguimento (Acompanhar)
  isFollowed?: boolean;
  refDayId?: string; // ID da aula/dia associado
  planId?: string; // ID do plano original
}

export interface PlanComment {
  id?: string;
  planId: string;
  dayId: string; // ID da aula/dia
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: string;
}

export interface Note extends UserContent {
  bookId: string;
  chapter: number;
  verse?: number;
  verses?: number[];
  content: string;
  sourceText?: string;
  userThoughts?: string;
}

// --- PLANS & ROOMS ---
export interface CustomPlan extends UserContent {
  category: string;
  weeks: PlanWeek[];
  privacyType: 'public' | 'followers' | 'church' | 'group';
  isRanked: boolean;
  churchId?: string;
  groupId?: string;
  subscribersCount: number;
  planningFrequency: PlanningFrequency;
  hasEvaluation?: boolean;
  evaluationId?: string;
  metrics?: ContentMetrics;

  // Novo sistema de Times
  teams: PlanTeam[];
  teamScores?: Record<string, number>;

  // Datas
  startDate?: string;
  endDate?: string;
  authorPhoto?: string;
}

export interface StudyModule {
  id: string;
  title: string;
  description: string;
  theme: string;
  durationDays: number;
  icon: string;
  days: StudyModuleDay[];
  currentDay: number;
  createdAt: string;
  status: StudyStatus;
}

export type StudyStatus = 'draft' | 'in_progress' | 'completed' | 'published' | 'archived';

export interface StudyModuleDay {
  day: number;
  title: string;
  shortDescription: string;
  baseVerses: string[];
  fullContent?: string;
  isCompleted?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userUsername: string;
  userPhotoURL?: string;
  type: 'image' | 'prayer' | 'reflection' | 'devotional' | 'quiz' | 'feeling' | 'cell_meeting' | 'podcast';
  content: string;
  likesCount: number;
  commentsCount: number;
  shares: number;
  likes: number;
  comments: number;
  saved: boolean;
  likedBy: string[];
  createdAt: string;
  time: string;
  location: string;
  imageUrl?: string;
  image?: string;
  title?: string;
  urgency?: 'low' | 'medium' | 'high';
  mood?: MoodType;
  destination?: 'global' | 'cell' | 'church';
  cellId?: string;
  cellName?: string;
  churchId?: string;
  isRepost?: boolean;
  originalPost?: { userUsername: string; };
}

export interface PostComment { id: string; postId: string; userId: string; userDisplayName: string; userPhotoURL?: string | null; content: string; createdAt: string; }
export interface PrayerRequest { id: string; userId: string; userName: string; userPhotoURL?: string; content: string; createdAt: string; intercessorsCount: number; intercessors: string[]; targetType: 'church' | 'cell' | 'global'; targetId: string; churchId: string; cellName?: string; }
export interface UserProfile {
  uid: string; email: string; displayName: string; photoURL: string | null; username: string;
  lifetimeXp: number; credits: number; badges: string[]; subscriptionTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'inactive'; subscriptionExpiresAt?: string | null;
  activityLog: UserActivity[]; stats: UserStats; lastReadingPosition?: ReadingPosition;
  usageToday?: UserUsage; city?: string; state?: string; phoneNumber?: string;
  cpf?: string; instagram?: string; facebook?: string; bio?: string;
  isProfilePublic?: boolean; slogan?: string; readingPlan?: PlanProgress;
  theme?: 'light' | 'dark';
  progress?: GlobalProgress;
  enrolledPlans?: string[]; // IDs dos planos que o usuário participa
  churchData?: {
    churchId: string;
    churchName: string;
    churchSlug: string;
    groupId?: string;
    groupName?: string;
    groupSlug?: string;
    parentGroupName?: string;
    teamColor?: string | null;
    isAnonymous?: boolean;
  };
  followersCount?: number; followingCount?: number;
}
export interface UserStats { totalChaptersRead: number; daysStreak: number; studiesCreated: number; totalDevotionalsRead: number; totalNotes: number; totalShares: number; totalImagesGenerated: number; totalChatMessages: number; totalSermonsCreated: number; totalVersesMarked: number; totalQuizzesCompleted: number; perfectQuizzes: number; rankedHighScore?: number; }
export interface UserActivity { id: string; type: ActionType; description: string; timestamp: string; meta?: any; }
export interface ReadingPosition { bookId: string; chapter: number; verse: number; }
export interface UserUsage { date: string; imagesCount: number; podcastsCount: number; analysisCount: number; chatCount: number; }
export interface PlanProgress { isActive: boolean; planType: PlanDuration; planScope: PlanScope; completedDays: number[]; completedSections: { [key: number]: number[] }; lastChapterInSection: { [key: number]: { [key: number]: number } }; lastReadingDate: string; streak: number; startDate: string; notificationsEnabled: boolean; notificationTime: string; studyRoutine?: StudyTask[]; dailyRoutines?: { [key: number]: StudyTask[] }; }
export interface StudyTask { id: string; label: string; isCompleted: boolean; }
export interface GlobalProgress { readChapters: Record<string, number[]>; lastActiveBookId?: string; lastActiveChapter?: number; }

export interface PlanTeamMember {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  username: string;
}

export interface PlanTeam {
  id: string;
  name: string;
  color: string; // Hex ou classe Tailwind
  members: PlanTeamMember[]; // Lista de membros definidos pelo pastor
}

// --- PLANS & ROOMS ---
// --- SUBSCRIPTIONS ---
export interface SubscriptionPlan { id: SubscriptionTier; name: string; price: number; priceAnnual: number; limits: { images: number; podcasts: number; analysis: number; chat: number; }; benefits: string[]; recommended?: boolean; }

export interface PlanWeek { id: string; title: string; days: PlanDayContent[]; }
export interface PlanDayContent {
  id: string;
  title: string;
  description?: string;
  htmlContent: string;
  isCompleted?: boolean;
  startDate?: string;
  endDate?: string;
  refData?: {
    bookId: string;
    chapter: number;
    startVerse: number;
    endVerse?: number;
    formatted: string;
  };
  blocksConfig?: any[];
  tags?: string[];
  category?: string;
}

export interface PlanParticipant {
  uid: string;
  displayName: string;
  photoURL?: string;
  username: string;
  points: number;
  completedSteps: string[];
  joinedAt: string;
  lastActivityAt: string;
  team?: string; // ID do time (agora obrigatório se o plano for rankeado)
  status: 'active' | 'blocked' | 'banned';
}

// --- TRACKS (TRILHAS) ---
export interface Track {
  id: string;
  title: string;
  description: string;
  authorId: string;
  generatedBy?: 'pastor' | 'ai'; // Adicionado para autoria
  coverUrl?: string;
  tags: string[];
  items: TrackItem[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  metrics?: ContentMetrics; // Usar likes e shares de ContentMetrics
}

export interface TrackItem {
  id: string;
  refId?: string; // ID do objeto referenciado (study, plan, post)
  type: 'study' | 'plan' | 'post' | 'reading';
  title: string;
  subtitle?: string;
  contentPreview?: string; // Texto curto para uso em IA
  devotionalHtml?: string;
  commentAuthor?: 'pastor' | 'ai';
  videoUrl?: string;
  bookId?: string;
  chapter?: number;
  verses?: string;
}

// --- LMS / EVALUATION TYPES ---
export interface StudyEvaluation {
  id?: string;
  planId: string;
  authorId: string;
  title: string;
  description?: string;
  timeLimitMinutes: number; // 0 = sem limite
  passingScore?: number; // 0-100
  questions: StudyQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
}

// --- CUSTOM QUIZ (JOGOS) ---
export interface CustomQuiz {
  id: string;
  authorId: string;
  title: string;
  description: string;
  type: 'ai_generated' | 'manual';
  gameMode: 'classic' | 'infinite';

  // AI Config
  aiConfig?: {
    theme: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount: number; // 0 = infinito (se gameMode = infinite)
  };

  // Manual Config
  questions?: QuizQuestion[];

  isActive: boolean;
  createdAt: string;
}

export interface Badge { id: string; name: string; description: string; icon: string; category: 'level' | 'achievement' | 'streak' | 'supporter' | 'event'; requirement?: number; requirementStat?: keyof UserStats; color: string; }
export interface Verse { number: number; text: string; }
export interface Chapter { number: number; verses: Verse[]; }
export interface Book { id: string; name: string; testament: 'old' | 'new' | 'apocryphal'; chapters: Chapter[]; }
export interface Devotional { date: string; title: string; verseReference: string; verseText: string; content: string; prayer: string; }
export interface QuizQuestion { id: number; question: string; options: string[]; correctIndex: number; explanation: string; reference: string; }
export interface ChatMessage { id: string; role: 'user' | 'model'; content: string; }

export interface SEOSettings {
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string;
  ogImage?: string;
  twitterHandle?: string;
}

export interface SystemSettings {
  general: { maintenanceMode: boolean; welcomeMessage: string; aiKillSwitch?: boolean };
  seo?: SEOSettings;
  gamification: {
    xpReadingChapter: number;
    xpDailyGoal: number;
    xpDevotional: number;
    xpCreateStudy: number;
    xpShare: number;
    xpMarkVerse: number;
    xpCreateImage: number;
    xpUseChat: number;
    xpCreateSermon: number;
  };
  links: { pixKey: string; supportUrl: string };
  costs: { imageGen: number; podcastGen: number; deepAnalysis: number; captionGen: number; sermonGen: number };
  limits: { freeImages: number; freePodcasts: number; dailyFreeChat: number };
  subscription: { prices: { bronzeMonthly: number; bronzeAnnual: number; silverMonthly: number; silverAnnual: number; goldMonthly: number; goldAnnual: number; }; promo: { active: boolean; title: string; description: string; color: string }; };
  featuresMatrix?: Record<SubscriptionTier, PlanFeatures>;
  featureFlags?: FeatureFlag[];
}
export interface FeatureFlag { id: string; key: string; label: string; description: string; isEnabled: boolean; rolloutPercentage: number; }
export interface PlanFeatures { aiChatAccess: boolean; aiImageGen: boolean; aiPodcastGen: boolean; aiDeepAnalysis: boolean; aiSermonBuilder: boolean; aiNoteImprovement: boolean; aiSocialCaptions: boolean; churchFoundation: boolean; churchAdminPanel: boolean; cellCreation: boolean; muralPosting: boolean; teamCompetition: boolean; socialFeedRead: boolean; socialFeedPost: boolean; globalHighlight: boolean; followingSystem: boolean; profileCustomization: boolean; readingPlans: boolean; audioNarration: boolean; unlimitedNotes: boolean; achievementBadges: boolean; advancedSearch: boolean; focusMode: boolean; customThemes: boolean; noAds: boolean; }
export interface Church { id: string; name: string; acronym: string; slug: string; denomination: string; location: { city: string; state: string; address: string }; stats: { memberCount: number; totalMana: number; totalChaptersRead: number; totalStudiesCreated: number; followersCount?: number }; teams: string[]; teamScores: Record<string, number>; admins: string[]; logoUrl?: string; pastorName?: string; churchSlug?: string; }
export interface ChurchGroup { id: string; churchId: string; parentGroupId?: string; name: string; slug: string; stats: { memberCount: number; totalMana: number }; leaderName?: string; leaderUid?: string; createdBy: string; createdAt: string; }
export interface DailyReading { day: number; dateDisplay: string; readings: ReadingSection[]; }
export interface ReadingSection { section: string; bookId: string; name: string; ref: string; startChapter: number; endChapter: number; }
export interface SystemLog { id: string; type: 'error' | 'user_report' | 'admin_action'; message?: string; description?: string; stack?: string; timestamp: string; url: string; userAgent: string; userId?: string; severity?: 'low' | 'medium' | 'high'; action?: string; target?: string; details?: string; }
export interface SupportTicket { id: string; userId: string; userEmail: string; userName: string; subject: string; message: string; status: 'open' | 'closed' | 'pending'; createdAt: string; response?: string; }
export interface ReportTicket { id: string; type: 'post' | 'comment' | 'user'; targetId: string; reporterId: string; reason: string; status: 'pending' | 'resolved' | 'dismissed'; createdAt: string; contentSnapshot?: string; }
export interface AIUsageStats { date: string; totalTokens: number; costEstimate: number; requests: { chat: number; images: number; podcasts: number; analysis: number; }; }
export interface AnalyticsMetric { label: string; value: number; change: number; trend: 'up' | 'down' | 'neutral'; }
export interface FunnelStep { step: string; count: number; dropOff: number; }
