# -*- coding: utf-8 -*-
CAPITULO2_HTML = """
      <!-- SEÇÃO 3: CAPÍTULO 2 - PROCESSOS DE ACORDO (AQUISIÇÃO & FORNECIMENTO) -->
      <section
        id="sec2"
        class="ds-section py-16 border-b border-stone-300/60"
      >
        <div class="mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D9488]/15 text-[#0D9488] text-xs font-mono font-semibold mb-3">
            <iconify-icon icon="solar:handshake-bold" width="16"></iconify-icon>
            <span>Capítulo 2 • ISO/IEC/IEEE 12207</span>
          </div>
          <h2 class="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">Capítulo 2 — Processos de Acordo</h2>
          <p class="text-stone-600 mt-2 max-w-3xl text-sm md:text-base">
            Decisões formais de contratação tecnológica (Make vs. Buy), modelo de fornecimento sem ônus, níveis de serviço (SLA), procedimentos operacionais e gestão de parceiros.
          </p>
        </div>

        <!-- 2.1: Processo de Aquisição (Make vs Buy) -->
        <div class="mb-10">
          <div class="flex items-center gap-3 mb-4">
            <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono font-bold text-xs">
              2.1
            </span>
            <h3 class="font-serif text-2xl text-stone-900">Processo de Aquisição (Decisões Make vs. Buy)</h3>
          </div>
          <p class="text-stone-600 text-sm mb-4">
            Critérios para componentes desenvolvidos internamente versus serviços de nuvem adotados no ecossistema:
          </p>

          <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white">
            <table class="editorial-table">
              <thead>
                <tr>
                  <th>Recurso do Sistema</th>
                  <th class="text-center whitespace-nowrap">Decisão</th>
                  <th>Fornecedor / Solução</th>
                  <th>Justificativa Técnica e Estratégica</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-semibold text-stone-900">Banco de Dados em Tempo Real</td>
                  <td class="text-center"><span class="badge-chip bg-blue-100 text-blue-900">Buy (PaaS)</span></td>
                  <td class="font-mono text-xs text-stone-700">Google Firebase (Cloud Firestore)</td>
                  <td>Evita hospedar e manter servidor dedicado 24/7; listeners reativos <code>onSnapshot</code> com latência inferior a 100 ms; plano Spark gratuito.</td>
                </tr>
                <tr>
                  <td class="font-semibold text-stone-900">Autenticação e Identidade</td>
                  <td class="text-center"><span class="badge-chip bg-blue-100 text-blue-900">Buy (SaaS)</span></td>
                  <td class="font-mono text-xs text-stone-700">Firebase Authentication</td>
                  <td>Segurança padrão de mercado (OAuth/JWT) pronta para uso, sem necessidade de gerir senhas em servidor próprio.</td>
                </tr>
                <tr>
                  <td class="font-semibold text-stone-900">Cartografia e Renderização Geográfica</td>
                  <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900">Buy (Free Tier)</span></td>
                  <td class="font-mono text-xs text-stone-700">Mapbox API (Plano Free) + Leaflet 1.9</td>
                  <td>Fornecimento estável de tiles de alta resolução (cota de até 50.000 requisições mensais gratuitas) sem custo de licenciamento (ADR-002).</td>
                </tr>
                <tr>
                  <td class="font-semibold text-stone-900">Notificações Push no Dispositivo</td>
                  <td class="text-center"><span class="badge-chip bg-blue-100 text-blue-900">Buy (PaaS)</span></td>
                  <td class="font-mono text-xs text-stone-700">Firebase Cloud Messaging (FCM)</td>
                  <td>Entrega nativa de push em navegadores móveis integrada nativamente ao Firestore sem custo operacional adicional.</td>
                </tr>
                <tr>
                  <td class="font-semibold text-stone-900">Hospedagem Web e Entrega Global (CDN)</td>
                  <td class="text-center"><span class="badge-chip bg-blue-100 text-blue-900">Buy (PaaS)</span></td>
                  <td class="font-mono text-xs text-stone-700">Vercel (Principal) + Firebase Hosting (Espelho)</td>
                  <td>Edge Network com nó de saída em São Paulo (GRU), certificado SSL automático e suporte contínuo a pré-visualizações de Pull Request.</td>
                </tr>
                <tr class="bg-amber-50/50">
                  <td class="font-semibold text-stone-900">Interface Web, Lógica de Negócio e Cockpit</td>
                  <td class="text-center"><span class="badge-chip bg-amber-200 text-amber-950 font-bold border border-amber-400/40">Make</span></td>
                  <td class="font-mono text-xs text-stone-800 font-semibold">Squad Rhyme Core (React 19 + Tailwind)</td>
                  <td>Ferramentas no-code/low-code de prateleira não atendem aos requisitos de operação offline com IndexedDB nem ao cockpit ergonômico de cabine.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2.2: Processo de Fornecimento, SLA e POPs -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          <div class="lg:col-span-6 ds-card p-6 md:p-8">
            <div class="flex items-center gap-3 mb-4">
              <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono font-bold text-xs">
                2.2
              </span>
              <h3 class="font-serif text-2xl text-stone-900">Processo de Fornecimento & SLA</h3>
            </div>
            <ul class="space-y-3 text-xs md:text-sm text-stone-700 mb-6">
              <li class="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <strong class="text-stone-900 block font-semibold mb-0.5">Modelo de Entrega:</strong>
                PWA publicado em URL HTTPS segura com certificado SSL, distribuído aos alunos e motoristas por QR Code (sem dependência de lojas de aplicativos).
              </li>
              <li class="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <strong class="text-stone-900 block font-semibold mb-0.5">Instrumento Jurídico:</strong>
                Termo de Cessão de Uso sem ônus (comodato acadêmico) às secretarias municipais de transporte dos municípios parceiros conveniados e às associações discentes. Proíbe monetização e compartilhamento de dados cadastrais.
              </li>
              <li class="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <strong class="text-stone-900 block font-semibold mb-0.5">Critérios de Aceite:</strong>
                100% de aprovação nos Casos de Teste CT-01 a CT-10 e validação empírica em campo durante viagem real na rodovia.
              </li>
              <li class="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <strong class="text-stone-900 block font-semibold mb-0.5">Níveis de Suporte Corretivo:</strong>
                SLA de 2 horas para incidentes críticos (ex.: indisponibilidade do mapa) e até 24 horas para incidentes de severidade alta.
              </li>
            </ul>

            <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
              <table class="editorial-table text-xs">
                <thead>
                  <tr>
                    <th>Indicador de Serviço</th>
                    <th>Meta Formal Contratada</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-semibold text-stone-900">Disponibilidade Operacional</td>
                    <td class="font-mono text-emerald-800 font-bold whitespace-nowrap">99,9% (Seg a Sex, 15h00 às 23h30)</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">RTO (Recovery Time Objective)</td>
                    <td class="font-mono text-amber-900 font-bold whitespace-nowrap">15 min (Passageiro âncora assume)</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">RPO (Recovery Point Objective)</td>
                    <td class="font-mono text-blue-900 font-bold whitespace-nowrap">0 s (Escritas atômicas + IndexedDB)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- POPs Operacionais -->
          <div class="lg:col-span-6 ds-card p-6 md:p-8">
            <div class="flex items-center gap-3 mb-4">
              <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono font-bold text-xs">
                POPs
              </span>
              <h3 class="font-serif text-2xl text-stone-900">Procedimentos Operacionais Padronizados</h3>
            </div>
            <p class="text-xs text-stone-600 mb-4">
              Quatro procedimentos formais regem o desenvolvimento e a operação do sistema:
            </p>

            <div class="space-y-3 text-xs md:text-sm">
              <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div class="flex items-center justify-between mb-1">
                  <span class="badge-chip bg-stone-900 text-stone-100 text-xs">POP-DEV-01</span>
                  <span class="text-xs text-stone-500 font-mono">Desenvolvimento & Git</span>
                </div>
                <p class="text-stone-700">Nenhum commit vai direto à branch <code>main</code>. Obrigatoriedade de branches temáticas (<code>feature/*</code>, <code>fix/*</code>), Conventional Commits, lint sem erros e aprovação de PR.</p>
              </div>

              <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div class="flex items-center justify-between mb-1">
                  <span class="badge-chip bg-blue-600 text-white text-xs">POP-OPS-01</span>
                  <span class="text-xs text-stone-500 font-mono">CI/CD & Deploy</span>
                </div>
                <p class="text-stone-700">Deploy automatizado via GitHub Actions ao mesclar na <code>main</code>, com validação sintática das regras do Firestore (<code>firestore.rules</code>) e teste de fumaça mobile.</p>
              </div>

              <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div class="flex items-center justify-between mb-1">
                  <span class="badge-chip bg-emerald-700 text-white text-xs">POP-GEO-01</span>
                  <span class="text-xs text-stone-500 font-mono">Geofencing & Push</span>
                </div>
                <p class="text-stone-700">Calibração contínua do cálculo de aproximação Haversine no raio de 1.000 metros e garantia de entrega da notificação push em tempo inferior a 2 segundos.</p>
              </div>

              <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div class="flex items-center justify-between mb-1">
                  <span class="badge-chip bg-red-600 text-white text-xs">POP-EMERG-01</span>
                  <span class="text-xs text-stone-500 font-mono">Contingência Veicular</span>
                </div>
                <p class="text-stone-700">Tratamento prioritário do sinal de socorro "Fui Esquecido" e procedimento de chaveamento imediato do broadcast GPS para o passageiro âncora caso o celular do motorista descarregue.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 2.3: Fornecedores e Parceiros -->
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono font-bold text-xs">
              2.3
            </span>
            <h3 class="font-serif text-2xl text-stone-900">Fornecedores e Parceiros Relevantes</h3>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs font-sans">
            <div class="p-4 bg-white rounded-xl border border-stone-200 text-center shadow-xs">
              <div class="w-8 h-8 mx-auto mb-2 text-amber-600 flex items-center justify-center">
                <iconify-icon icon="logos:firebase" width="28"></iconify-icon>
              </div>
              <strong class="block text-stone-900 mb-0.5 text-xs">Google Firebase</strong>
              <span class="text-stone-500 text-[11px]">Firestore, Auth, FCM</span>
            </div>

            <div class="p-4 bg-white rounded-xl border border-stone-200 text-center shadow-xs">
              <div class="w-8 h-8 mx-auto mb-2 text-stone-900 flex items-center justify-center">
                <iconify-icon icon="logos:vercel-icon" width="24"></iconify-icon>
              </div>
              <strong class="block text-stone-900 mb-0.5 text-xs">Vercel Inc.</strong>
              <span class="text-stone-500 text-[11px]">Hospedagem & CDN</span>
            </div>

            <div class="p-4 bg-white rounded-xl border border-stone-200 text-center shadow-xs">
              <div class="w-8 h-8 mx-auto mb-2 text-blue-600 flex items-center justify-center">
                <iconify-icon icon="logos:mapbox-icon" width="26"></iconify-icon>
              </div>
              <strong class="block text-stone-900 mb-0.5 text-xs">Mapbox Inc.</strong>
              <span class="text-stone-500 text-[11px]">Tiles Free Tier</span>
            </div>

            <div class="p-4 bg-white rounded-xl border border-stone-200 text-center shadow-xs">
              <div class="w-8 h-8 mx-auto mb-2 text-stone-900 flex items-center justify-center">
                <iconify-icon icon="logos:github-icon" width="26"></iconify-icon>
              </div>
              <strong class="block text-stone-900 mb-0.5 text-xs">GitHub</strong>
              <span class="text-stone-500 text-[11px]">Repo & CI/CD</span>
            </div>

            <div class="p-4 bg-white rounded-xl border border-stone-200 text-center shadow-xs">
              <div class="w-8 h-8 mx-auto mb-2 text-emerald-700 flex items-center justify-center">
                <iconify-icon icon="solar:buildings-2-bold" width="26"></iconify-icon>
              </div>
              <strong class="block text-stone-900 mb-0.5 text-xs">Prefeituras</strong>
              <span class="text-stone-500 text-[11px]">Municípios Parceiros</span>
            </div>

            <div class="p-4 bg-white rounded-xl border border-stone-200 text-center shadow-xs">
              <div class="w-8 h-8 mx-auto mb-2 text-purple-700 flex items-center justify-center">
                <iconify-icon icon="solar:users-group-rounded-bold" width="26"></iconify-icon>
              </div>
              <strong class="block text-stone-900 mb-0.5 text-xs">Associações</strong>
              <span class="text-stone-500 text-[11px]">Discentes</span>
            </div>
          </div>
        </div>
      </section>
"""
