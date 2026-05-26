# -*- coding:utf-8 -*-

import os
import re
import json

RE_META = re.compile(r'^<!--\s*(\w+)\s*[:=]\s*(.+?)\s*-->$')
PAGE_EXT = '.md'
SOURCE_ROOT = 'docs'
OUTPUT_FILE = os.path.join(SOURCE_ROOT, 'articles.json')


def parse_meta(content):
    meta = {}
    for line in content.split('\n'):
        m = RE_META.match(line.strip())
        if m:
            meta[m.group(1).strip()] = m.group(2).strip()
    return meta


def scan(source_root):
    result = []
    for root, dirs, files in os.walk(source_root):
        dirs[:] = [d for d in dirs if d not in ('js', 'css', 'game')]
        for filename in files:
            if not filename.endswith(PAGE_EXT):
                continue
            file_path = os.path.join(root, filename)
            relpath = os.path.relpath(root, source_root)
            if relpath == '.':
                relpath = ''
            else:
                relpath = '/' + relpath

            name = filename[:-len(PAGE_EXT)]
            path = relpath + '/' + name

            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            meta = parse_meta(content)

            result.append({
                'title': meta.get('title', name),
                'path': path,
                'date': meta.get('date', '')
            })

    result.sort(key=lambda x: x.get('date', ''), reverse=True)
    return result


if __name__ == '__main__':
    articles = scan(SOURCE_ROOT)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print('Generated %s with %d articles' % (OUTPUT_FILE, len(articles)))
