# -*- coding:utf-8 -*-

import os
import re
import json
import sys

RE_META = re.compile(r'^<!--\s*(\w+)\s*[:=]\s*(.+?)\s*-->$')
VERSION_PLACEHOLDER = '{{VERSION}}'

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
    index_path = os.path.join(source_root, 'index.html')
    version = config.get('version', 0)

    articles = scan(source_root, page_ext, exclude_dirs)

    def dump_output(v):
        return json.dumps({
            'version': v,
            'categories': config.get('categories', {}),
            'category_order': config.get('category_order', []),
            'articles': articles
        }, ensure_ascii=False, indent=2)

    current_output = None
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            current_output = f.read()

    current_html = None
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            current_html = f.read()

    if current_output == dump_output(version) and current_html == render_index_html(source_root, version):
        print('Index up to date (v%d)' % version)
        return

    version += 1
    config['version'] = version

    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(dump_output(version))

    expected_html = render_index_html(source_root, version)
    if expected_html is not None:
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(expected_html)

    print('Generated %s with %d articles (v%d)' % (output_file, len(articles), version))


def render_index_html(source_root, version):
    index_path = os.path.join(source_root, 'index.html')
    if not os.path.exists(index_path):
        return None
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'\?v=\d+', '?v=' + str(version), content)
    content = content.replace(VERSION_PLACEHOLDER, '?v=' + str(version))
    return content


if __name__ == '__main__':
    config = load_config()
    generate(config)
