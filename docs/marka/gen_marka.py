"""Bite Routine marka ikonu varyantları: SVG geometri + tuval artboard üreticisi.

Kullanım: python3 gen_marka.py <root>   (root/project/ altına M-*.dc.html yazar)
          python3 gen_marka.py --sheet <out.svg>   (yalnız ana görsellerin kontak sayfası)
"""
import math
import os
import sys

INK = "#1f1f1c"
BG = "#f4f1ea"
SURF = "#fbf9f4"
SAND = "#e8e2d3"
SAGE = "#9db39a"
GREEN = "#4a6647"
MUTED = "#5c584f"
INK_TRACK = "#34332e"

_uid = [0]


def uid():
    _uid[0] += 1
    return _uid[0]


def ring(cx, cy, r, w, color, frac=1.0, opacity=1.0):
    op = f' opacity="{opacity}"' if opacity != 1.0 else ""
    if frac >= 1:
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="{w}"{op} />'
    c = 2 * math.pi * r
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="{w}" '
        f'stroke-linecap="round" stroke-dasharray="{c * frac:.1f} {c:.1f}" transform="rotate(-90 {cx} {cy})"{op} />'
    )


# Her varyant: bg rengi + glyph(m) fonksiyonu. m=None → tam renk; m="#hex" → tek renk (monochrome/bildirim).
def g_a1(m):
    return ring(512, 512, 300, 112, m or INK_TRACK, opacity=0.35 if m else 1.0) + ring(512, 512, 300, 112, m or SAGE, 0.72)


def g_a2(m):
    return ring(512, 512, 300, 112, m or SAND, opacity=0.35 if m else 1.0) + ring(512, 512, 300, 112, m or INK, 0.72)


def g_a3(m):
    return (
        ring(512, 512, 320, 96, m or SAND, opacity=0.35 if m else 1.0)
        + ring(512, 512, 320, 96, m or INK, 0.78)
        + f'<circle cx="512" cy="512" r="150" fill="{m or SAGE}" />'
    )


def spoon_v(cx, top, head_rx, head_ry, handle_w, bottom, color):
    hy = top + head_ry
    return (
        f'<ellipse cx="{cx}" cy="{hy}" rx="{head_rx}" ry="{head_ry}" fill="{color}" />'
        f'<rect x="{cx - handle_w / 2}" y="{hy + head_ry * 0.6}" width="{handle_w}" height="{bottom - hy - head_ry * 0.6}" rx="{handle_w / 2}" fill="{color}" />'
    )


def g_b1(m):
    s = f'<circle cx="440" cy="512" r="290" fill="{m or SURF}" />'
    if not m:
        s += f'<circle cx="440" cy="512" r="200" fill="none" stroke="{SAND}" stroke-width="16" />'
    s += spoon_v(812, 232, 64, 96, 40, 800, m or INK)
    return s


def g_b2(m):
    bowl = m or SURF
    steam = m or SAGE
    s = (
        f'<path d="M222 520 H802 A290 290 0 0 1 512 810 A290 290 0 0 1 222 520 Z" fill="{bowl}" />'
        f'<rect x="202" y="492" width="620" height="56" rx="28" fill="{bowl}" />'
        f'<rect x="417" y="790" width="190" height="56" rx="28" fill="{bowl}" />'
    )
    for x in (402, 512, 622):
        s += (
            f'<path d="M{x} 420 c-44 -42 44 -74 0 -116 c-44 -42 44 -74 0 -116" fill="none" '
            f'stroke="{steam}" stroke-width="40" stroke-linecap="round" />'
        )
    return s


def g_b3(m):
    c = m or INK
    s = ring(512, 512, 190, 44, c)
    s += ring(512, 512, 112, 28, m or SAGE, opacity=0.5 if m else 1.0)
    # çatal (sol)
    for x in (186, 214, 242):
        s += f'<line x1="{x}" y1="300" x2="{x}" y2="410" stroke="{c}" stroke-width="18" stroke-linecap="round" />'
    s += f'<path d="M186 410 Q186 474 214 480 Q242 474 242 410" fill="none" stroke="{c}" stroke-width="18" stroke-linecap="round" />'
    s += f'<line x1="214" y1="478" x2="214" y2="730" stroke="{c}" stroke-width="36" stroke-linecap="round" />'
    # kaşık (sağ)
    s += f'<ellipse cx="810" cy="360" rx="46" ry="68" fill="{c}" />'
    s += f'<line x1="810" y1="420" x2="810" y2="730" stroke="{c}" stroke-width="36" stroke-linecap="round" />'
    return s


def b_mono(stem, bowl_track, bowl_arc, arc_frac=1.0, track_op=1.0):
    s = '<g transform="translate(-54 -13)">'
    if arc_frac < 1:
        s += ring(566, 610, 190, 120, bowl_track, opacity=track_op)
        s += f'<rect x="318" y="190" width="120" height="670" rx="60" fill="{stem}" />'
        s += ring(566, 610, 190, 120, bowl_arc, arc_frac)
    else:
        s += ring(566, 610, 190, 120, bowl_arc)
        s += f'<rect x="318" y="190" width="120" height="670" rx="60" fill="{stem}" />'
    s += "</g>"
    return s


def g_c1(m):
    return b_mono(m or INK, None, m or INK)


def g_c2(m):
    if m:
        return b_mono(m, m, m, 0.55, 0.35)
    return b_mono(SURF, INK_TRACK, SAGE, 0.55)


def g_c3(m):
    return b_mono(m or SURF, None, m or SURF)


def bite_mask(cx, cy, edge_r, k=1.0):
    """Sağ üst kenardan üç yuvarlak ısırık (diş izi). k: ısırık ölçeği."""
    u = uid()
    d = edge_r + 12 * k
    circles = ""
    for ang, rr in ((-76, 96), (-45, 106), (-14, 96)):
        a = math.radians(ang)
        circles += f'<circle cx="{cx + d * math.cos(a):.1f}" cy="{cy + d * math.sin(a):.1f}" r="{rr * k:.1f}" fill="#000" />'
    mask = (
        f'<mask id="bite{u}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
        f'<rect width="1024" height="1024" fill="#fff" />{circles}</mask>'
    )
    return mask, f"bite{u}"


def g_d_disc(color):
    mask, mid = bite_mask(512, 530, 290)
    return f'<defs>{mask}</defs><g mask="url(#{mid})"><circle cx="512" cy="530" r="290" fill="{color}" /></g>'


def g_d1(m):
    return g_d_disc(m or SAGE)


def g_d2(m):
    mask, mid = bite_mask(512, 524, 320)
    s = f'<defs>{mask}</defs><g mask="url(#{mid})">' + ring(512, 524, 265, 110, m or INK) + "</g>"
    s += f'<circle cx="512" cy="524" r="96" fill="{m or SAGE}" />'
    return s


def g_d3(m):
    return g_d_disc(m or SURF)


def spoon_in_ring(track, arc, spoon, frac=0.72, track_op=1.0):
    s = ring(512, 512, 320, 84, track, opacity=track_op)
    s += ring(512, 512, 320, 84, arc, frac)
    s += '<g transform="rotate(-35 512 512)">'
    s += f'<ellipse cx="512" cy="378" rx="78" ry="112" fill="{spoon}" />'
    s += f'<rect x="490" y="440" width="44" height="300" rx="22" fill="{spoon}" />'
    s += "</g>"
    return s


def g_e1(m):
    if m:
        return spoon_in_ring(m, m, m, 0.72, 0.35)
    return spoon_in_ring(SAND, INK, INK)


def g_e2(m):
    if m:
        return spoon_in_ring(m, m, m, 0.72, 0.35)
    return spoon_in_ring(INK_TRACK, SAGE, SURF)



LEAF = "#7e9c78"  # açık yeşil zemin (siyah çatal-kaşık için yeterli kontrast)
SIMIT = "#c8955a"
SESAME = "#f4e6cc"


def cutlery(c, right="fork"):
    s = spoon_v(176, 300, 50, 76, 34, 740, c)
    if right == "fork":
        for x in (822, 850, 878):
            s += f'<line x1="{x}" y1="300" x2="{x}" y2="404" stroke="{c}" stroke-width="17" stroke-linecap="round" />'
        s += f'<path d="M822 404 Q822 466 850 472 Q878 466 878 404" fill="none" stroke="{c}" stroke-width="17" stroke-linecap="round" />'
        s += f'<line x1="850" y1="470" x2="850" y2="740" stroke="{c}" stroke-width="34" stroke-linecap="round" />'
    else:  # bıçak
        s += f'<path d="M834 290 C878 300 886 420 880 520 L834 520 Z" fill="{c}" />'
        s += f'<rect x="832" y="506" width="36" height="234" rx="18" fill="{c}" />'
    return s


def plate_bitten(plate, rim, m):
    mask, mid = bite_mask(512, 512, 250, 0.85)
    s = f'<defs>{mask}</defs><g mask="url(#{mid})"><circle cx="512" cy="512" r="250" fill="{plate}" />'
    if rim:
        s += f'<circle cx="512" cy="512" r="182" fill="none" stroke="{rim}" stroke-width="14" />'
    s += "</g>"
    return s


def plate_simit(plate, rim, simit, sesame, m):
    if m:  # tek renk: tabak çember, simit dolu halka
        s = ring(512, 512, 232, 36, m)
    else:
        s = f'<circle cx="512" cy="512" r="250" fill="{plate}" />'
        s += f'<circle cx="512" cy="512" r="190" fill="none" stroke="{rim}" stroke-width="12" />'
    mask, mid = bite_mask(512, 512, 152, 0.55)
    s += f'<defs>{mask}</defs><g mask="url(#{mid})">' + ring(512, 512, 112, 80, m or simit)
    if not m and sesame:
        for i in range(14):
            a = math.radians(i * 360 / 14 + 8)
            rr = 112 + (16 if i % 2 else -14)
            x, y = 512 + rr * math.cos(a), 512 + rr * math.sin(a)
            s += f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="9" ry="5" fill="{sesame}" transform="rotate({i * 360 / 14 + 98:.0f} {x:.1f} {y:.1f})" />'
    s += "</g>"
    return s


def g_f1(m):
    return plate_bitten(m or SURF, None if m else SAND, m) + cutlery(m or INK, "fork")


def g_f2(m):
    return plate_bitten(m or SURF, None if m else SAND, m) + cutlery(m or INK, "knife")


def g_f3(m):
    return plate_simit(SURF, SAND, INK, None, m) + cutlery(m or INK, "fork")


def g_f4(m):
    return plate_simit(SURF, SAND, SIMIT, SESAME, m) + cutlery(m or INK, "fork")


DIRECTIONS = [
    {
        "key": "F",
        "file": "M-F-YesilSofra",
        "name": "Yeşil sofra (yeni)",
        "line": "Yeşil zeminde krem tabak, iki yanında siyah kaşık ve çatal ya da bıçak; ısırık tabakta ya da simitte.",
        "variants": [
            ("F1", "Isırılmış tabak, kaşık ve çatal · koyu yeşil", GREEN, g_f1),
            ("F2", "Isırılmış tabak, kaşık ve bıçak · koyu yeşil", GREEN, g_f2),
            ("F3", "Tabakta ısırılmış simit (siyah) · koyu yeşil", GREEN, g_f3),
            ("F4", "Tabakta ısırılmış susamlı simit · koyu yeşil", GREEN, g_f4),
            ("F5", "F1, açık yeşil zeminde", LEAF, g_f1),
            ("F6", "F4, açık yeşil zeminde", LEAF, g_f4),
        ],
    },
    {
        "key": "A",
        "file": "M-A-Halka",
        "name": "Kalori halkası",
        "line": "Bugün ekranındaki halka; uygulamanın ilk gördüğün şekli.",
        "variants": [
            ("A1", "Koyu zemin, adaçayı halka", INK, g_a1),
            ("A2", "Açık zemin, kömür halka", BG, g_a2),
            ("A3", "Halka ve dolu merkez", BG, g_a3),
        ],
    },
    {
        "key": "B",
        "file": "M-B-Tabak",
        "name": "Tabak ve kaşık",
        "line": "Sofra imgesi; yemek uygulaması olduğu ilk bakışta okunur.",
        "variants": [
            ("B1", "Üstten tabak, yanında kaşık", SAGE, g_b1),
            ("B2", "Buharı tüten çorba kâsesi", INK, g_b2),
            ("B3", "Çatal, tabak, kaşık (çizgi)", BG, g_b3),
        ],
    },
    {
        "key": "C",
        "file": "M-C-Monogram",
        "name": "b monogramı",
        "line": "Adın baş harfi; Nunito gibi yuvarlak ve kalın.",
        "variants": [
            ("C1", "Açık zemin, kömür b", BG, g_c1),
            ("C2", "b'nin göbeği kalori halkası", INK, g_c2),
            ("C3", "Yeşil zemin, krem b", GREEN, g_c3),
        ],
    },
    {
        "key": "D",
        "file": "M-D-Isirik",
        "name": "Isırık (öneri)",
        "line": "Adındaki \"bite\": kenarından bir ısırık alınmış daire.",
        "variants": [
            ("D1", "Koyu zemin, adaçayı ısırık", INK, g_d1),
            ("D2", "Isırılmış kalori halkası", BG, g_d2),
            ("D3", "Yeşil zemin, krem ısırık", GREEN, g_d3),
        ],
    },
    {
        "key": "E",
        "file": "M-E-Kasik",
        "name": "Halkada kaşık (öneri)",
        "line": "Kalori halkasının içinde saat ibresi gibi kaşık: öğün rutini.",
        "variants": [
            ("E1", "Açık zemin, kömür halka ve kaşık", BG, g_e1),
            ("E2", "Koyu zemin, adaçayı halka, krem kaşık", INK, g_e2),
        ],
    },
]

FG_SCALE = 0.66  # Android adaptive ön plan: 108 dp tuvalde glyph ölçeği
CROP = 1024 / 6  # 108 dp'nin görünen orta 72 dp'si


def svg(variant, size, mode="full", mono=None, label=None):
    _, _, bg, fn = variant
    aria = f'role="img" aria-label="{label}"' if label else 'aria-hidden="true"'
    s = lambda vb, inner: (  # noqa: E731
        f'<svg {aria} width="{size}" height="{size}" viewBox="{vb}" style="display: block;">{inner}</svg>'
    )
    scaled = lambda inner: f'<g transform="translate(512 512) scale({FG_SCALE}) translate(-512 -512)">{inner}</g>'  # noqa: E731
    if mode == "full":
        return s("0 0 1024 1024", f'<rect width="1024" height="1024" fill="{bg}" />' + fn(None))
    if mode == "fg":
        return s("0 0 1024 1024", scaled(fn(None)))
    if mode == "bg":
        return s("0 0 1024 1024", f'<rect width="1024" height="1024" fill="{bg}" />')
    if mode == "adaptive":
        vb = f"{CROP:.1f} {CROP:.1f} {1024 - 2 * CROP:.1f} {1024 - 2 * CROP:.1f}"
        return s(vb, f'<rect width="1024" height="1024" fill="{bg}" />' + scaled(fn(None)))
    if mode == "mono":
        vb = f"{CROP:.1f} {CROP:.1f} {1024 - 2 * CROP:.1f} {1024 - 2 * CROP:.1f}"
        return s(vb, scaled(fn(mono)))
    if mode == "notif":
        return s("150 150 724 724", fn(mono))
    raise ValueError(mode)


def tile(variant, size, radius="22.37%", mode="full", extra_style="", label=None, mono=None):
    return (
        f'<div style="width: {size}px; height: {size}px; border-radius: {radius}; overflow: hidden; flex: none; {extra_style}">'
        + svg(variant, size, mode, mono=mono, label=label)
        + "</div>"
    )


HEAD = """<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:#1f1f1c}}a:hover{{color:#000000}}
</style>
</helmet>
"""

TAIL = """</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
"""

CAP = "font-size: 12px; line-height: 16px; color: {c}; white-space: nowrap;"


def overview():
    w, h = 1260, 2660
    rows = ""
    for d in DIRECTIONS:
        cells = ""
        for v in d["variants"]:
            code, name = v[0], v[1]
            cells += f"""
        <div style="width: 290px; display: flex; flex-direction: column; gap: 10px;">
          <p style="margin: 0; font-size: 14px; line-height: 19px; font-weight: 700;">{code} <span style="font-weight: 500; color: {MUTED};">{name}</span></p>
          {tile(v, 160, label=f"{code} ikonu, 160 piksel")}
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1; display: flex; align-items: flex-end; gap: 12px; padding: 12px; border-radius: 16px; background: #dcd6c8;">
              {tile(v, 60)}{tile(v, 40)}
            </div>
            <div style="flex: 1; display: flex; align-items: flex-end; gap: 12px; padding: 12px; border-radius: 16px; background: #151514;">
              {tile(v, 60)}{tile(v, 40)}
            </div>
          </div>
        </div>"""
        rows += f"""
      <section aria-label="Yön {d['key']}" style="display: flex; gap: 24px; padding: 24px; border-radius: 28px; background: {SURF}; box-shadow: 0 1px 2px rgba(31, 31, 28, 0.06), 0 6px 18px rgba(31, 31, 28, 0.06);">
        <div style="width: 180px; flex: none; display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 44px; line-height: 48px; font-weight: 800;">{d['key']}</span>
          <h2 style="margin: 0; font-size: 19px; line-height: 24px; font-weight: 800;">{d['name']}</h2>
          <p style="margin: 0; font-size: 14px; line-height: 20px; color: {MUTED};">{d['line']}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 290px); gap: 20px;">{cells}
        </div>
      </section>"""
    body = f"""<div style="width: {w}px; height: {h}px; box-sizing: border-box; padding: 40px; background: {BG}; color: {INK}; font-family: 'Nunito', system-ui, sans-serif; display: flex; flex-direction: column; gap: 20px;">
  <header style="display: flex; flex-direction: column; gap: 6px;">
    <p style="margin: 0; font-size: 15px; line-height: 20px; font-weight: 800; color: {GREEN};">Bite Routine · Marka</p>
    <h1 style="margin: 0; font-size: 32px; line-height: 38px; font-weight: 800;">Uygulama ikonu yönleri</h1>
    <p style="margin: 0; font-size: 15px; line-height: 21px; color: {MUTED};">Büyük kare 1024 px ana görselin 160 px kopyası. Altındaki şeritler açık ve koyu ana ekranda gerçek boyut: 60 px (ana ekran) ve 40 px (Ayarlar, Spotlight).</p>
  </header>{rows}
</div>
"""
    return HEAD.format(title="Marka — ikon yönleri") + body + TAIL.format(w=w, h=h)


def detail(d):
    n = len(d["variants"])
    w, h = 1100, 130 + n * 540 + (n - 1) * 24 + 100
    blocks = ""
    for v in d["variants"]:
        code, name, bg = v[0], v[1], v[2]

        def ios_panel(title, panel_bg, fg, sub):
            return f"""
          <div style="display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 20px; background: {panel_bg};">
            <span style="font-size: 13px; line-height: 18px; font-weight: 700; color: {fg};">{title}</span>
            <div style="display: flex; align-items: flex-end; gap: 16px;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">{tile(v, 180)}<span style="{CAP.format(c=sub)}">180 px</span></div>
              <div style="width: 72px; display: flex; flex-direction: column; align-items: center; gap: 4px;">{tile(v, 60)}<span style="font-size: 11px; line-height: 14px; color: {fg}; white-space: nowrap;">Bite Routine</span><span style="{CAP.format(c=sub)}">60 px</span></div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">{tile(v, 40)}<span style="{CAP.format(c=sub)}">40 px</span></div>
            </div>
          </div>"""

        def a_item(cap, inner):
            return f"""
          <div style="width: 112px; display: flex; flex-direction: column; gap: 8px;">
            <span style="{CAP.format(c=MUTED)}">{cap}</span>{inner}
          </div>"""

        safe = 112 * 66 / 108
        fg_inner = (
            '<div style="position: relative; width: 112px; height: 112px; border-radius: 12px; overflow: hidden; '
            f'background: repeating-conic-gradient({SAND} 0% 25%, {SURF} 0% 50%) 0 0 / 14px 14px;">'
            + svg(v, 112, "fg")
            + f'<div style="position: absolute; left: {(112 - safe) / 2:.1f}px; top: {(112 - safe) / 2:.1f}px; width: {safe:.1f}px; height: {safe:.1f}px; border-radius: 50%; border: 1.5px dashed {GREEN}; box-sizing: border-box;"></div>'
            + "</div>"
        )
        android = (
            a_item("Ön plan · 108 dp", fg_inner)
            + a_item("Arka plan", tile(v, 112, "12px", "bg", f"box-shadow: inset 0 0 0 1px {SAND};"))
            + a_item("Daire maske", tile(v, 112, "50%", "adaptive"))
            + a_item("Yuvarlak kare", tile(v, 112, "30%", "adaptive"))
            + a_item("Tematik · Android 13", tile(v, 112, "50%", "mono", "background: #d9e2d0;", mono="#2f3d2c"))
        )
        notif = f"""
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <span style="{CAP.format(c=MUTED)}">Bildirim · 24 ve 48 dp</span>
            <div style="height: 112px; box-sizing: border-box; padding: 0 20px; border-radius: 16px; background: {INK}; display: flex; align-items: center; gap: 20px;">
              <div style="width: 24px; height: 24px;">{svg(v, 24, "notif", mono="#ffffff")}</div>
              <div style="width: 48px; height: 48px;">{svg(v, 48, "notif", mono="#ffffff")}</div>
            </div>
          </div>"""
        blocks += f"""
      <section aria-label="{code}" style="display: flex; flex-direction: column; gap: 20px; padding: 28px; border-radius: 28px; background: {SURF}; box-shadow: 0 1px 2px rgba(31, 31, 28, 0.06), 0 6px 18px rgba(31, 31, 28, 0.06);">
        <h2 style="margin: 0; font-size: 21px; line-height: 27px; font-weight: 800;">{code} <span style="font-weight: 500; color: {MUTED};">{name}</span></h2>
        <div style="display: flex; gap: 16px; align-items: flex-start;">
          <div style="display: flex; flex-direction: column; gap: 12px; padding-top: 16px;">
            <span style="font-size: 13px; line-height: 18px; font-weight: 700;">1024 ana görsel</span>
            {tile(v, 164, label=f"{code} ikonu")}
            <span style="{CAP.format(c=MUTED)}">iOS maskesiyle, %16 ölçek</span>
          </div>{ios_panel("iOS · açık ana ekran", "#dcd6c8", INK, MUTED)}{ios_panel("iOS · koyu ana ekran", "#151514", "#f4f1ea", "#b3ad9f")}
        </div>
        <div style="display: flex; gap: 16px; align-items: flex-start;">{android}{notif}
        </div>
      </section>"""
    body = f"""<div style="width: {w}px; height: {h}px; box-sizing: border-box; padding: 40px; background: {BG}; color: {INK}; font-family: 'Nunito', system-ui, sans-serif; display: flex; flex-direction: column; gap: 24px;">
  <header style="display: flex; flex-direction: column; gap: 6px;">
    <p style="margin: 0; font-size: 15px; line-height: 20px; font-weight: 800; color: {GREEN};">Yön {d['key']}</p>
    <h1 style="margin: 0; font-size: 30px; line-height: 36px; font-weight: 800;">{d['name']}</h1>
    <p style="margin: 0; font-size: 15px; line-height: 21px; color: {MUTED};">{d['line']} iOS tek parça ikon; Android adaptive (ön plan + arka plan), tematik tek renk katman ve bildirim ikonu. Kesikli daire Android'in güvenli alanı (66 dp).</p>
  </header>{blocks}
</div>
"""
    return HEAD.format(title=f"Marka — {d['name']}") + body + TAIL.format(w=w, h=h), (w, h)


def sheet(path):
    vs = [v for d in DIRECTIONS for v in d["variants"]]
    cols = 6
    cell = 300
    rows = math.ceil(len(vs) / cols)
    out = f'<svg xmlns="http://www.w3.org/2000/svg" width="{cols * cell}" height="{rows * cell * 2}" viewBox="0 0 {cols * cell} {rows * cell * 2}"><rect width="100%" height="100%" fill="#dcd6c8" />'
    for i, v in enumerate(vs):
        x, y = (i % cols) * cell + 22, (i // cols) * cell * 2 + 22
        out += f'<svg x="{x}" y="{y}" width="256" height="256" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="229" fill="{v[2]}" />{v[3](None)}</svg>'
        out += f'<svg x="{x}" y="{y + 280}" width="120" height="120" viewBox="{CROP} {CROP} {1024 - 2 * CROP} {1024 - 2 * CROP}"><circle cx="512" cy="512" r="341" fill="#d9e2d0" /><g transform="translate(512 512) scale({FG_SCALE}) translate(-512 -512)">{v[3]("#2f3d2c")}</g></svg>'
        out += f'<rect x="{x + 136}" y="{y + 280}" width="120" height="120" rx="16" fill="{INK}" /><svg x="{x + 160}" y="{y + 304}" width="72" height="72" viewBox="150 150 724 724">{v[3]("#ffffff")}</svg>'
    out += "</svg>"
    with open(path, "w") as f:
        f.write(out)


if __name__ == "__main__":
    if sys.argv[1] == "--sheet":
        sheet(sys.argv[2])
        sys.exit(0)
    root = sys.argv[1]
    os.makedirs(os.path.join(root, "project"), exist_ok=True)
    with open(os.path.join(root, "project", "M-Ikonlar.dc.html"), "w") as f:
        f.write(overview())
    for d in DIRECTIONS:
        html, (w, h) = detail(d)
        with open(os.path.join(root, "project", d["file"] + ".dc.html"), "w") as f:
            f.write(html)
        print(d["file"], w, h)
