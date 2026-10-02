# Manual de Processos de Software
## Etapa 3: Processos de Gerenciamento Técnico (ISO/IEC/IEEE 12207:2017 Seção 6.3)

---

### Identificação do Trabalho e Equipe

* **Instituição:** Universidade Federal de Goiás (UFG) — Instituto de Informática (INF)
* **Disciplina:** INF0449 — Processos de Engenharia de Software (Semestre 2026/2)
* **Nome do Documento:** Manual de Processos de Software — Etapa 3 (Processos de Gerenciamento Técnico)
* **Nome da Equipe:** Grupo 12
* **Integrantes da Equipe:**
  1. Matheus Marquez de Carvalho Rodrigues
  2. Luis Henrique Oliveira de Jesus
  3. Heitor Gonçalves Costa
  4. Carlos Daniel Lopes de Araújo

---

### Histórico de Versões do Documento

| Data | Versão | Descrição da Alteração Realizada |
|:---|:---:|:---|
| **10/09/2026** | **1.0** | Etapa 0: Apresentação do software Rhyme. |
| **12/09/2026** | **2.0** | Etapa 1: Processos de Acordo (ISO 12207 §6.1). |
| **17/09/2026** | **3.0** | Etapa 2: Processos Organizacionais Habilitadores (ISO 12207 §6.2). |
| **24/09/2026** | **4.0** | Etapa 3: Processos de Gerenciamento Técnico (ISO 12207 §6.3). EAP, cronograma de sprints, MDA e Risk Register. |

---

## 4. PARTE 3 — PROCESSOS DE GERENCIAMENTO TÉCNICO (ISO/IEC/IEEE 12207:2017 §6.3)

> *Referência Normativa:* Esta seção formaliza o planejamento e controle da execução técnica do projeto **Rhyme**, fundamentada na seção 6.3 da norma **ISO/IEC/IEEE 12207:2017** (*Technical Management Processes*). O objetivo é estruturar um plano de projeto auditável que guie a equipe ao longo do semestre, minimizando riscos e garantindo entregas rastreáveis a cada iteração.

---

### 4.1 Estrutura Analítica do Projeto (EAP) e Cronograma (ISO 12207:2017 §6.3.1)

#### A. EAP — Estrutura Analítica do Projeto

A EAP decompõe o projeto Rhyme em cinco grandes pacotes de trabalho, organizados em ordem de dependência técnica:

**1. FUNDAÇÃO E CONFIGURAÇÃO**
- 1.1 Repositório, CI/CD e Firebase
- 1.2 Autenticação e controle de acesso
- 1.3 Modelo de dados no Firestore (coleções base)

**2. MAPA E TELEMETRIA**
- 2.1 Renderização do mapa Leaflet + OpenStreetMap
- 2.2 Marcadores de faculdades e pontos de parada
- 2.3 Transmissão GPS do ônibus em tempo real

**3. FLUXO DO ESTUDANTE**
- 3.1 Autenticação do aluno (link/e-mail)
- 3.2 Botão one-touch de status (Liberado / Aguardando)
- 3.3 Visualização do ônibus e ETA no mapa do aluno

**4. COCKPIT DO MOTORISTA**
- 4.1 Dashboard de contadores por faculdade
- 4.2 Alertas sonoros de novos liberados
- 4.3 Botão de emergência "Fui Esquecido"
- 4.4 Controles de início e encerramento de viagem

**5. QUALIDADE, TESTES E LANÇAMENTO**
- 5.1 Testes unitários e de integração
- 5.2 Testes de campo na GO-217 (rota piloto)
- 5.3 Geofencing e notificações push (FCM)
- 5.4 Deploy em produção e handoff aos usuários

#### B. Cronograma de Sprints (Agosto – Novembro 2026)

O projeto será executado em **6 sprints quinzenais** ao longo do semestre 2026/2:

| Sprint | Período | Pacotes | Entregáveis |
|:---:|:---|:---|:---|
| **S1** | 11/08 – 25/08/2026 | 1.1, 1.2, 1.3 | Ambiente configurado, autenticação funcional, modelo de dados no Firestore. |
| **S2** | 25/08 – 10/09/2026 | 2.1, 2.2 | Mapa interativo com marcadores estáticos das faculdades. (Entrega Etapa 0) |
| **S3** | 10/09 – 24/09/2026 | 2.3, 3.1, 3.2 | GPS do ônibus publicando coordenadas; botão de status do aluno funcional. (Entrega Etapa 1) |
| **S4** | 24/09 – 08/10/2026 | 4.1, 4.2, 4.3 | Cockpit do motorista completo com alertas e botão de emergência. (Entrega Etapa 2) |
| **S5** | 08/10 – 22/10/2026 | 3.3, 4.4, 5.1 | ETA no mapa do aluno; cobertura mínima de 70% nos testes unitários. |
| **S6** | 22/10 – 05/11/2026 | 5.2, 5.3, 5.4 | Teste de campo na rota Cromínia aprovado; geofencing e push funcionais; v1.0 em produção. |

---

### 4.2 Matriz de Decisão de Arquitetura (MDA)

Antes de iniciar a codificação, a equipe avaliou formalmente as alternativas técnicas mais relevantes. A MDA registra critérios, opções e justificativas das escolhas arquiteturais, garantindo rastreabilidade ao longo do ciclo de vida.

#### MDA-01: Estratégia de Hospedagem e Distribuição

| Critério | Peso | Vercel (Escolhida) | Firebase Hosting | GitHub Pages |
|:---|:---:|:---:|:---:|:---:|
| Tempo de build e deploy | 30% | 5 | 4 | 3 |
| CDN com nó no Brasil | 30% | 5 | 5 | 2 |
| Integração GitHub CI/CD | 20% | 5 | 3 | 3 |
| Custo para projeto educacional | 20% | 5 | 4 | 5 |
| **Pontuação Ponderada** | 100% | **5,0** | **4,4** | **3,2** |

**Decisão:** Vercel como hospedagem primária. Firebase Hosting como fallback automático.

#### MDA-02: Estratégia de Mapeamento

| Critério | Peso | Leaflet + OSM (Escolhida) | Google Maps Platform | Mapbox GL JS |
|:---|:---:|:---:|:---:|:---:|
| Custo para escala educacional | 35% | 5 | 2 | 3 |
| Tamanho do bundle JS | 25% | 5 | 2 | 3 |
| Suporte a modo offline | 20% | 4 | 2 | 4 |
| Integração com React | 20% | 5 | 4 | 4 |
| **Pontuação Ponderada** | 100% | **4,9** | **2,7** | **3,5** |

**Decisão:** Leaflet 1.9 + OpenStreetMap/CartoDB. Elimina riscos de faturamento inesperado por volume de requisições de mapa.

#### MDA-03: Modelo de Distribuição — PWA vs. App Nativo

| Critério | Peso | PWA (Escolhida) | App React Native | App Flutter |
|:---|:---:|:---:|:---:|:---:|
| Tempo de onboarding do usuário | 30% | 5 | 2 | 2 |
| Custo de publicação | 25% | 5 | 3 | 3 |
| Acesso a GPS e notificações | 20% | 4 | 5 | 5 |
| Complexidade de manutenção | 25% | 5 | 3 | 3 |
| **Pontuação Ponderada** | 100% | **4,8** | **3,1** | **3,1** |

**Decisão:** PWA como estratégia principal. Garante adesão imediata via link ou QR Code no ônibus, sem necessidade de download em lojas.

---

### 4.3 Registro de Riscos — Risk Register (ISO 12207:2017 §6.3.4)

O Risk Register cataloga os principais riscos identificados **antes do início do desenvolvimento**. Probabilidade e Impacto avaliados em escala 1–5. Exposição = Probabilidade × Impacto.

#### Riscos Técnicos

| ID | Risco | Prob. | Impacto | Exposição | Plano de Resposta |
|:---|:---|:---:|:---:|:---:|:---|
| **RT-01** | Cobertura celular insuficiente na GO-217 impossibilita transmissão GPS em tempo real. | 4 | 5 | **20** | Offline persistence do Firestore + cache no Service Worker. Última posição conhecida é mantida e sincronizada ao reconectar. |
| **RT-02** | Bateria do smartphone do motorista se esgota durante a viagem. | 3 | 5 | **15** | Protocolo de passageiro âncora pré-cadastrado assume transmissão GPS. Veículo deve ter suporte com carregamento 12V. |
| **RT-03** | Notificações push do FCM não entregues em dispositivos iOS. | 3 | 3 | **9** | Testes em dispositivos físicos iOS na Sprint S5. Fallback: atualização visual em tela sem push. |
| **RT-04** | Atraso superior a 5s na sincronização WebSocket no painel do motorista. | 2 | 4 | **8** | Monitoramento via timestamps no Firestore (QM-01). Reconexão automática com backoff exponencial. |
| **RT-05** | Geofencing dispara falsos positivos em vias paralelas ao câmpus. | 3 | 2 | **6** | Calibração do raio em campo durante S5. Polígonos delimitadores por câmpus em vez de raios circulares. |

#### Riscos Organizacionais

| ID | Risco | Prob. | Impacto | Exposição | Plano de Resposta |
|:---|:---|:---:|:---:|:---:|:---|
| **RO-01** | Baixa adesão dos alunos ao botão de liberação gera dados incompletos. | 3 | 4 | **12** | Campanha de lançamento com vídeo (60s) e QR Code no ônibus. Engajamento mediado pelas associações estudantis. |
| **RO-02** | Resistência do motorista à nova tecnologia durante a condução. | 2 | 5 | **10** | Oficina de treinamento de 30 minutos antes da primeira viagem. Interface cockpit com 1 botão central e contadores grandes. |
| **RO-03** | Saída de integrante do grupo reduz a capacidade de entrega. | 2 | 4 | **8** | Conhecimento compartilhado via matriz RACI. Todos documentam atividades no GitHub. Sem silos individuais de código. |
| **RO-04** | Feature creep compromete entregas das etapas acadêmicas. | 3 | 3 | **9** | Congelamento formal de escopo ao final de S2. Novas funcionalidades vão para backlog de versões futuras. |

#### Riscos Regulatórios e Financeiros

| ID | Risco | Prob. | Impacto | Exposição | Plano de Resposta |
|:---|:---|:---:|:---:|:---:|:---|
| **RR-01** | Coleta de localização sem consentimento explícito contraria a LGPD. | 2 | 5 | **10** | O sistema não coleta localização do aluno — apenas status textual voluntário. Localização coletada é exclusivamente a do veículo, com consentimento. Dados descartados ao encerrar cada viagem. |
| **RR-02** | Limite gratuito do Firebase Spark Tier ultrapassado, gerando cobranças. | 1 | 4 | **4** | Monitoramento contínuo no console Firebase. Volume estimado (~2.000–3.000 ops/dia) é 95% abaixo do limite gratuito. |

---

### 4.4 Plano de Monitoramento e Controle do Projeto

Para garantir aderência ao cronograma e à qualidade planejados, a equipe adotará:

1. **Revisão de Sprint (Quinzenal):** Demonstração do incremento em dispositivo físico ao final de cada sprint como evidência de entrega.
2. **Retrospectiva de Sprint (Quinzenal):** Sessão de 15 minutos para identificar melhorias e impedimentos da iteração.
3. **Dashboard GitHub Projects:** Quadro Kanban com colunas Backlog / In Progress / In Review / Done atualizado diariamente.
4. **Atualização do Risk Register:** Revisão dos riscos ao início de cada sprint, reclassificando riscos materializados e identificando novos.
5. **Relatório de Velocidade:** Estimativa em story points ao início do sprint e comparação com o realizado ao final, para calibrar a capacidade de entrega do grupo.

---

*Documento elaborado pelo Grupo 12 como entrega da Etapa 3 da disciplina INF0449 - Processos de Engenharia de Software - UFG 2026/2.*
