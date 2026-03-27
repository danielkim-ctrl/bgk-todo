import re

path = r"G:\공유 드라이브\공유드라이브_김대윤 개인폴더\todo 통합관리\index.html"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# </html> 이후 모든 내용 제거
idx = content.find('</html>')
if idx != -1:
    content = content[:idx + len('</html>')] + '\n'

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

lines = content.count('\n')
print(f"Done. Lines: {lines}")
