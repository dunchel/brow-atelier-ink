"""Convert Google Sheet CSV to Shopify product import CSV."""
import csv
import re

INPUT = "sheet-data.csv"
OUTPUT = "shopify-import.csv"

def slugify(text):
    return re.sub(r'(^-|-$)', '', re.sub(r'[^a-z0-9]+', '-', text.lower()))

shopify_headers = [
    "Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type",
    "Tags", "Published", "Option1 Name", "Option1 Value", "Variant SKU",
    "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Qty",
    "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price",
    "Variant Compare At Price", "Variant Requires Shipping", "Variant Taxable",
    "Image Src", "Image Alt Text", "Status",
]

with open(INPUT, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(shopify_headers)

    for row in rows:
        naam = row.get("Naam", "").strip()
        if not naam:
            continue
        prijs = row.get("Prijs", "0").strip()
        beschrijving = row.get("Beschrijving", "").strip()
        categorie = row.get("Categorie", "").strip()
        foto = row.get("Foto", "").strip()
        tags = row.get("Tags", "").replace(";", ",").strip()
        beschikbaar = row.get("Beschikbaar", "Ja").strip()
        oude_prijs = row.get("Oude prijs", "").strip()

        published = beschikbaar.lower() != "nee"

        writer.writerow([
            slugify(naam),
            naam,
            f"<p>{beschrijving}</p>" if beschrijving else "",
            "Brow Atelier & Ink",
            "",
            categorie,
            tags,
            "TRUE" if published else "FALSE",
            "Title",
            "Default Title",
            "",
            "0",
            "shopify",
            "10",
            "deny",
            "manual",
            prijs,
            oude_prijs,
            "TRUE",
            "TRUE",
            foto,
            naam,
            "active" if published else "draft",
        ])

print(f"Klaar! {len(rows)} producten geconverteerd naar {OUTPUT}")
