"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Inicio03 from '../views/Inicio03';

export default function Home() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.replace('/intro');
        }
    }, [currentUser, loading, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="animate-spin text-bible-gold" size={40} />
            </div>
        );
    }

    if (!currentUser) {
        return null; // vai redirecionar no useEffect
    }

    return <Inicio03 />;
}

