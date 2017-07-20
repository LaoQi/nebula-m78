# zsh根据ssh配置自动补全

zsh用了很久了，配置一直用的grml和自己的一点点配置。因为平时经常连别的服务器，`~/.ssh/config`配置写了一堆，但是一直都没有很好的自动补全，今天终于打算自己看一下，发现改起来还是蛮简单的，先记录下来。

----------------------

我之前的配置使用的是

```zsh
zstyle -e ':completion::*:*:*:hosts' hosts 'reply=(${=${${(f)"$(cat {/etc/ssh_,~/.ssh/known_}hosts(|2    )(N) /dev/null)"}%%[# ]*}//,/ })'
```

因为用了几年的zsh配置了，不知道在哪里找到的，本身的功能大概是从`~/.ssh/known_hosts`获取已连接过的主机名进行补全。主要不知道`zstyle`的语法，而且许多的`$`和大括号实在看的有点晕，去搜索文档一时半会也没找到。感觉为了补全主机名找这么多有点浪费时间，于是就直接动手测试了。修改如下：

```zsh
zstyle -e ':completion::*:*:*:hosts' hosts 'reply=($(grep -v "HostName" ~/.ssh/config | grep Host | cut -d" " -f2))'
```

大意是取出`~/.ssh/config`中所有的`Host`的名字。

根据观察，`zstyle -e`就可以把后面的`'reply=($(grep -v "HostName" ~/.ssh/config | grep Host | cut -d" " -f2))'`解析执行，否则作为字符串  
    
使用`$`符号就可以执行括号中的命令，可以稍微改良下，变成函数就好看一些。最终版：

```zsh
SearchHostsConfig() {
	grep -v "HostName" ~/.ssh/config | grep Host | cut -d' ' -f2
}
#补全 ssh scp sftp 等
zstyle -e ':completion::*:*:*:hosts' hosts 'reply=($(SearchHostsConfig))'
```

发现有些事情其实简单尝试一下，说不定没有看起来那么困难。

