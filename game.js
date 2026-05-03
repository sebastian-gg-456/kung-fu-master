// Scenes, UI, gameplay, and animations.
const PIXEL_FONT = '"Press Start 2P", "VT323", monospace';

const MUSIC_TRACK = "sprites/sonido/toda la musica.mp3";
const MUSIC_SEGMENTS = {
    menuLoop:   { start: 0, end: 5, loop: true },
    gameLoop:   { start: 5, end: 75, loop: true },
    levelClear: { start: 75, end: 80, loop: false, protectUntilEnd: true },
    winLoop:    { start: 80, end: 92, loop: true },
    loseLoop:   { start: 92, end: 97, loop: true }
};

const MusicDirector = {
    audio: null,
    timer: null,
    activeName: null,
    lockEndTime: null,
    queuedName: null,

    ensureAudio() {
        if (this.audio) return this.audio;
        const a = new Audio(MUSIC_TRACK);
        a.preload = "auto";
        a.volume = 0.75;
        this.audio = a;
        return a;
    },

    stop(force = false) {
        if (!force && this.lockEndTime !== null && this.audio && this.audio.currentTime < this.lockEndTime) return;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.audio) this.audio.pause();
        this.activeName = null;
        this.lockEndTime = null;
    },

    play(name) {
        const seg = MUSIC_SEGMENTS[name];
        if (!seg) return;

        const a = this.ensureAudio();
        if (this.lockEndTime !== null && this.activeName !== name && a.currentTime < this.lockEndTime) {
            this.queuedName = name;
            return;
        }
        if (this.activeName === name && !a.paused) return;

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.activeName = name;
        this.lockEndTime = seg.protectUntilEnd ? seg.end : null;
        if (this.activeName === this.queuedName) this.queuedName = null;
        a.pause();
        a.currentTime = seg.start;
        a.play().catch(() => { /* waits for user gesture */ });

        this.timer = setInterval(() => {
            if (!this.audio) return;
            if (this.audio.currentTime >= seg.end) {
                if (seg.loop) {
                    this.audio.currentTime = seg.start;
                    if (this.audio.paused) this.audio.play().catch(() => {});
                } else {
                    this.stop(true);
                    if (this.queuedName) {
                        const next = this.queuedName;
                        this.queuedName = null;
                        this.play(next);
                    }
                }
            }
        }, 40);
    }
};

function bindEnterStart(scene, hintText, onStart) {
    if (!scene || !hintText) return;
    let starting = false;
    scene.input.keyboard.once("keydown-ENTER", () => {
        if (starting) return;
        starting = true;
        scene.tweens.killTweensOf(hintText);
        scene.tweens.add({
            targets: hintText,
            alpha: 0,
            duration: 70,
            yoyo: true,
            repeat: 5,
            onComplete: () => onStart()
        });
    });
}

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
        this.load.spritesheet("boss1", "sprites/enemigos/jefe 1.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("hazard_scroll", "sprites/pergamino.png", { frameWidth: 64, frameHeight: 64 });
        this.load.image("hazard_dragon", "sprites/enemigos/Dragon.png");
        this.load.spritesheet("hazard_flame", "sprites/enemigos/llamarada.png", { frameWidth: 64, frameHeight: 64 });
        this.load.image("enemy_kumoko", "sprites/enemigos/kumoko.png");
        this.load.audio("sfx_strongpunch", "sprites/sonido/strongpunch.mp3");
        this.load.audio("sfx_black_flash", "sprites/sonido/black-flash-gojos.mp3");

        this.load.image("bg_fondo1", "sprites/mapa/fondo1.png");
        this.load.image("bg_fondo2", "sprites/mapa/fondo2.png");
        this.load.spritesheet("boss2", "sprites/enemigos/jefe 2.png", { frameWidth: 64, frameHeight: 64 });
    }

    create() { this.scene.start("MenuScene"); }
}

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: "MenuScene" }); }

    create() {
        MusicDirector.play("menuLoop");
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

        const prompt = this.add.text(W / 2, H * 0.72, "PULSA ENTER PARA EMPEZAR", {
            fontSize: "22px", fill: "#ffffff", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        this.tweens.add({ targets: prompt, alpha: 0, duration: 180, yoyo: true, repeat: -1 });

        this.add.text(W / 2, H * 0.88, "2026  KUNG FU MASTER", {
            fontSize: "16px", fill: "#555555", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        bindEnterStart(this, prompt, () => this.scene.start("StoryScene"));
    }
}

class StoryScene extends Phaser.Scene {
    constructor() { super({ key: "StoryScene" }); }

    create() {
        MusicDirector.stop();
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

        const hint = this.add.text(W / 2, H * 0.93, "Pulsa ENTER para continuar", {
            fontSize: "14px", fill: "#555555", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);
        this.tweens.add({ targets: hint, alpha: 0, duration: 180, yoyo: true, repeat: -1 });

        bindEnterStart(this, hint, () => this.scene.start("GameScene", { level: 1, score: 0, lives: 3 }));
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
        MusicDirector.play("gameLoop");
        const W = this.scale.width, H = this.scale.height;
        const WORLD_W = 3200;

        this.initPhysicsWorld(WORLD_W);

        const fitScale = H / 211;
        if (this.currentLevel === 2) {
            // fondo2 used as the floor strip, night sky drawn on top
            const mapBg2 = this.add.tileSprite(WORLD_W / 2, H / 2, WORLD_W, H, "bg_fondo2");
            mapBg2.tileScaleX = fitScale;
            mapBg2.tileScaleY = fitScale;
            mapBg2.setDepth(-5);
            this.createLevel2Sky(WORLD_W);
        } else {
            const mapBg = this.add.tileSprite(WORLD_W / 2, H / 2, WORLD_W, H, "bg_fondo1");
            mapBg.tileScaleX = fitScale;
            mapBg.tileScaleY = fitScale;
        }

        this.stairDone = false;

        this.player = this.physics.add.sprite(0, 200, "player_walk");
        this.player.setDisplaySize(150, 150);
        if (this.currentLevel === 2) {
            // Level 2: player comes up stairs on the LEFT and must reach the RIGHT
            this.stairX = WORLD_W - 155;
            this.player.x = 75;
            this.player.setFlipX(true);
            this.playerMinX = 155;
            this.playerMaxX = this.stairX;
        } else {
            // Level 1: player starts RIGHT and must reach stairs on the LEFT
            this.stairX = 155;
            const playerStartX = WORLD_W - (this.player.displayWidth / 2);
            this.player.x = playerStartX;
            this.player.setFlipX(false);
            this.playerMaxX = playerStartX;
            this.playerMinX = this.stairX;
        }
        this.setupPlayerBody(this.player);
        this.player.setDepth(10);
        this.bossHalfMapTriggerX = WORLD_W * 0.5;

        this.safeAnim("p_idle", { frames: this.anims.generateFrameNumbers("player_walk", { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
        this.safeAnim("p_walk", { frames: this.anims.generateFrameNumbers("player_walk", { start: 1, end: 2 }), frameRate: 6, repeat: -1 });
        this.safeAnim("p_punch", { frames: this.anims.generateFrameNumbers("player_punch", { start: 0, end: 2 }), frameRate: 12, repeat: 0 });
        this.safeAnim("p_kick", {
            frames: [{ key: "player_kick", frame: 0 }, { key: "player_kick", frame: 1 }],
            frameRate: 16,
            repeat: 0
        });
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
        this.safeAnim("b1_walk",  { frames: this.anims.generateFrameNumbers("boss1", { start: 1, end: 2 }), frameRate: 7, repeat: -1 });
        this.safeAnim("b1_punch", { frames: this.anims.generateFrameNumbers("boss1", { start: 3, end: 4 }), frameRate: 10, repeat: 0 });
        this.safeAnim("b1_die",   { frames: [{ key: "boss1", frame: 5 }], frameRate: 1, repeat: 0 });
        // Boss2 animations (0-indexed: idle=0, punch=1-2, walk=3-4)
        this.safeAnim("b2_walk",  { frames: this.anims.generateFrameNumbers("boss2", { start: 3, end: 4 }), frameRate: 7, repeat: -1 });
        this.safeAnim("b2_punch", { frames: this.anims.generateFrameNumbers("boss2", { start: 1, end: 2 }), frameRate: 10, repeat: 0 });
        this.safeAnim("scroll_fall", { frames: this.anims.generateFrameNumbers("hazard_scroll", { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
        this.safeAnim("flame_breath", { frames: this.anims.generateFrameNumbers("hazard_flame", { start: 0, end: 3 }), frameRate: 14, repeat: -1 });

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
        this.sixKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX);
        this.nineKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
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
        this.facingRight = this.currentLevel === 2;
        this.crouchPunchNextFrame = 0;
        this.crouchAttackHoldUntil = 0;
        this.attackLockUntil = 0;
        this.moveLockUntil = 0;
        this.attackSeq = 0;
        this.blackFlashChance = 0.10;
        this.blackFlashCooldownUntil = 0;
        this.blackFlashCueToken = 0;
        this.blackFlashCueSound = null;
        this.forceBlackFlashOnNextHit = false;
        this.spawnEnabled = true;
        this.levelClearCuePlayed = false;
        this.levelClearBonusApplied = false;
        this.wavesCleared = 0;
        this.wavesBeforeBoss = 3;
        this.level1BossSpawnRequested = this.currentLevel > 1;
        this.level1BossSpawned = this.currentLevel > 1;
        this.level1BossDefeated = this.currentLevel > 1;
        this.level2BossSpawned = false;
        this.level2BossDefeated = false;
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

        if (this.currentLevel === 2) {
            this.playLevel2Entry();
        } else {
            this.startNextWaveCountdown(700);
        }
    }

    createLevel2Sky(worldW) {
        const W = this.scale.width, H = this.scale.height;
        // Canvas covers the full screen; the grey floor strip of fondo2 is revealed
        // below via a complementary dark rect that masks fondo2's white area.
        // We bake: sky gradient + stars + pixel-art crescent moon into a canvas texture.
        const SKY_KEY = 'night_sky_canvas';
        if (!this.textures.exists(SKY_KEY)) {
            const canvas = this.textures.createCanvas(SKY_KEY, W, H);
            const ctx = canvas.getContext();

            // --- Sky gradient ---
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0,    '#020310');
            grad.addColorStop(0.50, '#060d2a');
            grad.addColorStop(0.85, '#0c1a45');
            grad.addColorStop(1,    '#111e50');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // --- Pixel-art stars (seeded LCG so layout is deterministic) ---
            let seed = 12345;
            const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
            const starPalette = ['#ffffff', '#ffe8cc', '#cce0ff', '#ffffcc', '#aaccff'];
            for (let i = 0; i < 220; i++) {
                const sx = Math.floor(rng() * W);
                const sy = Math.floor(rng() * (H * 0.86));
                const sz = rng() < 0.11 ? 2 : 1;
                ctx.fillStyle = starPalette[Math.floor(rng() * starPalette.length)];
                ctx.fillRect(sx, sy, sz, sz);
            }
            // A handful of cross-shaped "bright" stars (pixel art style)
            const brightStars = [];
            for (let i = 0; i < 8; i++) {
                brightStars.push([Math.floor(rng() * (W - 20) + 10), Math.floor(rng() * (H * 0.78))]);
            }
            brightStars.forEach(([bx, by]) => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(bx - 2, by,     2, 2);   // left arm
                ctx.fillRect(bx + 2, by,     2, 2);   // right arm
                ctx.fillRect(bx,     by - 2, 2, 2);   // top arm
                ctx.fillRect(bx,     by + 2, 2, 2);   // bottom arm
                ctx.fillStyle = '#eeeeff';
                ctx.fillRect(bx, by, 2, 2);            // center
            });

            // --- Pixel-art crescent moon (upper-right) ---
            const mx = W - 108, my = 56, mr = 28, PIX = 4;
            // Full disc (warm pale yellow)
            ctx.fillStyle = '#f4edd0';
            for (let ry = -mr; ry < mr; ry += PIX) {
                for (let rx = -mr; rx < mr; rx += PIX) {
                    if (rx * rx + ry * ry < mr * mr) {
                        ctx.fillRect(mx + rx, my + ry, PIX, PIX);
                    }
                }
            }
            // Subtle craters
            ctx.fillStyle = '#d8c898';
            [[9, -4, 4, 4], [-7, 10, 4, 4], [14, 11, 3, 3]].forEach(([cx, cy, cw, ch]) =>
                ctx.fillRect(mx + cx, my + cy, cw, ch)
            );
            // Crescent shadow (offset disc in sky colour → carves out the crescent)
            const shR = mr - 2, shOX = 14, shOY = -6;
            ctx.fillStyle = '#060d2a';
            for (let ry = -mr; ry < mr; ry += PIX) {
                for (let rx = -mr; rx < mr; rx += PIX) {
                    const dx = rx - shOX, dy = ry - shOY;
                    if (dx * dx + dy * dy < shR * shR) {
                        ctx.fillRect(mx + rx, my + ry, PIX, PIX);
                    }
                }
            }
            // Moon glow halo
            const halo = ctx.createRadialGradient(mx, my, mr, mx, my, mr + 18);
            halo.addColorStop(0, 'rgba(244,237,208,0.28)');
            halo.addColorStop(1, 'rgba(244,237,208,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(mx, my, mr + 18, 0, Math.PI * 2);
            ctx.fill();

            canvas.refresh();
        }

        // Sky tileSprite: camera-fixed position but tilePositionX is updated in update() for parallax
        const sky = this.add.tileSprite(W / 2, H / 2, W, H, SKY_KEY);
        sky.setScrollFactor(0).setDepth(-2);
        this.level2SkyTile = sky;

        // Black floor platform – full world width, fills from groundTop to bottom of screen
        // Dark teal floor (Japanese rooftop feel)
        const floorH = H - this.groundTop + 20;
        const floor = this.add.rectangle(worldW / 2, this.groundTop + floorH / 2, worldW, floorH, 0x1a3d35);
        floor.setDepth(0);

        // Mask fondo2 white area (belt between sky bottom and floor top)
        const gapMask = this.add.rectangle(worldW / 2, this.groundTop + 50, worldW, 120, 0x060d2a);
        gapMask.setDepth(-5);

        // Twinkling stars: animated camera-fixed rectangles over the baked sky
        let twSeed = 9999;
        const twRng = () => { twSeed = (twSeed * 1664525 + 1013904223) & 0xffffffff; return (twSeed >>> 0) / 0xffffffff; };
        for (let i = 0; i < 18; i++) {
            const tx = Math.floor(twRng() * W);
            const ty = Math.floor(twRng() * (H * 0.82));
            const tw = this.add.rectangle(tx, ty, 2, 2, 0xffffff, 0.85);
            tw.setScrollFactor(0).setDepth(-1);
            this.tweens.add({
                targets: tw,
                alpha: { from: 0.08, to: 0.95 },
                scaleX: { from: 0.7, to: 1.3 },
                scaleY: { from: 0.7, to: 1.3 },
                duration: Phaser.Math.Between(500, 2200),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2400)
            });
        }
    }

    playLevel2Entry() {
        // Simulate player climbing up the stairs from level 1 (left side entry)
        this.isClimbing = true;
        this.spawnEnabled = false;
        this.snapToStandLine(this.player, 48);
        this.player.x = 40;
        this.player.setFlipX(true);
        this.player.body.setAllowGravity(false);
        this.player.anims.play("p_walk", true);
        this.tweens.add({
            targets: this.player,
            x: this.playerMinX + 60,
            duration: 1300,
            ease: "Linear",
            onComplete: () => {
                this.player.body.setAllowGravity(true);
                this.player.anims.play("p_idle", true);
                this.isClimbing = false;
                this.spawnEnabled = true;
                this.levelStartTime = this.time.now; // timer starts after entry
                this.startNextWaveCountdown(600);
            }
        });
    }

    ensureLevel2HazardTextures() {
        if (!this.textures.exists("hazard_parachute")) {
            const gp = this.make.graphics({ x: 0, y: 0, add: false });
            gp.fillStyle(0xf5f5f5, 1);
            gp.fillEllipse(34, 16, 58, 22);
            gp.lineStyle(2, 0xb0b0b0, 1);
            gp.strokeEllipse(34, 16, 58, 22);
            gp.lineStyle(2, 0x8f8f8f, 1);
            gp.beginPath();
            gp.moveTo(18, 18); gp.lineTo(30, 32);
            gp.moveTo(34, 18); gp.lineTo(34, 34);
            gp.moveTo(50, 18); gp.lineTo(38, 32);
            gp.strokePath();
            gp.generateTexture("hazard_parachute", 68, 42);
            gp.destroy();
        }

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
        const minX = this.playerMinX + 70;
        const maxX = this.playerMaxX - 70;
        const spawnX = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-260, 260), minX, maxX);
        const spawnY = this.groundTop - Phaser.Math.Between(260, 360);

        const spider = this.physics.add.sprite(spawnX, spawnY, "enemy_kumoko");
        spider.setDisplaySize(74, 74);
        spider.body.setAllowGravity(false);
        spider.body.setSize(26, 30);
        spider.body.setOffset(24, 16);
        spider.setFlipX(false);
        spider.etype = "parachute_spider";
        spider.hp = 1;
        spider.isParachuteFalling = true;
        spider.fallSpeed = Phaser.Math.Between(96, 128);
        spider.runSpeed = Phaser.Math.Between(280, 360);
        spider.runDir = 0;
        spider.landY = this.standLineY - (spider.displayHeight / 2) + 70;
        const parachute = this.add.image(spawnX, spawnY - 42, "hazard_parachute");
        parachute.setDepth(7);
        parachute.setAlpha(0.98);
        parachute.setAngle(0);
        spider.parachute = parachute;

        this.enemies.add(spider);

        this.physics.add.overlap(spider, this.player, () => {
            if (!spider.active || spider.isDying) return;
            this.destroySpiderParachute(spider);
            spider.destroy();
            this.damagePlayer(spider.isParachuteFalling ? 10 : 16);
        });
    }

    destroySpiderParachute(spider) {
        if (!spider || !spider.parachute) return;
        if (spider.parachute.active) spider.parachute.destroy();
        spider.parachute = null;
    }

    spawnScroll() {
        const minX = this.playerMinX + 140;
        const maxX = this.playerMaxX - 140;
        const spawnX = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-280, 280), minX, maxX);
        const spawnY = this.groundTop - Phaser.Math.Between(200, 300);

        const scroll = this.physics.add.sprite(spawnX, spawnY, "hazard_scroll");
        scroll.setDisplaySize(64, 64);
        scroll.body.setAllowGravity(false);
        scroll.body.setSize(34, 44);
        scroll.body.setOffset(15, 10);
        scroll.etype = "scroll";
        scroll.hp = 1;
        scroll.fallSpeed = Phaser.Math.Between(96, 128);
        scroll.landY = this.standLineY - (scroll.displayHeight / 2) + 70;

        scroll.anims.play("scroll_fall", true);
        this.tweens.add({ targets: scroll, angle: { from: -6, to: 6 }, duration: 380, yoyo: true, repeat: -1 });

        this.enemies.add(scroll);
    }

    spawnDragon(x) {
        const dragon = this.physics.add.sprite(x, 0, "hazard_dragon");
        dragon.setDisplaySize(96, 96);
        dragon.body.setAllowGravity(false);
        dragon.body.setSize(40, 40);
        dragon.body.setOffset(12, 12);
        dragon.etype = "dragon";
        dragon.hp = 1;
        dragon.laser = null;
        dragon.y = this.standLineY - 100;

        // Face the player at spawn time (and will keep tracking in updateEnemy)
        const fireDir = this.player.x >= x ? 1 : -1;
        dragon.setFlipX(fireDir < 0);

        this.enemies.add(dragon);

        // Short windup then fire laser
        this.time.delayedCall(420, () => {
            if (!dragon.active) return;
            this.spawnLaser(dragon);
        });

        // Dragon disappears 700ms after spawning
        this.time.delayedCall(700, () => {
            if (dragon.active) dragon.destroy();
        });
    }

    spawnLaser(dragon, dirOverride) {
        if (!dragon || !dragon.active) return;
        const maxRange = 100;
        const beamH = 44;
        const dir = dirOverride ?? (this.player.x >= dragon.x ? 1 : -1);
        // Beam origin at the dragon's snout; extends outward in dir direction
        const mouthX = dragon.x + (dir * 38);
        const beamY = dragon.y + 4;          // torso height — crouching passes under
        const beamCenterX = mouthX + (dir * maxRange / 2);

        const beam = this.physics.add.sprite(beamCenterX, beamY, "hazard_flame");
        beam.setDisplaySize(maxRange, beamH);
        beam.setFlipX(dir < 0);
        beam.anims.play("flame_breath", true);
        beam.setDepth(8);
        this.physics.add.existing(beam);
        beam.body.setAllowGravity(false);
        beam.body.setImmovable(true);
        beam.body.setSize(maxRange, beamH);
        beam.body.setOffset((beam.displayWidth - maxRange) / 2, (beam.displayHeight - beamH) / 2);

        dragon.laser = beam;

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
        const minX = this.playerMinX + 90;
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
                const bossX = Phaser.Math.Clamp(this.playerMinX + 110, this.playerMinX + 70, this.playerMaxX - 90);
                this.spawnBoss(bossX);
                this.level1BossSpawned = true;
                return;
            }
            if ((this.level1BossSpawned && !this.level1BossDefeated) || this.level1BossSpawnRequested) {
                return;
            }
        }

        if (this.currentLevel === 2 && !this.level2BossDefeated) {
            if (this.wavesCleared >= this.wavesBeforeBoss && !this.level2BossSpawned) {
                this.spawnBoss2();
                return;
            }
            if (this.level2BossSpawned && !this.level2BossDefeated) return;
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
        enemy.setDisplaySize(Math.round(w * 0.96), Math.round(h * 0.94));
        if (enemy.body && enemy.body.blocked.down) this.snapToStandLine(enemy, 48);
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
                this.snapToStandLine(e, 30);
    }

    spawnBoss(x) {
        const e = this.physics.add.sprite(x, 200, "boss1");
        e.setDisplaySize(145, 194);
        this.setupEnemyBody(e, "basic");
        e.setFlipX(true);
        e.etype = "boss";
        e.hp = 10;
        e.atkCD = 0;
        e.bossWindupUntil = 0;
        e.bossStrikeAt = 0;
        e.bossRecoverUntil = 0;
        e.bossDidStrike = false;
        e.anims.stop();
        e.setTexture("boss1", 0);
        this.enemies.add(e);
        this.physics.add.collider(e, this.groundGroup);
        this.snapToStandLine(e, 48);
    }

    spawnBoss2() {
        const spawnX = this.playerMaxX - 160;
        const e = this.physics.add.sprite(spawnX, 200, "boss2");
        e.setDisplaySize(100, 180);
        this.setupEnemyBody(e, "basic");
        e.setFlipX(false);
        e.etype = "boss2";
        e.hp = 22;
        e.atkCD = 0;
        e.b2WindupUntil = 0;
        e.b2StrikeAt = 0;
        e.b2RecoverUntil = 0;
        e.b2DidStrike = false;
        e.anims.stop();
        e.setTexture("boss2", 0);
        this.enemies.add(e);
        this.physics.add.collider(e, this.groundGroup);
        this.snapToStandLine(e, 48);
        this.level2BossSpawned = true;
        this.spawnEnabled = false;
        this.clearWaveTimers();
        this.waveInProgress = false;
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

        const minX = this.playerMinX + 80;
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
        enemy.setFlipX(this.player.x < enemy.x);
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
        enemy.setFlipX(this.player.x < enemy.x);
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

    playAttackSfx() {
        if (!this.sound) return;
        this.sound.play("sfx_strongpunch", { volume: 0.5 });
    }

    getAttackBaseDamage(enemy, isKickAttack) {
        if (enemy.etype === "boss" || enemy.etype === "boss2") return 1;
        return isKickAttack ? 3 : 1;
    }

    applyBlackFlashAreaDamage(centerX, centerY, damage, primaryEnemy = null) {
        const radius = 170;
        this.enemies.children.each(enemy => {
            if (!enemy.active || enemy.isDying) return;
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            if ((dx * dx + dy * dy) > radius * radius) return;
            this.spawnPunchExplosion(enemy.x, enemy.y - 12);
            this.damageEnemy(enemy, damage);
        });
    }

    spawnBlackFlashExplosion(x, y) {
        const W = this.scale.width;
        const H = this.scale.height;
        const centerX = W / 2;
        const centerY = H / 2;

        // Darken first, then burst into the red/white hit so the contrast feels heavier.
        const preDark = this.add.rectangle(centerX, centerY, W, H, 0x000000, 0.0);
        preDark.setScrollFactor(0).setDepth(1004);
        this.tweens.add({
            targets: preDark,
            alpha: { from: 0.0, to: 0.84 },
            duration: 130,
            ease: "Quad.easeOut"
        });

        this.time.delayedCall(120, () => {
            if (!this.scene || !this.scene.isActive()) {
                if (preDark && preDark.active) preDark.destroy();
                return;
            }

            this.tweens.add({
                targets: preDark,
                alpha: 0,
                duration: 520,
                ease: "Quad.easeOut",
                onComplete: () => preDark.destroy()
            });

            const redPulse = this.add.rectangle(centerX, centerY, W, H, 0xff0000, 0.0);
            redPulse.setScrollFactor(0).setDepth(1005);
            redPulse.setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
                targets: redPulse,
                alpha: { from: 0.0, to: 0.72 },
                duration: 170,
                yoyo: true,
                hold: 260,
                ease: "Sine.easeInOut",
                onComplete: () => redPulse.destroy()
            });

            const redBloom = this.add.rectangle(centerX, centerY, W, H, 0xff3030, 0.0);
            redBloom.setScrollFactor(0).setDepth(1006);
            redBloom.setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
                targets: redBloom,
                alpha: { from: 0.0, to: 0.42 },
                duration: 130,
                yoyo: true,
                hold: 340,
                ease: "Sine.easeOut",
                onComplete: () => redBloom.destroy()
            });

            const whiteFlash = this.add.rectangle(centerX, centerY, W, H, 0xffffff, 0.24);
            whiteFlash.setScrollFactor(0).setDepth(1006);
            this.tweens.add({
                targets: whiteFlash,
                alpha: 0,
                duration: 50,
                ease: "Linear",
                onComplete: () => whiteFlash.destroy()
            });

            // Red glow lighting around the impact/rays.
            const glow = this.add.circle(x, y, 26, 0xff0000, 0.40).setDepth(1006);
            glow.setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
                targets: glow,
                radius: 320,
                alpha: 0,
                duration: 620,
                ease: "Quad.easeOut",
                onComplete: () => glow.destroy()
            });

            const giantRing = this.add.circle(centerX, centerY, 20, 0x000000, 0).setDepth(1006);
            giantRing.setScrollFactor(0);
            giantRing.setStrokeStyle(22, 0xff2a2a, 1);
            this.tweens.add({
                targets: giantRing,
                radius: Math.max(W, H) * 1.18,
                alpha: { from: 1, to: 0 },
                duration: 560,
                ease: "Cubic.easeOut",
                onComplete: () => giantRing.destroy()
            });

            // Irregular black void at impact point.
            const core = this.add.graphics({ x, y });
            core.setDepth(1007);
            const blobPts = [
                new Phaser.Math.Vector2(-18, -9),
                new Phaser.Math.Vector2(-8, -20),
                new Phaser.Math.Vector2(8, -16),
                new Phaser.Math.Vector2(18, -6),
                new Phaser.Math.Vector2(16, 6),
                new Phaser.Math.Vector2(8, 15),
                new Phaser.Math.Vector2(-5, 18),
                new Phaser.Math.Vector2(-16, 9)
            ];
            core.fillStyle(0x000000, 1);
            core.fillPoints(blobPts, true);
            core.lineStyle(4, 0xff0000, 0.98);
            core.strokePoints(blobPts, true);
            this.tweens.add({
                targets: core,
                scaleX: { from: 0.55, to: 4.6 },
                scaleY: { from: 0.45, to: 3.5 },
                alpha: { from: 1, to: 0 },
                angle: { from: -14, to: 20 },
                duration: 620,
                ease: "Expo.easeOut",
                onComplete: () => core.destroy()
            });

            // Animated lightning rays with red glow.
            const rays = 26;
            for (let i = 0; i < rays; i++) {
                const rayLen = Phaser.Math.Between(Math.floor(W * 0.28), Math.floor(W * 0.65));
                const rayW = Phaser.Math.Between(2, 7);
                const ray = this.add.rectangle(x, y, rayLen, rayW, Phaser.Math.Between(0, 1) ? 0xff3030 : 0xff0000, 1);
                ray.setOrigin(0, 0.5);
                ray.setDepth(1006);
                ray.setBlendMode(Phaser.BlendModes.ADD);

                const targetAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                ray.rotation = targetAngle + Phaser.Math.FloatBetween(-0.6, 0.6);

                this.tweens.add({
                    targets: ray,
                    rotation: targetAngle + Phaser.Math.FloatBetween(-0.08, 0.08),
                    scaleX: { from: 0.06, to: Phaser.Math.FloatBetween(1.0, 1.35) },
                    alpha: { from: 0.95, to: 0 },
                    duration: Phaser.Math.Between(360, 840),
                    ease: "Expo.easeOut",
                    onComplete: () => ray.destroy()
                });
            }

            // Screen-wide fracture lines from impact to edges.
            const fractures = 24;
            for (let i = 0; i < fractures; i++) {
                const tx = Phaser.Math.Between(0, W);
                const ty = Phaser.Math.Between(0, H);
                const dx = tx - x;
                const dy = ty - y;
                const len = Math.max(150, Math.sqrt(dx * dx + dy * dy));
                const angle = Math.atan2(dy, dx);
                const crack = this.add.rectangle(x, y, len, Phaser.Math.Between(3, 8), Phaser.Math.Between(0, 1) ? 0xff3030 : 0xff0000, 0.98);
                crack.setOrigin(0, 0.5);
                crack.setRotation(angle + Phaser.Math.FloatBetween(-0.14, 0.14));
                crack.setDepth(1006);
                crack.setBlendMode(Phaser.BlendModes.ADD);
                this.tweens.add({
                    targets: crack,
                    scaleX: { from: 0.05, to: 1.0 },
                    alpha: { from: 0.9, to: 0 },
                    duration: Phaser.Math.Between(420, 900),
                    ease: "Expo.easeOut",
                    onComplete: () => crack.destroy()
                });
            }

            // Impact debris around hit location.
            const sparks = 44;
            for (let i = 0; i < sparks; i++) {
                const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const dist = Phaser.Math.Between(70, 260);
                const px = this.add.rectangle(x, y, Phaser.Math.Between(4, 11), Phaser.Math.Between(4, 11), i % 3 === 0 ? 0xff0000 : 0x000000, 0.95);
                px.setDepth(1007);
                this.tweens.add({
                    targets: px,
                    x: x + Math.cos(ang) * dist,
                    y: y + Math.sin(ang) * dist,
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0,
                    duration: Phaser.Math.Between(360, 820),
                    ease: "Cubic.easeOut",
                    onComplete: () => px.destroy()
                });
            }
        });
    }

    playBlackFlashCue() {
        if (!this.sound) return;

        const musicAudio = MusicDirector.audio;
        const shouldResumeMusic = !!(musicAudio && !musicAudio.paused);
        if (shouldResumeMusic) musicAudio.pause();

        if (this.blackFlashCueSound && this.blackFlashCueSound.isPlaying) {
            this.blackFlashCueSound.stop();
        }

        const cue = this.sound.add("sfx_black_flash", { volume: 0.9 });
        this.blackFlashCueSound = cue;
        const token = ++this.blackFlashCueToken;

        const finalize = () => {
            if (token !== this.blackFlashCueToken) {
                cue.destroy();
                return;
            }
            if (this.blackFlashCueSound === cue) this.blackFlashCueSound = null;
            cue.destroy();
            if (shouldResumeMusic && musicAudio) {
                musicAudio.play().catch(() => {});
            }
        };

        cue.once("complete", finalize);
        cue.once("stop", finalize);
        cue.play();
    }

    tryTriggerBlackFlash(x, y, force = false) {
        if (!this.time) return false;
        if (!force && this.time.now < (this.blackFlashCooldownUntil || 0)) return false;
        if (!force && Math.random() >= (this.blackFlashChance || 0.10)) return false;

        this.blackFlashCooldownUntil = this.time.now + 240;
        this.playBlackFlashCue();

        const W = this.scale.width;
        const H = this.scale.height;

        const screenFlash = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.0);
        screenFlash.setScrollFactor(0).setDepth(1000);
        this.tweens.add({
            targets: screenFlash,
            alpha: { from: 0.0, to: 0.7 },
            duration: 45,
            yoyo: true,
            repeat: 0,
            onComplete: () => screenFlash.destroy()
        });

        const PIX = 7;
        const ring = [
            [-3, 0],[-2,-2],[-2,2],[-1,-3],[-1,3],[0,-3],[0,3],[1,-3],[1,3],[2,-2],[2,2],[3,0],
            [-2,0],[-1,-1],[-1,1],[0,-2],[0,2],[1,-1],[1,1],[2,0]
        ];
        ring.forEach(([ox, oy]) => {
            const px = x + ox * PIX;
            const py = y + oy * PIX;
            const dot = this.add.rectangle(px, py, PIX, PIX, 0x000000, 0.95);
            dot.setDepth(1001);
            this.tweens.add({
                targets: dot,
                x: px + ox * Phaser.Math.Between(6, 16),
                y: py + oy * Phaser.Math.Between(6, 16),
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: Phaser.Math.Between(140, 220),
                ease: "Cubic.easeOut",
                onComplete: () => dot.destroy()
            });
        });

        const core = this.add.rectangle(x, y, 18, 18, 0xffffff, 0.9).setDepth(1002);
        this.tweens.add({
            targets: core,
            alpha: 0,
            scaleX: 2.8,
            scaleY: 2.3,
            duration: 180,
            ease: "Quad.easeOut",
            onComplete: () => core.destroy()
        });

        this.spawnBlackFlashExplosion(x, y);

        this.cameras.main.shake(280, 0.045);
        this.time.delayedCall(95, () => {
            if (!this.scene || !this.scene.isActive()) return;
            this.cameras.main.shake(240, 0.038);
        });
        this.time.delayedCall(210, () => {
            if (!this.scene || !this.scene.isActive()) return;
            this.cameras.main.shake(200, 0.03);
        });
        return true;
    }

    spawnPunchExplosion(x, y) {
        const COLORS = [0xffffff, 0xf2f2f2, 0xdcdcdc, 0xbfbfbf];
        const PIX = 6;
        const offsets = [
            [-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],
            [-2,-1],                        [2,-1],
            [-2, 0],                        [2, 0],
            [-2, 1],                        [2, 1],
            [-2, 2],[-1, 2],[0, 2],[1, 2],[2, 2],
            [-1,-1],[1,-1],[-1,1],[1,1],
            [0,-3],[0,3],[-3,0],[3,0]
        ];
        offsets.forEach(([ox, oy]) => {
            const px = x + ox * PIX;
            const py = y + oy * PIX;
            const col = COLORS[Phaser.Math.Between(0, COLORS.length - 1)];
            const dot = this.add.rectangle(px, py, PIX, PIX, col);
            dot.setDepth(20);
            this.tweens.add({
                targets: dot,
                x: px + ox * Phaser.Math.Between(4, 14),
                y: py + oy * Phaser.Math.Between(4, 14),
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: Phaser.Math.Between(180, 320),
                ease: 'Cubic.easeOut',
                onComplete: () => dot.destroy()
            });
        });
    }

    cueLevelClearMusic() {
        if (this.levelClearCuePlayed) return;
        this.levelClearCuePlayed = true;
        MusicDirector.play("levelClear");
    }

    applyLevelClearBonus() {
        if (this.levelClearBonusApplied) {
            return { bonusLives: 0, bonusHP: 0, bonusTime: 0, bonusTotal: 0, timeLeftSeconds: 0 };
        }
        this.levelClearBonusApplied = true;

        const timeLeftMs = Math.max(0, this.levelDurationMs - (this.time.now - this.levelStartTime));
        const timeLeftSeconds = Math.floor(timeLeftMs / 1000);
        const hpLeft = Math.max(0, Math.floor(this.playerHP));
        const livesLeft = Math.max(0, this.lives);

        const bonusLives = livesLeft * 300;
        const bonusHP = hpLeft * 6;
        const bonusTime = timeLeftSeconds * 12;
        const bonusTotal = bonusLives + bonusHP + bonusTime;

        this.score += bonusTotal;
        const scoreNode = document.getElementById("score-value");
        if (scoreNode) scoreNode.textContent = this.score;

        return { bonusLives, bonusHP, bonusTime, bonusTotal, timeLeftSeconds };
    }

    reachStairs() {
        if (this.stairDone || this.isClimbing) return;
        if (this.currentLevel === 1 && !this.level1BossDefeated) return;
        if (this.currentLevel === 2 && !this.level2BossDefeated) return;
        this.stairDone = true;
        this.isClimbing = true;
        this.cueLevelClearMusic();
        this.clearWaveTimers();
        this.clearLevel2Hazards();
        this.waveInProgress = false;
        this.enemies.children.each(e => { if (e.active) e.destroy(); });
        this.player.setVelocityX(0);
        this.player.body.setAllowGravity(false);
        this.player.x = this.stairX;
        const bonus = this.applyLevelClearBonus();
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
                        lives: this.lives,
                        bonusLives: bonus.bonusLives,
                        bonusHP: bonus.bonusHP,
                        bonusTime: bonus.bonusTime,
                        bonusTotal: bonus.bonusTotal,
                        timeLeftSeconds: bonus.timeLeftSeconds
                    });
                });
            }
        });
    }

    damagePlayer(amount) {
        if (this.isStunned || this.isClimbing) return;
        this.spawnPunchExplosion(this.player.x, this.player.y - 18);
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
        if (this.attackOnCD && type !== "kick") return;

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
            // Always restart normal kick from frame 1 -> 2 on each key press.
            this.player.anims.stop();
            this.player.setTexture("player_kick", 0);
            this.player.anims.play("p_kick", false);
        } else if (isPunch) {
            this.player.anims.play("p_punch", true);
        }

        const isCrouch = type.startsWith("crouch");
        const isJump = type === "jump_kick";
        const isKickAttack = type.includes("kick");
        let rangeX = 70;
        if (type === "crouch_punch") rangeX = 50;
        else if (type.includes("kick")) rangeX = 94;
        const rangeY = isCrouch ? 28 : (isJump ? 85 : 55);
        const canDamageDwarf = type === "punch" || type === "crouch_punch" || type === "crouch_kick";
        let impactRegistered = false;
        let blackFlashTriggered = false;

        const performHit = () => {
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
                    if (enemy.etype === "parachute_spider" && !enemy.isParachuteFalling) {
                        const canHitGroundSpider = type === "crouch_punch" || type === "crouch_kick"
                            || type === "punch" || type === "kick";
                        if (!canHitGroundSpider) return;
                    }
                    if (enemy.etype === "dwarf" && !canDamageDwarf) return;
                    if (enemy.etype === "boss" && type === "crouch_kick") return;

                    if (!impactRegistered) {
                        impactRegistered = true;
                        this.playAttackSfx();
                    }
                    this.spawnPunchExplosion(enemy.x, enemy.y - 12);

                    const baseDamage = this.getAttackBaseDamage(enemy, isKickAttack);
                    let damageAmount = baseDamage;
                    const forceBlackFlash = !!this.forceBlackFlashOnNextHit;
                    if (!blackFlashTriggered) {
                        blackFlashTriggered = this.tryTriggerBlackFlash(enemy.x, enemy.y - 12, forceBlackFlash);
                        if (blackFlashTriggered) {
                            if (forceBlackFlash) this.forceBlackFlashOnNextHit = false;
                            damageAmount = baseDamage * 1.5;
                            this.applyBlackFlashAreaDamage(enemy.x, enemy.y - 12, damageAmount, enemy);
                            return;
                        }
                    }
                    if (enemy.etype === "parachute_spider") {
                        this.killEnemy(enemy);
                        return;
                    }
                    this.damageEnemy(enemy, damageAmount);
                }
            });
        };

        if (type === "kick") {
            // Kick must connect on frame 2: wait a short windup before evaluating hitboxes.
            this.time.delayedCall(70, () => {
                if (seq !== this.attackSeq) return;
                performHit();
            });
        } else {
            performHit();
        }

        const attackDurationByType = {
            punch: 260,
            crouch_punch: 320,
            kick: 340,
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
            if (enemy.etype === "parachute_spider") this.destroySpiderParachute(enemy);
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
            enemy.setDisplaySize(145, 194);
            enemy.anims.stop();
            enemy.setTexture("boss1", 5);
            enemy.anims.play("b1_die", true);
            if (this.currentLevel === 1) {
                this.level1BossDefeated = true;
                this.spawnEnabled = false;
                this.clearWaveTimers();
                this.waveInProgress = false;
            }
        } else if (enemy.etype === "boss2") {
            enemy.anims.stop();
            enemy.setTexture("boss2", 0);
            enemy.setAngle(away > 0 ? 90 : -90);
            this.level2BossDefeated = true;
            this.spawnEnabled = false;
            this.clearWaveTimers();
            this.waveInProgress = false;
            this.cueLevelClearMusic();
            // Trigger stair / win sequence after short delay
            this.time.delayedCall(1200, () => {
                this.stairDone = true;
                this.isClimbing = true;
                this.player.setVelocityX(0);
                this.player.body.setAllowGravity(false);
                const bonus = this.applyLevelClearBonus();
                this.tweens.add({
                    targets: this.player,
                    x: this.stairX,
                    duration: 900,
                    ease: "Linear",
                    onComplete: () => {
                        this.time.delayedCall(300, () => {
                            this.scene.start("LevelClearScene", {
                                level: this.currentLevel,
                                score: this.score,
                                lives: this.lives,
                                bonusLives: bonus.bonusLives,
                                bonusHP: bonus.bonusHP,
                                bonusTime: bonus.bonusTime,
                                bonusTotal: bonus.bonusTotal,
                                timeLeftSeconds: bonus.timeLeftSeconds
                            });
                        });
                    }
                });
            });
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

        // Parallax night sky for level 2
        if (this.currentLevel === 2 && this.level2SkyTile) {
            this.level2SkyTile.tilePositionX = this.cameras.main.scrollX * 0.08;
        }

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
                const bossX = Phaser.Math.Clamp(this.playerMinX + 110, this.playerMinX + 70, this.playerMaxX - 90);
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
        if (Phaser.Input.Keyboard.JustDown(this.sixKey)) {
            // Kill all existing enemies and disable further spawns
            this.enemies.children.each(e => { if (e.active) e.destroy(); });
            this.clearWaveTimers();
            this.clearLevel2Hazards();
            this.waveInProgress = false;
            this.spawnEnabled = false;

            if (this.currentLevel === 2) {
                // Teleport near boss2 spawn point and force boss2 to appear
                this.player.x = this.playerMaxX - 400;
                this.level2BossSpawned = false;
                this.level2BossDefeated = false;
                this.wavesCleared = this.wavesBeforeBoss; // satisfy wave requirement
                this.spawnBoss2();
            } else {
                // Level 1: teleport to halfway and force boss1
                this.player.x = this.bossHalfMapTriggerX - 200;
                this.level1BossSpawnRequested = false;
                this.level1BossSpawned = false;
                this.level1BossDefeated = false;
                this.spawnEnabled = true; // spawnBoss relies on beginWave flow
                this.level1BossSpawnRequested = true;
                const bossX = Phaser.Math.Clamp(this.playerMinX + 110, this.playerMinX + 70, this.playerMaxX - 90);
                this.spawnBoss(bossX);
                this.level1BossSpawned = true;
                this.spawnEnabled = false;
            }
        }
        if (Phaser.Input.Keyboard.JustDown(this.nineKey)) {
            this.forceBlackFlashOnNextHit = true;
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
                const enemyFootY = enemy.etype === "dwarf" ? 30 : 48;
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
                enemy.anims.play("b1_punch", true);

                if (!enemy.bossDidStrike && time >= (enemy.bossStrikeAt || 0)) {
                    enemy.bossDidStrike = true;
                    if (dist < 76 && Math.abs(this.player.y - enemy.y) < 65 && !this.isCrouching) {
                        this.damagePlayer(70);
                    }
                }
                return;
            }

            if (time < (enemy.bossRecoverUntil || 0)) {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx > 0);
                enemy.anims.stop();
                enemy.setTexture("boss1", 0);
                return;
            }

            if (dist > 62) {
                enemy.setVelocityX(dir * 60);
                enemy.setFlipX(enemy.body.velocity.x > 0);
                enemy.anims.play("b1_walk", true);
            } else {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx > 0);
                if (time > enemy.atkCD) {
                    enemy.bossDidStrike = false;
                    enemy.bossStrikeAt = time + 820;
                    enemy.bossWindupUntil = time + 1250;
                    enemy.bossRecoverUntil = enemy.bossWindupUntil + 1100;
                    enemy.atkCD = enemy.bossRecoverUntil + Phaser.Math.Between(1200, 1800);
                    enemy.anims.play("b1_punch", true);
                } else {
                    enemy.anims.stop();
                    enemy.setTexture("boss1", 0);
                }
            }
        } else if (enemy.etype === "boss2") {
            // --- windup phase ---
            if (time < (enemy.b2WindupUntil || 0)) {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx > 0);
                enemy.anims.play("b2_punch", true);

                if (!enemy.b2DidStrike && time >= (enemy.b2StrikeAt || 0)) {
                    enemy.b2DidStrike = true;
                    if (dist < 90 && Math.abs(this.player.y - enemy.y) < 65 && !this.isCrouching) {
                        this.damagePlayer(58);
                    }
                }
                return;
            }

            // --- recover phase ---
            if (time < (enemy.b2RecoverUntil || 0)) {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx > 0);
                enemy.anims.stop();
                enemy.setTexture("boss2", 0);
                return;
            }

            // --- move / idle ---
            if (dist > 80) {
                enemy.setVelocityX(dir * 110);
                enemy.setFlipX(enemy.body.velocity.x > 0);
                enemy.anims.play("b2_walk", true);
            } else {
                enemy.setVelocityX(0);
                enemy.setFlipX(dx > 0);
                if (time > enemy.atkCD) {
                    enemy.b2DidStrike = false;
                    enemy.b2StrikeAt = time + 320;
                    enemy.b2WindupUntil = time + 600;
                    enemy.b2RecoverUntil = enemy.b2WindupUntil + 450;
                    enemy.atkCD = enemy.b2RecoverUntil + Phaser.Math.Between(260, 620);
                } else {
                    enemy.anims.stop();
                    enemy.setTexture("boss2", 0);
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
            // Dwarf should always face the player.
            enemy.setFlipX(dx < 0);
            const dwarfLandY = this.standLineY - (30 * (enemy.displayHeight / 64)) + (enemy.displayHeight / 2);
            const canLeapFromGround = onGround || (enemy.y >= (dwarfLandY - 2));

            if (!enemy.isLeaping) {
                if (dist < 90 && dist > 24 && canLeapFromGround && time > enemy.leapCD) {
                    this.startDwarfLeap(enemy, dir, time);
                } else if (dist > 35) {
                    enemy.setVelocityX(dir * (180 * closeChaseFactor));
                    enemy.anims.play("d_walk", true);
                } else {
                    enemy.setVelocityX(0);
                    this.setDwarfIdle(enemy);
                }
            }

            if (enemy.isLeaping) {
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
                        this.snapToStandLine(enemy, 30);
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
                        this.snapToStandLine(enemy, 30);
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
            enemy.setFlipX(this.player.x < enemy.x);
        } else if (enemy.etype === "parachute_spider") {
            if (enemy.isParachuteFalling) {
                enemy.setVelocityX(0);
                enemy.setVelocityY(enemy.fallSpeed || 40);
                enemy.setAngle(-90);

                if (enemy.parachute && enemy.parachute.active) {
                    enemy.parachute.x = enemy.x;
                    enemy.parachute.y = enemy.y - 42;
                    enemy.parachute.setAngle(0);
                }

                if (enemy.y >= (enemy.landY || (this.standLineY - (enemy.displayHeight / 2)))) {
                    enemy.isParachuteFalling = false;
                    enemy.y = enemy.landY || (this.standLineY - (enemy.displayHeight / 2));
                    enemy.setVelocityY(0);
                    enemy.runDir = this.player.x >= enemy.x ? 1 : -1;
                    enemy.setFlipX(enemy.runDir > 0);
                    enemy.setAngle(0);
                    this.destroySpiderParachute(enemy);
                }
            } else {
                const runDir = enemy.runDir || 1;
                enemy.setVelocityX(runDir * (enemy.runSpeed || 300));
                enemy.setVelocityY(0);
                // Despawn once it keeps moving straight and gets far from the player (~8m).
                if (Math.abs(enemy.x - this.player.x) > 720) {
                    this.destroySpiderParachute(enemy);
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
        this.bonusLives = data.bonusLives || 0;
        this.bonusHP = data.bonusHP || 0;
        this.bonusTime = data.bonusTime || 0;
        this.bonusTotal = data.bonusTotal || 0;
        this.timeLeftSeconds = data.timeLeftSeconds || 0;
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

        this.add.text(W / 2, H * 0.60,
            "BONUS  VIDAS:+" + this.bonusLives
            + "  HP:+" + this.bonusHP
            + "  TIEMPO:+" + this.bonusTime
            + "  (" + this.timeLeftSeconds + "s)", {
            fontSize: "13px", fill: "#66ffcc", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.66, "BONUS TOTAL: +" + this.bonusTotal, {
            fontSize: "16px", fill: "#99ff66", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        const hint = this.add.text(W / 2, H * 0.72, "Pulsa ENTER para continuar", {
            fontSize: "22px", fill: "#aaaaaa", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        const isFinalLevel = this.level >= 2;
        if (isFinalLevel) {
            hint.setText("Pulsa ENTER para ver el final");
        }

        this.tweens.add({ targets: hint, alpha: 0, duration: 180, yoyo: true, repeat: -1 });

        bindEnterStart(this, hint, () => {
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
        MusicDirector.play("winLoop");
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

        this.add.text(W / 2, H * 0.66, "RESULTADO FINAL DE LA PARTIDA", {
            fontSize: "14px", fill: "#ccffdd", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        const hint = this.add.text(W / 2, H * 0.74, "Pulsa ENTER para volver al menu", {
            fontSize: "18px", fill: "#9adbb4", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);
        this.tweens.add({ targets: hint, alpha: 0, duration: 180, yoyo: true, repeat: -1 });

        bindEnterStart(this, hint, () => this.scene.start("MenuScene"));
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: "GameOverScene" }); }

    init(data) { this.score = data.score || 0; }

    create() {
        MusicDirector.play("loseLoop");
        const W = this.scale.width, H = this.scale.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0x110000);
        this.add.text(W / 2, H * 0.28, "GAME OVER", {
            fontSize: "72px", fill: "#cc0000", fontFamily: PIXEL_FONT,
            stroke: "#440000", strokeThickness: 7
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.52, "Puntuacion: " + this.score, {
            fontSize: "30px", fill: "#ffffff", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.62, "RESULTADO FINAL DE LA PARTIDA", {
            fontSize: "14px", fill: "#ff9999", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        const hint = this.add.text(W / 2, H * 0.72, "Pulsa ENTER para volver al menu", {
            fontSize: "20px", fill: "#888888", fontFamily: PIXEL_FONT
        }).setOrigin(0.5);

        this.tweens.add({ targets: hint, alpha: 0, duration: 180, yoyo: true, repeat: -1 });

        bindEnterStart(this, hint, () => this.scene.start("MenuScene"));
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
