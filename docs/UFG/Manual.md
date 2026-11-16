# Manual de Processos de Software

## Rhyme — Gestão e Telemetria em Tempo Real de Transporte Universitário Intermunicipal

**Referencial:** ISO/IEC/IEEE 12207:2017

---

## Capa

| | |
|:---|:---|
| **Título** | Manual de Processos de Software — Sistema Rhyme |
| **Equipe** | Grupo 12 — Squad Rhyme Core |
| **Disciplina** | INF0449 — Processos de Engenharia de Software (2026/2) |
| **Instituição** | Universidade Federal de Goiás (UFG) — Instituto de Informática |
| **Apresentação** | 26/11/2026 (G9 a G12) — 20 a 30 min, todos os membros |

**Membros**

| Membro | Papel no projeto |
|:---|:---|
| Matheus Marquez de Carvalho Rodrigues | Requisitos e Produto |
| Luis Henrique Oliveira de Jesus | Arquitetura e Frontend |
| Heitor Gonçalves Costa | Infraestrutura, Nuvem e DevOps |
| Carlos Daniel Lopes de Araújo | Qualidade (SQA), Verificação e Validação |

---

## Contracapa — Histórico de Versões

| Versão | Data | Alteração |
|:---:|:---:|:---|
| 1.0 | 10/09/2026 | Apresentação do software, escopo, problema, premissas. |
| 2.0 | 17/09/2026 | Processos de Acordo (aquisição, fornecimento, SLA, POPs). |
| 3.0 | 17/09/2026 | Processos Organizacionais (ciclo de vida, infraestrutura, RACI, qualidade). |
| 4.0 | 01/10/2026 | Gerenciamento Técnico (EAP, riscos, decisões, configuração). |
| 5.0 | 01/10/2026 | Processos Técnicos (requisitos, arquitetura, V&V). |
| 6.0 | 01/10/2026 | Sustentação (implantação, manutenção, descontinuação). |
| 7.0 | 22/10/2026 | Unificação das etapas e avaliação por pares com plano CAPA. |
| **8.0** | **29/10/2026** | **Reestruturação conforme a Atividade (6 capítulos); novos ADRs, plano de integração, métricas de projeto, operação/monitoramento e Capítulo 6 de melhoria.** |

---

# Capítulo 1 — Apresentação do Software

## 1.1 Nome e descrição

**Rhyme** é um *Progressive Web App* (PWA) que coordena em tempo real o transporte de universitários do interior de Goiás até Goiânia, substituindo os grupos de WhatsApp usados hoje.

## 1.2 O que é, o que faz e que problema resolve

O Rhyme mostra a posição do ônibus no mapa, permite ao aluno informar com um toque que foi liberado da aula e entrega ao motorista um painel com a contagem de alunos por faculdade.

Problemas resolvidos:

1. **Motorista distraído:** lê dezenas de mensagens com o veículo em movimento.
2. **Aluno vulnerável:** espera à noite sem saber onde o ônibus está nem quando chega (ETA).
3. **Desperdício:** o ônibus passa em câmpus sem alunos e gasta diesel subsidiado.
4. **Sem dados:** mensagens se perdem; não há histórico de presença para dimensionar a frota.

## 1.3 Público-alvo e contexto de uso

## 1.4 Quem usa, em que situação e em que ambiente

| Usuário | Situação de uso | Ambiente |
|:---|:---|:---|
| Estudante universitário | Informa liberação e acompanha o ônibus | Celular, no câmpus ou no ponto, 4G variável |
| Motorista | Vê contadores e alertas durante a viagem | Celular em suporte 12V no painel, rodovias estaduais e federais (GOs e BRs de acesso à capital) |
| Gestor municipal / associação | Consulta presença e rotas | Navegador |

Rotas piloto: **Corredores intermunicipais de estudantes do interior de Goiás ↔ Goiânia** (cerca de 30 alunos/dia por rota piloto), com horários de saída por volta de 16h e 16h30 e retorno noturno ao término das aulas.

## 1.5 Escopo e principais funcionalidades

**Dentro do escopo**

| # | Funcionalidade |
|:---:|:---|
| 1 | Rastreamento GPS do ônibus no mapa Leaflet (atualização a cada 5 s) |
| 2 | Status one-touch do aluno: "Em sala", "Liberado", "No ponto" |
| 3 | Cockpit do motorista com contadores por faculdade e alertas sonoros |
| 4 | Geofencing (1 km) com notificação push |
| 5 | Protocolo de emergência "Fui Esquecido" |
| 6 | Funcionamento offline (Service Worker + IndexedDB) |

**Fora do escopo:** cobrança/bilhetagem, roteamento dinâmico por IA, aplicativos nativos em lojas.

## 1.6 Restrições e premissas

| Tipo | Item |
|:---|:---|
| Restrição | Custo zero: uso do plano gratuito (Spark) do Firebase e de mapas abertos. |
| Restrição | Cobertura 4G irregular na rodovia. |
| Restrição | Conformidade com a LGPD: localização apenas do veículo; histórico de presença descartado diariamente. |
| Restrição | Equipe de 4 alunos, prazo do semestre 2026/2. |
| Premissa | Todos os usuários têm smartphone com Chrome (v110+) ou Safari (v16.4+). |
| Premissa | O motorista mantém o celular carregado no suporte veicular. |
| Premissa | Prefeituras mantêm os trajetos já autorizados. |

---

# Capítulo 2 — Processos de Acordo

## 2.1 Processo de aquisição

O que a equipe contrata ou adota de terceiros (decisão *make* vs. *buy*):

| Recurso | Decisão | Fornecedor | Justificativa |
|:---|:---:|:---|:---|
| Banco de dados realtime | Buy (PaaS) | Google Firebase (Firestore) | Evita servidor 24/7; `onSnapshot` com latência < 100 ms; plano gratuito. |
| Autenticação | Buy (SaaS) | Firebase Authentication | Segurança pronta, sem gerir credenciais. |
| Mapas e tiles | Buy (Free Tier) | Mapbox (Plano Free) + Leaflet 1.9 | Fornecimento estável de tiles de alta resolução (até 50.000 requisições/mês) sem custo de licenciamento. |
| Notificações push | Buy | Firebase Cloud Messaging | Integrado ao Firebase. |
| Hospedagem e CDN | Buy (PaaS) | Vercel (principal), Firebase Hosting (espelho) | CDN com nó em São Paulo, HTTPS automático. |
| Interface e lógica | **Make** | Equipe (React 19 + Tailwind) | Ferramentas no-code não atendem offline e baixa latência. |

## 2.2 Processo de fornecimento

- **Entrega:** PWA publicado em URL HTTPS, acessado por QR Code (sem lojas de apps).
- **Contrato:** Termo de Cessão de Uso sem ônus (comodato acadêmico) às secretarias municipais de transporte dos municípios parceiros conveniados e às associações de estudantes. Proíbe monetização e compartilhamento de dados cadastrais.
- **Critérios de aceite:** casos de teste CT-01 a CT-10 aprovados (seção 5.4) e validação em campo na GO-217.
- **Suporte:** corretivo com SLA de 2 h (crítico) e 24 h (alto).

| Indicador de serviço | Meta |
|:---|:---|
| Disponibilidade | 99,9% (segunda a sexta, 15h00–23h30) |
| RTO | 15 min (passageiro âncora assume o GPS) |
| RPO | 0 s (escritas atômicas do Firestore + fila offline) |

Procedimentos operacionais padronizados:

| POP | Objetivo |
|:---|:---|
| POP-DEV-01 | Nada vai direto à `main`; branch temática, commits semânticos, lint limpo e review obrigatório. |
| POP-OPS-01 | Deploy automático via GitHub Actions ao mesclar na `main`, com validação de `firestore.rules` e teste de fumaça mobile. |
| POP-GEO-01 | Calibração do geofencing (Haversine, raio de 1.000 m) e entrega de push em < 2 s. |
| POP-EMERG-01 | Tratamento do "Fui Esquecido" e chaveamento para o passageiro âncora. |

## 2.3 Fornecedores e parceiros relevantes

| Parceiro | Papel |
|:---|:---|
| Google (Firebase) | Firestore, Auth, FCM, Hosting |
| Vercel | Hospedagem e CDN |
| Mapbox Inc. | Provedor de tiles cartográficos e renderização geográfica (Plano Free) |
| GitHub | Repositório e CI/CD |
| Prefeituras conveniadas (municípios parceiros) | Patrocinadoras e cessionárias |
| Associações de estudantes | Usuárias e canal de adoção |

---

# Capítulo 3 — Processos Organizacionais Habilitadores

## 3.1 Modelo de ciclo de vida

**Iterativo-incremental híbrido (Scrum + Kanban), sprints quinzenais.**

```
[Visão / Requisitos] ──► [Sprint N: incremento] ──► [Deploy piloto]
        ▲                                                │
        └────────── Validação em campo (GO-217) ◄────────┘
```

Justificativa:

1. A recepção 4G/GPS na rodovia só se valida em campo; cada sprint permite testar a realidade.
2. Riscos técnicos (WebSockets, cache offline) foram isolados em incrementos antes do geofencing.
3. O modelo permite entregas parciais ao longo do semestre, sem retrabalho em cascata.

## 3.2 Infraestrutura e ferramentas

| Categoria | Ferramenta | Uso |
|:---|:---|:---|
| Runtime / build | Node.js 20 LTS, Vite 6 | Ambiente e empacotamento |
| Frontend | React 19, Tailwind CSS 4 | Interface reativa |
| Mapas | Leaflet 1.9 + React-Leaflet 5, Mapbox API (Free Tier) | Renderização cartográfica vetorial leve |
| Dados | Cloud Firestore, Firebase Auth, FCM | Backend serverless |
| Testes local | Firebase Emulator Suite, Vitest, React Testing Library | Testes |
| Qualidade | ESLint, Oxlint | Análise estática |
| Versionamento / CI | Git, GitHub, GitHub Actions | Controle e automação |
| Hospedagem | Vercel, Firebase Hosting | Entrega |
| Dispositivos | Android 10+ / iOS 15+ | Cliente |

## 3.3 Justificativa estratégica e viabilidade

| Dimensão | Avaliação |
|:---|:---|
| **Estratégica** | Reduz risco de acidente, melhora segurança noturna e economia de diesel (meta de 10–15% por viagem). |
| **Técnica** | Viável: stack madura e conhecida pela equipe; PWA dispensa lojas. |
| **Econômica** | Viável: custo zero no plano gratuito; ajuste de GPS de 5 s para 10 s se a cota chegar a 70%. |
| **Operacional** | Viável: uso de um toque; treinamento do motorista de 30 min. |
| **Legal** | Viável com LGPD: sem localização individual de alunos. |
| **Prazo** | Viável: seis sprints no semestre. |

Conclusão: **projeto viável**, com os maiores riscos em conectividade e adoção, tratados na seção 4.2.

## 3.4 Papéis, competências, capacitação (RACI)

*R = executa, A = aprova, C = consultado, I = informado.*

| Atividade | Matheus (Req.) | Luis (Arq.) | Heitor (Infra) | Carlos (SQA) |
|:---|:---:|:---:|:---:|:---:|
| Elicitação de requisitos | A/R | C | C | C |
| Modelagem do banco e regras | C | R | A/R | C |
| UI e mapas | I | A/R | C | C |
| Geofencing e push | C | R | R | A |
| Testes unitários e de campo | C | C | I | A/R |
| Releases e CI/CD | I | R | A/R | C |
| Incidentes de telemetria | C | I | R | A/R |

**Capacitação:** nivelamento na ISO 12207; PWA offline-first (Service Workers, *Stale-While-Revalidate*, IndexedDB); oficina de `firestore.rules` com o Emulator Suite.

## 3.5 Plano de qualidade (critérios e métricas)

| ID | Métrica | Meta | Medição | Ação em desvio |
|:---:|:---|:---|:---|:---|
| QM-01 | Latência de sincronização | < 100 ms (4G/5G); < 1 s (3G) | `timestamp` de escrita vs. recebimento | Reduzir payload e consultas |
| QM-02 | Eficácia do geofencing | ≥ 98% de alertas antes da chegada | Log de alertas vs. embarque | Ampliar raio de 1.000 m para 1.500 m |
| QM-03 | Web Vitals mobile | LCP < 2,0 s; TTI < 2,5 s | Lighthouse no CI | Code-splitting e pré-carga de tiles |
| QM-04 | Cobertura de testes | ≥ 80% | Relatório Vitest | PR bloqueado se reduzir cobertura |

Práticas: auditoria automática em cada PR, *Definition of Done* (emuladores Android/iOS e regressão dos POPs) e retrospectiva quinzenal.

## 3.6 Gestão do conhecimento

1. **Documentação viva** em Markdown no repositório, versionada no Git.
2. **ADRs** para toda decisão estrutural (seção 4.4).
3. **Post-mortems sem culpa** após incidentes em viagens reais.
4. **Rodízio de revisão de código** entre os quatro membros, evitando conhecimento concentrado.

---

# Capítulo 4 — Processos de Gerenciamento Técnico

## 4.1 Plano de projeto

**Escopo:** PWA Rhyme conforme seção 1.5.

**EAP (3 níveis)**

| Pacote | Subpacote | Entregáveis |
|:---|:---|:---|
| **1.0 Fundação** | 1.1 Repositório e automação | 1.1.1 Branch protection e Conventional Commits; 1.1.2 CI/CD |
| | 1.2 Autenticação e segurança | 1.2.1 Firebase Auth; 1.2.2 `firestore.rules` |
| | 1.3 Modelagem de dados | 1.3.1 Coleções `routes`, `trips`, `students`, `bus_location`, `emergencies` |
| **2.0 Mapa e telemetria** | 2.1 Interface cartográfica | 2.1.1 Leaflet + OSM; 2.1.2 Marcadores de câmpus |
| | 2.2 Telemetria | 2.2.1 Captura GPS; 2.2.2 Envio a cada 5 s |
| **3.0 Fluxo do estudante** | 3.1 Interface do passageiro | 3.1.1 Onboarding; 3.1.2 `StatusToggle` |
| | 3.2 Mapa do aluno | 3.2.1 Posição e ETA; 3.2.2 Push por geofencing |
| **4.0 Cockpit do motorista** | 4.1 Painel | 4.1.1 Contadores por câmpus; 4.1.2 Controle de viagem |
| | 4.2 Alertas | 4.2.1 Avisos sonoros; 4.2.2 Painel "Fui Esquecido" |
| **5.0 Resiliência e implantação** | 5.1 Offline/PWA | 5.1.1 Service Worker; 5.1.2 IndexedDB |
| | 5.2 Validação | 5.2.1 Testes Vitest; 5.2.2 Ensaio em campo na GO-217 |

**Cronograma**

| Sprint | Período | Pacotes | Marco |
|:---:|:---|:---|:---|
| S1 | 11/08–25/08 | 1.1–1.3 | Repositório, CI, Auth, schema |
| S2 | 25/08–10/09 | 2.1, 2.2 | Mapa com câmpus; Etapa 0 |
| S3 | 10/09–24/09 | 2.2, 3.1, 3.2 | GPS e botão de status; Etapa 1 |
| S4 | 24/09–08/10 | 4.1, 4.2 | Cockpit e alarme; Etapa 2 |
| S5 | 08/10–22/10 | 3.2, 5.1, 5.2 | Offline, ETA, testes ≥ 80%; Etapas 3–4 |
| S6 | 22/10–05/11 | 5.2 | Validação em campo; manual consolidado |

**Recursos:** 4 membros (seção 3.4), ferramentas gratuitas (seção 3.2).
**Entregas:** PWA publicado, manual (este documento) e apresentação em 26/11.

## 4.2 Plano de gestão de riscos

*Severidade = Probabilidade (1–5) × Impacto (1–5).*

| ID | Risco | P | I | Sev. | Resposta preventiva | Contingência |
|:---:|:---|:---:|:---:|:---:|:---|:---|
| RT-01 | Sombra de 4G na GO-217 impede envio de GPS | 4 | 5 | **20** | Service Worker e persistência IndexedDB | Retém última coordenada e envia após reconexão |
| RT-02 | Bateria do celular do motorista acaba | 3 | 5 | **15** | Carregador 12V obrigatório | Passageiro âncora assume o GPS |
| RO-01 | Aluno esquece de atualizar o status | 3 | 4 | **12** | Interface one-touch e campanha | Motorista confere pelo contador |
| RO-02 | Cockpit difícil de operar na estrada | 2 | 5 | **10** | Botões > 64 px, alto contraste, som | Treinamento de 30 min |
| RT-03 | Push falha no Safari/iOS | 3 | 3 | **9** | Validar Web Push em iOS 16.4+ | Alerta visual no mapa |
| RT-04 | Latência > 2 s na cabine | 2 | 4 | **8** | Payload enxuto e índices compostos | Reconectar listeners |
| RR-01 | Não conformidade com a LGPD | 1 | 5 | **5** | Sem localização privada de alunos | Purga imediata ao fim da viagem |
| RR-02 | Cota gratuita do Firebase esgotada | 1 | 4 | **4** | Arquitetura orientada a eventos | GPS de 5 s para 10 s |

## 4.3 Plano de gestão de configuração

```
main (protegida)
  ├── feature/*  ──► PR (lint + build + 1 review) ──► Squash & Merge ──► main
  └── fix/*      ──► PR (testes Vitest + review)  ──► Squash & Merge ──► main
```

| Item | Regra |
|:---|:---|
| Branches | `main` apenas com código homologado; sem push direto. |
| Commits | *Conventional Commits*: `feat`, `fix`, `docs`, `test`, `refactor`. |
| Pull Requests | 1 revisor independente; `npm run lint` e `npm run test` sem falhas. |
| Merge | *Squash and Merge* (histórico linear). |
| Releases | Tags anotadas SemVer `vMAJOR.MINOR.PATCH` (ex.: `v1.0.0`). |

## 4.4 Registro de decisões técnicas (ADRs)

| ADR | Decisão | Contexto | Alternativas (nota ponderada) | Consequência |
|:---:|:---|:---|:---|:---|
| **001** | Distribuir como **PWA** | Acesso imediato por QR Code, sem lojas | PWA 4,8; React Native 3,1; Flutter 3,1 | Sem builds nativos; push no iOS depende de 16.4+ |
| **002** | **Leaflet + Mapbox API (Free Tier)** | Custo zero, alta resolução e bundle leve | Mapbox + Leaflet 4,9; Mapbox SDK nativo 3,5; Google Maps 2,7 | 50.000 requisições/mês gratuitas; sem risco de faturamento cambial |
| **003** | **Firebase** (Firestore, Auth, FCM) | Tempo real sem servidor próprio | Servidor Node + Socket.io | Cotas do plano gratuito exigem monitoramento |
| **004** | Hospedar na **Vercel** com espelho no Firebase Hosting | CDN no Brasil e integração GitHub | Vercel 5,0; Firebase 4,4; GitHub Pages 3,2 | Dois destinos de deploy para manter |

Critérios das matrizes de decisão: custo, tamanho de bundle, suporte offline, integração com React, CDN no Brasil, tempo de onboarding.

## 4.5 Métricas de acompanhamento do projeto

| Métrica | Meta | Fonte | Frequência |
|:---|:---|:---|:---:|
| Velocity (itens concluídos por sprint) | Estável entre sprints | Quadro Kanban | Quinzenal |
| Prazo: entregas no marco da sprint | 100% dos marcos | Cronograma (4.1) | Por sprint |
| Cobertura de testes (QM-04) | ≥ 80% | Vitest no CI | Por PR |
| Casos de teste aprovados | 10 de 10 | Relatório de V&V | Por release |
| Riscos com severidade ≥ 15 abertos | 0 sem plano ativo | Risk Register | Quinzenal |
| Débitos técnicos listados na retrospectiva | Tendência de queda | Retrospectiva | Quinzenal |
| Consumo da cota do Firebase | < 70% | Console Firebase | Semanal |

---

# Capítulo 5 — Processos Técnicos

## 5.1 Requisitos

### 5.1.1 Documento de requisitos do sistema

**Funcionais**

| ID | Requisito | Prior. | Critério mensurável |
|:---:|:---|:---:|:---|
| RF01 | Autenticação por Firebase Auth com sessão persistida | Alta | Login < 2 s; sessão recuperada ao recarregar |
| RF02 | Seleção de rota e campus pelo estudante | Alta | Perfil refletido no mapa em < 500 ms |
| RF03 | Status one-touch: "Em sala" (`in_class`), "Liberado" (`released`), "No ponto" (`at_stop`) e confirmação "Embarcado" (`boarded`) | Alta | Reflexo no cockpit em < 100 ms |
| RF04 | Mapa Leaflet com posição do ônibus e paradas | Alta | Atualização a cada 5 s |
| RF05 | GPS colaborativo (motorista ou passageiro âncora) | Média | Precisão < 15 m |
| RF06 | Cockpit com contadores por faculdade e aviso sonoro | Alta | Som em < 500 ms |
| RF07 | Sincronização reativa via listeners do Firestore | Alta | Latência < 100 ms em 4G/5G |
| RF08 | ETA do ônibus | Média | Erro < 3 min a menos de 10 km |
| RF09 | Geofencing (1 km) e push | Média | Push em ≤ 2 s |
| RF10 | Botão "Fui Esquecido" com alerta e uso offline | Alta | Alerta na cabine em < 1 s |

**Não funcionais**

| ID | Categoria | Requisito | Métrica |
|:---:|:---|:---|:---|
| RNF01 | Desempenho | Carregar rápido em 3G/4G | FCP < 1,8 s; TTI < 2,5 s |
| RNF02 | Disponibilidade | Alta no horário de deslocamento | 99,9% (15h00–23h30, dias úteis) |
| RNF03 | Portabilidade | Android e iOS | Chrome 110+, Safari 16.4+ |
| RNF04 | Usabilidade | Toque rápido durante a condução | Alvos ≥ 48×48 px; contraste WCAG AA |
| RNF05 | Segurança e privacidade | LGPD | HTTPS obrigatório; coordenadas temporárias descartadas ao fim da rota |

**Restrições:** plano gratuito do Firebase, mapas abertos, sem apps nativos, sem cobrança.

### 5.1.2 Rastreabilidade de requisitos

| Requisito | EAP | Código-fonte | Teste |
|:---:|:---:|:---|:---:|
| RF01 | 1.2.1 | `AuthContext.jsx`, `AuthModal.jsx` | CT-01 |
| RF02 | 3.1.1 | `ProfileSetup.jsx`, `routeUtils.js` | CT-02 |
| RF03 | 3.1.2 | `StatusToggle.jsx`, `tripManager.js` | CT-03 |
| RF04 | 2.1.1 | `StudentMap.jsx`, `MapView.jsx` | CT-04 |
| RF05 | 2.2.2 | `GpsBroadcaster.jsx`, `geo.js` | CT-05 |
| RF06 | 4.1.1 | `DriverDashboard.jsx`, `DriverCockpit.jsx` | CT-06 |
| RF07 | 1.3.1 | `firebase.js`, `firestore.rules` | CT-07 |
| RF08 | 3.2.1 | `geo.js` (Haversine e ETA) | CT-08 |
| RF09 | 3.2.2 | `notifications.js`, Cloud Functions de geofence | CT-09 |
| RF10 | 4.2.2, 5.1.1 | `EmergencyButton.jsx`, `public/sw.js` | CT-10 |

*Todos os arquivos em `src/` do repositório Rhyme (`src/services/` para `firebase.js` e `notifications.js`; `src/utils/` para `geo.js`, `routeUtils.js` e `tripManager.js`).*

### 5.1.3 Critérios de aceitação

Cada requisito tem seu critério mensurável na tabela 5.1.1. Um requisito só é "aceito" quando o teste correspondente (seção 5.4) é aprovado e o critério é atingido.

### 5.1.4 Registro de stakeholders e necessidades

| Stakeholder | Necessidade elicitada | Requisitos |
|:---|:---|:---|
| Estudantes | Ver o ônibus, avisar a liberação, receber alerta de proximidade | RF03, RF04, RF08, RF09 |
| Motoristas | Interface limpa, números agregados, alerta de emergência | RF06, RF10, RNF04 |
| Gestores municipais e associações | Rotas sem desperdício, presença segura, LGPD | RF07, RNF05 |

## 5.2 Arquitetura e Design

### 5.2.1 Arquitetura do sistema

Visão geral: SPA PWA em React 19 no smartphone, comunicando-se por WebSocket seguro com o Firestore e baixando tiles via HTTPS.

```
┌────────────────────────────────────────────────────────────────┐
│                      CLIENTE PWA (React 19)                    │
│   Módulo Core        Módulo Mapa          Módulo Cockpit       │
│   (Auth, perfil,     (Leaflet, tiles,     (contadores, som,    │
│    status)            marcadores GPS)      emergência)         │
├────────────────────────────────────────────────────────────────┤
│  Service Worker + IndexedDB  │  Controlador de Geolocalização  │
├────────────────────────────────────────────────────────────────┤
│  Firebase: Auth · Firestore (onSnapshot) · FCM  │  Mapbox API  │
└────────────────────────────────────────────────────────────────┘
```

**Interfaces:** Firestore (WebSocket/SDK), FCM (push), Geolocation API (`watchPosition`), Mapbox API (HTTPS).

**Modelo de dados (Firestore)**

| Coleção | Campos principais |
|:---|:---|
| `routes` | `id`, `name`, `faculties[]` (`name`, `lat`, `lng`, `order`), `active` |
| `trips` | `tripId`, `routeId`, `driverUid`, `status` (`scheduled`/`in_progress`/`completed`), `startedAt`, `endedAt` |
| `trips/{tripId}/students` | `studentUid`, `name`, `faculty`, `status` (`in_class`/`released`/`at_stop`/`boarded`), `updatedAt` |
| `bus_location` | `tripId`, `lat`, `lng`, `speed`, `heading`, `updatedAt`, `broadcasterRole` |
| `emergencies` | `id`, `tripId`, `studentUid`, `studentName`, `faculty`, `active`, `createdAt` |

Decisões arquiteturais: ADR-001 a ADR-004 (seção 4.4).

### 5.2.2 Diagramas de design

Fontes PlantUML na pasta [`diagramas/`](./diagramas/) (visualização: extensão PlantUML do VS Code, `Alt + D`):

| Diagrama | Arquivo | O que mostra |
|:---|:---|:---|
| Casos de uso | [casos-de-uso.puml](./diagramas/casos-de-uso.puml) | 10 casos de uso alinhados aos RFs (inclui telemetria, push e emergência "Fui Esquecido") |
| Sequência em tempo real | [sequencia-tempo-real.puml](./diagramas/sequencia-tempo-real.puml) | Liberação one-touch (LGPD compliant, sem GPS do aluno) e broadcast GPS a bordo |
| Componentes | [componentes-arquitetura.puml](./diagramas/componentes-arquitetura.puml) | PWA, Leaflet, Mapbox API (Free Tier), Service Worker e Firebase |
| Modelo de dados | [modelo-dados-firestore.puml](./diagramas/modelo-dados-firestore.puml) | Coleções NoSQL do Firestore com proteção de dados e telemetria veicular |

### 5.2.3 Justificativa das escolhas tecnológicas

| Tecnologia | Por quê |
|:---|:---|
| React 19 + Vite | Componentização reativa e HMR rápido |
| Tailwind CSS | Tokens de alto contraste para uso veicular |
| Leaflet + Mapbox API | Camada vetorial de alta resolução sob plano gratuito de 50k req/mês (ADR-002) |
| Firebase | Tempo real sem servidor (ADR-003) |
| PWA | Sem lojas, acesso por QR Code (ADR-001) |
| Vitest | Integra-se ao Vite e gera cobertura |

## 5.3 Implementação e Integração

### 5.3.1 Padrões de codificação

- Somente componentes funcionais com hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
- Imutabilidade: sem mutação direta de arrays e objetos.
- `try/catch` em toda operação assíncrona, com estado explícito de desconexão.
- ESLint e Oxlint sem erros; commits semânticos (seção 4.3).

### 5.3.2 Plano de integração entre componentes

| Ordem | Integração | Verificação |
|:---:|:---|:---|
| 1 | Firebase Auth + perfil no Firestore | CT-01, CT-02 |
| 2 | Mapa Leaflet + coleção `bus_location` | CT-04 |
| 3 | Status do aluno + cockpit do motorista (`onSnapshot`) | CT-03, CT-06, CT-07 |
| 4 | Geolocalização + broadcast (motorista/âncora) | CT-05 |
| 5 | Geofencing + FCM | CT-09 |
| 6 | Service Worker + IndexedDB sobre todo o fluxo | CT-10 |

Cada integração entra pela esteira CI/CD (lint, testes, build) antes do deploy.

### 5.3.3 Registro de testes unitários e de integração

| Tipo | Foco | Ferramenta | Casos |
|:---|:---|:---|:---|
| Unitário | Haversine, ETA, utilitários de rota | Vitest | CT-08, CT-09 |
| Unitário / componente | `StatusToggle`, `AuthModal` | Vitest + Testing Library | CT-01, CT-03 |
| Integração | Firestore + regras no emulador | Emulator Suite | CT-03, CT-07 |
| Integração | Fluxo offline e emergência | Manual + emulador | CT-10 |

Meta de cobertura: ≥ 80% (QM-04), medida em cada PR.

### 5.3.4 Rastreabilidade entre código e requisitos

Ver tabela da seção 5.1.2 (requisito → EAP → arquivo → teste).

## 5.4 Verificação, Validação e Transição

### 5.4.1 Plano de verificação e validação

| Atividade | Responsável | Quando |
|:---|:---|:---|
| **Verificação:** lint, testes unitários e de integração no CI | Carlos / Heitor | A cada PR |
| **Verificação:** revisão de código por par | Todos | A cada PR |
| **Validação:** testes de aceitação CT-01 a CT-10 | Carlos | Por release |
| **Validação:** ensaio em campo na GO-217 | Equipe + motorista | Sprint S6 |

### 5.4.2 Critérios de aceitação por stakeholder

| Stakeholder | Critério |
|:---|:---|
| Estudante | Marca "Liberado" com um toque e vê o ônibus em movimento (RF03, RF04). |
| Motorista | Vê contador por faculdade e ouve alerta em < 500 ms (RF06); alarme de emergência em < 1 s (RF10). |
| Gestor municipal | Sem localização individual persistida e descarte ao fim da viagem (RNF05). |

### 5.4.3 Relatório de testes de aceitação

| Código | Requisito | Procedimento | Resultado esperado | Status |
|:---:|:---:|:---|:---|:---:|
| CT-01 | RF01 | Login e recarga da página | Sessão mantida; login < 2 s | Aprovado |
| CT-02 | RF02 | Escolher rota piloto intermunicipal e câmpus UFG Samambaia | Perfil salvo; mapa centraliza o campus | Aprovado |
| CT-03 | RF03, RF07 | Aluno toca "Liberado" em 4G | Cockpit atualiza em < 100 ms | Aprovado |
| CT-04 | RF04 | Deslocamento com GPS a cada 5 s | Marcador anda suavemente | Aprovado |
| CT-05 | RF05 | Passar broadcast ao passageiro âncora | Precisão < 15 m sem interrupção | Aprovado |
| CT-06 | RF06 | Liberação com cockpit ativo | Contador sobe e som toca | Aprovado |
| CT-07 | RF07 | 50 escritas concorrentes | Sem perda; média < 150 ms | Aprovado |
| CT-08 | RF08 | ETA a 5 km | Erro < 2 min | Aprovado |
| CT-09 | RF09 | Aproximação a 1.000 m | Push em < 2 s | Aprovado |
| CT-10 | RF10 | "Fui Esquecido" com perda de 4G | Alarme contínuo; mapa navegável offline | Aprovado |

**Ensaio em campo (GO-217, 16h30–22h45):** 1 motorista e 15 estudantes; 100% das liberações chegaram à cabine, e a persistência IndexedDB evitou travamentos nos trechos sem 4G.

### 5.4.4 Plano de transição e implantação

| Fase | Ação |
|:---:|:---|
| 1 | Publicar versão `v1.0.0` na Vercel (espelho no Firebase Hosting) após os testes passarem. |
| 2 | Piloto controlado na rota intermunicipal piloto com acompanhamento da equipe. |
| 3 | Treinar o motorista (30 min) e distribuir QR Code aos alunos. |
| 4 | Expandir para as demais rotas intermunicipais consorciadas. |
| 5 | Entregar o sistema às prefeituras (*handoff*) conforme o Termo de Cessão (seção 2.2). |

Reversão: reimplantar a tag anterior pela Vercel.

## 5.5 Operação, Manutenção e Descontinuação

### 5.5.1 Procedimentos de operação e monitoramento

| O que monitorar | Como | Alerta |
|:---|:---|:---|
| Disponibilidade (15h00–23h30) | Verificação de URL e console da hospedagem | Falha por mais de 15 min (RTO) |
| Latência de sincronização (QM-01) | Delta de timestamps nos listeners | > 2.000 ms (risco RT-04) |
| Cota do Firebase | Console Firebase | 70% das leituras/escritas |
| Ping do GPS do ônibus | Campo `updatedAt` de `bus_location` | Sem ping por mais de 3 min (risco RT-02) |
| Entrega de push | Log do FCM | Falha repetida (RT-03) |
| Incidentes | Registro e post-mortem sem culpa | Todo incidente em viagem |

### 5.5.2 Plano de manutenção

| Tipo | Escopo | Prazo / frequência |
|:---|:---|:---|
| Corretiva | Bugs e desvios de telemetria | Crítico ≤ 2 h; alto ≤ 24 h |
| Preventiva | `npm audit` e atualização do Firebase SDK | Quinzenal |
| Adaptativa | Mudança no calendário, obras na GO-217, novos navegadores | Sob demanda |
| Evolutiva | Economia de bateria e relatórios municipais | Por backlog |

### 5.5.3 Estratégia de descontinuação e migração de dados

| Fase | Quando | Ação |
|:---:|:---|:---|
| 1 | 90 dias antes | Comunicar secretarias e associações. |
| 2 | 60 dias antes | Exportar logs agregados de frequência em CSV/JSON e entregar aos gestores. |
| 3 | 30 dias antes | Bloquear novos cadastros e exibir aviso no PWA. |
| 4 | Encerramento | Excluir dados pessoais do Firestore, revogar tokens, encerrar serviços e arquivar o repositório (LGPD). |

---

# Capítulo 6 — Avaliação e Melhoria dos Processos de Software

## 6.1 Referencial e recorte

- **Referencial:** ISO/IEC/IEEE 12207:2017, grupos de processos 6.1 a 6.4.
- **Recorte:** avaliamos a **consistência e a rastreabilidade do manual**, pois o produto só é auditável se requisitos, EAP, código e testes se correspondem. Os demais processos foram avaliados apenas quanto à presença de evidência.

## 6.2 Diagnóstico do manual

Avaliação por pares (versão 7.0) e revisão interna desta versão:

| ID | Constatação | Origem | Gravidade |
|:---:|:---|:---|:---:|
| D-01 | `Requisitos.md` (v1.0) e o manual usam numerações diferentes para RF01–RF10 (ex.: RF03 era "gerar viagens"; hoje é "status one-touch"). | Peer review (NC-01) | Alta |
| D-02 | EAP com apenas 2 níveis em alguns pacotes. | Peer review (NC-02) | Média |
| D-03 | Modelo NoSQL não detalhado no manual. | Peer review (NC-03) | Alta |
| D-04 | QM-04 sem meta de cobertura de testes. | Peer review (NC-04) | Média |
| D-05 | Plano de descontinuação sem prazos nem purga LGPD. | Peer review (OM-02) | Média |
| D-06 | O RF09 apontava para a entrega EAP 5.3.1, que não existe. | Revisão v8.0 | Alta |
| D-07 | O texto dizia "quatro coleções" ao listar cinco. | Revisão v8.0 | Baixa |
| D-08 | Datas das etapas divergiam entre `Manual.md` e `historico-versoes.md`. | Revisão v8.0 | Média |
| D-09 | ADR-001 a ADR-004 eram citados, mas não estavam registrados. | Revisão v8.0 | Alta |

## 6.3 Plano de uma melhoria

**Melhoria escolhida:** *garantir rastreabilidade ponta a ponta e eliminar inconsistências do manual*.

| Elemento | Definição |
|:---|:---|
| Objetivo | Todo requisito rastreável a EAP, código e teste, sem referências quebradas. |
| Ações | (1) Declarar este manual como fonte única da numeração RF/RNF; (2) corrigir RF09 → EAP 3.2.2; (3) registrar ADR-001 a ADR-004; (4) alinhar datas ao `historico-versoes.md`; (5) validar o texto contra o código do Rhyme. |
| Responsável | Matheus (A/R), Carlos (verificação) |
| Indicador | 10 de 10 requisitos com EAP, arquivo e teste válidos; 0 referências quebradas. |

## 6.4 Atualização e verificação

| Ação | Atualização feita na v8.0 | Verificação | Resultado |
|:---:|:---|:---|:---:|
| 1 | Manual unificado e numeração RF01–RF10 vigente (5.1.1) | Comparar RF do manual com `Requisitos.md` | Feito |
| 2 | RF09 → EAP 3.2.2 (5.1.2) | Conferir existência da entrega na EAP (4.1) | Feito |
| 3 | ADRs registrados (4.4) | Todo ADR citado existe | Feito |
| 4 | Datas do histórico alinhadas (contracapa) | Comparar com `historico-versoes.md` | Feito |
| 5 | Arquivos de `src/` e status dos testes | Conferir contra o repositório Rhyme | **Pendente** |

## 6.5 Acompanhamento da execução

| Data | Atividade | Responsável | Situação |
|:---:|:---|:---|:---:|
| 29/10 | Publicar v8.0 do manual | Luis | Concluída |
| até 05/11 | Conferir rastreabilidade com o código do Rhyme (ação 5) | Matheus, Carlos | Em andamento |
| até 12/11 | Ensaio da apresentação com cronômetro | Todos | Planejada |
| 26/11 | Apresentação do grupo (G12) | Todos | Planejada |
| Pós-entrega | Reavaliar métricas da seção 4.5 e abrir nova ação, se houver desvio | Carlos | Planejada |

---

**FIM DO MANUAL**
