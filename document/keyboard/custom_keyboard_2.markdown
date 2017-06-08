# 自制键盘II - 试水

接上回的想法，先把比较好处理的都买了下来，比如：机械轴，几个芯片核心板这些。正好看到一个比较有意思的东西[Digispark](http://digistump.com/products/1)  
国外人民都生活在水深火热之中，他们买一个差不多7$左右，而我们在某宝大概7￥就可以买到一个了。  
![digispark](/keyboard/digispark.jpg)

---------  

这个小东西的官方介绍：

* Support for the IDE 1.0+ (OSX/Win/Linux)
* Power via USB or External Source - 5v or 7-35v (automatic selection)
* On-board 500ma 5V Regulator
* Built-in USB (and serial debugging)
* 6 I/O Pins (2 are used for USB only if your program actively communicates over USB, otherwise you can use all 6 even if you are programming via USB)
* 8k Flash Memory (about 6k after bootloader)
* I2C and SPI (vis USI)
* PWM on 3 pins (more possible with Software PWM)
* ADC on 4 pins
* Power LED and Test/Status LED (on Pin0)  
  
我也是顺手买了一个，正好拿过来先试水，网上也有不少资料。这个可以使用arduino IDE并且还自带了hid keyboard的简单demo，缺点大概就是IO太少了，只有6个，并且不可能全都能用，下面我会说到。先看看我做成的东西  
![](/keyboard/one_key_keyboard.jpg)  
这是一个只有一个按键的键盘，虽然只有一个按键，但确确实实是一个标准的hid键盘。因为IO口太少，6个口中`PB5`是默认的`Reset`，`PB3`和`PB4`作为USB的`D+`和`D-`信号线，`PB0`我改成了`bootloader`的jumper口（应该不影响使用），`PB1`上控制板子带的一个LED不是很想用，最后仅仅只剩下一个`PB2`是空闲的了。  
  
`Digispark`用的bootloader项目名叫[micronucleus](https://github.com/micronucleus/micronucleus)，本身是等待5秒后切换到用户程序开始执行，但项目中是提供了jumper的功能的，简单修改开启下就好了。我设定的`PB0`下拉时进入刷写模式，这样普通情况下就可以直接作为键盘而不用等待5s。

说说试水过程中碰到的一些问题，我是直接使用arduino IDE做的，早年只用过avr studio并没有用过这个，发现还是很好用的，找到调用的库的源码直接修改，在IDE中就可以很简单的调用了。比方我找到的`DigisparkKeyboard`的源码位于  
```
%USERPROFILE%\AppData\Roaming\Arduino15\packages\digistump\hardware\avr\1.6.7\libraries\DigisparkKeyboard
```  
直接进行修改源码就可以了。像vid/pid之类的就在`usbconfig.h`中，而设备描述符在`DigiKeyboard.h`中。说起这个设备描述符有个很有意思的事情，在网络上看到的文章大多是说仅仅只能做到同时响应六个按键，因为usb1.1协议中有给这么一个样例：  
```
Usage Page (Generic Desktop),
Usage (Keyboard),
Collection (Application),
    Report Size (1),
    Report Count (8),
    Usage Page (Key Codes),
    Usage Minimum (224),
    Usage Maximum (231),
    Logical Minimum (0),
    Logical Maximum (1),
    Input (Data, Variable, Absolute), ;Modifier byte
    Report Count (1),
    Report Size (8),
    Input (Constant), ;Reserved byte 这里有个1字节的保留字
    Report Count (5),
    Report Size (1),
    Usage Page (LEDs),
    Usage Minimum (1),
    Usage Maximum (5),
    Output (Data, Variable, Absolute), ;LED report
    Report Count (1),
    Report Size (3),
    Output (Constant), ;LED report padding
    Report Count (6),
    Report Size (8),
    Logical Minimum (0),
    Logical Maximum(255),
    Usage Page (Key Codes),
    Usage Minimum (0),
    Usage Maximum (255),
    Input (Data, Array),
End Collection
```
其中很多文章都讲到有1字节的保留字，导致后面仅仅只能使用6个字节的自定义键。我一直很奇怪这个保留字是做什么的，仔细翻阅协议也没有发现太多信息，可能是遗漏了哪里，仅仅有一处提到  
```
Byte 1 of this report is a constant. This byte is reserved for OEM use. The
BIOS should ignore this field if it is not used. Returning zeros in unused fields is
recommended.
```  
于是果断使用了这个保留字也作为自定义键，改动为：  
```
    0x05, 0x01,                    // USAGE_PAGE (Generic Desktop)
    0x09, 0x06,                    // USAGE (Keyboard)
    0xa1, 0x01,                    // COLLECTION (Application)
    0x05, 0x07,                    //   USAGE_PAGE (Keyboard)
    0x19, 0xe0,                    //   USAGE_MINIMUM (Keyboard LeftControl)
    0x29, 0xe7,                    //   USAGE_MAXIMUM (Keyboard Right GUI)
    0x15, 0x00,                    //   LOGICAL_MINIMUM (0)
    0x25, 0x01,                    //   LOGICAL_MAXIMUM (1)
    0x75, 0x01,                    //   REPORT_SIZE (1)
    0x95, 0x08,                    //   REPORT_COUNT (8)
    0x81, 0x02,                    //   INPUT (Data,Var,Abs)
    0x95, 0x07,                    //   REPORT_COUNT (7)
    0x75, 0x08,                    //   REPORT_SIZE (8)
    0x15, 0x00,                    //   LOGICAL_MINIMUM (0)
    0x26, 0xff, 0x00,              //   LOGICAL_MAXIMUM (255)
    0x05, 0x07,                    //   USAGE_PAGE (Keyboard)
    0x19, 0x00,                    //   USAGE_MINIMUM (Reserved (no event indicated))
    0x29, 0x65,                    //   USAGE_MAXIMUM (Keyboard Application)
    0x81, 0x00,                    //   INPUT (Data,Ary,Abs)
    0xc0                           // END_COLLECTION
```  
中间省略掉了LED回报的描述，但实测7键在win10下面是没什么问题的。也就是说起码可以简单的就实现7键无冲。(并没有支持boot protocol)