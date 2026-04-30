// Physics-only helpers for GameScene.
(function (global) {
    const KFMPhysics = {
        initPhysicsWorld(worldWidth) {
            const H = this.scale.height;
            this.groundTop = H - 95;
            this.standLineY = this.groundTop;
            this.groundHeight = 300;

            this.physics.world.setBounds(0, 0, worldWidth, H);
            this.cameras.main.setBounds(0, 0, worldWidth, H);

            const groundBodyCenterY = this.groundTop + (this.groundHeight / 2);
            this.groundGroup = this.physics.add.staticGroup();
            const gBody = this.groundGroup.create(worldWidth / 2, groundBodyCenterY, "__WHITE");
            gBody.setAlpha(0);
            gBody.body.setSize(worldWidth, this.groundHeight);
            gBody.refreshBody();
        },

        setupPlayerBody(player) {
            player.body.setGravityY(600);
            player.body.setSize(32, 40);
            player.body.setOffset(16, 8);
            player.setCollideWorldBounds(true);
        },

        setupEnemyBody(enemy, etype) {
            enemy.body.setGravityY(600);
            if (etype === "dwarf") {
                enemy.body.setSize(32, 56);
                enemy.body.setOffset(16, 8);
            } else {
                enemy.body.setSize(32, 56);
                enemy.body.setOffset(16, 8);
            }
        },

        attachWorldColliders(player, enemies) {
            this.physics.add.collider(player, this.groundGroup);
            this.physics.add.collider(enemies, this.groundGroup);
        },

        snapToStandLine(actor, footLocalY) {
            const scaleY = actor.displayHeight / 64;
            actor.y = this.standLineY - (footLocalY * scaleY) + (actor.displayHeight / 2);
            if (actor.body) actor.body.velocity.y = 0;
        },

        clampPlayerBounds(player, minX, maxX) {
            if (player.x < minX) {
                player.x = minX;
                if (player.body.velocity.x < 0) player.setVelocityX(0);
            }
            if (player.x > maxX) {
                player.x = maxX;
                if (player.body.velocity.x > 0) player.setVelocityX(0);
            }
        }
    };

    global.KFMPhysics = KFMPhysics;
})(window);
