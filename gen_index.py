# -*- coding:utf-8 -*-

import os
import re
import json
import sys

RE_META = re.compile(r'^<!--\s*(\w+)\s*[:=]\s*(.+?)\s*-->$')

CONFIG_FILE = 'config.json'


def load_config():
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def parse_meta(content):
    meta = {}
    for line in content.split('\n'):
        m = RE_META.match(line.strip())
        if m:
            meta[m.group(1).strip()] = m.group(2).strip()
    return meta


def scan(source_root, page_ext, exclude_dirs):
    result = []
    for root, dirs, files in os.walk(source_root):
        dirs[:] = [d for d in dirs if d not in tuple(exclude_dirs)]
        for filename in files:
            if not filename.endswith(page_ext):
                continue
            file_path = os.path.join(root, filename)
            relpath = os.path.relpath(root, source_root)
            if relpath == '.':
                relpath = ''
            else:
                relpath = '/' + relpath

            name = filename[:-len(page_ext)]
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


def generate(config):
    source_root = config.get('source_root', 'docs')
    page_ext = config.get('page_ext', '.md')
    exclude_dirs = config.get('exclude_dirs', ['js', 'css', 'game'])
    output_file = os.path.join(source_root, 'articles.json')

    articles = scan(source_root, page_ext, exclude_dirs)

    output = {
        'categories': config.get('categories', {}),
        'category_order': config.get('category_order', []),
        'articles': articles
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print('Generated %s with %d articles' % (output_file, len(articles)))


if __name__ == '__main__':
    config = load_config()
    generate(config)
