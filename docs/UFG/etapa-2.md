# Manual de Processos de Software
## Etapa 2: Processos Organizacionais Habilitadores (ISO/IEC/IEEE 12207:2017 Seção 6.2)

---

### Identificação do Trabalho e Equipe

* **Instituição:** Universidade Federal de Goiás (UFG) — Instituto de Informática (INF)  
* **Disciplina:** INF0449 — Processos de Engenharia de Software (Semestre 2026/2)  
* **Nome do Documento:** Manual de Processos de Software — Etapa 2 (Processos Organizacionais Habilitadores)  
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
| **10/09/2026** | **1.0** | Etapa 0: Apresentação do software Rhyme (problema, público-alvo, escopo, funcionalidades, restrições e premissas). |
| **12/09/2026** | **2.0** | Etapa 1: Processos de Acordo (ISO/IEC/IEEE 12207:2017 §6.1), matriz de aquisição e fornecimento, SLA e POPs. |
| **17/09/2026** | **3.0** | Realização da **Etapa 2** do manual de processos pela equipe: consolidação dos **Processos Organizacionais Habilitadores** segundo a ISO/IEC/IEEE 12207:2017 (§6.2). Contempla o modelo de ciclo de vida Iterativo-Incremental, inventário completo de ferramentas e infraestrutura, justificativa estratégica e viabilidade, plano de competências e capacitação da equipe com matriz RACI, plano de qualidade com métricas objetivas (QM-01 a QM-04) e estratégia de gestão do conhecimento. |

---

## 3. PARTE 2 — PROCESSOS ORGANIZACIONAIS HABILITADORES (ISO/IEC/IEEE 12207:2017 §6.2)

> *Referência Normativa:* Esta seção estrutura as capacidades organizacionais, técnicas e metodológicas da equipe **Grupo 12**, fundamentada na seção 6.2 da norma **ISO/IEC/IEEE 12207:2017** (*Organizational Project-Enabling Processes*). Os processos aqui descritos fornecem sustentabilidade, previsibilidade e rigor de engenharia para o ciclo de desenvolvimento continuado do **Rhyme**.

---

### 3.1 Processo de Gestão do Modelo de Ciclo de Vida (ISO 12207:2017 §6.2.1)

#### A. Modelo de Ciclo de Vida Adotado
A equipe adotou formalmente o modelo **Iterativo e Incremental**, operacionalizado através de práticas ágeis com cadência de sprints quinzenais (*Scrum/Kanban híbrido*).

```
[Visão / Requisitos] ──► [Sprint N: Incremento] ──► [Validação com Motoristas/Alunos] ──► [Próximo Incremento]
         ▲                                                                                          │
         └──────────────────────────────── Feedback de Campo ───────────────────────────────────────┘
```

#### B. Justificativa da Escolha do Modelo para o Rhyme
1. **Alinhamento com as Entregas Incrementais da Disciplina INF0449:** O cronograma acadêmico exige a entrega progressiva de artefatos (Etapa 0: Definição; Etapa 1: Acordos; Etapa 2: Processos Organizacionais; Etapas Seguintes: Engenharia Técnica). O modelo iterativo permite construir sobre bases validadas sem retrabalho cascata.
2. **Ambiente Operacional Altamente Empírico:** O comportamento da geolocalização e da recepção 4G ao longo da rodovia estadual GO-217 e nas áreas internas dos câmpus de Goiânia apresenta particularidades que não podem ser previstas exclusivamente em sala de aula. Cada ciclo quinzenal entrega uma funcionalidade testável em campo real com motoristas e passageiros de Cromínia e Professor Jamil.
3. **Mitigação Antecipada de Riscos Tecnológicos:** A integração entre Leaflet, Progressive Web App e sincronização via WebSockets no Firestore é validada por incrementos menores (ex.: primeiro a renderização estática de mapa, depois a telemetria, em seguida o geofencing), garantindo estabilidade antes de expandir o escopo.
4. **Custo de Mudança Controlado:** Ajustes nas rotas das faculdades ou nos horários das aulas dos estudantes são facilmente absorvidos no planejamento da iteração seguinte, sem comprometer a arquitetura base.

---

### 3.2 Processo de Gestão de Infraestrutura e Ferramentas (ISO 12207:2017 §6.2.2)

O inventário abaixo cataloga todos os ativos físicos e lógicos homologados para o desenvolvimento, teste e sustentação do Rhyme:

#### A. Inventário de Hardware
* **Dispositivos Veiculares (Motoristas):** Smartphones Android (versão 10+) e iOS (versão 15+) com GPS integrado de alta precisão (A-GPS / GLONASS) acoplados a suportes veiculares com alimentação elétrica contínua via acendedor 12V do ônibus.
* **Dispositivos de Passageiros (Estudantes):** Smartphones heterogêneos de uso pessoal com navegadores modernos (Chrome Mobile, Safari, Firefox Mobile, Samsung Internet).
* **Estações de Trabalho de Engenharia:** Notebooks e desktops da equipe de desenvolvimento rodando Linux e Windows 11 com Node.js e emuladores locais.

#### B. Inventário de Software, Plataformas e Ferramentas

| Categoria | Ferramenta / Tecnologia | Versão Homologada | Finalidade no Projeto |
|:---|:---|:---:|:---|
| **Linguagem & Runtime** | Node.js & ECMAScript | 20 LTS / ES2024 | Execução do ferramental e scripts de compilação. |
| **Framework Frontend** | React | 19.x | Construção de componentes reativos e interfaces de alta performance. |
| **Build Tool & Bundler** | Vite | 8.x | Servidor de desenvolvimento ultrarrápido e empacotador de produção. |
| **Estilização & Design** | Tailwind CSS & PostCSS | 4.x | Design system, layout adaptativo e alto contraste para visualização solar. |
| **Motor Cartográfico** | Leaflet & React-Leaflet | 1.9 / 5.x | Renderização vetorial e nós de paradas com baixo consumo de memória. |
| **Tiles de Mapa** | OpenStreetMap & CartoDB | CDN Pública | Base de mapas abertos e sem limites proprietários de faturamento. |
| **Banco de Dados Realtime** | Google Cloud Firestore | NoSQL Realtime | Persistência de telemetria, presença e documentos de viagem. |
| **Ambiente de Testes Local** | Firebase Emulator Suite | 13.x | Simulação offline de regras de banco e Cloud Functions sem custo de nuvem. |
| **Qualidade & Linters** | Oxlint & ESLint | Última estável | Análise estática ultrarrápida de código em Rust para prevenção de bugs. |
| **Controle de Versão** | Git & GitHub | 2.4x / GitHub Cloud | Gestão de branches, rastreabilidade de commits e histórico do código. |
| **Esteira de CI/CD** | GitHub Actions | Workflows v4 | Execução automatizada de linters, testes de build e deploy contínuo. |
| **Hospedagem de Produção** | Vercel & Firebase Hosting | Edge CDN | Distribuição global com provisionamento automático de SSL/TLS (HTTPS). |
| **Comunicação & Gestão** | GitHub Projects & Discord | Cloud | Quadro Kanban de atividades, reuniões de alinhamento e retrospectivas. |

---

### 3.3 Processo de Gestão de Portfólio / Viabilidade Estratégica (ISO 12207:2017 §6.2.3)

O projeto Rhyme possui justificativa e viabilidade comprovadas sob quatro dimensões complementares:

#### 1. Viabilidade Técnica
* A solução utiliza tecnologias maduras da Web Moderna (Progressive Web Apps e Web APIs nativas como *Geolocation API*, *IndexedDB* e *Notifications API*), dispensando dependências de módulos nativos pesados.
* A persistência offline do Firestore e o cache de rotas em Service Worker garantem que a aplicação não trave mesmo quando o veículo percorre sombras de cobertura celular na rodovia GO-217.

#### 2. Viabilidade Financeira e Econômica
* **Custo Fixo de Infraestrutura: R$ 0,00 (Zero Reais).**
* Para o volume das 2 rotas piloto (cerca de 60 a 80 alunos somados e 4 viagens diárias), o número de leituras e gravações no Firestore fica em torno de 2.000 a 3.000 operações diárias — muito abaixo do limite gratuito do *Firebase Spark Tier* (50.000 leituras e 20.000 gravações diárias gratuitas).
* A utilização de OpenStreetMap elimina faturas astronômicas de APIs pagas de mapas.

#### 3. Viabilidade Operacional e Humana
* Não há barreiras burocráticas para o aluno: não é necessário baixar aplicativos pesados em lojas nem passar por processos de aprovação. O acesso é imediato via link ou QR Code afixado no ônibus.
* O motorista não precisa digitar: o cockpit exibe apenas contadores consolidados e botões grandes, minimizando a curva de aprendizado para menos de 10 minutos.

#### 4. Justificativa Estratégica e Impacto Social
* **Preservação de Vidas:** Elimina a perigosa distração visual do motorista em alta velocidade na rodovia.
* **Segurança Noturna dos Estudantes:** Evita que jovens fiquem vulneráveis em pontos ermos à noite após as 22h30.
* **Eficiência dos Gastos Públicos:** Reduz o desperdício de combustível municipal ao evitar deslocamentos desnecessários para câmpus vazios.

---

### 3.4 Processo de Gestão de Recursos Humanos, Competências e Plano de Capacitação (ISO 12207:2017 §6.2.4)

A equipe do **Grupo 12** atua em regime colaborativo de engenharia compartilhada, sem cargos fixos hierárquicos, garantindo que todos os integrantes tenham visão ponta a ponta do produto:

#### A. Competências Técnicas dos Integrantes
* **Matheus Marquez de Carvalho Rodrigues:**
  * *Competências Atuais:* Levantamento e modelagem de requisitos, comunicação estruturada com stakeholders, priorização de necessidades operacionais e análise de conformidade de processos.
  * *Plano de Capacitação:* Aprofundamento nas cláusulas da ISO/IEC/IEEE 12207:2017, técnicas avançadas de elicitação de requisitos com motoristas de transporte público e métricas de satisfação discente.
* **Luis Henrique Oliveira de Jesus:**
  * *Competências Atuais:* Arquitetura frontend com React e Vite, instrumentação de mapas Leaflet, manipulação de dados geoespaciais e sincronização reativa com Firestore.
  * *Plano de Capacitação:* Técnicas avançadas de Progressive Web App (PWA) em modo *offline-first*, otimização de renderização de nós geográficos e Web Vitals no mobile.
* **Heitor Gonçalves Costa:**
  * *Competências Atuais:* Infraestrutura e nuvem, esteiras de automação de integração contínua (CI/CD com GitHub Actions), deploy em Edge Networks e segurança no Firebase.
  * *Plano de Capacitação:* Firebase Emulator Suite para simulação de cargas concorrentes, auditoria de regras de segurança no Firestore e observabilidade de latência.
* **Carlos Daniel Lopes de Araújo:**
  * *Competências Atuais:* Garantia da qualidade de software, planejamento de cenários de teste operacionais, validação funcional de campo em trânsito rodoviário e documentação técnica.
  * *Plano de Capacitação:* Metodologias de testes de campo em tempo real, calibração de GPS em movimento veicular, métricas de SLA e auditoria de conformidade de software.

#### B. Matriz de Responsabilidades (RACI)
A matriz abaixo distribui as responsabilidades operacionais entre as áreas de atuação do squad para as atividades centrais do ciclo de engenharia:
*(R = Responsável pela Execução, A = Aprovador/Autoridade, C = Consultado, I = Informado)*

| Atividade do Ciclo de Engenharia | Requisitos & Produto | Arquitetura & Nuvem | Desenvolvimento Frontend | Qualidade & Campo |
|:---|:---:|:---:|:---:|:---:|
| **1. Elicitação e Refinamento do Backlog** | **A / R** | C | C | C |
| **2. Modelagem do Banco NoSQL e Regras** | C | **A / R** | R | C |
| **3. Interface PWA, UI e Mapas Leaflet** | I | C | **A / R** | C |
| **4. Implementação de Geofencing e Push** | C | R | R | **A** |
| **5. Testes de Campo Rodoviário na GO-217** | C | I | C | **A / R** |
| **6. Homologação de Deploy e Release** | I | **A / R** | R | C |
| **7. Resposta a Incidentes de Rota / Falha GPS** | C | R | I | **A / R** |

---

### 3.5 Processo de Gestão da Qualidade (ISO 12207:2017 §6.2.5)

Para garantir que o produto opere com excelência técnica e consistência operacional, a equipe estabeleceu quatro métricas objetivas de qualidade, acompanhadas de seus métodos de medição e ações corretivas:

#### QM-01: Latência de Sincronização em Tempo Real
* **Definição:** Tempo decorrido entre a alteração de status pelo aluno (ou nova coordenada GPS do ônibus) e a sua atualização visual no painel do motorista.
* **Métrica / Alvo:** **Latência < 100 ms** em redes móveis 4G/5G; tolerância de até 1.000 ms em conexões 3G.
* **Forma de Medição:** Timestamp de emissão gravado no documento do Firestore confrontado com o timestamp de recepção no cliente via listener reativo.
* **Ação Corretiva:** Otimização dos payloads de dados, remoção de campos desnecessários no snapshot e priorização de conexões WebSocket persistentes.

#### QM-02: Taxa de Sucesso e Precisão de Geofencing
* **Definição:** Percentual de notificações push de aproximação entregues com sucesso aos estudantes antes da chegada física do ônibus ao ponto de parada.
* **Métrica / Alvo:** **Taxa de Sucesso > 98%** dos eventos de aproximação disparados dentro do raio calibrado de 1.000 metros.
* **Forma de Medição:** Cruzamento entre os registros de notificação da Cloud Function (`notifiedStudents`) e os registros de embarque efetivo do aluno.
* **Ação Corretiva:** Reajuste dinâmico da fórmula de Haversine e calibração do raio de ativação para 1.500 metros em rodovias com velocidade média superior a 80 km/h.

#### QM-03: Desempenho e Carregamento Mobile (Web Vitals)
* **Definição:** Velocidade de inicialização da Progressive Web App em aparelhos de entrada e redes intermediárias.
* **Métrica / Alvo:** **First Contentful Paint (FCP) < 1,8 segundos** e **Time to Interactive (TTI) < 2,5 segundos** em auditoria de Lighthouse Mobile.
* **Forma de Medição:** Relatórios automatizados do Google Lighthouse acionados via GitHub Actions e Chrome DevTools.
* **Ação Corretiva:** *Code-splitting* de rotas com `React.lazy()`, compressão gzip/brotli de assets estáticos e pré-carregamento dos tiles de mapa mais frequentes.

#### QM-04: Cobertura e Confiabilidade de Rotas Críticas
* **Definição:** Garantia de que 100% dos pontos de embarque universitários e nós de paradas rodoviárias cadastrados estejam acessíveis e georreferenciados sem erros cartográficos.
* **Métrica / Alvo:** **100% de conformidade** nas rotas ativas de Cromínia e Professor Jamil.
* **Forma de Medição:** Checklist de homologação antes de cada viagem diária via painel administrativo.
* **Ação Corretiva:** Atualização imediata de coordenadas e rotas alternativas registradas em caso de obras na rodovia.

---

### 3.6 Processo de Gestão do Conhecimento (ISO 12207:2017 §6.2.6)

Para evitar silos de informação e assegurar a perenidade do aprendizado técnico acumulado pela equipe, foram instituídas as seguintes práticas de gestão do conhecimento:

1. **Documentação Viva Versionada no Repositório:**
   * Todos os manuais, requisitos, atividades da disciplina e guias de processos são mantidos em arquivos Markdown (`docs/`) versionados juntamente com o código-fonte no GitHub, sob controle estrito de histórico.
2. **Registros de Decisão de Arquitetura (ADRs - *Architecture Decision Records*):**
   * Decisões estruturantes (como a escolha de PWA sobre app nativo, adoção do Leaflet em vez de Google Maps, e uso de Firestore serverless) são formalizadas em documentos concisos registrando contexto, alternativas avaliadas, justificativa e consequências.
3. **Post-Mortems de Incidentes Operacionais:**
   * Qualquer falha que ocorra durante uma viagem (ex.: travamento de GPS, atraso de notificação ou perda temporária de dados) gera um relatório *blameless* (sem culpabilização de indivíduos), focado na causa raiz técnica e na definição de melhorias preventivas imediatas.
4. **Padronização de Código e Revisão Compartilhada:**
   * O código segue padrões estritos de nomenclatura, linters automáticos e convenções de commit, permitindo que qualquer integrante da equipe assuma a manutenção de qualquer parte do sistema sem atrito cognitivo.

---

*Documento elaborado pelo Grupo 12 (Squad Rhyme Core) como entrega da Etapa 2 da disciplina INF0449 - Processos de Engenharia de Software - UFG 2026/2.*
