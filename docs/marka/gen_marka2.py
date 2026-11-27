"""F6 ikonuyla açılış ekranı, tanıtım sayfaları (TR/EN) ve mağaza çerçeveleri artboard'ları.

Kullanım: python3 gen_marka2.py <root>
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_marka as gm  # noqa: E402

F6 = next(v for d in gm.DIRECTIONS for v in d["variants"] if v[0] == "F6")
INK, BG, SURF, SAND, GREEN, MUTED, LEAF = gm.INK, gm.BG, gm.SURF, gm.SAND, gm.GREEN, gm.MUTED, gm.LEAF
SHADOW = "box-shadow: 0 1px 2px rgba(31, 31, 28, 0.06), 0 6px 18px rgba(31, 31, 28, 0.06);"
FONT = "font-family: 'Nunito', system-ui, sans-serif;"

HEAD = gm.HEAD
TAIL = gm.TAIL


def page(title, w, h, body, lang="tr"):
    return HEAD.format(title=title).replace('<html lang="tr">', f'<html lang="{lang}">') + body + TAIL.format(w=w, h=h)


def icon(size, label=None):
    return gm.tile(F6, size, label=label)


# ---------------------------------------------------------------- açılış ekranı
def splash(kind):
    w, h = 390, 844
    if kind == "ikon":
        inner = icon(120, "Bite Routine")
        bg = BG
    elif kind == "ikon-ad":
        inner = (
            '<div style="display: flex; flex-direction: column; align-items: center; gap: 18px;">'
            + icon(120)
            + f'<p style="margin: 0; font-size: 28px; line-height: 34px; font-weight: 800; color: {INK};">Bite Routine</p></div>'
        )
        bg = "#ffffff"
    elif kind == "android":
        inner = gm.tile(F6, 160, "50%", "adaptive", label="Bite Routine")
        bg = LEAF
    else:  # yeşil zemin, çerçevesiz glyph
        inner = (
            '<div style="width: 220px; height: 220px;">'
            '<svg role="img" aria-label="Bite Routine" width="220" height="220" viewBox="100 100 824 824" style="display: block;">'
            + F6[3](None)
            + "</svg></div>"
        )
        bg = LEAF
    body = f"""<div style="width: {w}px; height: {h}px; box-sizing: border-box; background: {bg}; {FONT} display: flex; align-items: center; justify-content: center;">
  {inner}
</div>
"""
    return page("Açılış ekranı", w, h, body)


# ---------------------------------------------------------------- tanıtım sayfaları
COPY = {
    "tr": {
        "skip": "Geç",
        "next": "Devam",
        "start": "Başla",
        "pages": [
            ("Ne yediğini kolayca kaydet",
             "Öğünlerini ve içtiğin suyu yaz; günlük kalori ve makro hedefine ne kadar kaldığını gör."),
            ("Verilerin yalnız telefonunda",
             "Hesap açman gerekmez, reklam yok. Kayıtların telefonunda kalır; yedeğin kendi iCloud ya da Google hesabında saklanır."),
            ("Türk mutfağı katalogda",
             "Türk yemekleri, temel gıdalar ve paketli ürünler hazır. Bulamadığını paket etiketinden kendin ekle."),
            ("Değerler yaklaşıktır",
             "Besin değerleri USDA tablolarından hesaplanır ve yaklaşıktır. Bite Routine tıbbi tavsiye vermez; sağlığınla ilgili kararlar için bir uzmana danış."),
        ],
        "chips": ["Hesap yok", "Reklam yok", "Otomatik yedek"],
        "left": "kcal kaldı",
        "meals": [("Kahvaltı", "Mercimek çorbası", "137 kcal"), ("Öğle yemeği", "Eti Form Bisküvi Kepekli", "164 kcal")],
        "water": "Su",
        "catalog": "Katalog",
        "cats": ["Çorbalar", "Ana yemekler", "Paketli ürünler"],
        "rows": [("Mercimek çorbası", "1,5 kepçe · 225 g", "137 kcal"), ("Eti Form Bisküvi Kepekli", "40 g", "164 kcal")],
        "add_own": "Kendi ürününü ekle",
        "off": "Paketli ürün verisi: Open Food Facts (ODbL)",
        "approx_name": "Mercimek çorbası · 225 g",
        "approx_src": "USDA FoodData Central tablolarından hesaplandı",
        "approx_note": "Tıbbi tavsiye değildir",
        "phone_cap": "Bu telefonda",
        "dots": "Sayfa {i} / 4",
    },
    "en": {
        "skip": "Skip",
        "next": "Continue",
        "start": "Get started",
        "pages": [
            ("Log what you eat, simply",
             "Add your meals and water, and see how much is left of your daily calorie and macro goals."),
            ("Your data stays on your phone",
             "No sign-up and no ads. Your entries stay on your phone, and the backup is kept in your own iCloud or Google account."),
            ("Turkish food, ready to log",
             "Turkish dishes, basic foods and packaged products are ready. Can't find something? Add it from the package label."),
            ("Values are estimates",
             "Nutrition values are calculated from USDA tables and are approximate. Bite Routine does not give medical advice; ask a professional about health decisions."),
        ],
        "chips": ["No account", "No ads", "Automatic backup"],
        "left": "kcal left",
        "meals": [("Breakfast", "Lentil soup", "137 kcal"), ("Lunch", "Eti Form Bisküvi Kepekli", "164 kcal")],
        "water": "Water",
        "catalog": "Catalog",
        "cats": ["Soups", "Main dishes", "Packaged foods"],
        "rows": [("Lentil soup", "1.5 ladles · 225 g", "137 kcal"), ("Eti Form Bisküvi Kepekli", "40 g", "164 kcal")],
        "add_own": "Add your own food",
        "off": "Packaged food data: Open Food Facts (ODbL)",
        "approx_name": "Lentil soup · 225 g",
        "approx_src": "Calculated from USDA FoodData Central tables",
        "approx_note": "Not medical advice",
        "phone_cap": "On this phone",
        "dots": "Page {i} of 4",
    },
}

PLUS = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>'
CARD = f"background: {SURF}; border-radius: 24px; {SHADOW}"


def ill_today(c):
    meals = ""
    for i, (meal, food, kcal) in enumerate(c["meals"]):
        sep = f'<div style="height: 1px; background: {SAND}; margin: 0 16px;"></div>' if i else ""
        meals += f"""{sep}
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px;">
          <span style="display: flex; flex-direction: column;"><span style="font-size: 13px; line-height: 18px; color: {MUTED};">{meal}</span><span style="font-size: 15px; line-height: 20px; font-weight: 700;">{food}</span></span>
          <span style="font-size: 14px; line-height: 19px; font-variant-numeric: tabular-nums;">{kcal}</span>
        </div>"""
    return f"""
    <div style="display: flex; flex-direction: column; align-items: center; gap: 18px; width: 100%;">
      {icon(72, "Bite Routine")}
      <div style="{CARD} width: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; gap: 18px; padding: 16px 16px 8px;">
          <div style="position: relative; width: 104px; height: 104px; flex: none;">
            <svg aria-hidden="true" width="104" height="104" viewBox="0 0 140 140"><circle cx="70" cy="70" r="60" fill="none" stroke="{SAND}" stroke-width="13" /><circle cx="70" cy="70" r="60" fill="none" stroke="#9db39a" stroke-width="13" stroke-linecap="round" stroke-dasharray="41.8 377" transform="rotate(-90 70 70)" /></svg>
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 22px; line-height: 26px; font-weight: 800; font-variant-numeric: tabular-nums;">2.415</span>
              <span style="font-size: 11px; line-height: 14px; color: {MUTED};">{c["left"]}</span>
            </div>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <p style="margin: 0; font-size: 14px; line-height: 19px;"><span style="font-weight: 700;">{c["water"]}</span> <span style="color: {MUTED}; font-variant-numeric: tabular-nums;">700 / 2.000 ml</span></p>
            <div style="height: 6px; border-radius: 3px; background: {SAND};"><div style="width: 35%; height: 6px; border-radius: 3px; background: #5a7f99;"></div></div>
          </div>
        </div>
        <div style="height: 1px; background: {SAND}; margin: 0 16px;"></div>{meals}
      </div>
    </div>"""


def ill_privacy(c):
    lock = f'<svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="{INK}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /><path d="M12 14.5v2" /></svg>'
    no = f'<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{GREEN}" stroke-width="2.25" stroke-linecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M6 18L18 6" /></svg>'
    cloud = f'<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{GREEN}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.5 4.25 4.25 0 0 0 7 18z" /><path d="M9.5 13.5l2 2 3.5-3.5" /></svg>'
    chips = "".join(
        f'<span style="display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 18px; background: {SURF}; {SHADOW} font-size: 14px; font-weight: 700; white-space: nowrap;">{cloud if j == 2 else no}{t}</span>'
        for j, t in enumerate(c["chips"])
    )
    return f"""
    <div style="display: flex; flex-direction: column; align-items: center; gap: 28px; width: 100%;">
      <div style="position: relative; width: 150px; height: 250px; box-sizing: border-box; border: 7px solid {INK}; border-radius: 34px; background: {SURF}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;">
        <div style="position: absolute; top: 9px; width: 44px; height: 8px; border-radius: 4px; background: {INK};"></div>
        <div style="width: 84px; height: 84px; border-radius: 42px; background: #dfe6d8; display: flex; align-items: center; justify-content: center;">{lock}</div>
        <span style="font-size: 13px; line-height: 18px; font-weight: 700; color: {GREEN};">{c["phone_cap"]}</span>
      </div>
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">{chips}</div>
    </div>"""


def ill_catalog(c):
    cats = "".join(
        f'<span style="height: 34px; padding: 0 14px; border-radius: 17px; display: inline-flex; align-items: center; font-size: 13px; font-weight: 700; white-space: nowrap; {"background: " + INK + "; color: #ffffff;" if i == 0 else "background: " + SAND + "; color: " + INK + ";"}">{t}</span>'
        for i, t in enumerate(c["cats"])
    )
    rows = ""
    for i, (n, p, k) in enumerate(c["rows"]):
        sep = f'<div style="height: 1px; background: {SAND}; margin: 0 16px;"></div>' if i else ""
        rows += f"""{sep}
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px;">
          <span style="display: flex; flex-direction: column;"><span style="font-size: 15px; line-height: 20px; font-weight: 700;">{n}</span><span style="font-size: 13px; line-height: 18px; color: {MUTED};">{p}</span></span>
          <span style="font-size: 14px; line-height: 19px; font-variant-numeric: tabular-nums;">{k}</span>
        </div>"""
    return f"""
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
      <p style="margin: 0; font-size: 20px; line-height: 26px; font-weight: 800;">{c["catalog"]}</p>
      <div style="display: flex; gap: 8px; overflow: hidden;">{cats}</div>
      <div style="{CARD} display: flex; flex-direction: column;">{rows}
      </div>
      <div style="{CARD} display: flex; align-items: center; gap: 12px; padding: 12px 16px;">
        <span style="width: 32px; height: 32px; border-radius: 16px; background: {INK}; color: #ffffff; display: flex; align-items: center; justify-content: center; flex: none;">{PLUS}</span>
        <span style="font-size: 15px; line-height: 20px; font-weight: 700;">{c["add_own"]}</span>
      </div>
    </div>"""


def ill_approx(c):
    info = f'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="{MUTED}" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>'
    return f"""
    <div style="{CARD} width: 100%; box-sizing: border-box; padding: 22px 20px; display: flex; flex-direction: column; gap: 14px;">
      <span style="font-size: 14px; line-height: 19px; color: {MUTED};">{c["approx_name"]}</span>
      <p style="margin: 0; display: flex; align-items: baseline; gap: 8px; color: {GREEN};">
        <span style="font-size: 30px; line-height: 40px; font-weight: 800;">≈</span>
        <span style="font-size: 56px; line-height: 60px; font-weight: 800; font-variant-numeric: tabular-nums;">137</span>
        <span style="font-size: 18px; font-weight: 700;">kcal</span>
      </p>
      <div style="height: 1px; background: {SAND};"></div>
      <p style="margin: 0; display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 18px; color: {MUTED};">{info}{c["approx_src"]}</p>
      <p style="margin: 0; align-self: flex-start; height: 30px; padding: 0 12px; border-radius: 15px; background: {SAND}; display: inline-flex; align-items: center; font-size: 13px; font-weight: 700;">{c["approx_note"]}</p>
    </div>"""


ILLS = [ill_today, ill_privacy, ill_catalog, ill_approx]


def intro(lang, i):
    c = COPY[lang]
    w, h = 390, 844
    title, text = c["pages"][i]
    last = i == 3
    skip = (
        f'<button type="button" style="height: 44px; padding: 0 12px; border: 0; background: none; font: inherit; font-size: 16px; font-weight: 700; color: {MUTED}; cursor: pointer;">{c["skip"]}</button>'
        if not last
        else '<span style="height: 44px;"></span>'
    )
    dots = "".join(
        f'<span style="height: 8px; border-radius: 4px; {"width: 24px; background: " + INK if j == i else "width: 8px; background: #c4bdad"};"></span>'
        for j in range(4)
    )
    extra = (
        f'<p style="margin: 0; font-size: 12px; line-height: 16px; color: {MUTED};">{c["off"]}</p>' if i == 2 else ""
    )
    body = f"""<div style="width: {w}px; height: {h}px; box-sizing: border-box; position: relative; overflow: hidden; background: {BG}; color: {INK}; {FONT} padding: 47px 20px 34px; display: flex; flex-direction: column;">
  <header style="display: flex; justify-content: flex-end; margin-right: -8px;">{skip}</header>
  <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 8px 4px 0;">{ILLS[i](c)}
  </div>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 22px; padding-top: 24px;">
    <div role="img" aria-label="{c["dots"].format(i=i + 1)}" style="display: flex; gap: 6px;">{dots}</div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; min-height: 168px;">
      <h1 style="margin: 0; font-size: 28px; line-height: 34px; font-weight: 800; text-wrap: balance;">{title}</h1>
      <p style="margin: 0; max-width: 330px; font-size: 16px; line-height: 23px; color: {MUTED};">{text}</p>{extra}
    </div>
    <button type="button" style="width: 100%; height: 52px; border: 0; border-radius: 20px; background: {INK}; color: #ffffff; font: inherit; font-size: 17px; font-weight: 700; cursor: pointer;">{c["start"] if last else c["next"]}</button>
  </div>
</div>
"""
    return page(("Tanıtım " if lang == "tr" else "Intro ") + str(i + 1), w, h, body, lang)


# ---------------------------------------------------------------- mağaza çerçeveleri
STORE = [
    ("K-Bugun", "Günün tek bakışta", "Kalori, makro ve su bir arada"),
    ("K-Katalog", "Türk mutfağı hazır", "Türk yemekleri ve paketli ürünler; bulamadığını kendin ekle"),
    ("K-Detay", "Porsiyonu sen seç", "Kepçe, kase ya da gram; değer anında hesaplanır"),
]
PLAY = ("K-Bugun", "Verilerin telefonunda kalır", "Hesap yok, reklam yok, yedeğin kendi hesabında")


def screen(name, width, height_clip, radius):
    s = width / 390
    return f"""<div style="width: {width}px; height: {height_clip:.0f}px; border-radius: {radius}px; overflow: hidden; flex: none; box-shadow: 0 2px 6px rgba(31, 31, 28, 0.12), 0 24px 48px rgba(31, 31, 28, 0.18); background: {BG};">
      <div style="width: 390px; height: 844px; transform: scale({s:.4f}); transform-origin: 0 0;">
        <dc-import name="{name}" hint-size="390px,844px"></dc-import>
      </div>
    </div>"""


def store(direction, idx, play=False):
    if play:
        w, h = 432, 768
        name, title, sub = PLAY
    else:
        w, h = 440, 956
        name, title, sub = STORE[idx]
    brand = idx == 0 and not play
    if direction == 1:
        bg, fg, subc = BG, INK, MUTED
        sw = 320 if play else 330
        top_pad = 48 if play else 64
        clip = h - top_pad - (150 if play else 186) - 0
        tail = "padding-bottom: 32px; justify-content: space-between;"
        radius = 34
    else:
        bg, fg, subc = GREEN, "#fbf9f4", "#e2e8dc"
        sw = 350 if play else 370
        top_pad = 48 if play else 64
        clip = None
        tail = "justify-content: flex-start;"
        radius = 40
    brand_html = (
        f'<div style="display: flex; align-items: center; gap: 10px;">{icon(44)}<span style="font-size: 18px; line-height: 24px; font-weight: 800; color: {fg};">Bite Routine</span></div>'
        if brand
        else ""
    )
    head = f"""<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 0 28px;">
    {brand_html}
    <h1 style="margin: 0; font-size: {30 if play else 34}px; line-height: {36 if play else 40}px; font-weight: 800; color: {fg}; text-wrap: balance;">{title}</h1>
    <p style="margin: 0; font-size: 17px; line-height: 23px; color: {subc}; text-wrap: balance;">{sub}</p>
  </div>"""
    if direction == 1:
        avail = h - top_pad - 32 - (150 if brand else 112) - 28
        clip = min(844 * sw / 390, avail)
        shot = screen(name, sw, clip, radius)
    else:
        shot = f'<div style="flex: 1; display: flex; justify-content: center; align-items: flex-start; min-height: 0;">{screen(name, sw, 844 * sw / 390, radius)}</div>'
    body = f"""<div style="width: {w}px; height: {h}px; box-sizing: border-box; overflow: hidden; background: {bg}; {FONT} padding-top: {top_pad}px; display: flex; flex-direction: column; align-items: center; gap: 28px; {tail}">
  {head}
  {shot}
</div>
"""
    return page("Mağaza görseli", w, h, body), (w, h)


def main(root):
    out = os.path.join(root, "project")
    files = {}
    for k in ("yesil", "android", "ikon-ad"):
        files[f"M-Splash-{k}.dc.html"] = (splash(k), (390, 844))
    for lang in ("tr", "en"):
        for i in range(4):
            files[f"M-Tanitim-{lang}-{i + 1}.dc.html"] = (intro(lang, i), (390, 844))
    for d in (1, 2):
        for i in range(3):
            files[f"M-Magaza{d}-AppStore-{i + 1}.dc.html"] = store(d, i)
        files[f"M-Magaza{d}-Play.dc.html"] = store(d, 0, play=True)
    for name, (html, (w, h)) in files.items():
        with open(os.path.join(out, name), "w") as f:
            f.write(html)
        print(name, w, h)


if __name__ == "__main__":
    main(sys.argv[1])
