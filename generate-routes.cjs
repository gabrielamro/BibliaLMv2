const fs = require('fs');
const path = require('path');

const routesConfig = `
                  <Route path="/intro" element={<LandingPage />} />
                  <Route path="/intro-v2" element={<LandingPageV2 />} />
                  <Route path="/apresentacao" element={<PresentationPage />} />
                  <Route path="/faith-tech" element={<FaithTechAIPage />} />
                  <Route path="/termos" element={<TermsPage />} />
                  <Route path="/privacidade" element={<PrivacyPage />} />
                  <Route path="/suporte" element={<SupportPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/s/:token" element={<SharedResolverPage />} />
                  <Route path="/v/:studyId" element={<PublicStudyPage />} />
                  <Route path="/p/:postId" element={<PostViewPage />} />
                  <Route path="/jornada/:planId" element={<PublicPlanPage />} />
                  <Route path="/biblia" element={<ReaderPage />} />
                  <Route path="/devocional" element={<DevotionalPage />} />
                  <Route path="/social/explore" element={<ExplorePage />} />
                  <Route path="/social/ferramentas" element={<KingdomToolsPage />} />
                  <Route path="/social" element={<SocialFeedPage />} />
                  <Route path="/social/artigos" element={<CommunityArticlesPage />} />
                  <Route path="/social/oracao" element={<PrayerRoomPage />} />
                  <Route path="/planos" element={<SubscriptionPage />} />
                  <Route path="/navegar" element={<DesktopNavigationPage />} />
                  <Route path="/regras" element={<RulesPage />} />
                  <Route path="/u/:username" element={<PublicUserProfilePage />} />
                  <Route path="/:username" element={<PublicUserProfilePage />} />
                  <Route path="/igreja/:churchSlug" element={<ChurchProfilePage />} />
                  <Route path="/social/igreja/:churchSlug" element={<ChurchProfilePage />} />
                  <Route path="/aluno" element={<StudentWorkspacePage />} />
                  <Route path="/oracoes" element={<GuidedPrayersPage />} />
                  <Route path="/trilhas" element={<TracksPage />} />
                  <Route path="/fonte-conhecimento" element={<KnowledgeSourcePage />} />
                  
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/estudio-criativo" element={<CreativeStudioPage />} />
                  <Route path="/estudo" element={<NotebookAnalysisPage />} />
                  <Route path="/quiz" element={<QuizPage />} />

                  <Route path="/" element={<ProtectedRoute><HomeDashboardPage /></ProtectedRoute>} />
                  <Route path="/biblia-dashboard" element={<ProtectedRoute><BibleDashboardPage /></ProtectedRoute>} />
                  <Route path="/plano" element={<ProtectedRoute><ReadingPlanDashboardPage /></ProtectedRoute>} />
                  <Route path="/plano/leitura" element={<ProtectedRoute><PlanReaderPage /></ProtectedRoute>} />
                  <Route path="/rotina" element={<ProtectedRoute><RoutinePage /></ProtectedRoute>} />
                  <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
                  <Route path="/historico" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
                  <Route path="/estudo/tematico" element={<ProtectedRoute><ThematicStudiesPage /></ProtectedRoute>} />
                  <Route path="/estudo/modulo/:moduleId" element={<ProtectedRoute><ModulePlayerPage /></ProtectedRoute>} />
                  <Route path="/criar-estudo" element={<ProtectedRoute><CreateStudyPage /></ProtectedRoute>} />
                  <Route path="/estudos/planos" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
                  <Route path="/workspace" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
                  <Route path="/estudos/livro/:bookId" element={<ProtectedRoute><BookStudyPage /></ProtectedRoute>} />
                  <Route path="/perfil" element={<ProtectedRoute><PublicUserProfilePage /></ProtectedRoute>} />
                  <Route path="/social/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                  <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>} />
                  
                  <Route path="/social/church" element={<ProtectedRoute><ChurchOnboardingPage /></ProtectedRoute>} />
                  <Route path="/social/u/:username" element={<ProtectedRoute><PublicUserProfilePage /></ProtectedRoute>} />
                  <Route path="/grupo/:cellSlug" element={<ProtectedRoute><CellForumPage /></ProtectedRoute>} />

                  <Route path="/workspace-pastoral" element={<ProtectedRoute><PastoralWorkspacePage /></ProtectedRoute>} />
                  <Route path="/trilhas/gerenciar" element={<ProtectedRoute><TracksManagerPage /></ProtectedRoute>} />
                  <Route path="/oracoes/gerenciar" element={<ProtectedRoute><PrayersManagerPage /></ProtectedRoute>} />
                  <Route path="/criador-jornada" element={<ProtectedRoute><PlanBuilderPage /></ProtectedRoute>} />
                  <Route path="/pulpito" element={<ProtectedRoute><PulpitDashboardPage /></ProtectedRoute>} />
                  <Route path="/pulpito/editor" element={<ProtectedRoute><SermonBuilderPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                  <Route path="/system-integrity" element={<ProtectedRoute><SystemIntegrityPage /></ProtectedRoute>} />
`;

const lines = routesConfig.split('\n');
const importMap = {
    ReaderPage: 'views/ReaderPage',
    StudyPlansPage: 'views/StudyPlansPage',
    BookStudyPage: 'views/BookStudyPage',
    CreateStudyPage: 'views/CreateStudyPage',
    DevotionalPage: 'views/DevotionalPage',
    NotesPage: 'views/NotesPage',
    ChatPage: 'views/ChatPage',
    UserProfilePage: 'views/UserProfilePage',
    CompleteProfilePage: 'views/CompleteProfilePage',
    NotebookAnalysisPage: 'views/NotebookAnalysisPage',
    QuizPage: 'views/QuizPage',
    ExplorePage: 'views/ExplorePage',
    ChurchOnboardingPage: 'views/ChurchOnboardingPage',
    ChurchProfilePage: 'views/public/ChurchProfilePage',
    CellForumPage: 'views/public/CellForumPage',
    PostViewPage: 'views/social/PostViewPage',
    SocialFeedPage: 'views/social/SocialFeedPage',
    KingdomToolsPage: 'views/social/KingdomToolsPage',
    SharedResolverPage: 'views/SharedResolverPage',
    SubscriptionPage: 'views/SubscriptionPage',
    AdminPage: 'views/AdminPage',
    RoutinePage: 'views/RoutinePage',
    HomeDashboardPage: 'views/HomeDashboardPage',
    PlanReaderPage: 'views/PlanReaderPage',
    ReadingPlanDashboardPage: 'views/ReadingPlanDashboardPage',
    SavedStudiesPage: 'views/SavedStudiesPage',
    WorkspacePage: 'views/WorkspacePage',
    LoginPage: 'views/LoginPage',
    BibleDashboardPage: 'views/BibleDashboardPage',
    ThematicStudiesPage: 'views/ThematicStudiesPage',
    ModulePlayerPage: 'views/ModulePlayerPage',
    PublicStudyPage: 'views/public/PublicStudyPage',
    PlanBuilderPage: 'views/PlanBuilderPage',
    PastoralWorkspacePage: 'views/PastoralWorkspacePage',
    PublicPlanPage: 'views/public/PublicPlanPage',
    PublicUserPlansPage: 'views/public/PublicUserPlansPage',
    LandingPage: 'views/LandingPage',
    LandingPageV2: 'views/LandingPageV2',
    PresentationPage: 'views/PresentationPage',
    TermsPage: 'views/TermsPage',
    PrivacyPage: 'views/PrivacyPage',
    SupportPage: 'views/SupportPage',
    DesktopNavigationPage: 'views/DesktopNavigationPage',
    RulesPage: 'components/RulesPage',
    SystemIntegrityPage: 'views/SystemIntegrityPage',
    PublicUserProfilePage: 'views/public/PublicUserProfilePage',
    CreativeStudioPage: 'views/CreativeStudioPage',
    FaithTechAIPage: 'views/FaithTechAIPage',
    CommunityArticlesPage: 'views/CommunityArticlesPage',
    PrayerRoomPage: 'views/PrayerRoomPage',
    StudentWorkspacePage: 'views/StudentWorkspacePage',
    TracksManagerPage: 'views/TracksManagerPage',
    GuidedPrayersPage: 'views/GuidedPrayersPage',
    TracksPage: 'views/TracksPage',
    PrayersManagerPage: 'views/PrayersManagerPage',
    TimelinePage: 'views/TimelinePage',
    KnowledgeSourcePage: 'views/KnowledgeSourcePage',
    SermonBuilderPage: 'views/SermonBuilderPage',
    PulpitDashboardPage: 'views/PulpitDashboardPage'
};

const routeRegex = /<Route\s+path="([^"]+)"\s+element=\{([^}]+)\}/;

lines.forEach(line => {
    const match = line.match(routeRegex);
    if (!match) return;

    let routePath = match[1];
    if (routePath === '/' || routePath === '*' || routePath === '/intro') return;

    let elementContentStr = match[2];
    let elementContent = elementContentStr.trim();
    if (elementContent.endsWith("/>")) {
        // ok
    } else if (elementContent.endsWith(">") && elementContent.includes("</")) {
        // <ProtectedRoute><X /></ProtectedRoute> goes up to the closing tag wait, match[2] only matches till the first } which could break if there are nested {}
        // in our string there are no nested {} inside element={}, we just have element={<Comp />} or element={<Protect><Comp /></Protect>}
        // let's re-parse simply
    }

    let nextRoutePath = routePath.split('/').map(segment => {
        if (segment.startsWith(':')) {
            return `[${segment.substring(1)}]`;
        }
        return segment;
    }).join('/');

    if (nextRoutePath.startsWith('/')) nextRoutePath = nextRoutePath.substring(1);

    let dirPath = path.join(__dirname, 'app', nextRoutePath);
    try {
        fs.mkdirSync(dirPath, { recursive: true });
    } catch (e) { }

    let imports = [];
    let numLevels = nextRoutePath.split('/').filter(Boolean).length;
    let prefix = '../'.repeat(numLevels + 1); // Since we're in app/route/page.tsx, if route is "login" (1 level), we want ../../components

    if (elementContent.includes('ProtectedRoute')) {
        imports.push({ name: 'ProtectedRoute', path: prefix + 'components/ProtectedRoute' });
    }

    Object.keys(importMap).forEach(key => {
        if (elementContent.includes('<' + key)) {
            imports.push({ name: key, path: prefix + importMap[key] });
        }
    });

    let importStatements = imports.map(imp => `import ${imp.name} from '${imp.path}';`).join('\n');
    let fixTags = elementContent + (elementContent.endsWith("/>") || elementContent.endsWith("</ProtectedRoute>") ? "" : "</ProtectedRoute>");

    // We already have string matching accurately through regex, but just force clean tags
    let contentComp = fixTags;
    if (contentComp.startsWith("<ProtectedRoute>") && !contentComp.endsWith("</ProtectedRoute>")) {
        contentComp += "</ProtectedRoute>";
    }

    let fileContent = `"use client";\n\n${importStatements}\n\nexport default function Page() {\n  return (\n    ${contentComp}\n  );\n}\n`;
    fs.writeFileSync(path.join(dirPath, 'page.tsx'), fileContent, 'utf8');
    console.log('Created: ', dirPath);
});

console.log('Routes generated successfully.');
