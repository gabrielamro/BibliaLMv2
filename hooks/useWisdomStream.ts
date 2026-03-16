"use client";


import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { StudyModule, UserProfile, Post, PrayerRequest } from '../types';
import { BIBLE_BOOKS_LIST } from '../constants';

export interface WisdomData {
    loading: boolean;
    dailyState: {
        devotionalDone: boolean;
        lastBookId?: string;
        lastChapter?: number;
        readingProgress: number; // 0-100
        streak: number;
    };
    activeJourneys: StudyModule[];
    discoveryItems: Array<{
        id: string;
        type: 'ranking_duel' | 'social_echo' | 'flash_quiz' | 'creative_challenge' | 'trending_post';
        data: any;
    }>;
    prayerAlert: PrayerRequest | null;
}

export const useWisdomStream = (): WisdomData => {
    const { currentUser, userProfile, notifications } = useAuth();
    const [data, setData] = useState<WisdomData>({
        loading: true,
        dailyState: { devotionalDone: false, readingProgress: 0, streak: 0 },
        activeJourneys: [],
        discoveryItems: [],
        prayerAlert: null
    });

    useEffect(() => {
        if (!currentUser || !userProfile) {
            setData(prev => ({ ...prev, loading: false }));
            return;
        }

        const buildDashboardData = async () => {
            // 1. DAILY STATE
            const today = new Date().toLocaleDateString('pt-BR');
            const devotionalDone = !!localStorage.getItem(`amen_${today}`);

            const lastBookId = userProfile.progress?.lastActiveBookId;
            const lastChapter = userProfile.progress?.lastActiveChapter || 1;
            let readingProgress = 0;

            if (lastBookId) {
                // Mock total chapters logic (idealmente viria de constants)
                const totalChapters = 50; // Simplificação para cálculo visual
                const readCount = (userProfile.progress?.readChapters?.[lastBookId] || []).length;
                readingProgress = Math.min(100, Math.round((readCount / totalChapters) * 100));
            }

            // 2. ACTIVE JOURNEYS
            let activeModules: StudyModule[] = [];
            try {
                // TODO: 'study_modules' table does not exist in Supabase yet.
                // Using an empty array or mocking data here until the backend is fully implemented.
                // const modules = await dbService.getAll(currentUser.uid, 'study_modules') || [];
                // activeModules = (modules as StudyModule[])
                //     .filter(m => m && m.status === 'in_progress')
                //     .slice(0, 5); // Limit to 5 active
                activeModules = [];
            } catch (e: any) {
                if (!e?.message?.includes('schema cache')) {
                    console.error("Error fetching modules", e?.message || e);
                }
            }
            // 3. PROPOSTA 1: PRAYER ALERT (Mural de Intercessão)
            let prayerAlert: PrayerRequest | null = null;
            if (userProfile.churchData?.churchId) {
                try {
                    prayerAlert = await dbService.getLatestCommunityPrayer(userProfile.churchData.churchId);
                } catch (e) { }
            }

            // 4. DISCOVERY STREAM (Social, Gamification, Challenges)
            const discoveryItems: WisdomData['discoveryItems'] = [];

            // 4.1 Proposta 2: Trending Post (Ecos do Reino)
            try {
                const trendingPost = await dbService.getTrendingPost();
                if (trendingPost) {
                    discoveryItems.push({
                        id: `trending-${trendingPost.id}`,
                        type: 'trending_post',
                        data: trendingPost
                    });
                }
            } catch (e) { }

            // 4.2 Ranking Duel (Se houver rival)
            try {
                const globalRanking = await dbService.getGlobalRanking();
                const myIndex = globalRanking.findIndex(u => u.uid === currentUser.uid);
                if (myIndex > 0) {
                    const rival = globalRanking[myIndex - 1];
                    discoveryItems.push({
                        id: 'ranking-duel',
                        type: 'ranking_duel',
                        data: {
                            rivalName: rival.displayName,
                            diff: (rival.lifetimeXp || 0) - (userProfile.lifetimeXp || 0)
                        }
                    });
                }
            } catch (e) { }

            // 4.3 Flash Quiz (Se não jogou hoje)
            const playedQuizToday = false; // Implementar check real futuramente
            if (!playedQuizToday) {
                discoveryItems.push({
                    id: 'flash-quiz',
                    type: 'flash_quiz',
                    data: {
                        question: "Quem foi o sucessor de Moisés?",
                        options: ["Josué", "Calebe", "Arão", "Hur"],
                        correctIndex: 0,
                        xpReward: 15
                    }
                });
            }

            // 4.4 Social Snippets
            const socialNotifs = notifications.filter(n => !n.read && n.type === 'social').slice(0, 1);
            if (socialNotifs.length > 0) {
                discoveryItems.push({
                    id: 'social-echo',
                    type: 'social_echo',
                    data: {
                        message: socialNotifs[0].message,
                        count: notifications.filter(n => !n.read).length
                    }
                });
            }

            // 4.5 Creative Challenge (Random)
            if (Math.random() > 0.5) {
                discoveryItems.push({
                    id: 'creative-challenge',
                    type: 'creative_challenge',
                    data: {}
                });
            }

            setData({
                loading: false,
                dailyState: {
                    devotionalDone,
                    lastBookId,
                    lastChapter,
                    readingProgress,
                    streak: userProfile.stats?.daysStreak || 0
                },
                activeJourneys: activeModules,
                discoveryItems,
                prayerAlert
            });
        };

        buildDashboardData();
    }, [currentUser, userProfile, notifications]);

    return data;
};
