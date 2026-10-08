# MANUAL DE PROCESSOS DE SOFTWARE
## Sistema Rhyme — Rastreamento de Transporte Universitário em Tempo Real

---

### Identificação da Equipe e Disciplina

* **Instituição:** Universidade Federal de Goiás (UFG) — Instituto de Informática (INF)
* **Disciplina:** INF0449 — Processos de Engenharia de Software (Semestre 2026/2)
* **Nome da Equipe:** Grupo 12
* **Integrantes da Equipe:**
  1. Matheus Marquez de Carvalho Rodrigues
  2. Luis Henrique Oliveira de Jesus
  3. Heitor Gonçalves Costa
  4. Carlos Daniel Lopes de Araújo
* **Projeto:** Rhyme (Progressive Web App - PWA)
* **Norma de Governança:** ISO/IEC/IEEE 12207:2017 (*Systems and software engineering — Software life cycle processes*)

---

### Histórico Oficial de Versões

| Data | Versão | Módulo / Etapa | Descrição das Alterações e Entregáveis |
|:---:|:---:|:---:|:---|
| **10/09/2026** | **1.0** | **Parte 0** | Apresentação do software Rhyme: escopo, problema real, público-alvo, premissas operacionais e stack tecnológica. |
| **12/09/2026** | **1.2 / 2.0** | **Parte 1** | Processos de Acordo (ISO 12207 §6.1): Matriz de Aquisição PaaS/SaaS, Cessão Gratuita de Uso, SLA 99,9% e POPs. |
| **17/09/2026** | **2.0** | **Parte 2** | Processos Organizacionais Habilitadores (ISO 12207 §6.2): Ciclo de Vida Iterativo-Incremental, RACI, Qualidade e Gestão do Conhecimento. |
| **01/10/2026** | **3.0** | **Parte 3** | Processos de Gerenciamento Técnico (ISO 12207 §6.3): EAP/WBS, Análise de Decisão Multicritério (MDA) e Registro de Riscos (Risk Register). |
| **08/10/2026** | **4.0** | **Parte 4** | Processos Técnicos (ISO 12207 §6.4 - Aula 07/10): Stakeholders, Requisitos Elicitados, Arquitetura, ADRs, Diagramas UML em PlantUML e Plano de V&V. |
| **21/10/2026** | **5.0** | **Parte 4** | Processos Técnicos (Aulas 14/10 e 21/10): Padrões de Codificação, Integração de Componentes e Relatório de Validação em Campo. |
| **28/10/2026** | **6.0** | **Parte 5** | Processos de Sustentação (ISO 12207 §6.4.10–6.4.14): Implantação CI/CD, Operação, Manutenção e Plano de Descontinuação. |

---

## 0. APRESENTAÇÃO DO SOFTWARE (RHYME)

### 0.1 Nome e Descrição Geral do Software
* **Nome do Produto:** Rhyme (Gestão e Rastreamento em Tempo Real do Transporte Universitário)
* **Definição:** Plataforma digital progressiva (*Progressive Web App - PWA*) focada em eventos e telemetria em tempo real, desenvolvida para o planejamento, acompanhamento e otimização do transporte intermunicipal de estudantes universitários.
* **Problema Mitigado:** Substituição de chamadas manuais, planilhas obsoletas e ruído excessivo em grupos de mensagens (WhatsApp) por um painel georreferenciado e interativo em tempo real.
* **Rotas Iniciais de Piloto:**
  - **Rota 1:** Cromínia ↔ Goiânia (Conectando alunos das faculdades UFG Samambaia, Colemar Natal e Silva, PUC Goiás, UniCamps e Objetivo).
  - **Rota 2:** Professor Jamil ↔ Goiânia (Conectando os estudantes aos mesmos centros universitários da Região Metropolitana).

### 0.2 Público-Alvo e Contexto de Uso
* **Estudantes Universitários:** Utilizam a PWA em smartphones para visualizar o mapa em tempo real, acionar o status *One-Touch* ("Liberado da Aula" / "No Ponto") e receber alertas de chegada por geofencing.
* **Motoristas de Transporte:** Utilizam o *Cockpit do Motorista* instalado no painel do veículo para acompanhar contadores agrupados por campus, rotas otimizadas e alertas sonoros de desembarque/emergência.
* **Gestão e Associações de Estudantes:** Acompanham relatórios agregados de demanda diária e frequência.

### 0.3 Escopo e Principais Funcionalidades
1. **Monitoramento e Telemetria GPS em Tempo Real:** Atualização contínua da posição do ônibus no mapa vetorial Leaflet.
2. **Status One-Touch do Estudante:** Alternância rápida entre "Em sala", "Liberado" e "No ponto", propagada em < 100ms via Firestore.
3. **Cockpit do Motorista:** Painel com indicadores numéricos por faculdade e alertas sonoros automáticos.
4. **Geofencing & Push Notifications:** Notificações de proximidade quando o veículo se aproxima do raio de 1 km da faculdade.
5. **Protocolo de Emergência ("Fui Esquecido"):** Botão de socorro prioritário com alerta visual e sonoro contínuo na cabine do motorista.
6. **Resiliência Offline-First:** Cache de mapas e logs de presenças via Service Worker e IndexedDB para trechos de estrada sem sinal 4G.

### 0.4 Restrições e Premissas
* **Restrição de Conectividade:** Operação garantida em zonas de sombra 4G com sincronização em lote (*offline-first*).
* **Restrição Orçamentária:** Custo zero de servidores (Operação restrita ao plano Spark gratuito do Firebase e hospedeiros serverless).
* **Conformidade LGPD:** Nenhum histórico de localização privada do estudante é persistido. Coordenadas transitórias são purgadas ao fim da viagem.
* **Premissa Operacional:** O motorista possui smartphone com GPS ativado em suporte fixo no painel do ônibus.

---

## 1. PROCESSOS DE ACORDO (ISO/IEC/IEEE 12207:2017 §6.1)

### 1.1 Processo de Aquisição (ISO 12207 §6.1.1)
O Rhyme adota serviços PaaS / Serverless de infraestrutura terceirizada para eliminar custos fixos:

| Fornecedor / Serviço | Insumo Adquirido | Papel no Sistema | Critério de Aceite & Justificativa |
|:---|:---|:---|:---|
| **Google Firebase** | Cloud Firestore, Auth, FCM, Hosting | Banco NoSQL realtime via WebSocket, Auth JWT, Push e CDN | Custo zero (Spark Plan), SLA de 99,95% e eliminação de backend próprio. |
| **OpenStreetMap / Leaflet** | Cartografia aberta e tiles CDN | Renderização do mapa interativo e vetores de rota | Custo zero por requisição de API e baixo consumo de dados. |
| **GitHub** | GitHub Repositories & Actions | Controle de versão e esteira de CI/CD | Automação de linters e build antes do merge em produção. |

### 1.2 Processo de Fornecimento (ISO 12207 §6.1.2)
* **Modelo Contratual:** Termo de Cessão Gratuita de Uso Tecnológico para as associações de estudantes e prefeituras parceiras.
* **SLA Operacional:** 99,9% de disponibilidade garantida na janela crítica de transporte (Segunda a Sexta, das 15h00 às 23h30).
* **Recovery (RTO/RPO):** RTO de 15 minutos (transição para passageiro âncora) e RPO de 0 segundos (escrita atômica Firestore).

### 1.3 Procedimentos Operacionais Padronizados (POPs)
* **POP-DEV-01 (Git & Pull Request):** Branch `feature/*`, Conventional Commits, `npm run lint` (0 erros) e revisão por 1 par.
* **POP-OPS-01 (Deploy CI/CD):** Trigger no merge da `main`, validação sintática de `firestore.rules` e deploy atômico no Firebase Hosting.
* **POP-GEO-01 (Geofencing):** Validação da fórmula de Haversine com raio de alerta a 1.000m do campus.
* **POP-EMERG-01 (Botão de Emergência):** Disparo de alarme sonoro contínuo no painel do motorista com prioridade máxima.

---

## 2. PROCESSOS ORGANIZACIONAIS HABILITADORES (ISO/IEC/IEEE 12207:2017 §6.2)

### 2.1 Modelo de Ciclo de Vida Adotado (ISO 12207 §6.2.1)
Adotado o **Modelo Iterativo e Incremental Ágil** estruturado em Sprints de 2 semanas:
* **Fase 1 (Sprints 1-2):** Modelagem de requisitos, prototipação UI/UX e configuração do ambiente Firebase.
* **Fase 2 (Sprints 3-4):** Desenvolvimento do Core PWA (Mapa Leaflet, Firestore Realtime e Status One-Touch).
* **Fase 3 (Sprints 5-6):** Implementação de Geofencing, FCM Push, Service Workers offline e Painel do Motorista.
* **Fase 4 (Sprint 7+):** Validação em campo na rota Cromínia-Goiânia, ajustes e transição contínua.

### 2.2 Inventário de Infraestrutura e Ferramentas
* **Frontend:** React 19, Vite 6, Tailwind CSS 4, Lucide Icons.
* **Mapas:** Leaflet 1.9, React-Leaflet, OpenStreetMap Tile Server, Turf.js / Haversine Formula.
* **Backend BaaS:** Firebase Cloud Firestore, Firebase Authentication, Firebase Cloud Messaging (FCM).
* **Tooling:** Visual Studio Code, Git, GitHub, Vitest, PlantUML.

### 2.3 Atribuição de Competências (Matriz RACI)
Os membros do Grupo 12 atuam de forma colaborativa e multidisciplinar:
* **Matheus Marquez:** Engenharia de Requisitos, Arquitetura PWA e Integração Leaflet.
* **Luis Henrique:** UI/UX Design System, Componentização React e Service Workers PWA.
* **Heitor Gonçalves:** Configuração de Infraestrutura Firebase, Firestore Realtime Listeners e CI/CD.
* **Carlos Daniel:** Testes de Verificação e Validação (V&V), Geofencing e Protocolo de Emergência.

---

## 3. PROCESSOS DE GERENCIAMENTO TÉCNICO (ISO/IEC/IEEE 12207:2017 §6.3)

### 3.1 Planejamento de Processos (EAP / WBS)
1. **Governança & Planejamento:** Elaboração do Manual de Processos (Partes 0 a 5) e Risk Register.
2. **Engenharia de Requisitos & Design:** Matriz de Stakeholders, Especificação RF/RNF e Diagramas UML em PlantUML.
3. **Construção & Integração:** Desenvolvimento dos módulos React, integração Leaflet-Firestore e PWA Offline Service Worker.
4. **Verificação & Validação (V&V):** Suíte de testes unitários Vitest e validação em campo com usuários reais.

### 3.2 Matriz de Análise de Decisão (MDA)
* **Escolha de Banco de Dados:** Firestore NoSQL escolhido devido ao suporte nativo a WebSockets (`onSnapshot`) e sincronização reativa com latência < 100ms em comparação ao PostgreSQL/REST.
* **Escolha de Engine de Mapas:** Leaflet + OpenStreetMap escolhido sobre Google Maps API devido ao custo financeiro zero e flexibilidade de customização de marcadores em React.

### 3.3 Gestão e Registro de Riscos (Risk Register)
| Risco | Categoria | Probabilidade | Impacto | Plano de Mitigação |
|:---|:---|:---:|:---:|:---|
| **R01 - Falha de Conexão na Rodovia** | Técnico | Alta | Alto | Ativação de cache offline via IndexedDB e Firestore Persistence. |
| **R02 - Bateria / Aparelho do Motorista Desliga** | Operacional | Média | Alto | Mecanismo de emergência "Passageiro Âncora" assume transmissão GPS. |
| **R03 - Não Adoção do Status pelo Aluno** | Humano / Uso | Média | Média | Interface *One-Touch* simplificada com confirmação tátil e lembretes push. |

---

## 4. PROCESSOS TÉCNICOS (ISO/IEC/IEEE 12207:2017 §6.4)

### 4.1 Stakeholders e Necessidades Elicitadas
* **Estudante Universitário:** Necessita saber a posição do ônibus sem sobrecarregar mensagens e informar dispensa da aula.
* **Motorista do Transporte:** Necessita de contadores limpos por faculdade e alertas sonoros sem distrações ao dirigir.
* **Gestão Municipal:** Necessita de indicadores de demanda e eficiência de rotas.

### 4.2 Requisitos Funcionais (RF) e Não Funcionais (RNF)
* **RF01 - Autenticação no PWA:** Acesso via Firebase Auth (Email/Senha e Google).
* **RF02 - Seleção de Rota e Faculdade:** Cadastro de rota (Cromínia/Prof. Jamil) e campus UFG.
* **RF03 - Status One-Touch:** Alternância entre "Em sala", "Liberado da aula" e "No ponto".
* **RF04 - Rastreamento em Tempo Real:** Atualização contínua do veículo no mapa Leaflet a cada 5s.
* **RF05 - Broadcast de GPS Colaborativo:** Transmissão de GPS a bordo por alunos autorizados.
* **RF06 - Cockpit do Motorista:** Marcadores coloridos e contadores por faculdade com alertas sonoros.
* **RNF01 - Desempenho:** Carregamento PWA em < 2.0s sob 3G/4G (LCP < 2.0s).
* **RNF02 - Disponibilidade:** 99.5% de uptime nos listeners em tempo real.

### 4.3 Registros de Decisões Arquiteturais (ADRs)
* **ADR-001 (PWA Single Page Application):** Distribuição web direta sem taxas ou aprovações de App Store.
* **ADR-002 (Sincronização Reativa Firestore):** Latência < 100ms via WebSockets sem servidor backend dedicado.
* **ADR-003 (Leaflet + OpenStreetMap):** Cartografia gratuita e customizável com React.
* **ADR-004 (GPS Broadcast Colaborativo):** Cobertura de rastreamento com custo zero de hardware extra.

### 4.4 Diagramas de Design UML (PlantUML)
Os diagramas oficiais estão disponíveis no arquivo [`diagrama.plantuml`](./diagrama.plantuml):
1. **Diagrama de Casos de Uso (`Diagrama_Casos_de_Uso_Rhyme`):** Atores (Aluno, Motorista, GPS, Firestore) e 10 casos de uso.
2. **Diagrama de Sequência (`Diagrama_Sequencia_Rhyme`):** Fluxo de atualização de status e sincronização em tempo real.
3. **Diagrama de Componentes (`Diagrama_Componentes_Rhyme`):** Arquitetura cliente PWA, Leaflet, Geolocation e Firebase.

### 4.5 Plano de Verificação, Validação (V&V) e Rastreabilidade
* **CT-01 (Sincronização Status):** Mudança de status do aluno refletida no painel do motorista em < 1s. (Aprovado)
* **CT-02 (Broadcast GPS):** Deslocamento suave do marcador do ônibus no mapa a cada 5s. (Aprovado)
* **CT-03 (Cache Offline PWA):** Navegação e mapa preservados durante queda de conexão 4G. (Aprovado)

---

## 5. PROCESSOS DE SUSTENTAÇÃO, OPERAÇÃO E ENCERRAMENTO (ISO 12207 §6.4.10 – §6.4.14)

### 5.1 Processo de Implantação e Transição (CI/CD)
* Esteira automatizada via GitHub Actions com deploy direto no Firebase Hosting e Vercel.
* Atualização transparente de Service Workers em segundo plano no dispositivo do usuário.

### 5.2 Processo de Operação e Manutenção
* **Manutenção Corretiva:** Correção de bugs com ciclo de hotfix de 24h.
* **Manutenção Evolutiva:** Atualização de rotas e novos câmpi universitários conforme demandas semestrais.

### 5.3 Processo de Descontinuação e Encerramento do Ciclo de Vida
* Ao encerrar o período letivo ou ciclo da plataforma, é executada a exportação dos relatórios de uso em formato JSON/CSV e a purga definitiva das tabelas temporárias no Firestore em conformidade com a LGPD.

---

*Documento consolidado do Manual de Processos de Software — Grupo 12 — INF0449 (UFG 2026/2).*
