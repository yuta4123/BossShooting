// =====================
// 設定
// =====================
const GAME_W = 400, GAME_H = 600;
const PLAYER_SPEED = 6;
const BULLET_SPEED = 8;
const ENEMY_BULLET_SPEED = 4;
const stages = window.stages || [];
const STAGE_MAX = stages.length;
const PLAYER_MAX_HP = 5;

let stage = 1;
let isGameOver = false;
let isClear = false;
let canShoot = true;

// DOM取得
const gameArea = document.getElementById('gameArea');
const info = document.getElementById('info');
const msg = document.getElementById('msg');

// ゲーム状態
let player = {};
let bullets = [];
let boss = {};
let enemyBullets = [];
let keys = {};

// =====================
// ゲーム初期化
// =====================
function init(stageNum=1) {
  gameArea.innerHTML = '<div id="msg"></div>';
  msg.textContent = "";
  bullets = [];
  enemyBullets = [];
  keys = {};
  isGameOver = false;
  isClear = false;
  canShoot = true;
  stage = stageNum;

  player = {
    x: GAME_W/2 - 18,
    y: GAME_H - 60,
    hp: PLAYER_MAX_HP,
    node: null,
  };
  // 自機描画
  player.node = document.createElement('div');
  player.node.className = 'player';
  setPos(player.node, player.x, player.y);
  gameArea.appendChild(player.node);

  // ボス描画
  const stageInfo = stages[stage-1];
  boss = {
    x: GAME_W/2 - 40,
    y: 40,
    hp: stageInfo.hp,
    maxHp: stageInfo.hp,
    name: stageInfo.name,
    color: stageInfo.color,
    node: null,
    moveAngle: 0
  };
  boss.node = document.createElement('div');
  boss.node.className = 'boss';
  boss.node.style.background = boss.color;
  boss.node.textContent = boss.name;
  setPos(boss.node, boss.x, boss.y);
  gameArea.appendChild(boss.node);

  updateInfo();

  requestAnimationFrame(gameLoop);
}

// =====================
// 描画位置を更新
// =====================
function setPos(node, x, y) {
  node.style.left = x + 'px';
  node.style.top = y + 'px';
}

// =====================
// ゲームループ
// =====================
function gameLoop() {
  if (isGameOver || isClear) return;

  // 自機操作
  if (keys["ArrowLeft"] && player.x > 0) player.x -= PLAYER_SPEED;
  if (keys["ArrowRight"] && player.x < GAME_W - 36) player.x += PLAYER_SPEED;
  setPos(player.node, player.x, player.y);

  // ショット
  if (keys[" "] && canShoot) {
    canShoot = false;
    shoot();
    setTimeout(()=>canShoot=true, 200);
  }

  // 自機弾移動
  bullets.forEach((b, i) => {
    b.y -= BULLET_SPEED;
    setPos(b.node, b.x, b.y);
    // 画面外
    if (b.y < -16) {
      gameArea.removeChild(b.node);
      bullets.splice(i, 1);
    }
  });

  // ボスの簡単な左右移動
  boss.moveAngle += 0.02 + 0.01 * stage;
  boss.x = GAME_W/2 - 40 + Math.sin(boss.moveAngle) * (40 + 10 * stage);
  setPos(boss.node, boss.x, boss.y);

  // ボス弾発射
  if (Math.random() < 0.02 + 0.01 * stage) bossShoot();

  // ボス弾移動
  enemyBullets.forEach((b, i) => {
    b.y += ENEMY_BULLET_SPEED;
    setPos(b.node, b.x, b.y);
    if (b.y > GAME_H) {
      gameArea.removeChild(b.node);
      enemyBullets.splice(i, 1);
    }
  });

  // 衝突判定（自機弾→ボス）
  bullets.forEach((b, i) => {
    if (isHit(b, boss, 32)) {
      boss.hp--;
      updateInfo();
      gameArea.removeChild(b.node);
      bullets.splice(i, 1);
      if (boss.hp <= 0) bossDefeated();
    }
  });

  // 衝突判定（ボス弾→自機）
  enemyBullets.forEach((b, i) => {
    if (isHit(b, player, 24)) {
      player.hp--;
      updateInfo();
      gameArea.removeChild(b.node);
      enemyBullets.splice(i, 1);
      if (player.hp <= 0) gameOver();
    }
  });

  requestAnimationFrame(gameLoop);
}

// =====================
// 自機ショット
// =====================
function shoot() {
  const bullet = {
    x: player.x + 14,
    y: player.y - 12,
    node: document.createElement('div'),
  };
  bullet.node.className = 'bullet';
  setPos(bullet.node, bullet.x, bullet.y);
  gameArea.appendChild(bullet.node);
  bullets.push(bullet);
}

// =====================
// ボス弾
// =====================
function bossShoot() {
  const bullet = {
    x: boss.x + 34 + Math.random()*12,
    y: boss.y + 74,
    node: document.createElement('div'),
  };
  bullet.node.className = 'enemyBullet';
  setPos(bullet.node, bullet.x, bullet.y);
  gameArea.appendChild(bullet.node);
  enemyBullets.push(bullet);
}

// =====================
// 衝突判定
// =====================
function isHit(a, b, r) {
  const dx = (a.x + 8) - (b.x + 40);
  const dy = (a.y + 8) - (b.y + 40);
  return dx*dx + dy*dy < r*r;
}

// =====================
// ボス撃破
// =====================
function bossDefeated() {
  if (stage < STAGE_MAX) {
    isClear = true;
    showMessage(`ステージ${stage}クリア！<br><button id="nextStageBtn">次のステージへ</button>`);
    document.getElementById('nextStageBtn').onclick = () => init(stage+1);
  } else {
    isClear = true;
    showMessage(`全ステージクリア！<br><button id="restartBtn">もう一度遊ぶ</button>`);
    document.getElementById('restartBtn').onclick = () => init(1);
  }
}

// =====================
// ゲームオーバー
// =====================
function gameOver() {
  isGameOver = true;
  location.href = 'gameover.html';
}

// =====================
// 情報表示
// =====================
function updateInfo() {
  info.innerHTML = `STAGE: ${stage}　プレイヤーHP: ${player.hp}　ボスHP: ${boss.hp}/${boss.maxHp}`;
}

// =====================
// メッセージ表示
// =====================
function showMessage(html) {
  msg.innerHTML = html;
}

// =====================
// キー操作
// =====================
document.addEventListener('keydown', e => {
  if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  keys[e.key] = true;
});
document.addEventListener('keyup', e => {
  keys[e.key] = false;
});

// =====================
// ゲーム開始
// =====================
init(1);
