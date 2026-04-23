"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Inicio03 from '../views/Inicio03';

export default function Home() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="animate-spin text-bible-gold" size={40} />
            </div>
        );
    }

    return <Inicio03 />;
}
