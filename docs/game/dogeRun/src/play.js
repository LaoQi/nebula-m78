var PlayScene = Scene.extend({

    doge : null,
    blocks : null,
    items : null,

    isblockright : false,
    status : 0,

    //级数
    defaultSpeed : 2,
    _speed : 0,

    defaultCenterX : 0,

    init : function () {
        this._super();

        this.blocks = [];
        this.schedule = true;   
        this._speed = this.defaultSpeed * 1;
        this.defaultCenterX = Nebula.Director.width/2;

        Nebula.Director._onkeydown = this.onkeydown;
        Nebula.Director._onkeyeventObj = this;

        var doge = new Doge();
        this.addChild(doge);
        doge.x = Nebula.Director.width/2;
        doge.y = 250;
        doge.zIndex = 3;
        doge.actionRun();
        this.doge = doge;

        var i;
        for (i = 0; i < 5; ++i) {
            var block = new Block(1);
            block.setScale(0.5);
            block.x = i * block.width;
            block.y = 300;
            this.blocks.push(block);
            this.addChild(block);
        }

        var thiz = this;
        Nebula.Delay(3, function(){
            thiz.setSpeed(3);
        });
        Nebula.Delay(6, function(){
            thiz.setSpeed(4);
        });
        Nebula.Delay(9, function(){
            thiz.setSpeed(5);
        });
        Nebula.Delay(15, function(){
            thiz.setSpeed(6);
        });
        Nebula.Delay(18, function(){
            thiz.setSpeed(7);
        });
        Nebula.Delay(22, function(){
            thiz.setSpeed(9);
        });
        Nebula.Delay(25, function(){
            thiz.setSpeed(11);
        });
        Nebula.Delay(30, function(){
            thiz.setSpeed(15);
        });
    },
    jump : function(){
        if (this.doge.jumpcount > 0) {
            this.doge.jumpcount -= 1;
            this.doge.actionJump();
        }
    },
    gameOver : function() {
        console.log("GameOver!");
        this.status = 1;
        this.doge.actionRun();
    },

    onkeydown : function (keycode, thiz) {
        switch (keycode) {
            case 32 :
                thiz.jump();
                break;
            // case 37:
            //     thiz.doge.x -= 5;
            //     break;
            // case 38:
            //     thiz.doge.y -= 5;
            //     break;
            // case 39:
            //     thiz.doge.x += 5;
            //     break;
            // case 40:
            //     thiz.doge.y += 5;
            //     break;
            default :
                break;
        }
    },
    checkBlock : function() {
        var isblockdown = false;
        var isblockright = false;
        var bbox;
        var dbox = this.doge.getBindingBox();

        if (dbox.maxX < 10) {
            this.gameOver();
            return ;
        }

        dbox.maxY -= 10;
        dbox.minX += 20;
        var i;
        var blocknum = "";

        //碰撞误差
        var delta = this._speed*0.5 + 8;
        for (i in this.blocks) {
            bbox = this.blocks[i].getBindingBox();
            //排除
            if (dbox.minX > bbox.maxX || dbox.minY > bbox.maxY) {
                continue;
            }

            //判断下落碰撞
            if (dbox.maxY >= bbox.minY) {
                if ((dbox.maxX > (bbox.minX + delta) && dbox.maxX < bbox.maxX) 
                    || (dbox.minX > bbox.minX && dbox.minX < bbox.maxX) 
                    || (dbox.minX < bbox.minX && dbox.maxX > bbox.maxX)) {
                    isblockdown = true;
                    blocknum += i;
                }
            }
            //右侧碰撞
            if (dbox.maxX >= bbox.minX) {
                if ((dbox.maxY > (bbox.minY + delta) && dbox.maxY < bbox.maxY) 
                    || (dbox.minY > bbox.minY && dbox.minY < bbox.maxY)
                    || (dbox.minY < bbox.minY && dbox.maxY > bbox.maxY)) {
                    isblockright = true;
                }
            }
        }

        this.isblockright = isblockright;

        if (!isblockdown && this.doge.status == "run" && this.doge.y < 460) {
            this.doge.actionDrop();
        }
        if (isblockdown && this.doge.status == "drop") {
            this.doge.actionRun();
        }
        if (this.doge.y > 460 && this.doge.status == "drop") {
            this.gameOver();
        }
    },
    setSpeed : function(s) {
        this.doge.setSpeed(0.16/s);
        this._speed = s * 1;
    },

    blockMove : function(dt) {
        var i;
        var del;
        for (i in this.blocks) {
            var b = this.blocks[i];
            b.x -= this._speed;
            var bbox = b.getBindingBox();
            if (bbox.maxX < 0) {
                del = i;
                b.x = 680;
            }
        }
        if (this.isblockright) {
            this.doge.x -= this._speed;
        } else if (this.doge.x < this.defaultCenterX) {
            this.doge.x += 1;
        }
    },
    update : function (dt) {
        if (this.status === 0) {
            this.blockMove(dt);
            this.checkBlock();
        }        
    }
});
