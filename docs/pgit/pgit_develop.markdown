# 个人用的git服务器管理软件--PGIT

很久没有写过东西了，最近在写一个个人用的`git`服务器软件，目前开发了一半，准备把开发过程中的心得和问题记录下来。

----------------------

## 起因
先说一下，平时个人在用[github](https://github.com)，工作中有在用 [gogs](https://github.com/gogs/gogs)这个项目，而且市面上也有不少简单部署使用的git服务，像是`gitlab`， `gitea`之类的。之所以还会开这个项目的原因是：  
  
- 都是面向团队的，都提供账号，团队，权限这些服务
- 没必要提issue，合并PR，wiki，fork这些功能

家里有一台nas当作小服务器使用，写一些个人项目的时候并不一定会提交到github，要是能简单提交到自己的服务器上就好了 <S>登录真的很麻烦</S>

## 命名
首先是项目命名，很简单的就叫`pgit`吧，`personal git server`

> There are only two hard things in Computer Science: cache invalidation and naming things –– Phil Karlton

## 目标

初期目标是做一个可以提供`http`服务的git服务器，类似 `http://xxx.xx/xxx.git`这样，然后有个web管理页可以进行方便的增加修改删除。后面再增加一些浏览，对比之类的功能。如果有需要，再加上hook和webhook这些扩展功能。

## 技术选型 

我个人写的相对多一些的是`php`和`python`，工作中也主要用这两门脚本。本来是考虑`python`的，前一阵子有用`go`写过一些小工具，也简单实现过一个小的`ssh server`，感觉非常方便。考虑到`gitea`和`gogs`这两个项目都是用`go`写的，很多功能可以借鉴参考怎么实现。再考虑到之前使用过`gitlab`的惨痛经验（`gitlab`部署了以后小服务器性能太差跑不起来，`gogs`相比响应非常快速，性能很好）
虽然经验不多，这次就直接用`go`试一下好了。

## 查资料

官方提供的协议文档 [https://mirrors.edge.kernel.org/pub/software/scm/git/docs/technical/http-protocol.html](https://mirrors.edge.kernel.org/pub/software/scm/git/docs/technical/http-protocol.html)

之前不了解`git`是怎么支持http协议的，查了下相关资料，发现其实`git`自身软件包就附带了一个`git-http-backend`的CGI程序。不过既然决定拿`go`去写，先不考虑这个，找到了一个老哥写的简单[样例](https://gist.github.com/shanzi/1aa571f8f3b8f4608d60)，很感谢的是他还简单写了一篇博客来解释 [https://www.io-meter.com/2014/07/09/simple-git-http-server/](https://www.io-meter.com/2014/07/09/simple-git-http-server/)

我最终采用的是 [go-chi](https://github.com/go-chi/chi) 这个项目作为接口路由，然后以上面项目为蓝本进行的改动实现了简单的 http接口。不过仅仅支持对仓库的增加，删除，提交还远远没到我们的目标。后面我会一边开发，碰上问题尽量记录下来。

#### 同样结尾附上代码 (简单修改后的一份 git http server)

> 原作者采用的`WTFYWT`协议，这份简单修改后的就继续采用这个协议好了。

```go
/*
Everyone is permitted to copy and distribute verbatim or modified
copies of this license document, and changing it is allowed as long
as the name is changed.
DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
 0. You just DO WHAT THE FUCK YOU WANT TO.
*/
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "io/ioutil"
    "log"
    "net/http"
    "os"
    "os/exec"
    "path/filepath"
    "strings"
    "time"

    "github.com/go-chi/chi"
    "github.com/go-chi/chi/middleware"
)

var GitRoot = ""

type Repository struct {
    Name        string `json:"name"`
    Description string `json:"description"`
}

func (repo Repository) InitBare() error {
    repopath := RepositoryDir(repo.Name)
    gitInitCmd := exec.Command("git", "init", "--bare", repopath)
    _, err := gitInitCmd.CombinedOutput()
    if err != nil {
        return err
    }

    desc := fmt.Sprintf("%s;%s", repo.Name, repo.Description)
    err = ioutil.WriteFile(
        filepath.Join(repopath, "description"), []byte(desc), os.ModePerm)

    return err
}

func (repo Repository) Delete() error {
    repopath := RepositoryDir(repo.Name)
    err := os.RemoveAll(repopath)
    return err
}

func CheckRepository(repoDir string) (*Repository, error) {
    if !IsRepositoryDir(repoDir) {
        return nil, fmt.Errorf("%s Not Repository directory", repoDir)
    }
    raw, err := ioutil.ReadFile(filepath.Join(GitRoot, repoDir, "description"))
    if err != nil {
        return nil, err
    }
    name := strings.TrimSuffix(repoDir, ".git")
    description := strings.TrimPrefix(string(raw), fmt.Sprintf("%s;", name))

    // load metadata
    repo := &Repository{
        Name:        name,
        Description: description,
    }
    return repo, nil
}

func RepositoryDir(name string) string {
    return filepath.Join(GitRoot, fmt.Sprintf("%s.git", name))
}

func IsRepositoryDir(name string) bool {
    if !strings.HasSuffix(name, ".git") {
        return false
    }
    _, err := os.Stat(filepath.Join(GitRoot, name, "description"))
    if os.IsNotExist(err) {
        return false
    }

    return true
}

type RepoHandler struct {
    Credentials  map[string]string
    Repositories map[string]*Repository
}

func NewRepoHandler() *RepoHandler {
    r := &RepoHandler{
        Credentials: map[string]string{
            "test": "123456",
        },
        Repositories: map[string]*Repository{},
    }

    r.Explorer()

    return r
}

func (handler RepoHandler) Explorer() {
    root := GitRoot
    files, err := ioutil.ReadDir(root)
    if err != nil {
        panic(err)
    }
    for _, file := range files {
        if file.IsDir() {
            repo, err := CheckRepository(file.Name())
            if err == nil {
                handler.AddRepository(repo)
            } else {
                log.Print(err.Error())
            }
        }
    }
}

func (handler RepoHandler) AddRepository(repo *Repository) {
    handler.Repositories[repo.Name] = repo
    log.Printf("Add Repository %s", repo.Name)
}

func (handler RepoHandler) StaticFiles(w http.ResponseWriter, r *http.Request) {
    path := strings.TrimPrefix(r.URL.Path, "/repo")
    http.ServeFile(w, r, filepath.Join(GitRoot, path))
}

func (handler RepoHandler) InfoRefs(w http.ResponseWriter, r *http.Request) {
    repoName := chi.URLParam(r, "repoName")
    repopath := filepath.Join(GitRoot, repoName)
    service := r.FormValue("service")
    if len(service) > 0 {
        w.Header().Add("Content-type", fmt.Sprintf("application/x-%s-advertisement", service))
        cmd := exec.Command(
            "git",
            string(service[4:]),
            "--stateless-rpc",
            "--advertise-refs",
            repopath)
        out, err := cmd.CombinedOutput()
        if err != nil {
            w.WriteHeader(http.StatusInternalServerError)
            _, _ = fmt.Fprintln(w, "Internal Server Error")
            _, _ = w.Write(out)
        } else {
            serverAdvert := fmt.Sprintf("# service=%s", service)
            length := len(serverAdvert) + 4
            _, _ = fmt.Fprintf(w, "%04x%s0000", length, serverAdvert)
            _, _ = w.Write(out)
        }
    } else {
        _, _ = fmt.Fprintln(w, "Invalid request")
        w.WriteHeader(http.StatusBadRequest)
    }
}

func (handler RepoHandler) Command(w http.ResponseWriter, r *http.Request) {
    repoName := chi.URLParam(r, "repoName")
    repopath := filepath.Join(GitRoot, repoName)
    command := chi.URLParam(r, "command")
    if len(command) > 0 {

        w.Header().Add("Content-type", fmt.Sprintf("application/x-git-%s-result", command))
        w.WriteHeader(http.StatusOK)

        cmd := exec.Command("git", command, "--stateless-rpc", repopath)

        cmdIn, _ := cmd.StdinPipe()
        cmdOut, _ := cmd.StdoutPipe()
        body := r.Body

        _ = cmd.Start()

        _, _ = io.Copy(cmdIn, body)
        _, _ = io.Copy(w, cmdOut)

        if command == "receive-pack" {
            updateCmd := exec.Command("git", "--git-dir", repopath, "update-server-info")
            _ = updateCmd.Start()
        }
    } else {
        w.WriteHeader(http.StatusBadRequest)
        _, _ = fmt.Fprintln(w, "Invalid Request")
    }
}

func (handler RepoHandler) Create(w http.ResponseWriter, r *http.Request) {
    repoName := chi.URLParam(r, "repoName")
    description := r.FormValue("description")
    if _, exist := handler.Repositories[repoName]; exist {
        w.WriteHeader(http.StatusBadRequest)
        _, _ = fmt.Fprintf(w, "%s existed!", repoName)
    }
    repo := &Repository{
        Name:        repoName,
        Description: description,
    }
    err := repo.InitBare()
    if err == nil {
        handler.AddRepository(repo)
        w.WriteHeader(http.StatusOK)
    } else {
        w.WriteHeader(http.StatusInternalServerError)
        _, _ = fmt.Fprintf(w, err.Error())
    }
}

func (handler RepoHandler) Delete(w http.ResponseWriter, r *http.Request) {
    confirm := r.FormValue("confirm")
    repoName := chi.URLParam(r, "repoName")
    repo, exist := handler.Repositories[repoName]
    if !exist {
        w.WriteHeader(http.StatusBadRequest)
        _, _ = fmt.Fprintf(w, "%s not existed!", repoName)
        return
    }

    if confirm != repoName {
        w.WriteHeader(http.StatusBadRequest)
        _, _ = fmt.Fprintf(w, "%s not confirm!", repoName)
        return
    }

    err := repo.Delete()
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        _, _ = fmt.Fprintf(w, err.Error())
        return
    }
    delete(handler.Repositories, repoName)
    w.WriteHeader(http.StatusOK)
}

func (handler RepoHandler) View(w http.ResponseWriter, r *http.Request) {

    repositories := make([]*Repository, 0)
    for _, repo := range handler.Repositories {
        repositories = append(repositories, repo)
    }

    output, err := json.Marshal(repositories)
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        _, _ = w.Write([]byte(err.Error()))
        return
    }
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    _, _ = w.Write(output)
}

func main() {
    GitRoot, _ = os.Getwd()

    r := chi.NewRouter()

    r.Use(middleware.Logger)
    r.Use(middleware.Timeout(60 * time.Second))

    handler := NewRepoHandler()
    r.Get("/", handler.View)
    r.Post("/{repoName}", handler.Create)
    r.Delete("/{repoName}", handler.Delete)

    r.Get("/{repoName}.git/info/refs", handler.InfoRefs)
    r.Post("/{repoName}.git/git-{command}", handler.Command)
    r.HandleFunc("/{repoName}.git/*", handler.StaticFiles)

    http.ListenAndServe(":3000", r)
}

```
