// Composable para gerenciamento de progresso e dados
import { ref, computed } from 'vue';

export function useProgress() {
    const progress = ref({ current: 0, goal: 8, percentage: 0 });
    const todayCount = ref(0);
    const weekData = ref([]);
    const loading = ref(false);

    // Computed properties
    const weekAverage = computed(() => {
        if (weekData.value.length === 0) return 0;
        const total = weekData.value.reduce((sum, day) => sum + day.count, 0);
        return Math.round(total / 7);
    });

    const totalWeek = computed(() => {
        return weekData.value.reduce((sum, day) => sum + day.count, 0);
    });

    const bestDay = computed(() => {
        if (weekData.value.length === 0) return 0;
        return Math.max(...weekData.value.map(day => day.count), 0);
    });

    const circumference = computed(() => 2 * Math.PI * 45);

    // Methods
    const loadProgress = async () => {
        try {
            loading.value = true;
            const progressData = await window.hydrateAPI.getDailyProgress();
            progress.value = progressData;
            todayCount.value = progressData.current;
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
        } finally {
            loading.value = false;
        }
    };

    const loadWeekData = async () => {
        try {
            const data = await window.hydrateAPI.getIntakeByRange(7);
            weekData.value = data;
        } catch (error) {
            console.error('Erro ao carregar dados da semana:', error);
        }
    };

    const addIntake = async () => {
        try {
            loading.value = true;
            await window.hydrateAPI.addIntake();
            await loadProgress();
            await loadWeekData();
            return true;
        } catch (error) {
            console.error('Erro ao adicionar ingestão:', error);
            return false;
        } finally {
            loading.value = false;
        }
    };

    const calculateStreak = async () => {
        try {
            const data = await window.hydrateAPI.getIntakeByRange(30);
            const config = await window.hydrateAPI.getConfig();

            let currentStreak = 0;
            const today = new Date();

            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const dayData = data.find(d => d.date === dateStr);
                const count = dayData ? dayData.count : 0;

                if (count >= (config.dailyGoal || 8)) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            return currentStreak;
        } catch (error) {
            console.error('Erro ao calcular sequência:', error);
            return 0;
        }
    };

    const getGoalAchievedPercentage = async () => {
        try {
            const config = await window.hydrateAPI.getConfig();
            const daysWithGoal = weekData.value.filter(day => day.count >= (config.dailyGoal || 8)).length;
            return Math.round((daysWithGoal / 7) * 100);
        } catch (error) {
            console.error('Erro ao calcular porcentagem de meta:', error);
            return 0;
        }
    };

    return {
        // Reactive data
        progress,
        todayCount,
        weekData,
        loading,

        // Computed
        weekAverage,
        totalWeek,
        bestDay,
        circumference,

        // Methods
        loadProgress,
        loadWeekData,
        addIntake,
        calculateStreak,
        getGoalAchievedPercentage
    };
}
