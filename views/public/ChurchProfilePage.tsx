"use client";
import { useNavigate, useLocation, useParams, useSearchParams } from '../../utils/router';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import Link from "next/link";
import { dbService, uploadBlob } from '../../services/supabase';
import { cultoPlusService } from '../../services/cultoPlusService';
import { Church, UserProfile, ChurchGroup, PrayerRequest, GroupPrivacy, Post, ChurchService } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Loader2, MapPin, Users, Shield, ArrowLeft, Trophy, LogIn, 
  CheckCircle2, MessageSquareHeart, Heart, Send, Plus, 
  Home, Crown, Star, ChevronRight, Calendar, Info, Share2, 
  Flame, LayoutGrid, Award, Bell, Boxes, MessageSquare, Edit2, Trash2, AtSign, Zap, BookOpen, Brain, MapPinned,
  User as UserIcon, Search, X, Check, UserCheck, Camera, MoreHorizontal, UserCog, ChevronDown, CornerDownRight
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import SEO from '../../components/SEO';
import ConfirmationModal from '../../components/ConfirmationModal';
import PromptModal from '../../components/PromptModal';
import { addGroupInviteParticipant, removeGroupInviteParticipant } from '../../utils/groupInviteSelection';
import { normalizeUserSearchQuery, shouldSearchUsers } from '../../utils/userSearchQuery';
import { buildCreateContentShortcutUrl } from '../../utils/contentPrivacy';
import { generateSlug } from '../../utils/textUtils';
import { FeedPostCard } from '../../components/social/FeedPostCard';
import ChurchServicesPreview from '../../components/culto-plus/ChurchServicesPreview';
import CultoPlusPublicAgenda from '../../components/culto-plus/CultoPlusPublicAgenda';
import { isAdminProfile, isGeneralManager, isGeneralPastor } from '../../utils/profileAccess';

type ChurchMuralItem =
    | (PrayerRequest & { muralType?: 'prayer' })
    | (Post & { muralType: 'post' });

const getChurchServiceStatusLabel = (service: ChurchService, wasAttended: boolean) => {
    const now = new Date();
    const startsAt = new Date(service.startsAt);
    const endsAt = new Date(service.endsAt);
    const isFinished = service.status === 'finished' || service.status === 'archived' || now > endsAt;
    if (service.status === 'live' || (now >= startsAt && now <= endsAt)) return 'Ao vivo';
    if (isFinished && wasAttended) return 'Assistido';
    if (now < startsAt) return 'Agendado';
    return 'Participar';
};

const isFeedPostMuralItem = (item: ChurchMuralItem): item is Post & { muralType: 'post' } =>
    item.muralType === 'post';

const formatRuntimeError = (error: unknown) => {
    if (error instanceof Error) return error.message;
    try { return JSON.stringify(error); } catch { return String(error); }
};

// Novo componente para exibir reações como respostas
const ResponseList = ({ prayer }: { prayer: PrayerRequest }) => {
    if (!prayer.intercessors || prayer.intercessors.length === 0) return null;
    
    return (
        <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 space-y-2">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <CornerDownRight size={10} /> Intercessões do Grupo
            </p>
            <div className="flex flex-wrap gap-1.5">
                {prayer.intercessors.map((uid, idx) => (
                    <div key={`${uid}-${idx}`} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded-full border border-gray-100 dark:border-gray-800">
                        <span className="text-xs">🙏</span>
                        <span className="text-[10px] font-bold text-gray-500">Irmão</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PostMenu = ({ prayer, onEdit, onDelete }: { prayer: PrayerRequest, onEdit: (p: PrayerRequest) => void, onDelete: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);
    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-gray-600 p-2 transition-colors"><MoreHorizontal size={18}/></button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95">
                    <button onClick={() => { onEdit(prayer); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors">
                        <Edit2 size={14} className="text-bible-gold" /> Editar
                    </button>
                    <button onClick={() => { onDelete(prayer.id); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-xs font-bold text-red-500 transition-colors">
                        <Trash2 size={14} /> Excluir
                    </button>
                </div>
            )}
        </div>
    );
};

const ChurchProfilePage: React.FC = () => {
  const { churchSlug } = useParams<{ churchSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, recordActivity, openLogin, showNotification, earnMana, updateProfile } = useAuth();
  const { setTitle, resetHeader, setBreadcrumbs, setIsHeaderHidden } = useHeader();
  
  const [church, setChurch] = useState<Church | null>(null);
  const [groups, setGroups] = useState<ChurchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mural' | 'cultos' | 'groups'>('mural');
  const [prayers, setPrayers] = useState<ChurchMuralItem[]>([]);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [isServiceCalendarOpen, setIsServiceCalendarOpen] = useState(false);
  const [attendedServiceIds, setAttendedServiceIds] = useState<Set<string>>(new Set());
  const [newPrayer, setNewPrayer] = useState('');
  const [isPostingPrayer, setIsPostingPrayer] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (church) {
      setTitle(church.name);
      setBreadcrumbs([
        { label: 'O Reino', path: '/social' },
        { label: 'Igrejas' }
      ]);
      setIsHeaderHidden(true);
    }
    return () => resetHeader();
  }, [church, setTitle, resetHeader, setBreadcrumbs, setIsHeaderHidden]);
  
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [peoplePanel, setPeoplePanel] = useState<'members' | 'followers' | null>(null);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupLeader, setNewGroupLeader] = useState('');
  const [newGroupParentId, setNewGroupParentId] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<GroupPrivacy>('public');
  const [privateGroupParticipantQuery, setPrivateGroupParticipantQuery] = useState('');
  const [privateGroupParticipantResults, setPrivateGroupParticipantResults] = useState<UserProfile[]>([]);
  const [selectedPrivateGroupParticipants, setSelectedPrivateGroupParticipants] = useState<UserProfile[]>([]);
  const [isSearchingPrivateGroupParticipant, setIsSearchingPrivateGroupParticipant] = useState(false);
  const [leaderResults, setLeaderResults] = useState<UserProfile[]>([]);
  const [isSearchingLeader, setIsSearchingLeader] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<UserProfile | null>(null);
  const searchTimeoutRef = useRef<any>(null);
  const participantSearchTimeoutRef = useRef<any>(null);
  const isSavingGroupRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const [isRequestingResponsibility, setIsRequestingResponsibility] = useState(false);
  const [responsibilityRequestStatus, setResponsibilityRequestStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [isJoiningChurch, setIsJoiningChurch] = useState(false);
  const [isLeavingChurch, setIsLeavingChurch] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Modal States
  const [prayerToEdit, setPrayerToEdit] = useState<PrayerRequest | null>(null);
  const [prayerToDelete, setPrayerToDelete] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<ChurchGroup | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isEditingPastor, setIsEditingPastor] = useState(false);

  const isSocialMode = location.pathname.startsWith('/social');
  const basePath = isSocialMode ? '/social' : '';
  const currentUserId = currentUser?.uid || currentUser?.id;
  const latestServicePosts = useMemo(
    () => prayers
      .filter((item): item is Post & { muralType: 'post' } => isFeedPostMuralItem(item) && Boolean(item.serviceId))
      .slice(0, 3),
    [prayers]
  );
  const visibleServices = useMemo(() => {
      const now = new Date();
      return services.filter((service) => {
          const isFinished = service.status === 'finished' || service.status === 'archived' || now > new Date(service.endsAt);
          return !isFinished || attendedServiceIds.has(service.id);
      });
  }, [services, attendedServiceIds]);

  const loadChurchData = useCallback(async () => {
      if (!churchSlug) return;
      const decodedSlug = decodeURIComponent(churchSlug);
      setLoading(true);
      try {
          const data = await dbService.getChurchBySlug(decodedSlug);
          if (data) {
              setChurch(data);
              
              if (currentUser) {
                  dbService.checkIsFollowing(currentUser.uid, data.id).then(setIsFollowing).catch(() => {});
              }

              try {
                  const counts = await dbService.getChurchCommunityCounts(data.id);
                  setChurch(current => current ? {
                      ...current,
                      stats: {
                          ...current.stats,
                          memberCount: counts.memberCount,
                          followersCount: counts.followersCount,
                      }
                  } : current);
              } catch (err) { console.error("Erro ao carregar contadores da igreja:", formatRuntimeError(err)); }

              // Carregamento resiliente (try/catch individuais para não quebrar a página toda se um índice faltar)
              try {
                  const loadedGroups = await dbService.getChurchRootGroups(data.id);
                  setGroups(loadedGroups);
              } catch (err) { console.error("Erro ao carregar grupos:", formatRuntimeError(err)); }

              try {
                  const loadedPrayers = await dbService.getUnifiedChurchMural(data.id) as ChurchMuralItem[];
                  setPrayers(loadedPrayers);
              } catch (err: any) { 
                  console.error("Erro ao carregar mural (possivel falta de indice):", formatRuntimeError(err));
                  if (err.code === 'failed-precondition' || err.message.includes('index')) {
                      // Silently fail or log for admin - functionality unavailable until index built
                  }
              }

              try {
                  const loadedServices = await cultoPlusService.getServicesByChurch(data.id, { limit: 6 });
                  setServices(loadedServices);
                  if (currentUserId) {
                      const attendance = await Promise.all(
                          loadedServices.map(async (service) => [
                              service.id,
                              await cultoPlusService.hasCheckedIn(service.id, currentUserId),
                          ] as const)
                      );
                      setAttendedServiceIds(new Set(attendance.filter(([, attended]) => attended).map(([serviceId]) => serviceId)));
                  } else {
                      setAttendedServiceIds(new Set());
                  }
              } catch (err) {
                  console.error("Erro ao carregar cultos:", formatRuntimeError(err));
              }
          }
      } catch (e) { 
          console.error("Erro critico ao carregar igreja:", formatRuntimeError(e)); 
      } finally { 
          setLoading(false); 
      }
  }, [churchSlug, currentUser, currentUserId]);

  useEffect(() => {
    loadChurchData();
  }, [loadChurchData]);

  const loadCommunityLists = async () => {
      if (!church) return;
      setLoadingPeople(true);
      try {
          const [mList, fList] = await Promise.all([
              dbService.getChurchMembers(church.id),
              dbService.getChurchFollowers(church.id)
          ]);
          setMembers(mList);
          setFollowers(fList);
      } catch (e) { console.error(formatRuntimeError(e)); }
      finally { setLoadingPeople(false); }
  };

  useEffect(() => {
      if (peoplePanel && church) loadCommunityLists();
  }, [peoplePanel, church]);

  useEffect(() => {
    const searchVal = newGroupLeader.trim();
    if (shouldSearchUsers(searchVal)) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearchingLeader(true);
        try {
          const results = await dbService.searchUsersByUsername(normalizeUserSearchQuery(searchVal));
          setLeaderResults(results);
        } catch (e) {
          console.error("Error searching for leader:", formatRuntimeError(e));
        } finally {
          setIsSearchingLeader(false);
        }
      }, 500);
    } else {
      setLeaderResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [newGroupLeader]);

  useEffect(() => {
    if (newGroupPrivacy !== 'private') {
      setPrivateGroupParticipantQuery('');
      setPrivateGroupParticipantResults([]);
      return;
    }

    const searchVal = privateGroupParticipantQuery.trim();
    if (shouldSearchUsers(searchVal)) {
      if (participantSearchTimeoutRef.current) clearTimeout(participantSearchTimeoutRef.current);
      participantSearchTimeoutRef.current = setTimeout(async () => {
        setIsSearchingPrivateGroupParticipant(true);
        try {
          const results = await dbService.searchUsersByUsername(normalizeUserSearchQuery(searchVal));
          setPrivateGroupParticipantResults(results.filter(user => user.uid !== currentUserId));
        } catch (e) {
          console.error("Error searching private group participant:", formatRuntimeError(e));
        } finally {
          setIsSearchingPrivateGroupParticipant(false);
        }
      }, 500);
    } else {
      setPrivateGroupParticipantResults([]);
    }

    return () => {
      if (participantSearchTimeoutRef.current) clearTimeout(participantSearchTimeoutRef.current);
    };
  }, [currentUserId, newGroupPrivacy, privateGroupParticipantQuery]);

  const handleSelectLeader = (user: UserProfile) => {
    setSelectedLeader(user);
    setNewGroupLeader(user.displayName);
    setLeaderResults([]);
  };

  const handleSelectPrivateGroupParticipant = (user: UserProfile) => {
    setSelectedPrivateGroupParticipants(prev => addGroupInviteParticipant(prev, user));
    setPrivateGroupParticipantQuery('');
    setPrivateGroupParticipantResults([]);
  };

  const handleFollowToggle = async () => {
      if (!currentUser || !church) { openLogin(); return; }
      const previous = isFollowing;
      setIsFollowing(!previous);
      setChurch(current => current ? {
          ...current,
          stats: {
              ...current.stats,
              followersCount: Math.max(0, (current.stats.followersCount || 0) + (previous ? -1 : 1))
          }
      } : current);
      try {
          if (previous) {
              await dbService.unfollowChurch(currentUser.uid, church.id);
          } else {
              await dbService.followChurch(
                  currentUser.uid, 
                  church.id, 
                  { displayName: userProfile?.displayName, photoURL: userProfile?.photoURL, username: userProfile?.username },
                  { name: church.name, slug: church.slug, logoUrl: church.logoUrl }
              );
              await earnMana('social_follow');
              showNotification(`Você está seguindo ${church.name}`, "success");
          }
      } catch (e) {
          setIsFollowing(previous);
          setChurch(current => current ? {
              ...current,
              stats: {
                  ...current.stats,
                  followersCount: Math.max(0, (current.stats.followersCount || 0) + (previous ? 1 : -1))
              }
          } : current);
      }
  };

  const isMember = userProfile?.churchData?.churchId === church?.id;
  const isOwner = currentUserId && church?.admins?.includes(currentUserId);
  const churchFullAddress = [
      church?.location?.address,
      church?.location?.city,
      church?.location?.state,
  ].filter(Boolean).join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(churchFullAddress || church?.name || '')}`;

  const handleJoinChurch = async () => {
      if (!church) return;
      if (!currentUserId) {
          openLogin(location.pathname);
          showNotification('Entre para marcar que voce e membro desta igreja.', 'info');
          return;
      }
      setIsJoiningChurch(true);
      try {
          const resolvedChurch = await dbService.joinChurch(currentUserId, church as any);
          await updateProfile({
              churchData: {
                  churchId: resolvedChurch.id,
                  churchName: resolvedChurch.name,
                  churchSlug: resolvedChurch.slug,
                  isAnonymous: false,
              },
          });
          if (resolvedChurch.slug && resolvedChurch.slug !== church.slug) {
              navigate(`${basePath}/igreja/${resolvedChurch.slug}`);
          } else if (resolvedChurch.id !== church.id) {
              setChurch(resolvedChurch);
          }
          showNotification(`Voce agora esta vinculado a ${resolvedChurch.name}.`, 'success');
      } catch (error) {
          console.error(formatRuntimeError(error));
          showNotification('Nao foi possivel concluir o vinculo.', 'error');
      } finally {
          setIsJoiningChurch(false);
      }
  };

  const handleLeaveChurch = async () => {
      if (!church || !currentUserId) return;
      setIsLeavingChurch(true);
      try {
          await dbService.leaveChurch(currentUserId, church.id);
          await updateProfile({
              churchData: undefined,
          });
          showNotification(`Você deixou de ser membro de ${church.name}.`, 'success');
          setIsLeaveModalOpen(false);
      } catch (error) {
          console.error(formatRuntimeError(error));
          showNotification('Não foi possível desvincular da igreja.', 'error');
      } finally {
          setIsLeavingChurch(false);
      }
  };
  const isVisionary = userProfile?.subscriptionTier === 'gold';
  const requestedChurchRole = isAdminProfile(userProfile) ? 'admin' : 'pastor';
  const canRequestResponsibility = isMember && !isOwner && (isGeneralPastor(userProfile) || isGeneralManager(userProfile) || userProfile?.subscriptionTier === 'gold');
  const canChangeLogo = isOwner || isVisionary;
  const hasPendingResponsibilityRequest = responsibilityRequestStatus === 'pending';

  useEffect(() => {
      if (!church?.id || !currentUserId || !canRequestResponsibility) {
          setResponsibilityRequestStatus(null);
          return;
      }
      dbService.getChurchRoleRequest(currentUserId, church.id, requestedChurchRole)
          .then((request) => setResponsibilityRequestStatus((request?.status as typeof responsibilityRequestStatus) ?? null))
          .catch(() => setResponsibilityRequestStatus(null));
  }, [church?.id, currentUserId, canRequestResponsibility, requestedChurchRole]);

  const handleRequestResponsibility = async () => {
      if (!currentUser || !church) { openLogin(); return; }
      if (hasPendingResponsibilityRequest) {
          showNotification("Voce ja tem uma solicitacao pendente para esta igreja.", "info");
          return;
      }
      setIsRequestingResponsibility(true);
      try {
          await dbService.requestChurchResponsibility(currentUser.uid, church.id, requestedChurchRole);
          setResponsibilityRequestStatus('pending');
          showNotification("Solicitacao enviada. A equipe vai revisar o vinculo com a igreja.", "success");
      } catch (error) {
          const message = formatRuntimeError(error);
          if (message.includes('23505') || message.includes('church_role_requests_church_id_user_id_requested_role_key')) {
              setResponsibilityRequestStatus('pending');
              showNotification("Voce ja tem uma solicitacao pendente para esta igreja.", "info");
              return;
          }
          console.error(message);
          showNotification("Nao foi possivel enviar a solicitacao.", "error");
      } finally {
          setIsRequestingResponsibility(false);
      }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!church || !e.target.files?.[0]) return;
    setIsUpdatingLogo(true);
    try {
        const file = e.target.files[0];
        const path = `church_logos/${church.id}_${Date.now()}`;
        const url = await uploadBlob(file, path);
        await dbService.updateChurch(church.id, { logoUrl: url });
        setChurch({ ...church, logoUrl: url });
        showNotification("Foto da igreja atualizada!", "success");
    } catch (err) {
        showNotification("Erro ao atualizar foto.", "error");
    } finally {
        setIsUpdatingLogo(false);
    }
  };

  const handleUpdatePastor = async (newName: string) => {
    if (!church) return;
    try {
        await dbService.updateChurch(church.id, { pastorName: newName });
        setChurch({ ...church, pastorName: newName });
        showNotification("Liderança atualizada com sucesso!", "success");
    } catch (e) {
        showNotification("Erro ao atualizar liderança.", "error");
    }
  };

  const handlePostPrayer = async () => {
    if (!newPrayer.trim() || !currentUser || !church) return;
    setIsPostingPrayer(true);
    try {
        const prayerData: Omit<PrayerRequest, 'id'> = {
            userId: currentUser.uid,
            userName: userProfile?.displayName || 'Irmão',
            userPhotoURL: userProfile?.photoURL || undefined,
            content: newPrayer,
            createdAt: new Date().toISOString(),
            intercessorsCount: 0,
            intercessors: [],
            targetType: 'church',
            targetId: church.id,
            churchId: church.id
        };
        const id = await dbService.addPrayerRequest('church', church.id, prayerData);
        setPrayers(prev => [{ ...prayerData, id, muralType: 'prayer' }, ...prev]);
        setNewPrayer('');
        showNotification("Publicado!", "success");
        await recordActivity('prayer_wall', 'Postou no mural da igreja');
    } catch (error) {
        console.error("Erro ao publicar no mural:", formatRuntimeError(error));
        showNotification("Nao foi possivel publicar no mural.", "error");
    } finally {
        setIsPostingPrayer(false);
    }
  };

  const handleIntercede = async (prayer: PrayerRequest) => {
    if (!currentUser) { openLogin(); return; }
    const isInterceding = prayer.intercessors?.includes(currentUser.uid);
    
    setPrayers(prev => prev.map(p => {
        if (isFeedPostMuralItem(p)) return p;
        if (p.id === prayer.id) {
            const count = isInterceding ? (p.intercessorsCount - 1) : (p.intercessorsCount + 1);
            const list = isInterceding 
                ? p.intercessors.filter(id => id !== currentUser.uid)
                : [...(p.intercessors || []), currentUser.uid];
            return { ...p, intercessorsCount: count, intercessors: list };
        }
        return p;
    }));

    try {
        await dbService.togglePrayerIntercession(prayer.id, currentUser.uid, !!isInterceding);
        if (!isInterceding) {
            showNotification("Intercedendo!", "success");
        }
    } catch (e) { console.error(formatRuntimeError(e)); }
  };

  const handleEditPrayer = (prayer: PrayerRequest) => {
      setPrayerToEdit(prayer);
  };

  const confirmEditPrayer = async (newContent: string) => {
    if (!prayerToEdit) return;
    try {
        await dbService.updatePrayerRequest(prayerToEdit.id, newContent);
        setPrayers(prev => prev.map(p => p.id === prayerToEdit.id ? { ...p, content: newContent } : p));
        showNotification("Atualizado!", "success");
    } catch (e) { showNotification("Erro ao editar.", "error"); }
    setPrayerToEdit(null);
  };

  const handleDeletePrayer = (id: string) => {
      setPrayerToDelete(id);
  };

  const confirmDeletePrayer = async () => {
    if (!prayerToDelete) return;
    try {
        await dbService.deletePrayerRequest(prayerToDelete, { churchId: church?.id });
        setPrayers(prev => prev.filter(p => p.id !== prayerToDelete));
        showNotification("Mensagem removida.", "info");
    } catch (e) { showNotification("Erro ao excluir.", "error"); }
    setPrayerToDelete(null);
  };

  const handleCreateGroup = async () => {
      const currentUserId = currentUser?.uid || currentUser?.id;
      if (!newGroupName.trim() || !church || !currentUserId || isSavingGroupRef.current) return;
      isSavingGroupRef.current = true;
      setIsSavingGroup(true);
      try {
          const slug = church.slug + '-' + generateSlug(newGroupName);
          let finalLeaderName = newGroupLeader.trim() || "Liderança não definida";
          let leaderUid = selectedLeader?.uid || undefined;
          if (selectedLeader) finalLeaderName = selectedLeader.displayName;

          const groupData = {
              churchId: church.id,
              parentGroupId: newGroupParentId || undefined,
              name: newGroupName.trim(),
              slug,
              privacy: newGroupPrivacy,
              stats: { memberCount: 1, totalMana: 0 },
              leaderName: finalLeaderName,
              leaderUid,
              createdBy: currentUserId,
              createdAt: new Date().toISOString()
          };

          const id = await dbService.createCell(groupData);
          const createdGroup = { id, ...groupData } as ChurchGroup;
          
          if (!newGroupParentId) {
              setGroups(prev => [...prev, createdGroup]);
          }

          if (newGroupPrivacy === 'private' && userProfile && selectedPrivateGroupParticipants.length > 0) {
              try {
                  await Promise.all(
                      selectedPrivateGroupParticipants.map(participant =>
                          dbService.createGroupAccessInvite(createdGroup, participant, userProfile, 'invite')
                      )
                  );
              } catch (inviteError) {
                  console.error("Erro ao enviar convites do grupo privado:", formatRuntimeError(inviteError));
                  showNotification("Grupo criado, mas nao foi possivel enviar todos os convites.", "warning");
              }
          }
          
          setIsCreatingGroup(false);
          setNewGroupName('');
          setNewGroupLeader('');
          setNewGroupParentId('');
          setNewGroupPrivacy('public');
          setPrivateGroupParticipantQuery('');
          setPrivateGroupParticipantResults([]);
          setSelectedPrivateGroupParticipants([]);
          setSelectedLeader(null);
          showNotification("Grupo criado com sucesso!", "success");
      } catch (e) {
          console.error("Erro ao criar grupo:", formatRuntimeError(e));
          const message = formatRuntimeError(e);
          showNotification(message.includes('Ja existe') ? message : "Erro ao criar grupo.", "error");
      } finally {
          isSavingGroupRef.current = false;
          setIsSavingGroup(false);
      }
  };

  const handleDeleteGroup = async () => {
      if (!groupToDelete || isDeletingGroup) return;
      setIsDeletingGroup(true);
      try {
          await dbService.deleteCell(groupToDelete.id);
          setGroups(prev => prev.filter(group => group.id !== groupToDelete.id));
          showNotification("Grupo excluido.", "info");
      } catch (e) {
          console.error("Erro ao excluir grupo:", formatRuntimeError(e));
          showNotification("Erro ao excluir grupo.", "error");
      } finally {
          setIsDeletingGroup(false);
          setGroupToDelete(null);
      }
  };

  const handleJoinGroup = async (group: ChurchGroup) => {
      if (!currentUser) { openLogin(); return; }
      setLoading(true);
      try {
          await dbService.joinCell(currentUser.uid, group.id, { name: group.name, slug: group.slug });
          showNotification(`Bem-vindo ao grupo ${group.name}!`, "success");
          // Re-fetch groups to update status, but handle gracefully
          try {
            const updatedGroups = await dbService.getChurchRootGroups(church!.id);
            setGroups(updatedGroups);
          } catch(e) {}
      } catch (e) {
          showNotification("Erro ao entrar no grupo.", "error");
      } finally {
          setLoading(false);
      }
  };

  if (loading && !church) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black"><Loader2 className="animate-spin text-bible-gold" size={40} /></div>;
  if (!church) return <div className="h-screen flex flex-col items-center justify-center p-6 text-center"><h2 className="text-xl font-bold">Igreja não encontrada</h2><button onClick={() => navigate(`${basePath}/explorar`)} className="mt-4 text-bible-gold font-bold">Voltar</button></div>;

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto">
        <SEO title={church.name} description={`Comunidade ${church.name} no BíbliaLM.`} />
        
        <div className="relative h-48 overflow-hidden bg-[#3d2b25] md:h-64">
            {church.logoUrl ? (
                <img src={church.logoUrl} alt={church.name} className="absolute inset-0 h-full w-full object-cover opacity-75 blur-[1px] scale-105" />
            ) : (
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/45" />
            <div className="absolute inset-x-0 top-4 z-10 mx-auto flex max-w-5xl items-center justify-between px-4">
                <button onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition hover:bg-white" aria-label="Voltar">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={handleFollowToggle} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-lg transition hover:text-bible-gold" aria-label={isFollowing ? 'Seguindo' : 'Seguir'}>
                        <Bell size={17} fill={isFollowing ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={async () => {
                            if (navigator.share) await navigator.share({ title: church.name, url: window.location.href });
                            else { await navigator.clipboard.writeText(window.location.href); showNotification('Link copiado!', 'success'); }
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-lg transition hover:text-bible-gold"
                        aria-label="Compartilhar igreja"
                    >
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>
        </div>
        
        <div className="mx-auto max-w-5xl px-4 pb-32 relative z-10">
            <div className="relative -mt-16 mb-8">
                <div className="overflow-visible rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-bible-darkPaper">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-5 md:gap-6 md:p-7">
                        <div className="relative -mt-12 md:-mt-16">
                            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white p-2 shadow-2xl dark:border-bible-darkPaper dark:bg-gray-900 md:h-36 md:w-36">
                                {isUpdatingLogo ? (
                                    <Loader2 className="animate-spin text-bible-gold" size={32} />
                                ) : church.logoUrl ? (
                                    <img src={church.logoUrl} className="h-full w-full object-contain" alt={church.name} />
                                ) : (
                                    <Shield size={62} className="text-bible-gold" />
                                )}
                            </div>
                            {canChangeLogo && (
                                <>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-1 right-1 rounded-full border-2 border-white bg-bible-gold p-2 text-white shadow-lg transition hover:scale-110 dark:border-bible-darkPaper"
                                        title="Trocar foto da igreja"
                                    >
                                        <Camera size={14} />
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                                </>
                            )}
                        </div>

                        <div className="min-w-0 pt-2 text-left md:pt-4">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-black leading-tight text-gray-900 dark:text-white md:text-4xl">{church.name}</h1>
                                {isMember && (
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-100" title="Membro ativo">
                                        <UserCheck size={17} />
                                    </span>
                                )}
                                <button
                                    onClick={async () => {
                                        if (navigator.share) await navigator.share({ title: church.name, url: window.location.href });
                                        else { await navigator.clipboard.writeText(window.location.href); showNotification('Link copiado!', 'success'); }
                                    }}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 ring-1 ring-gray-100 transition hover:text-bible-gold dark:bg-gray-900 dark:ring-gray-800"
                                    aria-label="Compartilhar igreja"
                                >
                                    <Share2 size={15} />
                                </button>
                            </div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-bible-gold">
                                <Crown size={15} className="fill-bible-gold/10" />
                                {church.pastorName ? <span>Pastor(a): {church.pastorName}</span> : <span className="text-gray-400">Liderança não informada</span>}
                                {isMember && (
                                    <button
                                        onClick={() => setIsEditingPastor(true)}
                                        className="rounded-lg p-1 text-bible-gold transition hover:bg-gray-100 dark:hover:bg-gray-800"
                                        title={church.pastorName ? 'Editar liderança' : 'Cadastrar liderança'}
                                    >
                                        {church.pastorName ? <Edit2 size={13} /> : <Plus size={13} />}
                                    </button>
                                )}
                            </div>
                            <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition hover:text-bible-gold" title="Abrir endereço no mapa">
                                <MapPin size={12} className="mt-0.5 shrink-0 text-bible-gold" />
                                <span className="line-clamp-2">{churchFullAddress || `${church.location.city}, ${church.location.state}`}</span>
                            </a>
                        </div>

                        <div className="flex w-32 flex-col items-stretch gap-2 pt-2 md:w-40 md:pt-4">
                            <button
                                onClick={handleFollowToggle}
                                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest transition active:scale-95 ${isFollowing ? 'bg-gray-100 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                <Bell size={14} fill={isFollowing ? 'currentColor' : 'none'} />
                                {isFollowing ? 'Seguindo' : 'Seguir'}
                            </button>
                            
                            <button
                                onClick={() => {
                                    if (isMember) {
                                        setIsLeaveModalOpen(true);
                                    } else {
                                        handleJoinChurch();
                                    }
                                }}
                                disabled={isJoiningChurch || isLeavingChurch}
                                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest transition active:scale-95 disabled:opacity-60 ${
                                    isMember
                                        ? 'bg-green-600 text-white hover:bg-green-700 ring-1 ring-green-500'
                                        : 'bg-green-50 text-green-700 ring-1 ring-green-100 hover:bg-green-100'
                                }`}
                            >
                                {isJoiningChurch || isLeavingChurch ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : isMember ? (
                                    <UserCheck size={14} />
                                ) : (
                                    <LogIn size={14} />
                                )}
                                Sou Membro
                            </button>

                            {(!church.admins || church.admins.length === 0) && (
                                <button
                                    onClick={() => navigate(`${basePath}/igreja/${church.slug}/gerir`)}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 text-[10px] font-black uppercase tracking-widest transition active:scale-95"
                                >
                                    <Shield size={14} />
                                    Gerir Igreja
                                </button>
                            )}

                            <button onClick={() => navigate('/workspace-pastoral')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gray-50 px-3 text-[10px] font-black uppercase tracking-widest text-gray-700 ring-1 ring-gray-100 transition hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-800">
                                <Crown size={14} />
                                Espaço
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-gray-50 px-5 py-4 dark:border-gray-800 md:px-7">
                        <button type="button" onClick={() => setPeoplePanel('members')} className="rounded-2xl p-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-900">
                            <span className="block text-2xl font-black leading-none text-gray-900 dark:text-white">{church.stats.memberCount || 0}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Fiéis</span>
                        </button>
                        <button type="button" onClick={() => setPeoplePanel('followers')} className="rounded-2xl border-l border-gray-100 p-3 pl-5 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
                            <span className="block text-2xl font-black leading-none text-gray-900 dark:text-white">{church.stats.followersCount || 0}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Seguidores</span>
                        </button>
                    </div>
                </div>
            </div>
            {visibleServices.length > 0 && (
                <div className="mb-8 overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-bible-darkPaper">
                    <div className="h-1.5 bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f]" />
                    <div className="p-5">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">Culto+</p>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">Agenda de Cultos e Eventos</h2>
                            </div>
                            <button onClick={() => setIsServiceCalendarOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:shadow-xl">
                                <Calendar size={14} />
                                Ver Culto
                            </button>
                        </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {visibleServices.slice(0, 2).map((service) => {
                            const serviceStatusLabel = getChurchServiceStatusLabel(service, attendedServiceIds.has(service.id));
                            return (
                            <Link key={service.id} href={`/culto/${service.slug}`} className="group rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-md hover:shadow-emerald-950/5 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">{service.title}</h3>
                                        <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-500">{service.theme}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-widest ${serviceStatusLabel === 'Ao vivo' ? 'bg-red-500 text-white' : serviceStatusLabel === 'Assistido' ? 'bg-emerald-600 text-white' : 'bg-[#f3d28a] text-[#073b35]'}`}>
                                        {serviceStatusLabel}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                                    <Calendar size={12} />
                                    {new Date(service.startsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </Link>
                            );
                        })}
                    </div>
                    {latestServicePosts.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Ultimos posts dos cultos</p>
                            <div className="space-y-3">
                                {latestServicePosts.map((post) => {
                                    const linkedService = services.find((service) => service.id === post.serviceId);
                                    const postPreview = (
                                        <>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="line-clamp-1 text-xs font-black text-gray-900 dark:text-white">{post.userDisplayName || 'Membro'}</span>
                                                <span className="shrink-0 rounded-full bg-[#f3d28a] px-2 py-1 text-[8px] font-black uppercase tracking-widest text-[#073b35]">Culto+</span>
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-500 dark:text-gray-400">{post.content}</p>
                                        </>
                                    );
                                    return linkedService ? (
                                        <Link key={post.id} href={`/culto/${linkedService.slug}`} className="block rounded-xl bg-white p-3 transition hover:bg-emerald-50 dark:bg-bible-darkPaper dark:hover:bg-emerald-950/30">
                                            {postPreview}
                                        </Link>
                                    ) : (
                                        <div key={post.id} className="rounded-xl bg-white p-3 dark:bg-bible-darkPaper">
                                            {postPreview}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            )}

            <div className="flex bg-white dark:bg-bible-darkPaper p-1.5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 mb-8 shadow-sm overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('mural')} className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'mural' ? 'bg-bible-gold text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><MessageSquareHeart size={16} /> Mural</button>
                <button onClick={() => setIsServiceCalendarOpen(true)} className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'cultos' ? 'bg-bible-gold text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Calendar size={16} /> Cultos</button>
                <button onClick={() => setActiveTab('groups')} className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'groups' ? 'bg-bible-gold text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Boxes size={16} /> Grupos</button>
            </div>

            {isServiceCalendarOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true" aria-labelledby="church-services-calendar-title" onClick={() => setIsServiceCalendarOpen(false)}>
                    <div className="max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-bible-darkPaper" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">Calendario da igreja</p>
                                <h2 id="church-services-calendar-title" className="mt-1 text-xl font-black text-gray-900 dark:text-white">Cultos e agendas</h2>
                            </div>
                            <button type="button" onClick={() => setIsServiceCalendarOpen(false)} aria-label="Fechar calendario de cultos" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-5">
                            <CultoPlusPublicAgenda
                                services={visibleServices}
                                onOpen={(service) => {
                                    setIsServiceCalendarOpen(false);
                                    navigate(`/culto/${service.slug}`);
                                }}
                            />
                        </div>
                        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 p-5 dark:border-gray-800 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setIsServiceCalendarOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gray-50 px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 transition hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800">
                                Fechar
                            </button>
                            <button type="button" onClick={() => { setActiveTab('cultos'); setIsServiceCalendarOpen(false); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-4 text-[10px] font-black uppercase tracking-widest text-white">
                                <Calendar size={14} />
                                Ver lista completa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-[300px]">
                {activeTab === 'mural' && (
                    <div className="space-y-6 animate-in fade-in">
                        {isMember && (
                            <div className="bg-white dark:bg-bible-darkPaper p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
                                    {userProfile?.photoURL ? <img src={userProfile.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-gray-400" />}
                                </div>
                                <div className="flex-1">
                                    <textarea value={newPrayer} onChange={(e) => setNewPrayer(e.target.value)} placeholder="Compartilhe um pedido de oração ou testemunho com a igreja..." className="w-full bg-transparent outline-none text-sm resize-none h-12 pt-2 placeholder-gray-400" />
                                    <div className="flex justify-between items-center mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Mural da Igreja</span>
                                        <button onClick={handlePostPrayer} disabled={!newPrayer.trim() || isPostingPrayer} className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">Publicar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="space-y-4">
                            {prayers.map(item => {
                                if (isFeedPostMuralItem(item)) {
                                    return (
                                        <FeedPostCard 
                                            key={item.id} 
                                            post={item} 
                                            currentUser={currentUser}
                                            showNotification={showNotification}
                                            onInteraction={async (postId, type) => {
                                                if (type === 'like') await dbService.togglePostLike(postId, currentUser?.uid || '', !item.likedBy?.includes(currentUser?.uid || ''));
                                                // Refresh local state if needed, or rely on re-fetch
                                            }}
                                            onDelete={isOwner ? handleDeletePrayer : undefined}
                                        />
                                    );
                                }
                                const prayer = item as PrayerRequest;
                                return (
                                    <div key={prayer.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in group transition-all hover:shadow-md relative">
                                        {prayer.cellName && (
                                            <div className="absolute top-4 right-14 flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-purple-100">
                                                <Boxes size={10}/> Grupo: {prayer.cellName}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center border border-gray-200">
                                                    {prayer.userPhotoURL ? <img src={prayer.userPhotoURL} className="w-full h-full object-cover"/> : <span className="font-bold text-xs text-gray-400">{prayer.userName.substring(0,1)}</span>}
                                                </div>
                                                <div><h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{prayer.userName}</h4><span className="text-[9px] text-gray-400 uppercase font-medium">{new Date(prayer.createdAt).toLocaleDateString()}</span></div>
                                            </div>
                                            {(currentUserId === prayer.userId || isOwner) && (
                                                <PostMenu prayer={prayer} onEdit={handleEditPrayer} onDelete={handleDeletePrayer} />
                                            )}
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">"{prayer.content}"</p>
                                        <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-3">
                                            <button 
                                                onClick={() => handleIntercede(prayer)} 
                                                className={`flex items-center gap-2 text-xs font-bold transition-all ${prayer.intercessors?.includes(currentUser?.uid || '') ? 'text-red-500 scale-105' : 'text-gray-400 hover:text-red-500'}`}
                                            >
                                                <Heart size={16} fill={prayer.intercessors?.includes(currentUser?.uid || '') ? "currentColor" : "none"} />
                                                {prayer.intercessorsCount} Intercessões
                                            </button>
                                            <span className="text-[9px] text-gray-300 font-bold uppercase">{new Date(prayer.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {prayers.length === 0 && (
                                <div className="text-center py-12 text-gray-400 text-sm">
                                    Nenhuma oração ou mensagem no mural.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'cultos' && (
                    <div className="animate-in fade-in">
                        <ChurchServicesPreview services={visibleServices} attendedServiceIds={attendedServiceIds} canManage={Boolean(isOwner || isMember)} />
                    </div>
                )}

                {activeTab === 'groups' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><Boxes size={18} /> Grupos ({groups.length})</h3>
                            {isMember && (
                                <button onClick={() => setIsCreatingGroup(true)} className="text-[10px] font-black uppercase tracking-widest bg-bible-gold/10 text-bible-gold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-bible-gold/20 transition-colors"><Plus size={14}/> Criar Grupo</button>
                            )}
                        </div>

                        {/* Modal/Área de Criação de Grupo (mantido do anterior) */}
                        {isCreatingGroup && (
                            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border-2 border-dashed border-bible-gold/30 mb-6 animate-in zoom-in-95 relative z-50">
                                <h4 className="font-bold text-sm mb-4">Novo Grupo</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Nome do Grupo</label>
                                        <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex: Betel ou Casa da Paz" className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold" />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Privacidade</label>
                                        <select
                                            value={newGroupPrivacy}
                                            onChange={(e) => {
                                                const privacy = e.target.value as GroupPrivacy;
                                                setNewGroupPrivacy(privacy);
                                                if (privacy === 'public') {
                                                    setPrivateGroupParticipantQuery('');
                                                    setPrivateGroupParticipantResults([]);
                                                    setSelectedPrivateGroupParticipants([]);
                                                }
                                            }}
                                            className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold text-sm text-gray-700 dark:text-gray-200"
                                        >
                                            <option value="public">Público</option>
                                            <option value="private">Privado</option>
                                        </select>
                                    </div>

                                    {newGroupPrivacy === 'private' && (
                                        <div className="relative">
                                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Participantes do Grupo Privado</label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={privateGroupParticipantQuery}
                                                    onChange={(e) => setPrivateGroupParticipantQuery(e.target.value)}
                                                    placeholder="Nome ou usuario que recebera convite"
                                                    className="w-full pl-12 pr-10 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-bible-gold font-bold"
                                                />
                                                {isSearchingPrivateGroupParticipant && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" size={18} />}
                                            </div>

                                            {selectedPrivateGroupParticipants.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {selectedPrivateGroupParticipants.map(user => (
                                                        <span key={user.uid} className="inline-flex items-center gap-2 rounded-full bg-bible-gold/10 px-3 py-1.5 text-[10px] font-black uppercase text-bible-gold">
                                                            @{user.username}
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedPrivateGroupParticipants(prev => removeGroupInviteParticipant(prev, user.uid))}
                                                                aria-label={`Remover ${user.displayName}`}
                                                                className="rounded-full p-0.5 hover:bg-bible-gold/20"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {privateGroupParticipantResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                                                    <div className="p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Selecionar participante</span>
                                                    </div>
                                                    {privateGroupParticipantResults.map(user => (
                                                        <button
                                                            key={user.uid}
                                                            type="button"
                                                            onClick={() => handleSelectPrivateGroupParticipant(user)}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-bible-gold/5 text-left transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                                                        >
                                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                                                {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={16} className="m-auto mt-2 text-gray-400" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user.displayName}</p>
                                                                <p className="text-[10px] font-bold text-gray-400">@{user.username}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Vincular a Grupo (Opcional)</label>
                                        <div className="relative">
                                            <select 
                                                value={newGroupParentId} 
                                                onChange={(e) => setNewGroupParentId(e.target.value)}
                                                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold text-sm appearance-none text-gray-700 dark:text-gray-200"
                                            >
                                                <option value="">Nenhum (Grupo Principal)</option>
                                                {groups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Líder do Grupo (Opcional)</label>
                                        <div className="relative">
                                            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                type="text" 
                                                value={newGroupLeader} 
                                                onChange={(e) => {
                                                    setNewGroupLeader(e.target.value);
                                                    if (selectedLeader) setSelectedLeader(null);
                                                }} 
                                                placeholder="Nome ou usuario" 
                                                className={`w-full pl-12 pr-10 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border outline-none focus:ring-2 ring-bible-gold font-bold ${selectedLeader ? 'border-bible-gold' : 'border-gray-200 dark:border-gray-700'}`} 
                                            />
                                            {isSearchingLeader && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" size={18} />}
                                            {selectedLeader && <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />}
                                        </div>

                                        {leaderResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                                                <div className="p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Membro Encontrado</span>
                                                </div>
                                                {leaderResults.map(user => (
                                                    <button 
                                                        key={user.uid}
                                                        onClick={() => handleSelectLeader(user)}
                                                        className="w-full flex items-center gap-3 p-3 hover:bg-bible-gold/5 text-left transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                                            {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={16} className="m-auto mt-2 text-gray-400" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user.displayName}</p>
                                                            <p className="text-[10px] font-bold text-gray-400">@{user.username}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button onClick={() => { setIsCreatingGroup(false); setSelectedLeader(null); setNewGroupLeader(''); setNewGroupParentId(''); setNewGroupPrivacy('public'); setPrivateGroupParticipantQuery(''); setPrivateGroupParticipantResults([]); setSelectedPrivateGroupParticipants([]); }} disabled={isSavingGroup} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">Cancelar</button>
                                    <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isSavingGroup} className="flex-1 py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 transition-all">
                                        {isSavingGroup ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Criar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groups.map(group => {
                                const currentUserId = currentUser?.uid || currentUser?.id;
                                const isMyGroup = userProfile?.churchData?.groupId === group.id;
                                const canDeleteGroup = Boolean(currentUserId && (group.createdBy === currentUserId || group.leaderUid === currentUserId || isOwner));
                                return (
                                    <div key={group.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-bible-gold transition-colors">{group.name}</h4>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Líder:</span>
                                                    {group.leaderUid ? (
                                                        <Link href={`${basePath}/u/${group.leaderName?.replace('@','')}`} className="text-[10px] font-black text-bible-gold hover:underline flex items-center gap-1">
                                                            {group.leaderName} <CheckCircle2 size={10} className="fill-bible-gold text-white" />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{group.leaderName || "Indefinido"}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-1 rounded text-[9px] font-black uppercase">{group.stats.memberCount} Membros</span>
                                                {group.privacy === 'private' && <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded text-[8px] font-black uppercase">Privado</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => navigate(`${basePath}/grupo/${group.id}`)}
                                                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare size={14} /> Fórum
                                            </button>
                                            {!isMyGroup && isMember && (
                                                <button onClick={() => handleJoinGroup(group)} className="flex-1 py-2.5 bg-bible-gold text-white dark:text-black rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-opacity">Participar</button>
                                            )}
                                            {isMyGroup && (
                                                <div className="flex-1 flex items-center justify-center gap-2 text-green-600 text-xs font-bold"><CheckCircle2 size={16}/> Meu Grupo</div>
                                            )}
                                            {canDeleteGroup && (
                                                <button
                                                    onClick={() => setGroupToDelete(group)}
                                                    aria-label={`Excluir grupo ${group.name}`}
                                                    className="px-3 py-2.5 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                                                    title="Excluir grupo"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {groups.length === 0 && (
                            <div className="py-20 text-center text-gray-400 italic">Nenhum grupo cadastrado ainda.</div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {peoplePanel && (
            <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm md:items-center md:p-6">
                <div className="w-full max-w-xl rounded-t-[2rem] border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-bible-darkPaper md:rounded-[2rem]">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{church.name}</p>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                {peoplePanel === 'members' ? 'Membros da igreja' : 'Seguidores'}
                            </h3>
                        </div>
                        <button onClick={() => setPeoplePanel(null)} className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:text-red-500 dark:bg-gray-800" aria-label="Fechar lista">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                        {loadingPeople ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-bible-gold" size={28} /></div>
                        ) : (
                            (peoplePanel === 'members' ? members : followers).map((person: any) => (
                                <Link key={person.uid || person.id} href={`${basePath}/u/${person.username}`} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-gray-50 dark:hover:bg-gray-900" onClick={() => setPeoplePanel(null)}>
                                    <div className="h-11 w-11 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                        {person.photoURL ? <img src={person.photoURL} className="h-full w-full object-cover" alt={person.displayName} /> : <UserIcon className="m-auto mt-3 text-gray-400" size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-gray-900 dark:text-white">{person.displayName}</p>
                                        <p className="text-[10px] font-bold text-gray-400">@{person.username}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                        {!loadingPeople && (peoplePanel === 'members' ? members : followers).length === 0 && (
                            <p className="py-10 text-center text-sm font-medium text-gray-400">
                                {peoplePanel === 'members' ? 'Nenhum membro vinculado.' : 'Nenhum seguidor ainda.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )}

        <PromptModal 
            isOpen={!!prayerToEdit}
            onClose={() => setPrayerToEdit(null)}
            onConfirm={confirmEditPrayer}
            title="Editar Postagem"
            label="Mensagem no Grupo"
            defaultValue={prayerToEdit?.content || ''}
        />

        <PromptModal 
            isOpen={isEditingPastor}
            onClose={() => setIsEditingPastor(false)}
            onConfirm={handleUpdatePastor}
            title="Liderança da Igreja"
            label="Nome do Pastor(a) ou Líder"
            defaultValue={church.pastorName || ''}
            placeholder="Ex: Pr. João Silva"
        />

        <ConfirmationModal 
            isOpen={!!prayerToDelete}
            onClose={() => setPrayerToDelete(null)}
            onConfirm={confirmDeletePrayer}
            title="Excluir Postagem"
            message="Deseja remover esta mensagem do mural do grupo?"
            confirmText="Sim, Excluir"
            variant="danger"
        />

        <ConfirmationModal
            isOpen={!!groupToDelete}
            onClose={() => {
                if (!isDeletingGroup) setGroupToDelete(null);
            }}
            onConfirm={handleDeleteGroup}
            title="Excluir Grupo"
            message={`Deseja remover o grupo "${groupToDelete?.name || ''}" desta igreja?`}
            confirmText={isDeletingGroup ? "Excluindo..." : "Sim, Excluir"}
            variant="danger"
        />

        <ConfirmationModal
            isOpen={isLeaveModalOpen}
            onClose={() => {
                if (!isLeavingChurch) setIsLeaveModalOpen(false);
            }}
            onConfirm={handleLeaveChurch}
            title="Sair da Igreja"
            message={`Deseja deixar de ser membro da igreja ${church.name}?`}
            confirmText={isLeavingChurch ? "Saindo..." : "Sim, Sair"}
            variant="danger"
        />
    </div>
  );
};

export default ChurchProfilePage;
