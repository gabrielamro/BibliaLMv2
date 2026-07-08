"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { dbService, uploadProfileImage } from '../services/supabase';
import { Loader2, Camera, Check, AlertCircle, Church, X, Instagram, PenLine, Crown, Users, Search, Plus, MapPin, Shield, Palette, CreditCard, LogOut, Bell, Sun, Moon } from 'lucide-react';
import { SubscriptionTier, Church as ChurchType, UserProfile, GeneralProfileType } from '../types';
import { generateSlug } from '../utils/textUtils';
import { buildEditableProfileDraft } from '../utils/profileSettings';
import { getGeneralProfileType } from '../utils/profileAccess';

const BRAZIL_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const CompleteProfilePage: React.FC = () => {
    const { userProfile, currentUser, showNotification, updateProfile, openSubscription, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
    const [username, setUsername] = useState(userProfile?.username || '');
    const [instagram, setInstagram] = useState(userProfile?.instagram || '');
    const [facebook, setFacebook] = useState(userProfile?.facebook || '');
    const [bio, setBio] = useState(userProfile?.bio || '');
    const [slogan, setSlogan] = useState(userProfile?.slogan || '');
    const [isProfilePublic, setIsProfilePublic] = useState(userProfile?.isProfilePublic ?? true);
    const [theme, setTheme] = useState<'light' | 'dark'>(userProfile?.theme || 'dark');
    const [profileType, setProfileType] = useState<GeneralProfileType>(getGeneralProfileType(userProfile));

    const [city, setCity] = useState(userProfile?.city || '');
    const [state, setState] = useState(userProfile?.state || '');

    const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
    const [cpf, setCpf] = useState(userProfile?.cpf || '');

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile?.photoURL || null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [citiesList, setCitiesList] = useState<string[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    // Church Search States
    const [churchQuery, setChurchQuery] = useState('');
    const [churchResults, setChurchResults] = useState<ChurchType[]>([]);
    const [selectedChurch, setSelectedChurch] = useState<{ id: string, name: string } | null>(
        userProfile?.churchData ? { id: userProfile.churchData.churchId, name: userProfile.churchData.churchName } : null
    );
    const [isSearchingChurch, setIsSearchingChurch] = useState(false);
    const searchTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (userProfile) {
            const draft = buildEditableProfileDraft(userProfile as Partial<UserProfile>);
            setDisplayName(draft.displayName);
            setUsername(userProfile.username || '');
            setInstagram(draft.instagram);
            setFacebook(userProfile.facebook || '');
            setBio(draft.bio);
            setSlogan(draft.slogan);
            setCity(draft.city);
            setState(draft.state);
            setIsProfilePublic(draft.isProfilePublic);
            setTheme(draft.theme);
            setProfileType(getGeneralProfileType(userProfile));
            setPhoneNumber(userProfile.phoneNumber || '');
            setCpf(userProfile.cpf || '');
            setPhotoPreview(userProfile.photoURL || null);
            if (userProfile.churchData) {
                setSelectedChurch({ id: userProfile.churchData.churchId, name: userProfile.churchData.churchName });
            }
        }
    }, [userProfile]);

    useEffect(() => {
        if (state) {
            setLoadingCities(true);
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`)
                .then(res => res.json())
                .then(data => {
                    const names = data.map((c: any) => c.nome).sort();
                    setCitiesList(names);
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingCities(false));
        } else {
            setCitiesList([]);
        }
    }, [state]);

    // Church Search Logic
    useEffect(() => {
        const term = churchQuery.trim();
        if (term.length >= 2) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(async () => {
                setIsSearchingChurch(true);
                try {
                    const results = await dbService.searchChurches(term, city, state);
                    setChurchResults(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearchingChurch(false);
                }
            }, 400);
        } else {
            setChurchResults([]);
        }
    }, [churchQuery, city, state]);

    const handleSelectChurch = (church: ChurchType) => {
        setSelectedChurch({ id: church.id, name: church.name });
        setChurchQuery('');
        setChurchResults([]);
    };

    const handleCreateSimpleChurch = async () => {
        if (!currentUser || !churchQuery.trim()) return;
        setLoading(true);
        try {
            // Criação simplificada
            const slug = generateSlug(churchQuery + ' ' + (city || 'global'));
            const newChurchData = {
                name: churchQuery,
                acronym: churchQuery.substring(0, 3).toUpperCase(),
                slug,
                denomination: 'Independente',
                location: { city: city || 'Não informada', state: state || 'BR', address: 'Endereço pendente' },
                stats: { memberCount: 1, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
                teams: [],
                teamScores: {},
                admins: [currentUser.uid] // Quem cadastra vira admin
            };

            const id = await dbService.createChurch(newChurchData);
            setSelectedChurch({ id, name: churchQuery });
            setChurchQuery('');
            setChurchResults([]);
            showNotification("Igreja cadastrada!", "success");
        } catch (e) {
            console.error(e);
            showNotification("Erro ao cadastrar igreja.", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .slice(0, 14);
    };

    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d)(\d{4})$/, '$1-$2')
            .slice(0, 15);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (!displayName.trim()) { setError("Nome é obrigatório."); return; }
        if (!username.trim() || username.length < 3) { setError("Username inválido (min 3 chars)."); return; }

        setLoading(true);
        setError(null);

        try {
            let finalPhotoURL = userProfile?.photoURL || null;
            if (photoFile) {
                const url = await uploadProfileImage(photoFile, currentUser.uid);
                if (url) finalPhotoURL = url;
            }

            if (username !== userProfile?.username) {
                const isAvailable = await dbService.isUsernameAvailable(username.toLowerCase());
                if (!isAvailable) {
                    setError("Este nome de usuário já está em uso.");
                    setLoading(false);
                    return;
                }
            }

            const updates: any = {
                username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                displayName,
                instagram: instagram.replace('@', ''),
                facebook,
                bio,
                slogan,
                city,
                state,
                phoneNumber: phoneNumber.replace(/\D/g, ''),
                cpf: cpf.replace(/\D/g, ''),
                photoURL: finalPhotoURL,
                isProfilePublic,
                theme,
                profileType,
            };

            // Atualizar Igreja se selecionada
            if (selectedChurch && selectedChurch.id !== userProfile?.churchData?.churchId) {
                const churchDoc = await dbService.getChurchById(selectedChurch.id);
                if (churchDoc) {
                    updates.churchData = {
                        churchId: churchDoc.id,
                        churchName: churchDoc.name,
                        churchSlug: churchDoc.slug,
                        isAnonymous: false
                    };
                }
            }

            await updateProfile(updates);
            showNotification("Perfil atualizado!", "success");
            navigate('/perfil');

        } catch (e: any) {
            console.error(e);
            setError("Erro ao salvar perfil. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm('Tem certeza que deseja sair?')) return;
        await signOut();
        navigate('/');
    };

    const tiers: Record<string, { name: string; color: string }> = {
        free: { name: 'Gratuito', color: 'text-gray-500' },
        bronze: { name: 'Bronze', color: 'text-amber-700' },
        silver: { name: 'Prata', color: 'text-gray-400' },
        gold: { name: 'Visionario', color: 'text-yellow-500' },
        pastor: { name: 'Pastor', color: 'text-purple-500' },
        admin: { name: 'Admin', color: 'text-red-500' },
    };

    const notificationItems = [
        'Novas solicitacoes de oracao',
        'Lembrete de devocional diario',
        'Atualizacoes de estudos',
        'Novos seguidores e interacoes',
    ];

    const profileTypeOptions: Array<{
        value: GeneralProfileType;
        title: string;
        description: string;
        icon: React.ReactNode;
    }> = [
        {
            value: 'user',
            title: 'Usuario',
            description: 'Perfil comum para leitura, comunidade, devocionais e participacao.',
            icon: <Users size={18} />,
        },
        {
            value: 'pastor',
            title: 'Pastor',
            description: 'Habilita ferramentas pastorais pessoais sem exigir vinculo com igreja.',
            icon: <Church size={18} />,
        },
        {
            value: 'manager',
            title: 'Gestor',
            description: 'Identidade voltada a operacao; gerir igreja ainda exige permissao.',
            icon: <Shield size={18} />,
        },
    ];

    return (
        <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto">
            <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-2xl bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 my-4">
                    <div className="text-center mb-8 relative">
                        <button onClick={() => navigate(-1)} className="absolute top-0 right-0 text-gray-400 hover:text-red-500 transition-colors p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                            <X size={20} />
                        </button>
                        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Editar Perfil</h1>
                        <p className="text-sm text-gray-500 mt-1">Mantenha seus dados atualizados no Reino.</p>
                    </div>

                    {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold border border-red-100"><AlertCircle size={18} /> {error}</div>}

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="flex justify-center">
                            <div className="relative group cursor-pointer">
                                <div className="w-32 h-32 rounded-[2rem] bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden">
                                    {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300 font-bold uppercase">{displayName.substring(0, 2)}</div>}
                                </div>
                                <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 bg-bible-gold text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-yellow-600 border-4 border-white dark:border-bible-darkPaper"><Camera size={20} /></label>
                                <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1 block">Tipo Geral do Perfil</label>
                                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                    Essa escolha define sua experiencia no BibliaLM. Permissoes de igreja continuam sendo concedidas por vinculo, convite ou aprovacao.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {profileTypeOptions.map(option => {
                                    const active = profileType === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setProfileType(option.value)}
                                            className={`min-h-32 rounded-2xl border p-4 text-left transition-all ${active ? 'border-bible-gold bg-bible-gold/10 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-bible-gold/40 dark:border-gray-800 dark:bg-gray-900/50'}`}
                                        >
                                            <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-bible-gold text-black' : 'bg-white text-gray-400 dark:bg-gray-800'}`}>
                                                {option.icon}
                                            </span>
                                            <span className="block text-sm font-black text-gray-900 dark:text-white">{option.title}</span>
                                            <span className="mt-1 block text-[11px] leading-relaxed text-gray-500">{option.description}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Area de Papel da Igreja em Desenvolvimento */}
                        {selectedChurch && (
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1 block">Meu Papel na Igreja</label>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-500">Permissões e papéis</span>
                                        <span className="text-[10px] text-gray-400">Atribuídos via Gestão da Igreja</span>
                                    </div>
                                    <button type="button" onClick={() => navigate('/gestao-igreja')} className="text-[10px] bg-bible-gold/10 text-bible-gold px-3 py-2 rounded-lg font-bold uppercase tracking-widest">
                                        Ver Acompanhamento
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Dados Públicos</h3>
                                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Nome de Exibição</label><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm font-medium" required /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">@ Usuário</label><input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm font-medium" required /></div>
                                <div className="flex gap-2">
                                    <div className="w-1/3"><label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">UF</label><select value={state} onChange={e => setState(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm font-medium">{BRAZIL_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select></div>
                                    <div className="flex-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Cidade</label><select value={city} onChange={e => setCity(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm font-medium" required>{citiesList.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                </div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 flex items-center gap-1"><PenLine size={12} /> Biografia</label><textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm resize-none h-24" maxLength={150} /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Slogan / Frase</label><input type="text" value={slogan} onChange={e => setSlogan(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm font-medium" /></div>
                            </div>

                            <div className="space-y-5">
                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Comunidade & Social</h3>

                                {/* Church Selector / Simple Creator */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 flex items-center gap-1"><Church size={12} /> Minha Igreja</label>
                                    {selectedChurch ? (
                                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-blue-500" />
                                                <div>
                                                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{selectedChurch.name}</p>
                                                    <p className="text-[10px] text-blue-600 dark:text-blue-300">Vinculado</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setSelectedChurch(null)} className="p-1 hover:bg-white/50 rounded-full text-blue-500"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                value={churchQuery}
                                                onChange={(e) => setChurchQuery(e.target.value)}
                                                className="w-full pl-10 pr-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm"
                                                placeholder="Buscar ou cadastrar igreja..."
                                            />
                                            {isSearchingChurch && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" size={16} />}

                                            {churchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 max-h-40 overflow-y-auto">
                                                    {churchResults.map(c => (
                                                        <button key={c.id} type="button" onClick={() => handleSelectChurch(c)} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0">
                                                            <span className="font-bold block text-gray-800 dark:text-white">{c.name}</span>
                                                            <span className="text-xs text-gray-500">{c.location.city}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {!isSearchingChurch && churchQuery.length > 2 && churchResults.length === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={handleCreateSimpleChurch}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors"
                                                >
                                                    <Plus size={10} /> Cadastrar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="relative"><Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" size={18} /><input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm" placeholder="Instagram (sem @)" /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 block">WhatsApp</label><input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(formatPhone(e.target.value))} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm font-mono" placeholder="(00) 00000-0000" /></div>
                            </div>
                        </div>

                        <div className="space-y-5 border-t border-gray-100 pt-6 dark:border-gray-800">
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Preferencias da Conta</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl">
                                    <div className="flex items-start gap-3">
                                        <Shield size={18} className="mt-0.5 text-bible-gold" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Perfil Publico</p>
                                            <p className="text-[10px] text-gray-500">Outros usuarios podem te encontrar.</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        aria-pressed={isProfilePublic}
                                        onClick={() => setIsProfilePublic(current => !current)}
                                        className={`relative h-6 w-11 rounded-full transition-all ${isProfilePublic ? 'bg-bible-gold' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    >
                                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${isProfilePublic ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl">
                                    <div className="mb-3 flex items-center gap-2">
                                        <Palette size={18} className="text-bible-gold" />
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Visual</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['light', 'dark'] as const).map(option => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => setTheme(option)}
                                                className={`min-h-11 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${theme === option ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-200 text-gray-400 dark:border-gray-700'}`}
                                            >
                                                {option === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                                                {option === 'dark' ? 'Escuro' : 'Claro'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-gradient-to-br from-bible-gold/15 to-bible-gold/5 border border-bible-gold/30 rounded-2xl relative overflow-hidden">
                                    <Crown size={90} className="absolute -right-4 -top-4 opacity-10" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CreditCard size={18} className="text-bible-gold" />
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Plano</p>
                                        </div>
                                        <p className={`text-lg font-black ${tiers[userProfile?.subscriptionTier || 'free']?.color || 'text-bible-gold'}`}>
                                            {tiers[userProfile?.subscriptionTier || 'free']?.name || 'Gratuito'}
                                        </p>
                                        <div className="mt-4 grid gap-2">
                                            <button type="button" onClick={() => openSubscription()} className="w-full py-3 bg-bible-gold text-black font-black uppercase tracking-widest text-[10px] rounded-xl shadow-md">
                                                {userProfile?.subscriptionTier === 'free' ? 'Fazer Upgrade' : 'Mudar de Plano'}
                                            </button>
                                            <button type="button" onClick={() => openSubscription()} className="w-full py-3 bg-white/60 dark:bg-white/10 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-xl">
                                                Gerenciar Fatura
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Bell size={18} className="text-bible-gold" />
                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Avisos</p>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Local</span>
                                        </div>
                                        <div className="space-y-2">
                                            {notificationItems.map(item => (
                                                <div key={item} className="flex items-center justify-between gap-3 text-[11px] font-bold text-gray-500">
                                                    <span>{item}</span>
                                                    <span className="h-5 w-9 rounded-full bg-bible-gold/80 relative"><span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" /></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full min-h-12 flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/10"
                                    >
                                        <LogOut size={16} /> Sair da Conta
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
                            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70">{loading ? <Loader2 className="animate-spin" /> : <Check size={20} />} Salvar Alterações</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfilePage;
