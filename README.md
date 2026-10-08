<!-- prettier-ignore -->
<div align="center">

<img src="./public/Logo.png" alt="Logo Rhyme" width="300" />

# Rhyme

[![Demo PWA](https://img.shields.io/badge/Demo_PWA-track--22dc6.web.app-10b981?style=for-the-badge&logo=googlechrome&logoColor=white)](https://track-22dc6.web.app)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Luis-Henrique-ufg/Rhyme/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](./LICENSE)

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.15-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)

[Demonstração](#-demonstração-ao-vivo) • [Visão Geral](#-visão-geral) • [Recursos](#-recursos) • [Arquitetura & Estrutura](#-arquitetura--estrutura-interna) • [Como Começar](#-como-começar) • [Deploy](#-deploy--operações-firebase) • [Documentação](#-documentação-técnica)

</div>

---

## 🌐 Demonstração ao Vivo

A versão mais recente da aplicação está publicada e acessível como Progressive Web App (PWA) em:

🔗 **[https://track-22dc6.web.app](https://track-22dc6.web.app)**

> [!NOTE]
> Para testar a experiência completa de PWA em dispositivos móveis (Android/iOS), abra o link pelo navegador móvel e selecione **"Adicionar à tela de início"**.

---

## 📖 Visão Geral

O **Rhyme** é um sistema inteligente de gestão e acompanhamento do transporte universitário intermunicipal, criado para substituir as tradicionais listas de chamada manuais e mensagens desencontradas em grupos de WhatsApp.

O sistema centraliza a comunicação em um mapa interativo e intuitivo em tempo real:
- Os **estudantes** acompanham a rota da van/ônibus ao vivo, consultam a estimativa de chegada (ETA) e informam com um toque quando estão prontos para embarque (**"Liberado"**), podendo também transmitir o GPS a bordo caso o motorista precise de apoio.
- Os **motoristas** visualizam um painel consolidado com a concentração de alunos liberados por faculdade ou ponto de parada, otimizando o itinerário sem necessidade de manusear o celular enquanto dirigem.

---

## ✨ Recursos

- 📍 **Rastreamento em Tempo Real:** Visualização dinâmica da posição da Van/Ônibus com marcador rotativo e telemetria suave.
- 🟢 **Status Interativo do Aluno:** Marcador visual dedicado que transiciona para Verde Esmeralda quando o passageiro confirma liberação da aula.
- 🚌 **Painel Operacional do Motorista:** Agrupamento geográfico por faculdades/polos com contagem ao vivo de passageiros aguardando vs. liberados.
- 📡 **Transmissão Colaborativa de GPS:** Passageiros a bordo podem compartilhar ativamente as coordenadas da viagem de forma segura.
- 🔔 **Geofencing & Notificações Push:** Alerta automático no celular do estudante quando o veículo entra no raio de 1 km do seu ponto de embarque.
- 🏫 **Modo Campus Pedestre:** Exploração dos prédios da universidade com rotas pontilhadas internas, pontos de interesse (RU, Bibliotecas) e cálculo de caminhada.
- 🔄 **Ciclo Diário Automatizado:** Criação e renovação automática de viagens diárias sem depender de rotinas manuais de agendamento.

---

## 🏗️ Arquitetura & Estrutura Interna

O sistema adota uma arquitetura Serverless reativa em tempo real:

```
[ React 19 + Leaflet (PWA) ] ── (Realtime Snapshots) ──► [ Cloud Firestore ]
             │                                                    │
             │                                           (Document Trigger)
             ▼                                                    ▼
   [ Firebase Auth ]                                   [ Cloud Functions v2 ]
                                                                  │
                                                        (FCM Web Push Alerts)
                                                                  ▼
                                                      [ Dispositivos Móveis ]
```

### 🗺️ Mapa de Pastas do Frontend (`src/`)

| Diretório | Responsabilidade |
|---|---|
| [`src/assets/`](./src/assets/) | Logotipos, ícones SVG e recursos visuais estáticos. |
| [`src/components/`](./src/components/) | Componentes reutilizáveis (modais de embarque, lista pública, seletor de mapa, prompt de notificações). |
| [`src/config/`](./src/config/) | Inicialização do Firebase SDK (`db`, `auth`, `messaging`). |
| [`src/contexts/`](./src/contexts/) | Contextos globais do React (`AuthContext` para sessão e papéis; `ThemeContext` para modo escuro/claro). |
| [`src/hooks/`](./src/hooks/) | Custom hooks auxiliares para áudio, vibração tátil e eventos da janela. |
| [`src/pages/`](./src/pages/) | Telas principais da aplicação:<br>• `StudentMap.jsx`: Tela principal do estudante, mapa e Modo Campus.<br>• `DriverDashboard.jsx`: Painel de controle operacional do motorista.<br>• `Login.jsx` / `Register.jsx`: Fluxos de entrada e perfil.<br>• `Profile.jsx` / `Settings.jsx`: Configurações de alarme e paradas. |
| [`src/routes/`](./src/routes/) | Configuração de rotas (`react-router-dom`) e rotas privadas protegidas. |
| [`src/utils/`](./src/utils/) | Lógica de negócios e adaptadores:<br>• `useTripData.js`: Listeners em tempo real do Firestore.<br>• `tripManager.js`: Ciclo de vida e criação de viagens.<br>• `geo.js`: Cálculo de distância Haversine e checagem de raio de geofencing.<br>• `routeUtils.js`: Normalização consistente de nomes de rotas intermunicipais.<br>• `audioEffects.js`: Sons nativos Web Audio para feedback de toque. |

---

### ⚡ O que a pasta `functions/` faz?

O diretório [`functions/`](./functions/) contém o backend serverless do Firebase Cloud Functions (Node.js / Functions v2):

- **Gatilho Reativo (`checkBusDistanceAndNotify`):**
  - Monitora atualizações em tempo real nos documentos de viagens em `trips/{tripId}`.
  - Quando a coordenada do veículo (`busLocation`) é atualizada, a função busca todos os passageiros da viagem com status `liberado`.
  - Executa o cálculo esférico da fórmula de Haversine entre o veículo e a coordenada do aluno.
  - Caso a distância seja menor ou igual a **1,0 km** e o aluno ainda não tenha sido avisado na viagem corrente:
    - Recupera o token de registro FCM (`fcmToken`) armazenado no perfil do estudante em `students/{studentId}`.
    - Dispara uma notificação Web Push de alta prioridade via **Firebase Cloud Messaging (FCM)** para o aparelho do usuário (mesmo com a tela bloqueada).
    - Registra o aluno em `notifiedStudents` para prevenir notificações repetidas.

---

## 🚀 Como Começar

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 20 ou superior (Node 20+ LTS recomendado)
- NPM versão 10 ou superior
- Um projeto configurado no [Firebase Console](https://console.firebase.google.com/)

---

### 1. Instalação do Frontend

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Luis-Henrique-ufg/Rhyme.git
   cd Rhyme
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Preencha com as credenciais do seu projeto Firebase:
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu_projeto_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em: `http://localhost:5173`

---

### 2. Instalação das Cloud Functions

1. **Acesse a pasta de functions e instale as dependências:**
   ```bash
   cd functions
   npm install
   cd ..
   ```

---

### 3. Testes Automatizados e Linter

O projeto conta com suíte de testes unitários com o Node Test Runner nativo e análise estática ultrarrápida com o `oxlint`:

```bash
# Executar a verificação estática de código (Linter)
npm run lint

# Executar a suíte de testes unitários (geo, geofencing e rotas)
npm test

# Executar o build de produção (Vite PWA)
npm run build
```

---

## 🚢 Deploy & Operações Firebase

Para realizar o deploy dos recursos no Firebase:

### 1. Autenticação na CLI do Firebase
```bash
npx firebase-tools login
```

### 2. Deploy das Regras de Segurança do Firestore
O arquivo [`firestore.rules`](./firestore.rules) define as permissões de leitura e escrita para alunos e motoristas autenticados:
```bash
# Publica apenas as regras de segurança do Firestore
npx firebase-tools deploy --only firestore:rules

# Publica apenas os índices compostos do Firestore
npx firebase-tools deploy --only firestore:indexes
```

### 3. Deploy das Cloud Functions
```bash
npx firebase-tools deploy --only functions
```

### 4. Deploy do Frontend (Hosting)
```bash
# Primeiro gere o bundle de produção
npm run build

# Publique os arquivos estáticos no Firebase Hosting
npx firebase-tools deploy --only hosting
```

### 5. Deploy Completo de Todos os Recursos
```bash
npm run build
npx firebase-tools deploy
```

---

## 📚 Documentação Técnica

A documentação detalhada de engenharia de software elaborada segundo a norma **ISO/IEC/IEEE 12207:2017** (INF0449 - UFG) encontra-se no diretório [`docs/`](./docs/):

- 📖 [**Manual Geral da Documentação**](./docs/README.md)
- 🗺️ [**Diagrama de Casos de Uso PlantUML**](./docs/diagrama.plantuml)
- 🚀 [**Apresentação e Escopo do Software (Etapa 0)**](./docs/UFG/etapa-0.md)
- 🤝 [**Processos de Acordo e SLA (Etapa 1)**](./docs/UFG/etapa-1.md)
- 🏢 [**Processos Organizacionais e RACI (Etapa 2)**](./docs/UFG/etapa-2.md)
- 📊 [**Gerenciamento Técnico, EAP e Riscos (Etapa 3)**](./docs/UFG/etapa-3.md)
- 🛠️ [**Requisitos, Arquitetura e Plano de Testes (Etapa 4)**](./docs/UFG/etapa-4.md)
- 🔄 [**Processos de Sustentação e Operação (Etapa 5)**](./docs/UFG/etapa-5.md)

---

## 📄 Licença

Este projeto é distribuído sob os termos da licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para obter mais informações.
