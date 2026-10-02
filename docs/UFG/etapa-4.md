# Manual de Processos de Software
## Etapa 4: Processos Técnicos — Requisitos, Arquitetura e Plano de Testes (ISO/IEC/IEEE 12207:2017 Seção 6.4)

---

### Identificação do Trabalho e Equipe

* **Instituição:** Universidade Federal de Goiás (UFG) — Instituto de Informática (INF)
* **Disciplina:** INF0449 — Processos de Engenharia de Software (Semestre 2026/2)
* **Nome do Documento:** Manual de Processos de Software — Etapa 4 (Processos Técnicos)
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
| **24/09/2026** | **4.0** | Etapa 3: Processos de Gerenciamento Técnico — EAP, MDA e Risk Register (ISO 12207 §6.3). |
| **08/10/2026** | **5.0** | Realização da **Etapa 4** do manual de processos: incorporação dos **Processos Técnicos** conforme ISO/IEC/IEEE 12207:2017 (§6.4). Contempla a especificação de requisitos funcionais e não funcionais, definição formal da arquitetura do sistema e o Plano de Testes com cenários de validação, critérios de aceite e estratégia de cobertura. |

---

## 5. PARTE 4 — PROCESSOS TÉCNICOS (ISO/IEC/IEEE 12207:2017 §6.4)

> *Referência Normativa:* Esta seção formaliza as atividades de engenharia de software do projeto **Rhyme**, fundamentada na seção 6.4 da norma **ISO/IEC/IEEE 12207:2017** (*Technical Processes*). O objetivo é estabelecer a especificação de requisitos, a arquitetura do sistema e o plano de testes como artefatos auditáveis que guiarão toda a implementação e validação da plataforma.

---

### 5.1 Processo de Definição de Requisitos do Sistema (ISO 12207:2017 §6.4.1)

#### A. Requisitos Funcionais (RF)

Os requisitos abaixo descrevem as ações que o sistema Rhyme deverá executar, priorizados conforme a criticidade operacional:

| ID | Requisito Funcional | Prioridade | Critério de Aceite |
|:---|:---|:---:|:---|
| **RF01** | O sistema deverá permitir o cadastro de alunos com nome, faculdade e rota associada. | Alta | Aluno cadastrado deve aparecer na lista da viagem do motorista ao fazer login. |
| **RF02** | O sistema deverá permitir o cadastro de motoristas com nome e rota associada. | Alta | Motorista deve ter acesso exclusivo ao cockpit após autenticação. |
| **RF03** | O sistema deverá gerar automaticamente uma viagem ativa para cada rota em dias úteis. | Alta | Viagem criada e com status *open* disponível às 15h de cada dia útil. |
| **RF04** | O sistema deverá exibir mapa interativo com pontos de embarque (faculdades) e posição do ônibus. | Alta | Mapa carregado em menos de 2s com marcadores visíveis em dispositivo móvel. |
| **RF05** | O sistema deverá permitir que o aluno alterne seu status entre *"Liberado"* e *"Aguardando"* com um único toque. | Alta | Alteração de status refletida no painel do motorista em menos de 1 segundo (rede 4G). |
| **RF06** | O sistema deverá exibir ao motorista, por faculdade, a contagem de alunos liberados e aguardando. | Alta | Contadores exibidos agrupados por instituição, atualizando-se reativamente. |
| **RF07** | O sistema deverá sincronizar posição do ônibus e status dos alunos em tempo real via Firestore listeners. | Alta | Sincronização funcional com latência medida inferior a 100ms em rede 4G. |
| **RF08** | O sistema deverá permitir que o aluno visualize a posição do ônibus e o tempo estimado de chegada (ETA). | Média | ETA calculado via fórmula de Haversine e exibido em minutos no mapa do aluno. |
| **RF09** | O sistema deverá enviar notificações push ao aluno quando o ônibus entrar no raio de 1 km do seu câmpus. | Média | Notificação entregue em menos de 5 segundos após cruzamento do perímetro de geofencing. |
| **RF10** | O sistema deverá permitir que o motorista inicie e encerre a viagem com botão dedicado. | Média | Encerramento da viagem arquiva os registros de presença na coleção *trips/histórico*. |
| **RF11** | O sistema deverá disponibilizar botão de emergência *"Fui Esquecido"* para o aluno acionar. | Alta | Acionamento dispara alarme sonoro audível e destaque visual vermelho no cockpit do motorista em até 3 segundos. |
| **RF12** | O sistema deverá manter o mapa operacional durante perda temporária de sinal de dados. | Alta | Último estado do mapa e lista de presença permanecem visíveis offline por pelo menos 15 minutos. |

#### B. Requisitos Não Funcionais (RNF)

| ID | Requisito Não Funcional | Categoria | Métrica de Aceitação |
|:---|:---|:---|:---|
| **RNF01** | Desempenho: A aplicação deverá carregar em menos de 2 segundos na abertura inicial. | Performance | FCP < 1,8s e TTI < 2,5s em auditoria Lighthouse Mobile (rede 4G simulada). |
| **RNF02** | Concorrência: O sistema deverá suportar 80 usuários simultâneos sem degradação de latência. | Escalabilidade | Teste de carga simulado com Firebase Emulator Suite sem ultrapassar 1s de latência. |
| **RNF03** | Segurança: Somente usuários autenticados terão acesso aos dados da viagem. | Segurança | Regras do Firestore impedem leitura/escrita sem token JWT válido. Verificado por testes de penetração simples. |
| **RNF04** | Usabilidade: Interface veicular do motorista operável com 1 toque, fontes ≥ 24px. | Usabilidade | Teste de usabilidade com motorista real — 100% das ações executadas sem auxílio em menos de 10 segundos. |
| **RNF05** | Disponibilidade: 99,9% de uptime no horário crítico (15h00 – 23h30 em dias úteis). | Disponibilidade | Monitoramento via Firebase Console e alertas automáticos de indisponibilidade. |
| **RNF06** | Portabilidade: Funcionar como PWA em Chrome Mobile (Android ≥ 10) e Safari (iOS ≥ 15). | Portabilidade | Testes de compatibilidade em dispositivos físicos de ambas as plataformas durante Sprint S5. |
| **RNF07** | Privacidade: Nenhuma localização do estudante deverá ser persistida no banco de dados. | Conformidade (LGPD) | Auditoria de esquema do Firestore: coleção *attendance* não deve conter campos de coordenadas geográficas de alunos. |
| **RNF08** | Custo: Infraestrutura deverá operar dentro do plano gratuito do Firebase Spark Tier. | Econômico | Monitoramento mensal no console Firebase: leituras < 50.000/dia e gravações < 20.000/dia. |

---

### 5.2 Processo de Definição da Arquitetura do Sistema (ISO 12207:2017 §6.4.3)

#### A. Visão Geral da Arquitetura

O Rhyme adota uma **arquitetura cliente-servidor sem estado (*stateless*) orientada a eventos**, onde toda a sincronização é mediada pelo banco de dados reativo do Firebase (Firestore). Não há servidor de aplicação dedicado: a lógica de negócio é executada por funções *serverless* acionadas por eventos de banco de dados.

`
[Aluno / Motorista]
  │
  │  PWA (React + Vite + Service Worker)
  │  Leaflet + OpenStreetMap
  │
  ▼
[Firebase Auth]  ──►  [Cloud Firestore (Realtime DB)]
                              │
                         (on-write trigger)
                              │
                              ▼
                    [Cloud Functions v2]
                              │
                         ┌────┴────┐
                         ▼         ▼
                    [FCM Push]   [Geofencing Logic]
                         │
                    [Dispositivos dos Alunos]
`

#### B. Modelo de Dados — Coleções do Firestore

**Coleção: users**
`
{
  uid: string,           // UID do Firebase Auth
  name: string,
  role: "student" | "driver",
  faculty: string,       // ex: "UFG Samambaia" (somente alunos)
  route: "crominia" | "professor_jamil",
  fcmToken: string       // Token para push (somente alunos)
}
`

**Coleção: 	rips**
`
{
  id: string,
  route: string,
  date: timestamp,
  departureTime: string,
  status: "open" | "in_progress" | "finished",
  driverLocation: { lat: number, lng: number, updatedAt: timestamp }
}
`

**Coleção: ttendance**
`
{
  id: string,
  tripId: string,
  studentId: string,
  status: "liberado" | "aguardando" | "ausente",
  updatedAt: timestamp
}
`

**Coleção: emergencies**
`
{
  id: string,
  tripId: string,
  studentId: string,
  studentName: string,
  faculty: string,
  createdAt: timestamp,
  resolved: boolean
}
`

#### C. Fluxo de Dados — Status do Aluno (Sequência Simplificada)

1. **Aluno** toca o botão "Liberado" na PWA.
2. O cliente React atualiza o documento em ttendance/{id} no Firestore via chamada assíncrona.
3. O **Firestore real-time listener** ativo no cockpit do motorista recebe a atualização (< 100ms em 4G).
4. A interface do motorista re-renderiza o contador da faculdade correspondente sem recarregar a página.
5. A **Cloud Function** onAttendanceUpdate verifica se o aluno está dentro do raio de geofencing e, se positivo, enfileira uma notificação push via FCM.

#### D. Estratégia Offline-First

O Rhyme implementa tolerância a falhas de rede em duas camadas:

1. **Firestore Offline Persistence:** O SDK do Firestore mantém um cache local de todos os documentos lidos recentemente. Durante a perda de sinal, as escritas são enfileiradas localmente e sincronizadas automaticamente ao reconectar.
2. **Service Worker (Workbox):** Cache de assets estáticos da PWA (HTML, JS, CSS, ícones e tiles de mapa mais frequentes) garante que a interface continue operacional sem rede, exibindo o último estado conhecido do mapa.

---

### 5.3 Plano de Testes (ISO 12207:2017 §6.4.8 — Processo de Verificação e Validação)

#### A. Estratégia Geral de Testes

O Rhyme adotará uma **pirâmide de testes** composta por três camadas:

1. **Testes Unitários (Base):** Funções críticas isoladas — cálculo de Haversine (ETA/geofencing), formatação de dados de presença e regras de negócio do Firestore.
2. **Testes de Integração (Meio):** Fluxos ponta-a-ponta simulados com o Firebase Emulator Suite, verificando a reatividade do listener do motorista e o disparo de Cloud Functions.
3. **Testes de Campo / Aceitação (Topo):** Validação em dispositivos físicos durante viagens reais na rota Cromínia ↔ Goiânia.

#### B. Casos de Teste Planejados

**CT-01: Sincronização de Status em Tempo Real**
- **Pré-condição:** Aluno e motorista autenticados; viagem ativa com status *in_progress*.
- **Procedimento:** Aluno toca botão "Liberado" no dispositivo A.
- **Resultado Esperado:** Contador da faculdade do aluno no painel do motorista (dispositivo B) incrementa em menos de 1 segundo.
- **Critério de Falha:** Atualização não ocorre em 5 segundos ou requer recarregar a página.

**CT-02: Operação Offline — Perda de Sinal**
- **Pré-condição:** Dispositivo do motorista com mapa e lista de presença carregados.
- **Procedimento:** Desabilitar dados móveis no dispositivo do motorista por 5 minutos.
- **Resultado Esperado:** Mapa permanece visível com última posição conhecida. Interface não trava nem exibe tela em branco.
- **Critério de Falha:** Tela em branco ou perda total da interface após desconexão.

**CT-03: Protocolo de Emergência "Fui Esquecido"**
- **Pré-condição:** Viagem ativa; aluno autenticado com status "aguardando".
- **Procedimento:** Aluno aciona o botão de emergência na PWA.
- **Resultado Esperado:** Em até 3 segundos, o cockpit do motorista exibe alerta vermelho piscante com nome e faculdade do aluno e emite alerta sonoro.
- **Critério de Falha:** Alerta não aparece em 10 segundos ou não há som audível.

**CT-04: Notificação Push de Geofencing**
- **Pré-condição:** Aluno com push habilitado; ônibus a 5 km do câmpus do aluno.
- **Procedimento:** Simular coordenadas do ônibus cruzando o perímetro de 1 km via Cloud Function de teste.
- **Resultado Esperado:** Notificação push entregue no dispositivo do aluno em menos de 5 segundos após cruzamento do perímetro.
- **Critério de Falha:** Notificação não entregue ou entregue após o ônibus já ter partido do câmpus.

**CT-05: Compatibilidade Cross-Platform**
- **Pré-condição:** Dispositivos físicos Android (Chrome) e iOS (Safari) disponíveis.
- **Procedimento:** Acessar a PWA via link nos dois dispositivos e executar o fluxo de status do aluno.
- **Resultado Esperado:** Interface renderizada corretamente e status atualizado em ambas as plataformas.
- **Critério de Falha:** Falha de renderização, elementos sobrepostos ou funcionalidade bloqueada em qualquer plataforma.

**CT-06: Segurança — Acesso Não Autenticado**
- **Pré-condição:** Tentativa de acesso à aplicação sem estar logado.
- **Procedimento:** Acessar diretamente a URL do cockpit do motorista sem autenticação.
- **Resultado Esperado:** Redirecionamento automático para a tela de login. Nenhum dado da viagem exposto.
- **Critério de Falha:** Dados de viagem visíveis sem autenticação.

#### C. Métricas de Cobertura de Testes

| Camada | Meta de Cobertura | Ferramenta |
|:---|:---:|:---|
| Testes Unitários (funções críticas) | ≥ 70% de cobertura de linhas | Vitest + Coverage |
| Testes de Integração (Firestore) | Todos os fluxos RF01–RF12 cobertos | Firebase Emulator Suite |
| Testes de Campo (aceitação) | 100% dos critérios de aceite dos RFs de alta prioridade | Validação manual em campo |

#### D. Rastreabilidade Requisito × Teste

| Requisito | Caso de Teste Associado | Sprint de Validação |
|:---|:---|:---:|
| RF05, RF06, RF07 | CT-01 | S3, S4 |
| RF12 | CT-02 | S5 |
| RF11 | CT-03 | S4 |
| RF09 | CT-04 | S6 |
| RNF06 | CT-05 | S5 |
| RNF03 | CT-06 | S3 |

---

*Documento elaborado pelo Grupo 12 como entrega da Etapa 4 da disciplina INF0449 - Processos de Engenharia de Software - UFG 2026/2.*
