# 自制键盘III

最近购置了一台3D打印机，一直在学怎么建模，试用过`blender`, `SketchUp`发现都不太适合，`blender`太过专业，软件要熟悉很久都不能轻松上手。`SketchUp`似乎也不是太好用。直到发现了[`openscad`](http://www.openscad.org/)这个软件，瞬间感觉找到了组织，非常适合程序员，整个软件非常简单，就一个脚本区，一个效果图，一个`console`。脚本也很简单，照着官方的样例很容易就上手了，文档也很全面。  
回归正题，这次是给之前的单键键盘做了个外壳，看起来完全不一样了。先看效果图：  
![onekey](/keyboard/onekey.jpg)  

---------  

同样还是`digispark`，不过换了一个型号，不再采用直插而是microusb接口。经过简单的测量，大致取得对应的参数，抱着先打印一次试试看的想法，做了个简单的壳子，没想到运气真的很好，尺寸没什么差异，一次就完成了。  
模型的`scad`脚本放到本文最下面。  

![onekey1](/keyboard/onekey1.jpg)  
![onekey2](/keyboard/onekey2.jpg)  
  引出来的线上面的小部件是个专门针对`cherry mx`轴热插拔的插脚。

![onekey3](/keyboard/onekey3.jpg)  
![onekey4](/keyboard/onekey4.jpg)  
![onekey5](/keyboard/onekey5.jpg)  

模型的脚本非常简单：

```scad
// digispark keyboard

sw=20;
sh=26;
sz=12;
union() {
    difference() {
        translate([0, 0, 0]) {
            cube([sw, sh, sz]);
        }
        translate([1, 1, 1.8]) {
            cube([sw-2, sh-2, sz]);
        }
        translate([6, -1, 8]) {
            cube([8 , 3, sz]);
        }
        translate([(sw - 14)/2, sh - 14 - 3, -2]) {
            cube([14 , 14, sz]);
        }
        
        translate([sw - 2, 2, -1]) mirror([90, 0, 0])
        {
            linear_extrude(2) text("one key", 3);
        } 
    }
    
    translate([1+1+1.6, 3.6, 0]) {
        cylinder(sz, 1.5, 1.4, $fn=36);
    }
    translate([20-1-1-1.6, 3.6, 0]) {
        cylinder(sz, 1.5, 1.4,$fn=36);
    }
}
echo(version=version());
```

PS: 其实壳子外面是做了一排字，但是打印机看起来并不能很好的打印出来。
