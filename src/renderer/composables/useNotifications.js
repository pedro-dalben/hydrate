// Composable para gerenciamento de notificações inteligentes
import { ref, computed } from 'vue';

export function useNotifications() {
    const notifications = ref([]);
    const notificationSettings = ref({
        enabled: true,
        smartReminders: true,
        workHours: { start: '09:00', end: '18:00' },
        frequency: 'adaptive', // fixed, adaptive, smart
        quietHours: { start: '22:00', end: '07:00' },
        weekendMode: false
    });

    // Computed properties
    const isQuietTime = computed(() => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const quietStart = parseTime(notificationSettings.value.quietHours.start);
        const quietEnd = parseTime(notificationSettings.value.quietHours.end);

        if (quietStart > quietEnd) {
            // Quiet hours cross midnight
            return currentTime >= quietStart || currentTime <= quietEnd;
        }
        return currentTime >= quietStart && currentTime <= quietEnd;
    });

    const isWorkTime = computed(() => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const workStart = parseTime(notificationSettings.value.workHours.start);
        const workEnd = parseTime(notificationSettings.value.workHours.end);

        return currentTime >= workStart && currentTime <= workEnd;
    });

    const isWeekend = computed(() => {
        const day = new Date().getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    });

    // Methods
    const parseTime = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const shouldShowNotification = () => {
        if (!notificationSettings.value.enabled) return false;
        if (isQuietTime.value) return false;
        if (isWeekend.value && notificationSettings.value.weekendMode) return false;

        return true;
    };

    const calculateNextReminderTime = async () => {
        try {
            const config = await window.hydrateAPI.getConfig();
            const progress = await window.hydrateAPI.getDailyProgress();

            let baseInterval = config.interval || 60; // minutes

            if (notificationSettings.value.frequency === 'adaptive') {
                // Adaptive frequency based on progress
                const progressRatio = progress.current / progress.goal;

                if (progressRatio < 0.3) {
                    // Behind schedule, more frequent reminders
                    baseInterval = Math.max(30, baseInterval * 0.7);
                } else if (progressRatio > 0.8) {
                    // Ahead of schedule, less frequent reminders
                    baseInterval = baseInterval * 1.3;
                }
            } else if (notificationSettings.value.frequency === 'smart') {
                // Smart frequency based on time of day and work hours
                if (isWorkTime.value) {
                    baseInterval = Math.max(45, baseInterval * 0.8); // More frequent during work
                } else {
                    baseInterval = baseInterval * 1.2; // Less frequent outside work
                }
            }

            return Math.round(baseInterval);
        } catch (error) {
            console.error('Erro ao calcular próximo lembrete:', error);
            return 60; // Default fallback
        }
    };

    const createNotification = (type, title, message, options = {}) => {
        const notification = {
            id: Date.now(),
            type, // info, success, warning, error
            title,
            message,
            timestamp: new Date(),
            read: false,
            persistent: options.persistent || false,
            actions: options.actions || [],
            ...options
        };

        notifications.value.unshift(notification);

        // Auto-remove non-persistent notifications after 5 seconds
        if (!notification.persistent) {
            setTimeout(() => {
                removeNotification(notification.id);
            }, 5000);
        }

        return notification;
    };

    const removeNotification = (id) => {
        const index = notifications.value.findIndex(n => n.id === id);
        if (index > -1) {
            notifications.value.splice(index, 1);
        }
    };

    const markAsRead = (id) => {
        const notification = notifications.value.find(n => n.id === id);
        if (notification) {
            notification.read = true;
        }
    };

    const clearAll = () => {
        notifications.value = [];
    };

    const showHydrationReminder = async () => {
        if (!shouldShowNotification()) return;

        try {
            const progress = await window.hydrateAPI.getDailyProgress();
            const config = await window.hydrateAPI.getConfig();

            let message = 'Hora de beber água!';
            let type = 'info';

            // Personalize message based on progress
            const progressRatio = progress.current / progress.goal;

            if (progressRatio < 0.2) {
                message = '💧 Você está atrasado com sua hidratação hoje!';
                type = 'warning';
            } else if (progressRatio > 0.8) {
                message = '🎉 Você está indo muito bem! Continue assim!';
                type = 'success';
            } else if (isWorkTime.value) {
                message = '⚡ Pausa para hidratação no trabalho!';
            }

            return createNotification(type, 'Lembrete de Hidratação', message, {
                persistent: true,
                actions: [
                    { id: 'drink', label: 'Bebi água!', variant: 'success' },
                    { id: 'snooze', label: 'Lembrar em 15min', variant: 'secondary' }
                ]
            });
        } catch (error) {
            console.error('Erro ao mostrar lembrete:', error);
        }
    };

    const showGoalAchieved = () => {
        return createNotification('success', '🎯 Meta Atingida!', 'Parabéns! Você atingiu sua meta diária de hidratação!', {
            persistent: true,
            actions: [
                { id: 'celebrate', label: 'Comemorar!', variant: 'success' }
            ]
        });
    };

    const showStreakMilestone = (streak) => {
        const milestones = {
            3: '🔥 3 dias seguidos!',
            7: '🌟 Uma semana completa!',
            14: '💎 Duas semanas!',
            30: '🏆 Um mês inteiro!',
            100: '👑 100 dias! Você é incrível!'
        };

        const message = milestones[streak];
        if (message) {
            return createNotification('success', 'Marco Alcançado!', message, {
                persistent: true
            });
        }
    };

    const loadSettings = async () => {
        try {
            const config = await window.hydrateAPI.getConfig();
            if (config.notificationSettings) {
                notificationSettings.value = { ...notificationSettings.value, ...config.notificationSettings };
            }
        } catch (error) {
            console.error('Erro ao carregar configurações de notificação:', error);
        }
    };

    const saveSettings = async (newSettings) => {
        try {
            notificationSettings.value = { ...notificationSettings.value, ...newSettings };
            await window.hydrateAPI.setConfig({
                notificationSettings: notificationSettings.value
            });
        } catch (error) {
            console.error('Erro ao salvar configurações de notificação:', error);
            throw error;
        }
    };

    // Weather-based suggestions
    const getWeatherBasedSuggestion = async () => {
        // This would integrate with a weather API
        // For now, return a mock suggestion
        const suggestions = [
            '☀️ Dia quente! Beba mais água que o normal.',
            '🌧️ Dia chuvoso, mas não esqueça da hidratação!',
            '❄️ Tempo frio, mas seu corpo ainda precisa de água.',
            '🌤️ Dia perfeito para manter a hidratação em dia!'
        ];

        return suggestions[Math.floor(Math.random() * suggestions.length)];
    };

    // Activity-based reminders
    const createActivityReminder = (activity) => {
        const reminders = {
            exercise: '🏃‍♂️ Exercitando? Hidrate-se antes, durante e depois!',
            work: '💻 Trabalhando? Faça uma pausa para beber água!',
            travel: '✈️ Viajando? A hidratação é ainda mais importante!',
            sick: '🤒 Não se sentindo bem? A água ajuda na recuperação!'
        };

        const message = reminders[activity] || 'Hora de beber água!';
        return createNotification('info', 'Lembrete Personalizado', message);
    };

    return {
        // Reactive data
        notifications,
        notificationSettings,

        // Computed
        isQuietTime,
        isWorkTime,
        isWeekend,

        // Methods
        shouldShowNotification,
        calculateNextReminderTime,
        createNotification,
        removeNotification,
        markAsRead,
        clearAll,
        showHydrationReminder,
        showGoalAchieved,
        showStreakMilestone,
        loadSettings,
        saveSettings,
        getWeatherBasedSuggestion,
        createActivityReminder
    };
}
