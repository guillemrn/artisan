from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
RENDERED = ROOT / "tmp" / "pdfs"


def make_sheet(page_numbers, output, columns=4, thumb_width=245):
    sample = Image.open(RENDERED / f"page-{page_numbers[0]:02d}.png")
    thumb_height = round(sample.height * thumb_width / sample.width)
    label_height = 24
    rows = (len(page_numbers) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * thumb_width, rows * (thumb_height + label_height)), "white")
    draw = ImageDraw.Draw(sheet)
    for position, page_number in enumerate(page_numbers):
        image = Image.open(RENDERED / f"page-{page_number:02d}.png").convert("RGB")
        image.thumbnail((thumb_width - 8, thumb_height - 8))
        column = position % columns
        row = position // columns
        x = column * thumb_width + (thumb_width - image.width) // 2
        y = row * (thumb_height + label_height) + label_height
        sheet.paste(image, (x, y))
        draw.text((column * thumb_width + 8, row * (thumb_height + label_height) + 4), f"PDF {page_number}", fill="black")
    sheet.save(output, optimize=True)


make_sheet(list(range(3, 50, 2)), ROOT / "tmp" / "pdfs" / "qa-activities.png")
make_sheet([1, 2, 51, 52], ROOT / "tmp" / "pdfs" / "qa-covers.png", columns=4, thumb_width=245)
