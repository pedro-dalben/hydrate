// Aplicação Vue principal componentizada
const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

// Componente de Toast de Notificação
const NotificationToast = {
    template: `
        <div class="notification-container">
            <transition-group name="toast" tag="div">
                <div
                    v-for="notification in notifications"
                    :key="notification.id"
                    :class="toastClasses(notification)"
                    class="notification-toast"
                >
                    <div class="toast-content">
                        <div class="toast-icon">{{ getIcon(notification.type) }}</div>
                        <div class="toast-body">
                            <div class="toast-title">{{ notification.title }}</div>
                            <div class="toast-message">{{ notification.message }}</div>
                            <div v-if="notification.actions && notification.actions.length" class="toast-actions">
                                <button
                                    v-for="action in notification.actions"
                                    :key="action.id"
                                    :class="['toast-action', \`toast-action--\${action.variant || 'primary'}\`]"
                                    @click="handleAction(notification, action)"
                                >
                                    {{ action.label }}
                                </button>
                            </div>
                        </div>
                        <button
                            class="toast-close"
                            @click="$emit('remove', notification.id)"
                            v-if="!notification.persistent || notification.actions"
                        >
                            ✕
                        </button>
                    </div>
                    <div
                        v-if="!notification.persistent"
                        class="toast-progress"
                        :style="{ animationDuration: '5s' }"
                    ></div>
                </div>
            </transition-group>
        </div>
    `,
    props: {
        notifications: {
            type: Array,
            default: () => []
        }
    },
    emits: ['remove', 'action'],
    methods: {
        toastClasses(notification) {
            return [
                'toast',
                `toast--${notification.type}`,
                {
                    'toast--persistent': notification.persistent,
                    'toast--read': notification.read
                }
            ];
        },

        getIcon(type) {
            const icons = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌'
            };
            return icons[type] || 'ℹ️';
        },

        handleAction(notification, action) {
            this.$emit('action', { notification, action });
        }
    }
};

// Componente de Alerta de Hidratação
const HydrationAlert = {
    template: `
        <div v-if="showAlert" class="hydration-alert-overlay" @click="dismissAlert">
            <div class="hydration-alert-card base-card base-card--primary base-card--large" @click.stop>
                <div class="alert-content">
                    <div class="alert-icon">💧</div>
                    <h2>Hora de se hidratar!</h2>
                    <p>É importante beber água regularmente para manter sua saúde.</p>

                    <div class="progress-info" v-if="progress">
                        <div class="progress-text">
                            {{ progress.current }}/{{ progress.goal }} copos hoje ({{ progress.percentage }}%)
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: Math.min(progress.percentage, 100) + '%' }"></div>
                        </div>
                    </div>

                    <div class="alert-buttons">
                        <button class="base-button base-button--success base-button--large" @click="drinkWater">
                            <div class="button-content">
                                <span class="button-icon">✅</span>
                                <span class="button-text">Bebi água!</span>
                            </div>
                        </button>
                        <button class="base-button base-button--secondary base-button--large" @click="dismissAlert">
                            <div class="button-content">
                                <span class="button-icon">⏰</span>
                                <span class="button-text">Lembrar depois</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    props: ['showAlert', 'progress'],
    emits: ['dismiss', 'drink-water'],
    methods: {
        dismissAlert() {
            this.$emit('dismiss');
        },
        drinkWater() {
            this.$emit('drink-water');
        }
    }
};

// Componente Home
const HomeView = {
    components: { HydrationAlert },
    template: `
        <div class="home-view">
            <!-- Daily Progress Card -->
            <div class="daily-progress-card base-card base-card--primary base-card--large base-card--elevated">
                <div class="card-header">
                    <div class="progress-header">
                        <h3 class="card-title">Meta Diária</h3>
                        <button
                            class="base-button base-button--secondary base-button--small"
                            @click="toggleTheme"
                            :title="'Alternar para tema ' + (currentTheme === 'light' ? 'escuro' : 'claro')"
                        >
                            <div class="button-content">
                                <span class="button-text">{{ currentTheme === 'light' ? '🌙' : '☀️' }}</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div class="card-body">
                    <div class="progress-container">
                        <div class="progress-circle">
                            <svg viewBox="0 0 100 100" width="150" height="150">
                                <circle cx="50" cy="50" r="45" stroke="rgba(0,0,0,0.1)" stroke-width="8" fill="none"/>
                                <circle
                                    cx="50" cy="50" r="45"
                                    stroke="var(--accent-primary)"
                                    stroke-width="8"
                                    fill="none"
                                    stroke-linecap="round"
                                    :stroke-dasharray="circumference"
                                    :stroke-dashoffset="strokeDashoffset"
                                    transform="rotate(-90 50 50)"
                                    style="transition: stroke-dashoffset 0.6s ease"
                                />
                                <text x="50" y="45" text-anchor="middle" class="progress-number">{{ progress.current }}</text>
                                <text x="50" y="60" text-anchor="middle" class="progress-goal">/ {{ progress.goal }}</text>
                            </svg>
                        </div>
                        <div class="progress-percentage">{{ progress.percentage }}% da meta</div>
                    </div>
                </div>
            </div>

            <!-- Main Action Button -->
            <div class="water-counter base-card base-card--large base-card--elevated">
                <div class="card-body">
                    <button
                        class="base-button base-button--primary base-button--large base-button--full-width"
                        :class="{ 'base-button--loading': loading }"
                        @click="addIntake"
                        :disabled="loading"
                    >
                        <div class="button-content">
                            <span v-if="loading" class="button-spinner">⏳</span>
                            <span v-else class="button-icon">💧</span>
                            <span class="button-text">{{ loading ? 'Adicionando...' : 'Bebi água!' }}</span>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <button
                    class="base-button base-button--secondary base-button--medium"
                    @click="$emit('navigate', 'stats')"
                >
                    <div class="button-content">
                        <span class="button-icon">📊</span>
                        <span class="button-text">Estatísticas</span>
                    </div>
                </button>
                <button
                    class="base-button base-button--secondary base-button--medium"
                    @click="exportData"
                >
                    <div class="button-content">
                        <span class="button-icon">📤</span>
                        <span class="button-text">Exportar Dados</span>
                    </div>
                </button>
                <button
                    class="base-button base-button--secondary base-button--medium"
                    @click="importData"
                >
                    <div class="button-content">
                        <span class="button-icon">📥</span>
                        <span class="button-text">Importar Dados</span>
                    </div>
                </button>
            </div>

            <!-- Hydration Alert -->
            <HydrationAlert
                :show-alert="showAlert"
                :progress="progress"
                @dismiss="dismissAlert"
                @drink-water="drinkWaterFromAlert"
            />

            <!-- Hidden file input for import -->
            <input
                type="file"
                ref="fileInput"
                @change="handleFileImport"
                accept=".json"
                style="display: none;"
            >
        </div>
    `,
    emits: ['navigate'],
    data() {
        return {
            progress: { current: 0, goal: 8, percentage: 0 },
            loading: false,
            showAlert: false,
            currentTheme: 'light',
            audioElement: null,
            soundInterval: null,
            beepInterval: null
        }
    },
    computed: {
        circumference() {
            return 2 * Math.PI * 45;
        },
        strokeDashoffset() {
            const progress = Math.min(this.progress.current / this.progress.goal, 1);
            return this.circumference - (progress * this.circumference);
        }
    },
    async mounted() {
        await this.loadProgress();
        await this.loadTheme();
        this.setupAlarmListener();
        this.setupNavigationListener();
        this.setupAudio();
    },
    methods: {
        async loadProgress() {
            try {
                this.loading = true;
                const progressData = await window.hydrateAPI.getDailyProgress();
                this.progress = progressData;
            } catch (error) {
                console.error('Erro ao carregar progresso:', error);
            } finally {
                this.loading = false;
            }
        },

        async loadTheme() {
            try {
                const config = await window.hydrateAPI.getConfig();
                this.currentTheme = config.theme || 'light';
                document.body.className = `theme-${this.currentTheme}`;
            } catch (error) {
                console.error('Erro ao carregar tema:', error);
            }
        },

        async toggleTheme() {
            try {
                const newTheme = await window.hydrateAPI.toggleTheme();
                this.currentTheme = newTheme;
                document.body.className = `theme-${newTheme}`;
            } catch (error) {
                console.error('Erro ao alternar tema:', error);
            }
        },

        async addIntake() {
            try {
                this.loading = true;
                await window.hydrateAPI.addIntake();
                await this.loadProgress();
            } catch (error) {
                console.error('Erro ao adicionar ingestão:', error);
            } finally {
                this.loading = false;
            }
        },

        async drinkWaterFromAlert() {
            await this.addIntake();
            this.dismissAlert();
        },

        setupAlarmListener() {
            console.log('=== CONFIGURANDO LISTENER DE ALARME ===');
            window.hydrateAPI.onAlarmTriggered(() => {
                console.log('=== ALARME RECEBIDO NO RENDERER ===');
                this.showHydrationAlert();
            });
        },

        setupNavigationListener() {
            window.hydrateAPI.onNavigateTo((event, view) => {
                this.$emit('navigate', view);
            });
        },

        setupAudio() {
            console.log('=== CONFIGURANDO ÁUDIO ===');

            this.audioElement = document.createElement('audio');
            this.audioElement.src = 'assets/sounds/water-droplet-drip.mp3';
            this.audioElement.preload = 'auto';
            this.audioElement.volume = 0.7;

            this.audioElement.style.display = 'none';
            document.body.appendChild(this.audioElement);

            console.log('Elemento de áudio criado e adicionado ao DOM');

            this.audioElement.addEventListener('canplay', () => {
                console.log('✅ Áudio pronto para reproduzir');
            });

            this.audioElement.addEventListener('error', (e) => {
                console.error('❌ Erro no áudio:', e);
            });

            this.audioElement.addEventListener('play', () => {
                console.log('🔊 Áudio começou a tocar');
            });

            this.audioElement.load();
        },

        async showHydrationAlert() {
            console.log('=== SHOW HYDRATION ALERT CHAMADA ===');
            this.showAlert = true;
            await this.loadProgress();

            try {
                const config = await window.hydrateAPI.getConfig();
                if (config.soundEnabled) {
                    await this.playSound();
                    this.startSoundLoop();
                }
            } catch (error) {
                console.error('Erro ao tocar som:', error);
            }
        },

        async dismissAlert() {
            this.showAlert = false;
            this.stopSound();

            try {
                await window.hydrateAPI.dismissAlarm();
            } catch (error) {
                console.error('Erro ao dismissar alarme:', error);
            }
        },

        async playSound() {
            console.log('=== PLAY SOUND ===');

            if (this.audioElement) {
                console.log('Tentando com audioElement existente...');
                this.audioElement.currentTime = 0;

                try {
                    await this.audioElement.play();
                    console.log('✅ Som tocado com audioElement!');
                    return true;
                } catch (error) {
                    console.log('❌ AudioElement falhou, tentando método alternativo...');
                    return this.tryAlternativeSound();
                }
            } else {
                return this.tryAlternativeSound();
            }
        },

        async tryAlternativeSound() {
            console.log('Tentando método alternativo...');

            try {
                const audio = new Audio('assets/sounds/water-droplet-drip.mp3');
                audio.volume = 0.7;

                await audio.play();
                console.log('✅ Som tocado com novo Audio!');
                return true;
            } catch (error) {
                console.log('❌ Novo Audio falhou, tentando beep...');
                return this.playBeep();
            }
        },

        playBeep() {
            console.log('Tentando beep com Web Audio API...');

            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);

                console.log('✅ Beep tocado!');
                return true;
            } catch (error) {
                console.error('❌ Beep também falhou:', error);
                return false;
            }
        },

        startSoundLoop() {
            console.log('Iniciando loop de som...');

            this.soundInterval = setInterval(() => {
                if (this.audioElement) {
                    this.audioElement.currentTime = 0;
                    this.audioElement.play().catch(console.error);
                }
            }, 3000);
        },

        startBeepLoop() {
            this.beepInterval = setInterval(() => {
                this.playBeep();
            }, 3000);
        },

        stopSound() {
            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement.currentTime = 0;
            }
            if (this.soundInterval) {
                clearInterval(this.soundInterval);
                this.soundInterval = null;
            }
            if (this.beepInterval) {
                clearInterval(this.beepInterval);
                this.beepInterval = null;
            }
        },

        async exportData() {
            try {
                const data = await window.hydrateAPI.exportData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `hydrate-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                console.log('Dados exportados com sucesso');
            } catch (error) {
                console.error('Erro ao exportar dados:', error);
                alert('Erro ao exportar dados: ' + error.message);
            }
        },

        importData() {
            this.$refs.fileInput.click();
        },

        async handleFileImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (confirm('Isso irá substituir todos os seus dados atuais. Deseja continuar?')) {
                    const result = await window.hydrateAPI.importData(data);
                    alert(`${result.imported} registros importados com sucesso!`);
                    await this.loadProgress();
                }
            } catch (error) {
                console.error('Erro ao importar dados:', error);
                alert('Erro ao importar dados: ' + error.message);
            }

            event.target.value = '';
        }
    },

    beforeUnmount() {
        window.hydrateAPI.removeAlarmListener();
        window.hydrateAPI.removeNavigateListener();
        this.stopSound();
        if (this.audioElement && this.audioElement.parentNode) {
            this.audioElement.parentNode.removeChild(this.audioElement);
        }
    }
};

// Componente Stats (simplificado para demonstração)
const StatsView = {
    template: `
        <div class="stats-view">
            <div class="base-card base-card--large base-card--elevated">
                <div class="card-header">
                    <h3 class="card-title">Estatísticas</h3>
                    <button
                        class="base-button base-button--secondary base-button--small"
                        @click="$emit('navigate', 'home')"
                    >
                        <div class="button-content">
                            <span class="button-icon">🏠</span>
                            <span class="button-text">Voltar</span>
                        </div>
                    </button>
                </div>
                <div class="card-body">
                    <div class="stats-grid">
                        <div class="stat-card base-card base-card--small base-card--primary">
                            <div class="card-body">
                                <div class="stat-content">
                                    <div class="stat-icon">📊</div>
                                    <div class="stat-value">{{ weekAverage }}</div>
                                    <div class="stat-label">Média Semanal</div>
                                </div>
                            </div>
                        </div>
                        <div class="stat-card base-card base-card--small base-card--success">
                            <div class="card-body">
                                <div class="stat-content">
                                    <div class="stat-icon">🔥</div>
                                    <div class="stat-value">{{ streak }}</div>
                                    <div class="stat-label">Sequência</div>
                                </div>
                            </div>
                        </div>
                        <div class="stat-card base-card base-card--small base-card--info">
                            <div class="card-body">
                                <div class="stat-content">
                                    <div class="stat-icon">🎯</div>
                                    <div class="stat-value">{{ goalPercentage }}%</div>
                                    <div class="stat-label">Meta Atingida</div>
                                </div>
                            </div>
                        </div>
                        <div class="stat-card base-card base-card--small base-card--warning">
                            <div class="card-body">
                                <div class="stat-content">
                                    <div class="stat-icon">⭐</div>
                                    <div class="stat-value">{{ bestDay }}</div>
                                    <div class="stat-label">Melhor Dia</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    emits: ['navigate'],
    data() {
        return {
            weekData: [],
            weekAverage: 0,
            streak: 0,
            goalPercentage: 0,
            bestDay: 0
        }
    },
    async mounted() {
        await this.loadStats();
    },
    methods: {
        async loadStats() {
            try {
                const data = await window.hydrateAPI.getIntakeByRange(7);
                this.weekData = data;

                // Calcular estatísticas
                const total = data.reduce((sum, day) => sum + day.count, 0);
                this.weekAverage = Math.round(total / 7);
                this.bestDay = Math.max(...data.map(day => day.count), 0);

                // Calcular sequência
                this.streak = await this.calculateStreak();

                // Calcular porcentagem de meta
                const config = await window.hydrateAPI.getConfig();
                const daysWithGoal = data.filter(day => day.count >= (config.dailyGoal || 8)).length;
                this.goalPercentage = Math.round((daysWithGoal / 7) * 100);

            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
            }
        },

        async calculateStreak() {
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
        }
    }
};

// Componente Settings (simplificado)
const SettingsView = {
    template: `
        <div class="settings-view">
            <div class="base-card base-card--large base-card--elevated">
                <div class="card-header">
                    <h3 class="card-title">Configurações</h3>
                    <button
                        class="base-button base-button--secondary base-button--small"
                        @click="$emit('navigate', 'home')"
                    >
                        <div class="button-content">
                            <span class="button-icon">🏠</span>
                            <span class="button-text">Voltar</span>
                        </div>
                    </button>
                </div>
                <div class="card-body">
                    <p>Configurações em desenvolvimento...</p>
                </div>
            </div>
        </div>
    `,
    emits: ['navigate']
};

// Aplicação principal
const App = {
    components: {
        HomeView,
        StatsView,
        SettingsView,
        NotificationToast
    },
    template: `
        <div id="app">
            <div class="container">
                <component
                    :is="currentView + 'View'"
                    @navigate="navigateTo"
                    @notification="addNotification"
                />
            </div>

            <!-- Sistema de Notificações Toast -->
            <NotificationToast
                :notifications="notifications"
                @remove="removeNotification"
                @action="handleNotificationAction"
            />
        </div>
    `,
    data() {
        return {
            currentView: 'Home',
            notifications: [],
            notificationSettings: {
                enabled: true,
                smartReminders: true,
                workHours: { start: '09:00', end: '18:00' },
                frequency: 'adaptive',
                quietHours: { start: '22:00', end: '07:00' },
                weekendMode: false
            }
        }
    },
    computed: {
        isQuietTime() {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const quietStart = this.parseTime(this.notificationSettings.quietHours.start);
            const quietEnd = this.parseTime(this.notificationSettings.quietHours.end);

            if (quietStart > quietEnd) {
                return currentTime >= quietStart || currentTime <= quietEnd;
            }
            return currentTime >= quietStart && currentTime <= quietEnd;
        },

        isWorkTime() {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const workStart = this.parseTime(this.notificationSettings.workHours.start);
            const workEnd = this.parseTime(this.notificationSettings.workHours.end);

            return currentTime >= workStart && currentTime <= workEnd;
        },

        isWeekend() {
            const day = new Date().getDay();
            return day === 0 || day === 6;
        }
    },
    async mounted() {
        await this.loadNotificationSettings();
        this.setupSmartNotifications();
    },
    methods: {
        navigateTo(view) {
            this.currentView = view.charAt(0).toUpperCase() + view.slice(1);
        },

        parseTime(timeString) {
            const [hours, minutes] = timeString.split(':').map(Number);
            return hours * 60 + minutes;
        },

        shouldShowNotification() {
            if (!this.notificationSettings.enabled) return false;
            if (this.isQuietTime) return false;
            if (this.isWeekend && this.notificationSettings.weekendMode) return false;
            return true;
        },

        addNotification(notification) {
            if (!this.shouldShowNotification() && notification.type !== 'system') return;

            const newNotification = {
                id: Date.now(),
                timestamp: new Date(),
                read: false,
                ...notification
            };

            this.notifications.unshift(newNotification);

            // Auto-remove non-persistent notifications
            if (!newNotification.persistent) {
                setTimeout(() => {
                    this.removeNotification(newNotification.id);
                }, 5000);
            }
        },

        removeNotification(id) {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        },

        async handleNotificationAction({ notification, action }) {
            switch (action.id) {
                case 'drink':
                    try {
                        await window.hydrateAPI.addIntake();
                        this.addNotification({
                            type: 'success',
                            title: 'Ótimo!',
                            message: 'Hidratação registrada com sucesso! 💧',
                            persistent: false
                        });
                        this.removeNotification(notification.id);
                    } catch (error) {
                        console.error('Erro ao registrar hidratação:', error);
                    }
                    break;

                case 'snooze':
                    this.removeNotification(notification.id);
                    setTimeout(() => {
                        this.addNotification({
                            type: 'info',
                            title: 'Lembrete de Hidratação',
                            message: 'Hora de beber água! (Lembrete adiado)',
                            persistent: true,
                            actions: [
                                { id: 'drink', label: 'Bebi água!', variant: 'success' },
                                { id: 'snooze', label: 'Mais 15min', variant: 'secondary' }
                            ]
                        });
                    }, 15 * 60 * 1000); // 15 minutes
                    break;

                case 'celebrate':
                    this.removeNotification(notification.id);
                    this.addNotification({
                        type: 'success',
                        title: '🎉 Parabéns!',
                        message: 'Continue mantendo esse ótimo hábito!',
                        persistent: false
                    });
                    break;

                default:
                    this.removeNotification(notification.id);
            }
        },

        async loadNotificationSettings() {
            try {
                const config = await window.hydrateAPI.getConfig();
                if (config.notificationSettings) {
                    this.notificationSettings = {
                        ...this.notificationSettings,
                        ...config.notificationSettings
                    };
                }
            } catch (error) {
                console.error('Erro ao carregar configurações de notificação:', error);
            }
        },

        setupSmartNotifications() {
            // Mostrar notificação de boas-vindas
            setTimeout(() => {
                this.addNotification({
                    type: 'info',
                    title: '💧 Hydrate App',
                    message: 'Sistema de notificações inteligentes ativado!',
                    persistent: false
                });
            }, 2000);

            // Verificar metas alcançadas periodicamente
            setInterval(async () => {
                try {
                    const progress = await window.hydrateAPI.getDailyProgress();

                    // Meta alcançada
                    if (progress.percentage >= 100) {
                        const hasGoalNotification = this.notifications.some(n =>
                            n.title.includes('Meta Atingida')
                        );

                        if (!hasGoalNotification) {
                            this.addNotification({
                                type: 'success',
                                title: '🎯 Meta Atingida!',
                                message: 'Parabéns! Você atingiu sua meta diária de hidratação!',
                                persistent: true,
                                actions: [
                                    { id: 'celebrate', label: 'Comemorar!', variant: 'success' }
                                ]
                            });
                        }
                    }

                    // Verificar sequência
                    const streak = await this.calculateStreak();
                    const milestones = [3, 7, 14, 30, 100];

                    if (milestones.includes(streak)) {
                        const messages = {
                            3: '🔥 3 dias seguidos!',
                            7: '🌟 Uma semana completa!',
                            14: '💎 Duas semanas!',
                            30: '🏆 Um mês inteiro!',
                            100: '👑 100 dias! Você é incrível!'
                        };

                        const hasStreakNotification = this.notifications.some(n =>
                            n.message.includes(messages[streak])
                        );

                        if (!hasStreakNotification) {
                            this.addNotification({
                                type: 'success',
                                title: 'Marco Alcançado!',
                                message: messages[streak],
                                persistent: true
                            });
                        }
                    }

                } catch (error) {
                    console.error('Erro ao verificar progresso:', error);
                }
            }, 30000); // Check every 30 seconds
        },

        async calculateStreak() {
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
        }
    }
};

// Inicializar aplicação
createApp(App).mount('#app');
