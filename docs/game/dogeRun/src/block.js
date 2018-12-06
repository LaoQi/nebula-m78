var Block = Sprite.extend({
	
	type : 0,

	init : function (type) {
		this._super("block1");
		this.type = type;
	}

});