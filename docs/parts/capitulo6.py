# -*- coding: utf-8 -*-
CAPITULO6_HTML = """
      <!-- SEÇÃO 7: CAPÍTULO 6 - AVALIAÇÃO E MELHORIA DOS PROCESSOS DE SOFTWARE -->
      <section
        id="sec6"
        class="ds-section py-20 border-b border-stone-300/60"
      >
        <div class="mb-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D9488]/15 text-[#0D9488] text-xs font-mono font-semibold mb-3">
            <iconify-icon icon="solar:refresh-circle-bold" width="16"></iconify-icon>
            <span>Capítulo 6 • ISO/IEC/IEEE 12207</span>
          </div>
          <h2 class="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">Capítulo 6 — Avaliação e Melhoria dos Processos</h2>
          <p class="text-stone-600 mt-2 max-w-3xl text-base">
            Aplicação do ciclo CAPA, diagnóstico formal do manual (avaliação por pares e revisão interna), plano de ação corretiva e cronograma executivo até a apresentação oficial.
          </p>
        </div>

        <!-- 6.1 e 6.2: Referencial, Recorte e Diagnóstico D-01 a D-09 -->
        <div class="mb-12">
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              6.1 e 6.2
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Referencial Normativo & Diagnóstico do Manual</h3>
          </div>

          <div class="p-6 bg-white rounded-2xl border border-stone-200 text-sm md:text-base text-stone-700 mb-8 shadow-xs">
            <strong>Referencial & Recorte de Auditoria:</strong> Alinhado aos grupos de processos 6.1 a 6.4 da norma <strong>ISO/IEC/IEEE 12207:2017</strong>. O recorte prioritário concentrou-se na <strong>consistência e rastreabilidade ponta a ponta do manual</strong>, pois o produto de software só se torna plenamente auditável quando cada requisito possui correspondência unívoca na EAP, no código-fonte e nos casos de teste de aceitação.
          </div>

          <h4 class="font-serif text-xl md:text-2xl font-semibold text-stone-900 mb-4">Diagnóstico Formal do Manual (Avaliação por Pares & Revisão Interna)</h4>
          <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white mb-8">
            <table class="editorial-table text-xs md:text-sm">
              <thead>
                <tr>
                  <th class="w-20 text-center">ID</th>
                  <th>Constatação Formal do Diagnóstico</th>
                  <th class="w-56">Origem da Constatação</th>
                  <th class="w-32 text-center">Gravidade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">D-01</td>
                  <td><code>Requisitos.md</code> (v1.0) e o manual utilizavam numerações divergentes para RF01–RF10 (ex.: RF03 era "gerar viagens"; hoje é "status one-touch").</td>
                  <td class="font-mono text-stone-600">Peer review (NC-01)</td>
                  <td class="text-center"><span class="badge-chip bg-red-100 text-red-900 font-bold">Alta</span></td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">D-02</td>
                  <td>EAP apresentava apenas 2 níveis de decomposição em determinados pacotes de trabalho.</td>
                  <td class="font-mono text-stone-600">Peer review (NC-02)</td>
                  <td class="text-center"><span class="badge-chip bg-amber-100 text-amber-900 font-bold">Média</span></td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">D-03</td>
                  <td>Modelo NoSQL de coleções não estava detalhado formalmente no corpo do manual.</td>
                  <td class="font-mono text-stone-600">Peer review (NC-03)</td>
                  <td class="text-center"><span class="badge-chip bg-red-100 text-red-900 font-bold">Alta</span></td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">D-04</td>
                  <td>Métrica QM-04 carecia de meta quantitativa explícita de cobertura de testes.</td>
                  <td class="font-mono text-stone-600">Peer review (NC-04)</td>
                  <td class="text-center"><span class="badge-chip bg-amber-100 text-amber-900 font-bold">Média</span></td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">D-05</td>
                  <td>Plano de descontinuação não definia prazos de antecedência nem procedimentos de purga LGPD.</td>
                  <td class="font-mono text-stone-600">Peer review (OM-02)</td>
                  <td class="text-center"><span class="badge-chip bg-amber-100 text-amber-900 font-bold">Média</span></td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">D-06</td>
                  <td>O requisito RF09 apontava erroneamente para a entrega EAP 5.3.1 (inexistente).</td>
                  <td class="font-mono text-stone-600">Revisão interna v8.0</td>
                  <td class="text-center"><span class="badge-chip bg-red-100 text-red-900 font-bold">Alta</span></td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">D-07</td>
                  <td>O texto declarava "quatro coleções" ao enumerar cinco estruturas no Firestore.</td>
                  <td class="font-mono text-stone-600">Revisão interna v8.0</td>
                  <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-700 font-bold">Baixa</span></td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">D-08</td>
                  <td>Datas das etapas acadêmicas divergiam entre <code>Manual.md</code> e <code>historico-versoes.md</code>.</td>
                  <td class="font-mono text-stone-600">Revisão interna v8.0</td>
                  <td class="text-center"><span class="badge-chip bg-amber-100 text-amber-900 font-bold">Média</span></td>
                </tr>
                <tr>
                  <td class="text-center font-mono font-bold text-stone-900">D-09</td>
                  <td>Decisões ADR-001 a ADR-004 eram citadas no texto, mas não possuíam tabela formal de registro.</td>
                  <td class="font-mono text-stone-600">Revisão interna v8.0</td>
                  <td class="text-center"><span class="badge-chip bg-red-100 text-red-900 font-bold">Alta</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 6.3 e 6.4: Plano de Melhoria CAPA e Atualização Realizada -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div class="lg:col-span-6 ds-card p-8 md:p-10">
            <div class="flex items-center gap-3 mb-4">
              <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs font-bold">6.3</span>
              <h4 class="font-serif text-xl font-semibold text-stone-900">Plano de Melhoria CAPA (v9.0)</h4>
            </div>
            <p class="text-xs md:text-sm text-stone-600 mb-4">
              <strong>Melhoria Escolhida:</strong> Garantir rastreabilidade ponta a ponta e eliminar inconsistências cruzadas no manual.
            </p>

            <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
              <table class="editorial-table text-xs md:text-sm">
                <thead>
                  <tr>
                    <th class="w-40">Elemento</th>
                    <th>Definição Formal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-semibold text-stone-900">Objetivo</td>
                    <td>Todo requisito 100% rastreável a EAP, código e caso de teste, com zero referências quebradas.</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">Ações Corretivas</td>
                    <td>(1) Declarar o manual fonte única de RF/RNF; (2) Corrigir RF09 → EAP 3.2.2; (3) Registrar ADR-001 a ADR-004; (4) Harmonizar datas do histórico; (5) Validar contra o código do repositório.</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">Responsáveis</td>
                    <td class="font-mono">Matheus (A/R), Carlos Daniel (Verificação)</td>
                  </tr>
                  <tr>
                    <td class="font-semibold text-stone-900">Indicador de Sucesso</td>
                    <td class="font-mono text-emerald-800 font-bold">10 de 10 requisitos auditados; 0 referências quebradas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="lg:col-span-6 ds-card p-8 md:p-10">
            <div class="flex items-center gap-3 mb-4">
              <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs font-bold">6.4</span>
              <h4 class="font-serif text-xl font-semibold text-stone-900">Atualização & Verificação na Versão 8.0</h4>
            </div>

            <div class="overflow-x-auto shadow-xs rounded-xl border border-stone-200 bg-white">
              <table class="editorial-table text-xs md:text-sm">
                <thead>
                  <tr>
                    <th class="w-12 text-center">#</th>
                    <th>Ação Executada na Versão 8.0</th>
                    <th>Método de Verificação</th>
                    <th class="w-32 text-center">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center font-mono font-bold">1</td>
                    <td>Manual unificado e numeração RF01–RF10 vigente (5.1.1)</td>
                    <td>Comparar RFs do manual com <code>Requisitos.md</code></td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Concluído</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold">2</td>
                    <td>RF09 apontado para EAP 3.2.2 (5.1.2)</td>
                    <td>Conferir existência do pacote na EAP (4.1)</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Concluído</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold">3</td>
                    <td>ADR-001 a ADR-004 registrados formalmente (4.4)</td>
                    <td>Auditar correspondência de cada ADR citado</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Concluído</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold">4</td>
                    <td>Datas do histórico de versões alinhadas na contracapa</td>
                    <td>Conferir com <code>historico-versoes.md</code></td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Concluído</span></td>
                  </tr>
                  <tr>
                    <td class="text-center font-mono font-bold">5</td>
                    <td>Mapeamento dos arquivos de <code>src/</code> e status dos testes</td>
                    <td>Auditar contra árvore real do repositório Rhyme</td>
                    <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Concluído</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 6.5: Acompanhamento da Execução -->
        <div>
          <div class="flex items-center gap-3.5 mb-5">
            <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 font-mono font-bold text-sm">
              6.5
            </span>
            <h3 class="font-serif text-2xl md:text-3xl text-stone-900">Acompanhamento da Execução & Cronograma da Apresentação</h3>
          </div>

          <div class="overflow-x-auto shadow-xs rounded-2xl border border-stone-800/10 bg-white">
            <table class="editorial-table text-xs md:text-sm">
              <thead>
                <tr>
                  <th class="w-36">Data</th>
                  <th>Atividade Programada</th>
                  <th class="w-48">Responsável</th>
                  <th class="w-36 text-center">Situação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-mono font-semibold text-stone-800 whitespace-nowrap">29/10/2026</td>
                  <td>Publicação da versão oficial 8.0 do Manual de Processos de Software.</td>
                  <td class="font-mono">Luis Henrique</td>
                  <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Concluída</span></td>
                </tr>
                <tr>
                  <td class="font-mono font-semibold text-stone-800 whitespace-nowrap">até 05/11/2026</td>
                  <td>Conferir e validar rastreabilidade com os componentes do repositório (ação 5).</td>
                  <td class="font-mono">Matheus, Carlos</td>
                  <td class="text-center"><span class="badge-chip bg-emerald-100 text-emerald-900 font-bold">Concluída</span></td>
                </tr>
                <tr>
                  <td class="font-mono font-semibold text-stone-800 whitespace-nowrap">até 12/11/2026</td>
                  <td>Ensaio geral da apresentação acadêmica com cronômetro estrito (20 a 30 min).</td>
                  <td class="font-mono">Todos os membros</td>
                  <td class="text-center"><span class="badge-chip bg-blue-100 text-blue-900 font-bold">Planejada</span></td>
                </tr>
                <tr class="bg-amber-50/70 font-semibold">
                  <td class="font-mono font-bold text-amber-950 whitespace-nowrap">26/11/2026</td>
                  <td><strong>Apresentação Oficial do Grupo 12 (Squad Rhyme Core) perante a banca UFG.</strong></td>
                  <td class="font-mono">Todos os membros</td>
                  <td class="text-center"><span class="badge-chip bg-amber-200 text-amber-950 font-bold border border-amber-400/50">Marco Final</span></td>
                </tr>
                <tr>
                  <td class="font-mono font-semibold text-stone-800 whitespace-nowrap">Pós-entrega</td>
                  <td>Reavaliar métricas da seção 4.5 e abrir nova ação corretiva caso haja desvio em produção.</td>
                  <td class="font-mono">Carlos Daniel (SQA)</td>
                  <td class="text-center"><span class="badge-chip bg-stone-100 text-stone-600 font-medium">Planejada</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
"""
