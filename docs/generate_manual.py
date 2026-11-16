# -*- coding: utf-8 -*-
"""
Main assembler for manual-de-processos.html
Embeds crisp vector SVGs with strict aspect-ratio preservation and clean typography.
"""

import os
import sys
import re
import html

parts_dir = os.path.join(os.path.dirname(__file__), "parts")
sys.path.insert(0, parts_dir)

from head_and_styles import HEAD_AND_STYLES
from navigation import NAVIGATION_HTML
from capa_and_historico import CAPA_AND_HISTORICO_HTML
from capitulo1 import CAPITULO1_HTML
from capitulo2 import CAPITULO2_HTML
from capitulo3 import CAPITULO3_HTML
from capitulo4 import CAPITULO4_HTML
from capitulo5 import CAPITULO5_HTML
from capitulo6 import CAPITULO6_HTML
from pops_and_footer import POPS_AND_FOOTER_HTML
from scripts_js import SCRIPTS_JS_HTML

DIAG_DIR = r"c:\Users\kamik\Desktop\Rhyme\docs\UFG\diagramas"

def get_puml(filename):
    p = os.path.join(DIAG_DIR, filename)
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return html.escape(f.read())
    return ""

def get_svg(filename):
    p = os.path.join(DIAG_DIR, filename)
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            svg = f.read()
            # 1. Remover prólogo XML e Doctype
            svg = re.sub(r'<\?xml[^>]*\?>', '', svg)
            svg = re.sub(r'<!DOCTYPE[^>]*>', '', svg)
            
            # 2. Corrigir distorção: substituir preserveAspectRatio="none" por "xMidYMid meet"
            svg = re.sub(r'preserveAspectRatio="none"', 'preserveAspectRatio="xMidYMid meet"', svg)
            
            # 3. Limpar a tag raiz <svg>: remover style com dimensões fixas em px
            m = re.search(r'<svg([^>]+)>', svg)
            if m:
                tag = m.group(0)
                new_tag = re.sub(r'style="[^"]*"', 'style="max-width: 100%; height: auto; display: block; margin: 0 auto;"', tag)
                new_tag = re.sub(r'width="\d+px"', 'width="100%"', new_tag)
                new_tag = re.sub(r'height="\d+px"', '', new_tag)
                svg = svg[:m.start()] + new_tag + svg[m.end():]
                
            return svg.strip()
    return ""

puml_casos = get_puml("casos-de-uso.puml")
puml_sequencia = get_puml("sequencia-tempo-real.puml")
puml_componentes = get_puml("componentes-arquitetura.puml")
puml_modelo = get_puml("modelo-dados-firestore.puml")

svg_casos = get_svg("Diagrama_Casos_de_Uso_Rhyme.svg")
svg_sequencia = get_svg("Diagrama_Sequencia_Rhyme.svg")
svg_componentes = get_svg("Diagrama_Componentes_Rhyme.svg")
svg_modelo = get_svg("Diagrama_Modelo_Dados_Firestore.svg")

# Substituições no capítulo 5
cap5 = CAPITULO5_HTML
cap5 = cap5.replace("__SVG_CASOS__", svg_casos)
cap5 = cap5.replace("__SVG_SEQUENCIA__", svg_sequencia)
cap5 = cap5.replace("__SVG_COMPONENTES__", svg_componentes)
cap5 = cap5.replace("__SVG_MODELO__", svg_modelo)

cap5 = cap5.replace("__PUML_CASOS__", puml_casos)
cap5 = cap5.replace("__PUML_SEQUENCIA__", puml_sequencia)
cap5 = cap5.replace("__PUML_COMPONENTES__", puml_componentes)
cap5 = cap5.replace("__PUML_MODELO__", puml_modelo)

full_html = "".join([
    HEAD_AND_STYLES,
    NAVIGATION_HTML,
    CAPA_AND_HISTORICO_HTML,
    CAPITULO1_HTML,
    CAPITULO2_HTML,
    CAPITULO3_HTML,
    CAPITULO4_HTML,
    cap5,
    CAPITULO6_HTML,
    POPS_AND_FOOTER_HTML,
    SCRIPTS_JS_HTML
])

out_path = r"c:\Users\kamik\Desktop\Rhyme\docs\manual-de-processos.html"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(full_html)

print("Generated:", out_path)
print("Total size:", len(full_html), "bytes")
print("Total lines:", len(full_html.splitlines()))
