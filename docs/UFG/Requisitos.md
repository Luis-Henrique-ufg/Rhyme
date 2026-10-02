## Documento de Requisitos - Versão 1.0

---

### 1. INTRODUÇÃO

Este documento descreve os requisitos funcionais e não funcionais para o desenvolvimento de um sistema de gerenciamento de transporte universitário. O objetivo é substituir as listas de presença manuais em grupos de WhatsApp por uma plataforma digital com rastreamento em tempo real, visando reduzir a sobrecarga do motorista e melhorar a experiência dos alunos.

O sistema foi concebido para atender duas rotas principais (Cromínia e Professor Jamil), com cerca de 30 alunos por dia. A proposta central é fornecer um mapa interativo que exiba a localização dos alunos (por faculdade) e do ônibus, além de indicar o status de liberação de cada aluno.

---

### 2. OBJETIVOS

#### 2.1 Objetivo Geral

Desenvolver uma solução tecnológica que substitua a lista manual de presença em grupos de WhatsApp por um sistema de rastreamento e coordenação em tempo real, otimizando a rota dos ônibus e reduzindo a carga cognitiva do motorista.

#### 2.2 Objetivos Específicos

- Fornecer ao motorista um mapa com a distribuição dos alunos por faculdade, indicando quais já foram liberados das aulas;
- Permitir que os alunos visualizem a localização do ônibus em tempo real e estimativa de chegada;
- Permitir que os alunos informem quando forem liberados da aula, atualizando automaticamente o status no mapa do motorista;
- Otimizar a rota do motorista com base na concentração de alunos por ponto e status de liberação;
- Reduzir o ruído de comunicação nos grupos de WhatsApp, centralizando as informações em um único canal visual.

---

### 3. ESCOPO

O sistema abrangerá as seguintes funcionalidades:

- Cadastro de alunos e motoristas;
- Geração automática de viagens diárias para cada rota;
- Mapa interativo com a localização dos pontos de embarque (faculdades) e do ônibus;
- Indicação de status (liberado/não liberado) por aluno;
- Botão de confirmação de liberação para alunos;
- Dashboard do motorista com lista consolidada, contagem e status;
- Rastreamento da posição do ônibus (GPS ou mock inicial);
- Notificações push para alunos e motorista sobre alterações importantes.

O sistema será desenvolvido como uma **Progressive Web App (PWA)** para facilitar o acesso via navegador, sem necessidade de instalação. O backend utilizará **Firebase** (Firestore, Authentication, Cloud Functions) para sincronização em tempo real e baixo custo de manutenção. O frontend será construído com **React** e **Leaflet** para o mapa.

---

### 4. REQUISITOS FUNCIONAIS

Os requisitos funcionais descrevem as ações que o sistema deve executar.

| ID | Requisito | Prioridade | Observação |
|:---|:---|:---|:---|
| RF01 | O sistema deve permitir o cadastro de alunos com nome, faculdade e rota associada. | Alta | Cadastro simplificado via link. |
| RF02 | O sistema deve permitir o cadastro de motoristas com nome e rota associada. | Alta | Motorista fixo para cada rota. |
| RF03 | O sistema deve gerar automaticamente uma viagem para cada rota todos os dias úteis. | Alta | Horário: 16h e 16:30. |
| RF04 | O sistema deve exibir um mapa interativo com os pontos de embarque (faculdades) e a posição do ônibus. | Alta | Leaflet com OpenStreetMap. |
| RF05 | O sistema deve permitir que os alunos informem seu status: 'liberado' ou 'não liberado'. | Alta | Botão único em tela. |
| RF06 | O sistema deve consolidar e exibir para o motorista a lista de alunos por faculdade, com contagem e status. | Alta | Dashboard específico. |
| RF07 | O sistema deve atualizar em tempo real as informações no mapa e no dashboard usando Firestore listeners. | Alta | Sincronização automática. |
| RF08 | O sistema deve permitir que os alunos visualizem a localização do ônibus e o tempo estimado de chegada. | Média | Simulação inicial. |
| RF09 | O sistema deve enviar notificações push para alunos quando o ônibus estiver se aproximando. | Baixa | Pós-MVP. |
| RF10 | O sistema deve permitir que o motorista inicie e encerre a viagem. | Média | Botão 'Sair'. |

---

### 5. REQUISITOS NÃO FUNCIONAIS

Os requisitos não funcionais especificam atributos de qualidade do sistema.

| ID | Requisito | Métrica |
|:---|:---|:---|
| RNF01 | Performance: O sistema deve carregar em menos de 3 segundos. | Tempo de carregamento. |
| RNF02 | Concorrência: Suportar pelo menos 50 usuários simultâneos. | Teste de carga. |
| RNF03 | Segurança: Apenas usuários autenticados. | Firebase Authentication. |
| RNF04 | Usabilidade: Interface intuitiva, botões grandes. | Teste de usabilidade. |
| RNF05 | Disponibilidade: 99% de uptime no horário de pico (15h-17h). | Monitoramento. |
| RNF06 | Portabilidade: Funcionar como PWA em Chrome, Safari, Edge. | Teste em dispositivos. |

---

### 6. ARQUITETURA SUGERIDA

A arquitetura proposta baseia-se em um modelo cliente-servidor com backend serverless.

#### 6.1 Frontend

- Framework: React com PWA.
- Mapa: Leaflet com marcadores customizados.
- Estilização: Tailwind CSS.
- Service Worker para cache offline.

#### 6.2 Backend

- Banco de dados: Firestore (NoSQL, realtime).
- Autenticação: Firebase Authentication.
- Cloud Functions para regras de negócio.
- FCM para notificações push.

---

### 7. MODELO DE DADOS

Firestore coleções:

#### 7.1 `students`

Campos:
- `id`: string (UID do Firebase Authentication)
- `name`: string
- `faculty`: string (ex: UFG, Unicamps)
- `route`: string (crominia | professor_jamil)
- `role`: 'student' | 'driver'
- `notificationsEnabled`: boolean (para push)

#### 7.2 `trips`

Campos:
- `id`: string (auto)
- `route`: string
- `date`: timestamp
- `departureTime`: string (hora prevista)
- `status`: 'open' | 'closed' | 'in_progress' | 'finished'

#### 7.3 `attendance`

Campos:
- `id`: string (auto)
- `tripId`: string (referência)
- `studentId`: string (referência)
- `status`: 'liberado' | 'nao_liberado' | 'ausente'
- `updatedAt`: timestamp

---

### 8. CASOS DE USO PRINCIPAIS

#### 8.1 Aluno marca liberação

1. Aluno abre o app e vê o mapa.
2. Clica em 'Liberado' ao sair da aula.
3. Status atualizado no Firestore e refletido no dashboard do motorista.
4. Motorista ajusta a rota com base nos liberados.

#### 8.2 Motorista visualiza lista consolidada

1. Motorista acessa o dashboard.
2. Sistema exibe lista agrupada por faculdade com contagem.
3. Motorista inicia viagem, alterando status do ônibus.
4. Sistema sugere ordem otimizada dos pontos.

---

### 9. CRONOGRAMA SUGERIDO

| Fase | Atividade | Duração |
|:---|:---|:---|
| 1 | Configuração ambiente (Firebase, React, Leaflet) | 1 semana |
| 2 | Modelagem de dados e CRUD básico | 1 semana |
| 3 | Implementação do mapa e marcação de liberação | 2 semanas |
| 4 | Dashboard do motorista e consolidação | 2 semanas |
| 5 | Notificações push e otimização de rota | 1 semana |
| 6 | Testes, ajustes e deploy | 1 semana |
| **Total** | **MVP completo** | **8 semanas** |

---

### 10. RISCOS E MITIGAÇÕES

| Risco | Mitigação |
|:---|:---|
| Baixa adesão dos alunos | Campanha de lançamento com vídeo e incentivo inicial. |
| Falha no GPS | MVP com mock; planejamento para API real. |
| Sobrecarga no Firestore | Monitoramento e cache no frontend. |
| Resistência do motorista | Envolver no design e treinamento. |
| Dependência de internet | Service Worker para funcionalidades offline. |

---

### 11. PRÓXIMOS PASSOS

1. Validar este documento com os stakeholders (alunos, motorista, administração).
2. Criar protótipo navegável (Figma ou similar) para testar fluxos.
3. Definir equipe de desenvolvimento e divisão de tarefas (frontend, backend, testes).
4. Configurar ambiente de desenvolvimento (repositório, CI/CD, Firebase).
5. Iniciar desenvolvimento seguindo o cronograma sugerido.