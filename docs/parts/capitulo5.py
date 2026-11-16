# -*- coding: utf-8 -*-
CAPITULO5_HTML = """
      <!-- SEÇÃO 6: CAPÍTULO 5 - PROCESSOS TÉCNICOS (REQUISITOS, ARQUITETURA, V&V, OPERAÇÃO) -->
      <section
        id="sec5"
        class="ds-section py-20 border-b border-stone-300/60"
      >
        <div class="mb-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D9488]/15 text-[#0D9488] text-xs font-mono font-semibold mb-3">
            <iconify-icon icon="solar:code-square-bold" width="16"></iconify-icon>
            <span>Capítulo 5 • ISO/IEC/IEEE 12207</span>
          </div>
          <h2 class="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">Capítulo 5 — Processos Técnicos</h2>
          <p class="text-stone-600 mt-2 max-w-3xl text-base">
            Engenharia de requisitos mensuráveis, arquitetura de software reativa, modelo NoSQL, diagramas vetoriais (SVG), padrões de código, V&V com testes de campo e ciclo operacional.
          </p>
        </div>

        <!-- 5.1: Requisitos do Sistema -->
        <div class="mb-14">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              5.1
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Engenharia de Requisitos do Sistema</h3>
          </div>

          <div class="mb-8">
            <h4 class="font-serif text-xl md:text-2xl font-semibold text-stone-900 mb-4">5.1.1 Requisitos Funcionais (RF01 a RF10)</h4>
            <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white">
              <table class="editorial-table text-xs md:text-sm">
                <thead>
                  <tr>
                    <th class="w-24 text-center">ID</th>
                    <th>Especificação do Requisito Funcional</th>
                    <th class="w-32 text-center">Prioridade</th>
                    <th>Critério Mensurável de Aceite</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF01</td>
                    <td class="font-semibold text-stone-900">Autenticação de usuários via Firebase Auth com persistência de sessão</td>
                    <td class="text-center"><span class="badge-chip bg-red-100 text-red-900">Alta</span></td>
                    <td>Login concluído em &lt; 2 s; sessão do aluno restaurada automaticamente ao recarregar o navegador.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF02</td>
                    <td class="font-semibold text-stone-900">Seleção de rota intermunicipal e câmpus de destino pelo estudante</td>
                    <td class="text-center"><span class="badge-chip bg-red-100 text-red-900">Alta</span></td>
                    <td>Perfil salvo no storage e refletido no mapa cartográfico em &lt; 500 ms.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF03</td>
                    <td class="font-semibold text-stone-900">Status One-Touch: "Em sala" (<code>in_class</code>), "Liberado" (<code>released</code>), "No ponto" (<code>at_stop</code>) e confirmação "Embarcado" (<code>boarded</code>)</td>
                    <td class="text-center"><span class="badge-chip bg-red-100 text-red-900">Alta</span></td>
                    <td>Alteração refletida no cockpit do motorista em tempo real (&lt; 100 ms).</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF04</td>
                    <td class="font-semibold text-stone-900">Mapa interativo Leaflet com posição do ônibus em movimento e pontos de parada</td>
                    <td class="text-center"><span class="badge-chip bg-red-100 text-red-900">Alta</span></td>
                    <td>Atualização suave da telemetria veicular a cada 5 segundos.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF05</td>
                    <td class="font-semibold text-stone-900">Transmissão colaborativa de GPS (motorista ou passageiro âncora a bordo)</td>
                    <td class="text-center"><span class="badge-chip bg-amber-100 text-amber-900">Média</span></td>
                    <td>Precisão geográfica &lt; 15 metros sem interrupção de rota.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF06</td>
                    <td class="font-semibold text-stone-900">Cockpit do motorista com contadores por faculdade e alerta sonoro sintetizado</td>
                    <td class="text-center"><span class="badge-chip bg-red-100 text-red-900">Alta</span></td>
                    <td>Disparo sonoro na cabine em &lt; 500 ms após liberação discente.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF07</td>
                    <td class="font-semibold text-stone-900">Sincronização reativa bidirecional via listeners <code>onSnapshot</code> do Firestore</td>
                    <td class="text-center"><span class="badge-chip bg-red-100 text-red-900">Alta</span></td>
                    <td>Latência ponta a ponta &lt; 100 ms em 4G/5G; &lt; 1 s em 3G.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF08</td>
                    <td class="font-semibold text-stone-900">Cálculo de Estimativa de Chegada (ETA) do veículo às paradas</td>
                    <td class="text-center"><span class="badge-chip bg-amber-100 text-amber-900">Média</span></td>
                    <td>Margem de erro &lt; 3 minutos a menos de 10 km do ponto.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF09</td>
                    <td class="font-semibold text-stone-900">Disparo de Geofencing (1.000 m) com notificação push aos passageiros</td>
                    <td class="text-center"><span class="badge-chip bg-amber-100 text-amber-900">Média</span></td>
                    <td>Notificação entregue no smartphone em tempo ≤ 2 segundos.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF10</td>
                    <td class="font-semibold text-stone-900">Protocolo de emergência "Fui Esquecido" com alerta prioritário e modo offline</td>
                    <td class="text-center"><span class="badge-chip bg-red-100 text-red-900">Alta</span></td>
                    <td>Sinalização visual e sonora contínua na cabine disparada em &lt; 1 segundo.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <!-- RNF -->
            <div class="lg:col-span-6 ds-card p-8 md:p-10">
              <h4 class="font-serif text-xl font-semibold text-stone-900 mb-4">Requisitos Não-Funcionais (RNF01 a RNF05)</h4>
              <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
                <table class="editorial-table text-xs md:text-sm">
                  <thead>
                    <tr>
                      <th class="w-24">ID</th>
                      <th class="w-40">Categoria</th>
                      <th>Métrica / Limite Aceitável</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-mono font-bold">RNF01</td>
                      <td class="font-semibold text-stone-900">Desempenho</td>
                      <td>Carregamento rápido em 3G/4G: FCP &lt; 1,8 s; TTI &lt; 2,5 s.</td>
                    </tr>
                    <tr>
                      <td class="font-mono font-bold">RNF02</td>
                      <td class="font-semibold text-stone-900">Disponibilidade</td>
                      <td>99,9% no período de operação rodoviária (15h00 às 23h30 em dias úteis).</td>
                    </tr>
                    <tr>
                      <td class="font-mono font-bold">RNF03</td>
                      <td class="font-semibold text-stone-900">Portabilidade</td>
                      <td>Execução plena em Android (Chrome 110+) e iOS (Safari 16.4+).</td>
                    </tr>
                    <tr>
                      <td class="font-mono font-bold">RNF04</td>
                      <td class="font-semibold text-stone-900">Usabilidade</td>
                      <td>Alvos de toque ≥ 48×48 px; contraste em conformidade com WCAG 2.1 AA.</td>
                    </tr>
                    <tr>
                      <td class="font-mono font-bold">RNF05</td>
                      <td class="font-semibold text-stone-900">Segurança & LGPD</td>
                      <td>HTTPS obrigatório; sem coleta de GPS do aluno; purga diária de presenças.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Stakeholders -->
            <div class="lg:col-span-6 ds-card p-8 md:p-10">
              <h4 class="font-serif text-xl font-semibold text-stone-900 mb-4">5.1.4 Stakeholders & Necessidades Elicitadas</h4>
              <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
                <table class="editorial-table text-xs md:text-sm">
                  <thead>
                    <tr>
                      <th class="w-48">Stakeholder</th>
                      <th>Necessidade Primária Elicitada</th>
                      <th class="w-48">Requisitos Vinculados</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-semibold text-stone-900">Estudantes</td>
                      <td>Visualizar localização do ônibus, avisar liberação com 1 toque e ser alertado na aproximação.</td>
                      <td class="font-mono text-emerald-800 font-semibold">RF03, RF04, RF08, RF09</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Motoristas</td>
                      <td>Cockpit ergonômico, contadores agregados por faculdade e alerta sonoro de emergência.</td>
                      <td class="font-mono text-emerald-800 font-semibold">RF06, RF10, RNF04</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Gestores Municipais</td>
                      <td>Evitar desperdício de diesel, garantir segurança noturna e conformidade legal com a LGPD.</td>
                      <td class="font-mono text-emerald-800 font-semibold">RF07, RNF05</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 5.1.2: Rastreabilidade de Requisitos -->
          <div class="mb-6">
            <h4 class="font-serif text-xl md:text-2xl font-semibold text-stone-900 mb-4">5.1.2 Matriz de Rastreabilidade Ponta a Ponta</h4>
            <p class="text-sm text-stone-600 mb-4">
              Mapeamento formal conectando cada Requisito ao seu pacote na EAP, arquivo de código-fonte no repositório e Caso de Teste correspondente:
            </p>
            <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white">
              <table class="editorial-table text-xs md:text-sm">
                <thead>
                  <tr>
                    <th class="w-24 text-center">Requisito</th>
                    <th class="w-28 text-center">Pacote EAP</th>
                    <th>Arquivo(s) de Código-Fonte no Repositório (src/)</th>
                    <th class="w-32 text-center">Caso de Teste</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF01</td>
                    <td class="text-center font-mono">1.2.1</td>
                    <td class="font-mono text-xs">src/context/AuthContext.jsx, src/components/AuthModal.jsx</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-01</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF02</td>
                    <td class="text-center font-mono">3.1.1</td>
                    <td class="font-mono text-xs">src/components/ProfileSetup.jsx, src/utils/routeUtils.js</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-02</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF03</td>
                    <td class="text-center font-mono">3.1.2</td>
                    <td class="font-mono text-xs">src/components/StatusToggle.jsx, src/utils/tripManager.js</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-03</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF04</td>
                    <td class="text-center font-mono">2.1.1</td>
                    <td class="font-mono text-xs">src/components/StudentMap.jsx, src/components/MapView.jsx</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-04</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF05</td>
                    <td class="text-center font-mono">2.2.2</td>
                    <td class="font-mono text-xs">src/components/GpsBroadcaster.jsx, src/utils/geo.js</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-05</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF06</td>
                    <td class="text-center font-mono">4.1.1</td>
                    <td class="font-mono text-xs">src/components/DriverDashboard.jsx, src/components/DriverCockpit.jsx</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-06</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF07</td>
                    <td class="text-center font-mono">1.3.1</td>
                    <td class="font-mono text-xs">src/services/firebase.js, firestore.rules</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-07</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF08</td>
                    <td class="text-center font-mono">3.2.1</td>
                    <td class="font-mono text-xs">src/utils/geo.js (cálculo Haversine & ETA)</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-08</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF09</td>
                    <td class="text-center font-mono">3.2.2</td>
                    <td class="font-mono text-xs">src/services/notifications.js, functions/geofence.js</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-09</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">RF10</td>
                    <td class="text-center font-mono">4.2.2, 5.1.1</td>
                    <td class="font-mono text-xs">src/components/EmergencyButton.jsx, public/sw.js</td>
                    <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-800 font-bold">CT-10</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 5.2: Arquitetura e Modelo NoSQL -->
        <div class="mb-14">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              5.2
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Arquitetura de Software & Modelo de Dados NoSQL</h3>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <!-- Diagrama Textual de Camadas -->
            <div class="lg:col-span-6 ds-card p-8 md:p-10">
              <h4 class="font-serif text-xl font-semibold text-stone-900 mb-4">5.2.1 Visão Geral da Arquitetura em Camadas</h4>
              <div class="p-5 bg-stone-900 text-stone-100 rounded-2xl font-mono text-xs md:text-sm mb-4 shadow-inner">
                <div class="text-emerald-400 font-bold mb-1">// CLIENTE PWA (React 19 + Tailwind CSS)</div>
                <div class="text-stone-300">┌────────────────────────────────────────────────────────┐</div>
                <div class="text-stone-300">│  Módulo Core       Módulo Cartografia   Módulo Cockpit │</div>
                <div class="text-stone-300">│  (Auth, Perfil,    (Leaflet 1.9,        (Contadores,   │</div>
                <div class="text-stone-300">│   Status One-Touch) Mapbox API Tiles)    Som, Socorro) │</div>
                <div class="text-stone-300">├────────────────────────────────────────────────────────┤</div>
                <div class="text-amber-300">│  Service Worker + IndexedDB │ Controlador de Geolocation│</div>
                <div class="text-stone-300">├────────────────────────────────────────────────────────┤</div>
                <div class="text-blue-300">│  Firebase: Auth · Firestore (onSnapshot) · FCM Push   │</div>
                <div class="text-stone-300">└────────────────────────────────────────────────────────┘</div>
              </div>
              <p class="text-xs md:text-sm text-stone-700">
                <strong>Interfaces Principais:</strong> Firestore SDK (WebSockets / real-time listeners), FCM (Push Notifications nativas), HTML5 Geolocation API (<code>watchPosition</code>) e Mapbox Raster/Vector Tiles via HTTPS.
              </p>
            </div>

            <!-- Modelo NoSQL Firestore -->
            <div class="lg:col-span-6 ds-card p-8 md:p-10">
              <h4 class="font-serif text-xl font-semibold text-stone-900 mb-4">Modelo NoSQL de Coleções (Cloud Firestore)</h4>
              <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
                <table class="editorial-table text-xs">
                  <thead>
                    <tr>
                      <th class="w-56">Coleção / Caminho</th>
                      <th>Campos Principais & Tipos</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-mono font-bold text-stone-900">routes</td>
                      <td><code>id, name, faculties[] (name, lat, lng, order), active</code></td>
                    </tr>
                    <tr>
                      <td class="font-mono font-bold text-stone-900">trips</td>
                      <td><code>tripId, routeId, driverUid, status, startedAt, endedAt</code></td>
                    </tr>
                    <tr class="bg-amber-50/50">
                      <td class="font-mono font-bold text-stone-900">trips/{tripId}/students</td>
                      <td>
                        <code>studentUid, name, faculty, status, updatedAt</code><br/>
                        <span class="text-[11px] text-amber-900 font-sans font-semibold">🔒 LGPD: Status operacional sem latitude/longitude privada do aluno.</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="font-mono font-bold text-stone-900">bus_location</td>
                      <td><code>tripId, lat, lng, speed, heading, updatedAt, broadcasterRole</code></td>
                    </tr>
                    <tr>
                      <td class="font-mono font-bold text-stone-900">emergencies</td>
                      <td><code>id, tripId, studentUid, studentName, faculty, active, createdAt</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 5.2.2: DIAGRAMAS OFICIAIS EM VETOR SVG ESCALÁVEL -->
          <div class="ds-card p-8 md:p-10 mb-8" id="diagramViewerCard">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
              <div>
                <span class="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider block mb-1">5.2.2 Diagramas Oficiais de Design de Software</span>
                <h4 class="font-serif text-2xl md:text-3xl text-stone-900">Diagramas Arquiteturais em Vetor SVG</h4>
              </div>

              <!-- Abas dos Diagramas SVG -->
              <div class="flex flex-wrap gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 text-xs font-medium">
                <button
                  onclick="selectDiagramTab('casos')"
                  id="tabBtn-casos"
                  class="px-4 py-2 rounded-xl bg-white text-stone-900 shadow-xs font-semibold transition-all"
                >
                  1. Casos de Uso
                </button>
                <button
                  onclick="selectDiagramTab('sequencia')"
                  id="tabBtn-sequencia"
                  class="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 transition-all font-medium"
                >
                  2. Sequência Realtime
                </button>
                <button
                  onclick="selectDiagramTab('componentes')"
                  id="tabBtn-componentes"
                  class="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 transition-all font-medium"
                >
                  3. Componentes PWA
                </button>
                <button
                  onclick="selectDiagramTab('modelo')"
                  id="tabBtn-modelo"
                  class="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 transition-all font-medium"
                >
                  4. Modelo NoSQL
                </button>
              </div>
            </div>

            <!-- Painel 1: Casos de Uso (SVG) -->
            <div id="diagTab-casos" class="diag-tab-panel">
              <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
                <p>
                  <strong>Casos de Uso:</strong> 10 Casos de Uso (UC01 a UC10) alinhados diretamente aos Requisitos Funcionais e diretrizes da LGPD.
                </p>
                <button onclick="togglePumlSource('casos')" class="text-stone-600 hover:text-stone-900 font-mono underline shrink-0">
                  Ver Código PlantUML
                </button>
              </div>

              <div class="svg-viewer-container mb-4">
                __SVG_CASOS__
              </div>

              <div id="pumlSource-casos" class="hidden bg-stone-900 text-stone-100 p-4 rounded-xl border border-stone-800">
                <div class="flex items-center justify-between mb-2 text-xs">
                  <span class="font-mono text-emerald-400">diagramas/casos-de-uso.puml</span>
                  <button onclick="copyPuml('casos')" class="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-mono text-xs">Copiar Código</button>
                </div>
                <pre class="font-mono text-xs text-stone-300 overflow-x-auto max-h-64 p-2" id="code-casos">__PUML_CASOS__</pre>
              </div>
            </div>

            <!-- Painel 2: Sequência (SVG) -->
            <div id="diagTab-sequencia" class="diag-tab-panel hidden">
              <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
                <p>
                  <strong>Sequência em Tempo Real:</strong> Liberação One-Touch pelo discente (sem retenção de coordenadas privadas) e broadcast veicular a cada 5 s.
                </p>
                <button onclick="togglePumlSource('sequencia')" class="text-stone-600 hover:text-stone-900 font-mono underline shrink-0">
                  Ver Código PlantUML
                </button>
              </div>

              <div class="svg-viewer-container mb-4">
                __SVG_SEQUENCIA__
              </div>

              <div id="pumlSource-sequencia" class="hidden bg-stone-900 text-stone-100 p-4 rounded-xl border border-stone-800">
                <div class="flex items-center justify-between mb-2 text-xs">
                  <span class="font-mono text-emerald-400">diagramas/sequencia-tempo-real.puml</span>
                  <button onclick="copyPuml('sequencia')" class="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-mono text-xs">Copiar Código</button>
                </div>
                <pre class="font-mono text-xs text-stone-300 overflow-x-auto max-h-64 p-2" id="code-sequencia">__PUML_SEQUENCIA__</pre>
              </div>
            </div>

            <!-- Painel 3: Componentes (SVG) -->
            <div id="diagTab-componentes" class="diag-tab-panel hidden">
              <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
                <p>
                  <strong>Arquitetura de Componentes:</strong> Cliente PWA (React 19 + Leaflet + Mapbox API Free Tier + Service Worker) e nuvem Firebase.
                </p>
                <button onclick="togglePumlSource('componentes')" class="text-stone-600 hover:text-stone-900 font-mono underline shrink-0">
                  Ver Código PlantUML
                </button>
              </div>

              <div class="svg-viewer-container mb-4">
                __SVG_COMPONENTES__
              </div>

              <div id="pumlSource-componentes" class="hidden bg-stone-900 text-stone-100 p-4 rounded-xl border border-stone-800">
                <div class="flex items-center justify-between mb-2 text-xs">
                  <span class="font-mono text-emerald-400">diagramas/componentes-arquitetura.puml</span>
                  <button onclick="copyPuml('componentes')" class="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-mono text-xs">Copiar Código</button>
                </div>
                <pre class="font-mono text-xs text-stone-300 overflow-x-auto max-h-64 p-2" id="code-componentes">__PUML_COMPONENTES__</pre>
              </div>
            </div>

            <!-- Painel 4: Modelo NoSQL (SVG) -->
            <div id="diagTab-modelo" class="diag-tab-panel hidden">
              <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
                <p>
                  <strong>Modelo de Dados NoSQL:</strong> Coleções <code>routes</code>, <code>trips</code>, <code>trip_students</code>, <code>bus_location</code> e <code>emergencies</code>.
                </p>
                <button onclick="togglePumlSource('modelo')" class="text-stone-600 hover:text-stone-900 font-mono underline shrink-0">
                  Ver Código PlantUML
                </button>
              </div>

              <div class="svg-viewer-container mb-4">
                __SVG_MODELO__
              </div>

              <div id="pumlSource-modelo" class="hidden bg-stone-900 text-stone-100 p-4 rounded-xl border border-stone-800">
                <div class="flex items-center justify-between mb-2 text-xs">
                  <span class="font-mono text-emerald-400">diagramas/modelo-dados-firestore.puml</span>
                  <button onclick="copyPuml('modelo')" class="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-mono text-xs">Copiar Código</button>
                </div>
                <pre class="font-mono text-xs text-stone-300 overflow-x-auto max-h-64 p-2" id="code-modelo">__PUML_MODELO__</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 5.3: Implementação e Integração -->
        <div class="mb-14">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              5.3
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Implementação & Integração de Componentes</h3>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <div class="lg:col-span-6 ds-card p-8 md:p-10">
              <h4 class="font-serif text-xl font-semibold text-stone-900 mb-4">5.3.1 Padrões de Codificação da Equipe</h4>
              <ul class="space-y-3 text-xs md:text-sm text-stone-700">
                <li class="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Componentes Funcionais com React Hooks:</strong> Uso exclusivo de funções puras com <code>useState</code>, <code>useEffect</code>, <code>useMemo</code> e <code>useCallback</code>.
                </li>
                <li class="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Imutabilidade Estrita:</strong> Sem mutação direta em arrays ou objetos de estado (uso de spread operators e cópias profundas).
                </li>
                <li class="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Tratamento de Desconexão:</strong> Blocos <code>try/catch</code> obrigatórios em toda chamada assíncrona, com fallback de estado explícito para IndexedDB.
                </li>
                <li class="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Qualidade Estática:</strong> ESLint e Oxlint sem warnings em nenhum arquivo submetido a PR.
                </li>
              </ul>
            </div>

            <div class="lg:col-span-6 ds-card p-8 md:p-10">
              <h4 class="font-serif text-xl font-semibold text-stone-900 mb-4">5.3.2 Plano Sequencial de Integração</h4>
              <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
                <table class="editorial-table text-xs md:text-sm">
                  <thead>
                    <tr>
                      <th class="w-16 text-center">Ordem</th>
                      <th>Passo de Integração</th>
                      <th class="w-32 text-center">Verificação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-center font-mono font-bold">1</td>
                      <td>Firebase Auth + Perfil do Aluno no Firestore</td>
                      <td class="text-center font-mono font-semibold">CT-01, CT-02</td>
                    </tr>
                    <tr>
                      <td class="text-center font-mono font-bold">2</td>
                      <td>Mapa Leaflet + Coleção <code>bus_location</code></td>
                      <td class="text-center font-mono font-semibold">CT-04</td>
                    </tr>
                    <tr>
                      <td class="text-center font-mono font-bold">3</td>
                      <td>Status do Aluno + Cockpit do Motorista (<code>onSnapshot</code>)</td>
                      <td class="text-center font-mono font-semibold">CT-03, CT-06, CT-07</td>
                    </tr>
                    <tr>
                      <td class="text-center font-mono font-bold">4</td>
                      <td>Geolocalização + Broadcast GPS (Motorista/Âncora)</td>
                      <td class="text-center font-mono font-semibold">CT-05</td>
                    </tr>
                    <tr>
                      <td class="text-center font-mono font-bold">5</td>
                      <td>Motor de Geofencing + Notificações Push FCM</td>
                      <td class="text-center font-mono font-semibold">CT-09</td>
                    </tr>
                    <tr>
                      <td class="text-center font-mono font-bold">6</td>
                      <td>Service Worker + IndexedDB sobre todo o fluxo</td>
                      <td class="text-center font-mono font-semibold">CT-10</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 5.4: V&V e Relatório de Testes -->
        <div class="mb-14">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              5.4
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Verificação, Validação & Transição (10 Casos de Teste)</h3>
          </div>

          <div class="mb-8">
            <h4 class="font-serif text-xl md:text-2xl font-semibold text-stone-900 mb-4">5.4.3 Relatório dos 10 Casos de Teste de Aceitação (CT-01 a CT-10)</h4>
            <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white">
              <table class="editorial-table text-xs md:text-sm">
                <thead>
                  <tr>
                    <th class="w-24 text-center">Código</th>
                    <th class="w-28 text-center">Requisito</th>
                    <th>Procedimento Executado</th>
                    <th>Resultado Esperado</th>
                    <th class="w-32 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-01</td>
                    <td class="text-center font-mono">RF01</td>
                    <td>Login de usuário e recarga subsequente da página.</td>
                    <td>Sessão mantida persistida; autenticação em &lt; 2 s.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-02</td>
                    <td class="text-center font-mono">RF02</td>
                    <td>Escolher rota piloto intermunicipal e câmpus UFG Samambaia.</td>
                    <td>Perfil salvo no Firestore; mapa centraliza o câmpus em &lt; 500 ms.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-03</td>
                    <td class="text-center font-mono">RF03, RF07</td>
                    <td>Aluno toca no botão "Liberado" sob rede móvel 4G.</td>
                    <td>Cockpit da cabine atualiza contador em &lt; 100 ms.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-04</td>
                    <td class="text-center font-mono">RF04</td>
                    <td>Deslocamento veicular com atualização GPS a cada 5 s.</td>
                    <td>Marcador de ônibus move-se suavemente no mapa Leaflet.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-05</td>
                    <td class="text-center font-mono">RF05</td>
                    <td>Simulação de bateria fraca e passagem de broadcast ao passageiro âncora.</td>
                    <td>Precisão &lt; 15 m mantida sem interrupção de telemetria.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-06</td>
                    <td class="text-center font-mono">RF06</td>
                    <td>Liberação de aluno com cockpit ativo no suporte do painel.</td>
                    <td>Contador incrementa visualmente e alerta sonoro é emitido.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-07</td>
                    <td class="text-center font-mono">RF07</td>
                    <td>Disparo simultâneo de 50 escritas concorrentes no Firestore.</td>
                    <td>Zero perda de dados; latência média aferida em &lt; 150 ms.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-08</td>
                    <td class="text-center font-mono">RF08</td>
                    <td>Aferição de ETA com veículo a 5 km do câmpus.</td>
                    <td>Erro de estimativa inferior a 2 minutos em relação ao horário real.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-09</td>
                    <td class="text-center font-mono">RF09</td>
                    <td>Aproximação do ônibus ao perímetro de 1.000 m da parada.</td>
                    <td>Notificação push entregue no smartphone do aluno em &lt; 2 s.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-900">CT-10</td>
                    <td class="text-center font-mono">RF10</td>
                    <td>Acionamento do botão "Fui Esquecido" com perda simulada de sinal 4G.</td>
                    <td>Alarme contínuo na cabine e mapa navegável offline via cache SW.</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Aprovado</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <!-- Ensaio em Campo Rodoviário -->
            <div class="lg:col-span-7 ds-card p-8 md:p-10 bg-emerald-50/40 border-emerald-300/60">
              <div class="flex items-center gap-3 mb-3">
                <iconify-icon icon="solar:bus-bold" class="text-emerald-800" width="24"></iconify-icon>
                <h4 class="font-serif text-xl font-semibold text-emerald-950">Relato do Ensaio Empírico em Rota Rodoviária Real</h4>
              </div>
              <p class="text-sm text-stone-700 leading-relaxed mb-4">
                Realizado no dia <strong>24/10/2026 das 16h30 às 22h45</strong> no trajeto intermunicipal real com <strong>1 motorista profissional e 15 estudantes universitários voluntários</strong>.
              </p>
              <ul class="space-y-2 text-xs md:text-sm text-stone-800">
                <li>• <strong>100% de Liberações Entregues:</strong> Todas as alterações de status ("Liberado") chegaram com sucesso à cabine do motorista.</li>
                <li>• <strong>Resiliência à Perda de Sinal:</strong> Nos trechos rodoviários sem 4G, a camada IndexedDB reteve as ações localmente sem travamentos e descarregou o lote assim que a conexão restabeleceu.</li>
                <li>• <strong>Usabilidade do Cockpit:</strong> O motorista avaliou positivamente os contrastes e informou que os alertas sonoros permitiram conduzir sem desviar os olhos da pista.</li>
              </ul>
            </div>

            <!-- 5.4.4: Plano de Transição -->
            <div class="lg:col-span-5 ds-card p-8 md:p-10">
              <h4 class="font-serif text-xl font-semibold text-stone-900 mb-4">5.4.4 Plano de Transição & Implantação</h4>
              <ol class="space-y-2.5 text-xs md:text-sm text-stone-700">
                <li class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Fase 1:</strong> Publicação da versão <code>v1.0.0</code> na Vercel com espelho no Firebase Hosting após 100% dos testes aprovados.
                </li>
                <li class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Fase 2:</strong> Piloto controlado na primeira rota intermunicipal com acompanhamento presencial da equipe.
                </li>
                <li class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Fase 3:</strong> Treinamento operacional do motorista (30 min) e distribuição do cartaz com QR Code aos alunos.
                </li>
                <li class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Fase 4:</strong> Expandir para as demais rotas intermunicipais consorciadas.
                </li>
                <li class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Fase 5:</strong> Handoff definitivo às prefeituras parceiras sob Termo de Cessão de Uso.
                </li>
              </ol>
            </div>
          </div>
        </div>

        <!-- 5.5: Operação, Manutenção e Descontinuação -->
        <div>
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              5.5
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Operação, Manutenção & Descontinuação LGPD</h3>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <!-- 5.5.1: Monitoramento -->
            <div class="lg:col-span-6 ds-card p-8 md:p-10">
              <h4 class="font-serif text-xl font-semibold text-stone-900 mb-4">5.5.1 Procedimentos de Monitoramento Operacional</h4>
              <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
                <table class="editorial-table text-xs md:text-sm">
                  <thead>
                    <tr>
                      <th>Indicador Monitorado</th>
                      <th>Método de Inspeção</th>
                      <th>Gatilho de Alarme</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-semibold text-stone-900">Disponibilidade (15h–23h30)</td>
                      <td>Uptime bot e console Vercel</td>
                      <td class="whitespace-nowrap">Indisponível &gt; 15 min (RTO)</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Latência Realtime (QM-01)</td>
                      <td>Delta de timestamps nos listeners</td>
                      <td class="whitespace-nowrap">Latência &gt; 2.000 ms</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Cota Diária Firebase</td>
                      <td>Console Cloud Firestore</td>
                      <td class="whitespace-nowrap">Consumo atingir 70%</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Ping do GPS Veicular</td>
                      <td>Campo <code>updatedAt</code> em <code>bus_location</code></td>
                      <td class="whitespace-nowrap">Sem sinal por &gt; 3 min</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Disparo de Push FCM</td>
                      <td>Logs de envio do Firebase Messaging</td>
                      <td class="whitespace-nowrap">Falhas consecutivas no lote</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 5.5.2 e 5.5.3: Manutenção e Descontinuação -->
            <div class="lg:col-span-6 space-y-6">
              <div class="ds-card p-8">
                <h4 class="font-serif text-xl font-semibold text-stone-900 mb-3">5.5.2 Plano de Manutenção</h4>
                <ul class="space-y-2 text-xs md:text-sm text-stone-700">
                  <li>• <strong>Corretiva:</strong> Resolução de bugs e oscilações de telemetria (Crítico ≤ 2 h; Alto ≤ 24 h).</li>
                  <li>• <strong>Preventiva:</strong> Auditoria <code>npm audit</code> e atualização quinzenal do Firebase SDK.</li>
                  <li>• <strong>Adaptativa:</strong> Adequação a alterações no calendário acadêmico ou obras viárias.</li>
                  <li>• <strong>Evolutiva:</strong> Implementação de otimização de consumo de bateria em viagens longas.</li>
                </ul>
              </div>

              <div class="ds-card p-8 bg-stone-50 border-stone-300">
                <h4 class="font-serif text-xl font-semibold text-stone-900 mb-3">5.5.3 Estratégia de Descontinuação & Purga LGPD</h4>
                <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
                  <table class="editorial-table text-xs">
                    <thead>
                      <tr>
                        <th class="w-16">Fase</th>
                        <th class="w-32">Prazo</th>
                        <th>Ação Formal de Encerramento</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="font-mono font-bold">1</td>
                        <td class="font-mono whitespace-nowrap">90 dias antes</td>
                        <td>Comunicação formal às secretarias municipais e associações discentes.</td>
                      </tr>
                      <tr>
                        <td class="font-mono font-bold">2</td>
                        <td class="font-mono whitespace-nowrap">60 dias antes</td>
                        <td>Exportação dos relatórios agregados de frequência em CSV/JSON para arquivo público.</td>
                      </tr>
                      <tr>
                        <td class="font-mono font-bold">3</td>
                        <td class="font-mono whitespace-nowrap">30 dias antes</td>
                        <td>Bloqueio de novos cadastros e exibição de aviso informativo no PWA.</td>
                      </tr>
                      <tr>
                        <td class="font-mono font-bold">4</td>
                        <td class="font-mono text-red-900 font-bold whitespace-nowrap">Encerramento</td>
                        <td><strong>Purga definitiva (LGPD):</strong> Exclusão total de dados cadastrais no Firestore, revogação de tokens e arquivamento do repositório.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
"""
