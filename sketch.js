let walkImg, jumpImg, fallImg;
let walkFrames = [];
let jumpFrames = [];
let fallFrames = [];

let bgImg;             // 背景圖片
let bgX = 0;           // 背景滾動偏移量
let bgScrollSpeed = 1; // 背景滾動速度

let x, y;          // 角色的座標
let groundY = 380; // 地面高度
let vy = 0;        // 垂直速度（重力用）
let gravity = 0.6; // 重力加速度
let jumpForce = -11; // 跳躍初始速度
let speed = 4;     // 移動速度

let currentFrame = 0;
let animSpeed = 0.2; // 動畫播放速度
let frameCounter = 0;
let jumpFrameCounter = 0;
let fallFrameCounter = 0;

let facing = 1;    // 原始圖片朝左，-1 表示水平翻轉朝右
let state = 'idle'; // 當前狀態：'idle'(靜止), 'walk'(走路), 'jump'(跳躍), 'fall'(跌倒中), 'fallen'(已倒地)

// 用於 v5 預覽面板的鍵盤狀態追蹤
let keys = {};

function preload() {
  walkImg = loadImage('角色資料/走.png', () => {
    console.log('走路角色圖片載入成功');
  }, (error) => {
    console.error('走路角色圖片載入失敗，將使用內建角色圖形。', error);
  });
  jumpImg = loadImage('角色資料/跳.png', () => {
    console.log('跳躍角色圖片載入成功');
  }, (error) => {
    console.error('跳躍角色圖片載入失敗，將使用內建角色圖形。', error);
  });
  fallImg = loadImage('角色資料/跌倒.png', () => {
    console.log('跌倒角色圖片載入成功');
  }, (error) => {
    console.error('跌倒角色圖片載入失敗，將使用內建角色圖形。', error);
  });

  // 載入背景圖片
  bgImg = loadImage('背景/背景.png', () => {
    console.log('背景圖片載入成功');
  }, (error) => {
    console.error('背景圖片載入失敗，將使用預設繪製背景。', error);
  });
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.elt.focus(); // 強制讓畫布取得焦點，解決 v5 預覽面板吃掉按鍵的問題

  groundY = height * 0.76;
  x = width / 2;
  y = groundY;

  if (walkImg) {
    let wWidth = Math.floor(walkImg.width / 6);
    let wHeight = walkImg.height;
    for (let i = 0; i < 6; i++) {
      let img = walkImg.get(i * wWidth, 0, wWidth, wHeight);
      walkFrames.push(img);
    }
  }

  if (jumpImg) {
    let jWidth = Math.floor(jumpImg.width / 7);
    let jHeight = jumpImg.height;
    for (let i = 0; i < 7; i++) {
      let img = jumpImg.get(i * jWidth, 0, jWidth, jHeight);
      jumpFrames.push(img);
    }
  }

  if (fallImg) {
    let fWidth = Math.floor(fallImg.width / 7);
    let fHeight = fallImg.height;
    for (let i = 0; i < 7; i++) {
      let sx = i * fWidth;
      let sw = (i === 6) ? fallImg.width - sx : fWidth; // 最後一幀補齊剩餘寬度，避免切歪
      let img = fallImg.get(sx, 0, sw, fHeight);
      fallFrames.push(img);
    }
  }
}

function draw() {
  drawScene();

  // 倒地動畫播放時不移動，倒地後按左右鍵可起身
  if (state === 'fallen' && (keys[LEFT_ARROW] || keys[RIGHT_ARROW] || keys['a'] || keys['d'] || keys['A'] || keys['D'])) {
    state = 'idle';
    fallFrameCounter = 0;
  }

  // 處理鍵盤左右移動輸入（同時支援 keyIsDown 與自訂 keys 陣列）
  let isMoving = false;
  if (state !== 'fall') {
    if (keyIsDown(LEFT_ARROW) || keys[LEFT_ARROW] || keys['a'] || keys['A']) {
      x -= speed;
      facing = 1;
      isMoving = true;
    }
    if (keyIsDown(RIGHT_ARROW) || keys[RIGHT_ARROW] || keys['d'] || keys['D']) {
      x += speed;
      facing = -1;
      isMoving = true;
    }
  }

  // 背景滾動邏輯：當角色走到畫面中央偏右/偏左時，背景開始跟隨移動
  const centerX = width / 2;
  const deadZone = 120;
  if (x > centerX + deadZone) {
    const excess = x - centerX - deadZone;
    bgX += excess * bgScrollSpeed;
    x = centerX + deadZone;
  } else if (x < centerX - deadZone) {
    const excess = centerX - deadZone - x;
    bgX -= excess * bgScrollSpeed;
    x = centerX - deadZone;
  }
  bgX = Math.max(0, bgX);
  x = constrain(x, 24, width - 24);

  // 處理跳躍與重力物理運算
  if (state === 'jump' || y < groundY) {
    vy += gravity;
    y += vy;
    if (y < groundY) {
      state = 'jump';
    } else {
      y = groundY;
      vy = 0;
      jumpFrameCounter = 0;
      state = isMoving ? 'walk' : 'idle';
    }
  } else if (state !== 'fall' && state !== 'fallen') {
    if (isMoving) {
      state = 'walk';
    } else {
      state = 'idle';
    }
  }

  // 處理動畫幀切換
  if (state === 'walk' && walkFrames.length > 0) {
    frameCounter += animSpeed;
    currentFrame = Math.floor(frameCounter) % walkFrames.length;
  } else if (state === 'jump' && jumpFrames.length > 0) {
    currentFrame = min(Math.floor(jumpFrameCounter), jumpFrames.length - 1);
    jumpFrameCounter += animSpeed;
  } else if (state === 'fall' && fallFrames.length > 0) {
    fallFrameCounter += animSpeed;
    currentFrame = min(Math.floor(fallFrameCounter), fallFrames.length - 1);
    if (fallFrameCounter >= fallFrames.length - 1) {
      state = 'fallen';
    }
  } else if (state === 'fallen' && fallFrames.length > 0) {
    currentFrame = fallFrames.length - 1; // 保持最後一個跌倒幀
  } else if (state === 'fall' || state === 'fallen') {
    if (state === 'fall') {
      fallFrameCounter += animSpeed;
      if (fallFrameCounter >= 7) {
        state = 'fallen';
      }
    }
  } else if (state === 'idle') {
    currentFrame = 0;
    frameCounter = 0;
  }

  if ((state === 'fall' || state === 'fallen') && fallFrames.length === 0 ||
      (state === 'jump' && jumpFrames.length === 0) ||
      (state !== 'jump' && walkFrames.length === 0)) {
    drawFallbackCharacter();
  } else {
    // 繪製角色
    push();
    translate(x, y);
    scale(facing, 1); // 透過 scale 實現水平鏡射翻轉
    imageMode(CENTER);

    if (state === 'jump') {
      image(jumpFrames[currentFrame], 0, 0);
    } else if (state === 'fall' || state === 'fallen') {
      // 跌倒圖片貼地：根據圖片高度向下偏移，讓圖片底部貼近地面
      let fallImg = fallFrames[currentFrame];
      let fallY = fallImg ? fallImg.height * 0.25 : 0;
      image(fallImg, 0, fallY);
    } else {
      image(walkFrames[currentFrame], 0, 0);
    }
    pop();
  }
}

function drawFallbackCharacter() {
  push();
  translate(x, y);
  scale(facing, 1);
  noStroke();

  if (state === 'fall' || state === 'fallen') {
    fill(247, 190, 83);
    ellipse(0, 8, 54, 28);
    fill(255, 231, 190);
    ellipse(-13, 1, 25, 24);
    fill(57, 64, 77);
    ellipse(-19, -2, 3, 4);
    fill(84, 146, 205);
    rect(-4, 12, 21, 8, 5);
  } else {
    const hop = state === 'jump' ? -8 : 0;
    fill(84, 146, 205);
    rect(-12, -34 + hop, 24, 30, 9);
    fill(255, 231, 190);
    ellipse(0, -43 + hop, 30, 30);
    fill(57, 64, 77);
    ellipse(6, -45 + hop, 3, 4);
    fill(247, 190, 83);
    arc(0, -49 + hop, 31, 23, PI, TWO_PI);
    fill(57, 64, 77);
    rect(-12, -5 + hop, 9, 17, 4);
    rect(3, -5 + hop, 9, 17, 4);
    fill(255, 231, 190);
    ellipse(-7, 12 + hop, 14, 6);
    ellipse(8, 12 + hop, 14, 6);
  }
  pop();
}

function drawScene() {
  // === 繪製背景圖片（支援隨角色移動平滑滾動） ===
  if (bgImg && bgImg.width > 0) {
    const bgWidth = bgImg.width;
    const scale = height / bgImg.height;  
    const scaledWidth = bgWidth * scale;

    let overlap = 8; 
    let startX = -bgX - scaledWidth - overlap;
    while (startX < width + overlap) {
      image(bgImg, startX, 0, scaledWidth + overlap * 2, height);
      startX += scaledWidth;
    }
  } else {
    // 備用背景（若圖片未成功載入時顯示漸層天空）
    const sky = drawingContext.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#78c9ec');
    sky.addColorStop(0.64, '#d7f2e7');
    drawingContext.fillStyle = sky;
    drawingContext.fillRect(0, 0, width, height);

    noStroke();
    fill(255, 224, 120);
    ellipse(width * 0.84, height * 0.17, 74, 74);
  }

  // 地面
  fill(103, 190, 99);
  rect(0, groundY + 25, width, height - groundY - 25);
  stroke(65, 145, 78);
  strokeWeight(3);
  line(0, groundY + 25, width, groundY + 25);
}

function windowResized() {
  const groundOffset = y - groundY;
  resizeCanvas(windowWidth, windowHeight);
  groundY = height * 0.76;
  y = groundY + groundOffset;
  x = constrain(x, 24, width - 24);
}

// === 鍵盤事件監聽（完美支援 v5 預覽面板與原生 p5 函式） ===
function keyPressed() {
  if (keyCode === UP_ARROW && y === groundY && state !== 'fall') {
    vy = jumpForce;
    state = 'jump';
    jumpFrameCounter = 0;
  }
  if (keyCode === DOWN_ARROW && y === groundY && state !== 'jump' && state !== 'fall' && state !== 'fallen') {
    state = 'fall';
    fallFrameCounter = 0;
  }
}

// 同步監聽原生的按鍵狀態，確保 v5 預覽不會卡住
window.addEventListener('keydown', function(e) {
  keys[e.keyCode] = true;
  keys[e.key] = true;
  if ([37, 38, 39, 40, 32].includes(e.keyCode)) {
    e.preventDefault();
  }
}, false);

window.addEventListener('keyup', function(e) {
  keys[e.keyCode] = false;
  keys[e.key] = false;
}, false);