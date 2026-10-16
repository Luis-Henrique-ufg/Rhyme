# Plano de Adequacao a Norma ISO/IEC/IEEE 12207:2017
## Processo 6.4.7: Construcao de Software (*Software Construction Process*)

> **Projeto**: Rhyme (PWA de Rastreamento e Logistica Academica Inteligente do Transporte Universitario)  
> **Instituicao / Disciplina**: Universidade Federal de Goias (UFG) - Instituto de Informatica (INF) / INF0449 - Processos de Engenharia de Software (2026/2)  
> **Equipe**: Grupo 12 (Matheus Marquez, Luis Henrique Oliveira de Jesus, Heitor Goncalves, Carlos Daniel)  
> **Referencia Normativa**: ISO/IEC/IEEE 12207:2017 (Processos de Ciclo de Vida de Software - Secoes 6.4.7 e 6.3.5)  
> **Objetivo**: Transicionar a base de codigo do Rhyme de um prototipo monolitico funcional para um produto de engenharia de software de alta maturidade, desacoplado (Clean Architecture / SOLID), auditavel, coberto por testes automatizados e com rastreabilidade formal via commits atomicos.

---

## 1. Visao Geral e Alinhamento Normativo

O processo **6.4.7 (Construcao de Software)** da norma internacional ISO/IEC/IEEE 12207:2017 estabelece os requisitos mandatorios para produzir unidades de software executaveis que reflitam a arquitetura e os requisitos do sistema:

1. **Criterios de construcao definidos (6.4.7.2.a)**: Estabelecimento de regras de estilo, convencoes de codificacao, modularizacao e padroes de projeto.
2. **Unidades de software construidas (6.4.7.2.b)**: Decomposicao de componentes sobrecarregados ("God Components"), isolamento de regras de negocio e desacoplamento de servicos de infraestrutura (Firebase, Geolocation, Web Audio).
3. **Unidades de software verificadas (6.4.7.2.c)**: Implementacao de testes unitarios e de integracao automatizados, simulacao de cenarios offline/PWA e analise estatica rigorosa.
4. **Rastreabilidade estabelecida (6.4.7.2.d)**: Rastreabilidade bidirecional entre requisitos elicitados (RF/RNF da Etapa 4 do Manual), unidades de software e itens de configuracao gerenciados (Processo 6.3.5).

```mermaid
graph TD
    ISO[ISO 12207: 6.4.7 Construcao de Software] --> F0[Fase 0: Baseline & Higienizacao de Governanca]
    F0 --> F1[Fase 1: Padroes de Codificacao & Linters]
    F1 --> F2[Fase 2: Decomposicao da Camada de Servicos & StudentMap]
    F2 --> F3[Fase 3: Refatoracao do DriverDashboard & Estado]
    F3 --> F4[Fase 4: Testes Automatizados Unitarios & Integracao]
    F4 --> F5[Fase 5: Pipeline CI/CD & Auditoria Formal]

    TRACE[Commits Atomicos Padronizados [ISO-6.4.7-XXX]] -.->|Rastreabilidade Formal| F0
    TRACE -.->|Rastreabilidade Formal| F1
    TRACE -.->|Rastreabilidade Formal| F2
    TRACE -.->|Rastreabilidade Formal| F3
    TRACE -.->|Rastreabilidade Formal| F4
    TRACE -.->|Rastreabilidade Formal| F5
```

---

## 2. Padrao de Commits Atomicos e Rastreabilidade

Cada commit executado durante o plano deve satisfazer estritamente:
1. **Unicidade de Proposito**: Resolver uma unica preocupacao logica (nao misturar refatoracao com estilizacao ou correcao de testes).
2. **Integridade da Build**: A aplicacao deve compilar com sucesso (`npm run build`) e os testes existentes devem passar em cada commit individual.
3. **Sintaxe Padronizada**: Mensagem aderente ao **Conventional Commits 1.0.0** com identificador de requisito normativo:

```text
<tipo>(<escopo>): [ISO-<processo>-<id>] <descricao imperativa e concisa>

[corpo detalhando motivacoes tecnicas e padroes aplicados]

[rodape com referencias a requisitos da Etapa 4 / issues]
```

### Prefixos Normativos Mapeados:
* `[ISO-6.3.5-CMxx]`: Gerencia de Configuracao (Configuracoes de build, gitignore, pacotes).
* `[ISO-6.4.7-CRITxx]`: Criterios e Padroes de Codificacao (Linters, formatacao, regras estaticas).
* `[ISO-6.4.7-SRPxx]`: Principio da Responsabilidade Unica e Decomposicao Arquitetural.
* `[ISO-6.4.7-VERIFxx]`: Verificacao de Software (Testes unitarios e de integracao).
* `[ISO-6.4.7-CIxx]`: Integracao Continua e Automacao de Qualidade.
* `[ISO-6.4.7-DOCxx]`: Documentacao Formal e Relatorios de Auditoria.

---

## 3. Diagnostico Tecnico da Base de Codigo (Debitos e Oportunidades)

Apos auditoria estrutural do repositorio `Rhyme`, foram identificados os seguintes gargalos arquiteturais:

| Componente / Modulo | Linhas | Tamanho | Diagnostico Tecnico |
| :--- | :---: | :---: | :--- |
| `src/pages/StudentMap.jsx` | 2.635 | 125 KB | **God Component**: Aglutina mapa Leaflet, listeners do Firestore para dezenas de alunos/onibus, calculos de Haversine, broadcast de GPS, sintetizador de audio, modais de alarme/wake-up e logica de rede. |
| `src/pages/DriverDashboard.jsx` | 1.812 | 89.8 KB | **God Component**: Mistura telemetria de conducao, envio continuo de GPS, contadores agrupados por campus, fila de passageiros, chamadas de embarque e modal de socorro. |
| `src/components/Header.jsx` | 717 | 34.6 KB | Acoplamento excessivo de navegacao, status de conexao, alternadores de som/tema e gavetas de menu. |
| `src/utils/useTripData.js` | 170 | 8.9 KB | Custom hook posicionado erroneamente dentro da pasta `src/utils/` em vez de `src/hooks/`. |
| `package.json` | 38 | 0.9 KB | Nome do pacote como `"temp-vite"` e ausencia de framework de testes automatizados (`vitest`). |
| `dev-dist/` | 108 avisos | - | Diretorio de build temporario do PWA sendo inspecionado pelo linter `oxlint`. |
| Ausencia de CI/CD | - | - | Inexistencia de pipeline de validacao automatica para commits e Pull Requests. |

---

## 4. Cronograma de Execucao por Fases

### Fase 0: Baseline, Higienizacao e Governanca de Configuracao (Semana 1)
> **Foco**: ISO 12207 - 6.3.5 (Processo de Gerencia de Configuracao) e 6.4.7.2.a.

1. **Normalizacao do Projeto**:
   - Atualizar `name` no `package.json` de `"temp-vite"` para `"rhyme-pwa"`.
   - Adicionar `.editorconfig` na raiz padronizando indentacao (2 espacos), quebra de linha LF e charset UTF-8.
   - Refinar `.gitignore` para ignorar formalmente pastas temporarias como `dev-dist/` e caches locais.
   - Configurar `.oxlintignore` para impedir que arquivos gerados de service worker poluam a analise de codigo.

#### Commits Atomicos da Fase 0:
```bash
git commit -m "build(config): [ISO-6.3.5-CM01] normalize package metadata and add root editorconfig"
git commit -m "build(config): [ISO-6.3.5-CM02] refine gitignore and oxlintignore to exclude dev-dist artifacts"
```

---

### Fase 1: Padroes de Codificacao, Linters e Tipagem (Semana 2)
> **Foco**: ISO 12207 - 6.4.7.2.a (Criterios de Construcao Definidos).

1. **Padronizacao e Formatacao Estatica**:
   - Estabelecer configuracao rigorosa de linting garantindo conformidade com as regras de React 19 e Hooks (`exhaustive-deps`).
   - Adicionar script de formatacao padronizada via Prettier/Oxlint.
   - Configurar pre-commit hooks (Husky / lint-staged) impedindo que codigo fora do padrao seja integrado.
   - Executar varredura completa da base de codigo para zerar avisos e erros sintaticos.

#### Commits Atomicos da Fase 1:
```bash
git commit -m "style(frontend): [ISO-6.4.7-CRIT01] configure strict linter rules and prettier formatting"
git commit -m "build(git): [ISO-6.4.7-CRIT02] setup pre-commit hooks for automated code quality checks"
git commit -m "style(frontend): [ISO-6.4.7-CRIT03] format entire codebase to comply with clean code standards"
```

---

### Fase 2: Decomposicao Arquitetural da Camada de Servicos e StudentMap (Semanas 3 e 4)
> **Foco**: ISO 12207 - 6.4.7.2.b (Unidades de Software Construidas - SOLID/SRP).

1. **Criacao da Camada de Servicos (`src/services/`)**:
   - `studentService.js`: Encapsular operacoes de leitura/escrita do Firestore para status do aluno ("Liberado", "Em sala", "No ponto") e listeners em tempo real.
   - `geoService.js`: Isolar funcoes matematicas de georreferenciamento (Formula de Haversine, deteccao de Geofencing de 1km, compensacao de inclinacao e orientacao da bussola).
   - `audioService.js`: Encapsular a Web Audio API, sintetizadores de frequencia e geracao de beeps procedurais.
2. **Decomposicao do Monolito `StudentMap.jsx` (2.635 linhas)**:
   - Extrair `useStudentLocation.js`: Gerenciamento do GPS do aluno e rastreamento local.
   - Extrair `useBusBroadcaster.js`: Logica de transmissao colaborativa da van por alunos a bordo (RF05).
   - Extrair `useNearbyStudents.js`: Agrupamento e marcadores visuais de alunos por faculdade.
   - Modularizar subcomponentes de interface: `CampusModeHUD.jsx`, `StudentControls.jsx`, `WakeUpAlarmController.jsx`.

#### Commits Atomicos da Fase 2:
```bash
git commit -m "refactor(services): [ISO-6.4.7-SRP01] extract pure geographic and haversine calculations into geoService"
git commit -m "refactor(services): [ISO-6.4.7-SRP02] extract firestore student realtime operations into studentService"
git commit -m "refactor(services): [ISO-6.4.7-SRP03] isolate web audio synthesizers into dedicated audioService"
git commit -m "refactor(hooks): [ISO-6.4.7-SRP04] extract location and bus broadcast logic into dedicated hooks"
git commit -m "refactor(student-map): [ISO-6.4.7-SRP05] decompose StudentMap into modular subcomponents and controllers"
```

---

### Fase 3: Refatoracao do DriverDashboard e Centralizacao de Estado (Semanas 5 e 6)
> **Foco**: ISO 12207 - 6.4.7.2.b (Modularizacao e Alta Coesao).

1. **Decomposicao do Monolito `DriverDashboard.jsx` (1.812 linhas)**:
   - Extrair `driverService.js`: Gerenciamento de ciclo de vida da viagem (inicio, paradas, encerramento) e transmissao de telemetria do motorista.
   - Extrair `useDriverTelemetry.js`: Rastreamento continuo e status da bateria/sinal do condutor.
   - Extrair `usePassengerCounters.js`: Agrupamento e contagem em tempo real de alunos liberados por campus UFG (RF06).
   - Modularizar subcomponentes: `DriverCockpitHUD.jsx`, `CampusSummaryCard.jsx`, `PassengerChecklistModal.jsx`, `EmergencyRescueModal.jsx`.
2. **Organizacao Estrutural de Pastas e Componentes Secundarios**:
   - Mover `src/utils/useTripData.js` para `src/hooks/useTripData.js`.
   - Decompor `src/components/Header.jsx` (717 linhas) separando barra de navegacao, status de conexao e gaveta de menu.

#### Commits Atomicos da Fase 3:
```bash
git commit -m "refactor(services): [ISO-6.4.7-SRP06] extract trip management and telemetry into driverService"
git commit -m "refactor(driver): [ISO-6.4.7-SRP07] decompose DriverDashboard into modular HUD and campus summary cards"
git commit -m "refactor(components): [ISO-6.4.7-SRP08] move useTripData to hooks directory and decouple Header components"
```

---

### Fase 4: Verificacao de Unidades e Testes Automatizados (Semanas 7 e 8)
> **Foco**: ISO 12207 - 6.4.7.2.c (Unidades de Software Verificadas) e 6.4.9 (Processo de Verificacao).

1. **Ambiente de Testes (Vitest + React Testing Library)**:
   - Instalar `vitest`, `@testing-library/react`, `@testing-library/jest-dom` e `jsdom`.
   - Configurar `vite.config.js` com suite de testes compativel com Node.js 22/24.
2. **Testes Unitarios das Regras de Negocio Puras**:
   - Testar calculo de Haversine e deteccao de Geofencing a 1.000m do campus (`geoService.test.js`).
   - Testar maquina de estados de viagem (`tripManager.test.js`).
   - Testar rotinas de formatacao e ordenacao de paradas.
3. **Testes de Integracao e Componentes React**:
   - Testar alternancia de status do aluno ("Liberado" / "No ponto").
   - Testar renderizacao do `GpsStatusBanner` e `OfflineBanner`.
   - Testar protecao de rotas autenticadas em `AuthContext`.

#### Commits Atomicos da Fase 4:
```bash
git commit -m "test(setup): [ISO-6.4.7-VERIF01] setup vitest and react testing library environment"
git commit -m "test(services): [ISO-6.4.7-VERIF02] add unit tests covering haversine geofencing and trip state machine"
git commit -m "test(components): [ISO-6.4.7-VERIF03] add component tests for gps banners, offline alerts and status toggles"
```

---

### Fase 5: Esteira de Integracao Continua (CI/CD) e Auditoria de Rastreabilidade (Semana 9)
> **Foco**: ISO 12207 - 6.4.7.2.d (Rastreabilidade e Fechamento do Ciclo).

1. **Pipeline de Integracao Continua (GitHub Actions)**:
   - Criar `.github/workflows/ci.yml`.
   - Jobs paralelos executando sob **Node.js 22**:
     1. `lint`: Executa checagem de linter e formatacao.
     2. `test`: Executa suite completa de testes unitarios no Vitest.
     3. `build`: Valida a geracao do bundle de producao e assets PWA.
2. **Auditoria de Conformidade e Rastreabilidade**:
   - Elaboracao do Relatorio Formal de Auditoria (`docs/AUDIT_REPORT_ISO_12207.md`) mapeando todos os commits, requisitos (RF01 a RF06) e testes (CT-01 a CT-06) da Etapa 4 do Manual.

#### Commits Atomicos da Fase 5:
```bash
git commit -m "ci(github): [ISO-6.4.7-CI01] add multi-job workflow for automated lint, test and pwa build verification"
git commit -m "docs(compliance): [ISO-6.4.7-DOC01] document software construction compliance and traceability audit"
```

---

## 5. Criterios de Aceite para Conformidade com a ISO 12207 (6.4.7)

Para que a transicao arquitetural do **Rhyme** seja aprovada formalmente em auditoria de qualidade de software, todos os seguintes criterios objetivos (*quality gates*) devem ser atingidos:

* [ ] **Zero Violacoes de Linter**: Execucao de `npm run lint` com codigo de saida `0` sem avisos em arquivos de producao.
* [ ] **Decomposicao de God Components**: Reducao do tamanho de `StudentMap.jsx` e `DriverDashboard.jsx` para componentes modulares coesos com menos de 500 linhas cada.
* [ ] **Isolamento de Infraestrutura**: Zero chamadas diretas a APIs do Firebase ou Web Audio soltas dentro de renderizadores de tela; 100% encapsuladas na camada `src/services/`.
* [ ] **Cobertura Minima de Testes**: Suite automatizada no Vitest cobrindo 100% das funcoes puras de georreferenciamento (Haversine/Geofencing) e regras de transicao de status de viagem.
* [ ] **Rastreabilidade Bidirecional nos Commits**: 100% dos commits da transicao seguindo o padrao atomico `[ISO-6.4.7-XXX]`.
* [ ] **Build e CI Verde**: Pipeline do GitHub Actions executando e aprovando todos os estagios (lint, test, build) a cada push e Pull Request na branch principal.

---

*Plano elaborado para o projeto Rhyme conforme as diretrizes do Instituto de Informatica (INF/UFG) e a norma internacional ISO/IEC/IEEE 12207:2017.*
