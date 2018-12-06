var MainScene = Scene.extend({

    init : function () {
        this._super();

        var label = new Label("PLAY");
        label.x = Nebula.Director.width/2;
        label.y = Nebula.Director.height/2;
        label.setFontSize(32);
        label.setSpacing(30);

        label.onmouseup = function (e) {
            Nebula.Director.replaceScene(PlayScene);
        };
        Nebula.Director.addMouseListener(label, "up");
        this.addChild(label);
    },
    update : function (dt) {
    }
});