import os
import re

src_dir = os.path.dirname(os.path.abspath(__file__))
output_file = os.path.join(src_dir, "DecisionHelper.html")

# Read index.html
with open(os.path.join(src_dir, "index.html"), "r", encoding="utf-8") as f:
    html = f.read()

# Read styles.css
with open(os.path.join(src_dir, "styles.css"), "r", encoding="utf-8") as f:
    css = f.read()

# Read app.js
with open(os.path.join(src_dir, "app.js"), "r", encoding="utf-8") as f:
    js = f.read()

# Replace css link
css_tag = f"<style>\n{css}\n</style>"
css_match = re.search(r'<link rel="stylesheet" href="styles.css[^"]*">', html)
if css_match:
    html = html.replace(css_match.group(0), css_tag)

# Replace js script
js_tag = f"<script>\n{js}\n</script>"
js_match = re.search(r'<script src="app.js[^"]*"></script>', html)
if js_match:
    html = html.replace(js_match.group(0), js_tag)

# Save to output
with open(output_file, "w", encoding="utf-8") as f:
    f.write(html)

print("Bundled standalone single-file app successfully!")
