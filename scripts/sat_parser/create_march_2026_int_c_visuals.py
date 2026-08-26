#!/usr/bin/env python3
"""Create clean, original vector visuals for March 2026 Int-C (no source art)."""
from __future__ import annotations

from pathlib import Path

ROOT = Path("public/sat_images")
PREFIX = "2026_March_Int-C_EliteXSAT"
STYLE = "font-family:Arial,sans-serif;fill:#172033;stroke:#172033"

def save(folder: str, page: int, q: int, body: str, box="0 0 600 420"):
    path = ROOT / folder / f"{PREFIX}_p{page}_q{q}.svg"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" role="img" aria-label="SAT question visual"><rect width="100%" height="100%" fill="white"/>{body}</svg>', encoding="utf-8")

def grid(x, y, w, h, step=25):
    lines = ''.join(f'<path d="M{x+i} {y}V{y+h} M{x} {y+i}H{x+w}" stroke="#cbd5e1" stroke-width="1"/>' for i in range(0, min(w,h)+1, step))
    return lines + f'<path d="M{x} {y+h/2}H{x+w} M{x+w/2} {y}V{y+h}" stroke="#172033" stroke-width="2"/>'

def table(x,y,width,headers,rows):
    cols=len(headers); rh=42; cw=width/cols; out=f'<g style="{STYLE}" font-size="16">'
    for r,row in enumerate([headers]+rows):
        for c,val in enumerate(row):
            yy=y+r*rh; out+=f'<rect x="{x+c*cw}" y="{yy}" width="{cw}" height="{rh}" fill="{ "#f8fafc" if r==0 else "white"}" stroke="#334155"/><text x="{x+(c+.5)*cw}" y="{yy+27}" text-anchor="middle" stroke="none">{val}</text>'
    return out+"</g>"

# R&W: line chart, isotope table, mobility bars.
fish = grid(125,55,330,210,33)+'''<g style="font-family:Arial;font-size:13;fill:#172033"><text x="290" y="24" text-anchor="middle">Fish Population in a Taiwanese Tide Pool</text><text x="290" y="42" text-anchor="middle">January 2001 to October 2001</text><text x="115" y="272">Jan</text><text x="205" y="272">Apr</text><text x="300" y="272">Jul</text><text x="390" y="272">Oct</text></g><polyline points="125,60 235,240 345,245 455,245" fill="none" stroke="#111827" stroke-width="4"/><polyline points="125,210 235,230 345,235 455,200" fill="none" stroke="#111827" stroke-width="3" stroke-dasharray="8 5"/><polyline points="125,250 235,250 345,240 455,230" fill="none" stroke="#111827" stroke-width="3" stroke-dasharray="2 5"/>'''
save("ebrw",12,12,fish)
save("ebrw",37,10,table(105,55,390,["87Sr/86Sr ratio","Numerical age (Ma)"],[["0.708980","6.20"],["0.709000","5.86"],["0.709020","5.40"],["0.709040","4.75"],["0.709060","3.00"]]))
bars = grid(105,55,400,210,50)+'''<g fill="#111827"><rect x="130" y="85" width="18" height="180"/><rect x="151" y="100" width="18" height="165" fill="white" stroke="#111827"/><rect x="172" y="145" width="18" height="120"/><rect x="230" y="220" width="18" height="45"/><rect x="251" y="205" width="18" height="60" fill="white" stroke="#111827"/><rect x="272" y="215" width="18" height="50"/><rect x="330" y="245" width="18" height="20"/><rect x="351" y="230" width="18" height="35" fill="white" stroke="#111827"/><rect x="372" y="220" width="18" height="45"/><rect x="430" y="55" width="18" height="210"/><rect x="451" y="160" width="18" height="105" fill="white" stroke="#111827"/><rect x="472" y="215" width="18" height="50"/></g><text x="300" y="305" text-anchor="middle" style="font-family:Arial;font-size:16">Mobility pattern by country</text>'''
save("ebrw",38,11,bars)

# Math: similar triangles, coordinate graphs, and tables.
tri = '''<g style="%s" fill="none" stroke-width="3"><path d="M90 300 L180 300 L205 180 Z M300 300 L470 300 L520 65 Z"/></g><g style="font-family:Arial;font-size:22;fill:#172033"><text x="78" y="318">D</text><text x="178" y="318">F</text><text x="208" y="175">E</text><text x="290" y="318">Q</text><text x="470" y="318">S</text><text x="522" y="60">R</text><text x="130" y="295">e</text><text x="185" y="245">d</text><text x="145" y="235">f</text><text x="370" y="295">ke</text><text x="485" y="200">kd</text><text x="405" y="185">kf</text></g>''' % STYLE
save("math_open",65,11,tri)
linek = grid(100,50,400,300)+ '<path d="M130 55 L440 350" stroke="#111827" stroke-width="4"/><circle cx="265" cy="200" r="6"/><circle cx="335" cy="270" r="6"/>'
save("math_mcq",67,13,linek)
exp = grid(90,45,420,300)+ '<path d="M95 115 C220 120 250 135 280 190 C300 235 310 300 320 340" fill="none" stroke="#111827" stroke-width="4"/>'
save("math_mcq",68,14,exp)
save("math_mcq",74,20,grid(95,50,410,290)+'<path d="M180 55 L385 340" stroke="#111827" stroke-width="4"/>')
save("math_mcq",78,2,grid(95,45,410,290)+'<path d="M95 150 C290 150 310 130 340 45" stroke="#111827" stroke-width="4" fill="none"/>')
scatter = grid(100,50,400,280,45)+ '<path d="M100 90 L500 300" stroke="#111827" stroke-width="3"/><g fill="#111827">'+''.join(f'<circle cx="{x}" cy="{y}" r="6"/>' for x,y in [(145,105),(195,155),(245,175),(325,220),(375,245),(430,280)])+'</g><text x="300" y="380" text-anchor="middle" style="font-family:Arial;font-size:16">Elevation (feet)</text><text x="25" y="190" transform="rotate(-90 25 190)" style="font-family:Arial;font-size:16">Temperature (°F)</text>'
save("math_mcq",82,6,scatter)
save("math_mcq",83,7,grid(95,45,410,290)+'<path d="M225 340 Q275 80 325 340" fill="none" stroke="#111827" stroke-width="4"/><path d="M95 155 H505" stroke="#111827" stroke-width="4"/>')
save("math_mcq",91,15,table(85,70,430,["Average pitching speed","Number of pitchers"],[["At least 30 mph but less than 35 mph","12"],["At least 35 mph but less than 40 mph","7"],["At least 40 mph but less than 45 mph","4"],["At least 45 mph but less than 50 mph","1"]]))
save("math_mcq",97,21,table(215,80,180,["x","h(x)"],[["0","15"],["1","16"],["2","18"]]))
