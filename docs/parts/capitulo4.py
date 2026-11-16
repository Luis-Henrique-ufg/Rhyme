# -*- coding: utf-8 -*-
CAPITULO4_HTML = """
      <!-- SEÇÃO 5: CAPÍTULO 4 - PROCESSOS DE GERENCIAMENTO TÉCNICO -->
      <section
        id="sec4"
        class="ds-section py-20 border-b border-stone-300/60"
      >
        <div class="mb-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D9488]/15 text-[#0D9488] text-xs font-mono font-semibold mb-3">
            <iconify-icon icon="solar:chart-square-bold" width="16"></iconify-icon>
            <span>Capítulo 4 • ISO/IEC/IEEE 12207</span>
          </div>
          <h2 class="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">Capítulo 4 — Processos de Gerenciamento Técnico</h2>
          <p class="text-stone-600 mt-2 max-w-3xl text-base">
            Planejamento estruturado em EAP (3 níveis), cronograma de sprints, gestão proativa de riscos, fluxo de configuração Git Flow, decisões arquiteturais (ADRs) e métricas de controle do projeto.
          </p>
        </div>

        <!-- 4.1: Plano de Projeto, EAP e Cronograma -->
        <div class="mb-12">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              4.1
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Plano de Projeto: Estrutura Analítica (EAP) & Cronograma</h3>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
            <div class="lg:col-span-7 ds-card p-8 md:p-10">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-serif text-xl font-semibold text-stone-900">EAP em 3 Níveis de Decomposição</h4>
                <span class="badge-chip bg-stone-100 text-stone-700 text-xs">5 Pacotes de Trabalho</span>
              </div>

              <div class="space-y-4 text-xs md:text-sm">
                <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <strong class="font-mono text-stone-900 block font-bold text-xs md:text-sm mb-1.5">1.0 FUNDAÇÃO & INFRAESTRUTURA</strong>
                  <ul class="space-y-1 text-stone-700 pl-3 border-l-2 border-stone-300">
                    <li><strong>1.1 Repositório e Automação:</strong> 1.1.1 Branch protection e Conventional Commits; 1.1.2 Pipeline CI/CD com GitHub Actions</li>
                    <li><strong>1.2 Autenticação e Segurança:</strong> 1.2.1 Firebase Auth; 1.2.2 Regras de segurança no <code>firestore.rules</code></li>
                    <li><strong>1.3 Modelagem de Dados NoSQL:</strong> 1.3.1 Coleções <code>routes</code>, <code>trips</code>, <code>students</code>, <code>bus_location</code>, <code>emergencies</code></li>
                  </ul>
                </div>

                <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <strong class="font-mono text-stone-900 block font-bold text-xs md:text-sm mb-1.5">2.0 MAPA & TELEMETRIA EM TEMPO REAL</strong>
                  <ul class="space-y-1 text-stone-700 pl-3 border-l-2 border-amber-400">
                    <li><strong>2.1 Interface Cartográfica:</strong> 2.1.1 Camada Leaflet + Mapbox API; 2.1.2 Marcadores e polígonos de câmpus</li>
                    <li><strong>2.2 Telemetria:</strong> 2.2.1 Captura contínua de GPS; 2.2.2 Envio a cada 5 s com role de broadcaster</li>
                  </ul>
                </div>

                <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <strong class="font-mono text-stone-900 block font-bold text-xs md:text-sm mb-1.5">3.0 FLUXO DO ESTUDANTE</strong>
                  <ul class="space-y-1 text-stone-700 pl-3 border-l-2 border-emerald-400">
                    <li><strong>3.1 Interface do Passageiro:</strong> 3.1.1 Onboarding e perfil; 3.1.2 Componente <code>StatusToggle</code> (one-touch)</li>
                    <li><strong>3.2 Mapa do Aluno:</strong> 3.2.1 Posição e cálculo de ETA (Haversine); 3.2.2 Notificações push por geofencing (1 km)</li>
                  </ul>
                </div>

                <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <strong class="font-mono text-stone-900 block font-bold text-xs md:text-sm mb-1.5">4.0 COCKPIT DO MOTORISTA</strong>
                  <ul class="space-y-1 text-stone-700 pl-3 border-l-2 border-blue-400">
                    <li><strong>4.1 Painel Veicular:</strong> 4.1.1 Contadores agregados por faculdade; 4.1.2 Controle de início e fim de viagem</li>
                    <li><strong>4.2 Alertas Operacionais:</strong> 4.2.1 Avisos sonoros sintetizados; 4.2.2 Painel de socorro "Fui Esquecido"</li>
                  </ul>
                </div>

                <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <strong class="font-mono text-stone-900 block font-bold text-xs md:text-sm mb-1.5">5.0 RESILIÊNCIA & IMPLANTAÇÃO</strong>
                  <ul class="space-y-1 text-stone-700 pl-3 border-l-2 border-purple-400">
                    <li><strong>5.1 PWA & Operação Offline:</strong> 5.1.1 Service Worker; 5.1.2 Fila de escrita offline com IndexedDB</li>
                    <li><strong>5.2 Validação e Homologação:</strong> 5.2.1 Testes unitários Vitest; 5.2.2 Ensaio prático em campo na rodovia</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Cronograma de Sprints -->
            <div class="lg:col-span-5 ds-card p-8 md:p-10">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-serif text-xl font-semibold text-stone-900">Cronograma de Sprints</h4>
                <span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">100% Concluído</span>
              </div>

              <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
                <table class="editorial-table text-xs">
                  <thead>
                    <tr>
                      <th class="w-16 text-center">Sprint</th>
                      <th class="w-28 text-center">Período</th>
                      <th>Pacotes Entregues</th>
                      <th>Marco</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-center font-mono font-bold text-stone-800">S1</td>
                      <td class="text-center font-mono text-stone-600">11/08–25/08</td>
                      <td>1.1, 1.2, 1.3</td>
                      <td>Repo, CI, Auth, Schema</td>
                    </tr>
                    <tr>
                      <td class="text-center font-mono font-bold text-stone-800">S2</td>
                      <td class="text-center font-mono text-stone-600">25/08–10/09</td>
                      <td>2.1, 2.2</td>
                      <td>Mapa Câmpus (Etapa 0)</td>
                    </tr>
                    <tr>
                      <td class="text-center font-mono font-bold text-stone-800">S3</td>
                      <td class="text-center font-mono text-stone-600">10/09–24/09</td>
                      <td>2.2, 3.1, 3.2</td>
                      <td>GPS & Status (Etapa 1)</td>
                    </tr>
                    <tr>
                      <td class="text-center font-mono font-bold text-stone-800">S4</td>
                      <td class="text-center font-mono text-stone-600">24/09–08/10</td>
                      <td>4.1, 4.2</td>
                      <td>Cockpit Cabine (Etapa 2)</td>
                    </tr>
                    <tr>
                      <td class="text-center font-mono font-bold text-stone-800">S5</td>
                      <td class="text-center font-mono text-stone-600">08/10–22/10</td>
                      <td>3.2, 5.1, 5.2</td>
                      <td>Offline, Testes ≥80% (Etapas 3–4)</td>
                    </tr>
                    <tr class="bg-emerald-50/70 font-semibold">
                      <td class="text-center font-mono font-bold text-emerald-900">S6</td>
                      <td class="text-center font-mono text-emerald-800">22/10–05/11</td>
                      <td>5.2</td>
                      <td>Ensaio Rodoviário & Manual Final</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-5 p-4 bg-stone-100 rounded-xl text-xs text-stone-700">
                <strong>Entregas Finais:</strong> PWA em produção na Vercel, Manual de Processos v8.0 homologado e apresentação formal em 26/11/2026.
              </div>
            </div>
          </div>
        </div>

        <!-- 4.2: Matriz de Riscos -->
        <div class="mb-12">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              4.2
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Plano de Gestão de Riscos (Matriz de Riscos)</h3>
          </div>
          <p class="text-stone-600 text-xs md:text-sm mb-4 font-mono">
            Severidade = Probabilidade (1 a 5) × Impacto (1 a 5). Riscos com severidade ≥ 15 recebem planos de resposta prioritários.
          </p>

          <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white mb-4">
            <table class="editorial-table text-xs md:text-sm">
              <thead>
                <tr>
                  <th class="w-20 text-center">ID</th>
                  <th>Descrição do Risco</th>
                  <th class="w-12 text-center">P</th>
                  <th class="w-12 text-center">I</th>
                  <th class="w-20 text-center">Sev.</th>
                  <th>Resposta Preventiva</th>
                  <th>Plano de Contingência</th>
                </tr>
              </thead>
              <tbody>
                <tr class="bg-red-50/50">
                  <td class="text-center font-mono font-bold text-red-900">RT-01</td>
                  <td class="font-semibold text-stone-900">Sombra de sinal 4G nos trechos rodoviários rurais impede envio de coordenadas GPS</td>
                  <td class="text-center font-mono font-bold">4</td>
                  <td class="text-center font-mono font-bold">5</td>
                  <td class="text-center font-mono font-bold text-red-700 text-sm">20</td>
                  <td>Cache via Service Worker e fila persistente local no IndexedDB.</td>
                  <td>Retém a última coordenada válida e descarrega lote em rajada ao reconectar.</td>
                </tr>
                <tr class="bg-amber-50/50">
                  <td class="text-center font-mono font-bold text-amber-900">RT-02</td>
                  <td class="font-semibold text-stone-900">Bateria do smartphone do motorista descarrega em viagem</td>
                  <td class="text-center font-mono font-bold">3</td>
                  <td class="text-center font-mono font-bold">5</td>
                  <td class="text-center font-mono font-bold text-amber-700 text-sm">15</td>
                  <td>Exigência operacional de carregador veicular 12V homologado.</td>
                  <td>Chaveamento instantâneo da transmissão GPS para o passageiro âncora (POP-EMERG-01).</td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-800">RO-01</td>
                  <td class="font-semibold text-stone-900">Aluno esquece de atualizar o status após a liberação da aula</td>
                  <td class="text-center font-mono">3</td>
                  <td class="text-center font-mono">4</td>
                  <td class="text-center font-mono font-bold text-stone-700 text-sm">12</td>
                  <td>Interface baseada em toque único (one-touch) e aviso contextual.</td>
                  <td>Motorista confere a presença física pelo contador agregado no ponto de parada.</td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-800">RO-02</td>
                  <td class="font-semibold text-stone-900">Cockpit do motorista complexo de operar durante a condução</td>
                  <td class="text-center font-mono">2</td>
                  <td class="text-center font-mono">5</td>
                  <td class="text-center font-mono font-bold text-stone-700 text-sm">10</td>
                  <td>Botões com área de toque &gt; 64 px, alto contraste visual e avisos sonoros.</td>
                  <td>Treinamento operacional de 30 minutos com o motorista na rodoviária.</td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-800">RT-03</td>
                  <td class="font-semibold text-stone-900">Notificação push falha no navegador Safari / iOS</td>
                  <td class="text-center font-mono">3</td>
                  <td class="text-center font-mono">3</td>
                  <td class="text-center font-mono font-bold text-stone-700 text-sm">9</td>
                  <td>Validação de suporte ao padrão Web Push a partir do iOS 16.4+.</td>
                  <td>Sinalização visual destacada com banner de aproximação no próprio mapa.</td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-800">RT-04</td>
                  <td class="font-semibold text-stone-900">Latência na cabine superior a 2 segundos</td>
                  <td class="text-center font-mono">2</td>
                  <td class="text-center font-mono">4</td>
                  <td class="text-center font-mono font-bold text-stone-700 text-sm">8</td>
                  <td>Payload de telemetria enxuto (&lt; 200 bytes) e índices compostos.</td>
                  <td>Reconexão forçada e reinicialização dos listeners reativos <code>onSnapshot</code>.</td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-800">RR-01</td>
                  <td class="font-semibold text-stone-900">Não conformidade com a LGPD por retenção indevida</td>
                  <td class="text-center font-mono">1</td>
                  <td class="text-center font-mono">5</td>
                  <td class="text-center font-mono font-bold text-stone-700 text-sm">5</td>
                  <td>Princípio de Privacy by Design: sem coleta de geolocalização do estudante.</td>
                  <td>Purga automatizada dos dados ao término da viagem diária.</td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-800">RR-02</td>
                  <td class="font-semibold text-stone-900">Esgotamento da cota diária gratuita do Firebase Spark</td>
                  <td class="text-center font-mono">1</td>
                  <td class="text-center font-mono">4</td>
                  <td class="text-center font-mono font-bold text-stone-700 text-sm">4</td>
                  <td>Arquitetura estritamente orientada a eventos para evitar polling.</td>
                  <td>Relaxamento automático da frequência de envio de GPS de 5s para 10s.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4.3, 4.4 e 4.5: Configuração, ADRs e Métricas -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div class="lg:col-span-6 ds-card p-8 md:p-10">
            <div class="flex items-center gap-3 mb-4">
              <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs font-bold">4.3</span>
              <h4 class="font-serif text-xl font-semibold text-stone-900">Gestão de Configuração & Git Flow</h4>
            </div>

            <div class="p-4 bg-stone-900 text-stone-100 rounded-2xl font-mono text-xs mb-4">
              <div class="text-stone-400">// Política de Branches e Integração Contínua</div>
              <div class="text-emerald-400 font-bold">main (branch protegida)</div>
              <div class="text-stone-300">  ├── feature/* ──► PR (lint + build + 1 review) ──► Squash & Merge</div>
              <div class="text-stone-300">  └── fix/*     ──► PR (testes Vitest + review)  ──► Squash & Merge</div>
            </div>

            <ul class="space-y-2 text-xs md:text-sm text-stone-700">
              <li><strong>Sem Push Direto:</strong> <code>main</code> protegida por regras do repositório GitHub.</li>
              <li><strong>Conventional Commits:</strong> Padronização obrigatória: <code>feat</code>, <code>fix</code>, <code>docs</code>, <code>test</code>, <code>refactor</code>.</li>
              <li><strong>Pull Requests:</strong> Exigência de 1 revisor independente e esteira de CI sem quebras.</li>
              <li><strong>Releases:</strong> Tags anotadas seguindo Semantic Versioning (ex.: <code>v8.0.0</code>).</li>
            </ul>
          </div>

          <div class="lg:col-span-6 ds-card p-8 md:p-10">
            <div class="flex items-center gap-3 mb-4">
              <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs font-bold">4.5</span>
              <h4 class="font-serif text-xl font-semibold text-stone-900">Métricas de Acompanhamento do Projeto</h4>
            </div>

            <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
              <table class="editorial-table text-xs md:text-sm">
                <thead>
                  <tr>
                    <th>Métrica de Controle</th>
                    <th>Meta Estabelecida</th>
                    <th>Fonte / Frequência</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-semibold text-stone-900">Velocity da Equipe</td>
                    <td>Estável entre sprints</td>
                    <td>Quadro Kanban • Quinzenal</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">Entregas no Prazo</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">100% dos marcos</td>
                    <td>Cronograma (4.1) • Por sprint</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">Cobertura de Testes (QM-04)</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">≥ 80% do código</td>
                    <td>Vitest no CI • A cada PR</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">Casos de Teste Aprovados</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">10 de 10 (100%)</td>
                    <td>Relatório V&V • Por release</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">Riscos Críticos (Sev ≥ 15)</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">0 sem mitigação ativa</td>
                    <td>Risk Register • Quinzenal</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">Cota Gratuita Firebase</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">&lt; 70% de consumo</td>
                    <td>Console Firebase • Semanal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 4.4: Registro Formal de ADRs -->
        <div>
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              4.4
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Registro de Decisões Técnicas de Arquitetura (ADRs)</h3>
          </div>

          <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white">
            <table class="editorial-table text-xs md:text-sm">
              <thead>
                <tr>
                  <th class="w-24 text-center">ADR</th>
                  <th class="w-72">Decisão Estrutural</th>
                  <th>Contexto & Justificativa</th>
                  <th class="w-80">Alternativas Avaliadas (Nota)</th>
                  <th>Consequências Operacionais</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">001</td>
                  <td class="font-semibold text-stone-900">Distribuir como Progressive Web App (PWA)</td>
                  <td>Acesso imediato via escaneamento de QR Code na van, sem fricção de download ou aprovação em lojas.</td>
                  <td class="font-mono text-xs"><strong>PWA (4,8)</strong> vs. React Native (3,1) vs. Flutter (3,1)</td>
                  <td>Dispensa compilações nativas; suporte a Web Push no iOS depende de versão 16.4+.</td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">002</td>
                  <td class="font-semibold text-stone-900">Leaflet 1.9 + Mapbox API (Free Tier)</td>
                  <td>Custo zero, alta resolução cartográfica, leveza de bundle e tiles otimizados para redes móveis instáveis.</td>
                  <td class="font-mono text-xs"><strong>Mapbox+Leaflet (4,9)</strong> vs. Mapbox SDK (3,5) vs. Google Maps (2,7)</td>
                  <td>Franquia de 50.000 requisições mensais gratuitas sem risco de faturamento cambial em dólares.</td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">003</td>
                  <td class="font-semibold text-stone-900">Google Firebase (Firestore, Auth, FCM)</td>
                  <td>Comunicação reativa bidirecional em tempo real sem ônus de hospedar servidor próprio 24/7.</td>
                  <td class="font-mono text-xs"><strong>Firebase (4,7)</strong> vs. Servidor Node.js próprio + Socket.io (3,0)</td>
                  <td>Cotas do plano Spark requerem monitoramento rigoroso e arquitetura orientada a eventos.</td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">004</td>
                  <td class="font-semibold text-stone-900">Vercel (Principal) com espelho no Firebase Hosting</td>
                  <td>Rede de distribuição global (CDN) com nó de borda no Brasil (São Paulo) e integração com GitHub.</td>
                  <td class="font-mono text-xs"><strong>Vercel (5,0)</strong> vs. Firebase Hosting (4,4) vs. GitHub Pages (3,2)</td>
                  <td>Dois destinos sincronizados de deploy para assegurar redundância contra indisponibilidade.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
"""
