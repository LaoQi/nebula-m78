# 简单的QRCODE服务（试用golang）

最近有在试用 `golang` 这门语言，因为面世也算蛮长时间了不怎么算新型语言，语言层面没什么好评价的。简单说下我最近的使用感受。

因为经常有开发方便内部使用的工具，以前的方案是使用 `python` ，开发简单高效，跨平台也不是大问题，类库齐全，图形库既可以使用简单的TK，也可以用一些复杂的方案，基本常见业务都会提供相应的sdk。但最大的痛点在于分发，给普通的开发人员还好，一般会有相应的环境，只是要注意版本兼容性就好了。不过工具开发出来还要提供给非技术人员使用就很麻烦了。之前曾经用过像 `py2exe` , `cx_freeze` 等项目，甚至自己编译一个启动器，无论怎么样都很麻烦，甚至不同版本的windows之间还有差异，而且提供出来的包体积还不小。

---------

这点上 golang 可以说完全击中痛点，编译完成后只有一个可执行文件轻松分发，跨平台也不是什么问题。不过比较不好的一点是图形库的解决方案比之 python 就显得窘迫多了，最近一直在使用的一个是[andlabs/ui](https://github.com/andlabs/ui)这个项目，能提供的相当有限，简单的工具还可以用用。目前依赖这个做了我们线下的一个对象存储上传工具。

缺点上来说就是开发的爽快感和速度不如 python ，当然这个和个人喜好与熟悉程度有关。不过像 golang 所擅长的网络服务和基础设施我反而没有太大的需求。

最近有需要一个简单的二维码生成接口，虽然放到客户端做比较好，github上面也有相当多的JS库，不过引用毕竟麻烦，简单做个接口也很快速，就顺手写了，前后不超过100行。因为 golang 写的还是比较少，代码也会比较粗糙，不过项目很简单，也懒得开个仓库维护什么的。本站二维码

![https://nebula-m78.org/qrcode?r=https://nebula-m78.org](https://nebula-m78.org/qrcode?r=https://nebula-m78.org)

话不多说直接上代码。

```go
package main

import (
    "encoding/base64"
    "fmt"
    "log"
    "net/http"
    "os"
    "strconv"

    "github.com/akamensky/argparse"
    "github.com/skip2/go-qrcode"
)

type Config struct {
    Port *int
}

func handle(w http.ResponseWriter, req *http.Request) {
    log.Printf("%s %s %s %s", req.RemoteAddr, req.Method, req.URL, req.Proto)
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Content-Type", "text/html")

    var err error
    var data string
    level := qrcode.Highest
    size := 256

    h := req.FormValue("h") // base64 encode
    r := req.FormValue("r") // raw data
    l := req.FormValue("l") // level
    s := req.FormValue("s") // size

    if h != "" {
        decodeBytes, err := base64.StdEncoding.DecodeString(h)
        if err != nil {
            w.WriteHeader(http.StatusBadRequest)
            fmt.Fprintf(w, "bad data")
            return
        }
        data = string(decodeBytes[:])
    } else if r != "" {
        data = r
    }

    if s != "" {
        size, err = strconv.Atoi(s)
        if err != nil {
            log.Print(err)
            w.WriteHeader(http.StatusBadRequest)
            fmt.Fprintf(w, "bad request")
            return
        }
    }

    switch l {
    case "low":
        level = qrcode.Low
    case "medium":
        level = qrcode.Medium
    case "high":
        level = qrcode.High
    case "highest":
        level = qrcode.Highest
    default:
        l = "medium"
        level = qrcode.Highest
    }

    png, err := qrcode.Encode(data, level, size)

    if err == nil {
        w.Header().Set("Content-Type", "image/png")
        log.Printf("encode [level: %s] [size: %d] [%s]", l, size, data)
        w.Write(png)
    } else {
        log.Print(err)
        w.WriteHeader(http.StatusBadRequest)
        fmt.Fprintf(w, "bad request")
    }
}

func main() {
    parser := argparse.NewParser("QrcodeGen", "Qrcode service")

    config := Config{}
    config.Port = parser.Int("p", "port", &argparse.Options{Default: 8301, Help: "set port"})
    err := parser.Parse(os.Args)
    if err != nil {
        fmt.Print(parser.Usage(err))
        os.Exit(2)
    }

    http.HandleFunc("/", handle)

    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *config.Port), nil))
    os.Exit(0)
}

```

支持四个参数

`r`输入原始数据，`h`为`base64`编码数据，`l`编码等级（分为`low`、`medium`、`high`、`highest`四级，默认为`medium`），`s`为尺寸（默认为`256` ）