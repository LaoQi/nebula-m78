var md = new remarkable.Remarkable({
    html: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(str, { language: lang }).value;
            } catch (__) {}
        }
        try {
            return hljs.highlightAuto(str).value;
        } catch (__) {}
        return '';
    }
});

var articlesCache = null;
var categoriesCache = null;
var categoryOrderCache = null;

function requestJSON(url, success, failed) {
    var xh = new XMLHttpRequest();
    xh.onreadystatechange = function () {
        if (xh.readyState === XMLHttpRequest.DONE) {
            if (xh.status === 200) {
                success(JSON.parse(xh.responseText));
            } else if (failed) {
                failed(xh);
            }
        }
    };
    xh.open('GET', url);
    xh.send(null);
}

function loadArticles(callback) {
    if (articlesCache) {
        callback(articlesCache);
        return;
    }
    requestJSON('/articles.json', function (data) {
        categoriesCache = data.categories || {};
        categoryOrderCache = data.category_order || Object.keys(categoriesCache);
        articlesCache = data.articles || data;
        callback(articlesCache);
    }, function () {
        document.getElementById('content').innerHTML = '<h2>加载文章列表失败</h2>';
    });
}

function getCategory(path) {
    var parts = path.split('/');
    if (parts.length > 2) {
        return parts[1];
    }
    return '';
}

function getCategoryLabel(cat) {
    if (!cat) return '其他';
    return categoriesCache[cat] || cat;
}

function renderSidebar(activePath) {
    loadArticles(function (articles) {
        var grouped = {};
        articles.forEach(function (a) {
            var cat = getCategory(a.path);
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(a);
        });

        var html = '';
        var order = categoryOrderCache || Object.keys(categoriesCache);
        order.forEach(function (cat) {
            if (!grouped[cat]) return;
            var label = getCategoryLabel(cat);
            html += '<div class="sidebar-category">';
            html += '<div class="sidebar-category-title">' + label + '</div>';
            html += '<ul class="sidebar-article-list">';
            grouped[cat].forEach(function (a) {
                var cls = (activePath && a.path === activePath) ? ' class="active"' : '';
                html += '<li><a href="#' + a.path + '"' + cls + '>' + a.title + '</a></li>';
            });
            html += '</ul></div>';
        });

        if (grouped['']) {
            html += '<div class="sidebar-category">';
            html += '<div class="sidebar-category-title">其他</div>';
            html += '<ul class="sidebar-article-list">';
            grouped[''].forEach(function (a) {
                var cls = (activePath && a.path === activePath) ? ' class="active"' : '';
                html += '<li><a href="#' + a.path + '"' + cls + '>' + a.title + '</a></li>';
            });
            html += '</ul></div>';
        }

        document.getElementById('sidebar-inner').innerHTML = html;
    });
}

function renderIndex() {
    renderSidebar(null);
    loadArticles(function (articles) {
        if (articles.length === 0) {
            document.getElementById('content').innerHTML = '<p>暂无文章</p>';
            return;
        }
        renderArticle(articles[0].path, true);
    });
}

function renderArticle(path, skipSidebar) {
    if (!skipSidebar) renderSidebar(path);
    var content = document.getElementById('content');
    content.innerHTML = '<p>加载中...</p>';
    fetch(path + '.md')
        .then(function (res) {
            if (!res.ok) throw new Error('Not found');
            return res.text();
        })
        .then(function (text) {
            content.innerHTML = md.render(text);
            var h1 = content.querySelector('h1');
            if (h1) {
                document.title = h1.textContent + ' - Fish More Worry Less';
                var dateStr = '';
                loadArticles(function (articles) {
                    for (var i = 0; i < articles.length; i++) {
                        if (articles[i].path === path) {
                            dateStr = articles[i].date;
                            break;
                        }
                    }
                    if (dateStr) {
                        var dateEl = document.createElement('span');
                        dateEl.className = 'article-date';
                        dateEl.textContent = dateStr;
                        h1.parentNode.insertBefore(dateEl, h1.nextSibling);
                    }
                });
            }
        })
        .catch(function () {
            content.innerHTML = '<h2>找不到内容，<a href="#/">返回首页</a></h2>';
        });
}

function renderArchive() {
    renderSidebar(null);
    loadArticles(function (articles) {
        var html = '<h1>归档</h1><ol id="threads-container">';
        var lastYear = '';
        for (var i = 0; i < articles.length; i++) {
            var a = articles[i];
            var year = a.date ? a.date.substring(0, 4) : '未知';
            if (year !== lastYear) {
                if (lastYear) html += '</ol>';
                html += '<h2>' + year + '</h2><ol id="threads-container">';
                lastYear = year;
            }
            html += '<li class="thread"><a href="#' + a.path + '">' + a.title + '</a> <span style="color:#6a737d;font-size:0.85em">' + a.date + '</span></li>';
        }
        html += '</ol>';
        document.getElementById('content').innerHTML = html;
        document.title = '归档 - Fish More Worry Less';
    });
}

function hashRoute() {
    var hash = location.hash.substring(1);
    if (!hash || hash === '/') {
        renderIndex();
    } else if (hash === '/archive') {
        renderArchive();
    } else {
        renderArticle(hash);
    }
    window.scrollTo(0, 0);
}

window.onhashchange = hashRoute;
window.onload = function () {
    hashRoute();

    var toggle = document.getElementById('menu-toggle');
    var nav = document.getElementById('header-nav');
    toggle.addEventListener('click', function () {
        nav.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
        if (!nav.contains(e.target) && e.target !== toggle) {
            nav.classList.remove('open');
        }
    });

    var sidebarToggle = document.getElementById('sidebar-toggle');
    var sidebar = document.getElementById('sidebar');
    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        sidebarToggle.textContent = sidebar.classList.contains('open') ? '目录 ▴' : '目录 ▾';
    });
};
