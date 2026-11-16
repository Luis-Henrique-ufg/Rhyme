# -*- coding: utf-8 -*-
CAPA_AND_HISTORICO_HTML = """
    <!-- MAIN CONTAINER -->
    <main class="print-container max-w-7xl mx-auto px-6 md:px-10 py-10" id="top">

      <!-- SEÇÃO 1: CAPA OFICIAL & SQUAD RHYME CORE -->
      <section
        id="capa"
        class="ds-section pt-8 pb-20 border-b border-stone-300/60"
      >
        <!-- Cabeçalho Acadêmico UFG -->
        <div
          class="w-full flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-stone-800/10 gap-4"
        >
          <div>
            <span
              class="text-xs font-bold tracking-[0.18em] uppercase text-stone-500 font-sans block mb-1.5"
            >
              Universidade Federal de Goiás • Instituto de Informática (INF)
            </span>
            <p class="text-base font-semibold text-stone-800 font-sans">
              INF0449 • Processos de Engenharia de Software • Semestre 2026/2
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-400/30 bg-white/70 text-xs font-sans text-stone-800 shadow-xs">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span class="font-medium">Versão Oficial 8.0 • 29/10/2026</span>
            </span>
            <span class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-stone-400/30 bg-stone-100/80 text-xs font-mono text-stone-800">
              <iconify-icon icon="solar:clock-circle-bold" class="text-amber-600" width="16"></iconify-icon>
              <span>Apresentação: 26/11/2026 (20–30 min)</span>
            </span>
          </div>
        </div>

        <!-- Hero Visual Central -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-12">
          <div class="lg:col-span-7 flex flex-col items-start">
            <div
              class="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-emerald-700/20 bg-emerald-50 text-xs text-emerald-900 mb-6 font-sans font-semibold"
            >
              <iconify-icon icon="solar:shield-check-bold" class="text-emerald-700" width="18"></iconify-icon>
              <span>Referencial Normativo: ISO/IEC/IEEE 12207:2017</span>
            </div>

            <h1
              class="text-5xl md:text-7xl lg:text-8xl leading-[0.98] tracking-tight text-stone-900 mb-6 font-serif font-light"
            >
              <span class="block text-stone-500 italic font-serif">Manual de</span>
              Processos
              <span class="block text-stone-900">
                de Software
                <span class="text-emerald-700 font-sans font-bold text-4xl md:text-5xl align-top">v8.0</span>
              </span>
            </h1>

            <p class="text-2xl text-stone-800 font-serif italic mb-4 leading-relaxed">
              Rhyme — Gestão e Telemetria em Tempo Real de Transporte Universitário Intermunicipal
            </p>

            <p
              class="text-base md:text-lg text-stone-600 max-w-2xl leading-relaxed mb-8 font-sans font-normal"
            >
              Governança integral, processos de acordo, infraestrutura reativa, ciclo de vida híbrido, gerenciamento técnico, especificação formal de requisitos, arquitetura NoSQL e melhoria contínua de processos de software.
            </p>

            <div class="flex flex-wrap items-center gap-4">
              <a
                href="#sec1"
                class="px-8 py-4 bg-stone-900 text-[#E6E3D6] rounded-full text-sm font-medium flex items-center gap-3 hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl"
              >
                <span>Explorar Manual Completo</span>
                <iconify-icon icon="solar:arrow-right-linear" width="18"></iconify-icon>
              </a>
              <a
                href="#historico"
                class="px-7 py-4 bg-white border border-stone-800/15 text-stone-800 rounded-full text-sm font-medium hover:bg-stone-50 transition-colors shadow-xs"
              >
                <span>Histórico de Versões</span>
              </a>
            </div>
          </div>

          <!-- Ticket Card Oficial do Squad Rhyme Core -->
          <div class="lg:col-span-5 flex justify-center lg:justify-end">
            <div
              class="w-full max-w-md bg-stone-900 text-stone-100 shadow-2xl rounded-3xl overflow-hidden border border-stone-800 transform hover:-translate-y-1 transition-transform duration-300"
            >
              <div class="p-7 border-b border-stone-800 flex justify-between items-start bg-gradient-to-r from-stone-900 to-stone-850">
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1.5 font-sans">
                    Grupo 12 • UFG INF0449
                  </p>
                  <h3 class="font-serif text-3xl text-[#E6E3D6] leading-tight">Squad Rhyme Core</h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <iconify-icon icon="solar:bus-bold" width="28"></iconify-icon>
                </div>
              </div>

              <div class="p-7 space-y-4 text-xs font-sans">
                <p class="text-xs font-bold uppercase tracking-widest text-stone-400 font-sans mb-1">
                  Composição da Equipe & Atribuições Formais
                </p>

                <div class="p-3.5 bg-stone-800/80 rounded-2xl border border-stone-700/60 flex items-center justify-between">
                  <div>
                    <span class="block font-semibold text-stone-100 text-sm">Matheus Marquez de Carvalho Rodrigues</span>
                    <span class="text-stone-400 text-xs">Requisitos e Produto</span>
                  </div>
                  <span class="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full font-mono text-xs font-semibold border border-amber-500/30 whitespace-nowrap">PO / Req</span>
                </div>

                <div class="p-3.5 bg-stone-800/80 rounded-2xl border border-stone-700/60 flex items-center justify-between">
                  <div>
                    <span class="block font-semibold text-stone-100 text-sm">Luis Henrique Oliveira de Jesus</span>
                    <span class="text-stone-400 text-xs">Arquitetura e Frontend</span>
                  </div>
                  <span class="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-mono text-xs font-semibold border border-emerald-500/30 whitespace-nowrap">Tech Lead / Arq</span>
                </div>

                <div class="p-3.5 bg-stone-800/80 rounded-2xl border border-stone-700/60 flex items-center justify-between">
                  <div>
                    <span class="block font-semibold text-stone-100 text-sm">Heitor Gonçalves Costa</span>
                    <span class="text-stone-400 text-xs">Infraestrutura, Nuvem e DevOps</span>
                  </div>
                  <span class="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full font-mono text-xs font-semibold border border-blue-500/30 whitespace-nowrap">DevOps / Cloud</span>
                </div>

                <div class="p-3.5 bg-stone-800/80 rounded-2xl border border-stone-700/60 flex items-center justify-between">
                  <div>
                    <span class="block font-semibold text-stone-100 text-sm">Carlos Daniel Lopes de Araújo</span>
                    <span class="text-stone-400 text-xs">Qualidade (SQA), Verificação e Validação</span>
                  </div>
                  <span class="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full font-mono text-xs font-semibold border border-purple-500/30 whitespace-nowrap">SQA / V&V</span>
                </div>

                <div class="pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                  <span>Data da Apresentação Oficial:</span>
                  <span class="font-mono text-stone-200 font-bold">26/11/2026 (20 a 30 min)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rodapé da Capa -->
        <div class="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-stone-300/40 text-xs text-stone-600 gap-3">
          <div class="flex items-center gap-3">
            <span class="font-mono font-bold text-stone-800">ISO/IEC/IEEE 12207:2017</span>
            <span>•</span>
            <span>6 Capítulos Normativos</span>
            <span>•</span>
            <span class="text-emerald-700 font-semibold">100% dos Casos de Teste Aprovados</span>
          </div>
          <div class="text-stone-500">
            Apresentação: Grupo 12 • Todos os membros
          </div>
        </div>
      </section>

      <!-- CONTRACAPA: HISTÓRICO DE VERSÕES -->
      <section
        id="historico"
        class="ds-section py-20 border-b border-stone-300/60"
      >
        <div class="mb-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200 text-stone-700 text-xs font-mono font-semibold mb-3">
            <iconify-icon icon="solar:history-bold" width="15"></iconify-icon>
            <span>Contracapa Oficial</span>
          </div>
          <h2 class="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">Histórico de Versões do Manual</h2>
          <p class="text-stone-600 mt-2 max-w-3xl text-base">
            Registro formal da evolução do manual ao longo das entregas da disciplina, culminando na reestruturação integral da versão 8.0 em 6 capítulos normativos conforme a Atividade.
          </p>
        </div>

        <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white">
          <table class="editorial-table">
            <thead>
              <tr>
                <th class="w-24 text-center">Versão</th>
                <th class="w-36 text-center">Data</th>
                <th>Alteração & Escopo Entregue</th>
                <th class="w-40 text-center">Marco Acadêmico</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-center font-mono font-bold text-stone-800">1.0</td>
                <td class="text-center font-mono text-stone-600">10/09/2026</td>
                <td>Apresentação do software, escopo, formulação do problema, premissas e restrições iniciais.</td>
                <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-700">Etapa 0</span></td>
              </tr>
              <tr>
                <td class="text-center font-mono font-bold text-stone-800">2.0</td>
                <td class="text-center font-mono text-stone-600">17/09/2026</td>
                <td>Processos de Acordo (aquisição Make vs. Buy, fornecimento, acordos de nível de serviço SLA, POPs operacionais).</td>
                <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-700">Etapa 1</span></td>
              </tr>
              <tr>
                <td class="text-center font-mono font-bold text-stone-800">3.0</td>
                <td class="text-center font-mono text-stone-600">17/09/2026</td>
                <td>Processos Organizacionais (modelo de ciclo de vida, infraestrutura e ferramentas, matriz RACI, plano da qualidade).</td>
                <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-700">Etapa 2</span></td>
              </tr>
              <tr>
                <td class="text-center font-mono font-bold text-stone-800">4.0</td>
                <td class="text-center font-mono text-stone-600">01/10/2026</td>
                <td>Gerenciamento Técnico (EAP em 3 níveis, gestão de riscos, registro de decisões técnicas ADRs, gestão de configuração).</td>
                <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-700">Etapa 3</span></td>
              </tr>
              <tr>
                <td class="text-center font-mono font-bold text-stone-800">5.0</td>
                <td class="text-center font-mono text-stone-600">01/10/2026</td>
                <td>Processos Técnicos (engenharia de requisitos SMART, arquitetura NoSQL, implementação, V&V com 10 casos de teste).</td>
                <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-700">Etapa 4</span></td>
              </tr>
              <tr>
                <td class="text-center font-mono font-bold text-stone-800">6.0</td>
                <td class="text-center font-mono text-stone-600">01/10/2026</td>
                <td>Sustentação (plano de implantação, procedimentos de operação/monitoramento, manutenção e plano de descontinuação LGPD).</td>
                <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-700">Etapa 5</span></td>
              </tr>
              <tr>
                <td class="text-center font-mono font-bold text-stone-800">7.0</td>
                <td class="text-center font-mono text-stone-600">22/10/2026</td>
                <td>Unificação das etapas prévias e realização da avaliação formal por pares com elaboração do plano CAPA v9.0.</td>
                <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-700">Etapa 6</span></td>
              </tr>
              <tr class="bg-emerald-50/70 border-l-4 border-emerald-600">
                <td class="text-center font-mono font-bold text-emerald-900">8.0</td>
                <td class="text-center font-mono text-emerald-800 font-semibold">29/10/2026</td>
                <td>
                  <strong class="text-emerald-950">Reestruturação integral conforme a Atividade (6 capítulos normativos):</strong> novos ADRs registrados, plano de integração de componentes, métricas quantitativas de projeto, monitoramento operacional e Capítulo 6 formal de avaliação e melhoria contínua.
                </td>
                <td class="text-center">
                  <span class="badge-chip bg-emerald-200 text-emerald-950 font-bold border border-emerald-400/40">Versão Final</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
"""
