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

O manual é composto por 6 partes sequenciais, cada uma mapeada em um arquivo Markdown específico na pasta docs/UFG/:

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

### Parte 4: Processos Técnicos (ISO 12207 §6.4)
* **Arquivo:** [etapa-4.md](./etapa-4.md)
* **Objetivo:** Formalizar a engenharia de requisitos, arquitetura e verificação/validação.
* **Conteúdo Mínimo:**
  - **Definição de Requisitos:** Requisitos funcionais (RF01 a RF06) e não funcionais (RNF01 a RNF05) rastreáveis.
  - **Arquitetura do Sistema:** Visão de componentes PWA, fluxo de sinal GPS e arquitetura de dados Firebase.
  - **Plano de Verificação e Validação (V&V):** Protocolos de teste unitário, integração, usabilidade PWA em campo e aceite pelos usuários.

### Parte 5: Processos de Sustentação, Operação e Manutenção (ISO 12207 §6.4.10 – §6.4.14)
* **Arquivo:** [etapa-5.md](./etapa-5.md)
* **Objetivo:** Definir as diretrizes para implantação, sustentação contínua e encerramento do ciclo de vida.
* **Conteúdo Mínimo:**
  - **Processo de Implantação e Transição:** Pipeline CI/CD com GitHub Actions e Vercel/Firebase Hosting, estratégia PWA Service Worker.
  - **Processo de Operação e Manutenção:** Monitoramento de erros, manutenção corretiva/evolutiva e suporte aos usuários.
  - **Processo de Descontinuação e Encerramento:** Plano de encerramento, exportação de dados, revogação de chaves e arquivamento do projeto.

---

## 3. Matriz de Rastreabilidade da Documentação

| Etapa | Norma ISO 12207 | Documento Correspondente | Status |
|---|---|---|---|
| **Etapa 0** | Contexto / Visão Geral | [etapa-0.md](./etapa-0.md) | Concluído |
| **Etapa 1** | §6.1 Processos de Acordo | [etapa-1.md](./etapa-1.md) | Concluído |
| **Etapa 2** | §6.2 Processos Organizacionais Habilitadores | [etapa-2.md](./etapa-2.md) | Concluído |
| **Etapa 3** | §6.3 Processos de Gerenciamento Técnico | [etapa-3.md](./etapa-3.md) | Concluído |
| **Etapa 4** | §6.4 Processos Técnicos | [etapa-4.md](./etapa-4.md) | Concluído |
| **Etapa 5** | §6.4.10–6.4.14 Processos de Sustentação | [etapa-5.md](./etapa-5.md) | Concluído |
| **Governança** | Gestão de Versões | [historico-versoes.md](./historico-versoes.md) | Atualizado |
| **Requisitos** | Especificação Técnica | [Requisitos.md](./Requisitos.md) | Complementar |

---

*Documento integrante do Manual de Processos de Software — Grupo 12 — INF0449 (UFG 2026/2).*
