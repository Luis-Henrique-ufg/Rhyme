<!-- prettier-ignore -->
<div align="center">

<img src="./public/Logo.png" alt="Logo Rhyme" width="300" />

# Rhyme

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.15-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)

[Visão Geral](#visão-geral) • [Recursos](#recursos) • [Arquitetura](#arquitetura) • [Como Começar](#como-começar) 

</div>

Rhyme é um sistema de gerenciamento de transporte universitário projetado para substituir as listas de presença manuais do WhatsApp. Ele oferece uma plataforma digital em tempo real que reduz a carga cognitiva do motorista e melhora a experiência de locomoção dos alunos através do rastreamento de ônibus ao vivo e da coordenação automatizada de status.

> [!NOTE]
> Este aplicativo foi construído como um Progressive Web App (PWA) para garantir um acesso fácil em todos os dispositivos sem a necessidade de instalação por meio das lojas de aplicativos.

## Visão Geral

Coordenar rotas de ônibus universitários manualmente por aplicativos de mensagens pode levar a falhas de comunicação e à distração do motorista. O Rhyme centraliza essa comunicação em uma plataforma visual e única.

O sistema apresenta um mapa interativo que exibe as localizações atuais dos alunos (agrupadas por faculdade) juntamente com a localização do ônibus em tempo real. Os alunos podem atualizar seu status de liberação ("liberado" / "aguardando") com um único toque, o que atualiza instantaneamente o painel do motorista. Isso permite ao motorista otimizar sua rota com base na concentração de alunos em tempo real e em seus status de liberação.

## Recursos

- **Rastreamento em Tempo Real**: Os alunos podem visualizar a localização do ônibus ao vivo e sua previsão de chegada utilizando dados de GPS.
- **Status Interativo do Aluno**: Os alunos podem informar quando forem liberados da aula, atualizando o mapa do motorista em tempo real.
- **Painel do Motorista**: Uma lista consolidada e automatizada que exibe as contagens de alunos e seus respectivos status por faculdade.
- **Cerca Virtual e Notificações Push**: Os alunos recebem notificações push localizadas quando o ônibus está num raio de 1 km de sua localização.
- **Gerenciamento Automatizado de Viagens**: Viagens diárias são geradas automaticamente, removendo a necessidade de agendamentos manuais ou tarefas agendadas (cron jobs) no backend.

## Arquitetura

O Rhyme segue uma arquitetura serverless orientada ao cliente:

- **Frontend**: Desenvolvido com **React** e **Vite**, e estilizado utilizando **Tailwind CSS**. Ele incorpora **Leaflet** para a renderização de mapas e marcadores interativos customizados, e atua como um PWA totalmente funcional.
- **Backend (Serverless)**: Utiliza **Firebase Firestore** como um banco de dados NoSQL em tempo real para sincronizar o estado instantaneamente entre todos os clientes ativos. O **Firebase Authentication** garante a privacidade dos dados e um acesso seguro.

> [!TIP]
> Todos os listeners do banco de dados em tempo real e mutações foram encapsulados em Hooks customizados do React (`useTripData.js`) e ações explícitas de mutação (`tripManager.js`) para prover uma camada robusta e limpa de Data Adapter.

## Como Começar

Siga estas instruções para executar o projeto em seu ambiente de desenvolvimento local.

### Pré-requisitos

Certifique-se de que você tem os seguintes itens instalados:
- [Node.js](https://nodejs.org/en/) (Versão LTS recomendada)
- Um [Projeto Firebase](https://console.firebase.google.com/)

### Instalação

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` no diretório raiz e adicione suas variáveis de configuração do Firebase, conforme exibido em `.env.example`.

3. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   O aplicativo será iniciado em `http://localhost:5173`.

4. **Build para Produção:**
   ```bash
   npm run build
   ```
