"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, MoreHorizontal } from 'lucide-react';

export type CultoPlusTopActionItem = {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

type CultoPlusTopActionsProps = {
  backHref: string;
  contained?: boolean;
  menuLabel?: string;
  onNotify?: () => void;
  items: CultoPlusTopActionItem[];
};

const CultoPlusTopActions: React.FC<CultoPlusTopActionsProps> = ({
  backHref,
  contained = false,
  menuLabel = 'Abrir configurações',
  onNotify,
  items,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  return (
    <>
      <Link
        href={backHref}
        className={`culto-top-back absolute z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition hover:bg-white ${contained ? 'left-0 top-0' : 'left-5 top-5'}`}
        aria-label="Voltar"
      >
        <ArrowLeft size={18} />
      </Link>

      <div className={`culto-top-tools absolute z-20 flex items-center gap-2 ${contained ? 'right-0 top-0' : 'right-5 top-5'}`}>
        <button
          type="button"
          onClick={onNotify}
          className="culto-top-button inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition hover:bg-white"
          aria-label="Notificações"
        >
          <Bell size={17} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="culto-top-button inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition hover:bg-white"
            aria-label={menuLabel}
            aria-expanded={isOpen}
          >
            <MoreHorizontal size={19} />
          </button>
          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/20 bg-white p-2 text-gray-900 shadow-2xl dark:border-gray-800 dark:bg-bible-darkPaper dark:text-white">
              {items.map((item) => {
                const content = (
                  <>
                    {item.icon}
                    {item.label}
                  </>
                );

                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={close}
                      className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-medium transition hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.onClick?.();
                      close();
                    }}
                    className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-medium transition hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CultoPlusTopActions;
