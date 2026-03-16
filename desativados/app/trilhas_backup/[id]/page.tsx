"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import TrackReaderPage from '../../../views/TrackReaderPage';

export default function Page() {
    const params = useParams();
    const id = params?.id as string;
    return <TrackReaderPage trackId={id} />;
}
