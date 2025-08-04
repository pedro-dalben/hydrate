# Hydrate 💧

Um aplicativo desktop para lembrar de beber água, desenvolvido com Electron e Vue.js.

## Funcionalidades

- ⏰ Lembretes personalizáveis para beber água
- 📊 Estatísticas de consumo diário e semanal
- 🔊 Alertas sonoros configuráveis
- 💧 Interface intuitiva e moderna
- 📈 Gráficos de progresso
- 🎯 Controle de metas de hidratação

## Tecnologias

- **Electron** - Framework para aplicações desktop
- **Vue.js 3** - Framework JavaScript reativo
- **SQLite** - Banco de dados local
- **Chart.js** - Gráficos e visualizações
- **CSS3** - Estilização moderna com gradientes

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/pedro-dalben/hydrate.git
cd hydrate
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o aplicativo:
```bash
npm run dev
```

## Scripts Disponíveis

- `npm run dev` - Executa o aplicativo em modo desenvolvimento
- `npm run start` - Inicia o aplicativo
- `npm run build` - Constrói o aplicativo para distribuição

## Configurações

O aplicativo permite configurar:
- Intervalo entre lembretes (1-480 minutos)
- Ativação/desativação de som
- Volume do som dos alertas

## Estrutura do Projeto

```
hydrate/
├── main.js              # Processo principal do Electron
├── preload.js           # Script de preload
├── package.json         # Configurações do projeto
├── config.json          # Configurações do usuário
├── assets/              # Recursos estáticos
│   ├── icon.png         # Ícone do aplicativo
│   └── sounds/          # Arquivos de som
├── db/                  # Banco de dados SQLite
├── src/
│   └── renderer/        # Interface do usuário
│       ├── index.html   # Página principal
│       ├── js/
│       │   └── app.js   # Aplicação Vue.js
│       └── styles/
│           └── main.css # Estilos CSS
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

**Pedro Dalben** - [GitHub](https://github.com/pedro-dalben)

---

💧 Mantenha-se hidratado! 💧
