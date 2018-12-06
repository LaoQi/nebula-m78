var Doge = Sprite.extend({
	
	/**
	状态码
	0 : run
	1 : up
	2 : drop
	*/
	status : 0,
	jumpcount : 0,

	runAni : null,
	jumpAni : null,
	dropAni : null,

	defaultJumpCount : 1,
	defaultSpeed : 0.08,
	defaultJumpHeight : 100,
	defaultJumpTime : 0.5,

	defaultG : 0,
	defaultV : 0,

	_jumptime : 0,
	_droptime : 0,
	_velocity : 0,

	init : function() {
		this._super("run", Nebula.Ract(0, 0, 82, 62));
		this.flipX = true;
		this.schedule = true;

		this.defaultG = this.defaultJumpHeight*2/(this.defaultJumpTime*this.defaultJumpTime);
		this.defaultV = this.defaultG*this.defaultJumpTime;

		var i;
		//跑动动画
		var runAnilist = [];
        for (i = 0; i < 9; ++i) {
            var r = Nebula.Ract(82*i, 0, 82, 62);
            runAnilist.push({
                texture : "run",
                ract : r
            });
        }
        this.runAni = Nebula.Animate(Nebula.AnimateFrames(runAnilist), this.defaultSpeed);

        //跳跃动画
		var jumpAnilist = [];
		var templist = [1, 2, 3, 4, 4, 4];
        for (i in templist) {
            var r = Nebula.Ract(82*i, 0, 82, 62);
            jumpAnilist.push({
                texture : "run",
                ract : r
            });
        }
        this.jumpAni = Nebula.Animate(Nebula.AnimateFrames(jumpAnilist), this.defaultJumpTime/templist.length, 1);

        //掉落动画
		var dropAnilist = [];
		templist = [5, 6, 7];
        for (i = 5; i < 9; ++i) {
            var r = Nebula.Ract(82*i, 0, 82, 62);
            dropAnilist.push({
                texture : "run",
                ract : r
            });
        }
        this.dropAni = Nebula.Animate(Nebula.AnimateFrames(dropAnilist), 0.1, 1);
	},

	setSpeed : function(s) {
		this.runAni.delay = s;
	},
	resetSpeed : function() {
		this.runAni.delay = this.defaultSpeed;
	},
	actionRun : function() {
		this.status = "run";
		this.jumpcount = this.defaultJumpCount;
		this.setAnimate(this.runAni);
	},
	actionJump : function() {
		this.status = "jump";
		this._jumptime = this.defaultJumpTime;
		this._velocity = this.defaultV;
		this.setAnimate(this.jumpAni);
	},
	actionDrop : function() {
		this.status = "drop";
		this._velocity = 0;
		this.setAnimate(this.dropAni);
	},
	actionStop : function() {
		this.status = "stop";
		this.setAnimate(this.runAni);
	},


	update : function(dt) {
		if (this._jumptime > 0) {
			this._jumptime -= dt;
			var deltaHeight = this._velocity*dt - dt*this.defaultG*dt*0.5;
			this._velocity = this._velocity - this.defaultG*dt;

			this.y -= deltaHeight;
			if (this._jumptime <= 0) {
				this.actionDrop();
			}
		}
		if (this.status == "drop") {
			var deltaHeight = this._velocity*dt + dt*this.defaultG*dt*0.5;
			this._velocity = this._velocity + this.defaultG*dt;
			this.y += deltaHeight;
		}
	}

});