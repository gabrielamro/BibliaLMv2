"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, Apple, AtSign, Eye, EyeOff, MapPin, Loader2, AlertCircle, ShieldCheck, Crown, Users, Church, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon } from './LogoIcon';
import { SubscriptionTier, Church as ChurchType } from '../types';
import ForgotPasswordModal from './ForgotPasswordModal';

import { dbService } from '../services/supabase';

const BRAZIL_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { signIn, signInWithApple, signInWithEmail, signUpWithEmail, currentUser } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [city, setCity] = useState('');
    const [stateUF, setStateUF] = useState('');
    const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');

    // Church Linking State
    const [churchSearch, setChurchSearch] = useState('');
    const [churchResults, setChurchResults] = useState<ChurchType[]>([]);
    const [selectedChurch, setSelectedChurch] = useState<ChurchType | null>(null);
    const [isSearchingChurch, setIsSearchingChurch] = useState(false);
    const searchTimeoutRef = useRef<any>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [citiesList, setCitiesList] = useState<string[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
        if (currentUser && isOpen) {
            setLoading(false);
            onClose();
            navigate('/'); // Garante redirecionamento ao Santuário
        }
    }, [currentUser, isOpen, onClose, navigate]);

    // Limpa erro ao trocar de modo (Login/Registro)
    useEffect(() => {
        setError(null);
    }, [mode]);

    useEffect(() => {
        if (stateUF) {
            setLoadingCities(true);
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateUF}/municipios`)
                .then(res => res.json())
                .then(data => {
                    const sortedCities = data.map((c: any) => c.nome).sort();
                    setCitiesList(sortedCities);
                    if (sortedCities.length > 0 && !city) {
                        setCity(sortedCities[0]);
                    }
                })
                .finally(() => setLoadingCities(false));

        }
    }, [stateUF]);

    // Church Search Logic
    useEffect(() => {
        const term = churchSearch.trim();
        if (term.length >= 2 && city && stateUF) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

            setIsSearchingChurch(true);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const results = await dbService.searchChurches(term, city, stateUF);
                    setChurchResults(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearchingChurch(false);
                }
            }, 500);
        } else {
            setChurchResults([]);
            setIsSearchingChurch(false);
        }

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [churchSearch, city, stateUF]);

    if (!isOpen) return null;

    const getFriendlyErrorMessage = (error: any) => {
        const isValidationError = error.message?.includes("Nome de usuário não encontrado");
        if (!isValidationError) console.error("Auth Error:", error);
        if (isValidationError) return "Nome de usuário não encontrado. Verifique a grafia ou tente com seu e-mail.";

        const code = error.code;
        switch (code) {
            case 'auth/invalid-credential': return 'E-mail ou senha incorretos.';
            case 'auth/user-not-found': return 'Usuário não encontrado.';
            case 'auth/wrong-password': return 'Senha incorreta.';
            case 'auth/email-already-in-use': return 'Este e-mail já está cadastrado.';
            case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
            case 'auth/invalid-email': return 'Formato de e-mail inválido.';
            case 'auth/unauthorized-domain': return 'Domínio não autorizado.';
            default:
                const msg = error.message || '';
                // Tradução de erros comuns do Supabase Auth
                if (msg.includes("Unable to validate email address")) return "E-mail inválido ou mal formatado.";
                if (msg.includes("User already registered")) return "Este usuário já possui uma conta.";
                if (msg.includes("row violates row-level security")) return "Erro de permissão no banco: Adicione a política de INSERT no SQL Editor.";
                if (msg.includes("Email not confirmed")) return "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
                if (msg.includes("Invalid login credentials")) return "Credenciais de login inválidas.";
                if (msg.includes("email rate limit exceeded") || msg.includes("rate limit exceeded")) return "Limite de tentativas excedido. Tente novamente mais tarde.";
                if (msg.includes("Too many requests")) return "Muitas solicitações. Aguarde um momento.";
                return msg || 'Ocorreu um erro. Tente novamente.';
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'login') {
                await signInWithEmail(identifier, password);
            } else {
                await signUpWithEmail(identifier, password, name, username, city, stateUF, selectedTier);
            }
            // Success will trigger the useEffect to close and navigate
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setLoading(true);
        setError(null);
        try {
            if (provider === 'google') await signIn();
            else await signInWithApple();
            // Success will trigger the useEffect to close and navigate
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-bible-darkPaper w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-red-500 transition-colors z-50"><X size={20} /></button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <LogoIcon className="w-12 h-12 mx-auto mb-4" />
                        <h2 data-testid="auth-modal-heading" className="text-2xl font-serif font-bold text-gray-900 dark:text-white">{mode === 'login' ? 'Bem-vindo' : 'Criar Conta'}</h2>
                        <p className="text-sm text-gray-500 mt-1">Sua jornada no Reino continua aqui.</p>
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium leading-relaxed"><AlertCircle size={16} className="shrink-0" /> {error}</div>}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleSocialLogin('google')} disabled={loading} className="flex items-center justify-center gap-2 bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" /> Google</button>
                            <button onClick={() => handleSocialLogin('apple')} disabled={loading} className="flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-900 transition-all"><Apple size={20} /> Apple</button>
                        </div>

                        <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div><span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">ou e-mail / @usuário</span><div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div></div>

                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            {mode === 'register' && (
                                <>
                                    <div className="p-1 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex gap-1 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTier('free')}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${selectedTier === 'free' ? 'bg-white dark:bg-gray-800 text-bible-gold shadow-sm' : 'text-gray-400'}`}
                                        >
                                            <Users size={14} /> Membro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTier('pastor')}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${selectedTier === 'pastor' ? 'bg-bible-gold text-white shadow-md' : 'text-gray-400'}`}
                                        >
                                            <Crown size={14} /> Pastor
                                        </button>
                                    </div>

                                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 ring-bible-gold text-sm" required /></div>
                                    <div className="relative"><AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 ring-bible-gold text-sm" required /></div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <select data-testid="uf-select" value={stateUF} onChange={e => setStateUF(e.target.value)} className="col-span-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold">
                                            <option value="">UF</option>
                                            {BRAZIL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <select data-testid="city-select" value={city} onChange={e => setCity(e.target.value)} className="col-span-3 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm" disabled={!stateUF} required>
                                            <option value="">{loadingCities ? 'Carregando...' : 'Cidade'}</option>
                                            {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>

                                    </div>

                                    {/* Removes church linking from sign up. */}
                                </>
                            )}
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder={mode === 'login' ? "@usuário ou e-mail" : "Seu melhor e-mail"}
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 ring-bible-gold text-sm"
                                    required
                                />
                            </div>
                            <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type={showPassword ? "text" : "password"} placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 ring-bible-gold text-sm" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

                            {mode === 'login' && <button type="button" onClick={() => setIsForgotModalOpen(true)} className="w-full text-right text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-bible-gold">Esqueci minha senha</button>}

                            <button 
                                type="submit" 
                                data-testid="auth-submit-btn"
                                aria-label={mode === 'login' ? 'Entrar' : 'Cadastrar'}
                                disabled={loading} 
                                className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >

                                {loading ? <Loader2 className="animate-spin" size={20} /> : mode === 'login' ? 'Entrar' : 'Cadastrar'}
                            </button>
                        </form>

                        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="w-full text-center text-xs font-bold text-bible-gold hover:underline">{mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}</button>
                    </div>
                </div>
            </div>
            <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} initialEmail={identifier.includes('@') ? identifier : ''} />
        </div>
    );
};

export default LoginModal;