# My Blog [nebula-m78.org](https://www.nebula-m78.org/)  

## 简单的静态页面生成器  

### 依赖

* markdown
* pymdown-extensions
* pygments

### 生成代码样式 

```shell
pygmentize -f html -a .highlight -S default > highlight.css
``` 

### 生成数据

```shell
python cow.py path/source target/source
```

生成`struct.json`结构数据，以及`index.x.json`摘要。
