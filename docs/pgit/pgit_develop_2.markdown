# PGIT--开发碰见的问题

这是之前在开发pgit时候碰见的问题，先记录下来。顺便找到了份 [gitweb](https://git.kernel.org/pub/scm/git/git.git/tree/gitweb/) 项目，本身是官方的一个简单web管理页，核心是一份8000多行的 `perl` 脚本，看起来有点费劲。不过也只能从这里面参考了。这份脚本以`CGI`形式提供服务。目前碰见的一些困难有：

* git仓库的基本操作
* ssh通道

----------------------

## git仓库的基本操作

普通的初始化空仓库，提交，删除都没有太大问题，只是参照`github`设计功能的时候，碰见了一些困难。一般我们用 `git init --bare` 初始化一个空仓库。但我们的服务不仅仅是新增修改删除。

用到的一些方法：

#### 列出仓库的目录树

```bash
$ git ls-tree
usage: git ls-tree [<options>] <tree-ish> [<path>...]

    -d                    only show trees
    -r                    recurse into subtrees
    -t                    show trees when recursing
    -z                    terminate entries with NUL byte
    -l, --long            include object size
    --name-only           list only filenames
    --name-status         list only filenames
    --full-name           use full path names
    --full-tree           list entire tree; not just current directory (implies --full-name)
    --abbrev[=<n>]        use <n> digits to display SHA-1s

# 使用样例
$ git ls-tree master
100644 blob 0981167c59183318dfa7eecac0874a0fedc70d68    20170428073639.jpg
100644 blob 1830fbc223f7637ae31ab6e5bd886c5ebf7114ce    Hello.markdown
100644 blob 6e97bc307b0e784d056218caf2720637c8c7029f    archive.html
100644 blob e3dca8101c1198d927bc543eec7cb4ea8ae82954    favicon.ico
040000 tree 6e3b3458fc098ed3f7b7fb07f1c57dffe6d396cd    game
100644 blob 751ba7831300bdbed8e2411646e7b808185886e1    index.html
040000 tree 7f50a1e201982273911f856c96f5215552cd8b47    jottings
040000 tree 8989dbc2bb5ce2625bac86bdf8ca83e1a126ce8b    keyboard
040000 tree 9cfb8664fe4abb404f529c19069fe6879ef7464a    note
040000 tree 2e934c3c2be1a67fa0e3f1263a3d41c6a1d1e5d6    pgit
100644 blob 174e3b5ee75ca3b5e04d15f7e225f60ebe76448c    script.js
100644 blob d2ad386c92ca822bc7b6ddf5c04d7289df0865a0    style.css

```
通过 `git ls-tree` 获得仓库下的目录列表，然后再切割成可用的结构，第二列是类型，`tree`可以当作是目录，`blob`则是文件。

#### 获取仓库中某个文件

```bash
$ git cat-file
usage: git cat-file (-t [--allow-unknown-type] | -s [--allow-unknown-type] | -e | -p | <type> | --textconv | --filters) [--path=<path>] <object>
   or: git cat-file (--batch | --batch-check) [--follow-symlinks] [--textconv | --filters]

<type> can be one of: blob, tree, commit, tag
    -t                    show object type
    -s                    show object size
    -e                    exit with zero when there's no error
    -p                    pretty-print object's content
    --textconv            for blob objects, run textconv on object's content
    --filters             for blob objects, run filters on object's content
    --path <blob>         use a specific path for --textconv/--filters
    --allow-unknown-type  allow -s and -t to work with broken/corrupt objects
    --buffer              buffer --batch output
    --batch[=<format>]    show info and content of objects fed from the standard input
    --batch-check[=<format>]
                          show info about objects fed from the standard input
    --follow-symlinks     follow in-tree symlinks (used with --batch or --batch-check)
    --batch-all-objects   show all objects with --batch or --batch-check
    --unordered           do not order --batch-all-objects output

# 使用样例
# 后面的object来自 ls-tree
$ git cat-file blob 6452b9b72ec5b81250236694de681932a4dd4bb0
# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

```

<s>实际使用过程中，我不知道如何直接通过路径来获取，目前只能组合使用 `ls-tree` 和 `cat-file` 。</s>
修正：可以直接使用`cat-file`获取文件内容，同样的上述命令为
```bash
$ git cat-file blob master:.gitignore
# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

```

#### 打包成zip提供下载

```bash
$ git archive
usage: git archive [<options>] <tree-ish> [<path>...]
   or: git archive --list
   or: git archive --remote <repo> [--exec <cmd>] [<options>] <tree-ish> [<path>...]
   or: git archive --remote <repo> [--exec <cmd>] --list

    --format <fmt>        archive format
    --prefix <prefix>     prepend prefix to each pathname in the archive
    -o, --output <file>   write the archive to this file
    --worktree-attributes
                          read .gitattributes in working directory
    -v, --verbose         report archived files on stderr
    -0                    store only
    -1                    compress faster
    -9                    compress better

    -l, --list            list supported archive formats

    --remote <repo>       retrieve the archive from remote repository <repo>
    --exec <command>      path to the remote git-upload-archive command

# 使用样例
git archive --format=zip --prefix=xxx master > xxx.zip

```

实际我是捕获输出到http服务，提供下载

## ssh通道

`go` 的官方库`golang.org/x/crypto/ssh` 有提供 `ssh server` 封装的还算完整，基本不用第三方库可以直接使用。生成密钥对也有官方库，实在很方便

#### 生成密钥对

```go

import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/x509"
    "encoding/pem"
    "io"

    "golang.org/x/crypto/ssh"
)

type SSHServer struct {
    HostKey *rsa.PrivateKey
}

func (s *SSHServer) GenerateKey() (*rsa.PrivateKey, error) {
    reader := rand.Reader
    bitSize := 2048

    key, err := rsa.GenerateKey(reader, bitSize)

    if err != nil {
        return nil, err
    }
    return key, err
}

func (s *SSHServer) SaveKey(path string, key *rsa.PrivateKey, isPrivate bool) error {

    outFile, err := os.Create(path)
    if err != nil {
        return err
    }
    defer outFile.Close()

    skey := &pem.Block{}

    if isPrivate {
        skey.Type = "PRIVATE KEY"
        skey.Bytes = x509.MarshalPKCS1PrivateKey(key)
    } else {
        skey.Type = "PUBLIC KEY"
        skey.Bytes = x509.MarshalPKCS1PublicKey(&key.PublicKey)
    }

    err = pem.Encode(outFile, skey)
    return err
}
```

#### 一个简单的ssh通道

```go
func handleChannels(chans <-chan ssh.NewChannel) {
    for newChan := range chans {
        if newChan.ChannelType() != "session" {
            newChan.Reject(ssh.UnknownChannelType, "unknown channel type")
            continue
        }

        ch, reqs, err := newChan.Accept()
        if err != nil {
            log.Printf("Error accepting channel: %v", err)
            continue
        }

        go func(in <-chan *ssh.Request) {
            defer ch.Close()
            for req := range in {
                log.Printf("SSH: Req.Type: '%#v'", req.Type)

                switch req.Type {
                case "env":
                    log.Printf("SSH: Invalid env arguments: '%#v'", string(req.Payload))
                case "exec":
                    if len(req.Payload) < 5 {
                        log.Printf("SSH: Payload Empty: %v", req.Payload)
                        return
                    }
                    // @todo 执行 git 命令
                    return
                default:
                    return
                }
            }
        }(reqs)
    }
}

func (s *SSHServer) ListenAndServe() error {
    config := &ssh.ServerConfig{
        PublicKeyCallback: func(conn ssh.ConnMetadata, key ssh.PublicKey) (*ssh.Permissions, error) {
            // @todo 进行私钥认证
            return nil, nil
        },
        PasswordCallback: func(conn ssh.ConnMetadata, password []byte) (*ssh.Permissions, error) {
            // @todo 进行密码认证
            return nil, nil
        },
    }
    hostKey, err := ssh.NewSignerFromKey(s.HostKey)
    if err != nil {
        return err
    }
    config.AddHostKey(hostKey)

    listener, err := net.Listen("tcp", ":22")
    if err != nil {
        return err
    }
    for {
        conn, err := listener.Accept()
        if err != nil {
            log.Printf("SSH: Error accepting incoming connection: %v", err)
            continue
        }
        go func() {
            log.Printf("SSH: Handshaking for %s", conn.RemoteAddr())
            sConn, chans, reqs, err := ssh.NewServerConn(conn, config)
            if err != nil {
                if err == io.EOF {
                    log.Printf("SSH: Handshaking was terminated: %v", err)
                } else {
                    log.Printf("SSH: Error on handshaking: %v", err)
                }
                return
            }

            log.Printf("SSH: Connection from %s (%s)", sConn.RemoteAddr(), sConn.ClientVersion())
            // The incoming Request channel must be serviced.
            go ssh.DiscardRequests(reqs)
            go handleChannels(chans)
        }()
    }
}
```

如果使用上 pty 这个库，就可以做一个简单的 `ssh server`了， 不过这不是我们需要的，我们只需要能执行 `git` 命令进行克隆和提交。