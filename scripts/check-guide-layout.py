from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
from pypdf import PdfReader
import pdfplumber

pdf = Path('output/pdf/di-recruitment-complete-guide.pdf')
r = PdfReader(pdf)
assert len(r.pages) == 29, len(r.pages)
with pdfplumber.open(pdf) as doc:
    for i, page in enumerate(doc.pages):
        bad = [c for c in page.chars if c['x0'] < 40 or c['x1'] > page.width - 38 or c['top'] < 20 or c['bottom'] > page.height - 20]
        print('Page', i+1, 'edge violations', len(bad))
        if bad: print(''.join(c['text'] for c in bad))
images = sorted(Path('tmp/pdfs').glob('guide-*.png'))
for start in range(0, len(images), 9):
    sheet = Image.new('RGB', (1260, 1860), '#dce5e8')
    draw = ImageDraw.Draw(sheet)
    for n, path in enumerate(images[start:start+9]):
        im = Image.open(path).convert('RGB')
        im.thumbnail((400, 570))
        x, y = (n % 3)*420+10, (n//3)*620+30
        sheet.paste(im, (x, y))
        draw.text((x, y-20), 'Page '+str(start+n+1), fill='black')
    sheet.save(f'tmp/pdfs/review-{start//9+1}.png')
print('QA:',len(r.pages),'pages, contact sheets generated')
