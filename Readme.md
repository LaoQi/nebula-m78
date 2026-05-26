# My Blog [blog.madao.dev](https://blog.madao.dev/)

纯静态博客，Markdown 文件由浏览器端 Remarkable + Highlight.js 渲染。

## 本地预览

```shell
./serve.sh
```

访问 http://localhost:8080

## 生成文章索引

新增文章后运行：

```shell
python3 gen_index.py
```

会生成 `docs/articles.json`，需提交到仓库。

## 部署

推送到 `main` 分支后，GitHub Actions 自动部署到 GitHub Pages。

## 目录结构

```
docs/               # GitHub Pages 部署目录
  *.markdown        # 文章源文件
  articles.json     # 文章索引
  index.html        # SPA 入口
  script.js         # 路由 + 渲染逻辑
  style.css         # 样式
  js/               # Remarkable, Highlight.js
  css/hljs/         # Highlight.js 主题
  game/             # 小游戏
```
