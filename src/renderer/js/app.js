const { createApp } = Vue;

// Componente de Alerta de Hidratação
const HydrationAlert = {
    template: `
        <div v-if="showAlert" class="hydration-alert-overlay" @click="dismissAlert">
            <div class="hydration-alert-box" @click.stop>
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
                    <button class="alert-btn primary" @click="drinkWater">
                        ✅ Bebi água!
                    </button>
                    <button class="alert-btn secondary" @click="dismissAlert">
                        ⏰ Lembrar depois
                    </button>
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
    components: {
        HydrationAlert
    },
    template: `
        <div class="home-view">
            <div class="daily-progress-card">
                <div class="progress-header">
                    <h3>Meta Diária</h3>
                    <button class="theme-toggle" @click="toggleTheme" :title="'Alternar para tema ' + (currentTheme === 'light' ? 'escuro' : 'claro')">
                        {{ currentTheme === 'light' ? '🌙' : '☀️' }}
                    </button>
                </div>
                <div class="progress-circle">
                    <svg viewBox="0 0 100 100" class="progress-svg">
                        <circle cx="50" cy="50" r="45" class="progress-bg"></circle>
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            class="progress-bar-circle"
                            :stroke-dasharray="circumference"
                            :stroke-dashoffset="circumference - (progress.percentage / 100) * circumference"
                        ></circle>
                    </svg>
                    <div class="progress-text">
                        <div class="progress-number">{{ progress.current }}</div>
                        <div class="progress-goal">/ {{ progress.goal }}</div>
                        <div class="progress-label">copos</div>
                    </div>
                </div>
                <div class="progress-percentage">{{ progress.percentage }}% da meta</div>
            </div>

            <div class="water-counter">
                <button class="drink-button" @click="addIntake" :disabled="loading">
                    <div class="button-content">
                        <span class="button-icon">💧</span>
                        <span class="button-text">{{ loading ? 'Adicionando...' : 'Bebi água!' }}</span>
                    </div>
                </button>
            </div>

            <div class="quick-actions">
                <button class="quick-btn" @click="$emit('navigate', 'stats')">
                    📊 Estatísticas
                </button>
                <button class="quick-btn" @click="exportData">
                    📤 Exportar Dados
                </button>
                <button class="quick-btn" @click="importData">
                    📥 Importar Dados
                </button>
            </div>

            <HydrationAlert
                :showAlert="showAlert"
                :progress="progress"
                @dismiss="dismissAlert"
                @drink-water="drinkWaterFromAlert"
            />

            <input type="file" ref="fileInput" @change="handleFileImport" accept=".json" style="display: none;">
        </div>
    `,
    data() {
        return {
            progress: { current: 0, goal: 8, percentage: 0 },
            loading: false,
            showAlert: false,
            audioElement: null,
            soundInterval: null,
            beepInterval: null,
            currentTheme: 'light',
            circumference: 2 * Math.PI * 45 // Para o círculo de progresso
        }
    },
    async mounted() {
        await this.loadProgress();
        this.setupAlarmListener();
        this.setupNavigationListener();
        this.setupAudio();
        this.loadTheme();
    },
    methods: {
        async loadProgress() {
            try {
                this.progress = await window.hydrateAPI.getDailyProgress();
            } catch (error) {
                console.error('Erro ao carregar progresso:', error);
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
                this.currentTheme = await window.hydrateAPI.toggleTheme();
                document.body.className = `theme-${this.currentTheme}`;
            } catch (error) {
                console.error('Erro ao alternar tema:', error);
            }
        },
        async addIntake() {
            this.loading = true;
            try {
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
                console.log('Timestamp do alarme:', new Date().toISOString());
                this.showHydrationAlert();
            });
        },
        setupNavigationListener() {
            window.hydrateAPI.onNavigateTo((event, view) => {
                this.$emit('navigate', view);
            });
        },
        setupAudio() {
            console.log('=== CONFIGURANDO ÁUDIO SIMPLES ===');

            // Criar elemento de áudio simples
            this.audioElement = document.createElement('audio');
            this.audioElement.src = 'assets/sounds/water-droplet-drip.mp3';
            this.audioElement.preload = 'auto';
            this.audioElement.volume = 0.7;

            // Adicionar ao DOM (necessário para alguns browsers)
            this.audioElement.style.display = 'none';
            document.body.appendChild(this.audioElement);

            console.log('Elemento de áudio criado e adicionado ao DOM');

            // Listeners básicos
            this.audioElement.addEventListener('canplay', () => {
                console.log('✅ Áudio pronto para reproduzir');
            });

            this.audioElement.addEventListener('error', (e) => {
                console.error('❌ Erro no áudio:', e);
            });

            this.audioElement.addEventListener('play', () => {
                console.log('🔊 Áudio começou a tocar');
            });

            // Tentar carregar
            this.audioElement.load();
        },
        async showHydrationAlert() {
            console.log('=== SHOW HYDRATION ALERT CHAMADA ===');
            this.showAlert = true;
            await this.loadProgress(); // Atualizar progresso

            // Tocar som de forma simples
            try {
                const config = await window.hydrateAPI.getConfig();
                console.log('Config do som:', config);

                if (config.soundEnabled) {
                    console.log('Som habilitado, tentando tocar...');
                    this.playSimpleSound();
                }
            } catch (error) {
                console.error('Erro ao tocar som:', error);
            }
        },
        playSimpleSound() {
            console.log('=== PLAY SIMPLE SOUND ===');

            // Método 1: Usar o audioElement existente
            if (this.audioElement) {
                console.log('Tentando com audioElement existente...');
                this.audioElement.currentTime = 0;
                this.audioElement.play()
                    .then(() => {
                        console.log('✅ Som tocado com audioElement!');
                        this.startSoundLoop();
                    })
                    .catch(error => {
                        console.log('❌ AudioElement falhou, tentando método 2...');
                        this.tryAlternativeSound();
                    });
            } else {
                this.tryAlternativeSound();
            }
        },
        tryAlternativeSound() {
            console.log('Tentando método alternativo...');

            // Método 2: Criar novo Audio
            try {
                const audio = new Audio('assets/sounds/water-droplet-drip.mp3');
                audio.volume = 0.7;

                audio.play()
                    .then(() => {
                        console.log('✅ Som tocado com novo Audio!');
                        this.startAlternativeSoundLoop();
                    })
                    .catch(error => {
                        console.log('❌ Novo Audio falhou, tentando beep...');
                        this.playBeep();
                    });
            } catch (error) {
                console.log('❌ Erro ao criar novo Audio, tentando beep...');
                this.playBeep();
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

                // Repetir beep a cada 3 segundos
                this.beepInterval = setInterval(() => {
                    if (this.showAlert) {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();

                        osc.connect(gain);
                        gain.connect(audioContext.destination);

                        osc.frequency.setValueAtTime(800, audioContext.currentTime);
                        gain.gain.setValueAtTime(0.3, audioContext.currentTime);

                        osc.start();
                        osc.stop(audioContext.currentTime + 0.5);
                    }
                }, 3000);

            } catch (error) {
                console.error('❌ Beep também falhou:', error);
            }
        },
        startSoundLoop() {
            console.log('=== START SOUND LOOP CHAMADA ===');
            console.log('showAlert:', this.showAlert);
            console.log('audioElement:', !!this.audioElement);

            if (!this.showAlert || !this.audioElement) {
                console.log('Saindo do startSoundLoop - condições não atendidas');
                return;
            }

            console.log('Configurando intervalo para repetir som...');
            this.soundInterval = setInterval(() => {
                console.log('Intervalo executado - verificando condições...');
                if (this.showAlert && this.audioElement) {
                    console.log('Repetindo som...');
                    this.audioElement.currentTime = 0;
                    this.audioElement.play().then(() => {
                        console.log('✅ Som repetido com sucesso');
                    }).catch(error => {
                        console.error('❌ Erro ao repetir som:', error);
                    });
                } else {
                    console.log('Condições não atendidas para repetir som');
                }
            }, 3000);
        },
        startAlternativeSoundLoop() {
            this.soundInterval = setInterval(() => {
                if (this.showAlert) {
                    const audio = new Audio('assets/sounds/water-droplet-drip.mp3');
                    audio.volume = 0.7;
                    audio.play().catch(console.error);
                }
            }, 3000);
        },
        async dismissAlert() {
            this.showAlert = false;
            this.stopSound();

            // Notificar o main process que o alarme foi dispensado
            try {
                await window.hydrateAPI.dismissAlarm();
            } catch (error) {
                console.error('Erro ao dismissar alarme:', error);
            }
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

            // Limpar input
            event.target.value = '';
        }
    },
    beforeUnmount() {
        window.hydrateAPI.removeAlarmListener();
        window.hydrateAPI.removeNavigateListener();
        this.stopSound();
    }
};

// Componente Stats (atualizado)
const StatsView = {
    template: `
        <div class="stats-view">
            <div class="stats-header">
                <h2>📊 Estatísticas</h2>
                <p>Acompanhe seu progresso de hidratação</p>
            </div>

            <div class="chart-container">
                <canvas ref="chart"></canvas>
            </div>

            <div class="stats-summary">
                <div class="stat-card">
                    <div class="stat-value">{{ todayCount }}</div>
                    <div class="stat-label">Hoje</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ weekAverage }}</div>
                    <div class="stat-label">Média Semanal</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ totalWeek }}</div>
                    <div class="stat-label">Total da Semana</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ bestDay }}</div>
                    <div class="stat-label">Melhor Dia</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ streak }}</div>
                    <div class="stat-label">Sequência (dias)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ goalAchieved }}%</div>
                    <div class="stat-label">Meta Atingida</div>
                </div>
            </div>

            <div class="achievements">
                <h3>🏆 Conquistas</h3>
                <div class="achievement-list">
                    <div v-for="achievement in achievements" :key="achievement.id"
                         class="achievement" :class="{ unlocked: achievement.unlocked }">
                        <div class="achievement-icon">{{ achievement.icon }}</div>
                        <div class="achievement-info">
                            <div class="achievement-title">{{ achievement.title }}</div>
                            <div class="achievement-desc">{{ achievement.description }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            chartInstance: null,
            todayCount: 0,
            weekData: [],
            weekAverage: 0,
            totalWeek: 0,
            bestDay: 0,
            streak: 0,
            goalAchieved: 0,
            achievements: [
                { id: 1, icon: '💧', title: 'Primeira Gota', description: 'Registre seu primeiro copo de água', unlocked: false },
                { id: 2, icon: '🎯', title: 'Meta Diária', description: 'Atinja sua meta diária pela primeira vez', unlocked: false },
                { id: 3, icon: '🔥', title: 'Sequência de 3', description: 'Mantenha uma sequência de 3 dias', unlocked: false },
                { id: 4, icon: '⭐', title: 'Sequência de 7', description: 'Mantenha uma sequência de 7 dias', unlocked: false },
                { id: 5, icon: '👑', title: 'Hidratação Master', description: 'Mantenha uma sequência de 30 dias', unlocked: false },
                { id: 6, icon: '💯', title: 'Perfeccionista', description: 'Atinja 100% da meta por 7 dias seguidos', unlocked: false }
            ]
        }
    },
    async mounted() {
        await this.loadStats();
        this.createChart();
        this.checkAchievements();
    },
    methods: {
        async loadStats() {
            try {
                this.todayCount = await window.hydrateAPI.getTodayCount();
                this.weekData = await window.hydrateAPI.getIntakeByRange(7);

                // Calcular estatísticas
                this.totalWeek = this.weekData.reduce((sum, day) => sum + day.count, 0);
                this.weekAverage = Math.round(this.totalWeek / 7);
                this.bestDay = Math.max(...this.weekData.map(day => day.count), 0);

                // Calcular sequência
                await this.calculateStreak();

                // Calcular porcentagem de meta atingida
                const config = await window.hydrateAPI.getConfig();
                const daysWithGoal = this.weekData.filter(day => day.count >= config.dailyGoal).length;
                this.goalAchieved = Math.round((daysWithGoal / 7) * 100);
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

                    if (count >= config.dailyGoal) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }

                this.streak = currentStreak;
            } catch (error) {
                console.error('Erro ao calcular sequência:', error);
            }
        },
        checkAchievements() {
            // Primeira Gota
            if (this.todayCount > 0) {
                this.achievements[0].unlocked = true;
            }

            // Meta Diária
            const config = window.hydrateAPI.getConfig();
            if (this.todayCount >= 8) { // Assumindo meta padrão de 8
                this.achievements[1].unlocked = true;
            }

            // Sequências
            if (this.streak >= 3) this.achievements[2].unlocked = true;
            if (this.streak >= 7) this.achievements[3].unlocked = true;
            if (this.streak >= 30) this.achievements[4].unlocked = true;

            // Perfeccionista
            if (this.goalAchieved === 100) {
                this.achievements[5].unlocked = true;
            }
        },
        createChart() {
            const ctx = this.$refs.chart.getContext('2d');

            // Preparar dados dos últimos 7 dias
            const labels = [];
            const data = [];
            const today = new Date();

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));

                const dayData = this.weekData.find(d => d.date === dateStr);
                data.push(dayData ? dayData.count : 0);
            }

            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Copos de água',
                        data: data,
                        borderColor: '#4a90e2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#4a90e2',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    },
    beforeUnmount() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }
};

// Componente Settings (atualizado)
const SettingsView = {
    template: `
        <div class="settings-view">
            <div class="settings-header">
                <h2>⚙️ Configurações</h2>
                <p>Personalize seus lembretes de hidratação</p>
            </div>

            <form @submit.prevent="saveSettings">
                <div class="settings-section">
                    <h3>🎯 Meta e Lembretes</h3>

                    <div class="setting-group">
                        <label class="setting-label" for="dailyGoal">
                            Meta diária (copos):
                        </label>
                        <input
                            type="number"
                            id="dailyGoal"
                            class="setting-input"
                            v-model.number="settings.dailyGoal"
                            min="1"
                            max="20"
                            required
                        >
                        <small style="color: #666; margin-top: 0.5rem; display: block;">
                            Recomendado: 8 copos por dia
                        </small>
                    </div>

                    <div class="setting-group">
                        <label class="setting-label" for="interval">
                            Intervalo entre lembretes (minutos):
                        </label>
                        <input
                            type="number"
                            id="interval"
                            class="setting-input"
                            v-model.number="settings.interval"
                            min="1"
                            max="480"
                            required
                        >
                        <small style="color: #666; margin-top: 0.5rem; display: block;">
                            Recomendado: 60-120 minutos
                        </small>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🔊 Som e Notificações</h3>

                    <div class="setting-group">
                        <label class="setting-label">
                            <input
                                type="checkbox"
                                v-model="settings.soundEnabled"
                                style="margin-right: 0.5rem;"
                            >
                            Ativar som nos lembretes
                        </label>
                    </div>

                    <div class="setting-group" v-if="settings.soundEnabled">
                        <label class="setting-label" for="volume">
                            Volume do som:
                        </label>
                        <input
                            type="range"
                            id="volume"
                            class="setting-input"
                            v-model.number="settings.soundVolume"
                            min="0"
                            max="1"
                            step="0.1"
                        >
                        <small style="color: #666; margin-top: 0.5rem; display: block;">
                            Volume: {{ Math.round(settings.soundVolume * 100) }}%
                        </small>
                    </div>

                    <div class="setting-group" v-if="settings.soundEnabled">
                        <button type="button" class="test-button" @click="testSound" :disabled="testing">
                            {{ testing ? 'Testando...' : '🔊 Testar Som' }}
                        </button>
                    </div>

                    <div class="setting-group">
                        <label class="setting-label">
                            <input
                                type="checkbox"
                                v-model="settings.notifications"
                                style="margin-right: 0.5rem;"
                            >
                            Ativar notificações nativas do sistema
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🎨 Aparência</h3>

                    <div class="setting-group">
                        <label class="setting-label">
                            <input
                                type="checkbox"
                                v-model="settings.systemTray"
                                style="margin-right: 0.5rem;"
                            >
                            Mostrar ícone na bandeja do sistema
                        </label>
                        <small style="color: #666; margin-top: 0.5rem; display: block;">
                            Permite minimizar o app para a bandeja
                        </small>
                    </div>
                </div>

                <button type="submit" class="save-button" :disabled="saving">
                    {{ saving ? 'Salvando...' : '💾 Salvar Configurações' }}
                </button>
            </form>

            <div v-if="saveMessage" style="margin-top: 1rem; text-align: center;" :style="{ color: saveMessage.includes('Erro') ? '#dc3545' : '#28a745' }">
                {{ saveMessage.includes('Erro') ? '❌' : '✅' }} {{ saveMessage }}
            </div>
        </div>
    `,
    data() {
        return {
            settings: {
                interval: 60,
                soundEnabled: true,
                soundVolume: 0.7,
                dailyGoal: 8,
                notifications: true,
                systemTray: true,
                theme: 'light'
            },
            saving: false,
            testing: false,
            saveMessage: '',
            testAudio: null
        }
    },
    async mounted() {
        await this.loadSettings();
        this.setupTestAudio();
    },
    methods: {
        async loadSettings() {
            try {
                const config = await window.hydrateAPI.getConfig();
                this.settings = {
                    interval: config.interval || 60,
                    soundEnabled: config.soundEnabled !== false,
                    soundVolume: config.soundVolume || 0.7,
                    dailyGoal: config.dailyGoal || 8,
                    notifications: config.notifications !== false,
                    systemTray: config.systemTray !== false,
                    theme: config.theme || 'light'
                };
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            }
        },
        setupTestAudio() {
            this.testAudio = new Audio('assets/sounds/water-droplet-drip.mp3');
        },
        async testSound() {
            if (!this.testAudio) return;

            this.testing = true;
            try {
                this.testAudio.volume = this.settings.soundVolume;
                await this.testAudio.play();

                setTimeout(() => {
                    this.testAudio.pause();
                    this.testAudio.currentTime = 0;
                    this.testing = false;
                }, 2000);
            } catch (error) {
                console.error('Erro ao testar som:', error);
                this.testing = false;
            }
        },
        async saveSettings() {
            this.saving = true;
            this.saveMessage = '';

            try {
                console.log('Enviando configurações:', this.settings);
                const result = await window.hydrateAPI.setConfig(this.settings);
                console.log('Resultado recebido:', result);

                this.saveMessage = 'Configurações salvas com sucesso!';

                setTimeout(() => {
                    this.saveMessage = '';
                }, 3000);
            } catch (error) {
                console.error('Erro ao salvar configurações:', error);
                this.saveMessage = 'Erro ao salvar: ' + error.message;
            } finally {
                this.saving = false;
            }
        }
    }
};

// App principal
const App = {
    components: {
        HomeView,
        StatsView,
        SettingsView
    },
    template: `
        <div id="app">
            <header class="header">
                <div class="logo">
                    💧 Hydrate
                </div>
                <nav class="nav-tabs">
                    <button
                        class="nav-tab"
                        :class="{ active: currentView === 'home' }"
                        @click="currentView = 'home'"
                    >
                        🏠 Início
                    </button>
                    <button
                        class="nav-tab"
                        :class="{ active: currentView === 'stats' }"
                        @click="currentView = 'stats'"
                    >
                        📊 Estatísticas
                    </button>
                    <button
                        class="nav-tab"
                        :class="{ active: currentView === 'settings' }"
                        @click="currentView = 'settings'"
                    >
                        ⚙️ Configurações
                    </button>
                </nav>
            </header>

            <main class="main-content">
                <component :is="currentView + 'View'" :key="currentView" @navigate="navigateTo"></component>
            </main>
        </div>
    `,
    data() {
        return {
            currentView: 'home'
        }
    },
    methods: {
        navigateTo(view) {
            this.currentView = view;
        }
    }
};

// Inicializar app
createApp(App).mount('#app');
