"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { dbService, uploadProfileImage } from '../services/supabase';
import { Loader2, Camera, Check, AlertCircle, Church, X, ShieldCheck, CreditCard, Phone, Facebook, Instagram, PenLine, Crown, Users, Search, Plus, MapPin } from 'lucide-react';
import { SubscriptionTier, Church as ChurchType } from '../types';
import { generateSlug } from '../utils/textUtils';

const BRAZIL_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const CompleteProfilePage: React.FC = () => {
    const { userProfile, currentUser, showNotification, earnMana, updateProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
    const [username, setUsername] = useState(userProfile?.username || '');
    const [instagram, setInstagram] = useState(userProfile?.instagram || '');
    const [facebook, setFacebook] = useState(userProfile?.facebook || '');
    const [bio, setBio] = useState(userProfile?.bio || '');
    const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(userProfile?.subscriptionTier || 'free');

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
            setDisplayName(userProfile.displayName || '');
            setUsername(userProfile.username || '');
            setInstagram(userProfile.instagram || '');
            setFacebook(userProfile.facebook || '');
            setBio(userProfile.bio || '');
            setCity(userProfile.city || '');
            setState(userProfile.state || '');
            setPhoneNumber(userProfile.phoneNumber || '');
            setCpf(userProfile.cpf || '');
            setPhotoPreview(userProfile.photoURL || null);
            setSelectedTier(userProfile.subscriptionTier);
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
                city,
                state,
                phoneNumber: phoneNumber.replace(/\D/g, ''),
                cpf: cpf.replace(/\D/g, ''),
                photoURL: finalPhotoURL,
                subscriptionTier: selectedTier,
                isProfilePublic: true
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

                        {/* Seletor de Perfil */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1 block">Tipo de Perfil</label>
                            <div className="p-1 bg-gray-100 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-gray-800 flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTier('free')}
                                    className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${selectedTier !== 'pastor' ? 'bg-white dark:bg-gray-800 text-bible-gold shadow-md' : 'text-gray-400'}`}
                                >
                                    <Users size={20} />
                                    <span>Membro</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTier('pastor')}
                                    className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${selectedTier === 'pastor' ? 'bg-bible-gold text-white shadow-lg' : 'text-gray-400'}`}
                                >
                                    <Crown size={20} />
                                    <span>Pastor</span>
                                </button>
                            </div>
                        </div>

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
