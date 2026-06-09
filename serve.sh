#!/bin/bash
set -e

CONFIG_FILE="config.json"
SOURCE_ROOT="docs"
PAGE_EXT=".md"
PORT=8080

load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        SOURCE_ROOT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('source_root', 'docs'))")
        PAGE_EXT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('page_ext', '.md'))")
        PORT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('default_port', 8080))")
    fi
}

cmd_serve() {
    python3 gen_index.py
    echo "Serving at http://localhost:$PORT ..."
    cd "$SOURCE_ROOT" && python3 -m http.server "$PORT"
}

cmd_preview() {
    python3 gen_index.py
    echo "Watching for changes... (Ctrl+C to stop)"
    echo "Serving at http://localhost:$PORT ..."
    
    python3 -m http.server "$PORT" --directory "$SOURCE_ROOT" &
    SERVER_PID=$!
    
    trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM
    
    while inotifywait -r -e modify,create,delete "$SOURCE_ROOT" --exclude '\.json$' 2>/dev/null; do
        echo "Regenerating index..."
        python3 gen_index.py
    done
}

cmd_new() {
    load_config
    
    echo "=== 新建文章 ==="
    echo ""
    
    CATEGORIES=$(python3 -c "import json; d=json.load(open('$CONFIG_FILE')); print('\\n'.join(['%s|%s' % (k,v) for k,v in d.get('categories',{}).items()]))")
    
    echo "选择分类:"
    IFS=$'\n'
    options=()
    for line in $CATEGORIES; do
        key=$(echo "$line" | cut -d'|' -f1)
        label=$(echo "$line" | cut -d'|' -f2)
        options+=("$key")
        echo "${#options[@]}) $label ($key)"
    done
    echo "0) 根目录 (无分类)"
    echo ""
    
    read -p "请输入序号 [1-${#options[@]}]: " choice
    
    if [ "$choice" = "0" ]; then
        category=""
        target_dir="$SOURCE_ROOT"
    elif [ "$choice" -ge 1 ] && [ "$choice" -le ${#options[@]} ]; then
        category="${options[$((choice-1))]}"
        target_dir="$SOURCE_ROOT/$category"
        mkdir -p "$target_dir"
    else
        echo "无效选择"
        exit 1
    fi
    
    echo ""
    read -p "文章标题: " title
    
    if [ -z "$title" ]; then
        echo "标题不能为空"
        exit 1
    fi
    
    slug=$(python3 -c "
import re, sys
t = sys.argv[1]
t = re.sub(r'[^\w\u4e00-\u9fa5]+', '_', t).strip('_')
print(t if t else 'untitled')
" "$title")
    
    today=$(date +%Y-%m-%d)
    
    filepath="$target_dir/$slug$PAGE_EXT"
    
    if [ -f "$filepath" ]; then
        echo "文件已存在: $filepath"
        exit 1
    fi
    
    cat > "$filepath" << EOF
<!-- title: $title -->
<!-- date: $today -->

# $title

EOF
    
    echo ""
    echo "已创建: $filepath"
    echo ""
    
    python3 gen_index.py
    
    echo "索引已更新"
}

cmd_list_categories() {
    python3 -c "
import json
with open('$CONFIG_FILE', 'r', encoding='utf-8') as f:
    config = json.load(f)
print('当前分类配置:')
for k, v in config.get('categories', {}).items():
    print(f'  {k}: {v}')
print()
print('显示顺序:', ', '.join(config.get('category_order', [])))
"
}

usage() {
    echo "用法: $0 <命令>"
    echo ""
    echo "命令:"
    echo "  serve     启动本地服务器 (默认)"
    echo "  preview   启动服务器并监听文件变化"
    echo "  new       新建文章"
    echo "  categories 查看分类配置"
    echo ""
    echo "示例:"
    echo "  $0 serve"
    echo "  $0 new"
}

case "${1:-serve}" in
    serve)
        cmd_serve
        ;;
    preview)
        cmd_preview
        ;;
    new)
        cmd_new
        ;;
    categories|cats)
        cmd_list_categories
        ;;
    -h|--help|help)
        usage
        ;;
    *)
        echo "未知命令: $1"
        usage
        exit 1
        ;;
esac
