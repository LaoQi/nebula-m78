# AGENTS.md

本文件供 AI 协作开发与写作时参考。

## 项目概述

个人静态博客系统：`docs/` 下维护 Markdown 文章，`gen_index.py` 扫描生成索引，无构建步骤、无第三方依赖（仅 Python 标准库），`docs/index.html` 为前端页面。

## 目录结构

- `config.json` — 站点配置：标题、分类（key → 显示名）、分类顺序、排除目录、内容根目录、版本号（缓存破坏用）
- `gen_index.py` — 索引生成器
- `serve.sh` — 本地服务脚本
- `docs/` — 内容根目录，按分类分目录：`jottings`（随笔）、`note`（笔记）、`ai`（人工智障）、`keyboard`（自制键盘）、`pgit`
- `docs/index.html` — 前端页面
- `docs/js`、`docs/css`、`docs/game` — 静态资源与独立页面，不参与文章扫描
- `docs/articles.json` — **生成产物，禁止手动编辑**

## 常用命令

```bash
python3 gen_index.py   # 重新生成索引（幂等）
./serve.sh serve       # 本地预览
./serve.sh new         # 交互式新建文章
./serve.sh preview     # 预览并监听文件变化自动重建（依赖 inotifywait）
./serve.sh categories  # 查看分类配置
```

## 新增文章

1. 放入对应分类目录 `docs/<category>/<slug>.md`，文件名用英文蛇形命名
2. 文件头部必须包含元信息：

```markdown
<!-- title: 文章标题 -->
<!-- date: YYYY-MM-DD -->
```

3. 运行 `python3 gen_index.py` 更新索引，或直接提交（pre-commit 钩子会自动处理）
4. 新增分类需同时修改 `config.json` 的 `categories` 与 `category_order`

### 写作惯例

- 简体中文，博主第一人称口吻
- `ai`（人工智障）栏目：AI 生成的文章在文首以引用块注明生成模型，如 `> 本篇由 <模型名> 生成`
- 历史文章存在"AI 勘误"附注段落（如《对Agent的一些思考》），为特定文章的产物，**不是**新文章的必备结构

## 索引生成机制（修改 `gen_index.py` 前必读）

- 扫描 `docs/**/*.md`（跳过 `exclude_dirs`），解析头部元信息，按日期倒序写入 `docs/articles.json`，并将 `config.json` 中的 `version` 应用到 `docs/index.html` 的静态资源引用（`?v=N`）
- **版本号幂等递增**：仅当生成的 `articles.json` 或 `index.html` 内容与磁盘不一致时才 `version+1` 并写文件；否则输出 `Index up to date (vN)`，不产生任何文件变更
- 验证方式：连续运行两次，第二次应输出 up to date，且 `git status` 保持干净

## Git 约定

- `pre-commit` 钩子（位于 `.git/hooks/`，**不进版本库**）在暂存了 `docs/**/*.md` 时自动运行 `gen_index.py` 并暂存 `articles.json` / `index.html` / `config.json`；换克隆环境需重建该钩子
- 提交信息为中文简述式，无 conventional commits 前缀，如 `新增AI栏目: 文章标题; 同步索引`
- 默认无签名提交
- 提交完成后 `git status` 应保持干净：索引产物变更由钩子自动随本次提交暂存，不应出现"提交一次、遗留一次"的循环

## 注意事项

- `docs/articles.json`、`docs/index.html` 中的 `?v=N`、`config.json` 的 `version` 均为生成产物，禁止手动编辑
- `serve.sh new` 按标题生成文件名（会保留中文）；项目惯例为英文蛇形命名，建议直接手动创建文件，或用其创建后重命名
