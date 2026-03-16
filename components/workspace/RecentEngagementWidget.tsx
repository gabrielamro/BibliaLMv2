"use client";
import { useNavigate } from '../../utils/router';

import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/supabase';
import { CustomPlan, PlanParticipant } from '../../types';
import { User, Clock, ArrowRight } from 'lucide-react';


interface RecentEngagementWidgetProps {
  plans: CustomPlan[];
}

const RecentEngagementWidget: React.FC<RecentEngagementWidgetProps> = ({ plans }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<{ plan: CustomPlan, participant: PlanParticipant }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        // Get top 5 most recently updated plans
        const activePlans = [...plans]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);

        const allActivities: { plan: CustomPlan, participant: PlanParticipant }[] = [];

        for (const plan of activePlans) {
          const participants = await dbService.getRecentPlanParticipants(plan.id, 3);
          participants.forEach(p => {
            allActivities.push({ plan, participant: p });
          });
        }

        // Sort by last activity
        allActivities.sort((a, b) => new Date(b.participant.lastActivityAt).getTime() - new Date(a.participant.lastActivityAt).getTime());
        
        setActivities(allActivities.slice(0, 10));
      } catch (e) {
        console.error("Error loading recent engagement:", e);
      } finally {
        setLoading(false);
      }
    };

    if (plans.length > 0) {
      loadActivities();
    } else {
      setLoading(false);
    }
  }, [plans]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <Clock size={48} className="mb-4 opacity-20" />
        <p className="text-sm">Nenhuma atividade recente encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => (
        <div key={`${activity.plan.id}-${activity.participant.uid}-${idx}`} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-colors group cursor-pointer" onClick={() => navigate(`/jornada/${activity.plan.id}`)}>
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0">
            {activity.participant.photoURL ? (
              <img src={activity.participant.photoURL} alt={activity.participant.displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-2 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {activity.participant.displayName} <span className="font-normal text-gray-500">em</span> {activity.plan.title}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={10} /> {new Date(activity.participant.lastActivityAt).toLocaleDateString()} às {new Date(activity.participant.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-bible-gold transition-colors" />
        </div>
      ))}
    </div>
  );
};

export default RecentEngagementWidget;
