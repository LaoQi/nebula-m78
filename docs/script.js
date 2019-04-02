var requestJSON = function (url, success, failed) {
	var xh = new XMLHttpRequest()
	xh.onreadystatechange = function () {
		if (xh.readyState === XMLHttpRequest.DONE) {
			if (xh.status === 200) {
				success(JSON.parse(xh.responseText))
			} else if (failed) {
				failed(xh)
			}
		}
	}
	xh.open('GET', url)
	xh.send(null)
}
var drawBanner = function(){
	var bgcolor = "#5ca7d4"

	var me = document.createElement('meta')
	me.name = "theme-color"
	me.content = bgcolor
	document.getElementsByTagName('meta')[0].after(me)

	var text = "Nebula-M78"
	var c = document.getElementById("banner")
	c.width = c.offsetWidth
	c.height = c.offsetHeight
	var ctx = c.getContext("2d")
	ctx.fillStyle = bgcolor
	ctx.fillRect(0, 0, c.width, c.height)
	var fsize = c.height
	ctx.font = "Bold " + fsize + "px serif";
	ctx.textAlign = "left";
	ctx.fillStyle = "white";
	ctx.fillText(text, 0, c.height / 3);
	ctx.textAlign = "right";
	ctx.fillText(text, c.width, c.height + c.height / 3);
}

var footerMove = function() {
	var footer = document.getElementById("footer")
	if (document.body.offsetHeight < document.body.scrollHeight) {
		footer.style.position = "absolute"
		footer.style.bottom = "0px"
	} else {
		footer.style.position = ""
		footer.style.bottom = ""
	}
}

var MyIndex = function(index) {
	var container = document.getElementById('threads-container')
	container.innerHTML = ''
	requestJSON('/index.' + index + '.json?' + Math.random(), function (data) {
		var template = document.getElementsByClassName('temp-thread')[0]
		for (var i in data) {
			var li = template.cloneNode(true)
			li.className = "thread"
			var text = li.innerHTML
			li.innerHTML = text.replace(/{{(.*?)}}/g, function (a, b) {
				if (b == 'mtime') {
					return new Date(parseInt(data[i][b]) * 1000).toLocaleString()
				}
				return data[i][b]
			})
			container.appendChild(li)
		}
		var pagination = document.getElementById('pagination')
		if (index > 0) {
			pagination.innerHTML = '<a href="#' + (index - 1) + '">上一页</a><a href="#' + (index + 1) + '">下一页</a>'
		} else {
			pagination.innerHTML = '<a href="#' + (index + 1) + '">下一页</a>'
		}
		document.documentElement.scrollTop = document.body.scrollTop = 0
		footerMove()
	}, function (e) {
		var container = document.getElementById('threads-container')
		container.innerHTML = '<h2>找不到内容，<a href="javascript:window.history.back()">返回上一页</a></h2>'
		var pagination = document.getElementById('pagination')
		pagination.innerHTML = ''
		footerMove()
	})
}

var hashRoute = function () {
	var index = parseInt(location.hash.substring(1))
	if (index > 0) {
		MyIndex(index)
	} else {
		MyIndex(0)
	}
}

var onResize = function() {
	drawBanner()
	footerMove()
}
