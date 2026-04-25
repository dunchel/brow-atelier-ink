"""
Scraper for browatelier-ink.com (Wix site)
Extracts text content, page structure, and downloads images.
"""

import json
import os
import re
import time
import urllib.request
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path

BASE_URL = "https://www.browatelier-ink.com"
OUTPUT_DIR = Path(__file__).parent / "scraped"
CONTENT_DIR = OUTPUT_DIR / "content"
IMAGES_DIR = OUTPUT_DIR / "images"

PAGES = [
    ("/", "home"),
    ("/diensten", "diensten"),
    ("/wenkbrauwen", "wenkbrauwen"),
    ("/contact", "contact"),
    ("/over-ons", "over-ons"),
    ("/webshop", "webshop"),
    ("/statement-pieces", "statement-pieces"),
    ("/lashes", "lashes"),
    ("/privacy-policy", "privacy-policy"),
    ("/algemene-voorwaarden", "algemene-voorwaarden"),
    ("/brows", "brows"),
    ("/studex", "studex"),
    ("/toothgems", "toothgems"),
]


class SimpleHTMLExtractor(HTMLParser):
    """Extracts text, headings, images, and links from HTML."""

    def __init__(self):
        super().__init__()
        self.result = {
            "title": "",
            "headings": [],
            "paragraphs": [],
            "images": [],
            "links": [],
        }
        self._current_tag = None
        self._current_text = ""
        self._in_title = False
        self._skip_tags = {"script", "style", "noscript"}
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag in self._skip_tags:
            self._skip_depth += 1
            return
        if self._skip_depth > 0:
            return

        if tag == "title":
            self._in_title = True
            self._current_text = ""
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._current_tag = tag
            self._current_text = ""
        elif tag == "p":
            self._current_tag = "p"
            self._current_text = ""
        elif tag == "img":
            src = attrs_dict.get("src", "")
            alt = attrs_dict.get("alt", "")
            if src and not src.startswith("data:"):
                self.result["images"].append({"src": src, "alt": alt})
        elif tag == "a":
            href = attrs_dict.get("href", "")
            if href:
                self.result["links"].append(href)

    def handle_endtag(self, tag):
        if tag in self._skip_tags and self._skip_depth > 0:
            self._skip_depth -= 1
            return
        if self._skip_depth > 0:
            return

        text = self._current_text.strip()
        if tag == "title" and self._in_title:
            self.result["title"] = text
            self._in_title = False
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6") and self._current_tag == tag:
            if text:
                self.result["headings"].append({"level": tag, "text": text})
            self._current_tag = None
        elif tag == "p" and self._current_tag == "p":
            if text and len(text) > 5:
                self.result["paragraphs"].append(text)
            self._current_tag = None

    def handle_data(self, data):
        if self._skip_depth > 0:
            return
        if self._in_title or self._current_tag:
            self._current_text += data


def fetch_page(url):
    """Fetch HTML from a URL, return (status_code, html_text)."""
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/120.0.0.0 Safari/537.36"
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None, None


def download_image(url, filename):
    """Download an image to IMAGES_DIR."""
    try:
        if url.startswith("//"):
            url = "https:" + url
        elif not url.startswith("http"):
            url = BASE_URL + url

        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            filepath = IMAGES_DIR / filename
            with open(filepath, "wb") as f:
                f.write(data)
            print(f"  Downloaded: {filename} ({len(data)} bytes)")
            return True
    except Exception as e:
        print(f"  Failed to download {url}: {e}")
        return False


def sanitize_filename(name, max_len=80):
    """Create a safe filename from a string."""
    name = re.sub(r'[^\w\s\-.]', '', name)
    name = re.sub(r'\s+', '_', name)
    return name[:max_len]


def scrape_page(path, slug):
    """Scrape a single page and return extracted data."""
    url = BASE_URL + path
    print(f"\nScraping: {url}")

    status, html = fetch_page(url)
    if status is None or status >= 400:
        print(f"  Skipped (status: {status})")
        return None

    parser = SimpleHTMLExtractor()
    parser.feed(html)
    result = parser.result
    result["url"] = url
    result["slug"] = slug
    result["status"] = status

    json_path = CONTENT_DIR / f"{slug}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  Saved content to {json_path.name}")
    print(f"  Title: {result['title']}")
    print(f"  Headings: {len(result['headings'])}, Paragraphs: {len(result['paragraphs'])}, Images: {len(result['images'])}")

    return result


def main():
    os.makedirs(CONTENT_DIR, exist_ok=True)
    os.makedirs(IMAGES_DIR, exist_ok=True)

    all_pages = []
    all_images = []

    for path, slug in PAGES:
        result = scrape_page(path, slug)
        if result:
            all_pages.append({
                "slug": slug,
                "url": result["url"],
                "title": result["title"],
                "headings": [h["text"] for h in result["headings"]],
                "paragraph_count": len(result["paragraphs"]),
                "image_count": len(result["images"]),
            })
            for img in result["images"]:
                if img["src"] not in [i["src"] for i in all_images]:
                    all_images.append(img)
        time.sleep(1)

    overview_path = OUTPUT_DIR / "pages.json"
    with open(overview_path, "w", encoding="utf-8") as f:
        json.dump(all_pages, f, ensure_ascii=False, indent=2)
    print(f"\n--- Overview saved to {overview_path} ---")

    print(f"\nDownloading {len(all_images)} unique images...")
    for i, img in enumerate(all_images):
        src = img["src"]
        alt = img.get("alt", "")
        ext = ".jpg"
        if ".png" in src.lower():
            ext = ".png"
        elif ".webp" in src.lower():
            ext = ".webp"
        elif ".svg" in src.lower():
            ext = ".svg"
        elif ".gif" in src.lower():
            ext = ".gif"

        name_base = alt if alt else f"image_{i}"
        filename = sanitize_filename(name_base) + ext
        download_image(src, filename)
        time.sleep(0.5)

    print(f"\nDone! Scraped {len(all_pages)} pages, found {len(all_images)} images.")
    print(f"Content: {CONTENT_DIR}")
    print(f"Images:  {IMAGES_DIR}")


if __name__ == "__main__":
    main()
