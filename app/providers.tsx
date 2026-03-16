"use client";

import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { HeaderProvider } from '../contexts/HeaderContext';
import { FeatureProvider } from '../contexts/FeatureContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SettingsProvider>
                <FeatureProvider>
                    <HeaderProvider>
                        <ErrorBoundary>
                            {/* <LegacyRedirect /> */}
                            {children}
                        </ErrorBoundary>
                    </HeaderProvider>
                </FeatureProvider>
            </SettingsProvider>
        </AuthProvider>
    );
}
