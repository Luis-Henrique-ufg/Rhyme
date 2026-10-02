# Manual de Processos de Software
## Etapa 1: Processos de Acordo (ISO/IEC/IEEE 12207:2017 Seção 6.1)

---

### Identificação do Trabalho e Equipe

* **Instituição:** Universidade Federal de Goiás (UFG) — Instituto de Informática (INF)  
* **Disciplina:** INF0449 — Processos de Engenharia de Software (Semestre 2026/2)  
* **Nome do Documento:** Manual de Processos de Software — Etapa 1 (Processos de Acordo)  
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
| **10/09/2026** | **1.0** | Versão inicial com a Etapa 0 (Apresentação do software Rhyme). |
| **12/09/2026** | **2.0** | Realização da **Etapa 1** do manual de processos pela equipe: incorporação dos **Processos de Acordo** conforme a norma ISO/IEC/IEEE 12207:2017 (§6.1). Contempla o Processo de Aquisição (insumos e serviços em nuvem), o Processo de Fornecimento (contrato, critérios de aceite e suporte), identificação de fornecedores e parceiros relevantes, formalização de SLA operacional e Procedimentos Operacionais Padronizados (POPs). |

---

## 2. PARTE 1 — PROCESSOS DE ACORDO (ISO/IEC/IEEE 12207:2017 §6.1)

> *Referência Normativa:* Esta seção formaliza os acordos organizacionais e técnicos sob a ótica da norma internacional **ISO/IEC/IEEE 12207:2017**, Seção 6.1 (*Agreement Processes*). O objetivo é estabelecer critérios transparentes, auditáveis e sustentáveis para a aquisição de tecnologias terceirizadas e o fornecimento da plataforma **Rhyme** como serviço de utilidade pública para estudantes e municípios conveniados.

---

### 2.1 Processo de Aquisição (ISO/IEC/IEEE 12207:2017 §6.1.1)

O **Processo de Aquisição** define os mecanismos adotados pelo Grupo 12 para identificar, selecionar, contratar e gerenciar produtos, serviços e insumos tecnológicos de terceiros indispensáveis ao funcionamento do Rhyme.

#### A. Insumos e Serviços Contratados de Terceiros
Para viabilizar uma solução de alta performance sem custos fixos de servidores locais legados, a equipe adota um modelo arquitetural baseado em **PaaS (Platform as a Service)** e **SaaS (Software as a Service)** com camadas gratuitas elásticas (*Free Tiers*):

1. **Plataforma Backend em Nuvem (Google Cloud Platform / Firebase):**
   * *O que é adquirido:*
     * **Cloud Firestore:** Banco de dados NoSQL distribuído com replicação geográfica multi-região e sincronização reativa (*real-time listeners* via WebSocket) com latência inferior a 100 ms.
     * **Firebase Authentication:** Serviço gerenciado de gestão de identidades e sessões com suporte a autenticação por e-mail/senha e tokens JWT criptografados.
     * **Cloud Functions v2:** Ambiente de computação *serverless* acionado por eventos em segundo plano (*triggers Firestore onUpdate*) para processamento de geofencing e regras de negócio.
     * **Firebase Cloud Messaging (FCM):** Barramento de notificações push para entrega de avisos de chegada do ônibus nos dispositivos móveis dos alunos.
   * *Modalidade:* Plano *Spark* (Free Tier) do Google Cloud, escalável sob demanda sem custo para o volume do projeto piloto (até 50 mil leituras e 20 mil gravações diárias gratuitas).

2. **Base Cartográfica e Servidor de Tiles (OpenStreetMap Foundation & CartoDB):**
   * *O que é adquirido:*
     * Dados geoespaciais abertos do **OpenStreetMap (OSM)** contendo a malha viária das rodovias (GO-217, BR-153) e logradouros urbanos de Goiânia.
     * Camada de renderização de mapa (*tile layer*) fornecida por servidores CDN públicos rápidos e sem taxa de cobrança abusiva por visualização.
   * *Modalidade:* Open Source / Open Data sob licença ODbL, eliminando as dependências de faturamento caras de APIs proprietárias (como Google Maps Platform).

3. **Plataforma de Distribuição Global e Deploy Contínuo (Vercel Inc.):**
   * *O que é adquirido:*
     * Rede de borda (*Edge CDN Network*) de alta disponibilidade com nós de distribuição no Brasil (São Paulo - GRU1).
     * Pipeline de automação de compilação (*Continuous Deployment*) integrado aos *pull requests* do GitHub.
     * Provisionamento automático e renovação de certificados de segurança criptográfica SSL/TLS (HTTPS).
   * *Modalidade:* Plano *Hobby / Open Source* sem custo para projetos educacionais e de pesquisa.

4. **Bibliotecas e Componentes de Software Livre:**
   * **Leaflet 1.9 & React-Leaflet 5:** Mecanismo leve de controle de mapas vetoriais no navegador móvel.
   * **Tailwind CSS 4 & Iconify:** Sistema de tokens visuais e ícones otimizados para alta legibilidade veicular.

---

### 2.2 Matriz de Fornecedores e Parceiros Relevantes

| Fornecedor / Parceiro | Insumo Fornecido | Papel no Rhyme | Criticidade | Nível de Serviço (SLA Provedor) | Plano de Contingência |
|:---|:---|:---|:---:|:---:|:---|
| **Google Cloud Platform (Firebase)** | Banco NoSQL Firestore, Auth, Functions e Push (FCM) | Núcleo de sincronização de telemetria e presenças em tempo real | **Crítica (Alta)** | 99,95% de uptime contratual | Persistência local no IndexedDB do navegador móvel; sincronização em fila assim que a conexão restabelecer. |
| **OpenStreetMap & CartoDB** | Camadas de mapa, tiles cartográficos e nós de rota | Visualização espacial da trajetória e dos pontos de parada | **Média** | 99,0% de disponibilidade de CDN | Cache local de tiles de mapas em Service Worker para navegação offline nos trajetos rurais. |
| **Vercel Inc.** | Hospedagem da aplicação PWA e automação de build | Distribuição dos arquivos estáticos para os celulares | **Alta** | 99,9% de disponibilidade global | Fallback automatizado de hospedagem espelhada no Firebase Hosting CDN. |
| **Prefeituras Municipais (Cromínia / Prof. Jamil)** | Frotas de vans e ônibus escolares e motoristas conveniados | Parceiros operacionais e usuários do serviço | **Crítica (Alta)** | Conforme calendário acadêmico universitário | Canal direto de atendimento e comunicação com secretarias municipais de transporte. |
| **Associações de Estudantes Universitários** | Mobilização discente e validação de pontos de embarque | Stakeholders finais e validação de requisitos | **Média** | Interação semanal contínua | Representantes discentes responsáveis por coletar feedback nos câmpus. |

---

### 2.3 Processo de Fornecimento (ISO/IEC/IEEE 12207:2017 §6.1.2)

O **Processo de Fornecimento** regula a entrega, implantação, sustentação e assistência técnica da plataforma **Rhyme** para as Prefeituras conveniadas, motoristas e comunidades acadêmicas.

#### A. Modelo Contratual e de Cessão de Uso
* **Natureza do Fornecimento:** O software é disponibilizado sob a modalidade de **Termo de Cessão de Uso Tecnológico e Comodato Público**, sem ônus financeiro aos estudantes e com cessão gratuita para a gestão municipal de frotas escolares.
* **Licença:** Código sob governança acadêmica e licença permissiva com auditoria de segurança garantida pelo Grupo 12.
* **Garantias de Privacidade (LGPD):** O contrato de fornecimento estipula expressamente que:
  * Não há comercialização de dados dos usuários para terceiros.
  * O rastreamento de localização é estritamente vinculado à viagem em curso e descartado ao final de cada dia letivo.

#### B. Critérios Objetivos de Aceite em Homologação
Antes de autorizar a entrada em operação definitiva em uma nova rota municipal, o cliente/parceiro realiza uma bateria de testes de aceitação com base nos seguintes critérios objetivos:

1. **Critério de Aceite 1 (Sincronização Reativa):** A alteração de status de um estudante (*"Liberado"*) deve ser refletida no painel do motorista em menos de 1,0 segundo em conexões 4G estáveis.
2. **Critério de Aceite 2 (Instalação e Acesso PWA):** O aplicativo deve rodar em navegadores Safari (iOS) e Google Chrome (Android) sem exigir a criação de contas em lojas proprietárias pagas.
3. **Critério de Aceite 3 (Operação Offline Tolerante a Falhas):** Ao transitar por trechos da rodovia GO-217 sem sinal celular, o aplicativo deve reter as últimas coordenadas conhecidas e atualizar a fila de presença automaticamente ao reconectar.
4. **Critério de Aceite 4 (Alerta de Emergência Funcional):** O acionamento do botão *"Fui Esquecido"* deve disparar alarme sonoro audível na cabine do motorista e destaque visual em vermelho em até 3 segundos.

#### C. Acordo de Nível de Serviço (SLA Operacional com os Usuários)
* **Disponibilidade Garantida no Horário Nobre:** **99,9%** de uptime durante a janela operacional crítica, definida entre **15h00 e 23h30 em dias úteis** (horário de deslocamento e retorno dos estudantes).
* **Tempo Máximo de Recuperação (*RTO*):** Em caso de falha de serviço em nuvem durante a janela noturna, a plataforma possui plano de contingência para reestabelecer o rastreamento via passageiro âncora em até **15 minutos**.
* **Tempo Máximo de Perda de Dados (*RPO*):** 0 segundos (nenhuma confirmação de presença registrada é perdida, devido à gravação transacional atômica no Firestore).

#### D. Suporte Técnico, Treinamento e Manutenção
* **Treinamento Operacional dos Motoristas:** Realização de oficina prática de 30 minutos demonstrando a inicialização da viagem com 1 clique, interpretação dos contadores por faculdade e o uso do suporte veicular para smartphone.
* **Canal de Plantão Noturno:** Canal direto de suporte técnico mantido pela equipe de engenharia para atendimento a incidentes durante o horário das viagens.
* **Manutenção Evolutiva:** Ciclos de atualização quinzenais para correção de rotas e novos pontos de embarque universitários.

---

### 2.4 Procedimentos Operacionais Padronizados (POPs)

Como garantia formal de que os acordos de aquisição e fornecimento serão estritamente cumpridos, a equipe definiu 4 **Procedimentos Operacionais Padronizados**:

#### POP-DEV-01: Checklist de Pull Request, Git e Revisão de Código
* **Objetivo:** Garantir a estabilidade do código em produção e evitar que alterações quebrem o SLA fornecido.
* **Procedimento:**
  1. Criação de branch temática a partir da `main`: `feature/*` ou `fix/*`.
  2. Commits padronizados no padrão *Conventional Commits* (ex.: `feat(bus): add realtime heading calculation`).
  3. Validação estática executada localmente via `npm run lint` com 0 erros e 0 warnings impeditivos.
  4. Build de produção limpo via `npm run build` validando a geração dos assets do Vite.
  5. Pull Request submetido com checklist preenchido e aprovação obrigatória de pelo menos 1 membro da equipe antes do *Squash & Merge*.
* **Responsabilidade:** Desenvolvedor executor / Revisor da equipe.

#### POP-OPS-01: Pipeline de Deploy Contínuo e Segurança no Firebase
* **Objetivo:** Assegurar a publicação segura da aplicação sem interrupção de serviço aos alunos.
* **Procedimento:**
  1. Disparo automatizado da esteira de CI/CD ao ocorrer merge na branch `main`.
  2. Validação sintática das regras de segurança de banco de dados (`firestore.rules`).
  3. Deploy atômico dos arquivos estáticos PWA na rede CDN global do Firebase Hosting / Vercel.
  4. Atualização das Cloud Functions sem derrubar as conexões ativas de WebSocket.
  5. Teste de fumaça (*smoke test*) em dispositivo físico mobile conferindo carregamento de rota.
* **Responsabilidade:** Equipe de Infraestrutura e Nuvem.

#### POP-GEO-01: Homologação de Geofencing e Notificação Push
* **Objetivo:** Calibrar a precisão geográfica dos alertas de proximidade evitando falsos positivos.
* **Procedimento:**
  1. Criação de viagem de teste simulando a coordenada do ônibus aproximando-se da UFG Samambaia.
  2. Posicionamento do ônibus a 1,5 km do ponto: confirmar ausência de disparo.
  3. Atualização das coordenadas para 0,8 km (dentro do raio de 1 km): verificar disparo da Cloud Function e inclusão do aluno na lista de notificados.
  4. Validação do recebimento da notificação push no dispositivo com padrão sonoro e vibratório.
* **Responsabilidade:** Equipe de Qualidade e Testes de Campo.

#### POP-EMERG-01: Protocolo de Contingência, Botão "Fui Esquecido" & Âncora
* **Objetivo:** Agir prontamente quando um aluno aciona o alarme de esquecimento ou o motorista perde sinal.
* **Procedimento:**
  1. Estudante aciona o botão de socorro: registro atômico criado na coleção `emergencies`.
  2. Painel do motorista aciona alarme sonoro em alta frequência e exibe o nome e a faculdade do estudante em alerta vermelho piscante.
  3. Motorista checa a viabilidade de parada segura e entra em contato imediato para confirmar se o aluno embarcou em outro veículo ou necessita de resgate.
  4. Em caso de falha de bateria ou travamento do celular do motorista, o sistema chaveia automaticamente a transmissão do GPS para o celular de um estudante a bordo previamente validado (*passageiro âncora*).
* **Responsabilidade:** Motorista, Estudante e Equipe de Suporte Rhyme.

---

*Documento elaborado pelo Grupo 12 (Squad Rhyme Core) como entrega da Etapa 1 da disciplina INF0449 - Processos de Engenharia de Software - UFG 2026/2.*
