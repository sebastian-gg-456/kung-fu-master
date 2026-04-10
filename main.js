class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load assets here if needed
        this.load.image('background', 'sprites/mapa/background.png'); // Assuming sprite exists
        this.load.spritesheet('player', 'sprites/jugador/caminar.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('enemy', 'sprites/enemigos/enemy.png');
    }

    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width / 2, height / 2 - 50, 'Kung Fu Master', { fontSize: '48px', fill: '#FFF' }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 20, 'Press SPACE to Start', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.createWorld();
        this.scale.on('resize', this.resize, this);
    }

    createWorld() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBackgroundColor(0x87ceeb);

        this.ground = this.add.rectangle(width / 2, height - 50, width, 100, 0x8B4513);
        this.physics.add.existing(this.ground, true);
        this.ground.body.setSize(width, 100);
        this.ground.body.updateFromGameObject();

        this.player = this.physics.add.sprite(100, height - 100, 'player');
        this.player.setDisplaySize(120, 120);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(300);
        this.physics.add.collider(this.player, this.ground);

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
            frameRate: 3,
            repeat: -1
        });
        this.player.anims.play('idle');

        this.enemies = this.physics.add.group();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.enemyCount = 0;
        this.gameTime = 0;

        this.scoreText = null;
        this.livesText = null;

        this.updateUI();

        // Update time every second
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameTime += 1;
                this.updateUI();
            },
            loop: true
        });

        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.cameras.resize(width, height);
        this.physics.world.setBounds(0, 0, width, height);

        if (this.ground) {
            this.ground.setSize(width, 100);
            this.ground.setPosition(width / 2, height - 50);
            this.ground.body.setSize(width, 100);
            this.ground.body.updateFromGameObject();
        }

        if (this.player) {
            const floorY = height - 100;
            if (this.player.y > floorY) {
                this.player.setY(floorY);
            }
        }

        if (this.scoreText) {
            this.scoreText.setPosition(16, 16);
            this.livesText.setPosition(16, 50);
        }
    }

    update() {
        let moving = false;
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-100);
            this.player.setFlipX(false);
            moving = true;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(100);
            this.player.setFlipX(true);
            moving = true;
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }

        if (moving) {
            this.player.anims.play('walk', true);
        } else {
            this.player.anims.play('idle', true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.attack();
        }

        this.enemies.children.entries.forEach(enemy => {
            enemy.setVelocityX(-50);
        });

        this.physics.overlap(this.player, this.enemies, this.playerHit, null, this);
    }

    spawnEnemy() {
        const enemy = this.enemies.create(this.scale.width + 50, this.scale.height - 100, 'enemy');
        if (!this.textures.exists('enemy')) {
            enemy.setDisplaySize(50, 80);
            enemy.setTint(0xFF0000);
        }
        enemy.body.setGravityY(300);
        this.physics.add.collider(enemy, this.ground);
        this.enemyCount += 1;
        this.updateUI();
    }

    attack() {
        this.enemies.children.entries.forEach(enemy => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), enemy.getBounds())) {
                enemy.destroy();
                this.enemyCount -= 1;
                this.score += 10;
                this.updateUI();
            }
        });
    }

    playerHit(player, enemy) {
        enemy.destroy();
        this.enemyCount -= 1;
        this.lives -= 1;
        this.updateUI();
        if (this.lives <= 0) {
            this.scene.start('GameOverScene');
        }
    }

    updateUI() {
        const scoreEl = document.getElementById('score-value');
        const livesEl = document.getElementById('lives-value');
        const levelEl = document.getElementById('level-value');
        const enemiesEl = document.getElementById('enemies-value');
        const timeEl = document.getElementById('time-value');

        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = this.lives;
        if (levelEl) levelEl.textContent = this.level;
        if (enemiesEl) enemiesEl.textContent = this.enemyCount;
        
        // Format time as MM:SS
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        const timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        if (timeEl) timeEl.textContent = timeStr;
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width / 2, height / 2 - 20, 'Game Over', { fontSize: '48px', fill: '#FFF' }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 40, 'Press R to Restart', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);

        this.input.keyboard.once('keydown-R', () => {
            this.scene.start('BootScene');
        });
    }
}

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);