# -*- coding: utf-8 -*-
POPS_AND_FOOTER_HTML = """
      <!-- SEÇÃO 8: POPS DETALHADOS & SIMULADOR INTERATIVO DO PRODUTO -->
      <section
        id="sec-pop"
        class="ds-section py-20 border-b border-stone-300/60"
      >
        <div class="mb-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-800 text-stone-100 text-xs font-mono font-semibold mb-3">
            <iconify-icon icon="solar:checklist-minimalistic-bold" width="16"></iconify-icon>
            <span>POPs & Simulação</span>
          </div>
          <h2 class="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">Procedimentos Operacionais (POPs) & Simulador da UI</h2>
          <p class="text-stone-600 mt-2 max-w-3xl text-base">
            Detalhamento normativo dos quatro POPs operacionais e demonstração interativa dos componentes reativos de ponta a ponta do Rhyme.
          </p>
        </div>

        <!-- 4 POPs Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
          <!-- POP-DEV-01 -->
          <div class="ds-card p-8 border-l-4 border-l-stone-900">
            <div class="flex items-center justify-between mb-4">
              <span class="badge-chip bg-stone-900 text-stone-100 text-xs">POP-DEV-01</span>
              <span class="text-xs text-stone-500 font-mono">Governança de Código</span>
            </div>
            <h4 class="font-serif text-xl font-semibold text-stone-900 mb-3">Desenvolvimento & Fluxo de Branches</h4>
            <ul class="space-y-2 text-xs md:text-sm text-stone-700">
              <li>1. <strong>Isolamento Temático:</strong> Criar branch <code>feature/nome-tarefa</code> ou <code>fix/nome-bug</code> a partir da <code>main</code> atualizada.</li>
              <li>2. <strong>Conventional Commits:</strong> Mensagens no padrão <code>tipo(escopo): descrição imperativa</code>.</li>
              <li>3. <strong>Validação Local:</strong> Executar <code>npm run lint</code> e <code>npm run test</code> com zero falhas antes do push.</li>
              <li>4. <strong>Revisão de Código:</strong> Abrir PR no GitHub exigindo aprovação de pelo menos um par técnico antes do merge linear (Squash & Merge).</li>
            </ul>
          </div>

          <!-- POP-OPS-01 -->
          <div class="ds-card p-8 border-l-4 border-l-blue-600">
            <div class="flex items-center justify-between mb-4">
              <span class="badge-chip bg-blue-600 text-white text-xs">POP-OPS-01</span>
              <span class="text-xs text-stone-500 font-mono">Deploy & Automação</span>
            </div>
            <h4 class="font-serif text-xl font-semibold text-stone-900 mb-3">Pipeline de Deploy & Segurança Firebase</h4>
            <ul class="space-y-2 text-xs md:text-sm text-stone-700">
              <li>1. <strong>Gatilho Automatizado:</strong> Ao efetuar merge na <code>main</code>, GitHub Actions dispara a esteira de build e testes.</li>
              <li>2. <strong>Validação de Regras:</strong> O Firebase Emulator valida sintática e logicamente o arquivo <code>firestore.rules</code>.</li>
              <li>3. <strong>Deploy Contínuo:</strong> Publicação do bundle otimizado na Vercel Edge Network e espelho no Firebase Hosting.</li>
              <li>4. <strong>Teste de Fumaça:</strong> Checagem de handshake com Firestore e carregamento dos tiles Mapbox em smartphone piloto.</li>
            </ul>
          </div>

          <!-- POP-GEO-01 -->
          <div class="ds-card p-8 border-l-4 border-l-emerald-600">
            <div class="flex items-center justify-between mb-4">
              <span class="badge-chip bg-emerald-700 text-white text-xs">POP-GEO-01</span>
              <span class="text-xs text-stone-500 font-mono">Cartografia & Geofencing</span>
            </div>
            <h4 class="font-serif text-xl font-semibold text-stone-900 mb-3">Calibração de Geofencing & Notificação Push</h4>
            <ul class="space-y-2 text-xs md:text-sm text-stone-700">
              <li>1. <strong>Cálculo Haversine:</strong> A cada coordenada transmitida pelo veículo, recalcular a distância esférica até as paradas autorizadas.</li>
              <li>2. <strong>Gatilho de Perímetro:</strong> Disparar notificação push quando a distância for menor ou igual a 1.000 metros (1 km).</li>
              <li>3. <strong>Anti-Spam (Debounce):</strong> Limitar o envio a uma única notificação por aluno por viagem diária.</li>
              <li>4. <strong>SLA de Entrega:</strong> Garantir tempo total de entrega do alerta no aparelho em ≤ 2 segundos.</li>
            </ul>
          </div>

          <!-- POP-EMERG-01 -->
          <div class="ds-card p-8 border-l-4 border-l-red-600">
            <div class="flex items-center justify-between mb-4">
              <span class="badge-chip bg-red-600 text-white text-xs">POP-EMERG-01</span>
              <span class="text-xs text-stone-500 font-mono">Contingência Veicular</span>
            </div>
            <h4 class="font-serif text-xl font-semibold text-stone-900 mb-3">Protocolo "Fui Esquecido" & Chaveamento Âncora</h4>
            <ul class="space-y-2 text-xs md:text-sm text-stone-700">
              <li>1. <strong>Acionamento do Botão:</strong> Estudante toca no botão vermelho de emergência; registro gravado em <code>emergencies</code>.</li>
              <li>2. <strong>Alarme na Cabine:</strong> O cockpit emite alarme sonoro persistente e flash visual em tela cheia até confirmação do motorista.</li>
              <li>3. <strong>Modo Bateria Fraca:</strong> Caso o celular do motorista atinja 5%, a tela exibe código de passagem.</li>
              <li>4. <strong>Passageiro Âncora:</strong> Um estudante selecionado a bordo ativa o modo broadcast assumindo o envio de GPS veicular com precisão &lt; 15 m.</li>
            </ul>
          </div>
        </div>

        <!-- SIMULADOR INTERATIVO DO PRODUTO (DESIGN-TASTE-FRONTEND) -->
        <div class="ds-card p-8 md:p-12 bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-stone-100 mb-14 border-stone-700 shadow-2xl">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-5 border-b border-stone-800">
            <div>
              <span class="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">Demonstração Interativa em Tempo Real</span>
              <h3 class="font-serif text-2xl md:text-3xl text-[#E6E3D6]">Simulador do Fluxo Reativo: Aluno ➔ Cabine do Motorista</h3>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs font-mono text-emerald-400 font-semibold">WebSocket Simulado Conectado</span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <!-- Coluna 1: Smartphone do Aluno (One-Touch) -->
            <div class="lg:col-span-6 bg-stone-800/90 rounded-2xl p-6 md:p-8 border border-stone-700">
              <div class="flex items-center justify-between mb-5">
                <span class="text-xs font-mono text-stone-400 font-bold uppercase tracking-wider">Interface do Aluno (PWA)</span>
                <span class="text-xs font-mono px-2.5 py-1 rounded bg-stone-700 text-stone-300">UFG Samambaia</span>
              </div>

              <p class="text-xs md:text-sm text-stone-300 mb-5 leading-relaxed">
                Toque nos botões abaixo para simular a mudança de status do passageiro:
              </p>

              <div class="grid grid-cols-2 gap-3 mb-6">
                <button
                  onclick="setSimStatus('in_class')"
                  id="simBtn-in_class"
                  class="p-3.5 rounded-xl border border-stone-600 bg-stone-700/50 hover:bg-stone-700 text-xs md:text-sm font-medium text-stone-300 flex items-center justify-center gap-2 transition-all"
                >
                  <iconify-icon icon="solar:book-linear" width="18"></iconify-icon>
                  <span>1. Em Sala</span>
                </button>

                <button
                  onclick="setSimStatus('released')"
                  id="simBtn-released"
                  class="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-600 text-xs md:text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <iconify-icon icon="solar:check-circle-bold" width="18"></iconify-icon>
                  <span>2. Liberado!</span>
                </button>

                <button
                  onclick="setSimStatus('at_stop')"
                  id="simBtn-at_stop"
                  class="p-3.5 rounded-xl border border-stone-600 bg-stone-700/50 hover:bg-stone-700 text-xs md:text-sm font-medium text-stone-300 flex items-center justify-center gap-2 transition-all"
                >
                  <iconify-icon icon="solar:map-point-wave-linear" width="18"></iconify-icon>
                  <span>3. No Ponto</span>
                </button>

                <button
                  onclick="setSimStatus('boarded')"
                  id="simBtn-boarded"
                  class="p-3.5 rounded-xl border border-stone-600 bg-stone-700/50 hover:bg-stone-700 text-xs md:text-sm font-medium text-stone-300 flex items-center justify-center gap-2 transition-all"
                >
                  <iconify-icon icon="solar:bus-bold" width="18"></iconify-icon>
                  <span>4. Embarcado</span>
                </button>
              </div>

              <div class="p-4 bg-stone-900 rounded-xl border border-stone-800 text-xs font-mono text-stone-400">
                <div class="text-stone-500 mb-1">// Payload Gravado no Firestore (Sem GPS privado - LGPD)</div>
                <div id="simPayloadJson" class="text-emerald-400">
{ "status": "released", "updatedAt": "2026-11-26T21:40:00Z" }
                </div>
              </div>
            </div>

            <!-- Coluna 2: Cockpit do Motorista na Cabine -->
            <div class="lg:col-span-6 bg-stone-800/90 rounded-2xl p-6 md:p-8 border border-stone-700">
              <div class="flex items-center justify-between mb-5">
                <span class="text-xs font-mono text-stone-400 font-bold uppercase tracking-wider">Cockpit do Motorista (Cabine 12V)</span>
                <span class="text-xs font-mono px-3 py-1 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">Em Trânsito • Rodovia Intermunicipal</span>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-5">
                <div class="p-5 bg-stone-900/90 rounded-2xl border border-stone-700 text-center">
                  <span class="text-xs font-mono text-stone-400 uppercase tracking-wider block mb-1">UFG Samambaia</span>
                  <div class="text-5xl font-bold font-mono text-emerald-400 my-1" id="cockpitCounterSamambaia">14</div>
                  <span class="text-xs text-stone-400">alunos liberados</span>
                </div>

                <div class="p-5 bg-stone-900/90 rounded-2xl border border-stone-700 text-center">
                  <span class="text-xs font-mono text-stone-400 uppercase tracking-wider block mb-1">PUC Goiás (Área 1)</span>
                  <div class="text-5xl font-bold font-mono text-amber-400 my-1" id="cockpitCounterPuc">8</div>
                  <span class="text-xs text-stone-400">alunos liberados</span>
                </div>
              </div>

              <div class="p-4 bg-stone-900 rounded-xl border border-stone-800 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <iconify-icon icon="solar:bell-bing-bold" width="18"></iconify-icon>
                  </div>
                  <div>
                    <span class="text-xs md:text-sm font-semibold text-stone-200 block" id="cockpitAlertText">Alerta Sonoro: Aluno acabou de liberar!</span>
                    <span class="text-xs text-stone-400 font-mono">Latência aferida: 48 ms (&lt; 100 ms)</span>
                  </div>
                </div>
                <button
                  onclick="triggerTestAudioAlert()"
                  class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-mono transition-colors border border-stone-700"
                >
                  Tocar Som
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Referências Bibliográficas -->
        <div id="referencias">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              Ref
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Referências Bibliográficas & Normativas</h3>
          </div>

          <div class="ds-card p-8 bg-white">
            <ol class="space-y-2.5 text-xs md:text-sm text-stone-700 list-decimal pl-5">
              <li><strong>ISO/IEC/IEEE 12207:2017:</strong> Systems and software engineering — Software life cycle processes. International Organization for Standardization, Geneva, Switzerland.</li>
              <li><strong>SCHWABER, Ken; SUTHERLAND, Jeff:</strong> The Scrum Guide: The Definitive Guide to Scrum: The Rules of the Game. Scrum.org, 2020.</li>
              <li><strong>ANDERSON, David J.:</strong> Kanban: Successful Evolutionary Change for Your Technology Business. Blue Hole Press, 2010.</li>
              <li><strong>BRASIL:</strong> Lei nº 13.709, de 14 de agosto de 2018. Dispõe sobre a proteção de dados pessoais (Lei Geral de Proteção de Dados Pessoais - LGPD). Diário Oficial da União, Brasília, DF.</li>
              <li><strong>GOOGLE FIREBASE:</strong> Cloud Firestore Documentation and Security Rules Guide. Google Cloud, 2026.</li>
              <li><strong>MAPBOX:</strong> Mapbox Vector and Raster Tile API Reference. Mapbox Inc., 2026.</li>
            </ol>
          </div>
        </div>
      </section>

      <!-- RODAPÉ FINAL DA PÁGINA -->
      <footer class="py-14 border-t border-stone-300/60 text-center text-sm text-stone-600 font-sans">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg bg-stone-900 text-[#E6E3D6] flex items-center justify-center font-bold text-xs">
              R
            </div>
            <span class="font-bold text-stone-800">Rhyme Telemetria</span>
            <span>•</span>
            <span>Manual de Processos de Software v8.0 Oficial</span>
          </div>

          <div class="text-stone-500 text-xs">
            Grupo 12 • UFG Instituto de Informática • INF0449 Semestre 2026/2
          </div>
        </div>
      </footer>
    </main>

    <!-- MODAL DE BUSCA GLOBAL (Ctrl+K) -->
    <div
      id="searchModal"
      class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-24 px-4 opacity-0 pointer-events-none transition-opacity duration-200"
    >
      <div
        class="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden transform scale-95 transition-transform duration-200"
        id="searchModalBox"
      >
        <div class="p-5 border-b border-stone-200 flex items-center gap-3.5">
          <iconify-icon icon="solar:magnifer-linear" class="text-stone-400" width="22"></iconify-icon>
          <input
            type="text"
            id="searchInput"
            placeholder="Buscar requisitos (ex: RF03), testes (CT-05), riscos, ADRs..."
            class="w-full bg-transparent outline-none text-stone-800 placeholder-stone-400 text-base font-sans"
            oninput="handleSearch(this.value)"
          />
          <button onclick="closeSearchModal()" class="text-stone-400 hover:text-stone-700 text-xs font-mono px-2.5 py-1 rounded bg-stone-100">ESC</button>
        </div>

        <div class="p-4 max-h-80 overflow-y-auto space-y-2" id="searchResults">
          <div class="p-3 text-xs md:text-sm text-stone-500 text-center">
            Digite para pesquisar em todos os capítulos do manual...
          </div>
        </div>
      </div>
    </div>
"""
