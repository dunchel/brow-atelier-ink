# Producten toevoegen via Google Sheets

Dit is de makkelijkste manier om producten op de website te krijgen.
Geen technische kennis nodig -- gewoon een spreadsheet invullen.

---

## Hoe het werkt

1. Je vult producten in een **Google Sheet** in (naam, prijs, foto, etc.)
2. De website haalt automatisch de producten op uit die Sheet
3. Producten verschijnen binnen 5 minuten op de website
4. Aanpassen? Gewoon de Sheet bewerken -- de website past zich automatisch aan

---

## Stap 1: Google Sheet aanmaken

1. Ga naar [sheets.google.com](https://sheets.google.com)
2. Maak een **nieuw spreadsheet** aan
3. Noem het bijv. "Producten Brow Atelier & Ink"
4. Vul de **eerste rij** (koppen) in met precies deze namen:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| **Naam** | **Prijs** | **Beschrijving** | **Categorie** | **Foto** | **Tags** | **Beschikbaar** | **Oude prijs** |

---

## Stap 2: Producten invullen

Vul vanaf rij 2 je producten in. Voorbeeld:

| Naam | Prijs | Beschrijving | Categorie | Foto | Tags | Beschikbaar | Oude prijs |
|------|-------|--------------|-----------|------|------|-------------|------------|
| Brow Serum Deluxe | 24.95 | Voedt en versterkt je wenkbrauwen | Brow producten | (foto-link) | brows, serum | Ja | |
| Gold Hoop Earrings | 19.95 | Elegante gouden oorringen | Sieraden | (foto-link) | sieraden, goud | Ja | 29.95 |
| Lash Growth Serum | 29.95 | Stimuleert wimpergroei | Lash producten | (foto-link) | lashes | Nee | |

### Uitleg per kolom:

- **Naam**: Productnaam (verplicht)
- **Prijs**: In euro's, met punt als decimaal (24.95, niet 24,95) (verplicht)
- **Beschrijving**: Korte beschrijving van het product
- **Categorie**: Bijv. "Brow producten", "Sieraden", "Verzorging"
- **Foto**: Een link naar de foto (zie hieronder hoe)
- **Tags**: Zoekwoorden, gescheiden door komma's
- **Beschikbaar**: "Ja" of "Nee" (als het uitverkocht is)
- **Oude prijs**: Als het product in de aanbieding is (doorgestreepte prijs)

---

## Stap 3: Foto's toevoegen

### Optie A: Via Google Drive (makkelijkst)
1. Upload de foto naar **Google Drive**
2. Rechtermuisklik > **Delen > Iedereen met de link**
3. Kopieer de link
4. De link ziet er zo uit: `https://drive.google.com/file/d/XXXXX/view`
5. Pas de link aan naar: `https://drive.google.com/uc?id=XXXXX`
   (vervang XXXXX door het ID uit de originele link)
6. Plak deze link in de **Foto** kolom

### Optie B: Via Imgur (simpel)
1. Ga naar [imgur.com](https://imgur.com)
2. Sleep de foto erin
3. Kopieer de **directe link** (eindigt op .jpg of .png)
4. Plak in de Foto kolom

### Tip
Gebruik **vierkante foto's** (1:1 verhouding) voor het mooiste resultaat.

---

## Stap 4: Sheet publiceren

Dit moet eenmalig gedaan worden:

1. In Google Sheets: ga naar **Bestand > Delen > Publiceren op internet**
2. Kies bij "Link": **Heel het document**
3. Kies bij formaat: **Door komma's gescheiden waarden (.csv)**
4. Klik op **Publiceren**
5. Kopieer de link die verschijnt (ziet er uit als: `https://docs.google.com/spreadsheets/d/e/XXXXX/pub?output=csv`)
6. Geef deze link aan de developer -- die voegt hem toe aan de website

**Belangrijk:** Na publiceren worden alle wijzigingen die je in de Sheet maakt automatisch doorgevoerd op de website (binnen 5 minuten).

---

## Producten aanpassen

- **Prijs wijzigen**: Pas de prijs in de Sheet aan
- **Product verwijderen**: Verwijder de hele rij
- **Nieuw product**: Voeg een nieuwe rij toe
- **Uitverkocht**: Zet "Beschikbaar" op "Nee"
- **Aanbieding**: Vul de huidige prijs in bij "Prijs" en de oude prijs bij "Oude prijs"

De website wordt automatisch bijgewerkt (max 5 minuten vertraging).

---

## Hulp nodig?

Neem contact op met de developer of stuur een berichtje via WhatsApp.
