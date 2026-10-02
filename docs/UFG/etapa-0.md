# Manual de Processos de Software
## Etapa 0: Apresentação do Software Escolhido (Rhyme)

---

### Identificação do Trabalho e Equipe

* **Instituição:** Universidade Federal de Goiás (UFG) — Instituto de Informática (INF)  
* **Disciplina:** INF0449 — Processos de Engenharia de Software (Semestre 2026/2)  
* **Nome do Documento:** Manual de Processos de Software — Etapa 0  
* **Nome da Equipe:** Grupo 12 — Squad Rhyme Core  
* **Integrantes da Equipe:**
  1. Matheus Marquez de Carvalho Rodrigues
  2. Luis Henrique Oliveira de Jesus
  3. Heitor Gonçalves Costa
  4. Carlos Daniel Lopes de Araújo

---

### Histórico de Versões do Documento

| Data | Versão | Descrição da Alteração Realizada |
|:---|:---:|:---|
| **10/09/2026** | **1.0** | Realização da **Etapa 0** do manual de processos pela equipe: apresentação formal do software escolhido (Rhyme). Esta seção é a base estrutural de todo o documento — todos os módulos seguintes farão referência direta a ela. Contempla nome e descrição, identificação do problema, público-alvo, contexto de uso operacional, delimitação de escopo, principais funcionalidades, restrições e premissas fundamentais. |

---

## 1. APRESENTAÇÃO DO SOFTWARE (RHYME)

> *Nota de Conformidade:* Esta seção cumpre integralmente os requisitos da **Etapa 0 (Apresentação do software)** da disciplina INF0449. Os módulos e processos subsequentes (Processos de Acordo e Processos Organizacionais Habilitadores) referenciam diretamente as definições aqui consolidadas.

### 1.1 Nome e Descrição Geral do Software
* **Nome do Software:** **Rhyme** (*Gestão e Rastreamento de Transporte Universitário em Tempo Real*)
* **Definição:** O **Rhyme** é uma plataforma digital progressiva (PWA) orientada a eventos e telemetria em tempo real, concebida para planejar, monitorar e otimizar o transporte intermunicipal de estudantes universitários.
* **O que ele faz:** O sistema conecta os estudantes aos motoristas de vans e ônibus de transporte universitário, transmitindo a localização geográfica contínua do veículo em um mapa interativo, automatizando a lista de presença e indicando com um clique (*one-touch*) quais alunos já foram liberados das aulas nas faculdades e estão aguardando o embarque.
* **Rotas Piloto Iniciais:** O sistema opera inicialmente atendendo duas rotas rodoviárias regulares no interior de Goiás:
  1. **Rota Cromínia ↔ Goiânia:** Transporte diário intermunicipal ligando a cidade de Cromínia aos polos universitários da Região Metropolitana de Goiânia (UFG Câmpus Samambaia, Câmpus Colemar Natal e Silva, PUC Goiás, UniCamps e Faculdades Objetivo).
  2. **Rota Professor Jamil ↔ Goiânia:** Transporte diário de estudantes residentes no município de Professor Jamil com destino aos mesmos centros de ensino superior.

---

### 1.2 Qual Problema o Software Resolve?
Historicamente, a coordenação de embarque e retorno desses estudantes é realizada de forma improvisada através de **grupos de mensagens instantâneas no WhatsApp**. Essa abordagem gera gargalos graves:

1. **Risco Crítico à Segurança no Trânsito (Distração ao Volante):**
   * Durante o trajeto noturno de recolhimento dos estudantes nas diversas faculdades, o motorista é forçado a ler dezenas de mensagens de texto avulsas no WhatsApp com o veículo em movimento para checar quem já saiu da aula ou quem pediu para esperar. Essa distração gera elevado risco de acidentes rodoviários e urbanos.
2. **Incerteza, Ansiedade e Risco de Segurança aos Alunos:**
   * Os estudantes que saem tarde das aulas aguardam em paradas públicas e calçadas escuras sem saber onde o ônibus está ou quanto tempo levará para chegar. Quando o ônibus passa adiantado ou lotado, estudantes frequentemente são esquecidos nos pontos de embarque à noite.
3. **Desperdício de Combustível e Ineficiência de Rota:**
   * Sem saber com precisão se há estudantes liberados em determinado câmpus (por exemplo, quando turmas inteiras são dispensadas mais cedo em dias de prova), o ônibus desloca-se desnecessariamente até locais vazios, desperdiçando tempo da viagem e óleo diesel custeado com recursos municipais.
4. **Sobrecarga de Comunicação e Falta de Dados Históricos:**
   * Grupos de WhatsApp misturam conversas pessoais com informações operacionais. Não há dados consolidados de presença, auditoria de horário de saída ou métricas que permitam à prefeitura ou associação justificar o dimensionamento da frota.

O **Rhyme resolve esses problemas** ao substituir os grupos de mensagens por uma interface visual unificada e intuitiva: o motorista consulta em uma tela de alto contraste a contagem de alunos liberados por faculdade, e os alunos acompanham a aproximação do veículo no mapa e recebem notificações automáticas de proximidade.

---

### 1.3 Público-Alvo e Contexto de Uso

#### Usuários e Atores Envolvidos
* **Estudantes Universitários:**
  * Cerca de 30 a 45 alunos por rota que realizam viagens diárias de ida e volta entre sua cidade de origem e as universidades em Goiânia.
  * *Necessidades:* Saber onde o ônibus está, ter previsão de chegada (*ETA*), registrar presença/liberação sem burocracia e ter garantia de que não serão esquecidos.
* **Motoristas de Transporte Universitário:**
  * Profissionais responsáveis pela condução dos veículos em rodovias estaduais (ex.: GO-217 e BR-153) e no tráfego urbano de Goiânia.
  * *Necessidades:* Interface de uso com 1 toque, fontes grandes, contadores visuais consolidados por faculdade, alertas sonoros e zero digitação durante a condução.
* **Gestores de Transporte (Prefeituras e Associações Estudantis):**
  * Secretarias Municipais de Educação/Transporte e Diretorias de Associações Universitárias que mantêm os convênios e veículos.
  * *Necessidades:* Relatórios de utilização, auditoria de rotas, controle de embarque e justificativa de gastos operacionais.

#### Contexto e Ambiente de Operação
* **Ambiente Físico:** Dispositivos móveis operando dentro de veículos em trânsito rodoviário noturno, sob vibração mecânica, variação de luminosidade (sol da tarde e escuridão noturna) e ambiente de sala de aula/câmpus universitário.
* **Ambiente de Rede:** Conectividade intermitente ao longo da rodovia GO-217 e rodovias de ligação, alternando entre áreas com boa cobertura 4G/5G nos centros urbanos e trechos com sinal fraco ou sombra de operadora.

---

### 1.4 Escopo e Principais Funcionalidades

#### O que ESTÁ dentro do Escopo:
1. **Rastreamento e Telemetria em Tempo Real:**
   * Transmissão contínua da geolocalização do ônibus via GPS do smartphone do motorista (ou passageiro âncora em caso de contingência) para o banco NoSQL em tempo real.
   * Renderização de mapa vetorial interativo com a rota traçada, marcadores das universidades e ícone dinâmico do ônibus em movimento.
2. **Status One-Touch do Estudante:**
   * Botão direto no aplicativo onde o aluno alterna seu estado: *"Aguardando Aula"* ou *"Liberado para Embarque"*.
   * Atualização instantânea refletida no painel do motorista em menos de 100 milissegundos através de conexões de escuta reativas (*real-time listeners*).
3. **Painel do Motorista (Cockpit Veicular):**
   * Visão com contadores agrupados por instituição (ex.: UFG Samambaia: 8 liberados, 2 aguardando; PUC Área 1: 5 liberados, 0 aguardando).
   * Botão de início e encerramento de viagem.
   * Alertas sonoros automáticos de novos alunos liberados para evitar a necessidade de olhar fixamente para a tela.
4. **Geofencing e Alertas Inteligentes de Proximidade:**
   * Monitoramento perimétrico que detecta quando o ônibus entra no raio de proximidade (ex.: 1 km) do ponto de embarque do estudante.
   * Envio de notificações push de alerta (*"Seu ônibus está chegando ao Câmpus"*).
5. **Protocolo de Emergência (*"Fui Esquecido"*):**
   * Canal de socorro prioritário para o aluno acionar caso o ônibus inicie o retorno sem o seu embarque, disparando aviso sonoro de alta prioridade na cabine do motorista.
6. **Mecanismo de Tolerância a Falhas Offline:**
   * Cache de mapa e registros em IndexedDB via Service Worker, mantendo a tela operacional mesmo durante perdas momentâneas de sinal na rodovia.

#### O que NÃO está no Escopo (Não-Metas da Etapa Inicial):
* Sistema de pagamento ou bilhetagem eletrônica (o transporte universitário municipal estudado é público e subsidiado).
* Algoritmos de roteamento dinâmico com inteligência artificial para recalcular caminhos municipais (as rotas rodoviárias são fixas e regulamentadas por lei municipal).
* Aplicativo nativo empacotado para lojas pagas (Apple App Store / Google Play Console), priorizando arquitetura PWA de acesso web universal.

---

### 1.5 Restrições Técnicas e Premissas

#### Restrições Técnicas e Regulatórias
1. **Conectividade Oscilante em Rodovia:** A aplicação não pode depender de conexão ininterrupta com a internet para manter o mapa visível. Deve usar estratégias de persistência local (*Offline Persistence* do Firestore e Service Worker).
2. **Custo Operacional Zero de Servidores:** O projeto adota estritamente arquitetura *serverless* baseada nas camadas gratuitas (*Free Tier* do Google Cloud / Firebase e Vercel), impedindo cobranças recorrentes para as associações universitárias.
3. **Heterogeneidade de Dispositivos:** Os alunos e motoristas utilizam aparelhos celulares com diferentes versões de Android e iOS. O software deve operar 100% no navegador padrão sem exigir downloads externos.
4. **Conformidade com a LGPD (Lei Geral de Proteção de Dados):** Não há rastreamento contínuo da posição privada do aluno. O sistema coleta apenas o status voluntário do estudante e sua associação à faculdade cadastrada, descartando localizações ao término da viagem.

#### Premissas Assumidas pela Equipe
1. O motorista do transporte possui um smartphone com GPS ativo e plano básico de dados móveis acoplado ao painel do veículo.
2. Os pontos de embarque nas universidades e a rota entre as cidades possuem paradas previamente conhecidas e mapeadas.
3. Os estudantes têm interesse e adesão em acionar o botão de status ao término da aula para garantir seu assento de retorno.
4. A equipe de desenvolvimento do Grupo 12 mantém o código-fonte auditável sob versionamento contínuo no GitHub.

---

### 1.6 Arquitetura Base e Stack Tecnológica
* **Frontend:** React 19, Vite, Tailwind CSS 4.
* **Progressive Web App:** Service Workers, Web App Manifest com suporte a instalação na tela inicial.
* **Mapas e Geoprocessamento:** Leaflet 1.9, React-Leaflet, OpenStreetMap e algoritmos de cálculo de distância (Fórmula de Haversine).
* **Backend BaaS & Banco de Dados:** Google Cloud Firestore (banco de dados NoSQL com sincronização reativa bidirecional).
* **Autenticação:** Firebase Authentication.
* **Lógica Serverless e Alertas:** Firebase Cloud Functions v2 e Firebase Cloud Messaging (FCM).
* **Hospedagem e CDN:** Vercel e Firebase Hosting.

---

*Documento elaborado pelo Grupo 12 (Squad Rhyme Core) como entrega da Etapa 0 da disciplina INF0449 - Processos de Engenharia de Software - UFG 2026/2.*
