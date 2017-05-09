# 简单的静态博客生成器  

听人说写博客是一种积累，断断续续也写过不少博客软件，内容却是没写多少。这篇算是一个开端，希望能坚持下去。  
先回忆下过去用过的，14年的时候是使用php简单写的一个博客系统，也就是简单展示文章。15年的时候工作原因接触到python，又用tornado写了一个简单的博客系统，也开始采用markdown作为文章的原始数据。
到了现在17年了，仔细想想我需要的博客系统并没有那么复杂。暂定了几个目标：

* 用markdown做原始数据  
* 静态页面就好，方便迁移也无需评论（反正也没人看）  
* 用git一类的版本管理软件进行管理  

于是就有了现在这个小脚本[cow.py](https://github.com/LaoQi/nebula-m78/blob/master/cow.py)

---------

```python
# -*- coding:utf-8 -*-
"""
cow.py  version 0.1
"""

import codecs
import os
import re
import shutil
import stat
import sys
import json
import timeit

import markdown
from markdown.extensions import sane_lists
from pymdownx import extra

ABSTRACT_LEN = 512
INDEX_LIMIT = 20
PAGE_EXT = '.markdown'
TAG_TITLE = '{{TITLE}}'
TAG_CONTENT = '{{CONTENT}}'
RE_TRIP = re.compile('<.*?>|\n')
RE_TITLE = re.compile('<h1>(.+?)</h1>')

class MyPostprocessor(markdown.postprocessors.Postprocessor):
    """ markdown postprocessor """

    def __init__(self, *args, **kwargs):
        super(MyPostprocessor).__init__(*args, **kwargs)
        self.title = 'nebula-m78'
        self.abstract = ''

    def run(self, text):
        start = 0
        end = ABSTRACT_LEN
        result = RE_TITLE.match(text)

        if result:
            self.title = result.group(1)
            start = len(self.title) + 9

        custom_abs = text.find('<hr />')
        if custom_abs > 0 and custom_abs < ABSTRACT_LEN:
            end = custom_abs
            self.abstract = text[start:end]
        else:
            self.abstract = RE_TRIP.sub('', text[start:])[:end]

        content = TEMPLATE.replace(TAG_TITLE, self.title)
        return content.replace(TAG_CONTENT, text)

def generate(src, dst):
    """conver md2html"""
    input_file = codecs.open(src, mode="r", encoding="utf-8")
    text = input_file.read()

    markd = markdown.Markdown(extensions=[
        extra.makeExtension(), sane_lists.makeExtension()])
    processor = MyPostprocessor()
    markd.postprocessors.add('mypreprocessor', processor, '_end')

    output_file = codecs.open(dst, "w", encoding="utf-8")
    output_file.write(markd.convert(text))
    status = os.stat(src)
    return (processor.title, processor.abstract, status[stat.ST_MTIME])

def building(source_root, target_root):
    """doc"""

    count_copy = 0
    count_convert = 0
    start = timeit.default_timer()
    result = []
    struct = {}

    for root, dirs, files in os.walk(source_root):
        for dirname in dirs:
            dir_path = os.path.join(root, dirname)
            target_dir = os.path.join(target_root, os.path.relpath(dir_path, source_root))
            if not os.path.exists(target_dir):
                os.mkdir(target_dir)

        for filename in files:
            file_path = os.path.join(root, filename)
            relpath = os.path.relpath(root, source_root)
            target_file = os.path.join(target_root, relpath, filename)

            if relpath == '.':
                relpath = '/'
            else:
                relpath = '/' + relpath + '/'

            end = -len(PAGE_EXT)
            if filename.endswith(PAGE_EXT):
                title, abstract, timestamp = generate(file_path, target_file[:end] + ".html")
                if relpath not in struct:
                    struct[relpath] = []
                struct[relpath].append({'title':title, 'path':filename[:end], 'mtime': timestamp})

                result.append({
                    'title':title, 'abstract':abstract,
                    'mtime':timestamp, 'path':relpath + filename[:end] + '.html'})
                count_convert += 1
            else:
                shutil.copy(file_path, target_file)
                count_copy += 1

    cost_time = timeit.default_timer() - start

    # sort
    result.sort(key=lambda x: x['mtime'])
    result.reverse()
    for key in struct:
        struct[str(key)].sort(key=lambda x: x['mtime'])
        struct[str(key)].reverse()

    # storage
    for i in range(0, len(result), INDEX_LIMIT):
        with open(os.path.join(target_root, 'index.%d.json'%(i/INDEX_LIMIT)), 'w') as output:
            json.dump(result[i:i+INDEX_LIMIT], output)
    with open(os.path.join(target_root, 'struct.json'), 'w') as output:
        json.dump(struct, output)

    print(
        "Copy %d files, Convert %d markdown files, Use time : %ds" %
        (count_copy, count_convert, cost_time))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print('Error Params')
        exit(1)

    def check(path):
        """check path"""
        return os.path.isdir(os.path.abspath(path))

    TEMPLATE = """<!DOCTYPE html>
<html>
    <head>
        <title>{{TITLE}}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    </head>
    <body>{{CONTENT}}</body>
</html>"""
    if os.path.exists('template.html'):
        with open('template.html', mode='r') as t:
            TEMPLATE = t.read()

    if not check(sys.argv[1]) or not check(sys.argv[2]):
        print('Error Path')
        exit(2)

    DOCUMENT_ROOT = os.path.abspath(sys.argv[1])
    TARGET_ROOT = os.path.abspath(sys.argv[2])
    building(DOCUMENT_ROOT, TARGET_ROOT)

```

世面比较流行的静态博客生成器也有很多比如`Jekyll`，`hexo`等等，之所以不采用这些，只是觉得我要的东西并不复杂，自己简单实现一个应该不会很难。而且目前见到的比如`hexo`依赖也比较麻烦。  
目前`cow.py`这个脚本依赖`pymdown-extensions`，`markdown`这些简单扩展，仅仅一百多行，实现的功能也非常简单，生成markdown文件的摘要，文档结构，最后转换成html而已。  
我在服务器上的仓库挂上钩子，这样每次提交后，就自动转换成新的页面，一个简单的静态博客生成器就完成了。  
说下现在碰见的问题：

* 搜索功能  
* 文章元数据比如标签，日期之类的是没有的  
* 无法评论  
  
第一个搜索功能，因为是静态页，可以考虑生成一份搜索用的关键词json文件，交给前端去查询，不过实现意义不是很大。第二个，现在依靠目录结构做分类，倒是也没太大的问题。至于第三个，目前可用的社会化评论系统也不知道选哪个，更何况也没人看，就更没人评论了。
主要是第二个问题比较麻烦，我并不想额外存储一份文章元数据，也不想通过修改markdown格式来存储，还好现在也没什么文章，这个需求等有了内容再说吧。
