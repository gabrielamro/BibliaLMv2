"use client";

import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { HeaderProvider } from '../contexts/HeaderContext';
import { FeatureProvider } from '../contexts/FeatureContext';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SettingsProvider>
                <FeatureProvider>
                    <HeaderProvider>
                        <WorkspaceProvider>
                            <ErrorBoundary>
                                {/* <LegacyRedirect /> */}
                                {children}
                            </ErrorBoundary>
                        </WorkspaceProvider>
                    </HeaderProvider>
                </FeatureProvider>
            </SettingsProvider>
        </AuthProvider>
    );
}
