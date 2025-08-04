const { createApp } = Vue;

// Componente de Alerta de Hidratação
const HydrationAlert = {
    template: `
        <div v-if="showAlert" class="hydration-alert-overlay" @click="dismissAlert">
            <div class="hydration-alert-box" @click.stop>
                <div class="alert-icon">💧</div>
                <h2>Hora de se hidratar!</h2>
                <p>É importante beber água regularmente para manter sua saúde.</p>
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
    props: ['showAlert'],
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
            <div class="water-counter">
                <div class="counter-display">{{ todayCount }}</div>
                <div class="counter-label">copos de água hoje</div>
                <button class="drink-button" @click="addIntake" :disabled="loading">
                    {{ loading ? 'Adicionando...' : '💧 Bebi água!' }}
                </button>
            </div>

            <HydrationAlert
                :showAlert="showAlert"
                @dismiss="dismissAlert"
                @drink-water="drinkWaterFromAlert"
            />
        </div>
    `,
    data() {
        return {
            todayCount: 0,
            loading: false,
            showAlert: false,
            audioElement: null
        }
    },
    async mounted() {
        await this.loadTodayCount();
        this.setupAlarmListener();
        this.setupAudio();
    },
    methods: {
        async loadTodayCount() {
            try {
                this.todayCount = await window.hydrateAPI.getTodayCount();
            } catch (error) {
                console.error('Erro ao carregar contagem:', error);
            }
        },
        async addIntake() {
            this.loading = true;
            try {
                await window.hydrateAPI.addIntake();
                this.todayCount++;
            } catch (error) {
                console.error('Erro ao adicionar ingestão:', error);
            } finally {
                this.loading = false;
            }
        },
        setupAlarmListener() {
            console.log('=== CONFIGURANDO LISTENER DE ALARME ===');
            window.hydrateAPI.onAlarmTriggered(() => {
                console.log('=== ALARME RECEBIDO NO RENDERER ===');
                console.log('Timestamp do alarme:', new Date().toISOString());
                this.showHydrationAlert();
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

        startAlternativeSoundLoop() {
            this.soundInterval = setInterval(() => {
                if (this.showAlert) {
                    const audio = new Audio('assets/sounds/water-droplet-drip.mp3');
                    audio.volume = 0.7;
                    audio.play().catch(console.error);
                }
            }, 3000);
        },

        async tryPlayAudio() {
            try {
                this.audioElement.volume = 0.7;
                this.audioElement.currentTime = 0;

                const playPromise = this.audioElement.play();
                if (playPromise !== undefined) {
                    await playPromise;
                    console.log('✅ AudioElement: Som tocado com sucesso!');
                    return true;
                }
            } catch (error) {
                console.error('❌ AudioElement falhou:', error);
                return false;
            }
        },

        async tryPlayNewAudio() {
            try {
                // Tentar diferentes caminhos
                const paths = [
                    './assets/sounds/water-droplet-drip.mp3',
                    'assets/sounds/water-droplet-drip.mp3',
                    '../assets/sounds/water-droplet-drip.mp3',
                    '../../assets/sounds/water-droplet-drip.mp3'
                ];

                for (const path of paths) {
                    try {
                        console.log(`Tentando caminho: ${path}`);
                        const audio = new Audio(path);
                        audio.volume = 0.7;

                        await new Promise((resolve, reject) => {
                            audio.addEventListener('canplay', resolve, { once: true });
                            audio.addEventListener('error', reject, { once: true });
                            audio.load();
                        });

                        await audio.play();
                        console.log(`✅ Novo Audio: Som tocado com sucesso usando ${path}!`);
                        return true;
                    } catch (pathError) {
                        console.log(`❌ Caminho ${path} falhou:`, pathError.message);
                    }
                }
            } catch (error) {
                console.error('❌ Novo Audio falhou:', error);
                return false;
            }
        },

        async tryWebAudioAPI() {
            try {
                if (!this.audioContext) {
                    console.log('AudioContext não disponível');
                    return false;
                }

                // Criar um oscilador para gerar um beep
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800 Hz
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.5); // Tocar por 0.5 segundos

                console.log('✅ Web Audio API: Beep tocado com sucesso!');
                return true;
            } catch (error) {
                console.error('❌ Web Audio API falhou:', error);
                return false;
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

            console.log('Tentando tocar som imediatamente...');
            console.log('Estado do áudio:', {
                readyState: this.audioElement.readyState,
                paused: this.audioElement.paused,
                currentTime: this.audioElement.currentTime,
                duration: this.audioElement.duration
            });

            // Garantir que o áudio está no início
            this.audioElement.currentTime = 0;

            // Tocar som imediatamente
            const playPromise = this.audioElement.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('✅ Som tocado com sucesso!');
                }).catch(error => {
                    console.error('❌ Erro ao reproduzir som:', error);
                    console.error('Tipo do erro:', error.name);
                    console.error('Mensagem:', error.message);
                });
            }

            // Configurar intervalo para repetir o som
            console.log('Configurando intervalo para repetir som...');
            this.soundInterval = setInterval(() => {
                console.log('Intervalo executado - verificando condições...');
                if (this.showAlert && this.audioElement) {
                    console.log('Repetindo som...');
                    this.audioElement.currentTime = 0; // Reiniciar do início
                    this.audioElement.play().then(() => {
                        console.log('✅ Som repetido com sucesso');
                    }).catch(error => {
                        console.error('❌ Erro ao repetir som:', error);
                    });
                } else {
                    console.log('Condições não atendidas para repetir som');
                }
            }, 3000); // Repetir a cada 3 segundos
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
        async drinkWaterFromAlert() {
            await this.addIntake();
            this.dismissAlert();
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
        }
    },
    beforeUnmount() {
        window.hydrateAPI.removeAlarmListener();
        this.stopSound();
    }
};

// Componente Stats
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
            bestDay: 0
        }
    },
    async mounted() {
        await this.loadStats();
        this.createChart();
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
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
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

// Componente Settings
const SettingsView = {
    template: `
        <div class="settings-view">
            <div class="settings-header">
                <h2>⚙️ Configurações</h2>
                <p>Personalize seus lembretes de hidratação</p>
            </div>

            <form @submit.prevent="saveSettings">
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
                soundVolume: 0.7
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
                    soundVolume: config.soundVolume || 0.7
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
                // Criar objeto simples com dados primitivos
                const configToSave = {
                    interval: Number(this.settings.interval),
                    soundEnabled: Boolean(this.settings.soundEnabled),
                    soundVolume: Number(this.settings.soundVolume)
                };

                await window.hydrateAPI.setConfig(configToSave);
                this.saveMessage = 'Configurações salvas com sucesso!';

                setTimeout(() => {
                    this.saveMessage = '';
                }, 3000);
            } catch (error) {
                console.error('Erro ao salvar configurações:', error);
                this.saveMessage = `Erro ao salvar: ${error.message || error}`;
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
                <component :is="currentView + 'View'" :key="currentView"></component>
            </main>
        </div>
    `,
    data() {
        return {
            currentView: 'home'
        }
    }
};

// Inicializar app
createApp(App).mount('#app');
