# -*- coding: utf-8 -*-
NAVIGATION_HTML = """
    <!-- TOP STICKY BAR: LEITURA & GOVERNANÇA -->
    <nav class="ds-nav py-4 px-6 md:px-10" aria-label="Navegação do Manual">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a
            href="#top"
            class="flex items-center gap-3 text-stone-900 font-serif text-xl font-medium tracking-tight hover:opacity-85 transition-opacity"
          >
            <div
              class="w-9 h-9 rounded-xl bg-stone-900 text-[#E6E3D6] flex items-center justify-center font-bold text-base shadow-sm"
            >
              R
            </div>
            <span class="font-bold font-sans tracking-tight text-lg">Rhyme</span>
            <span
              class="text-xs font-mono uppercase tracking-wider text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300/60 font-semibold"
              >v8.0 Oficial</span
            >
          </a>
        </div>

        <div class="hidden xl:flex items-center gap-6 text-xs font-sans font-medium text-stone-600">
          <a href="#capa" class="hover:text-stone-900 transition-colors">Capa & Squad</a>
          <a href="#historico" class="hover:text-stone-900 transition-colors">Histórico</a>
          <a href="#sec1" class="hover:text-stone-900 transition-colors">1. Apresentação</a>
          <a href="#sec2" class="hover:text-stone-900 transition-colors">2. Acordo</a>
          <a href="#sec3" class="hover:text-stone-900 transition-colors">3. Organizacional</a>
          <a href="#sec4" class="hover:text-stone-900 transition-colors">4. Gerenciamento</a>
          <a href="#sec5" class="hover:text-stone-900 transition-colors">5. Processos Técnicos</a>
          <a href="#sec6" class="hover:text-stone-900 transition-colors">6. Melhoria</a>
          <a href="#sec-pop" class="hover:text-stone-900 transition-colors">POPs</a>
        </div>

        <div class="flex items-center gap-3">
          <button
            onclick="openSearchModal()"
            class="px-3.5 py-2 rounded-full border border-stone-800/15 bg-white/70 text-stone-700 text-xs font-medium flex items-center gap-2 hover:bg-white hover:border-stone-800/30 transition-all shadow-xs"
            title="Buscar requisitos, testes, riscos ou ADRs (Ctrl+K)"
          >
            <iconify-icon icon="solar:magnifer-linear" width="16"></iconify-icon>
            <span class="hidden md:inline font-sans font-medium">Buscar no Manual</span>
            <kbd class="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 bg-stone-200/80 rounded text-stone-600">⌘K</kbd>
          </button>

          <button
            onclick="window.print()"
            class="px-3.5 py-2 rounded-full border border-stone-800/15 bg-stone-900 text-[#E6E3D6] text-xs font-medium flex items-center gap-1.5 hover:bg-stone-800 transition-colors shadow-xs"
            title="Imprimir / Exportar PDF do Manual Completo"
          >
            <iconify-icon icon="solar:printer-linear" width="16"></iconify-icon>
            <span class="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>
    </nav>
"""
