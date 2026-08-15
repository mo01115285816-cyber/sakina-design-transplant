from pathlib import Path
import difflib
import re

baseline = Path('/home/ubuntu/sakina-css-baseline-current.css').read_text(encoding='utf-8')
ab = next(Path('/home/ubuntu/sakina-pro-full/dist/assets').glob('*.css')).read_text(encoding='utf-8')

print(f'baseline_bytes={len(baseline.encode())}')
print(f'ab_bytes={len(ab.encode())}')
print(f'baseline_sha_prefix={__import__("hashlib").sha256(baseline.encode()).hexdigest()}')
print(f'ab_sha_prefix={__import__("hashlib").sha256(ab.encode()).hexdigest()}')

markers = [r'h-5\\.5', r'z-45', r'bg-quranify', r'--color-quranify', r'--spacing', r'@property', r'color-mix', r'oklch']
for marker in markers:
    print(f'{marker}: baseline={len(re.findall(marker, baseline))} ab={len(re.findall(marker, ab))}')

first_diff = next((i for i, (a, b) in enumerate(zip(baseline, ab)) if a != b), min(len(baseline), len(ab)))
print(f'first_diff_offset={first_diff}')
print('baseline_context=' + baseline[max(0, first_diff-180):first_diff+300])
print('ab_context=' + ab[max(0, first_diff-180):first_diff+300])

# Compare the set of selectors that define the key visual utility classes.
def selector_set(text):
    return set(re.findall(r'(?<![\\w-])(?:\\.|#)?[a-zA-Z0-9_\\[\\]#:.%/-]+(?=\\{)', text))
base_selectors = selector_set(baseline)
ab_selectors = selector_set(ab)
print(f'selector_set_baseline={len(base_selectors)}')
print(f'selector_set_ab={len(ab_selectors)}')
print(f'selectors_only_baseline={len(base_selectors - ab_selectors)}')
print(f'selectors_only_ab={len(ab_selectors - base_selectors)}')
