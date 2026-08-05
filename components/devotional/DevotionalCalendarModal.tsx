"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';

interface DevotionalCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  completedDates?: string[];
}

export default function DevotionalCalendarModal({
  isOpen,
  onClose,
  onSelectDate,
  completedDates = [],
}: DevotionalCalendarModalProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const monthYearLabel = useMemo(() => {
    const month = currentMonthDate.toLocaleDateString('pt-BR', { month: 'long' });
    const year = currentMonthDate.getFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  }, [currentMonthDate]);

  const daysInMonth = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dateNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isFuture: boolean;
      isCompleted: boolean;
    }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateNumber: 0,
        dateStr: `prev-${i}`,
        isCurrentMonth: false,
        isToday: false,
        isFuture: false,
        isCompleted: false,
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      const isCompleted = completedDates.includes(dateStr);

      days.push({
        dateNumber: day,
        dateStr,
        isCurrentMonth: true,
        isToday,
        isFuture,
        isCompleted,
      });
    }

    return days;
  }, [currentMonthDate, completedDates, todayStr]);

  const changeMonth = (delta: number) => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-[28px] border border-[#f0e4cf] bg-[#fffdf8] p-6 shadow-2xl dark:border-white/10 dark:bg-[#1f1d1a] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#eee4d5] pb-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edad2c]/15 text-[#edad2c]">
              <CalendarDays size={18} />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#302316] dark:text-[#fff7eb]">
                Calendário Devocional Histórico
              </h2>
              <p className="text-[11px] text-[#736353] dark:text-[#a89988]">
                Consulte o Pão Diário e diário espiritual por data.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4ebd9] text-[#4a3928] hover:bg-[#e8dcbf] dark:bg-[#2b2722] dark:text-[#ebdccb]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ded5c7] text-[#4a3928] hover:bg-[#f4ebd9] dark:border-white/10 dark:text-[#ebdccb]"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="font-serif text-sm font-bold text-[#302316] dark:text-[#fff7eb]">
            {monthYearLabel}
          </span>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ded5c7] text-[#4a3928] hover:bg-[#f4ebd9] dark:border-white/10 dark:text-[#ebdccb]"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-wider text-[#edad2c]">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName) => (
            <span key={dayName} className="py-1">
              {dayName}
            </span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1.5 text-center">
          {daysInMonth.map((dayItem, index) => {
            if (!dayItem.isCurrentMonth) {
              return <div key={`empty-${index}`} className="h-10 w-10" />;
            }

            return (
              <button
                key={dayItem.dateStr}
                type="button"
                disabled={dayItem.isFuture}
                onClick={() => {
                  onSelectDate(dayItem.dateStr);
                  onClose();
                }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition ${
                  dayItem.isToday
                    ? 'border-2 border-[#edad2c] bg-[#edad2c]/15 text-[#302316] dark:text-[#fff7eb]'
                    : dayItem.isCompleted
                      ? 'bg-[#edad2c] text-white shadow-sm'
                      : dayItem.isFuture
                        ? 'cursor-not-allowed opacity-30 text-gray-400'
                        : 'bg-[#f7efe1] text-[#4a3928] hover:bg-[#edad2c]/20 dark:bg-[#2b2722] dark:text-[#ebdccb]'
                }`}
              >
                <span>{dayItem.dateNumber}</span>
                {dayItem.isCompleted ? (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#edad2c] shadow-sm">
                    <Check size={10} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between border-t border-[#eee4d5] pt-4 text-[11px] text-[#736353] dark:border-white/10 dark:text-[#a89988]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#edad2c]" />
              <span>Concluído</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-[#edad2c] bg-[#edad2c]/20" />
              <span>Hoje</span>
            </div>
          </div>

          <Link
            href="/diario-espiritual"
            onClick={onClose}
            className="inline-flex items-center gap-1 font-bold text-[#edad2c] hover:underline"
          >
            <span>Ver no Diário Espiritual</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
