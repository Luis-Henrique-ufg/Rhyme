# Manual de Processos de Software
## Etapa 4: Processos Técnicos - Requisitos, Arquitetura, ADRs e Plano de Testes (ISO/IEC/IEEE 12207:2017 Seção 6.4)

---

### Identificação do Trabalho e Equipe

* **Instituição:** Universidade Federal de Goiás (UFG) - Instituto de Informática (INF)
* **Disciplina:** INF0449 - Processos de Engenharia de Software (Semestre 2026/2)
* **Nome do Documento:** Manual de Processos de Software - Etapa 4 (Processos Técnicos)
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
| **24/09/2026** | **4.0** | Etapa 3: Processos de Gerenciamento Técnico - EAP, MDA e Risk Register (ISO 12207 §6.3). |
| **08/10/2026** | **5.0** | Atualização da **Etapa 4** do manual de processos: incorporação dos **Processos Técnicos** conforme ISO/IEC/IEEE 12207:2017 (§6.4) atendendo às orientações da Aula de 07/10. Contempla Stakeholders, Requisitos Elicitados, Rastreabilidade, ADRs, Diagramas UML em PlantUML e Plano de V&V. |

---

## 5. PARTE 4 - PROCESSOS TÉCNICOS (ISO/IEC/IEEE 12207:2017 §6.4)

> *Referência Normativa:* Esta seção formaliza as atividades de engenharia de software do projeto **Rhyme**, fundamentada na seção 6.4 da norma **ISO/IEC/IEEE 12207:2017** (*Technical Processes*). O objetivo é estabelecer a especificação de requisitos, a arquitetura do sistema, os Registros de Decisões Arquiteturais (ADRs), os diagramas UML e o plano de testes como artefatos auditáveis que guiam a implementação e validação da plataforma.

---

### 5.1 Processo de Definição de Requisitos do Sistema (ISO 12207:2017 §6.4.1)

#### A. Stakeholders e Necessidades Elicitadas

| Stakeholder | Papel no Sistema | Necessidades Elicitadas / Pontos de Dor |
|:---|:---|:---|
| **Estudante Universitário** | Usuário final do transporte intermunicipal (Cromínia/Prof. Jamil <-> UFG) | • Eliminar incerteza do horário de chegada do ônibus.<br>• Notificar término da aula ("Liberado") sem sobrecarregar grupo de WhatsApp.<br>• Visualizar posição do veículo e de outros alunos por campus. |
| **Motorista do Transporte** | Condutor responsável pela rota | • Reduzir distrações e checagem manual de mensagens durante a condução.<br>• Visualizar mapa térmico/marcadores dos alunos liberados por faculdade.<br>• Receber alertas imediatos de imprevistos e emergências. |
| **Gestão do Transporte Municipal** | Administração responsável pela frota | • Garantir eficiência de combustível e rotas inteligentes.<br>• Contabilizar demanda diária e frequência de embarques. |

#### B. Requisitos Funcionais (RF)

| ID | Nome do Requisito | Descrição | Prioridade | Critério de Aceitação |
|:---|:---|:---|:---:|:---|
| **RF01** | Autenticação no PWA | O sistema deve permitir autenticação via Firebase Auth (Email/Senha e Google). | Alta | Login realizado em < 2s; sessão persistida. |
| **RF02** | Seleção de Rota e Perfil | O estudante deve selecionar sua rota (Cromínia ou Prof. Jamil) e faculdade/campus UFG. | Alta | Opções salvas no perfil e refletidas na interface do mapa. |
| **RF03** | Atualização de Status de Liberação | O aluno deve poder alterar seu status para "Em sala", "Liberado da aula" ou "No ponto". | Alta | Status sincronizado com Firestore em < 500ms. |
| **RF04** | Rastreamento em Tempo Real | O motorista e os alunos devem visualizar a localização em tempo real do ônibus no mapa. | Alta | Posição no mapa Leaflet atualizada a cada 5s. |
| **RF05** | Broadcast de GPS a Bordo | Estudantes a bordo do ônibus podem transmitir o GPS do veículo para a rede de alunos. | Média | Alternância manual de modo broadcast ativada/desativada com indicador visual. |
| **RF06** | Painel do Motorista | O cockpit do motorista deve exibir marcadores coloridos agrupados por campus da UFG. | Alta | Contadores por faculdade atualizados em tempo real conforme alteração de status. |

#### C. Requisitos Não Funcionais (RNF) e Restrições

| ID | Categoria | Descrição | Métrica / Restrição |
|:---|:---|:---|:---|
| **RNF01** | Desempenho | O PWA deve carregar em menos de 2 segundos sob conexão 3G/4G móvel. | LCP < 2.0s no Google Lighthouse. |
| **RNF02** | Disponibilidade | Sincronização em tempo real deve ter disponibilidade de 99.5%. | Firestore Realtime Listeners ativos. |
| **RNF03** | Compatibilidade | Deve funcionar como PWA instalável no Android (Chrome) e iOS (Safari). | Manifesto PWA válido e Service Worker ativo. |
| **RNF04** | Usabilidade | Interface otimizada para uso com uma mão em dispositivos móveis. | Botões com área de toque >= 48px. |
| **REST01**| Restrição Orçamentária | O sistema deve operar dentro do Spark Tier gratuito do Firebase. | Quota mensal < 50.000 leituras/dia. |

---

### 5.2 Processo de Definição da Arquitetura do Sistema (ISO 12207:2017 §6.4.3)

#### A. Visão Geral da Arquitetura

O Rhyme adota uma **arquitetura PWA cliente-servidor orientada a eventos**, utilizando reatividade do Firebase Firestore para sincronização sem necessidade de servidores dedicados de backend.

```
[Estudante / Motorista]
       │
       ▼  PWA (React 19 + Vite + Service Worker)
       │  Leaflet Engine + OpenStreetMap
       ├─────────────────────────┐
       ▼                         ▼
[Firebase Auth]       [Cloud Firestore Realtime DB]
```

#### B. Registro de Decisões Arquiteturais (ADRs - Architecture Decision Records)

* **ADR-001: Adoção da Arquitetura Progressive Web App (PWA)**
  - **Contexto:** Necessidade de aplicação multiplataforma (iOS/Android) sem custo de publicação nas lojas App Store / Play Store.
  - **Decisão:** Desenvolver a solução como React 19 Single Page Application configurada como PWA instalável via Service Worker.
  - **Consequência:** Baixo custo de distribuição, suporte offline e atualização instantânea sem aprovação de lojas.

* **ADR-002: Sincronização Reativa em Tempo Real via Firebase Cloud Firestore**
  - **Contexto:** Necessidade de notificar o motorista instantaneamente quando um aluno muda seu status ("Liberado").
  - **Decisão:** Utilizar WebSockets e Realtime Listeners (`onSnapshot`) nativos do Cloud Firestore.
  - **Consequência:** Latência < 100ms em rede móvel sem necessidade de gerenciar servidor Socket.io próprio.

* **ADR-003: Escolha da Biblioteca de Mapas (Leaflet + OpenStreetMap)**
  - **Contexto:** Escolha entre Google Maps API (paga por cota) vs. Leaflet / OpenStreetMap (código aberto).
  - **Decisão:** Adotar Leaflet.js alimentado por tiles gratuitas do OpenStreetMap.
  - **Consequência:** Custo zero de mapeamento, facilidade de estilização de marcadores e menor consumo de recursos.

* **ADR-004: Modelo Híbrido de Broadcast de GPS (Colaborativo)**
  - **Contexto:** Nem todos os ônibus escolares possuem rastreador GPS veicular dedicado instalado.
  - **Decisão:** Permitir que o aplicativo do motorista ou de estudantes a bordo transmitam as coordenadas GPS em movimento para os demais passageiros.
  - **Consequência:** Cobertura de rastreamento com custo zero de hardware veicular extra.

#### C. Diagramas de Design UML (PlantUML)

Os diagramas formais de design do sistema foram desenvolvidos em PlantUML e estão disponíveis no arquivo de governança [`diagrama.plantuml`](./diagrama.plantuml):

1. **Diagrama de Casos de Uso (`Diagrama_Casos_de_Uso_Rhyme`):** Especifica os atores (Estudante, Motorista, GPS e Firestore) e os 10 casos de uso centrais.
2. **Diagrama de Sequência (`Diagrama_Sequencia_Rhyme`):** Modela o fluxo de liberação do aluno e a propagação instantânea via WebSocket para o mapa do motorista.
3. **Diagrama de Componentes (`Diagrama_Componentes_Rhyme`):** Mapeia os módulos React, controlador Geolocation, Service Worker e serviços Firebase.

---

### 5.3 Plano de Testes e Rastreabilidade (ISO 12207:2017 §6.4.8)

#### A. Casos de Teste Planejados (V&V)

| Código | Requisito | Descrição do Teste | Resultado Esperado | Status |
|:---|:---:|:---|:---|:---:|
| **CT-01** | RF03, RF06 | Sincronização de Status em Tempo Real | Painel do motorista atualiza contador em < 1s após aluno clicar "Liberado". | Aprovado |
| **CT-02** | RF05 | Broadcast de GPS a Bordo | Posição do ônibus move-se suavemente no mapa dos passageiros a cada 5s. | Aprovado |
| **CT-03** | RNF01, RNF03 | Funcionamento PWA e Cache Offline | Aplicativo carrega mapa em cache e mantém usabilidade sem sinal móvel. | Aprovado |
| **CT-04** | RNF04 | Usabilidade em Telas Touch | Botões com resposta tátil e área acessível em telas mobile de 5" a 6.7". | Aprovado |

#### B. Matriz de Rastreabilidade (Requisito x Código x Teste)

| Requisito | Módulo / Componente React | Caso de Teste | Status de Implementação |
|:---|:---|:---:|:---:|
| **RF01** | `src/components/AuthModal.jsx` | CT-06 | Concluído |
| **RF02** | `src/components/ProfileSetup.jsx` | CT-05 | Concluído |
| **RF03** | `src/components/StatusToggle.jsx` | CT-01 | Concluído |
| **RF04** | `src/components/MapView.jsx` | CT-01, CT-02 | Concluído |
| **RF05** | `src/components/GpsBroadcaster.jsx` | CT-02 | Concluído |
| **RF06** | `src/components/DriverCockpit.jsx` | CT-01 | Concluído |

---

*Documento mantido pela equipe Grupo 12 conforme orientações da disciplina INF0449 - Processos de Engenharia de Software - Instituto de Informática, Universidade Federal de Goiás (UFG).*
