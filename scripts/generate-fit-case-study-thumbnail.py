from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


SRC_PATH = Path(
    "c:/Users/laalg/Downloads/blog_maybe/public/media/articles/2026/06/"
    "case-study-gsc-web-search-3m.png"
)
OUT_PATH = Path(
    "c:/Users/laalg/Downloads/blog_maybe/public/media/articles/2026/06/"
    "case-study-gsc-web-search-thumb-fit.png"
)


def main() -> None:
    image = Image.open(SRC_PATH).convert("RGB")
    canvas = Image.new("RGB", (1600, 1000), (11, 18, 30))
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle(
        (44, 44, 1556, 956),
        radius=36,
        fill=(16, 28, 44),
        outline=(52, 78, 110),
        width=2,
    )

    title = "Case Study: Search Impressions During AdSense Review"
    subtitle = "Google Search Console - Web Search (3 months)"

    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()

    draw.text((110, 94), title, fill=(235, 244, 255), font=font_title)
    draw.text((110, 126), subtitle, fill=(162, 189, 220), font=font_subtitle)

    fitted = ImageOps.contain(image, (1360, 640), Image.Resampling.LANCZOS)
    x = (1600 - fitted.width) // 2
    y = 220
    canvas.paste(fitted, (x, y))
    draw.rectangle(
        (x - 2, y - 2, x + fitted.width + 2, y + fitted.height + 2),
        outline=(88, 115, 145),
        width=2,
    )

    canvas.save(OUT_PATH, format="PNG", optimize=True)
    print(str(OUT_PATH))


if __name__ == "__main__":
    main()
