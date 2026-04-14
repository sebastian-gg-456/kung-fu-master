class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load assets here if needed
        // this.load.image('background', 'sprites/mapa/background.png'); // Assuming sprite exists
        this.load.spritesheet('player', 'sprites/jugador/caminar.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('jump', 'sprites/jugador/salto.png');
        this.load.spritesheet('punch', 'sprites/jugador/golpe.png', { frameWidth: 64, frameHeight: 64 });
        // this.load.image('enemy', 'sprites/enemigos/enemy.png');
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
        this.add.text(400, 200, 'Kung Fu Master', { fontSize: '48px', fill: '#FFF' }).setOrigin(0.5);
        this.add.text(400, 300, 'Press SPACE to Start', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);

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
        // Create game world
        this.physics.world.setBounds(0, 0, 800, 600);

        // Background
        this.add.rectangle(400, 300, 800, 600, 0x87CEEB); // Sky blue
        // If background image exists: this.add.image(400, 300, 'background');

        // Ground
        this.ground = this.add.rectangle(400, 500, 800, 100, 0x8B4513);
        this.physics.add.existing(this.ground, true); // Static physics body
        this.ground.body.setSize(800, 100);
        this.ground.body.setOffset(-400, -50); // Center the physics body correctly

        // Player
        this.player = this.physics.add.sprite(100, 418, 'player'); // Positioned above ground
        this.player.setDisplaySize(64, 64);
        this.player.body.setSize(64, 64);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(300);
        this.player.setBounce(0.2);
        this.physics.add.collider(this.player, this.ground);
        this.isJumping = false;

        // Player animations
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
            frameRate: 3, // Slower animation: ~300ms per frame
            repeat: -1
        });
        this.anims.create({
            key: 'jump',
            frames: [{ key: 'jump', frame: 0 }],
            frameRate: 1,
            repeat: 0
        });
        this.anims.create({
            key: 'punch1',
            frames: this.anims.generateFrameNumbers('punch', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: 0
        });
        this.anims.create({
            key: 'punch2',
            frames: this.anims.generateFrameNumbers('punch', { start: 2, end: 2 }),
            frameRate: 10,
            repeat: 0
        });
        this.anims.create({
            key: 'punchCombo',
            frames: this.anims.generateFrameNumbers('punch', { start: 1, end: 2 }),
            frameRate: 10,
            repeat: -1
        });
        this.player.anims.play('idle');

        // Player animations (if spritesheet)
        // this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });

        // Enemies group
        this.enemies = this.physics.add.group();

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.punchKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.punchKey2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        // Attack state
        this.isAttacking = false;
        this.comboCount = 0;
        this.lastAttackTime = 0;
        this.comboTimeout = 500; // ms

        // Score
        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

        // Lives
        this.lives = 3;
        this.livesText = this.add.text(16, 50, 'Lives: 3', { fontSize: '32px', fill: '#000' });

        // Spawn enemies
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        // Player movement
        let moving = false;
        if (this.cursors.left.isDown || this.aKey.isDown) {
            this.player.setVelocityX(-100); // Slower speed
            this.player.setFlipX(false); // No flip for left (assuming sprite faces left by default)
            moving = true;
        } else if (this.cursors.right.isDown || this.dKey.isDown) {
            this.player.setVelocityX(100); // Slower speed
            this.player.setFlipX(true); // Flip for right
            moving = true;
        } else {
            this.player.setVelocityX(0);
        }

        // Attack
        const attackPressed = Phaser.Input.Keyboard.JustDown(this.punchKey) || Phaser.Input.Keyboard.JustDown(this.punchKey2);
        const currentTime = this.time.now;
        
        if (attackPressed) {
            if (!this.isAttacking && (currentTime - this.lastAttackTime > this.comboTimeout)) {
                // First punch
                this.isAttacking = true;
                this.comboCount = 1;
                this.player.anims.play('punch1');
                this.lastAttackTime = currentTime;
            } else if (this.isAttacking && this.comboCount === 1) {
                // Second punch (combo)
                this.comboCount = 2;
                this.player.anims.play('punch2');
                this.lastAttackTime = currentTime;
            } else if (this.isAttacking && this.comboCount === 2) {
                // Continue combo alternating
                this.player.anims.play('punchCombo');
                this.lastAttackTime = currentTime;
            }
        }

        // Reset attack after timeout
        if (this.isAttacking && (currentTime - this.lastAttackTime > this.comboTimeout)) {
            this.isAttacking = false;
            this.comboCount = 0;
        }

        // Jump
        const touchingGround = this.player.body.touching.down || this.player.body.blocked.down;
        if (touchingGround) {
            this.isJumping = false;
        }
        
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.wKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up);
        if (jumpPressed && !this.isJumping && touchingGround) {
            this.player.setVelocityY(-400);
            this.isJumping = true;
        }

        // Animations
        if (!touchingGround) {
            this.player.anims.play('jump', true);
        } else if (!this.isAttacking) {
            if (moving) {
                this.player.anims.play('walk', true);
            } else {
                this.player.anims.play('idle', true);
            }
        }

        // Attack (right-click or custom attack key if needed)
        // Attacks are triggered by overlap with enemies

        // Move enemies
        this.enemies.children.entries.forEach(enemy => {
            enemy.setVelocityX(-50);
        });

        // Check collisions
        this.physics.overlap(this.player, this.enemies, this.playerHit, null, this);
    }

    spawnEnemy() {
        const enemy = this.physics.add.sprite(800, 418, null);
        enemy.setDisplaySize(50, 80);
        enemy.setTint(0xFF0000); // Red placeholder
        this.enemies.add(enemy);
        enemy.body.setGravityY(300);
        this.physics.add.collider(enemy, this.ground);
    }

    attack() {
        // Simple attack: destroy overlapping enemies
        this.enemies.children.entries.forEach(enemy => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), enemy.getBounds())) {
                enemy.destroy();
                this.score += 10;
                this.scoreText.setText('Score: ' + this.score);
            }
        });
    }

    playerHit(player, enemy) {
        enemy.destroy();
        this.lives -= 1;
        this.livesText.setText('Lives: ' + this.lives);
        if (this.lives <= 0) {
            this.scene.start('GameOverScene');
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        this.add.text(400, 300, 'Game Over', { fontSize: '48px', fill: '#FFF' }).setOrigin(0.5);
        this.add.text(400, 350, 'Press R to Restart', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);

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