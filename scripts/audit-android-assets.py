from pathlib import Path
import re
import shutil
import zipfile

root = Path('/home/ubuntu/sakina-pro')
apk = root / 'android/app/build/outputs/apk/debug/app-debug.apk'
out = root / 'releases/sakina-debug-assets-fixed-20260815.apk'
report = root / 'docs/android-asset-path-audit-20260815.txt'

if not apk.exists():
    raise SystemExit(f'Missing APK: {apk}')

shutil.copy2(apk, out)
root_relative = re.compile(r"[\"']/(?:assets|fonts|images|data|audio|icons)/[^\"'<>\\s]+")
absolute_origin = re.compile(r"window\\.location\\.origin\\s*\\+\\s*[\"']/(?:assets|fonts|images|data|audio|icons)/")

def read_text(zf, name):
    return zf.read(name).decode('utf-8', errors='ignore')

with zipfile.ZipFile(out) as zf:
    names = zf.namelist()
    js_names = [n for n in names if n.startswith('assets/public/assets/') and n.endswith('.js')]
    css_names = [n for n in names if n.startswith('assets/public/assets/') and n.endswith('.css')]
    js_hits = []
    origin_hits = []
    css_root_hits = []
    css_urls = []
    for name in js_names:
        text = read_text(zf, name)
        js_hits.extend((name, m.group(0)) for m in root_relative.finditer(text))
        origin_hits.extend((name, m.group(0)) for m in absolute_origin.finditer(text))
    for name in css_names:
        text = read_text(zf, name)
        css_root_hits.extend((name, m.group(0)) for m in re.finditer(r"url\(/(?:assets|fonts|images|data|audio|icons)/", text))
        css_urls.extend((name, m.group(0)) for m in re.finditer(r"url\\([^)]*\\)", text))
    asset_counts = {
        'public_images': sum(n.startswith('assets/public/images/') for n in names),
        'public_fonts': sum(n.startswith('assets/public/fonts/') for n in names),
        'public_data': sum(n.startswith('assets/public/data/') for n in names),
        'compiled_js': len(js_names),
        'compiled_css': len(css_names),
    }

lines = [
    'APK asset-path audit',
    f'APK: {out}',
    f'SHA256: {__import__("hashlib").sha256(out.read_bytes()).hexdigest()}',
    '',
    'Counts:',
    *[f'- {k}: {v}' for k, v in asset_counts.items()],
    '',
    'Root-relative compiled JS hits (expected 0):',
    *(f'- {name}: {hit}' for name, hit in sorted(set(js_hits))),
    'NONE' if not js_hits else '',
    '',
    'window.location.origin + root-relative hits (expected 0):',
    *(f'- {name}: {hit}' for name, hit in sorted(set(origin_hits))),
    'NONE' if not origin_hits else '',
    '',
    'Root-relative compiled CSS url hits (expected 0):',
    *(f'- {name}: {hit}' for name, hit in sorted(set(css_root_hits))),
    'NONE' if not css_root_hits else '',
    '',
    'Compiled CSS URL samples:',
    *(f'- {name}: {url}' for name, url in css_urls[:25]),
]
report.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(report.read_text(encoding='utf-8'))
print(f'APK copied to: {out}')
