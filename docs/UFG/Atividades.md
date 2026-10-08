# INF0449 - Processos de Engenharia de Software (UFG - 2026/2)
## Guia de Atividades e Estrutura do Manual de Processos de Software

> **Curso:** Bacharelado em Ciência da Computação / Engenharia de Software — Instituto de Informática (INF / UFG)  
> **Disciplina:** INF0449 — Processos de Engenharia de Software  
> **Semestre:** 2026/2  
> **Equipe (Grupo 12):** Carlos Daniel Lopes de Araújo, Heitor Gonçalves Costa, Luis Henrique Oliveira de Jesus, Matheus Marquez de Carvalho Rodrigues  
> **Projeto Aplicado:** Rhyme — Sistema PWA de Rastreamento de Transporte Universitário em Tempo Real  
> **Norma de Referência:** ISO/IEC/IEEE 12207:2017 (Systems and software engineering — Software life cycle processes)

---

## 1. Visão Geral do Desafio

O **Manual de Processos de Software** é o artefato central da disciplina INF0449. A proposta é aplicar, documentar e avaliar os processos de ciclo de vida de software baseados na norma ISO/IEC/IEEE 12207:2017 para o sistema **Rhyme** ao longo do semestre.

### Objetivos do Manual:
- Estabelecer os processos formais de engenharia de software aplicados ao desenvolvimento do PWA Rhyme.
- Garantir alinhamento com padrões internacionais de qualidade, governança, gerenciamento técnico e operação.
- Manter uma estrutura documental modular, rastreável e de fácil consulta.

---

## 2. Estrutura Modular do Manual de Processos

O manual é composto por partes sequenciais, cada uma mapeada em um arquivo Markdown específico na pasta docs/UFG/:

### Etapa 0: Apresentação do Software
* **Arquivo:** [etapa-0.md](./etapa-0.md)
* **Objetivo:** Estabelecer a base conceitual do sistema Rhyme, servindo de referência para todos os demais módulos.
* **Conteúdo Mínimo:**
  - Nome, descrição e problema resolvido (substituição de listas de WhatsApp por mapa interativo).
  - Público-alvo (estudantes e motoristas de transporte universitário intermunicipal de Cromínia e Prof. Jamil para UFG).
  - Escopo do sistema, funcionalidades centrais, restrições técnicas e premissas arquiteturais.

### Parte 1: Processos de Acordo (ISO 12207 §6.1)
* **Arquivo:** [etapa-1.md](./etapa-1.md)
* **Objetivo:** Mapear a relação do sistema com serviços externos e estratégias de entrega.
* **Conteúdo Mínimo:**
  - **Processo de Aquisição:** Avaliação de contratação de SaaS, APIs de mapas (Leaflet / OpenStreetMap vs. Mapbox), serviços de nuvem (Firebase Authentication/Firestore).
  - **Processo de Fornecimento:** Entrega do PWA aos estudantes/motoristas, critérios de aceite e suporte contínuo.
  - **Matriz de Fornecedores e SLA:** Definição de metas de disponibilidade e planos de contingência.

### Parte 2: Processos Organizacionais Habilitadores (ISO 12207 §6.2)
* **Arquivo:** [etapa-2.md](./etapa-2.md)
* **Objetivo:** Definir os pilares organizacionais e operacionais do projeto.
* **Conteúdo Mínimo:**
  - **Modelo de Ciclo de Vida:** Modelo Híbrido (Iterativo-Incremental com princípios Ágeis/Scrum e entregas contínuas).
  - **Infraestrutura e Ferramentas:** Stack técnica (React 19, Vite, Tailwind CSS 4, Firebase, Leaflet, GitHub, PWA).
  - **Viabilidade Estratégica:** Justificativa de projeto e ROI social.
  - **Competências e Capacitação (Matriz RACI):** Mapeamento de atribuições dos membros do Grupo 12 sem rigidez de cargos únicos.
  - **Plano de Qualidade:** Métricas de desempenho, cobertura de testes e critérios de aceitação.
  - **Gestão do Conhecimento:** Estratégia de documentação em repositório Git e histórico de decisões.

### Parte 3: Processos de Gerenciamento Técnico (ISO 12207 §6.3)
* **Arquivo:** [etapa-3.md](./etapa-3.md)
* **Objetivo:** Estabelecer os instrumentos de planejamento, tomada de decisão e controle de riscos.
* **Conteúdo Mínimo:**
  - **Planejamento de Processos (EAP/WBS):** Estrutura Analítica do Projeto detalhada por fases e entregáveis.
  - **Análise de Decisão (MDA):** Matrizes de decisão multicritério para escolha de stack frontend, banco de dados em tempo real e biblioteca de mapas.
  - **Gestão de Riscos (Risk Register):** Mapeamento de riscos técnicos, operacionais e de adoção, com probabilidade, impacto e planos de mitigação.

---

## 3. PARTE 4 - Processos Técnicos (ISO/IEC/IEEE 12207:2017 §6.4)

> **Cronograma de Aulas e Entregáveis Detalhados pela Professora:**

### AULA 07/10: Requisitos, Arquitetura e Design
* **Arquivo:** [etapa-4.md](./etapa-4.md) e [diagrama.plantuml](./diagrama.plantuml)
* **1. Requisitos:**
  - Documento de requisitos do sistema (Funcionais: RF01 a RF06, Não Funcionais: RNF01 a RNF05, Restrições operacionais).
  - Rastreabilidade de requisitos (Matriz Requisito x Artefato/Módulo).
  - Critérios de aceitação por funcionalidade.
  - Registro de stakeholders e necessidades elicitadas (Alunos UFG, Motoristas, Gestão do Transporte).
* **2. Arquitetura e Design:**
  - Documento de arquitetura do sistema (Visão geral, componentes, interfaces).
  - Decisões arquiteturais registradas em ADRs (Architecture Decision Records).
  - Diagramas de design UML em PlantUML ([diagrama.plantuml](./diagrama.plantuml)):
    - Diagrama de Casos de Uso
    - Diagrama de Sequência (Sincronização GPS Realtime)
    - Diagrama de Componentes (Cliente PWA, APIs e Firebase)
  - Justificativa das escolhas tecnológicas (React 19, Vite, Tailwind CSS 4, Leaflet, Firebase Firestore, Service Workers PWA).

### AULA 14/10: Implementação e Integração
* **Arquivo:** [etapa-4.md](./etapa-4.md) (Seção de Implementação)
* **3. Implementação e Integração:**
  - Padrões de codificação adotados (Clean Code, React Functional Components, Hooks customizados, ESLint).
  - Plano de integração entre componentes (PWA Client <-> Geolocation API <-> Leaflet <-> Firebase Firestore Realtime).
  - Registro de testes unitários e de integração (Suíte de testes Vitest / React Testing Library).
  - Rastreabilidade entre código-fonte e requisitos do sistema.

### AULA 21/10: Verificação, Validação e Transição
* **Arquivo:** [etapa-4.md](./etapa-4.md) e [etapa-5.md](./etapa-5.md)
* **4. Verificação, Validação e Transição:**
  - Plano de verificação e validação (V&V - ISO 12207 §6.4.9 e §6.4.10).
  - Critérios de aceitação validados por stakeholder.
  - Relatório de testes de aceitação (Testes práticos em campo na rota de transporte universitário).
  - Plano de transição e implantação do sistema (Service Worker cache, Firebase Hosting / Vercel CI/CD, PWA Install Prompt).

### AULA 28/10: Operação, Manutenção e Descontinuação
* **Arquivo:** [etapa-5.md](./etapa-5.md)
* **5. Operação, Manutenção e Descontinuação:**
  - Procedimentos de operação e monitoramento (Status da plataforma, tratamento de falhas de rede/GPS, monitoramento).
  - Plano de manutenção (Manutenção corretiva, preventiva, adaptativa e evolutiva).
  - Estratégia de descontinuação e migração de dados (Plano de encerramento do ciclo de vida, exportação de relatórios e backup Firestore).

---

## 4. Matriz de Rastreabilidade da Documentação

| Etapa | Norma ISO 12207 | Documento Correspondente | Cronograma / Status |
|---|---|---|---|
| **Etapa 0** | Contexto / Visão Geral | [etapa-0.md](./etapa-0.md) | Concluído |
| **Etapa 1** | §6.1 Processos de Acordo | [etapa-1.md](./etapa-1.md) | Concluído |
| **Etapa 2** | §6.2 Processos Organizacionais Habilitadores | [etapa-2.md](./etapa-2.md) | Concluído |
| **Etapa 3** | §6.3 Processos de Gerenciamento Técnico | [etapa-3.md](./etapa-3.md) | Concluído |
| **Parte 4 (07/10)** | §6.4.1 - §6.4.3 Requisitos, Arquitetura & Design UML | [etapa-4.md](./etapa-4.md) / [diagrama.plantuml](./diagrama.plantuml) | Concluído |
| **Parte 4 (14/10)** | §6.4.7 - §6.4.8 Implementação & Integração | [etapa-4.md](./etapa-4.md) | Agendado (14/10) |
| **Parte 4 (21/10)** | §6.4.9 - §6.4.10 Verificação, Validação & Transição | [etapa-4.md](./etapa-4.md) / [etapa-5.md](./etapa-5.md) | Agendado (21/10) |
| **Parte 5 (28/10)** | §6.4.11 - §6.4.14 Operação, Manutenção & Encerramento | [etapa-5.md](./etapa-5.md) | Agendado (28/10) |
| **Governança** | Gestão de Versões | [historico-versoes.md](./historico-versoes.md) | Atualizado |

---

*Documento integrante do Manual de Processos de Software — Grupo 12 — INF0449 (UFG 2026/2).*
