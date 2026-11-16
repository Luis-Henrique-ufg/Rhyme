# -*- coding: utf-8 -*-
CAPITULO3_HTML = """
      <!-- SEÇÃO 4: CAPÍTULO 3 - PROCESSOS ORGANIZACIONAIS HABILITADORES -->
      <section
        id="sec3"
        class="ds-section py-20 border-b border-stone-300/60"
      >
        <div class="mb-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D9488]/15 text-[#0D9488] text-xs font-mono font-semibold mb-3">
            <iconify-icon icon="solar:structure-bold" width="16"></iconify-icon>
            <span>Capítulo 3 • ISO/IEC/IEEE 12207</span>
          </div>
          <h2 class="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">Capítulo 3 — Processos Organizacionais Habilitadores</h2>
          <p class="text-stone-600 mt-2 max-w-3xl text-base">
            Ciclo de vida híbrido adaptativo, infraestrutura operacional, estudo de viabilidade multidimensional, matriz de governança RACI, métricas de qualidade e gestão do conhecimento.
          </p>
        </div>

        <!-- 3.1: Modelo de Ciclo de Vida -->
        <div class="mb-12">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              3.1
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Modelo de Ciclo de Vida Híbrido</h3>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-7 ds-card p-8 md:p-10">
              <p class="text-stone-700 text-base mb-5 leading-relaxed">
                Adota-se uma abordagem <strong>iterativa-incremental híbrida (Scrum + Kanban)</strong> organizada em <strong>sprints quinzenais</strong>. O planejamento estruturado e os ritos de inspeção derivam do Scrum, enquanto o fluxo contínuo de itens de correção de telemetria é governado via Kanban com limites rígidos de WIP (Work in Progress).
              </p>

              <div class="p-5 bg-stone-900 text-stone-100 rounded-2xl font-mono text-xs md:text-sm mb-6 shadow-inner">
                <div class="text-stone-400 mb-2">// Fluxo de Retroalimentação Empírica Rodoviária</div>
                <div class="text-emerald-400 font-semibold">[Visão & Requisitos] ──► [Sprint N: Incremento] ──► [Deploy Piloto]</div>
                <div class="text-stone-400">        ▲                                                │</div>
                <div class="text-amber-400 font-semibold">        └────────── Validação em Campo Rodoviário ◄────────┘</div>
              </div>

              <div class="space-y-3 text-sm text-stone-700">
                <p class="font-semibold text-stone-900">Justificativas da escolha:</p>
                <ol class="list-decimal pl-5 space-y-2">
                  <li><strong>Validação rodoviária obrigatória:</strong> A oscilação de sinal 4G e do GPS nos trechos intermunicipais só pode ser auditada em trânsito; cada incremento requer teste prático no veículo.</li>
                  <li><strong>Isolamento de riscos técnicos críticos:</strong> Mecanismos de cache offline e reconexão WebSocket foram prototipados e isolados antes da introdução do motor de geofencing.</li>
                  <li><strong>Entregas funcionais parciais:</strong> Permite à equipe disponibilizar valor operacional às prefeituras conveniadas e alunos ao longo do semestre, sem os riscos de atraso do modelo em cascata.</li>
                </ol>
              </div>
            </div>

            <!-- 3.2: Infraestrutura e Ferramentas -->
            <div class="lg:col-span-5 ds-card p-7 md:p-8">
              <div class="flex items-center gap-3 mb-4">
                <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs font-bold">3.2</span>
                <h4 class="font-serif text-xl font-semibold text-stone-900">Infraestrutura & Stack Tecnológica</h4>
              </div>
              <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
                <table class="editorial-table text-xs">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Tecnologia Adotada</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-semibold text-stone-900">Runtime & Build</td>
                      <td class="font-mono text-stone-700">Node.js 20 LTS, Vite 6</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Frontend & Estilos</td>
                      <td class="font-mono text-stone-700">React 19, Tailwind CSS 4</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Cartografia</td>
                      <td class="font-mono text-stone-700">Leaflet 1.9, Mapbox API (Free Tier)</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Backend Serverless</td>
                      <td class="font-mono text-stone-700">Cloud Firestore, Firebase Auth, FCM</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Testes Automatizados</td>
                      <td class="font-mono text-stone-700">Vitest, React Testing Library, Firebase Emulator</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Linter & Qualidade</td>
                      <td class="font-mono text-stone-700">ESLint, Oxlint (análise estática)</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">CI/CD & Repositório</td>
                      <td class="font-mono text-stone-700">Git, GitHub, GitHub Actions</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Hospedagem & CDN</td>
                      <td class="font-mono text-stone-700">Vercel (Primária), Firebase Hosting (Espelho)</td>
                    </tr>
                    <tr>
                      <td class="font-semibold text-stone-900">Dispositivos Alvo</td>
                      <td class="font-mono text-stone-700">Android 10+ (Chrome 110+), iOS 15+ (Safari 16.4+)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 3.3: Justificativa Estratégica e Viabilidade -->
        <div class="mb-12">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              3.3
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Justificativa Estratégica e Estudo de Viabilidade</h3>
          </div>

          <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white mb-4">
            <table class="editorial-table">
              <thead>
                <tr>
                  <th class="w-56">Dimensão de Análise</th>
                  <th>Avaliação Técnica e Operacional</th>
                  <th class="w-36 text-center">Parecer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-semibold text-stone-900">Dimensão Estratégica</td>
                  <td>Reduz drasticamente o risco de acidentes no trânsito rodoviário ao eliminar a distração do motorista com mensagens; melhora a segurança noturna dos universitários e gera economia direta de diesel municipal (meta de 10% a 15% de redução por trajeto).</td>
                  <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Viável</span></td>
                </tr>
                <tr>
                  <td class="font-semibold text-stone-900">Dimensão Técnica</td>
                  <td>Stack tecnológica moderna, madura e plenamente dominada pela equipe. A arquitetura PWA elimina as barreiras de aprovação e custos de publicação nas lojas de aplicativos.</td>
                  <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Viável</span></td>
                </tr>
                <tr>
                  <td class="font-semibold text-stone-900">Dimensão Econômica</td>
                  <td>Custo financeiro zero: uso rigoroso dos planos gratuitos do Firebase, Vercel e Mapbox. Mecanismo de salvaguarda previsto para relaxar a cadência de broadcast de 5s para 10s caso as cotas atinjam 70%.</td>
                  <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Viável</span></td>
                </tr>
                <tr>
                  <td class="font-semibold text-stone-900">Dimensão Operacional</td>
                  <td>Interface baseada em toques únicos (one-touch); curva de aprendizado inferior a 30 minutos para o motorista em cabine e adoção imediata pelos discentes.</td>
                  <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Viável</span></td>
                </tr>
                <tr>
                  <td class="font-semibold text-stone-900">Dimensão Jurídica / Legal</td>
                  <td>Conformidade irrestrita com a Lei Geral de Proteção de Dados (LGPD): não há retenção de coordenadas privadas dos estudantes; telemetria restrita estritamente ao veículo e purga diária dos registros de presença.</td>
                  <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Viável</span></td>
                </tr>
                <tr>
                  <td class="font-semibold text-stone-900">Dimensão de Prazos</td>
                  <td>Planejamento dividido em 6 sprints quinzenais harmonizado com o cronograma de 16 semanas do semestre letivo 2026/2 da UFG.</td>
                  <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Viável</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm text-emerald-900 flex items-center gap-3">
            <iconify-icon icon="solar:check-circle-bold" class="text-emerald-700 shrink-0" width="22"></iconify-icon>
            <span><strong>Conclusão da Análise de Viabilidade:</strong> O projeto é plenamente viável em todas as 6 dimensões. Riscos residuais concentram-se em conectividade e adoção, integralmente mitigados na Seção 4.2.</span>
          </div>
        </div>

        <!-- 3.4: RACI e Capacitação -->
        <div class="mb-12">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              3.4
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Papéis, Competências, Capacitação (Matriz RACI)</h3>
          </div>
          <p class="text-stone-600 text-sm mb-4 font-mono">
            Legenda: <strong>R</strong> = Responsável pela execução (Responsible) • <strong>A</strong> = Autoridade que aprova (Accountable) • <strong>C</strong> = Consultado (Consulted) • <strong>I</strong> = Informado (Informed)
          </p>

          <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white mb-6">
            <table class="editorial-table text-center">
              <thead>
                <tr>
                  <th class="text-left">Atividade do Ciclo de Vida</th>
                  <th class="w-48">Matheus Marquez<br/><span class="text-[11px] font-normal text-stone-500 font-mono">Requisitos & Produto</span></th>
                  <th class="w-48">Luis Henrique<br/><span class="text-[11px] font-normal text-stone-500 font-mono">Arquitetura & Front</span></th>
                  <th class="w-48">Heitor Gonçalves<br/><span class="text-[11px] font-normal text-stone-500 font-mono">DevOps & Nuvem</span></th>
                  <th class="w-48">Carlos Daniel<br/><span class="text-[11px] font-normal text-stone-500 font-mono">Qualidade (SQA) & V&V</span></th>
                </tr>
              </thead>
              <tbody class="font-mono text-sm">
                <tr>
                  <td class="text-left font-sans font-medium text-stone-900">Elicitação e Análise de Requisitos</td>
                  <td class="bg-amber-50 font-bold text-amber-900">A / R</td>
                  <td>C</td>
                  <td>C</td>
                  <td>C</td>
                </tr>
                <tr>
                  <td class="text-left font-sans font-medium text-stone-900">Modelagem do Banco NoSQL e Regras Firestore</td>
                  <td>C</td>
                  <td class="bg-emerald-50 font-bold text-emerald-900">R</td>
                  <td class="bg-blue-50 font-bold text-blue-900">A / R</td>
                  <td>C</td>
                </tr>
                <tr>
                  <td class="text-left font-sans font-medium text-stone-900">Engenharia de UI, Cockpit e Mapas Leaflet</td>
                  <td>I</td>
                  <td class="bg-emerald-50 font-bold text-emerald-900">A / R</td>
                  <td>C</td>
                  <td>C</td>
                </tr>
                <tr>
                  <td class="text-left font-sans font-medium text-stone-900">Mecanismos de Geofencing e Notificações Push</td>
                  <td>C</td>
                  <td class="bg-emerald-50 font-bold text-emerald-900">R</td>
                  <td class="bg-blue-50 font-bold text-blue-900">R</td>
                  <td class="bg-purple-50 font-bold text-purple-900">A</td>
                </tr>
                <tr>
                  <td class="text-left font-sans font-medium text-stone-900">Testes Unitários, Integração e Ensaios em Campo</td>
                  <td>C</td>
                  <td>C</td>
                  <td>I</td>
                  <td class="bg-purple-50 font-bold text-purple-900">A / R</td>
                </tr>
                <tr>
                  <td class="text-left font-sans font-medium text-stone-900">Esteiras de Releases, CI/CD e Infraestrutura</td>
                  <td>I</td>
                  <td class="bg-emerald-50 font-bold text-emerald-900">R</td>
                  <td class="bg-blue-50 font-bold text-blue-900">A / R</td>
                  <td>C</td>
                </tr>
                <tr>
                  <td class="text-left font-sans font-medium text-stone-900">Gestão de Incidentes de Telemetria e Monitoramento</td>
                  <td>C</td>
                  <td>I</td>
                  <td class="bg-blue-50 font-bold text-blue-900">R</td>
                  <td class="bg-purple-50 font-bold text-purple-900">A / R</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="p-5 bg-white rounded-2xl border border-stone-200 text-xs md:text-sm text-stone-700">
            <strong class="text-stone-900 font-semibold block mb-1">Programa de Capacitação da Equipe:</strong>
            Nivelamento nos processos do padrão ISO/IEC/IEEE 12207:2017; treinamento intensivo em arquitetura PWA offline-first (Service Workers, estratégia <em>Stale-While-Revalidate</em> e manipulação do IndexedDB); e oficina prática de testes de regras de segurança com o Firebase Emulator Suite.
          </div>
        </div>

        <!-- 3.5 e 3.6: Plano de Qualidade e Gestão do Conhecimento -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-8 ds-card p-8 md:p-10">
            <div class="flex items-center gap-3.5 mb-5">
              <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
                3.5
              </span>
              <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Plano da Qualidade (Métricas QM-01 a QM-04)</h3>
            </div>

            <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white mb-5">
              <table class="editorial-table text-xs md:text-sm">
                <thead>
                  <tr>
                    <th class="w-24 text-center">ID</th>
                    <th>Métrica de Qualidade</th>
                    <th>Meta Formal</th>
                    <th>Método de Medição</th>
                    <th>Ação em Caso de Desvio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-800">QM-01</td>
                    <td class="font-semibold text-stone-900">Latência de Sincronização</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">&lt; 100 ms (4G/5G)<br/>&lt; 1,0 s (3G)</td>
                    <td>Diferença de timestamp de escrita no Firestore vs. recebimento no cliente</td>
                    <td>Otimizar payload, remover campos desnecessários e limitar consultas.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-800">QM-02</td>
                    <td class="font-semibold text-stone-900">Eficácia do Geofencing</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">≥ 98% dos alertas</td>
                    <td>Logs de disparo do push vs. registro de embarque no ponto</td>
                    <td>Aumentar o raio de geofencing de 1.000 m para 1.500 m.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-800">QM-03</td>
                    <td class="font-semibold text-stone-900">Web Vitals Mobile</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">LCP &lt; 2,0 s<br/>TTI &lt; 2,5 s</td>
                    <td>Auditoria automatizada Lighthouse executada no CI do GitHub Actions</td>
                    <td>Code-splitting com React.lazy e pré-carregamento dos tiles de mapa.</td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold text-stone-800">QM-04</td>
                    <td class="font-semibold text-stone-900">Cobertura de Testes Automatizados</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">≥ 80% do código</td>
                    <td>Relatório de cobertura gerado pela suíte Vitest em cada PR</td>
                    <td>Bloqueio automático de merge no GitHub caso o PR reduza a cobertura.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="text-xs md:text-sm text-stone-600">
              <strong>Práticas contínuas de SQA:</strong> Auditoria estática automática a cada PR, critérios estritos de <em>Definition of Done</em> (aprovação em emuladores Android/iOS e regressão dos POPs) e retrospectivas quinzenais.
            </p>
          </div>

          <div class="lg:col-span-4 ds-card p-8 bg-stone-50 border-stone-300">
            <div class="flex items-center gap-3 mb-4">
              <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs font-bold">3.6</span>
              <h4 class="font-serif text-xl font-semibold text-stone-900">Gestão do Conhecimento</h4>
            </div>

            <ul class="space-y-3 text-xs md:text-sm text-stone-700">
              <li class="p-3.5 bg-white rounded-xl border border-stone-200">
                <strong class="text-stone-900 block font-semibold mb-1">1. Documentação Viva:</strong>
                Manuais e especificações mantidos diretamente no repositório em Markdown, versionados e submetidos a Pull Requests.
              </li>
              <li class="p-3.5 bg-white rounded-xl border border-stone-200">
                <strong class="text-stone-900 block font-semibold mb-1">2. Registro Formal de ADRs:</strong>
                Decisões arquiteturais estruturais catalogadas com justificativa e impacto (ADR-001 a ADR-004).
              </li>
              <li class="p-3.5 bg-white rounded-xl border border-stone-200">
                <strong class="text-stone-900 block font-semibold mb-1">3. Post-Mortems Sem Culpa:</strong>
                Análise sistemática pós-incidente após cada viagem piloto na rodovia para identificação de causa-raiz.
              </li>
              <li class="p-3.5 bg-white rounded-xl border border-stone-200">
                <strong class="text-stone-900 block font-semibold mb-1">4. Rodízio de Revisão:</strong>
                Revisão de código distribuída obrigatoriamente entre os quatro membros para eliminar silos de conhecimento.
              </li>
            </ul>
          </div>
        </div>
      </section>
"""
