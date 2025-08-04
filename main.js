const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let db;
let alarmInterval;
let alarmActive = false; // Controla se há um alarme ativo
let config = {
  interval: 60,
  soundEnabled: true,
  soundFile: "assets/sounds/water-droplet-drip.mp3",
  soundVolume: 0.7
}; // configurações padrão

// Inicialização do banco de dados
function initDatabase() {
  const dbPath = path.join(__dirname, 'db', 'hydrate.sqlite');

  // Criar diretório db se não existir
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new sqlite3.Database(dbPath);

  // Criar tabela se não existir
  db.run(`
    CREATE TABLE IF NOT EXISTS intake (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela:', err);
    } else {
      console.log('Tabela intake criada/verificada com sucesso');
      // Adicionar dados de exemplo se a tabela estiver vazia
      populateInitialData();
    }
  });
}

// Popular banco com dados iniciais para demonstração
function populateInitialData() {
  db.get("SELECT COUNT(*) as count FROM intake", (err, row) => {
    if (err) {
      console.error('Erro ao verificar dados:', err);
      return;
    }

    if (row.count === 0) {
      console.log('Banco vazio, adicionando dados de exemplo...');

      // Adicionar dados dos últimos 7 dias
      const statements = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Número aleatório de copos por dia (2-8)
        const cupsPerDay = Math.floor(Math.random() * 7) + 2;

        for (let j = 0; j < cupsPerDay; j++) {
          // Horário aleatório durante o dia
          const hour = Math.floor(Math.random() * 16) + 6; // Entre 6h e 22h
          const minute = Math.floor(Math.random() * 60);

          date.setHours(hour, minute, 0, 0);
          const timestamp = date.toISOString().replace('T', ' ').slice(0, 19);

          statements.push(`INSERT INTO intake (timestamp) VALUES ('${timestamp}')`);
        }
      }

      // Executar todas as inserções
      statements.forEach((statement, index) => {
        db.run(statement, (err) => {
          if (err) {
            console.error(`Erro ao inserir dado ${index}:`, err);
          } else if (index === statements.length - 1) {
            console.log(`${statements.length} registros de exemplo adicionados com sucesso!`);
          }
        });
      });
    } else {
      console.log(`Banco já possui ${row.count} registros`);
    }
  });
}

// Carregar configurações
function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao carregar config:', error);
    }
  } else {
    // Criar config padrão
    saveConfig();
  }
}

// Salvar configurações
function saveConfig() {
  try {
    console.log('=== SAVE CONFIG ===');
    const configPath = path.join(__dirname, 'config.json');
    console.log('Caminho do arquivo de config:', configPath);
    console.log('Dados a serem salvos:', JSON.stringify(config, null, 2));

    // Verificar se o diretório existe
    const configDir = path.dirname(configPath);
    console.log('Diretório do config:', configDir);
    console.log('Diretório existe?', fs.existsSync(configDir));

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Arquivo config.json salvo com sucesso');

    // Verificar se foi realmente salvo
    const savedContent = fs.readFileSync(configPath, 'utf8');
    console.log('Conteúdo salvo verificado:', savedContent);
  } catch (error) {
    console.error('ERRO CRÍTICO ao salvar configurações:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Mostrar alarme
function showAlarm() {
  console.log('=== FUNÇÃO SHOW ALARM CHAMADA ===');
  console.log('Timestamp:', new Date().toISOString());

  // Não mostrar novo alarme se já há um ativo
  if (alarmActive) {
    console.log('Alarme já ativo, pulando novo alarme');
    return;
  }

  console.log('Disparando novo alarme');
  console.log('Config atual:', JSON.stringify(config));
  alarmActive = true;

  // Forçar janela a aparecer na frente
  if (mainWindow) {
    console.log('MainWindow disponível, processando alarme...');

    // Restaurar janela se estiver minimizada
    if (mainWindow.isMinimized()) {
      console.log('Restaurando janela minimizada');
      mainWindow.restore();
    }

    // Trazer janela para frente
    console.log('Trazendo janela para frente');
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);

    // Remover always on top após 5 segundos para não incomodar
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('Removendo always on top');
        mainWindow.setAlwaysOnTop(false);
      }
    }, 5000);

    // Enviar evento para o renderer
    console.log('Enviando evento alarm-triggered para o renderer');
    mainWindow.webContents.send('alarm-triggered');
    console.log('Evento alarm-triggered enviado');
  } else {
    console.error('MainWindow não está disponível!');
  }
}

// Configurar alarme
function setupAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
  }

  const intervalMs = config.interval * 60 * 1000; // converter para ms
  console.log(`Configurando alarme para ${config.interval} minutos (${intervalMs}ms)`);
  alarmInterval = setInterval(showAlarm, intervalMs);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Habilitar áudio
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('src/renderer/index.html');

  // Habilitar autoplay de áudio
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Habilitar autoplay de áudio
      navigator.mediaDevices = navigator.mediaDevices || {};
      if (!navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia = function() {
          return Promise.resolve();
        };
      }
    `);
  });

  // Abrir DevTools em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// IPC Handlers
ipcMain.handle('get-today-count', async () => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT COUNT(*) as count FROM intake WHERE DATE(timestamp) = DATE('now')",
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
});

ipcMain.handle('add-intake', async () => {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO intake DEFAULT VALUES", function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
});

ipcMain.handle('get-intake-by-range', async (event, days) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DATE(timestamp) as date, COUNT(*) as count
       FROM intake
       WHERE timestamp >= datetime('now', '-${days} days')
       GROUP BY DATE(timestamp)
       ORDER BY date`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
});

ipcMain.handle('get-config', async () => {
  return config;
});

ipcMain.handle('test-sound', async () => {
  try {
    console.log('Testando som...');
    return { success: true };
  } catch (error) {
    console.error('Erro ao testar som:', error);
    throw error;
  }
});

ipcMain.handle('set-config', async (event, newConfig) => {
  try {
    console.log('=== SET-CONFIG HANDLER ===');
    console.log('Recebendo nova configuração:', JSON.stringify(newConfig));
    console.log('Configuração atual:', JSON.stringify(config));

    config = { ...config, ...newConfig };
    console.log('Configuração após merge:', JSON.stringify(config));

    console.log('Chamando saveConfig()...');
    saveConfig();
    console.log('saveConfig() executado com sucesso');

    console.log('Chamando setupAlarm()...');
    setupAlarm(); // Reconfigurar alarme
    console.log('setupAlarm() executado com sucesso');

    console.log('Retornando configuração:', JSON.stringify(config));
    return config;
  } catch (error) {
    console.error('ERRO CRÍTICO no handler set-config:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
});

// Handler para desativar alarme quando usuário clicar
ipcMain.handle('dismiss-alarm', async () => {
  try {
    console.log('Alarme foi dispensado pelo usuário');
    alarmActive = false;
    return { success: true };
  } catch (error) {
    console.error('Erro ao dismissar alarme:', error);
    throw error;
  }
});

app.whenReady().then(() => {
  initDatabase();
  loadConfig();
  createWindow();
  setupAlarm();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close();
    app.quit();
  }
});
