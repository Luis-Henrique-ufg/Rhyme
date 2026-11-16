# -*- coding: utf-8 -*-
SCRIPTS_JS_HTML = """
    <!-- JAVASCRIPT PRINCIPAL (INTERATIVIDADE, DIAGRAMAS SVG & BUSCA) -->
    <script>
      // Alternância de Abas dos Diagramas SVG
      function selectDiagramTab(tabName) {
        const tabs = ['casos', 'sequencia', 'componentes', 'modelo'];
        tabs.forEach((t) => {
          const panel = document.getElementById(`diagTab-${t}`);
          const btn = document.getElementById(`tabBtn-${t}`);
          if (t === tabName) {
            if (panel) panel.classList.remove('hidden');
            if (btn) {
              btn.className = 'px-4 py-2 rounded-xl bg-white text-stone-900 shadow-xs font-semibold transition-all';
            }
          } else {
            if (panel) panel.classList.add('hidden');
            if (btn) {
              btn.className = 'px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 transition-all font-medium';
            }
          }
        });
      }

      // Alternar exibição do código-fonte PlantUML
      function togglePumlSource(tabName) {
        const el = document.getElementById(`pumlSource-${tabName}`);
        if (el) {
          el.classList.toggle('hidden');
        }
      }

      function copyPuml(tabName) {
        const el = document.getElementById(`code-${tabName}`);
        if (el) {
          navigator.clipboard.writeText(el.innerText).then(() => {
            alert('Código PlantUML copiado para a área de transferência!');
          }).catch(() => {});
        }
      }

      // Simulador Interativo da UI (One-Touch & Cockpit)
      let currentSimStatus = 'released';
      let samambaiaCount = 14;

      function setSimStatus(status) {
        currentSimStatus = status;
        const btns = ['in_class', 'released', 'at_stop', 'boarded'];
        btns.forEach((b) => {
          const btn = document.getElementById(`simBtn-${b}`);
          if (btn) {
            if (b === status) {
              btn.className = 'p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-600 text-xs md:text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all';
            } else {
              btn.className = 'p-3.5 rounded-xl border border-stone-600 bg-stone-700/50 hover:bg-stone-700 text-xs md:text-sm font-medium text-stone-300 flex items-center justify-center gap-2 transition-all';
            }
          }
        });

        const isoDate = new Date().toISOString();
        const payloadEl = document.getElementById('simPayloadJson');
        if (payloadEl) {
          payloadEl.innerText = `{\n  "status": "${status}",\n  "updatedAt": "${isoDate}"\n}`;
        }

        const alertText = document.getElementById('cockpitAlertText');
        const counterEl = document.getElementById('cockpitCounterSamambaia');

        if (status === 'released') {
          samambaiaCount = 14;
          if (alertText) alertText.innerText = 'Alerta Sonoro: Aluno informou LIBERADO!';
          triggerTestAudioAlert();
        } else if (status === 'at_stop') {
          if (alertText) alertText.innerText = 'Notificação: Aluno aguardando no ponto.';
        } else if (status === 'boarded') {
          samambaiaCount = Math.max(0, samambaiaCount - 1);
          if (alertText) alertText.innerText = 'Confirmação: Embarque validado no ônibus.';
        } else {
          if (alertText) alertText.innerText = 'Status: Aluno permanece em sala de aula.';
        }

        if (counterEl) counterEl.innerText = samambaiaCount;
      }

      // Síntese de Áudio para o Alerta do Cockpit (Web Audio API nativa)
      function triggerTestAudioAlert() {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880.0, audioCtx.currentTime + 0.15); // A5

          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.36);
        } catch (e) {
          console.log('AudioContext indisponível.');
        }
      }

      // Modal de Busca Global (Ctrl+K)
      const searchableItems = [
        { id: 'RF01', title: 'RF01: Autenticação Firebase Auth', section: '#sec5' },
        { id: 'RF02', title: 'RF02: Seleção de rota e faculdade', section: '#sec5' },
        { id: 'RF03', title: 'RF03: Status One-Touch (released, boarded)', section: '#sec5' },
        { id: 'RF04', title: 'RF04: Mapa Leaflet com posição a cada 5s', section: '#sec5' },
        { id: 'RF05', title: 'RF05: GPS Colaborativo / Passageiro Âncora', section: '#sec5' },
        { id: 'RF06', title: 'RF06: Cockpit do motorista e alerta sonoro', section: '#sec5' },
        { id: 'RF07', title: 'RF07: Sincronização reativa onSnapshot', section: '#sec5' },
        { id: 'RF08', title: 'RF08: Cálculo de ETA às paradas', section: '#sec5' },
        { id: 'RF09', title: 'RF09: Geofencing 1 km e notificação push', section: '#sec5' },
        { id: 'RF10', title: 'RF10: Botão de emergência "Fui Esquecido"', section: '#sec5' },
        { id: 'RNF01', title: 'RNF01: Desempenho e Web Vitals', section: '#sec5' },
        { id: 'RNF02', title: 'RNF02: Disponibilidade 99,9%', section: '#sec5' },
        { id: 'RNF05', title: 'RNF05: Segurança e Conformidade LGPD', section: '#sec5' },
        { id: 'CT-01', title: 'CT-01: Login e persistência de sessão', section: '#sec5' },
        { id: 'CT-02', title: 'CT-02: Rota piloto e câmpus Samambaia', section: '#sec5' },
        { id: 'CT-03', title: 'CT-03: Liberação em 4G (< 100 ms)', section: '#sec5' },
        { id: 'CT-10', title: 'CT-10: Fui Esquecido offline com Service Worker', section: '#sec5' },
        { id: 'ADR-001', title: 'ADR-001: PWA vs Apps Nativos', section: '#sec4' },
        { id: 'ADR-002', title: 'ADR-002: Leaflet + Mapbox API (Free Tier)', section: '#sec4' },
        { id: 'ADR-003', title: 'ADR-003: Google Firebase Realtime', section: '#sec4' },
        { id: 'ADR-004', title: 'ADR-004: Vercel CDN + Firebase Hosting', section: '#sec4' },
        { id: 'RT-01', title: 'RT-01: Risco de sombra 4G nos trechos rurais (IndexedDB)', section: '#sec4' },
        { id: 'RT-02', title: 'RT-02: Bateria do motorista (Passageiro Âncora)', section: '#sec4' },
        { id: 'POP-DEV-01', title: 'POP-DEV-01: Git Flow & Conventional Commits', section: '#sec-pop' },
        { id: 'POP-OPS-01', title: 'POP-OPS-01: CI/CD & Deploy na Vercel', section: '#sec-pop' },
        { id: 'POP-GEO-01', title: 'POP-GEO-01: Calibração de Geofencing 1km', section: '#sec-pop' },
        { id: 'POP-EMERG-01', title: 'POP-EMERG-01: Protocolo de Emergência', section: '#sec-pop' },
      ];

      function openSearchModal() {
        const modal = document.getElementById('searchModal');
        const box = document.getElementById('searchModalBox');
        const input = document.getElementById('searchInput');
        if (modal && box && input) {
          modal.classList.remove('opacity-0', 'pointer-events-none');
          box.classList.remove('scale-95');
          box.classList.add('scale-100');
          setTimeout(() => input.focus(), 50);
        }
      }

      function closeSearchModal() {
        const modal = document.getElementById('searchModal');
        const box = document.getElementById('searchModalBox');
        if (modal && box) {
          modal.classList.add('opacity-0', 'pointer-events-none');
          box.classList.remove('scale-100');
          box.classList.add('scale-95');
        }
      }

      function handleSearch(val) {
        const q = val.trim().toLowerCase();
        const resultsEl = document.getElementById('searchResults');
        if (!resultsEl) return;

        if (!q) {
          resultsEl.innerHTML = '<div class="p-3 text-xs md:text-sm text-stone-500 text-center">Digite para pesquisar em todos os capítulos do manual...</div>';
          return;
        }

        const filtered = searchableItems.filter(item => item.id.toLowerCase().includes(q) || item.title.toLowerCase().includes(q));

        if (filtered.length === 0) {
          resultsEl.innerHTML = '<div class="p-3 text-xs md:text-sm text-stone-500 text-center">Nenhum resultado encontrado.</div>';
          return;
        }

        resultsEl.innerHTML = filtered.map(item => `
          <a
            href="${item.section}"
            onclick="closeSearchModal()"
            class="p-3 rounded-2xl hover:bg-stone-100 flex items-center justify-between text-xs md:text-sm text-stone-800 transition-colors block border border-transparent hover:border-stone-200"
          >
            <span class="font-medium">${item.title}</span>
            <span class="badge-chip bg-stone-200 text-stone-700 text-xs">${item.id}</span>
          </a>
        `).join('');
      }

      // Atalho de Teclado Global Ctrl+K / Cmd+K e ESC
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          openSearchModal();
          return;
        }
        if (e.key === 'Escape') {
          closeSearchModal();
        }
      });

      // Barra de Progresso de Leitura
      window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const bar = document.getElementById('readingProgress');
        if (bar) bar.style.width = scrolled + '%';
      });

      // Fechar modal ao clicar fora
      window.addEventListener('click', (e) => {
        const modal = document.getElementById('searchModal');
        if (e.target === modal) {
          closeSearchModal();
        }
      });
    </script>
  </body>
</html>
"""
