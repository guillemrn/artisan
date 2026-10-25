from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps
from reportlab.lib.colors import Color, HexColor, black, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "assets" / "final-art"
OUTPUT = ROOT / "output" / "pdf" / "aventuras-con-papa-imprimible.pdf"
COVER = ROOT / "concepts" / "portada-v1.png"

PAGE_W, PAGE_H = letter
CREAM = HexColor("#F5ECD9")
GREEN = HexColor("#163C2B")
BLUE = HexColor("#2A5B83")
GOLD = HexColor("#D99A1B")
LIGHT_LINE = Color(0, 0, 0, alpha=0.18)


PAGES = [
    {
        "title": "ESTA AVENTURA ES DE...",
        "talk": "¿Qué aventura te gusta vivir con papá?",
        "verb": "MARCA",
        "action": "Escribe o dibuja tu nombre y tu mano.",
    },
    {
        "title": "SOMOS UN GRAN EQUIPO",
        "talk": "¿Qué nos gusta hacer juntos?",
        "verb": "ELIGE",
        "action": "Colorea dos objetos para nuestras aventuras.",
    },
    {
        "title": "¿HACEMOS TUS HUEVOS?",
        "talk": "¿Qué necesitamos primero?",
        "verb": "ENCUENTRA",
        "action": "Mantequilla, sartén, plato y huevo.",
    },
    {
        "title": "BATIMOS JUNTOS",
        "talk": "¿Qué sonido hace al batir?",
        "verb": "TRAZA",
        "action": "Haz círculos con el huevo.",
    },
    {
        "title": "LO COCINAMOS CON CUIDADO",
        "talk": "¿En qué cosas necesitamos ayuda?",
        "verb": "SIGUE",
        "action": "Lleva el huevo hasta el plato.",
    },
    {
        "title": "PREPARAMOS LA MEZCLA",
        "talk": "¿Qué ingrediente agregarías primero?",
        "verb": "UNE",
        "action": "Lleva los ingredientes al recipiente.",
    },
    {
        "title": "DECORAMOS NUESTROS HOTCAKES",
        "talk": "¿Cómo decorarías el tuyo?",
        "verb": "AGREGA",
        "action": "Dibuja tu ingrediente favorito.",
    },
    {
        "title": "CONSTRUIMOS ALGO INCREÍBLE",
        "talk": "¿Qué construirías tú?",
        "verb": "AGREGA",
        "action": "Dibuja un bloque más.",
    },
    {
        "title": "¿QUÉ PIEZA SIGUE?",
        "talk": "¿Hay una sola forma de continuar?",
        "verb": "COMPLETA",
        "action": "Dibuja la pieza que sigue.",
    },
    {
        "title": "¡EL CESTO SE VOLVIÓ COCHE!",
        "talk": "¿A dónde vamos hoy?",
        "verb": "TRAZA",
        "action": "Dibuja el camino de nuestro coche.",
    },
    {
        "title": "JUGAMOS A LAS ESCONDIDAS",
        "talk": "¿Dónde te esconderías tú?",
        "verb": "ENCUENTRA",
        "action": "Busca a Julieta y dibuja otro escondite.",
    },
    {
        "title": "DIBUJAMOS JUNTOS",
        "talk": "¿Qué estamos creando juntos?",
        "verb": "AGREGA",
        "action": "Elige tu color y termina el dibujo.",
    },
    {
        "title": "¡A BAILAR!",
        "talk": "¿Cómo baila tu cuerpo?",
        "verb": "HAGAMOS",
        "action": "Tómense de las manos y bailen.",
    },
    {
        "title": "ESTA PLANTA ES TUYA",
        "talk": "¿Cómo se llama tu planta?",
        "verb": "DECORA",
        "action": "Dibuja algo en su maceta.",
    },
    {
        "title": "LA CUIDAMOS JUNTOS",
        "talk": "¿Qué necesita para crecer?",
        "verb": "SIGUE",
        "action": "Lleva el agua hasta la tierra.",
    },
    {
        "title": "GUARDAMOS JUNTOS... Y APARECEN MÁS JUGUETES",
        "talk": "¿Qué guardarías primero?",
        "verb": "UNE",
        "action": "Lleva cada cosa a su lugar.",
    },
    {
        "title": "VAMOS AL MERCADO",
        "talk": "¿Qué llevarías a casa?",
        "verb": "ENCUENTRA",
        "action": "Harina, fresas, blueberries y plátanos.",
    },
    {
        "title": "¿YA NOS VAMOS?",
        "talk": "¿Qué llevarías contigo?",
        "verb": "ELIGE",
        "action": "Un peluche o juguete para salir.",
    },
    {
        "title": "¡HOLA, PATOS!",
        "talk": "¿Cómo saludarías a los patos?",
        "verb": "ENCUENTRA",
        "action": "¿Cuántos patos hay?",
    },
    {
        "title": "NOS DETENEMOS A MIRAR",
        "talk": "¿Qué animal pequeño encontraste?",
        "verb": "ENCUENTRA",
        "action": "Escarabajo, lagartija y pájaros.",
    },
    {
        "title": "¡OTRA VEZ EN EL CHARCO!",
        "talk": "¿Cuántas veces lo pisarías?",
        "verb": "AGREGA",
        "action": "Más huellas, ondas y gotas.",
    },
    {
        "title": "TÚ ELIGES EL CUENTO",
        "talk": "¿Cuál quieres leer hoy?",
        "verb": "ELIGE",
        "action": "Rodea el libro que escogerías.",
    },
    {
        "title": "LEEMOS CON TODO",
        "talk": "¿Qué sonido hace?",
        "verb": "HAGAMOS",
        "action": "Señala, imita y léanlo otra vez.",
    },
    {
        "title": "NUESTRA PRÓXIMA AVENTURA",
        "talk": "¿Qué hacemos juntos la próxima vez?",
        "verb": "DIBUJA",
        "action": "Nuestra siguiente aventura.",
    },
]


def register_fonts():
    rounded = Path("/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf")
    if rounded.exists():
        pdfmetrics.registerFont(TTFont("Rounded", str(rounded)))
        return "Rounded"
    return "Helvetica-Bold"


TITLE_FONT = register_fonts()


def wrap_lines(text, font_name, font_size, max_width):
    words = text.split()
    lines = []
    current = []
    for word in words:
        trial = " ".join(current + [word])
        if current and pdfmetrics.stringWidth(trial, font_name, font_size) > max_width:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    return lines


def draw_centered_title(c, title):
    max_width = PAGE_W - 72
    size = 27
    lines = wrap_lines(title, TITLE_FONT, size, max_width)
    while len(lines) > 2 and size > 21:
        size -= 1
        lines = wrap_lines(title, TITLE_FONT, size, max_width)
    y = PAGE_H - 42
    c.setFillColor(black)
    c.setFont(TITLE_FONT, size)
    for line in lines:
        c.drawCentredString(PAGE_W / 2, y, line)
        y -= size + 2
    return y


def ink_crop_reader(path):
    image = Image.open(path).convert("RGB")
    gray = ImageOps.grayscale(image)
    mask = gray.point(lambda value: 255 if value < 225 else 0)
    bbox = mask.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        pad = 24
        bbox = (
            max(0, left - pad),
            max(0, top - pad),
            min(image.width, right + pad),
            min(image.height, bottom + pad),
        )
        image = image.crop(bbox)
    stream = BytesIO()
    image.save(stream, format="PNG", optimize=True)
    stream.seek(0)
    return ImageReader(stream), image.width, image.height, stream


def cover_reader(path):
    image = Image.open(path).convert("RGB")
    stream = BytesIO()
    image.save(stream, format="JPEG", quality=95)
    stream.seek(0)
    return ImageReader(stream), image.width, image.height, stream


def draw_paragraph(c, text, x, y, width, font="Helvetica", size=12, leading=16):
    lines = wrap_lines(text, font, size, width)
    c.setFont(font, size)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_prompt(c, x, y, width, symbol, label, body):
    c.setLineWidth(2)
    c.setStrokeColor(black)
    c.circle(x + 18, y + 27, 16, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(x + 18, y + 22, symbol)
    text_x = x + 43
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(text_x, y + 37, label)
    c.setFont("Helvetica", 10.5)
    lines = wrap_lines(body, "Helvetica", 10.5, width - 43)
    line_y = y + 21
    for line in lines[:3]:
        c.drawString(text_x, line_y, line)
        line_y -= 13


def draw_activity_page(c, index, data):
    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    title_bottom = draw_centered_title(c, data["title"])

    art_reader, art_w, art_h, stream = ink_crop_reader(ART_DIR / f"page-{index:02d}.png")
    art_left = 42
    art_right = PAGE_W - 42
    art_bottom = 150
    art_top = title_bottom - 6
    box_w = art_right - art_left
    box_h = art_top - art_bottom
    scale = min(box_w / art_w, box_h / art_h)
    draw_w = art_w * scale
    draw_h = art_h * scale
    c.drawImage(
        art_reader,
        art_left + (box_w - draw_w) / 2,
        art_bottom + (box_h - draw_h) / 2,
        width=draw_w,
        height=draw_h,
        preserveAspectRatio=True,
        mask="auto",
    )
    stream.close()

    c.setStrokeColor(LIGHT_LINE)
    c.setLineWidth(1)
    c.line(PAGE_W / 2, 38, PAGE_W / 2, 127)
    draw_prompt(c, 35, 49, 250, "?", "HABLEMOS", data["talk"])
    draw_prompt(c, 324, 49, 250, "+", data["verb"], data["action"])
    c.setFillColor(Color(0, 0, 0, alpha=0.42))
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_W / 2, 19, f"{index} / 24")
    c.showPage()


def draw_front_cover(c):
    reader, image_width, image_height, stream = cover_reader(COVER)
    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    scale = min(PAGE_W / image_width, PAGE_H / image_height)
    draw_width = image_width * scale
    draw_height = image_height * scale
    c.drawImage(
        reader,
        (PAGE_W - draw_width) / 2,
        (PAGE_H - draw_height) / 2,
        draw_width,
        draw_height,
        preserveAspectRatio=True,
        mask="auto",
    )
    c.showPage()
    stream.close()


def draw_inside_cover(c):
    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.setFont(TITLE_FONT, 28)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 120, "PARA LOS ADULTOS")
    c.setFillColor(black)
    text = (
        "Este libro no busca colorearse perfecto. Está hecho para conversar, "
        "intentar, ensuciar un poquito y convertir momentos cotidianos en recuerdos compartidos."
    )
    y = draw_paragraph(c, text, 92, PAGE_H - 190, PAGE_W - 184, "Helvetica", 14, 21)
    c.setFillColor(GREEN)
    c.setFont(TITLE_FONT, 18)
    for phrase in ("ACOMPAÑA.", "PREGUNTA.", "DEJA QUE ELIJA.", "HÁGANLO JUNTOS."):
        c.drawCentredString(PAGE_W / 2, y - 24, phrase)
        y -= 42
    c.setFillColor(black)
    c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_W / 2, 78, "Inspirado en momentos reales entre un papá y su hija.")
    c.drawCentredString(PAGE_W / 2, 60, "Edición de prueba · 2026")
    c.showPage()


def draw_blank_back(c):
    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.showPage()


def draw_inside_back(c):
    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.setFont(TITLE_FONT, 34)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 + 60, "FIN... POR AHORA")
    c.setFillColor(GREEN)
    c.setFont(TITLE_FONT, 20)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 + 12, "La siguiente aventura sucede fuera del libro.")
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.circle(PAGE_W / 2 - 42, PAGE_H / 2 - 64, 12, stroke=1, fill=0)
    c.circle(PAGE_W / 2, PAGE_H / 2 - 64, 12, stroke=1, fill=0)
    c.circle(PAGE_W / 2 + 42, PAGE_H / 2 - 64, 12, stroke=1, fill=0)
    c.showPage()


def draw_back_cover(c):
    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.setFont(TITLE_FONT, 27)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 165, "MOMENTOS PEQUEÑOS.")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 202, "RECUERDOS GRANDES.")
    c.setFillColor(black)
    blurb = (
        "24 actividades para colorear, conversar y convertir la cocina, el juego, "
        "los paseos y la hora del cuento en aventuras compartidas."
    )
    lines = wrap_lines(blurb, "Helvetica", 14, PAGE_W - 180)
    y = PAGE_H - 270
    c.setFont("Helvetica", 14)
    for line in lines:
        c.drawCentredString(PAGE_W / 2, y, line)
        y -= 21
    c.setStrokeColor(BLUE)
    c.setLineWidth(3)
    c.line(170, 205, 442, 205)
    c.setFillColor(GREEN)
    c.setFont(TITLE_FONT, 16)
    c.drawCentredString(PAGE_W / 2, 165, "AVENTURAS CON PAPÁ")
    c.showPage()


def build():
    missing = [str(ART_DIR / f"page-{index:02d}.png") for index in range(1, 25) if not (ART_DIR / f"page-{index:02d}.png").exists()]
    if missing:
        raise FileNotFoundError(f"Missing art: {missing}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=letter, pageCompression=1)
    c.setTitle("Aventuras con papá - Libro imprimible")
    c.setAuthor("Aventuras con papá")
    c.setSubject("Actividades para colorear, conversar y hacer juntos")
    draw_front_cover(c)
    draw_inside_cover(c)
    for index, data in enumerate(PAGES, start=1):
        draw_activity_page(c, index, data)
        draw_blank_back(c)
    draw_inside_back(c)
    draw_back_cover(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
