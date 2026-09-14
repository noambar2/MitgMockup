#!/usr/bin/env python3
"""מייצר את קבצי המשתנים ל-Figma מתוך ערכי המערכת בקוד."""
import json, os, re

OUT = "/Users/noambar/Desktop/dev/MitgMockup/design/figma-tokens"

# שם התיקייה = שם האוסף ב-Figma, שם הקובץ = שם ה-mode
MODE_NAMES = {
    "light": "בהיר",
    "dark": "כהה",
    "purple": "סגול",
    "teal": "טורקיז",
    "sunset": "שקיעה",
    "rose": "ורוד",
    "playful": "צבעוני",
}

SCOPES = {"$extensions": {"com.figma.scopes": ["ALL_SCOPES"]}}


def num(v):
    return {"$type": "number", "$value": v, **SCOPES}


def hex_to_rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def color(h, alpha=1.0):
    """h = '#rrggbb' או 'rgb(r,g,b)'"""
    if h.startswith("rgb"):
        r, g, b = [int(x) for x in re.findall(r"\d+", h)[:3]]
    else:
        r, g, b = hex_to_rgb(h)
    hex_out = "#%02X%02X%02X" % (r, g, b)
    if alpha < 1:
        hex_out += "%02X" % round(alpha * 255)
    return {
        "$type": "color",
        "$value": {
            "colorSpace": "srgb",
            "components": [r / 255, g / 255, b / 255],
            "alpha": alpha,
            "hex": hex_out,
        },
        **SCOPES,
    }


def mix_white(h, pct):
    """color-mix(in srgb, h pct%, white) - הגוון של כרטיס בערכה הצבעונית"""
    r, g, b = hex_to_rgb(h)
    f = pct / 100
    return "#%02X%02X%02X" % tuple(
        round(c * f + 255 * (1 - f)) for c in (r, g, b)
    )


def scale(h, ratio):
    """mix() מ-themes.ts - הכהיה/הבהרה של גוון לגרדיאנט הניווט"""
    r, g, b = hex_to_rgb(h)
    return "#%02X%02X%02X" % tuple(
        max(0, min(255, round(c * ratio))) for c in (r, g, b)
    )


def nav_stops(brand):
    return [scale(brand, 0.45), scale(brand, 0.8), brand, scale(brand, 1.35)]


# ── Primitives ──────────────────────────────────────────────────────────────

primitives = {
    "radius": {
        "control": num(8),
        "surface": num(10),
        "sheet-top": num(16),
        "pill": num(999),
        "playful-control": num(14),
        "playful-surface": num(20),
    },
    # גדלי הדסקטופ - הם הגדלים שנכתבים בקוד
    "type": {
        "micro": num(10),
        "tag": num(11),
        "meta": num(12),
        "caption": num(13),
        "body": num(14),
        "body-emphasis": num(15),
        "label": num(16),
        "card-title": num(18),
        "value": num(20),
        "section-title": num(22),
        "dialog-title": num(24),
        "gauge": num(26),
        "page-title-mobile": num(28),
        "page-title": num(34),
        "display-mobile": num(44),
        "display": num(52),
    },
    # הסולם שמופעל אוטומטית מתחת ל-768px
    "type-mobile": {
        "micro": num(9),
        "tag": num(10),
        "meta": num(11),
        "caption": num(12),
        "body": num(13),
        "body-emphasis": num(14),
        "label": num(15),
        "card-title": num(16),
        "value": num(18),
        "section-title": num(20),
        "dialog-title": num(21),
        "gauge": num(23),
        "page-title": num(30),
        "display": num(44),
    },
    # מכפילים - לתיעוד ולשימוש ב-CSS. בפיגמה אין להצמיד אותם לשדה
    # Line height, שמצפה לפיקסלים; לשם כך יש type-line למטה.
    "line-height": {
        "none": num(1),
        "tight": num(1.15),
        "snug": num(1.3),
        "normal": num(1.5),
        "relaxed": num(1.65),
    },
    "font-weight": {
        "regular": num(400),
        "semibold": num(600),
        "bold": num(700),
        "black": num(900),
    },
    # ריווח אותיות באחוזים (כמו בשדה Letter spacing בפיגמה).
    # שלילי רק מ-20px ומעלה.
    "letter-spacing": {
        "normal": num(0),
        "tight": num(-2.5),
    },
    # גובה שורה בפיקסלים לכל תפקיד - זה מה שמצמידים בפיגמה
    "type-line": {
        role: num(round(size * ratio))
        for role, size, ratio in [
            ("micro", 10, 1.3),
            ("tag", 11, 1.3),
            ("meta", 12, 1.3),
            ("caption", 13, 1.5),
            ("body", 14, 1.65),
            ("body-emphasis", 15, 1.65),
            ("label", 16, 1.3),
            ("card-title", 18, 1.3),
            ("value", 20, 1),
            ("section-title", 22, 1.15),
            ("dialog-title", 24, 1.15),
            ("gauge", 26, 1),
            ("page-title-mobile", 28, 1.15),
            ("page-title", 34, 1.15),
            ("display-mobile", 44, 1),
            ("display", 52, 1),
        ]
    },
    "type-mobile-line": {
        role: num(round(size * ratio))
        for role, size, ratio in [
            ("micro", 9, 1.3),
            ("tag", 10, 1.3),
            ("meta", 11, 1.3),
            ("caption", 12, 1.5),
            ("body", 13, 1.65),
            ("body-emphasis", 14, 1.65),
            ("label", 15, 1.3),
            ("card-title", 16, 1.3),
            ("value", 18, 1),
            ("section-title", 20, 1.15),
            ("dialog-title", 21, 1.15),
            ("gauge", 23, 1),
            ("page-title", 25, 1.15),
            ("display", 44, 1),
        ]
    },
    "space": {
        "1": num(4),
        "2": num(8),
        "3": num(12),
        "4": num(16),
        "5": num(20),
        "6": num(24),
        "8": num(32),
        "10": num(40),
        "card-padding": num(20),
        "page-x-mobile": num(16),
        "page-x-tablet": num(24),
        "page-x-desktop": num(40),
        "page-top": num(32),
        "page-bottom": num(48),
    },
    "size": {
        "icon-xs": num(11),
        "icon-sm": num(13),
        "icon-md": num(15),
        "icon-lg": num(18),
        "icon-xl": num(20),
        "icon-circle-sm": num(40),
        "icon-circle-md": num(56),
        "icon-circle-lg": num(64),
        "chip-height": num(30),
        "button-height": num(32),
        "input-height": num(48),
        "search-height": num(40),
        "dot": num(8),
        "status-dot": num(6),
    },
    "layout": {
        "content-max-width": num(760),
        "breakpoint-sm": num(640),
        "breakpoint-md": num(768),
        "breakpoint-xl": num(1280),
        "dialog-width-sm": num(480),
        "dialog-width-md": num(520),
        "dialog-width-lg": num(560),
        "sheet-min-height-vh": num(50),
        "sheet-max-height-vh": num(92),
        "dialog-max-height-vh": num(85),
        "list-max-height-mobile": num(200),
        "list-max-height-desktop": num(280),
        "carousel-card-desktop": num(380),
        "carousel-card-mobile-pct": num(86),
        "carousel-peek": num(40),
        "dropdown-max-height": num(224),
        "ad-banner-height": num(83),
    },
    "elevation": {
        "hover-glow-blur": num(20),
        "overlay-y": num(12),
        "overlay-blur": num(32),
        "glass-y": num(8),
        "glass-blur": num(32),
        "playful-card-y": num(10),
        "playful-card-blur": num(28),
    },
    "opacity": {
        "faint": num(0.4),
        "muted": num(0.5),
        "secondary": num(0.6),
        "strong": num(0.7),
        "disabled": num(0.35),
        "glass-fill": num(0.3),
        "glass-border": num(0.5),
    },
    "duration": {
        "fast": num(200),
        "base": num(300),
        "slow": num(500),
    },
    "z-index": {
        "header": num(50),
        "dialog": num(400),
        "dropdown": num(510),
    },
}

# ── Themes ──────────────────────────────────────────────────────────────────

PAGES = [
    "profile",
    "appointments",
    "tasks",
    "learnings",
    "inquiries",
    "messages",
    "settings",
]

# ברירת המחדל של הדיו (ערכות בהירות)
LIGHT_INK = {
    "primary": ("#171C23", 1),
    "secondary": ("#171C23", 0.62),
    "faint": ("#171C23", 0.42),
    "line": ("#171C23", 0.1),
    "line-strong": ("#171C23", 0.25),
}
DARK_INK = {
    "primary": ("#EAF0F5", 1),
    "secondary": ("#EAF0F5", 0.64),
    "faint": ("#EAF0F5", 0.42),
    "line": ("#FFFFFF", 0.13),
    "line-strong": ("#FFFFFF", 0.3),
}
LIGHT_SEMANTIC = {
    "success": ("#4E9400", 1),
    "warning": ("#E07000", 1),
    "error": ("#C43C3C", 1),
    "favorite": ("#F5A623", 1),
    "success-bg": ("#69C600", 0.12),
    "warning-bg": ("#F0A42C", 0.12),
    "error-bg": ("#C43C3C", 0.08),
}
DARK_SEMANTIC = {
    "success": ("#93DA3A", 1),
    "warning": ("#F5A253", 1),
    "error": ("#E57575", 1),
    "favorite": ("#F5A623", 1),
    "success-bg": ("#69C600", 0.16),
    "warning-bg": ("#F0A42C", 0.16),
    "error-bg": ("#C43C3C", 0.14),
}

THEMES = {
    "light": dict(
        name="בהיר", brand="#008FF0", hover="#0080D6", page="#F5F5F7",
        blob_a="#008FF0", blob_b="#69C600",
        nav=["rgb(36,83,119)", "rgb(19,131,208)", "rgb(0,143,240)", "rgb(93,184,245)"],
        card="#FFFFFF", muted="#F5F5F7", dark=False,
    ),
    "dark": dict(
        name="כהה", brand="#4DB4F5", hover="#6EC4F8", page="#0C1720",
        blob_a="#1E7FC4", blob_b="#2F9C6A",
        nav=["rgb(16,34,48)", "rgb(20,66,102)", "rgb(24,104,158)", "rgb(45,138,196)"],
        card="#16242F", muted="#1E2E3A", dark=True,
    ),
    "purple": dict(
        name="סגול", brand="#7A5CF0", hover="#6A4CE0", page="#F6F4FB",
        blob_a="#7A5CF0", blob_b="#D46BD8",
        nav=["rgb(52,40,102)", "rgb(88,62,178)", "rgb(122,92,240)", "rgb(168,140,250)"],
        card="#FFFFFF", muted="#F5F5F7", dark=False,
    ),
    "teal": dict(
        name="טורקיז", brand="#0AA2A2", hover="#08908F", page="#F2F8F8",
        blob_a="#0AA2A2", blob_b="#69C600",
        nav=["rgb(22,72,74)", "rgb(12,124,124)", "rgb(10,162,162)", "rgb(80,206,198)"],
        card="#FFFFFF", muted="#F5F5F7", dark=False,
    ),
    "sunset": dict(
        name="שקיעה", brand="#E2622C", hover="#CC5623", page="#FCF6F2",
        blob_a="#E2622C", blob_b="#F0A92C",
        nav=["rgb(94,45,28)", "rgb(178,74,36)", "rgb(226,98,44)", "rgb(244,158,86)"],
        card="#FFFFFF", muted="#F5F5F7", dark=False,
    ),
    "rose": dict(
        name="ורוד", brand="#D63B73", hover="#C02F64", page="#FCF3F7",
        blob_a="#D63B73", blob_b="#8D5CF0",
        nav=["rgb(92,32,58)", "rgb(166,44,88)", "rgb(214,59,115)", "rgb(240,124,166)"],
        card="#FFFFFF", muted="#F5F5F7", dark=False,
    ),
    "playful": dict(
        name="צבעוני", brand="#7C5CF5", hover="#6A49E8", page="#F6F2FF",
        blob_a="#7C5CF5", blob_b="#FFB02E",
        nav=nav_stops("#7C5CF5"),
        card="#FFFFFF", muted="#F5F5F7", dark=False,
    ),
}

# הגוונים לכל עמוד - קיימים רק בערכה הצבעונית
PLAYFUL_ACCENTS = {
    "profile": ("#7C5CF5", "#6A49E8", "#FF8FC7", "#F3EDFF"),
    "appointments": ("#FF7A1A", "#EC6A0C", "#FFCF3F", "#FFF3E6"),
    "tasks": ("#00B3C7", "#009CAD", "#69C600", "#E8FAFD"),
    "learnings": ("#2EB872", "#25A463", "#FFCF3F", "#EAFAF1"),
    "inquiries": ("#E6398B", "#D02C7C", "#8B5CF6", "#FDEDF5"),
    "messages": ("#2F80ED", "#2570D4", "#00D0C0", "#EAF2FF"),
    "settings": ("#8B5CF6", "#7A4BEA", "#FF8FC7", "#F5F0FF"),
}


def theme_file(key, t):
    ink = DARK_INK if t["dark"] else LIGHT_INK
    sem = DARK_SEMANTIC if t["dark"] else LIGHT_SEMANTIC
    playful = key == "playful"

    data = {
        "brand": {
            "default": color(t["brand"]),
            "hover": color(t["hover"]),
            "tint-18": color(t["brand"], 0.18),
            "tint-12": color(t["brand"], 0.12),
            "tint-10": color(t["brand"], 0.1),
            "tint-08": color(t["brand"], 0.08),
            "tint-06": color(t["brand"], 0.06),
        },
        "accent-2": color(t["blob_b"]),
        "background": {
            "page": color(t["page"]),
            "blob-a": color(t["blob_a"]),
            "blob-b": color(t["blob_b"]),
        },
        "nav-gradient": {
            f"stop-{i+1}": color(c) for i, c in enumerate(t["nav"])
        },
        "surface": {
            "card": color(t["card"]),
            "muted": color(t["muted"]),
            "glass-fill": color("#FFFFFF", 0.06 if t["dark"] else 0.3),
            "glass-border": color("#FFFFFF", 0.12 if t["dark"] else 0.5),
            "chip": color(
                "#FFFFFF" if t["dark"] else "#171C23",
                0.05,
            ),
            "chip-border": color(
                "#FFFFFF" if t["dark"] else "#171C23",
                0.12,
            ),
            "overlay-scrim": color("#000000", 0.2),
        },
        "ink": {k: color(v[0], v[1]) for k, v in ink.items()},
        "semantic": {k: color(v[0], v[1]) for k, v in sem.items()},
        "elevation": {
            "hover-glow": color(t["brand"], 0.25),
            "overlay-shadow": color("#000000", 0.16),
            "glass-shadow": color("#122736", 0.12),
        },
        "header": {
            "bar": color("#122736"),
        },
    }

    # גוון לכל עמוד - בערכה הצבעונית שונה בכל עמוד, בשאר זהה לערכה
    accents = {}
    for page in PAGES:
        if playful:
            brand, hover, second, page_bg = PLAYFUL_ACCENTS[page]
            surface = mix_white(brand, 6)
        else:
            brand, hover, second, page_bg = (
                t["brand"], t["hover"], t["blob_b"], t["page"],
            )
            surface = t["card"]
        accents[page] = {
            "default": color(brand),
            "hover": color(hover),
            "accent-2": color(second),
            "page-bg": color(page_bg),
            "surface": color(surface),
            "nav-gradient": {
                f"stop-{i+1}": color(c)
                for i, c in enumerate(
                    nav_stops(brand) if playful else t["nav"]
                )
            },
        }
    data["accent"] = accents
    return data


os.makedirs(f"{OUT}/Theme", exist_ok=True)

# אוסף ה-Primitives - mode יחיד בשם Value
json.dump(
    primitives,
    open(f"{OUT}/Value.tokens.json", "w"),
    ensure_ascii=False,
    indent=2,
)

# אוסף Theme - קובץ לכל mode
for key, t in THEMES.items():
    json.dump(
        theme_file(key, t),
        open(f"{OUT}/Theme/{MODE_NAMES[key]}.tokens.json", "w"),
        ensure_ascii=False,
        indent=2,
    )

print("written:", sorted(os.listdir(OUT)), sorted(os.listdir(f"{OUT}/Theme")))
