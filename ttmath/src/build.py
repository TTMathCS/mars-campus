#!/usr/bin/env python3
"""Build ttmath/index.html (the published demo 1 page) from ttmath/src/page.html.
page.html is an artifact-style page with no doctype; this adds the document head, the social meta tags
and the paths to the shared terrain in ../data/ and the logo in ttmath/logo.png."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, ".."))
url = "https://ttmathcs.github.io/mars-campus/ttmath/"
desc = ("Walk real NASA terrain in Gale Crater, Mars, at sunset, find the TTMath campus over the ridge and walk into its "
        "classrooms, café, library and the Math Palace. Runs in the browser on desktop, iPhone and Android.")
src = open(os.path.join(HERE, "page.html"), encoding="utf-8").read()
cut = src.index("</style>") + len("</style>")
head, body = src[:cut].strip(), src[cut:].strip()
title = re.search(r"<title>(.*?)</title>", head).group(1)
og_img = ""
if os.path.exists(os.path.join(OUT, "preview.jpg")):
    og_img = f'<meta property="og:image" content="{url}preview.jpg">\n<meta name="twitter:card" content="summary_large_image">\n'
meta = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{desc}">
<meta name="theme-color" content="#120b09">
<meta name="color-scheme" content="dark">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="{title}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
{og_img}<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<script>window.MARS_DATA_BASE = "../data/"; window.MARS_LOGO_URL = "logo.png";</script>
'''
page = meta + head + "\n</head>\n<body>\n" + body + "\n</body>\n</html>\n"
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(page)
print("built", os.path.join(OUT, "index.html"), len(page.encode()), "bytes")
