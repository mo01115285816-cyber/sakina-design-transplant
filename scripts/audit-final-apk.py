from pathlib import Path
import re
import sys
import zipfile

apk = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'releases' / 'sakina-debug-hardening-no-assets-20260815.apk'
root_relative = re.compile(r"[\"']/(?:fonts|images|data|audio|assets)/[^\"'<>\s]+")

def names_with_prefix(names, prefixes):
    return sorted(name for name in names if any(name.startswith(prefix) for prefix in prefixes))

with zipfile.ZipFile(apk) as archive:
    names = archive.namelist()
    public_names = names_with_prefix(names, ('assets/public/',))
    js_css = [name for name in public_names if name.endswith(('.js', '.css'))]
    marker_hits = []
    for name in js_css:
        text = archive.read(name).decode('utf-8', errors='ignore')
        for match in root_relative.findall(text):
            marker_hits.append((name, match))

    index = archive.read('assets/public/index.html').decode('utf-8', errors='ignore')
    print(f'APK={apk}')
    print(f'APK_ENTRIES={len(names)}')
    print(f'PUBLIC_ENTRIES={len(public_names)}')
    print(f'JS_CSS_FILES={len(js_css)}')
    print(f'ROOT_RELATIVE_MARKERS_IN_JS_CSS={len(marker_hits)}')
    for name, marker in marker_hits[:40]:
        print(f'MARKER {name} {marker}')
    print(f'INDEX_HAS_ROOT_ASSET_SRC={bool(re.search(r"(?:src|href)=\\\"/(?:assets|images|fonts|data)/", index))}')
    for label, prefixes in {
        'PUBLIC_IMAGES': ('assets/public/images/',),
        'PUBLIC_DATA': ('assets/public/data/',),
        'PUBLIC_FONTS': ('assets/public/fonts/',),
        'PUBLIC_AUDIO': ('assets/public/audio/',),
    }.items():
        matched = names_with_prefix(names, prefixes)
        print(f'{label}={len(matched)}')
    print('SAMPLE_PUBLIC_FILES')
    for name in public_names[:20]:
        print(name)
