// Composable para gerenciamento de áudio
export function useAudio() {
    let audioElement = null;
    let soundInterval = null;
    let beepInterval = null;

    const setupAudio = () => {
        console.log('=== CONFIGURANDO ÁUDIO ===');

        audioElement = document.createElement('audio');
        audioElement.src = 'assets/sounds/water-droplet-drip.mp3';
        audioElement.preload = 'auto';
        audioElement.volume = 0.7;

        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);

        console.log('Elemento de áudio criado e adicionado ao DOM');

        // Listeners básicos
        audioElement.addEventListener('canplay', () => {
            console.log('✅ Áudio pronto para reproduzir');
        });

        audioElement.addEventListener('error', (e) => {
            console.error('❌ Erro no áudio:', e);
        });

        audioElement.addEventListener('play', () => {
            console.log('🔊 Áudio começou a tocar');
        });

        audioElement.load();
    };

    const playSound = async () => {
        console.log('=== PLAY SOUND ===');

        if (audioElement) {
            console.log('Tentando com audioElement existente...');
            audioElement.currentTime = 0;

            try {
                await audioElement.play();
                console.log('✅ Som tocado com audioElement!');
                return true;
            } catch (error) {
                console.log('❌ AudioElement falhou, tentando método alternativo...');
                return tryAlternativeSound();
            }
        } else {
            return tryAlternativeSound();
        }
    };

    const tryAlternativeSound = async () => {
        console.log('Tentando método alternativo...');

        try {
            const audio = new Audio('assets/sounds/water-droplet-drip.mp3');
            audio.volume = 0.7;

            await audio.play();
            console.log('✅ Som tocado com novo Audio!');
            return true;
        } catch (error) {
            console.log('❌ Novo Audio falhou, tentando beep...');
            return playBeep();
        }
    };

    const playBeep = () => {
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
    };

    const startSoundLoop = () => {
        console.log('Iniciando loop de som...');

        soundInterval = setInterval(() => {
            if (audioElement) {
                audioElement.currentTime = 0;
                audioElement.play().catch(console.error);
            }
        }, 3000);
    };

    const startBeepLoop = () => {
        beepInterval = setInterval(() => {
            playBeep();
        }, 3000);
    };

    const stopSound = () => {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
        if (soundInterval) {
            clearInterval(soundInterval);
            soundInterval = null;
        }
        if (beepInterval) {
            clearInterval(beepInterval);
            beepInterval = null;
        }
    };

    const cleanup = () => {
        stopSound();
        if (audioElement && audioElement.parentNode) {
            audioElement.parentNode.removeChild(audioElement);
        }
    };

    return {
        setupAudio,
        playSound,
        startSoundLoop,
        startBeepLoop,
        stopSound,
        cleanup
    };
}
