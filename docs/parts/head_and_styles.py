# -*- coding: utf-8 -*-
HEAD_AND_STYLES = """<!doctype html>
<html lang="pt-BR" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Manual de Processos de Software — Rhyme | Versão Oficial 8.0</title>
    <meta
      name="description"
      content="Manual de Processos de Software v8.0 para o sistema Rhyme (Telemetria em Tempo Real para Transporte Universitário Intermunicipal) — UFG INF0449. Referencial ISO/IEC/IEEE 12207:2017."
    />

    <!-- Tailwind CSS & Iconify -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>

    <!-- Google Fonts: Instrument Sans, Newsreader, Inter, IBM Plex Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400&display=swap"
      rel="stylesheet"
    />

    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              warm: {
                beige: '#E6E3D6',
                surface: '#FAF9F5',
                card: '#FFFFFF',
                light: '#EAE8DE',
                sage: '#9EA08F',
                lime: '#D4F268',
                limeHover: '#C3E354',
                dark: '#1C1917',
              },
              rhyme: {
                primary: '#0F172A',
                accent: '#0D9488',
                accentDark: '#0F766E',
                accentLight: '#2DD4BF',
                bus: '#F59E0B',
                route: '#6366F1',
              },
              stone: {
                950: '#0c0a09',
                900: '#1c1917',
                800: '#292524',
                700: '#44403c',
                600: '#57534e',
                500: '#78716c',
                400: '#a8a29e',
                300: '#d6d3d1',
                200: '#e7e5e4',
                100: '#f5f5f4',
                50: '#fafaf9',
              },
            },
            fontFamily: {
              sans: ['"Instrument Sans"', 'Inter', 'system-ui', 'sans-serif'],
              serif: ['"Newsreader"', 'Georgia', 'serif'],
              mono: ['"IBM Plex Mono"', 'Menlo', 'monospace'],
            },
          },
        },
      };
    </script>

    <style>
      body {
        font-family: 'Instrument Sans', sans-serif;
        background-color: #E6E3D6;
        color: #1C1917;
        line-height: 1.62;
        letter-spacing: -0.01em;
        transition: background-color 0.25s ease, color 0.25s ease;
      }

      .font-serif {
        font-family: 'Newsreader', serif;
      }

      .font-mono {
        font-family: 'IBM Plex Mono', monospace;
      }

      /* Sticky Navigation */
      .ds-nav {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: rgba(230, 227, 214, 0.95);
        backdrop-filter: blur(14px);
        border-bottom: 1px solid rgba(28, 25, 23, 0.12);
        transition: all 0.3s ease;
      }

      /* Clean Card Hover Micro-Interactions */
      .ds-card {
        background-color: #FFFFFF;
        border: 1px solid rgba(28, 25, 23, 0.1);
        border-radius: 1.25rem;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
      }
      .ds-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px -8px rgba(28, 25, 23, 0.08);
        border-color: rgba(28, 25, 23, 0.2);
      }

      /* Clean Editorial Tables - Compactas, Sem Scroll Desnecessário */
      .editorial-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 1rem;
        overflow: hidden;
        border: 1px solid rgba(28, 25, 23, 0.12);
        background: #FFFFFF;
      }
      .editorial-table th {
        background-color: #F5F3EC;
        color: #1C1917;
        font-family: 'Instrument Sans', sans-serif;
        font-weight: 600;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 0.85rem 1.15rem;
        border-bottom: 1px solid rgba(28, 25, 23, 0.12);
      }
      .editorial-table td {
        padding: 0.85rem 1.15rem;
        font-size: 0.875rem;
        border-bottom: 1px solid rgba(28, 25, 23, 0.06);
        color: #292524;
        vertical-align: middle;
      }
      .editorial-table tr:last-child td {
        border-bottom: none;
      }
      .editorial-table tr:hover td {
        background-color: rgba(245, 243, 236, 0.4);
      }

      /* Badges & Pills - Nunca Quebram nem Cortam */
      .badge-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        padding: 0.2rem 0.65rem;
        border-radius: 9999px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.75rem;
        font-weight: 600;
        line-height: 1.25;
      }

      /* SVG Diagram Container - Preserva Proporções Nativas */
      .svg-viewer-container {
        background: #FFFFFF;
        border-radius: 1.25rem;
        border: 1px solid rgba(28, 25, 23, 0.12);
        padding: 1.5rem;
        overflow-x: auto;
        box-shadow: 0 4px 16px -6px rgba(28, 25, 23, 0.05);
        text-align: center;
      }
      .svg-viewer-container svg {
        display: block;
        margin: 0 auto;
        max-width: 100%;
        height: auto;
      }

      /* Progress Bar */
      #readingProgress {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: #0D9488;
        z-index: 105;
        transition: width 0.1s linear;
      }

      /* Print & PDF Layout Rules */
      @media print {
        @page {
          size: A4 portrait;
          margin: 1.5cm 1.2cm 1.5cm 1.2cm;
        }
        body {
          background: #ffffff !important;
          color: #1c1917 !important;
          font-size: 10pt !important;
          line-height: 1.45 !important;
        }
        .ds-nav,
        #readingProgress,
        .no-print {
          display: none !important;
        }
        .print-container {
          max-width: 100% !important;
          padding: 0 !important;
        }
        .print-page-break {
          page-break-before: always !important;
          break-before: page !important;
        }
        .ds-card {
          box-shadow: none !important;
          border: 1px solid #d6d3d1 !important;
          page-break-inside: avoid;
        }
        .editorial-table {
          box-shadow: none !important;
          border: 1px solid #d6d3d1 !important;
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body class="selection:bg-[#D4F268] selection:text-stone-900">
    <div id="readingProgress"></div>
"""
