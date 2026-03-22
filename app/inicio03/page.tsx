'use client';
import Inicio03 from '../../views/Inicio03';
import { Suspense } from 'react';

function Inicio03Content() {
  return <Inicio03 />;
}

export default function Inicio03Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <Inicio03Content />
    </Suspense>
  );
}
