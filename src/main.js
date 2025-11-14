const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let w = 0;
let h = 0;
let stars1 = [];
let stars2 = [];
let stars3 = [];
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  initStars();
}
resize();
window.addEventListener("resize", resize);

let running = false;
const startEl = document.getElementById("start");
const startBtn = document.getElementById("startBtn");
const titleEl = document.getElementById("title");
const infoEl = document.getElementById("info");
const levelupEl = document.getElementById("levelup");
const choicesEl = document.getElementById("choices");
startBtn.addEventListener("click", () => {
  if (!running) {
    startEl.classList.add("hidden");
    reset();
    running = true;
    titleEl.textContent = "雷电 - Web 版";
    infoEl.textContent = "按空格发射，方向键或 WASD 移动";
    levelupEl.classList.add("hidden");
  }
});

const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyF" && !autoFireLock) {
    autoFire = !autoFire;
    autoFireLock = true;
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
  if (e.code === "KeyK") bombLock = false;
  if (e.code === "KeyL") overdriveLock = false;
  if (e.code === "KeyF") autoFireLock = false;
});

// Predeclare runtime flags used in early event handlers to avoid TDZ errors
let bombLock = false;
let overdriveLock = false;
let autoFire = false;
let autoFireLock = false;

const player = {
  x: 0,
  y: 0,
  w: 64,
  h: 60,
  speed: 360,
  fireRate: 0.12,
  cooldown: 0,
};
const bullets = [];
const enemies = [];
let spawnTimer = 0;
const particles = [];
let score = 0;
let lives = 3;
let invincible = 0;
let wingmanLevel = 1;
let wingmanTimer = 0;
let missiles = [];
let missileTimer = 0;
let missileRate = 0.6;
let level = 1;
let nextLevelScore = 100;
let paused = false;
let spreadLevel = 1;
let fireRateFactor = 1;
let bombCharges = 0;
let overdriveCharges = 0;
let overdriveTimer = 0;
let shake = 0;
const ART_PATH = "assets/images/";
const art = {
  player: new Image(),
  wingman: new Image(),
  star1: new Image(),
  star2: new Image(),
  star3: new Image(),
  bgBlue: new Image(),
  bgPurple: new Image(),
  enemies: {
    straight: new Image(),
    zigzag: new Image(),
    drone: new Image(),
    sweeper: new Image(),
    tank: new Image(),
    spinner: new Image(),
  },
};
function initArt() {
  art.player.src = ART_PATH + "playerShip2_blue.png";
  art.wingman.src = ART_PATH + "playerShip1_blue.png";
  art.star1.src = ART_PATH + "star1.png";
  art.star2.src = ART_PATH + "star2.png";
  art.star3.src = ART_PATH + "star3.png";
  art.bgBlue.src = ART_PATH + "blue.png";
  art.bgPurple.src = ART_PATH + "purple.png";
  art.enemies.straight.src = ART_PATH + "enemyRed1.png";
  art.enemies.zigzag.src = ART_PATH + "enemyBlue3.png";
  art.enemies.drone.src = ART_PATH + "enemyGreen1.png";
  art.enemies.sweeper.src = ART_PATH + "enemyYellow2.png";
  art.enemies.tank.src = ART_PATH + "enemyRed4.png";
  art.enemies.spinner.src = ART_PATH + "enemyBlack4.png";
}
initArt();
let bg1 = 0;
let bg2 = 0;
function gameOver() {
  running = false;
  titleEl.textContent = "游戏结束";
  infoEl.textContent = "分数: " + score + "，点击开始重新挑战";
  startBtn.textContent = "重新开始";
  startEl.classList.remove("hidden");
  levelupEl.classList.add("hidden");
}
function reset() {
  player.x = w / 2;
  player.y = h - 80;
  bullets.length = 0;
  player.cooldown = 0;
  enemies.length = 0;
  spawnTimer = 0;
  score = 0;
  lives = 3;
  invincible = 0;
  wingmanLevel = 1;
  wingmanTimer = 0;
  missiles.length = 0;
  missileTimer = 0;
  missileRate = 0.6;
  level = 1;
  nextLevelScore = 100;
  paused = false;
  spreadLevel = 1;
  fireRateFactor = 1;
  bombCharges = 0;
  overdriveCharges = 0;
  overdriveTimer = 0;
  bombLock = false;
  overdriveLock = false;
  levelupEl.classList.add("hidden");
  autoFire = false;
  autoFireLock = false;
}
function initStars() {
  stars1 = [];
  stars2 = [];
  stars3 = [];
  for (let i = 0; i < 200; i++)
    stars1.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1,
      s: 60 + Math.random() * 80,
    });
  for (let i = 0; i < 90; i++)
    stars2.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.6,
      s: 120 + Math.random() * 140,
    });
  for (let i = 0; i < 40; i++)
    stars3.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 2.2,
      s: 200 + Math.random() * 220,
    });
}
function showLevelUp() {
  paused = true;
  level += 1;
  choicesEl.innerHTML = "";
  const pool = ["射速+15%", "扩散+1", "速度+10%", "炸弹+1", "狂热+1"];
  const opts = [];
  while (opts.length < 3 && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    opts.push(pool.splice(i, 1)[0]);
  }
  for (const t of opts) {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = t;
    b.onclick = () => {
      if (t === "射速+15%") fireRateFactor *= 0.85;
      else if (t === "扩散+1") spreadLevel += 1;
      else if (t === "速度+10%") player.speed *= 1.1;
      else if (t === "炸弹+1") bombCharges += 1;
      else if (t === "狂热+1") overdriveCharges += 1;
      nextLevelScore += 150 + level * 50;
      levelupEl.classList.add("hidden");
      paused = false;
    };
    choicesEl.appendChild(b);
  }
  levelupEl.classList.remove("hidden");
}

let last = performance.now();
function loop(t) {
  const dt = Math.min(0.016, (t - last) / 1000);
  last = t;
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#02030a");
  g.addColorStop(1, "#050a1a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  bg1 += 12 * dt;
  bg2 += 24 * dt;
  if (art.bgBlue.complete && art.bgBlue.naturalWidth) {
    const iw = art.bgBlue.naturalWidth;
    const ih = art.bgBlue.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const sy = Math.floor(bg1 % ih);
    const dhTop = Math.floor((ih - sy) * scale);
    const dhBot = Math.floor(sy * scale);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(
      art.bgBlue,
      0,
      sy,
      iw,
      ih - sy,
      Math.floor((w - iw * scale) / 2),
      0,
      Math.floor(iw * scale),
      dhTop
    );
    if (sy > 0)
      ctx.drawImage(
        art.bgBlue,
        0,
        0,
        iw,
        sy,
        Math.floor((w - iw * scale) / 2),
        dhTop,
        Math.floor(iw * scale),
        dhBot
      );
    ctx.globalAlpha = 1;
  }
  if (art.bgPurple.complete && art.bgPurple.naturalWidth) {
    const iw = art.bgPurple.naturalWidth;
    const ih = art.bgPurple.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const sy = Math.floor(bg2 % ih);
    const dhTop = Math.floor((ih - sy) * scale);
    const dhBot = Math.floor(sy * scale);
    ctx.globalAlpha = 0.35;
    ctx.drawImage(
      art.bgPurple,
      0,
      sy,
      iw,
      ih - sy,
      Math.floor((w - iw * scale) / 2),
      0,
      Math.floor(iw * scale),
      dhTop
    );
    if (sy > 0)
      ctx.drawImage(
        art.bgPurple,
        0,
        0,
        iw,
        sy,
        Math.floor((w - iw * scale) / 2),
        dhTop,
        Math.floor(iw * scale),
        dhBot
      );
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.6;
  for (const s of stars1) {
    s.y += s.s * dt;
    if (s.y > h + 8) s.y -= h + 16;
    if (art.star1.complete && art.star1.naturalWidth) {
      ctx.drawImage(art.star1, s.x, s.y, 1, 1);
    } else {
      ctx.fillStyle = "#6cf";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
  }
  ctx.globalAlpha = 0.85;
  for (const s of stars2) {
    s.y += s.s * dt;
    if (s.y > h + 8) s.y -= h + 16;
    if (art.star2.complete && art.star2.naturalWidth) {
      ctx.drawImage(art.star2, s.x, s.y, 2, 2);
    } else {
      ctx.fillStyle = "#9df";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
  }
  ctx.globalAlpha = 1;
  for (const s of stars3) {
    s.y += s.s * dt;
    if (s.y > h + 8) s.y -= h + 16;
    if (art.star3.complete && art.star3.naturalWidth) {
      ctx.drawImage(art.star3, s.x, s.y, 3, 3);
    } else {
      ctx.fillStyle = "#cfe";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
  }
  ctx.globalCompositeOperation = "source-over";
  if (running) {
    if (paused) {
      ctx.fillStyle = "#0ff";
      ctx.font = "16px system-ui";
      ctx.fillText("分数: " + score, 20, 28);
      ctx.fillText("生命: " + lives, 20, 50);
      ctx.fillText("等级: " + level, 20, 72);
      ctx.fillText("自动(F): " + (autoFire ? "开" : "关"), 20, 94);
      requestAnimationFrame(loop);
      return;
    }
    let vx = 0;
    let vy = 0;
    if (keys["ArrowLeft"] || keys["KeyA"]) vx -= 1;
    if (keys["ArrowRight"] || keys["KeyD"]) vx += 1;
    if (keys["ArrowUp"] || keys["KeyW"]) vy -= 1;
    if (keys["ArrowDown"] || keys["KeyS"]) vy += 1;
    const len = Math.hypot(vx, vy) || 1;
    player.x += (vx / len) * player.speed * dt;
    player.y += (vy / len) * player.speed * dt;
    {
      const mx = player.w / 2 + 10;
      const my = player.h / 2 + 10;
      if (player.x < mx) player.x = mx;
      if (player.x > w - mx) player.x = w - mx;
      if (player.y < my) player.y = my;
      if (player.y > h - my) player.y = h - my;
    }

    player.cooldown -= dt;
    const rate = (overdriveTimer > 0 ? 0.06 : 0.12) * fireRateFactor;
    const isFiring = autoFire || keys["Space"] || keys["KeyJ"];
    if (isFiring && player.cooldown <= 0) {
      const noseY =
        player.y - player.h / 2 + Math.max(2, Math.round(player.h * 0.03));
      const sideOff = Math.max(6, Math.round(player.w * 0.2));
      const leftX = player.x - player.w / 2 + sideOff;
      const rightX = player.x + player.w / 2 - sideOff;
      const gunY =
        player.y - player.h / 2 + Math.max(8, Math.round(player.h * 0.18));
      bullets.push({
        x: player.x,
        y: noseY,
        vx: 0,
        vy: overdriveTimer > 0 ? -760 : -700,
        r: 3,
      });
      for (let i = 0; i < spreadLevel; i++) {
        const sv = 60 + i * 40;
        bullets.push({
          x: leftX,
          y: gunY,
          vx: -sv,
          vy: -680,
          r: 3,
        });
        bullets.push({
          x: rightX,
          y: gunY,
          vx: sv,
          vy: -680,
          r: 3,
        });
      }
      if (overdriveTimer > 0)
        bullets.push({
          x: player.x,
          y: noseY - 6,
          vx: 0,
          vy: -760,
          r: 3,
        });
      player.cooldown = rate;
    }
    wingmanTimer -= dt;
    if (wingmanLevel > 0 && isFiring && wingmanTimer <= 0) {
      const spacing = 32;
      for (let i = 0; i < wingmanLevel; i++) {
        const off = (i - (wingmanLevel - 1) / 2) * spacing * 1.4;
        bullets.push({
          x: player.x + off,
          y: player.y - player.h / 2 - 4,
          vx: 0,
          vy: -680,
          r: 3,
        });
        bullets.push({
          x: player.x + off,
          y: player.y - player.h / 2,
          vx: off * 2,
          vy: -640,
          r: 3,
        });
      }
      wingmanTimer = (overdriveTimer > 0 ? 0.09 : 0.18) * fireRateFactor;
    }
    missileTimer -= dt;
    if (missileTimer <= 0) {
      missiles.push({
        x: player.x,
        y: player.y - player.h / 2 + 2,
        vx: 0,
        vy: -260,
        r: 4,
      });
      missileTimer = missileRate;
    }
    if (overdriveTimer > 0) overdriveTimer -= dt;
    if (keys["KeyK"] && !bombLock && bombCharges > 0) {
      bombLock = true;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        for (let k = 0; k < 12; k++) {
          const a = Math.random() * Math.PI * 2;
          const s = 80 + Math.random() * 220;
          particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 0.5,
            r: 2 + Math.random() * 3,
          });
        }
      }
      enemies.length = 0;
      bombCharges -= 1;
    }
    if (
      keys["KeyL"] &&
      !overdriveLock &&
      overdriveCharges > 0 &&
      overdriveTimer <= 0
    ) {
      overdriveLock = true;
      overdriveTimer = 6;
      overdriveCharges -= 1;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      let removed = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const ex = e.x - e.w / 2;
        const ey = e.y - e.h / 2;
        if (b.x >= ex && b.x <= ex + e.w && b.y >= ey && b.y <= ey + e.h) {
          e.hp -= 1;
          removed = true;
          bullets.splice(i, 1);
          if (e.hp <= 0) {
            enemies.splice(j, 1);
            for (let k = 0; k < 16; k++) {
              const a = Math.random() * Math.PI * 2;
              const s = 80 + Math.random() * 240;
              particles.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: 0.6,
                r: 2 + Math.random() * 3,
                c: e.c,
              });
            }
            score += 10;
            if (score >= nextLevelScore) showLevelUp();
            shake = Math.min(shake + 3, 10);
          }
          break;
        }
      }
      if (!removed && (b.y < -20 || b.x < -20 || b.x > w + 20))
        bullets.splice(i, 1);
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const ex = 40 + Math.random() * (w - 80);
        let type = "straight";
        const p = Math.random();
        if (level < 3) {
          type = p < 0.5 ? "straight" : p < 0.85 ? "zigzag" : "drone";
        } else if (level < 6) {
          type =
            p < 0.35
              ? "straight"
              : p < 0.6
              ? "zigzag"
              : p < 0.8
              ? "drone"
              : p < 0.95
              ? "sweeper"
              : "tank";
        } else {
          type =
            p < 0.3
              ? "straight"
              : p < 0.5
              ? "zigzag"
              : p < 0.7
              ? "drone"
              : p < 0.85
              ? "sweeper"
              : p < 0.95
              ? "tank"
              : "spinner";
        }
        let wv = 26,
          hv = 18,
          hpv = 3,
          cv = "#f66";
        if (type === "zigzag") {
          cv = "#fa6";
        }
        if (type === "drone") {
          wv = 18;
          hv = 16;
          hpv = 2;
          cv = "#6cf";
        }
        if (type === "sweeper") {
          wv = 28;
          hv = 16;
          hpv = 3;
          cv = "#9ef";
        }
        if (type === "tank") {
          wv = 34;
          hv = 22;
          hpv = 6;
          cv = "#f44";
        }
        if (type === "spinner") {
          wv = 22;
          hv = 22;
          hpv = 4;
          cv = "#ff8";
        }
        enemies.push({
          x: ex,
          y: -40 - i * 30,
          w: wv,
          h: hv,
          hp: hpv,
          type,
          t: Math.random() * 10,
          c: cv,
        });
      }
      spawnTimer = 1.1 - Math.min(level * 0.02, 0.5);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.t += dt;
      if (e.type === "zigzag") {
        e.x += Math.sin(e.t * 2.6) * 140 * dt;
        e.y += 160 * dt;
      } else if (e.type === "sweeper") {
        e.x += Math.cos(e.t * 1.4) * 220 * dt;
        e.y += 180 * dt;
      } else if (e.type === "drone") {
        e.x += Math.sin(e.t * 5) * 60 * dt;
        e.y += 220 * dt;
      } else if (e.type === "tank") {
        e.x += Math.sin(e.t * 1.2) * 40 * dt;
        e.y += 120 * dt;
      } else if (e.type === "spinner") {
        e.x += Math.sin(e.t * 3) * 80 * dt;
        e.y += 150 * dt;
      } else {
        e.y += 200 * dt;
      }
      if (e.y > h + 40) enemies.splice(i, 1);
    }

    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      let target = null;
      let best = Infinity;
      for (const e of enemies) {
        const dx = e.x - m.x;
        const dy = e.y - m.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) {
          best = d2;
          target = e;
        }
      }
      if (target) {
        const dx = target.x - m.x;
        const dy = target.y - m.y;
        const len = Math.hypot(dx, dy) || 1;
        const desx = (dx / len) * 320;
        const desy = (dy / len) * 320;
        m.vx += (desx - m.vx) * 3.5 * dt;
        m.vy += (desy - m.vy) * 3.5 * dt;
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      particles.push({
        x: m.x,
        y: m.y,
        vx: -m.vx * 0.15 + (Math.random() - 0.5) * 40,
        vy: -m.vy * 0.15 + (Math.random() - 0.5) * 40,
        life: 0.35,
        r: 1.5,
        c: "#ccc",
      });
      let hitIndex = -1;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const ex = e.x - e.w / 2;
        const ey = e.y - e.h / 2;
        if (m.x >= ex && m.x <= ex + e.w && m.y >= ey && m.y <= ey + e.h) {
          hitIndex = j;
          break;
        }
      }
      if (hitIndex !== -1) {
        const e = enemies[hitIndex];
        e.hp -= 2;
        missiles.splice(i, 1);
        for (let k = 0; k < 18; k++) {
          const a = Math.random() * Math.PI * 2;
          const s = 80 + Math.random() * 240;
          particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 0.6,
            r: 2 + Math.random() * 3,
            c: e.c,
          });
        }
        if (e.hp <= 0) {
          enemies.splice(hitIndex, 1);
          score += 10;
          if (score >= nextLevelScore) showLevelUp();
        }
        shake = Math.min(shake + 4, 10);
        continue;
      }
      if (m.y < -40 || m.x < -40 || m.x > w + 40 || m.y > h + 60)
        missiles.splice(i, 1);
    }

    if (invincible > 0) invincible -= dt;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const px = player.x - player.w / 2;
      const py = player.y - player.h / 2;
      if (
        e.x + e.w / 2 >= px &&
        e.x - e.w / 2 <= px + player.w &&
        e.y + e.h / 2 >= py &&
        e.y - e.h / 2 <= py + player.h
      ) {
        enemies.splice(i, 1);
        for (let k = 0; k < 24; k++) {
          const a = Math.random() * Math.PI * 2;
          const s = 60 + Math.random() * 200;
          particles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 0.4,
            r: 2 + Math.random() * 2,
          });
        }
        if (invincible <= 0) {
          lives -= 1;
          if (lives <= 0) {
            lives = 0;
            for (let k = 0; k < 40; k++) {
              const a = Math.random() * Math.PI * 2;
              const s = 80 + Math.random() * 260;
              particles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: 0.8,
                r: 2 + Math.random() * 3,
              });
            }
            shake = Math.min(shake + 6, 12);
            gameOver();
          } else {
            shake = Math.min(shake + 2, 8);
            invincible = 1.2;
          }
        }
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    ctx.save();
    if (shake > 0) {
      const ox = (Math.random() * 2 - 1) * shake;
      const oy = (Math.random() * 2 - 1) * shake;
      ctx.translate(ox, oy);
      shake *= 0.9;
    }
    ctx.save();
    ctx.translate(player.x, player.y);
    const useImg = art.player && art.player.complete && art.player.naturalWidth;
    if (useImg) {
      ctx.drawImage(
        art.player,
        -player.w / 2,
        -player.h / 2,
        player.w,
        player.h
      );
    } else {
      const hg = ctx.createLinearGradient(-player.w / 2, 0, player.w / 2, 0);
      hg.addColorStop(0, "#8ac");
      hg.addColorStop(0.5, "#bce");
      hg.addColorStop(1, "#8ac");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(0, -player.h / 2 - 2);
      ctx.lineTo(player.w / 2 - 6, -player.h / 2 + 4);
      ctx.lineTo(player.w / 2, 0);
      ctx.lineTo(player.w / 2 - 8, player.h / 2 - 2);
      ctx.lineTo(-player.w / 2 + 8, player.h / 2 - 2);
      ctx.lineTo(-player.w / 2, 0);
      ctx.lineTo(-player.w / 2 + 6, -player.h / 2 + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#def";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const cg = ctx.createLinearGradient(
        0,
        -player.h / 2,
        0,
        -player.h / 2 + 12
      );
      cg.addColorStop(0, "#eaf");
      cg.addColorStop(1, "#a9d");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, -player.h / 2 + 8, 6, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#bde";
      ctx.fillRect(-player.w / 2 + 6, -2, 6, 4);
      ctx.fillRect(player.w / 2 - 12, -2, 6, 4);
      const thr = ctx.createLinearGradient(
        0,
        player.h / 2,
        0,
        player.h / 2 + 22
      );
      thr.addColorStop(0, "#0ff");
      thr.addColorStop(1, "#05f0");
      ctx.fillStyle = thr;
      ctx.beginPath();
      ctx.moveTo(-8, player.h / 2 + 2);
      ctx.lineTo(-12, player.h / 2 + 22);
      ctx.lineTo(12, player.h / 2 + 22);
      ctx.lineTo(8, player.h / 2 + 2);
      ctx.closePath();
      ctx.fill();
      const gl = ctx.createRadialGradient(
        0,
        player.h / 2 + 12,
        0,
        0,
        player.h / 2 + 12,
        16
      );
      gl.addColorStop(0, "#0ff8");
      gl.addColorStop(1, "#0ff0");
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(0, player.h / 2 + 12, 16, 0, Math.PI * 2);
      ctx.fill();
      const tw = 0.5 + 0.5 * Math.sin(last * 0.05);
      ctx.globalAlpha = 0.5 + 0.5 * tw;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-player.w / 2 + 6, -4, 2.2, 0, Math.PI * 2);
      ctx.arc(player.w / 2 - 6, -4, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (wingmanLevel > 0) {
      const spacing = 32;
      for (let i = 0; i < wingmanLevel; i++) {
        const off = (i - (wingmanLevel - 1) / 2) * spacing * 1.4;
        const wx = player.x + off;
        const wy = player.y - 24 - Math.sin(last * 0.02 + i) * 4;
        ctx.save();
        ctx.translate(wx, wy);
        const useWing =
          art.wingman && art.wingman.complete && art.wingman.naturalWidth;
        if (useWing) {
          ctx.drawImage(art.wingman, -10, -10, 20, 20);
        } else {
          const wg = ctx.createLinearGradient(-10, 0, 10, 0);
          wg.addColorStop(0, "#8ac");
          wg.addColorStop(0.5, "#bce");
          wg.addColorStop(1, "#8ac");
          ctx.fillStyle = wg;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(10, -2);
          ctx.lineTo(8, 10);
          ctx.lineTo(-8, 10);
          ctx.lineTo(-10, -2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#def";
          ctx.lineWidth = 1;
          ctx.stroke();
          const wc = ctx.createLinearGradient(0, -10, 0, 0);
          wc.addColorStop(0, "#eaf");
          wc.addColorStop(1, "#a9d");
          ctx.fillStyle = wc;
          ctx.beginPath();
          ctx.arc(0, -5, 3, Math.PI, 0);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#fffd";
    for (const b of bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#f5f";
    for (const m of missiles) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const e of enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const img = art.enemies[e.type];
      const useEImg = img && img.complete && img.naturalWidth;
      if (useEImg) {
        ctx.drawImage(img, -e.w / 2, -e.h / 2, e.w, e.h);
      } else {
        if (e.type === "drone") {
          ctx.fillStyle = e.c;
          ctx.beginPath();
          ctx.moveTo(0, -e.h / 2);
          ctx.lineTo(-e.w / 2, e.h / 2);
          ctx.lineTo(e.w / 2, e.h / 2);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === "sweeper") {
          const gg = ctx.createLinearGradient(-e.w / 2, 0, e.w / 2, 0);
          gg.addColorStop(0, e.c);
          gg.addColorStop(1, "#fff4");
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.moveTo(0, -e.h / 2);
          ctx.lineTo(e.w / 2, 0);
          ctx.lineTo(0, e.h / 2);
          ctx.lineTo(-e.w / 2, 0);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === "tank") {
          const gg = ctx.createLinearGradient(-e.w / 2, 0, e.w / 2, 0);
          gg.addColorStop(0, e.c);
          gg.addColorStop(1, "#fff3");
          ctx.fillStyle = gg;
          ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
          ctx.fillStyle = "#ddd";
          ctx.fillRect(-6, -e.h / 2 - 2, 12, 6);
          ctx.fillStyle = "#fff8";
          ctx.beginPath();
          ctx.arc(0, -e.h / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === "spinner") {
          const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, e.w / 2);
          rg.addColorStop(0, "#fff8");
          rg.addColorStop(1, "#fff0");
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.rotate(e.t * 5);
          ctx.strokeStyle = "#fff6";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -e.w / 2);
          ctx.lineTo(0, e.w / 2);
          ctx.stroke();
        } else {
          const gg = ctx.createLinearGradient(-e.w / 2, 0, e.w / 2, 0);
          gg.addColorStop(0, e.c);
          gg.addColorStop(1, "#fff4");
          ctx.fillStyle = gg;
          ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
          ctx.fillStyle = "#fff8";
          ctx.fillRect(-4, 0, 8, 4);
        }
      }
      ctx.restore();
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / 0.6);
      ctx.fillStyle = p.c || "#fd7";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#0ff";
    ctx.font = "16px system-ui";
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 8;
    ctx.fillText("分数: " + score, 20, 28);
    ctx.fillText("生命: " + lives, 20, 50);
    ctx.fillText("等级: " + level, 20, 72);
    ctx.fillText("炸弹(K): " + bombCharges, 20, 94);
    ctx.fillText("狂热(L): " + overdriveCharges, 20, 116);
    ctx.fillText("自动(F): " + (autoFire ? "开" : "关"), 20, 138);
    ctx.shadowBlur = 0;
    if (invincible > 0) {
      ctx.globalAlpha = 0.12 + Math.abs(Math.sin(last * 0.02)) * 0.3;
      ctx.strokeStyle = "#0ff";
      ctx.beginPath();
      ctx.arc(player.x, player.y, Math.max(player.w, player.h), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const vg = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.45,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.7
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
