# 扑克游戏规则描述设想  

今天在聊天的时候说起了代码的抽象问题，一个群友提到了扑克游戏，我想起我两年前做过一个`klondike`小游戏，就是windows上经典的纸牌。当时我就准备拿纸牌来举例代码的抽象问题，但话到嘴边却一时语塞，不知道怎么说起。只能草草的回答“实现一套描述扑克规则的语言，然后写个解释器”。现在仔细思考一下，如何抽象一个扑克游戏的规则。

说起来和扑克游戏还是很有缘，当年学校里课程设计课题也就是简单的写了一个21点小游戏。后来沉迷windows上的纸牌，进入游戏行业后自己做的第一个自己能玩的游戏也就是这个纸牌了，那时候还是用的`cocos2dx-js`做的。  

---------


假如光从简单的纸牌游戏，比如`klondike`和`spider`这些都是单机的，没有多人交互的过程。这里面的元素分析起来就比较简单。先考虑要抽出来的

元素：  

* 纸牌（花色，点数，正反面）
* 牌堆（可分割性，可叠加上下限）展示规则

规则：

* 牌堆出入规则
* 胜利规则
* 失败规则

动作：

* 派牌
* 洗牌
* 翻牌
* 分割牌堆
* 初始化

其中洗牌，翻盘应该是预设好的。

如果把纸牌的游戏写成某一类DSL可能是这个样子的：

```yaml
// 定义元素
define:
	card: [ 1副扑克... ]
	stack:
		- origin (single) //起始牌区
		- deal (horizontal)	//发牌区
		- 1~7 (vertical)	//1-7普通牌堆
		- 8~11 (single)	//目标牌堆
		- temp (vertical)	//临时牌堆
rule:
	//1-7牌堆规则	
	1-7:		
		input:
			// 为空时要求进入牌堆底层为K(13)，不为空时要求颜色不一致，并且点数小一点。
			(empty and other.bottom.pip = 13) 
			or 
			(
				self.top.suit.color != other.bottom.suit.color
				and
				self.top.pip = other.bottom.pip + 1
			)
			
	//8-11目标牌堆规则
	8~11：	
		input:
			// 每次仅允许1张牌进入，为空仅允许1(A)进入，不为空要求花色一致并点数加一
			other.length = 1
			and
			(
				(empty and other.bottom.pip = 1)
				or
				(
                    self.top.suit = other.bottom.suit
                    and
                    self.top.pip = other.bottom.pip + 1
				)
			)
			
	//temp临时牌堆规则
	temp:
		input:
			// 仅为空时可以进入，要求进入的卡片均为正面，并相邻花色不一致，点数相差1
			// 如果来自发牌区，仅允许一张移动
			empty
			and
			(
                (every: 
                    self.status = front
                    self.suit.color != next.suit.color 
                    and 
                    self.pip = next.pip + 1
                )
                or
                (
                	other = deal
                	and
                	other.length = 1
                )
			)
	// 获胜条件是8-11填充满
	success:
		8-11: (every: self.length = 13)
action:
	
	// 开始动作
	start:
		- origin -> shuffle	//洗牌，
		- origin -> 1~7  //各放置1张
		- origin -> 2~7 //各放置1张
		- origin -> 3~7 //各放置1张
		...
		- turn 1-7 // 各顶层牌堆翻转第一张
		
	// 分割牌堆，将当前指向的牌以下的所有牌放入temp牌堆
	split:
    	- sub -> temp
    	
    // 移动到目标, 翻转原牌堆
    moveto:
    	- split source
    	- temp -> target
		- if (source.top.status = reverse) turn source.top
	
	deal_act:
		- origin -> deal
		- turn deal
	
		
```



规则描述并不完整，但大致的构想是这个样子。这样先描述一个游戏应该怎么去玩，然后再进行相应细节的实现，实现的时候仅仅是做一个规则的解释器。