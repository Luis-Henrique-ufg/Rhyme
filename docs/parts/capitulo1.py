# -*- coding: utf-8 -*-
CAPITULO1_HTML = """
      <!-- SEÇÃO 2: CAPÍTULO 1 - APRESENTAÇÃO DO SOFTWARE & O PROBLEMA -->
      <section
        id="sec1"
        class="ds-section py-20 border-b border-stone-300/60"
      >
        <div class="mb-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D9488]/15 text-[#0D9488] text-xs font-mono font-semibold mb-3">
            <iconify-icon icon="solar:document-text-bold" width="16"></iconify-icon>
            <span>Capítulo 1 • ISO/IEC/IEEE 12207</span>
          </div>
          <h2 class="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">Capítulo 1 — Apresentação do Software</h2>
          <p class="text-stone-600 mt-2 max-w-3xl text-base">
            Visão geral do sistema Rhyme, delimitação do problema real de transporte universitário intermunicipal e proposta de valor.
          </p>
        </div>

        <!-- 1.1 e 1.2 -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div class="lg:col-span-6 ds-card p-8 md:p-10">
            <div class="flex items-center gap-3.5 mb-5">
              <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 font-mono font-bold text-sm">
                1.1
              </span>
              <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Nome e Descrição</h3>
            </div>
            <p class="text-stone-700 leading-relaxed text-base mb-4">
              <strong class="font-semibold text-stone-900">Rhyme</strong> é um <em>Progressive Web App</em> (PWA) de telemetria e coordenação logística em tempo real para o transporte de universitários que se deslocam diariamente de municípios do interior de Goiás até instituições de ensino superior sediadas em Goiânia.
            </p>
            <p class="text-stone-700 leading-relaxed text-base">
              O sistema foi concebido para <strong>substituir integralmente a dinâmica caótica de grupos de mensagens instantâneas</strong>, oferecendo aos estudantes e motoristas uma interface reativa, ágil e segura, eliminando ruídos de comunicação durante a viagem.
            </p>
          </div>

          <div class="lg:col-span-6 ds-card p-8 md:p-10">
            <div class="flex items-center gap-3.5 mb-5">
              <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 font-mono font-bold text-sm">
                1.2
              </span>
              <h3 class="font-serif text-2xl md:text-3xl text-stone-900">O que é, o que faz e problemas resolvidos</h3>
            </div>
            <p class="text-stone-700 leading-relaxed text-base mb-4">
              O Rhyme mostra a posição do ônibus no mapa com atualização a cada 5 segundos, permite ao aluno informar com um único toque que foi liberado da aula e entrega ao motorista um cockpit com contadores agregados por faculdade.
            </p>
            <div class="space-y-3 text-sm">
              <div class="p-4 bg-red-50/80 border border-red-200/70 rounded-2xl flex items-start gap-3.5">
                <span class="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <strong class="text-red-950 font-semibold block text-sm">Motorista distraído ao volante:</strong>
                  <span class="text-red-900">Leitura contínua de dezenas de mensagens dispersas em grupos com o veículo em movimento na rodovia.</span>
                </div>
              </div>

              <div class="p-4 bg-amber-50/80 border border-amber-200/70 rounded-2xl flex items-start gap-3.5">
                <span class="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <strong class="text-amber-950 font-semibold block text-sm">Aluno vulnerável no período noturno:</strong>
                  <span class="text-amber-900">Espera nas imediações dos câmpus sem saber a localização exata do ônibus nem o horário estimado de chegada (ETA).</span>
                </div>
              </div>

              <div class="p-4 bg-stone-100 border border-stone-300/70 rounded-2xl flex items-start gap-3.5">
                <span class="w-7 h-7 rounded-full bg-stone-700 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <strong class="text-stone-950 font-semibold block text-sm">Desperdício de combustível público:</strong>
                  <span class="text-stone-800">O ônibus percorre câmpus sem alunos aguardando embarque, consumindo diesel subsidiado sem necessidade.</span>
                </div>
              </div>

              <div class="p-4 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex items-start gap-3.5">
                <span class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
                <div>
                  <strong class="text-blue-950 font-semibold block text-sm">Inexistência de dados operacionais auditáveis:</strong>
                  <span class="text-blue-900">Mensagens instantâneas se perdem; não há registros para subsidiar o correto dimensionamento da frota.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 1.3 e 1.4: Usuários e Rotas Piloto -->
        <div class="mb-12">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              1.3 e 1.4
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Público-Alvo, Contexto de Uso e Rotas Piloto</h3>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-8 overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white">
              <table class="editorial-table">
                <thead>
                  <tr>
                    <th class="w-56">Usuário</th>
                    <th>Situação de Uso</th>
                    <th>Ambiente Operacional</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-semibold text-stone-900 flex items-center gap-2.5">
                      <iconify-icon icon="solar:user-bold" class="text-emerald-700" width="20"></iconify-icon>
                      Estudante universitário
                    </td>
                    <td>Informa liberação da aula ("Liberado"), consulta ETA e acompanha o ônibus no mapa.</td>
                    <td>Smartphone móvel, dentro do câmpus ou no ponto de parada, sob conectividade 4G variável.</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900 flex items-center gap-2.5">
                      <iconify-icon icon="solar:steering-wheel-bold" class="text-amber-600" width="20"></iconify-icon>
                      Motorista do ônibus
                    </td>
                    <td>Visualiza contadores agregados por faculdade, recebe alertas sonoros e monitora emergências.</td>
                    <td>Smartphone fixado em suporte veicular 12V no painel do ônibus, rodovias estaduais e federais (GOs e BRs de acesso à capital).</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900 flex items-center gap-2.5">
                      <iconify-icon icon="solar:buildings-bold" class="text-blue-600" width="20"></iconify-icon>
                      Gestor municipal / Associação
                    </td>
                    <td>Consulta relatórios de frequência agregada, histórico de presença e itinerários autorizados.</td>
                    <td>Computador ou tablet, navegador web em ambiente de escritório administrativo.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="lg:col-span-4 ds-card p-7 bg-stone-50 border-stone-300">
              <div class="flex items-center gap-2 text-xs font-mono font-bold text-stone-700 uppercase tracking-wider mb-3">
                <iconify-icon icon="solar:routing-2-bold" class="text-amber-600" width="18"></iconify-icon>
                <span>Rotas Piloto Mapeadas</span>
              </div>
              <ul class="space-y-3.5 text-xs md:text-sm text-stone-700">
                <li class="p-3.5 bg-white rounded-xl border border-stone-200">
                  <strong class="text-stone-900 block font-semibold mb-1">Rota Intermunicipal Piloto A</strong>
                  <span>Interior ↔ Goiânia (cerca de 30 alunos/dia). Saída por volta de 16h00 e retorno noturno via rodovia estadual.</span>
                </li>
                <li class="p-3.5 bg-white rounded-xl border border-stone-200">
                  <strong class="text-stone-900 block font-semibold mb-1">Rota Intermunicipal Piloto B</strong>
                  <span>Interior ↔ Goiânia. Saída por volta de 16h30 e retorno noturno via rodovia federal.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 1.5 e 1.6: Escopo, Restrições e Premissas -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-6 ds-card p-8 md:p-10">
            <div class="flex items-center gap-3.5 mb-5">
              <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
                1.5
              </span>
              <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Escopo do Produto</h3>
            </div>

            <p class="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3.5">Dentro do Escopo (Funcionalidades Core)</p>
            <ol class="space-y-2.5 text-sm text-stone-700 mb-6">
              <li class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 flex items-start gap-2.5">
                <span class="font-mono font-bold text-emerald-800">1.</span>
                <span><strong>Rastreamento GPS contínuo:</strong> Atualização veicular a cada 5 s em mapa Leaflet com tiles Mapbox API.</span>
              </li>
              <li class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 flex items-start gap-2.5">
                <span class="font-mono font-bold text-emerald-800">2.</span>
                <span><strong>Status One-Touch:</strong> Chaveamento instantâneo do aluno entre "Em sala", "Liberado" e "No ponto".</span>
              </li>
              <li class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 flex items-start gap-2.5">
                <span class="font-mono font-bold text-emerald-800">3.</span>
                <span><strong>Cockpit do motorista:</strong> Painel de alta legibilidade com contadores numéricos por câmpus e avisos sonoros.</span>
              </li>
              <li class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 flex items-start gap-2.5">
                <span class="font-mono font-bold text-emerald-800">4.</span>
                <span><strong>Geofencing automatizado (1 km):</strong> Notificação push quando o ônibus atinge o perímetro de aproximação.</span>
              </li>
              <li class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 flex items-start gap-2.5">
                <span class="font-mono font-bold text-emerald-800">5.</span>
                <span><strong>Protocolo "Fui Esquecido":</strong> Botão de emergência com alarme persistente audiovisual na cabine.</span>
              </li>
              <li class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 flex items-start gap-2.5">
                <span class="font-mono font-bold text-emerald-800">6.</span>
                <span><strong>Resiliência offline-first:</strong> Service Worker com cache e persistência local via IndexedDB para trechos sem sinal.</span>
              </li>
            </ol>

            <div class="p-4 bg-stone-100 rounded-xl border border-stone-200 text-xs md:text-sm text-stone-600">
              <strong class="text-stone-800 block mb-1">Fora do Escopo Formal:</strong>
              Cobrança ou bilhetagem de passagens, roteamento dinâmico automático com IA e publicação de aplicativos nativos nas lojas Google Play e Apple App Store.
            </div>
          </div>

          <div class="lg:col-span-6 ds-card p-8 md:p-10">
            <div class="flex items-center gap-3.5 mb-5">
              <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
                1.6
              </span>
              <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Restrições e Premissas</h3>
            </div>

            <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white mb-4">
              <table class="editorial-table text-xs md:text-sm">
                <thead>
                  <tr>
                    <th class="w-32">Tipo</th>
                    <th>Definição Formal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="badge-chip bg-amber-100 text-amber-900">Restrição</span></td>
                    <td><strong>Custo zero de infraestrutura:</strong> Uso estrito do plano gratuito (Spark) do Google Firebase e mapas abertos Mapbox/Leaflet.</td>
                  </tr>
                  <tr>
                    <td><span class="badge-chip bg-amber-100 text-amber-900">Restrição</span></td>
                    <td><strong>Conectividade instável:</strong> Cobertura 4G irregular nos trechos rurais das rodovias estaduais.</td>
                  </tr>
                  <tr>
                    <td><span class="badge-chip bg-amber-100 text-amber-900">Restrição</span></td>
                    <td><strong>Conformidade estrita com a LGPD:</strong> Localização apenas do veículo rodoviário; histórico de presença individual descartado diariamente.</td>
                  </tr>
                  <tr>
                    <td><span class="badge-chip bg-amber-100 text-amber-900">Restrição</span></td>
                    <td><strong>Capacidade da equipe:</strong> 4 desenvolvedores com dedicação parcial durante o semestre letivo 2026/2.</td>
                  </tr>
                  <tr>
                    <td><span class="badge-chip bg-blue-100 text-blue-900">Premissa</span></td>
                    <td>Estudantes e motoristas possuem smartphones com navegadores compatíveis (Chrome v110+ ou Safari v16.4+).</td>
                  </tr>
                  <tr>
                    <td><span class="badge-chip bg-blue-100 text-blue-900">Premissa</span></td>
                    <td>O motorista mantém o smartphone alimentado no suporte 12V veicular durante todo o trajeto.</td>
                  </tr>
                  <tr>
                    <td><span class="badge-chip bg-blue-100 text-blue-900">Premissa</span></td>
                    <td>As prefeituras e associações mantêm as rotas, pontos de parada e horários já autorizados.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
"""
