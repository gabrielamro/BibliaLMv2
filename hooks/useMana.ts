import { useAuth } from '../contexts/AuthContext';

export const useMana = () => {
    const { recordActivity } = useAuth();

    const addMana = async (amount: number, description: string) => {
        try {
            // No sistema BíbliaLM, "Maná" é equivalente ao XP e progresso do usuário.
            // A função recordActivity gerencia o ganho de XP e o log de atividades.
            if (recordActivity) {
                await recordActivity('devotional', description, { xpGained: amount });
            } else {
                console.warn('recordActivity não disponível no AuthContext');
            }
        } catch (error) {
            console.error('Erro ao adicionar maná:', error);
        }
    };

    return { addMana };
};
