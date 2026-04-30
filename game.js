// Scenes, UI, gameplay, and animations.
const PIXEL_FONT = '"Press Start 2P", "VT323", monospace';

class BootScene extends Phaser.Scene {
    constructor() { super({ key: "BootScene" }); }

    preload() {
        this.load.spritesheet("player_walk", "sprites/jugador/caminar.png", { frameWidth: 64, frameHeight: 64 });
        this.load.image("player_jump", "sprites/jugador/salto.png");
        this.load.spritesheet("player_punch", "sprites/jugador/golpe.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("player_kick", "sprites/jugador/patada.png", { frameWidth: 64, frameHeight: 64 });
        this.load.image("player_crouch", "sprites/jugador/agachado.png");
        this.load.spritesheet("player_crouch_punch", "sprites/jugador/golpe-agachado.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("player_crouch_kick", "sprites/jugador/patada-agachado.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("player_jump_kick", "sprites/jugador/patada-hacia-arriba.png", { frameWidth: 64, frameHeight: 64 });

        this.load.spritesheet("enemy_walk", "sprites/enemigos/basico/caminar.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("enemy_punch", "sprites/enemigos/basico/golpe.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("enemy_death", "sprites/enemigos/basico/muerte.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("enemy_shooter", "sprites/enemigos/dispara/sprite.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("enemy_dwarf", "sprites/enemigos/enano/enano.png", { frameWidth: 64, frameHeight: 64 });

        this.load.image("bg_fondo1", "sprites/mapa/fondo1.png");
    }

    create() { this.scene.start("MenuScene"); }
}

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: "MenuScene" }); }

    create() {
        const W = this.scale.width, H = this.scale.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000);

        this.add.text(W / 2, H * 0.28, "KUNG FU", {
            fontSize: "72px", fill: "#ffdd00", fontFamily: PIXEL_FONT,
            stroke: "#cc6600", strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.28 + 82, "MASTER", {
            fontSize: "72px", fill: "#ff4400", fontFamily: PIXEL_FONT,
            stroke: "#880000", strokeThickness: 6
        }).setOrigin(0.5);

        const prompt = this.add.text(W / 2, H * 0.72, "PULSA CUALQUIER BOTON PARA EMPEZAR", {
            fontSize: "22px", fill: "#ffffff", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        this.tweens.add({ targets: prompt, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

        this.add.text(W / 2, H * 0.88, "2026  KUNG FU MASTER", {
            fontSize: "16px", fill: "#555555", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        this.input.keyboard.once("keydown", () => this.scene.start("StoryScene"));
        this.input.once("pointerdown", () => this.scene.start("StoryScene"));
    }
}

class StoryScene extends Phaser.Scene {
    constructor() { super({ key: "StoryScene" }); }

    create() {
        const W = this.scale.width, H = this.scale.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a00);

        const paper = this.add.rectangle(W / 2, H / 2, W * 0.88, H * 0.84, 0xf5e6c0);
        paper.setStrokeStyle(4, 0x8b5e1a);

        this.add.text(W / 2, H * 0.20, "~ MENSAJE ~", {
            fontSize: "20px",
            fill: "#8b0000",
            fontFamily: PIXEL_FONT,
            fontStyle: "bold",
            align: "center"
        }).setOrigin(0.5);

        const bodyLines = [
            "Ranma Saotome,",
            "",
            "Tenemos a Akane Tendou.",
            "",
            "Si quieres volver a verla,",
            "ven a buscarnos.",
            "",
            "Ella te estara esperando...",
            "si es que llegas.",
            "",
            "                 - Ryoga Hibiki"
        ].join("\n");

        this.add.text(W / 2, H * 0.34, bodyLines, {
            fontSize: "14px",
            fill: "#2a1000",
            fontFamily: PIXEL_FONT,
            wordWrap: { width: W * 0.76, useAdvancedWrap: true },
            align: "left",
            lineSpacing: 8
        }).setOrigin(0.5, 0);

        const hint = this.add.text(W / 2, H * 0.93, "Pulsa cualquier boton para continuar", {
            fontSize: "14px", fill: "#555555", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);
        this.tweens.add({ targets: hint, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

        this.input.keyboard.once("keydown", () => this.scene.start("GameScene", { level: 1, score: 0, lives: 3 }));
        this.input.once("pointerdown", () => this.scene.start("GameScene", { level: 1, score: 0, lives: 3 }));
    }
}

class GameScene extends Phaser.Scene {
    constructor() { super({ key: "GameScene" }); }

    init(data) {
        this.currentLevel = data.level || 1;
        this.score = data.score || 0;
        this.lives = data.lives !== undefined ? data.lives : 3;
    }

    create() {
        const W = this.scale.width, H = this.scale.height;
        const WORLD_W = 3200;

        this.initPhysicsWorld(WORLD_W);

        const mapBg = this.add.tileSprite(WORLD_W / 2, H / 2, WORLD_W, H, "bg_fondo1");
        const fitScale = H / 211;
        mapBg.tileScaleX = fitScale;
        mapBg.tileScaleY = fitScale;

        this.stairX = 155;
        this.stairDone = false;

        this.player = this.physics.add.sprite(0, 200, "player_walk");
        this.player.setDisplaySize(150, 150);
        const playerStartX = WORLD_W - (this.player.displayWidth / 2);
        this.player.x = playerStartX;
        this.setupPlayerBody(this.player);
        this.player.setDepth(10);
        this.player.setFlipX(false);
        this.playerMaxX = playerStartX;
        this.playerMinX = this.stairX;
        this.bossHalfMapTriggerX = WORLD_W * 0.5;

        this.safeAnim("p_idle", { frames: this.anims.generateFrameNumbers("player_walk", { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
        this.safeAnim("p_walk", { frames: this.anims.generateFrameNumbers("player_walk", { start: 1, end: 2 }), frameRate: 6, repeat: -1 });
        this.safeAnim("p_punch", { frames: this.anims.generateFrameNumbers("player_punch", { start: 0, end: 2 }), frameRate: 12, repeat: 0 });
        this.safeAnim("p_kick", { frames: this.anims.generateFrameNumbers("player_kick", { start: 1, end: 2 }), frameRate: 10, repeat: 0 });
        this.safeAnim("p_crouch_kick", {
            frames: [{ key: "player_crouch_kick", frame: 0 }, { key: "player_crouch_kick", frame: 1 }, { key: "player_crouch_kick", frame: 0 }],
            frameRate: 14,
            repeat: 0
        });
        this.safeAnim("e_walk", { frames: this.anims.generateFrameNumbers("enemy_walk", { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
        this.safeAnim("e_punch", { frames: this.anims.generateFrameNumbers("enemy_punch", { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
        this.safeAnim("e_die", { frames: this.anims.generateFrameNumbers("enemy_death", { start: 0, end: 1 }), frameRate: 8, repeat: 0 });
        this.safeAnim("s_walk", {
            frames: [{ key: "enemy_shooter", frame: 1 }, { key: "enemy_shooter", frame: 0 }],
            frameRate: 6,
            repeat: -1
        });
        this.safeAnim("s_shoot_up", { frames: this.anims.generateFrameNumbers("enemy_shooter", { start: 2, end: 3 }), frameRate: 8, repeat: 0 });
        this.safeAnim("s_shoot_low", { frames: this.anims.generateFrameNumbers("enemy_shooter", { start: 4, end: 5 }), frameRate: 8, repeat: 0 });
        this.safeAnim("d_walk", { frames: this.anims.generateFrameNumbers("enemy_dwarf", { start: 0, end: 1 }), frameRate: 7, repeat: -1 });
        this.safeAnim("d_leap", { frames: this.anims.generateFrameNumbers("enemy_dwarf", { start: 2, end: 5 }), frameRate: 18, repeat: -1 });

        this.enemies = this.physics.add.group();
        this.attachWorldColliders(this.player, this.enemies);

        this.level2HazardTimer = null;
        if (this.currentLevel === 2) {
            this.ensureLevel2HazardTextures();
            this.startLevel2Hazards();
        }

        this.stairZone = this.add.zone(this.stairX, this.groundTop - 100, 120, 260);
        this.physics.world.enable(this.stairZone);
        this.stairZone.body.setAllowGravity(false);
        this.physics.add.overlap(this.player, this.stairZone, this.reachStairs, null, this);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.attackKey2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.kickKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);
        this.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.fourKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
        this.fiveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
        this.adminHazardCycle = 0; // 0=spider, 1=scroll

        this.playerHP = 100;
        this.isJumping = false;
        this.isAttacking = false;
        this.isKicking = false;
        this.isCrouching = false;
        this.isJumpKicking = false;
        this.attackOnCD = false;
        this.isStunned = false;
        this.isClimbing = false;
        this.facingRight = false;
        this.crouchPunchNextFrame = 0;
        this.crouchAttackHoldUntil = 0;
        this.attackLockUntil = 0;
        this.moveLockUntil = 0;
        this.attackSeq = 0;
        this.spawnEnabled = true;
        this.wavesCleared = 0;
        this.wavesBeforeBoss = 3;
        this.level1BossSpawnRequested = this.currentLevel > 1;
        this.level1BossSpawned = this.currentLevel > 1;
        this.level1BossDefeated = this.currentLevel > 1;
        this.waveInProgress = false;
        this.waveTargetCount = 0;
        this.waveSpawnedCount = 0;
        this.waveGroupTimer = null;
        this.nextWaveTimer = null;
        this.adminSpawnTypeIndex = 0;
        this.showHitboxes = false;

        this.physics.world.createDebugGraphic();
        this.physics.world.drawDebug = false;
        if (this.physics.world.debugGraphic) this.physics.world.debugGraphic.setVisible(false);

        this.hpBg = null;
        this.hpBar = null;
        this.scoreText = null;
        this.livesText = null;
        this.levelDurationMs = 120000;
        this.levelStartTime = this.time.now;
        this.timeExpired = false;
        this.redrawHP();
        document.getElementById("score-value").textContent = this.score;
        document.getElementById("lives-value").textContent = this.lives;
        document.getElementById("level-value").textContent = this.currentLevel;
        this.updateBottomHUD(this.levelDurationMs);

        this.startNextWaveCountdown(700);
    }

    ensureLevel2HazardTextures() {
        if (!this.textures.exists("hazard_spider_para")) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xf5f5f5, 1);
            g.fillEllipse(24, 10, 26, 12);
            g.lineStyle(2, 0xaaaaaa, 1);
            g.beginPath();
            g.moveTo(15, 12); g.lineTo(20, 22);
            g.moveTo(33, 12); g.lineTo(28, 22);
            g.strokePath();
            g.fillStyle(0x111111, 1);
            g.fillCircle(24, 28, 8);
            g.fillStyle(0x990000, 1);
            g.fillRect(16, 34, 16, 2);
            g.generateTexture("hazard_spider_para", 48, 48);
            g.destroy();
        }

        if (!this.textures.exists("hazard_scroll")) {
            const gs = this.make.graphics({ x: 0, y: 0, add: false });
            gs.fillStyle(0xe8d5a3, 1);
            gs.fillRoundedRect(4, 0, 40, 64, 5);
            gs.fillStyle(0xc4a45a, 1);
            gs.fillRoundedRect(4, 0, 40, 9, { tl: 5, tr: 5, bl: 0, br: 0 });
            gs.fillRoundedRect(4, 55, 40, 9, { tl: 0, tr: 0, bl: 5, br: 5 });
            gs.lineStyle(2, 0x7a5010, 1);
            gs.strokeRoundedRect(4, 0, 40, 64, 5);
            gs.fillStyle(0x7a5010, 1);
            gs.fillRect(10, 16, 28, 2);
            gs.fillRect(10, 24, 24, 2);
            gs.fillRect(10, 32, 28, 2);
            gs.fillRect(10, 40, 18, 2);
            gs.generateTexture("hazard_scroll", 48, 64);
            gs.destroy();
        }

        if (!this.textures.exists("hazard_dragon")) {
            const gd = this.make.graphics({ x: 0, y: 0, add: false });
            // body
            gd.fillStyle(0x1a9940, 1);
            gd.fillEllipse(30, 36, 34, 26);
            // tail
            gd.fillStyle(0x1a9940, 1);
            gd.fillTriangle(10, 38, 2, 46, 18, 44);
            // head
            gd.fillStyle(0x22bb50, 1);
            gd.fillEllipse(52, 28, 26, 20);
            // snout
            gd.fillStyle(0x33cc66, 1);
            gd.fillEllipse(64, 32, 16, 10);
            // nostril
            gd.fillStyle(0x115530, 1);
            gd.fillCircle(67, 30, 2);
            // eye
            gd.fillStyle(0xffcc00, 1);
            gd.fillCircle(54, 23, 4);
            gd.fillStyle(0x000000, 1);
            gd.fillCircle(55, 23, 2);
            // wing
            gd.fillStyle(0x55dd88, 1);
            gd.fillTriangle(22, 22, 8, 4, 38, 20);
            gd.lineStyle(1, 0x1a9940, 1);
            gd.strokeTriangle(22, 22, 8, 4, 38, 20);
            gd.generateTexture("hazard_dragon", 76, 60);
            gd.destroy();
        }

        if (!this.textures.exists("hazard_fireball")) {
            const gf = this.make.graphics({ x: 0, y: 0, add: false });
            gf.fillStyle(0xff3300, 1);
            gf.fillEllipse(16, 12, 30, 20);
            gf.fillStyle(0xff8800, 1);
            gf.fillEllipse(15, 11, 20, 14);
            gf.fillStyle(0xffee00, 1);
            gf.fillEllipse(13, 10, 12, 9);
            gf.fillStyle(0xffffff, 0.8);
            gf.fillEllipse(11, 9, 6, 5);
            gf.generateTexture("hazard_fireball", 32, 24);
            gf.destroy();
        }
    }

    clearLevel2Hazards() {
        if (this.level2HazardTimer) {
            this.level2HazardTimer.remove();
            this.level2HazardTimer = null;
        }
        if (this.level2ScrollTimer) {
            this.level2ScrollTimer.remove();
            this.level2ScrollTimer = null;
        }
    }

    startLevel2Hazards() {
        this.clearLevel2Hazards();
        // Timers reschedule themselves so delay adapts to current enemy count.
        const scheduleSpider = () => {
            if (this.isClimbing || this.stairDone) return;
            const combat = this.getActiveCombatEnemies().length;
            const delay = combat >= 3 ? Phaser.Math.Between(6000, 8000)
                        : combat >= 1 ? Phaser.Math.Between(4000, 5500)
                        :               Phaser.Math.Between(2500, 3500);
            this.level2HazardTimer = this.time.delayedCall(delay, () => {
                if (!this.isClimbing && !this.stairDone && this.currentLevel === 2) this.spawnParachuteSpider();
                scheduleSpider();
            });
        };
        const scheduleScroll = () => {
            if (this.isClimbing || this.stairDone) return;
            const combat = this.getActiveCombatEnemies().length;
            const delay = combat >= 3 ? Phaser.Math.Between(12000, 16000)
                        : combat >= 1 ? Phaser.Math.Between(8000, 11000)
                        :               Phaser.Math.Between(5000, 7000);
            this.level2ScrollTimer = this.time.delayedCall(delay, () => {
                if (!this.isClimbing && !this.stairDone && this.currentLevel === 2) this.spawnScroll();
                scheduleScroll();
            });
        };
        scheduleSpider();
        scheduleScroll();
    }

    spawnParachuteSpider() {
        const minX = this.stairX + 70;
        const maxX = this.playerMaxX - 70;
        const spawnX = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-260, 260), minX, maxX);
        const spawnY = this.groundTop - Phaser.Math.Between(260, 360);

        const spider = this.physics.add.sprite(spawnX, spawnY, "hazard_spider_para");
        spider.setDisplaySize(74, 74);
        spider.body.setAllowGravity(false);
        spider.body.setSize(26, 30);
        spider.body.setOffset(24, 16);
        spider.setFlipX(Phaser.Math.Between(0, 1) === 0);
        spider.etype = "parachute_spider";
        spider.hp = 1;
        spider.isParachuteFalling = true;
        spider.fallSpeed = Phaser.Math.Between(96, 128);
        spider.runSpeed = Phaser.Math.Between(280, 360);
        spider.runDir = 0;
        spider.landY = this.standLineY - (spider.displayHeight / 2) + 70;

        this.enemies.add(spider);

        this.physics.add.overlap(spider, this.player, () => {
            if (!spider.active || spider.isDying) return;
            spider.destroy();
            this.damagePlayer(spider.isParachuteFalling ? 10 : 16);
        });
    }

    spawnScroll() {
        const minX = this.stairX + 140;
        const maxX = this.playerMaxX - 140;
        const spawnX = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-280, 280), minX, maxX);
        const spawnY = this.groundTop - Phaser.Math.Between(200, 300);

        const scroll = this.physics.add.sprite(spawnX, spawnY, "hazard_scroll");
        scroll.setDisplaySize(40, 56);
        scroll.body.setAllowGravity(false);
        scroll.body.setSize(28, 48);
        scroll.body.setOffset(10, 8);
        scroll.etype = "scroll";
        scroll.hp = 1;
        scroll.fallSpeed = Phaser.Math.Between(96, 128);
        scroll.landY = this.standLineY - (scroll.displayHeight / 2) + 70;

        this.tweens.add({ targets: scroll, angle: { from: -6, to: 6 }, duration: 380, yoyo: true, repeat: -1 });

        this.enemies.add(scroll);
    }

    spawnDragon(x) {
        const dragon = this.physics.add.sprite(x, 0, "hazard_dragon");
        dragon.setDisplaySize(76, 60);
        dragon.body.setAllowGravity(false);
        dragon.body.setSize(50, 44);
        dragon.body.setOffset(14, 10);
        dragon.etype = "dragon";
        dragon.hp = 1;
        dragon.laser = null;
        dragon.y = this.standLineY - 90;

        // Face the player at spawn time
        const fireDir = this.player.x >= x ? 1 : -1;
        dragon.setFlipX(fireDir < 0);

        this.enemies.add(dragon);

        // Short windup then fire laser
        this.time.delayedCall(420, () => {
            if (!dragon.active) return;
            this.spawnLaser(dragon, fireDir);
        });

        // Dragon disappears 700ms after spawning
        this.time.delayedCall(700, () => {
            if (dragon.active) dragon.destroy();
        });
    }

    spawnLaser(dragon, dir) {
        if (!dragon || !dragon.active) return;
        const maxRange = 100;
        const beamH = 20;
        // Beam origin at the dragon's snout; extends outward in dir direction
        const mouthX = dragon.x + (dir * 38);
        const beamY = dragon.y + 4;          // torso height — crouching passes under
        const beamCenterX = mouthX + (dir * maxRange / 2);

        const beam = this.add.rectangle(beamCenterX, beamY, maxRange, beamH, 0xff4400);
        beam.setDepth(8);
        beam.setAlpha(0.92);
        this.physics.add.existing(beam);
        beam.body.setAllowGravity(false);
        beam.body.setImmovable(true);

        dragon.laser = beam;

        // Pulsing glow
        this.tweens.add({
            targets: beam,
            fillColor: { from: 0xff2200, to: 0xffaa00 },
            alpha: { from: 0.92, to: 0.65 },
            duration: 160,
            yoyo: true,
            repeat: -1
        });

        let alreadyHit = false;
        this.physics.add.overlap(beam, this.player, () => {
            if (!beam.active || alreadyHit) return;
            if (this.isCrouching) return; // dodge by crouching
            alreadyHit = true;
            this.damagePlayer(22);
        });

        // Beam lifespan matches remaining dragon lifetime (700 - 420 windup)
        const beamMs = 280;
        this.time.delayedCall(beamMs, () => { if (beam && beam.active) beam.destroy(); });
    }

    safeAnim(key, cfg) {
        if (!this.anims.exists(key)) this.anims.create(Object.assign({ key }, cfg));
    }

    redrawHP() {
        const pct = Math.max(0, this.playerHP) + "%";
        const fill = document.getElementById("hp-fill");
        if (!fill) return;
        fill.style.width = pct;
        fill.style.background = this.playerHP > 50 ? "#00cc00" : this.playerHP > 25 ? "#ffaa00" : "#cc0000";
    }

    formatClock(ms) {
        const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
        return String(totalSeconds);
    }

    updateBottomHUD(timeLeftMs) {
        const timeNode = document.getElementById("time-value");
        if (timeNode) timeNode.textContent = this.formatClock(timeLeftMs);

        const statusNode = document.getElementById("status-value");
        if (statusNode) statusNode.textContent = this.isClimbing ? "SUBIENDO" : "JUGANDO";

        const enemiesNode = document.getElementById("enemies-value");
        if (enemiesNode) enemiesNode.textContent = String(this.getActiveCombatEnemies().length);
    }

    pickSpawnX(sideHint) {
        const minX = this.stairX + 90;
        const maxX = this.playerMaxX - 90;
        const distance = this.scale.width * 0.85 + Phaser.Math.Between(140, 320);
        const preferred = this.player.x + (sideHint * distance);
        let x = Phaser.Math.Clamp(preferred, minX, maxX);

        // If clamped too close to player, flip side to keep spawns meaningful.
        if (Math.abs(x - this.player.x) < 140) {
            const opposite = this.player.x - (sideHint * distance);
            x = Phaser.Math.Clamp(opposite, minX, maxX);
        }
        return x;
    }

    getAliveCombatEnemies() {
        return this.enemies.getChildren().filter(e => e.active && !e.isDying);
    }

    getActiveCombatEnemies() {
        const HAZARD_ETYPES = new Set(["parachute_spider", "scroll", "dragon"]);
        return this.enemies.getChildren().filter(e => e.active && !HAZARD_ETYPES.has(e.etype));
    }

    clearWaveTimers() {
        if (this.waveGroupTimer) {
            this.waveGroupTimer.remove();
            this.waveGroupTimer = null;
        }
        if (this.nextWaveTimer) {
            this.nextWaveTimer.remove();
            this.nextWaveTimer = null;
        }
    }

    startNextWaveCountdown(delayMs = 2000) {
        if (this.isClimbing || this.stairDone || !this.spawnEnabled) return;
        if (this.nextWaveTimer) this.nextWaveTimer.remove();
        this.nextWaveTimer = this.time.delayedCall(delayMs, () => {
            this.nextWaveTimer = null;
            this.beginWave();
        });
    }

    beginWave() {
        if (this.isClimbing || this.stairDone || !this.spawnEnabled || this.waveInProgress) return;

        if (this.currentLevel === 1 && !this.level1BossDefeated) {
            if (!this.level1BossSpawnRequested && this.player.x <= this.bossHalfMapTriggerX) {
                this.level1BossSpawnRequested = true;
            }
            if (!this.level1BossSpawned && this.level1BossSpawnRequested) {
                const bossX = Phaser.Math.Clamp(this.stairX + 110, this.stairX + 70, this.playerMaxX - 90);
                this.spawnBoss(bossX);
                this.level1BossSpawned = true;
                return;
            }
            if ((this.level1BossSpawned && !this.level1BossDefeated) || this.level1BossSpawnRequested) {
                return;
            }
        }

        this.waveInProgress = true;
        // Uneven wave sizes by design (e.g., 7 enemies then 3, etc.).
        this.waveTargetCount = Phaser.Math.Between(3, 8);
        this.waveSpawnedCount = 0;
        this.spawnWaveGroup();
    }

    spawnWaveGroup() {
        if (!this.waveInProgress || this.isClimbing || this.stairDone || !this.spawnEnabled) return;

        const maxAlive = 7;
        const aliveEnemies = this.getAliveCombatEnemies();
        const aliveShooters = aliveEnemies.filter(e => e.etype === "shooter").length;
        const freeSlots = Math.max(0, maxAlive - aliveEnemies.length);
        const remaining = Math.max(0, this.waveTargetCount - this.waveSpawnedCount);
        if (remaining <= 0) return;

        if (freeSlots <= 0) {
            this.waveGroupTimer = this.time.delayedCall(350, () => {
                this.waveGroupTimer = null;
                this.spawnWaveGroup();
            });
            return;
        }

        const startLeft = Phaser.Math.Between(0, 1) === 0;
        const groupSize = Math.min(remaining, freeSlots, Phaser.Math.Between(1, 3));
        let shooterSlots = Math.max(0, 2 - aliveShooters);

        for (let i = 0; i < groupSize; i++) {
            const roll = Phaser.Math.Between(0, 99);
            let type = roll < 55 ? "basic" : (roll < 80 ? "dwarf" : "shooter");
            if (type === "shooter" && shooterSlots <= 0) type = Phaser.Math.Between(0, 1) === 0 ? "basic" : "dwarf";

            const side = (i % 2 === 0)
                ? (startLeft ? -1 : 1)
                : (startLeft ? 1 : -1);
            const spawnX = this.pickSpawnX(side);
            if (type === "basic") this.spawnBasic(spawnX);
            else if (type === "shooter") {
                this.spawnShooter(spawnX);
                shooterSlots--;
            } else {
                this.spawnDwarf(spawnX);
            }
            this.waveSpawnedCount++;
        }

        if (this.waveSpawnedCount < this.waveTargetCount) {
            this.waveGroupTimer = this.time.delayedCall(Phaser.Math.Between(320, 680), () => {
                this.waveGroupTimer = null;
                this.spawnWaveGroup();
            });
        }
    }

    toggleHitboxes() {
        this.showHitboxes = !this.showHitboxes;
        this.physics.world.drawDebug = this.showHitboxes;
        if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.setVisible(this.showHitboxes);
            if (!this.showHitboxes) this.physics.world.debugGraphic.clear();
        }
    }

    toggleEnemySpawning() {
        this.spawnEnabled = !this.spawnEnabled;
    }

    spawnAdminEnemyCycle() {
        const cycle = ["basic", "shooter", "dwarf"];
        let type = cycle[this.adminSpawnTypeIndex % cycle.length];
        this.adminSpawnTypeIndex++;
        if (type === "shooter") {
            const aliveShooters = this.enemies.getChildren().filter(e => e.active && !e.isDying && e.etype === "shooter").length;
            if (aliveShooters >= 2) type = "basic";
        }
        const side = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
        const spawnX = this.pickSpawnX(side);
        if (type === "basic") this.spawnBasic(spawnX);
        else if (type === "shooter") this.spawnShooter(spawnX);
        else this.spawnDwarf(spawnX);
    }

    spawnBasic(x) {
        const e = this.physics.add.sprite(x, 200, "enemy_walk");
        e.setDisplaySize(150, 150);
        this.setupEnemyBody(e, "basic");
        e.setFlipX(true);
        e.etype = "basic";
        e.hp = 3;
        e.atkCD = 0;
        e.anims.play("e_walk", true);
        this.enemies.add(e);
        this.physics.add.collider(e, this.groundGroup);
        this.snapToStandLine(e, 48);
    }

    spawnShooter(x) {
        const e = this.physics.add.sprite(x, 200, "enemy_shooter");
        e.setDisplaySize(150, 150);
        this.setupEnemyBody(e, "shooter");
        e.setFlipX(true);
        e.etype = "shooter";
        e.hp = 3;
        e.atkCD = 0;
        e.baseDisplayWidth = 150;
        e.baseDisplayHeight = 150;
        e.shootWindupUntil = 0;
        e.shootFrameSwapAt = 0;
        e.postShotHoldUntil = 0;
        e.postShotFrame = 0;
        e.pendingShotLow = undefined;
        e.anims.play("s_walk", true);
        this.enemies.add(e);
        this.physics.add.collider(e, this.groundGroup);
        this.snapToStandLine(e, 48);
    }

    setShooterIdle(enemy) {
        this.setShooterStandSize(enemy);
        enemy.anims.stop();
        enemy.setTexture("enemy_shooter", 2);
    }

    setShooterStandSize(enemy) {
        const w = enemy.baseDisplayWidth || 150;
        const h = enemy.baseDisplayHeight || 150;
        enemy.setDisplaySize(w, h);
    }

    setShooterCrouchSize(enemy) {
        const w = enemy.baseDisplayWidth || 150;
        const h = enemy.baseDisplayHeight || 150;
        enemy.setDisplaySize(Math.round(w * 0.9), Math.round(h * 0.84));
    }

    spawnDwarf(x) {
        const e = this.physics.add.sprite(x, 200, "enemy_dwarf");
        e.setDisplaySize(70, 70);
        this.setupEnemyBody(e, "dwarf");
        e.setFlipX(true);
        e.etype = "dwarf";
        e.hp = 3;
        e.leapCD = 0;
        e.isLeaping = false;
        e.hitPlayerThisLeap = false;
        e.leapStartHoldUntil = 0;
        e.setTexture("enemy_dwarf", 1);
            this.enemies.add(e);
            this.physics.add.collider(e, this.groundGroup);
            this.snapToStandLine(e, 40);
    }

    spawnBoss(x) {
        const e = this.physics.add.sprite(x, 200, "enemy_walk");
        e.setDisplaySize(180, 180);
        this.setupEnemyBody(e, "basic");
        e.setFlipX(true);
        e.etype = "boss";
        e.hp = 10;
        e.atkCD = 0;
        e.bossWindupUntil = 0;
        e.bossStrikeAt = 0;
        e.bossRecoverUntil = 0;
        e.bossDidStrike = false;
        e.anims.play("e_walk", true);
        this.enemies.add(e);
        this.physics.add.collider(e, this.groundGroup);
        this.snapToStandLine(e, 48);
    }

    setDwarfIdle(enemy) {
        enemy.anims.stop();
        enemy.setTexture("enemy_dwarf", 1);
    }

    startDwarfLeap(enemy, dir, time) {
        enemy.isLeaping = true;
        enemy.isDashAttack = true;
        enemy.hitPlayerThisLeap = false;
        enemy.leapStartHoldUntil = time + 60;
        enemy.anims.stop();
        enemy.setTexture("enemy_dwarf", 6);

        const minX = this.stairX + 80;
        const maxX = this.playerMaxX - 80;
        const dashDir = dir;
        const dashSpeed = 290;
        const dashTargetX = Phaser.Math.Clamp(this.player.x + (dashDir * 120), minX, maxX);
        const dashDistance = Math.max(30, Math.abs(dashTargetX - enemy.x));
        const dashDurationMs = (dashDistance / dashSpeed) * 1000;

        enemy.dashDir = dashDir;
        enemy.dashY = enemy.y;
        enemy.dashTargetX = dashTargetX;
        enemy.dashEndAt = time + dashDurationMs + 140;

        enemy.body.setAllowGravity(false);
        const leapVx = dashDir * dashSpeed;
        enemy.setVelocityX(leapVx);
        enemy.setVelocityY(0);
        enemy.setFlipX(enemy.body.velocity.x > 0);
        enemy.leapCD = time + 2200;
    }

    bounceDwarfAfterPlayerHit(enemy, time) {
        const currentDir = enemy.body.velocity.x >= 0 ? 1 : -1;
        enemy.leapStartHoldUntil = time + 60;
        enemy.anims.stop();
        enemy.setTexture("enemy_dwarf", 6);
        // Keep horizontal direction after impact so it ends up on the opposite side.
        enemy.setVelocityX(currentDir * 150);
        enemy.setVelocityY(-220);
        enemy.setFlipX(enemy.body.velocity.x > 0);
    }

    throwKnife(enemy, low) {
        const dir = enemy.x > this.player.x ? -1 : 1;
        const ky = low ? enemy.y + 24 : enemy.y - 54;
        const rect = this.add.rectangle(enemy.x, ky, 22, 7, 0xbbbbbb).setDepth(8);
        this.physics.add.existing(rect);
        rect.body.setAllowGravity(false);
        rect.body.setVelocityX(dir * 290);
        this.physics.add.overlap(rect, this.player, () => {
            if (!rect.active) return;
            if (this.isCrouching && !low) {
                rect.destroy();
                return;
            }
            rect.destroy();
            this.damagePlayer(18);
        });
        this.time.delayedCall(4000, () => { if (rect && rect.active) rect.destroy(); });
    }

    reachStairs() {
        if (this.stairDone || this.isClimbing) return;
        if (this.currentLevel === 1 && !this.level1BossDefeated) return;
        this.stairDone = true;
        this.isClimbing = true;
        this.clearWaveTimers();
        this.clearLevel2Hazards();
        this.waveInProgress = false;
        this.enemies.children.each(e => { if (e.active) e.destroy(); });
        this.player.setVelocityX(0);
        this.player.body.setAllowGravity(false);
        this.player.x = this.stairX;
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 140,
            duration: 1500,
            ease: "Linear",
            onComplete: () => {
                this.time.delayedCall(400, () => {
                    this.scene.start("LevelClearScene", {
                        level: this.currentLevel,
                        score: this.score,
                        lives: this.lives
                    });
                });
            }
        });
    }

    damagePlayer(amount) {
        if (this.isStunned || this.isClimbing) return;
        this.playerHP = Math.max(0, this.playerHP - amount);
        this.redrawHP();
        this.cameras.main.shake(140, 0.013);
        if (this.playerHP <= 0) {
            this.lives--;
            document.getElementById("lives-value").textContent = this.lives;
            if (this.lives <= 0) {
                this.scene.start("GameOverScene", { score: this.score });
            } else {
                this.scene.restart({ level: this.currentLevel, score: this.score, lives: this.lives });
            }
            return;
        }
        this.isStunned = true;
        this.player.setTint(0xff4444);
        this.time.delayedCall(280, () => {
            this.isStunned = false;
            this.player.clearTint();
        });
    }

    doAttack(type) {
        const postAttackMoveDelay = 200;
        const crouchHeld = (this.sKey && this.sKey.isDown) || (this.cursors && this.cursors.down && this.cursors.down.isDown);
        if (type === "punch" && (this.isCrouching || crouchHeld)) type = "crouch_punch";

        const isPunch = type === "punch";
        if (this.attackOnCD) return;

        this.attackOnCD = true;
        this.attackSeq++;
        const seq = this.attackSeq;
        this.isAttacking = type.includes("punch");
        this.isKicking = type.includes("kick");
        this.isJumpKicking = type === "jump_kick";
        this.player.setVelocityX(0);

        if (type === "crouch_punch") {
            this.player.anims.stop();
            const frame = this.crouchPunchNextFrame;
            this.player.setTexture("player_crouch_punch", frame);
            if (frame === 0) this.crouchPunchNextFrame = 1;
            else this.crouchPunchNextFrame = frame === 1 ? 2 : 1;
            this.crouchAttackHoldUntil = this.time.now + 320;
        } else if (type === "crouch_kick") {
            this.player.anims.play("p_crouch_kick", true);
            this.crouchAttackHoldUntil = 0;
        } else if (type === "jump_kick") {
            this.player.setTexture("player_jump_kick", 0);
        } else if (type === "kick") {
            this.player.anims.play("p_kick", true);
        } else if (isPunch) {
            this.player.anims.play("p_punch", true);
        }

        const isCrouch = type.startsWith("crouch");
        const isJump = type === "jump_kick";
        const isKickAttack = type.includes("kick");
        let rangeX = 60;
        if (type === "crouch_punch") rangeX = 42;
        else if (type.includes("kick")) rangeX = 94;
        const rangeY = isCrouch ? 28 : (isJump ? 85 : 55);
        const canDamageDwarf = type === "punch" || type === "crouch_punch" || type === "crouch_kick";

        this.enemies.children.each(enemy => {
            if (!enemy.active) return;
            // scroll/dragon can't be hit by low attacks
            if ((enemy.etype === "scroll" || enemy.etype === "dragon") &&
                (type === "crouch_punch" || type === "crouch_kick")) return;
            const dx = enemy.x - this.player.x;
            const dy = Math.abs(enemy.y - this.player.y);
            const inFront = this.facingRight ? dx > 0 : dx < 0;
            const spiderYRange = enemy.etype === "parachute_spider" && enemy.isParachuteFalling ? 130 : rangeY;
            const scrollYRange = enemy.etype === "scroll" ? 160 : spiderYRange;
            if (inFront && Math.abs(dx) < rangeX && dy < scrollYRange) {
                if (enemy.etype === "dwarf" && !canDamageDwarf) return;
                if (enemy.etype === "boss" && type === "crouch_kick") return;
                if (enemy.etype === "parachute_spider") {
                    if (!enemy.isParachuteFalling) {
                        const canHitGroundSpider = type === "crouch_punch" || type === "crouch_kick"
                            || type === "punch" || type === "kick";
                        if (!canHitGroundSpider) return;
                    }
                    this.killEnemy(enemy);
                    return;
                }
                if (enemy.etype === "boss") {
                    this.damageEnemy(enemy, 1);
                } else if (isKickAttack) {
                    this.killEnemy(enemy);
                } else {
                    this.damageEnemy(enemy, 1);
                }
            }
        });

        const attackDurationByType = {
            punch: 260,
            crouch_punch: 320,
            kick: 260,
            crouch_kick: 260,
            jump_kick: 260
        };
        const attackDuration = attackDurationByType[type] || 260;
        this.attackLockUntil = Math.max(this.attackLockUntil, this.time.now + attackDuration);
        this.moveLockUntil = Math.max(this.moveLockUntil, this.time.now + attackDuration + postAttackMoveDelay);
        this.time.delayedCall(attackDuration, () => {
            if (seq !== this.attackSeq) return;
            this.isAttacking = false;
            this.isKicking = false;
            this.isJumpKicking = false;
            this.attackOnCD = false;
        });
    }

    damageEnemy(enemy, amount) {
        if (!enemy.active || enemy.isDying) return;
        enemy.hp = Math.max(0, (enemy.hp ?? 3) - amount);
        if (enemy.hp <= 0) this.killEnemy(enemy);
    }

    killEnemy(enemy) {
        if (!enemy.active || enemy.isDying) return;
        if (enemy.etype === "parachute_spider" || enemy.etype === "scroll" || enemy.etype === "dragon") {
            this.score += 10;
            document.getElementById("score-value").textContent = this.score;
            if (enemy.laser && enemy.laser.active) enemy.laser.destroy();
            enemy.destroy();
            return;
        }
        this.score += enemy.etype === "boss" ? 100 : 10;
        document.getElementById("score-value").textContent = this.score;
        enemy.isDying = true;
        enemy.deathDespawnAt = this.time.now + 850;
        const away = enemy.x >= this.player.x ? 1 : -1;
        enemy.setVelocityX(away * 45);
        enemy.setVelocityY(420);
        if (enemy.etype === "boss") {
            enemy.setDisplaySize(180, 180);
            enemy.setTexture("enemy_death", 0);
            enemy.anims.play("e_die", true);
            if (this.currentLevel === 1) {
                this.level1BossDefeated = true;
                this.spawnEnabled = false;
                this.clearWaveTimers();
                this.waveInProgress = false;
            }
        } else if (enemy.etype === "dwarf") {
            enemy.anims.stop();
            enemy.setTexture("enemy_dwarf", 2);
        } else if (enemy.etype === "shooter") {
            enemy.anims.stop();
            this.setShooterStandSize(enemy);
            enemy.setTexture("enemy_shooter", 1);
            enemy.setAngle(away > 0 ? 90 : -90);
        } else {
            enemy.setTexture("enemy_death", 0);
            enemy.anims.play("e_die", true);
        }
    }

    update(time) {
        if (this.isClimbing) return;

        const elapsedMs = Math.max(0, time - this.levelStartTime);
        const timeLeftMs = Math.max(0, this.levelDurationMs - elapsedMs);
        this.updateBottomHUD(timeLeftMs);
        if (!this.timeExpired && timeLeftMs <= 0) {
            this.timeExpired = true;
            this.scene.start("GameOverScene", { score: this.score });
            return;
        }

        if (this.currentLevel === 1 && !this.level1BossSpawnRequested && !this.level1BossDefeated && this.player.x <= this.bossHalfMapTriggerX) {
            this.level1BossSpawnRequested = true;
            if (!this.level1BossSpawned) {
                const bossX = Phaser.Math.Clamp(this.stairX + 110, this.stairX + 70, this.playerMaxX - 90);
                this.spawnBoss(bossX);
                this.level1BossSpawned = true;
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.oneKey)) this.toggleHitboxes();
        if (Phaser.Input.Keyboard.JustDown(this.twoKey)) this.toggleEnemySpawning();
        if (Phaser.Input.Keyboard.JustDown(this.threeKey)) this.spawnAdminEnemyCycle();
        if (Phaser.Input.Keyboard.JustDown(this.fourKey)) {
            this.scene.start("GameScene", {
                level: 2,
                score: this.score,
                lives: this.lives
            });
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.fiveKey)) {
            if (this.adminHazardCycle === 0) {
                this.spawnParachuteSpider();
            } else {
                this.spawnScroll();
            }
            this.adminHazardCycle = this.adminHazardCycle === 0 ? 1 : 0;
        }

        const crouchHeld = this.cursors.down.isDown || this.sKey.isDown;
        const footY = crouchHeld ? 40 : 48;
        const scaleY = this.player.displayHeight / 64;
        const snapY = this.standLineY - (footY * scaleY) + (this.player.displayHeight / 2);
        const onGround = !this.isJumping || this.player.y >= snapY - 2;

        if (this.player.y >= snapY - 2 && this.player.body.velocity.y >= 0) {
            this.isJumping = false;
            this.player.y = snapY;
            this.player.body.velocity.y = 0;
        }

        this.isCrouching = crouchHeld && onGround;
        if (this.isCrouching) {
            this.isJumping = false;
            this.player.y = snapY;
            this.player.body.setVelocityY(0);
        }

        if (!this.isStunned) {
            const atkJust = Phaser.Input.Keyboard.JustDown(this.attackKey)
                || Phaser.Input.Keyboard.JustDown(this.attackKey2);
            const kickJust = Phaser.Input.Keyboard.JustDown(this.kickKey);
            const crouchAttackMode = onGround && (crouchHeld || this.isCrouching || this.player.texture.key === "player_crouch_punch" || this.player.texture.key === "player_crouch");

            if (atkJust) {
                if (crouchAttackMode) this.doAttack("crouch_punch");
                else this.doAttack("punch");
            }
            if (kickJust) {
                if (!onGround) this.doAttack("jump_kick");
                else if (crouchAttackMode) this.doAttack("crouch_kick");
                else this.doAttack("kick");
            }

            const attackLocked = this.time.now < this.attackLockUntil;
            const moveLocked = this.time.now < this.moveLockUntil;
            let moving = false;
            if (moveLocked || attackLocked || this.isAttacking || this.isKicking || this.isJumpKicking || this.isJumping || this.isCrouching) {
                this.player.setVelocityX(0);
            } else if (this.cursors.left.isDown || this.aKey.isDown) {
                if (this.player.x > this.playerMinX + 0.5) {
                    this.player.setVelocityX(-90);
                    moving = true;
                } else {
                    this.player.setVelocityX(0);
                    this.player.x = this.playerMinX;
                }
                this.player.setFlipX(false);
                this.facingRight = false;
            } else if (this.cursors.right.isDown || this.dKey.isDown) {
                if (this.player.x < this.playerMaxX - 0.5) {
                    this.player.setVelocityX(90);
                    moving = true;
                } else {
                    this.player.setVelocityX(0);
                    this.player.x = this.playerMaxX;
                }
                this.player.setFlipX(true);
                this.facingRight = true;
            } else {
                this.player.setVelocityX(0);
            }

            const jumpJust = Phaser.Input.Keyboard.JustDown(this.spaceKey)
                || Phaser.Input.Keyboard.JustDown(this.wKey)
                || Phaser.Input.Keyboard.JustDown(this.cursors.up);
            if (jumpJust && !moveLocked && !attackLocked && !this.isJumping && onGround && !this.isCrouching) {
                this.player.setVelocityY(-330);
                this.isJumping = true;
            }

            if (!moveLocked && !attackLocked && !this.isAttacking && !this.isKicking && !this.isJumpKicking) {
                const holdingCrouchAttackFrame = this.time.now < this.crouchAttackHoldUntil;
                if (!onGround) {
                    this.player.setTexture("player_jump");
                } else if (this.isCrouching) {
                    if (!holdingCrouchAttackFrame) this.player.setTexture("player_crouch");
                } else if (moving) {
                    this.player.anims.play("p_walk", true);
                } else {
                    this.player.anims.play("p_idle", true);
                }
            }
        }

        this.clampPlayerBounds(this.player, this.playerMinX, this.playerMaxX);

        this.enemies.children.each(enemy => {
            if (!enemy.active) return;
            if (enemy.isDying) {
                if (enemy.body && enemy.body.blocked.down) {
                    enemy.setVelocityX(0);
                    enemy.setVelocityY(0);
                }
                if (time >= (enemy.deathDespawnAt || 0)) enemy.destroy();
                return;
            }
            if (enemy.body && enemy.body.blocked.down && !enemy.isLeaping && enemy.etype !== "parachute_spider" && enemy.etype !== "scroll" && enemy.etype !== "dragon") {
                const enemyFootY = enemy.etype === "dwarf" ? 40 : 48;
                this.snapToStandLine(enemy, enemyFootY);
            }
            this.updateEnemy(enemy, time);
        });

        // A wave ends only when all intended enemies were spawned and the last one is defeated.
        if (this.waveInProgress && this.waveSpawnedCount >= this.waveTargetCount) {
            const activeCombat = this.getActiveCombatEnemies().length;
            if (activeCombat === 0) {
                this.waveInProgress = false;
                this.wavesCleared++;
                if (this.currentLevel === 1 && this.level1BossSpawnRequested && !this.level1BossSpawned && !this.level1BossDefeated) {
                    this.beginWave();
                } else {
                    this.startNextWaveCountdown(2000);
                }
            }
        }
    }

    updateEnemy(enemy, time) {
        if (!enemy.body) return;
        const dx = this.player.x - enemy.x;
        const dist = Math.abs(dx);
        const dir = dx > 0 ? 1 : -1;
        const onGround = enemy.body.blocked.down;
        const nearPlayerRadius = 180;
        const closeChaseFactor = dist <= nearPlayerRadius ? 0.55 : 1;

        if (enemy.etype === "basic") {
            if (dist > 50) {
                enemy.setVelocityX(dir * (165 * closeChaseFactor));
                enemy.setFlipX(enemy.body.velocity.x > 0);
                enemy.anims.play("e_walk", true);
            } else {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx > 0);
                if (time > enemy.atkCD) {
                    enemy.anims.play("e_punch", true);
                    enemy.atkCD = time + Phaser.Math.Between(1350, 1800);
                    if (dist < 60 && Math.abs(this.player.y - enemy.y) < 55 && !this.isCrouching) {
                        this.damagePlayer(12);
                    }
                } else {
                    enemy.anims.stop();
                    enemy.setTexture("enemy_walk", 0);
                }
            }
        } else if (enemy.etype === "boss") {
            if (time < (enemy.bossWindupUntil || 0)) {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx > 0);
                enemy.anims.stop();
                enemy.setTexture("enemy_punch", 0);

                if (!enemy.bossDidStrike && time >= (enemy.bossStrikeAt || 0)) {
                    enemy.bossDidStrike = true;
                    if (dist < 76 && Math.abs(this.player.y - enemy.y) < 65 && !this.isCrouching) {
                        this.damagePlayer(50);
                    }
                }
                return;
            }

            if (time < (enemy.bossRecoverUntil || 0)) {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx > 0);
                enemy.anims.stop();
                enemy.setTexture("enemy_punch", 1);
                return;
            }

            if (dist > 62) {
                enemy.setVelocityX(dir * 60);
                enemy.setFlipX(enemy.body.velocity.x > 0);
                enemy.anims.play("e_walk", true);
            } else {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx > 0);
                if (time > enemy.atkCD) {
                    enemy.bossDidStrike = false;
                    enemy.bossStrikeAt = time + 650;
                    enemy.bossWindupUntil = time + 1100;
                    enemy.bossRecoverUntil = enemy.bossWindupUntil + 900;
                    enemy.atkCD = enemy.bossRecoverUntil + Phaser.Math.Between(800, 1300);
                    enemy.anims.stop();
                    enemy.setTexture("enemy_punch", 0);
                } else {
                    enemy.anims.stop();
                    enemy.setTexture("enemy_walk", 0);
                }
            }
        } else if (enemy.etype === "shooter") {
            // 8m in this game scale ~= 720 px: inside this radius shooter stops running.
            const shooterStopRadius = 720;
            // Shooters only fire once they are close enough (~3m ~= 270 px).
            const shooterFireRadius = 270;
            if (time < (enemy.postShotHoldUntil || 0)) {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx < 0);
                if ((enemy.postShotFrame || 0) >= 5) this.setShooterCrouchSize(enemy);
                else this.setShooterStandSize(enemy);
                enemy.anims.stop();
                enemy.setTexture("enemy_shooter", enemy.postShotFrame || 2);
                return;
            }

            if (time < (enemy.shootWindupUntil || 0)) {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx < 0);
                if (enemy.pendingShotLow) {
                    this.setShooterCrouchSize(enemy);
                    enemy.anims.stop();
                    enemy.setTexture("enemy_shooter", time < (enemy.shootFrameSwapAt || 0) ? 4 : 5);
                } else if (enemy.pendingShotLow === false) {
                    this.setShooterStandSize(enemy);
                    enemy.anims.stop();
                    enemy.setTexture("enemy_shooter", time < (enemy.shootFrameSwapAt || 0) ? 2 : 3);
                }
                return;
            }

            if (enemy.pendingShotLow !== undefined && time >= (enemy.shootWindupUntil || 0)) {
                const low = !!enemy.pendingShotLow;
                enemy.pendingShotLow = undefined;
                enemy.shootFrameSwapAt = 0;
                if (low) {
                    this.setShooterCrouchSize(enemy);
                    enemy.anims.stop();
                    enemy.setTexture("enemy_shooter", 5);
                    enemy.postShotFrame = 5;
                    enemy.postShotHoldUntil = time + 130;
                } else {
                    this.setShooterStandSize(enemy);
                    enemy.setTexture("enemy_shooter", 3);
                    enemy.postShotFrame = 3;
                    enemy.postShotHoldUntil = time + 80;
                }
                this.throwKnife(enemy, low);
                return;
            }

            if (dist > shooterStopRadius) {
                this.setShooterStandSize(enemy);
                enemy.setVelocityX(dir * (160 * closeChaseFactor));
                enemy.setFlipX(dx > 0);
                enemy.anims.play("s_walk", true);
            } else if (dist > shooterFireRadius) {
                this.setShooterStandSize(enemy);
                enemy.setVelocityX(dir * (70 * closeChaseFactor));
                enemy.setFlipX(dx > 0);
                enemy.anims.play("s_walk", true);
            } else {
                this.setShooterStandSize(enemy);
                enemy.setVelocityX(0);
                this.setShooterIdle(enemy);
                if (time > enemy.atkCD) {
                    const low = Phaser.Math.Between(0, 2) === 0;
                    enemy.atkCD = time + Phaser.Math.Between(7600, 8600);
                    enemy.pendingShotLow = low;
                    if (low) {
                        enemy.shootWindupUntil = time + 2000;
                        enemy.shootFrameSwapAt = time + 1200;
                        enemy.anims.stop();
                        enemy.setTexture("enemy_shooter", 4);
                    } else {
                        enemy.shootWindupUntil = time + 1400;
                        enemy.shootFrameSwapAt = time + 850;
                        enemy.anims.stop();
                        enemy.setTexture("enemy_shooter", 2);
                    }
                }
            }
        } else if (enemy.etype === "dwarf") {
            const dwarfLandY = this.standLineY - (40 * (enemy.displayHeight / 64)) + (enemy.displayHeight / 2);
            const canLeapFromGround = onGround || (enemy.y >= (dwarfLandY - 2));

            if (!enemy.isLeaping) {
                if (dist < 90 && dist > 24 && canLeapFromGround && time > enemy.leapCD) {
                    this.startDwarfLeap(enemy, dir, time);
                } else if (dist > 35) {
                    enemy.setVelocityX(dir * (180 * closeChaseFactor));
                    enemy.setFlipX(dx > 0);
                    enemy.anims.play("d_walk", true);
                } else {
                    enemy.setVelocityX(0);
                    enemy.setFlipX(dx > 0);
                    this.setDwarfIdle(enemy);
                }
            }

            if (enemy.isLeaping) {
                enemy.setFlipX(dx > 0);

                if (enemy.isDashAttack) {
                    enemy.y = enemy.dashY ?? enemy.y;
                    enemy.setVelocityY(0);
                }

                if (time < (enemy.leapStartHoldUntil || 0)) {
                    enemy.anims.stop();
                    enemy.setTexture("enemy_dwarf", 6);
                } else {
                    enemy.anims.play("d_leap", true);
                }

                const hitPlayer = !enemy.hitPlayerThisLeap
                    && dist < 44
                    && Math.abs(this.player.y - enemy.y) < 58;
                if (hitPlayer) {
                    enemy.hitPlayerThisLeap = true;
                    this.damagePlayer(20);
                }

                const crossedTarget = (enemy.dashDir || 0) > 0
                    ? enemy.x >= (enemy.dashTargetX || enemy.x)
                    : enemy.x <= (enemy.dashTargetX || enemy.x);
                const dashTimeout = time >= (enemy.dashEndAt || 0);

                if (enemy.isDashAttack && (crossedTarget || dashTimeout)) {
                    enemy.isLeaping = false;
                    enemy.isDashAttack = false;
                    enemy.hitPlayerThisLeap = false;
                    enemy.anims.stop();
                    enemy.setTexture("enemy_dwarf", 6);
                    enemy.body.setAllowGravity(true);
                    enemy.setVelocityX(0);
                    enemy.setVelocityY(0);
                        this.snapToStandLine(enemy, 40);
                    enemy.leapCD = Math.max(enemy.leapCD || 0, time + 450);
                    this.time.delayedCall(90, () => {
                        if (enemy && enemy.active && !enemy.isLeaping) this.setDwarfIdle(enemy);
                    });
                    return;
                }

                if (!enemy.isDashAttack && enemy.body.velocity.y >= 0 && (onGround || enemy.y >= (dwarfLandY - 2))) {
                    enemy.isLeaping = false;
                    enemy.isDashAttack = false;
                    enemy.hitPlayerThisLeap = false;
                    enemy.anims.stop();
                    enemy.setTexture("enemy_dwarf", 6);
                    enemy.body.setAllowGravity(true);
                    enemy.setVelocityX(0);
                    enemy.setVelocityY(0);
                        this.snapToStandLine(enemy, 40);
                    enemy.leapCD = Math.max(enemy.leapCD || 0, time + 450);
                    this.time.delayedCall(90, () => {
                        if (enemy && enemy.active && !enemy.isLeaping) this.setDwarfIdle(enemy);
                    });
                }
            }
        } else if (enemy.etype === "scroll") {
            enemy.setVelocityX(0);
            enemy.setVelocityY(enemy.fallSpeed || 65);
            if (enemy.y >= (enemy.landY ?? (this.standLineY - enemy.displayHeight / 2))) {
                const landX = enemy.x;
                enemy.destroy();
                this.spawnDragon(landX);
            }
        } else if (enemy.etype === "dragon") {
            // Dragon is stationary; lifecycle handled entirely via delayedCall in spawnDragon.
            enemy.setVelocityX(0);
            enemy.setVelocityY(0);
        } else if (enemy.etype === "parachute_spider") {
            if (enemy.isParachuteFalling) {
                enemy.setVelocityX(0);
                enemy.setVelocityY(enemy.fallSpeed || 40);
                if (enemy.y >= (enemy.landY || (this.standLineY - (enemy.displayHeight / 2)))) {
                    enemy.isParachuteFalling = false;
                    enemy.y = enemy.landY || (this.standLineY - (enemy.displayHeight / 2));
                    enemy.setVelocityY(0);
                    enemy.runDir = this.player.x >= enemy.x ? 1 : -1;
                    enemy.setFlipX(enemy.runDir > 0);
                }
            } else {
                const runDir = enemy.runDir || 1;
                enemy.setVelocityX(runDir * (enemy.runSpeed || 300));
                enemy.setVelocityY(0);
                // Despawn once it keeps moving straight and gets far from the player (~8m).
                if (Math.abs(enemy.x - this.player.x) > 720) {
                    enemy.destroy();
                }
            }
        }
    }
}

Object.assign(GameScene.prototype, window.KFMPhysics || {});

class LevelClearScene extends Phaser.Scene {
    constructor() { super({ key: "LevelClearScene" }); }

    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
        this.lives = data.lives !== undefined ? data.lives : 3;
    }

    create() {
        const W = this.scale.width, H = this.scale.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000);
        this.add.text(W / 2, H * 0.28, "NIVEL " + this.level + " COMPLETADO", {
            fontSize: "44px", fill: "#ffdd00", fontFamily: PIXEL_FONT,
            stroke: "#996600", strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.50, "Puntuacion: " + this.score, {
            fontSize: "30px", fill: "#ffffff", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        const hint = this.add.text(W / 2, H * 0.72, "Pulsa cualquier boton para continuar", {
            fontSize: "22px", fill: "#aaaaaa", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        const isFinalLevel = this.level >= 2;
        if (isFinalLevel) {
            hint.setText("Pulsa cualquier boton para ver el final");
        }

        this.tweens.add({ targets: hint, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

        this.input.keyboard.once("keydown", () => {
            if (isFinalLevel) this.scene.start("WinScene", { score: this.score });
            else this.scene.start("GameScene", {
                level: this.level + 1,
                score: this.score,
                lives: this.lives
            });
        });
        this.input.once("pointerdown", () => {
            if (isFinalLevel) this.scene.start("WinScene", { score: this.score });
            else this.scene.start("GameScene", {
                level: this.level + 1,
                score: this.score,
                lives: this.lives
            });
        });
    }
}

class WinScene extends Phaser.Scene {
    constructor() { super({ key: "WinScene" }); }

    init(data) { this.score = data.score || 0; }

    create() {
        const W = this.scale.width, H = this.scale.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0x00110b);
        this.add.text(W / 2, H * 0.28, "HAS GANADO", {
            fontSize: "64px", fill: "#66ff99", fontFamily: PIXEL_FONT,
            stroke: "#006633", strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.46, "AKANE ESTA A SALVO", {
            fontSize: "24px", fill: "#ffffff", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.58, "Puntuacion: " + this.score, {
            fontSize: "28px", fill: "#ffdd00", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        const hint = this.add.text(W / 2, H * 0.74, "Pulsa cualquier boton para volver al menu", {
            fontSize: "18px", fill: "#9adbb4", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);
        this.tweens.add({ targets: hint, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

        this.input.keyboard.once("keydown", () => this.scene.start("MenuScene"));
        this.input.once("pointerdown", () => this.scene.start("MenuScene"));
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: "GameOverScene" }); }

    init(data) { this.score = data.score || 0; }

    create() {
        const W = this.scale.width, H = this.scale.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0x110000);
        this.add.text(W / 2, H * 0.28, "GAME OVER", {
            fontSize: "72px", fill: "#cc0000", fontFamily: PIXEL_FONT,
            stroke: "#440000", strokeThickness: 7
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.52, "Puntuacion: " + this.score, {
            fontSize: "30px", fill: "#ffffff", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        const hint = this.add.text(W / 2, H * 0.72, "Pulsa cualquier boton para volver al menu", {
            fontSize: "20px", fill: "#888888", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        this.tweens.add({ targets: hint, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

        this.input.keyboard.once("keydown", () => this.scene.start("MenuScene"));
        this.input.once("pointerdown", () => this.scene.start("MenuScene"));
    }
}

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: 800,
    height: 450,
    backgroundColor: "#000000",
    pixelArt: true,
    render: { pixelArt: true, antialias: false, roundPixels: true },
    physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, MenuScene, StoryScene, GameScene, LevelClearScene, WinScene, GameOverScene]
};

const game = new Phaser.Game(config);
