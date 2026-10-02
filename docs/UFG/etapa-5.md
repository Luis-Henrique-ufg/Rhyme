# Manual de Processos de Software
## Etapa 5: Processos de Sustentação — Manutenção e Descontinuação (ISO/IEC/IEEE 12207:2017 Seção 6.4 / 6.5)

---

### Identificação do Trabalho e Equipe

* **Instituição:** Universidade Federal de Goiás (UFG) — Instituto de Informática (INF)
* **Disciplina:** INF0449 — Processos de Engenharia de Software (Semestre 2026/2)
* **Nome do Documento:** Manual de Processos de Software — Etapa 5 (Processos de Sustentação)
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
| **08/10/2026** | **5.0** | Etapa 4: Processos Técnicos — Requisitos, Arquitetura e Plano de Testes (ISO 12207 §6.4). |
| **22/10/2026** | **6.0** | Realização da **Etapa 5** do manual de processos: incorporação dos **Processos de Sustentação** conforme ISO/IEC/IEEE 12207:2017 (§6.4/§6.5). Contempla o Plano de Implantação e Handoff, o Processo de Manutenção (corretiva, adaptativa e evolutiva), o Plano de Monitoramento Operacional e o Processo de Descontinuação planejada da plataforma. |

---

## 6. PARTE 5 — PROCESSOS DE SUSTENTAÇÃO: IMPLANTAÇÃO, MANUTENÇÃO E DESCONTINUAÇÃO

> *Referência Normativa:* Esta seção formaliza os processos que assegurarão a operação sustentável do **Rhyme** após sua entrada em produção, fundamentada nos processos de implantação (§6.4.9), manutenção de software (§6.4.13) e descontinuação (§6.4.14) da norma **ISO/IEC/IEEE 12207:2017**. O objetivo é garantir que o sistema seja entregue, mantido e, quando necessário, encerrado de forma planejada, segura e rastreável.

---

### 6.1 Processo de Implantação e Handoff (ISO 12207:2017 §6.4.9)

A implantação do Rhyme em produção seguirá um roteiro formal de handoff (transferência de responsabilidade) para as comunidades usuárias finais — estudantes, motoristas e gestores municipais.

#### A. Critérios de Prontidão para Produção (Definition of Done — DoD)

A plataforma somente será declarada pronta para implantação quando **todos** os critérios abaixo forem atendidos:

| Critério | Responsável | Evidência Exigida |
|:---|:---|:---|
| Todos os casos de teste CT-01 a CT-06 aprovados | Grupo 12 | Relatório de execução de testes assinado pela equipe |
| Auditoria Lighthouse Mobile com FCP < 1,8s e TTI < 2,5s | Grupo 12 | Screenshot do relatório Lighthouse em rede 4G simulada |
| Regras de segurança do Firestore auditadas e validadas | Grupo 12 | Resultado dos testes de regras no Firebase Emulator Suite |
| Documentação de usuário (guia do motorista e do aluno) disponível | Grupo 12 | Arquivos publicados no repositório em docs/guias/ |
| Treinamento do motorista-piloto realizado | Grupo 12 + Motorista | Registro fotográfico da oficina de onboarding |
| QR Code afixado nos ônibus das rotas piloto | Motoristas | Confirmação da afixação pela associação estudantil |

#### B. Roteiro de Implantação por Fase

**Fase 1 — Piloto Controlado (Sprint S6 / Novembro 2026)**
- Implantação restrita à **Rota Cromínia ↔ Goiânia** com grupo voluntário de 10 a 15 alunos.
- Objetivo: validar todos os fluxos em condições reais de rodovia sem pressão de escala.
- Monitoramento intensivo da equipe durante as 5 primeiras viagens operacionais.

**Fase 2 — Expansão para a Segunda Rota (Dezembro 2026 – Janeiro 2027)**
- Após estabilidade comprovada na rota de Cromínia, expansão para a **Rota Professor Jamil ↔ Goiânia**.
- Cadastramento dos alunos da nova rota e treinamento do segundo motorista.

**Fase 3 — Operação Autônoma (A partir de Fevereiro 2027)**
- As associações estudantis assumem o suporte de primeiro nível (onboarding de novos alunos).
- A equipe do Grupo 12 mantém responsabilidade exclusiva de manutenção técnica.

#### C. Artefatos de Handoff

Os seguintes documentos serão produzidos e entregues às comunidades usuárias antes da operação autônoma:

1. **Guia do Motorista (1 página, A4):** Passo a passo visual ilustrado com capturas de tela reais do cockpit.
2. **Guia do Aluno (1 página, A4):** Como acessar via QR Code, fazer login, marcar liberação e acionar emergência.
3. **Manual do Administrador:** Instruções para cadastrar novas rotas, alunos e motoristas no painel Firebase.
4. **Runbook de Incidentes:** Procedimentos de resposta rápida para os cenários de falha mais prováveis (perda de GPS, queda de Internet, falha de push).

---

### 6.2 Processo de Manutenção de Software (ISO 12207:2017 §6.4.13)

Após a entrada em operação, o Rhyme será mantido sob três modalidades formais de manutenção:

#### A. Manutenção Corretiva

**Definição:** Correção de defeitos identificados em produção que afetam a funcionalidade ou a segurança do sistema.

**Processo:**
1. Defeito identificado por usuário, monitoramento ou equipe de campo.
2. Registro da *issue* no GitHub com template padronizado (descrição, passos para reproduzir, impacto).
3. Triagem e classificação por severidade (Crítica / Alta / Média / Baixa).
4. Desenvolvimento da correção em branch ix/* com cobertura de teste regressivo.
5. Deploy via pipeline CI/CD após aprovação no Code Review.

**SLA de Resolução por Severidade:**

| Severidade | Critério | Tempo de Resolução Alvo |
|:---|:---|:---:|
| **Crítica** | Sistema inoperante durante janela de viagens | ≤ 2 horas |
| **Alta** | Funcionalidade essencial degradada (ex: cockpit sem atualização) | ≤ 24 horas |
| **Média** | Funcionalidade não crítica com comportamento inesperado | ≤ 1 semana |
| **Baixa** | Inconsistência visual ou texto incorreto | Próxima iteração |

#### B. Manutenção Adaptativa

**Definição:** Adaptações motivadas por mudanças no ambiente externo do sistema — novas versões de navegadores, mudanças na API do Firebase, alterações nas rotas universitárias ou no calendário acadêmico.

**Exemplos de gatilhos:**
- Nova rota intermunicipal solicitada por associação estudantil ou prefeitura.
- Atualização de API do Leaflet ou do Firebase SDK com breaking changes.
- Mudança de horário de saída das faculdades (ex.: greve, recesso).
- Atualização das regras de privacidade da LGPD com impacto no modelo de dados.

**Ciclo:** Revisão adaptativa planejada a cada início de semestre acadêmico.

#### C. Manutenção Evolutiva

**Definição:** Incorporação de novas funcionalidades planejadas para versões futuras do Rhyme, a partir do backlog gerenciado no GitHub Projects.

**Candidatos ao Backlog v2.0:**

| Funcionalidade | Prioridade Estimada | Justificativa |
|:---|:---:|:---|
| Histórico de viagens e relatórios de presença para prefeituras | Alta | Permite auditoria e justificativa de gastos com transporte municipal. |
| Modo escuro nativo e alto contraste para uso noturno | Média | Melhora a legibilidade do mapa após as 20h nas viagens de retorno. |
| Painel administrativo web para gestores municipais | Média | Elimina a necessidade de acesso direto ao console Firebase para gerenciar rotas. |
| Algoritmo de sugestão de ordem otimizada de paradas | Baixa | Reduz tempo total de viagem com base na distribuição de alunos liberados por câmpus. |
| Integração com calendário acadêmico da UFG via API | Baixa | Suspensão automática de viagens em feriados e recessos acadêmicos. |

---

### 6.3 Plano de Monitoramento Operacional

Para garantir a saúde contínua da plataforma em produção, a equipe implantará os seguintes mecanismos de observabilidade:

#### A. Indicadores-Chave de Operação (KPIs)

| KPI | Alvo | Frequência de Medição | Ferramenta |
|:---|:---:|:---:|:---|
| Uptime da plataforma (janela 15h–23h30) | ≥ 99,9% | Diária | Firebase Console + Vercel Analytics |
| Latência média de sincronização (status do aluno → painel motorista) | < 100ms | Por viagem | Timestamps no Firestore |
| Taxa de sucesso das notificações push | ≥ 98% | Por viagem | FCM Delivery Reports |
| Número de acionamentos do botão de emergência não resolvidos | 0 | Por viagem | Coleção emergencies do Firestore |
| Número de operações Firestore diárias | < 40.000 (segurança de 80% do limite gratuito) | Diária | Firebase Console |

#### B. Procedimento de Resposta a Incidentes em Produção

1. **Detecção:** Alerta automático via Firebase Console ou relato de usuário em campo.
2. **Triagem:** Integrante de plantão identifica a severidade e ativa protocolo correspondente.
3. **Contenção:** Para incidentes críticos, ativação imediata do protocolo de contingência (passageiro âncora, modo offline).
4. **Resolução:** Correção implantada via pipeline CI/CD com testes automatizados antes do deploy.
5. **Pós-Incidente:** Post-mortem *blameless* documentado no repositório com causa raiz e medidas preventivas.

---

### 6.4 Processo de Descontinuação (ISO 12207:2017 §6.4.14)

O processo de descontinuação define os procedimentos para o encerramento planejado e responsável da plataforma Rhyme, garantindo a proteção dos dados dos usuários e a continuidade dos serviços de transporte.

#### A. Gatilhos para Descontinuação

A descontinuação poderá ser iniciada em qualquer dos seguintes cenários:

1. **Substituição tecnológica:** Uma plataforma mais avançada ou institucional for adotada pelas prefeituras municipais.
2. **Encerramento do projeto acadêmico:** Conclusão formal do ciclo do projeto na disciplina INF0449 sem continuidade prevista.
3. **Inviabilidade técnica prolongada:** Impossibilidade de manutenção por ausência de mantenedores disponíveis por período superior a 6 meses.
4. **Decisão das comunidades usuárias:** Associações estudantis e prefeituras optarem por descontinuar o uso voluntariamente.

#### B. Roteiro de Descontinuação

**Etapa 1 — Comunicação (90 dias antes do encerramento)**
- Notificação formal às prefeituras, motoristas e associações estudantis com data definida de encerramento.
- Orientação sobre alternativas disponíveis para a coordenação de transporte.

**Etapa 2 — Exportação e Entrega de Dados (60 dias antes)**
- Exportação de todos os registros históricos de viagens e presença em formato CSV e JSON.
- Entrega dos dados às prefeituras para fins de auditoria e continuidade administrativa.

**Etapa 3 — Encerramento Progressivo (30 dias antes)**
- Desabilitação do cadastro de novos usuários.
- Encerramento do suporte técnico ativo.
- Exibição de aviso de descontinuação na interface da aplicação.

**Etapa 4 — Exclusão de Dados e Encerramento (Data de encerramento)**
- Exclusão de todos os dados pessoais de usuários do Firestore, conforme obrigações da LGPD.
- Arquivamento do código-fonte no repositório GitHub como referência histórica aberta.
- Desativação dos projetos no Firebase Console e na Vercel.
- Emissão de relatório final de descontinuação documentando o ciclo de vida completo da plataforma.

#### C. Responsabilidades na Descontinuação

| Atividade | Responsável |
|:---|:---|
| Comunicação aos stakeholders | Grupo 12 + Associações Estudantis |
| Exportação e entrega de dados | Grupo 12 (Infraestrutura e Nuvem) |
| Exclusão de dados pessoais (LGPD) | Grupo 12 (Qualidade e Conformidade) |
| Arquivamento do código-fonte | Grupo 12 (Desenvolvimento Frontend) |
| Relatório final de descontinuação | Grupo 12 (todos os integrantes) |

---

### 6.5 Considerações Finais — Ciclo de Vida Completo do Rhyme

Este documento encerra o **Manual de Processos de Software do Grupo 12**, construído progressivamente ao longo do semestre 2026/2 da disciplina INF0449 — Processos de Engenharia de Software da UFG. O manual cobre integralmente o ciclo de vida da plataforma Rhyme desde sua concepção até o planejamento de sua eventual descontinuação, em conformidade com a norma **ISO/IEC/IEEE 12207:2017**.

| Etapa | Conteúdo | Norma de Referência |
|:---:|:---|:---|
| 0 | Apresentação do software: problema, público-alvo, escopo, funcionalidades, restrições. | — |
| 1 | Processos de Acordo: aquisição, fornecimento, SLA e POPs. | ISO 12207:2017 §6.1 |
| 2 | Processos Organizacionais: ciclo de vida, infraestrutura, RACI, qualidade e conhecimento. | ISO 12207:2017 §6.2 |
| 3 | Processos de Gerenciamento Técnico: EAP, cronograma, MDA e Risk Register. | ISO 12207:2017 §6.3 |
| 4 | Processos Técnicos: requisitos, arquitetura do sistema e plano de testes. | ISO 12207:2017 §6.4 |
| 5 | Processos de Sustentação: implantação, manutenção, monitoramento e descontinuação. | ISO 12207:2017 §6.4/§6.5 |

---

*Documento elaborado pelo Grupo 12 como entrega da Etapa 5 da disciplina INF0449 - Processos de Engenharia de Software - UFG 2026/2.*
