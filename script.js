const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
context.scale(20, 20);

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");

const colors = [
  null,
  "cyan",
  "blue",
  "orange",
  "yellow",
  "green",
  "purple",
  "red"
];

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function createPiece(type) {
  switch (type) {
    case "T": return [[0,6,0],[6,6,6],[0,0,0]];
    case "O": return [[4,4],[4,4]];
    case "L": return [[0,0,3],[3,3,3],[0,0,0]];
    case "J": return [[2,0,0],[2,2,2],[0,0,0]];
    case "I": return [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]];
    case "S": return [[0,5,5],[5,5,0],[0,0,0]];
    case "Z": return [[7,7,0],[0,7,7],[0,0,0]];
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const gradient = context.createLinearGradient(
          x + offset.x,
          y + offset.y,
          x + offset.x + 1,
          y + offset.y + 1
        );
        gradient.addColorStop(0, "white");
        gradient.addColorStop(0.3, colors[value]);
        gradient.addColorStop(1, "black");

        context.fillStyle = gradient;
        context.fillRect(x + offset.x, y + offset.y, 1, 1);

        context.strokeStyle = "#ffffff55";
        context.lineWidth = 0.05;
        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, {x:0,y:0});
  drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y=0;y<m.length;y++) {
    for (let x=0;x<m[y].length;x++) {
      if (m[y][x] !== 0 &&
         (arena[y+o.y] && arena[y+o.y][x+o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y=arena.length-1;y>=0;y--) {
    for (let x=0;x<arena[y].length;x++) {
      if (arena[y][x] === 0) continue outer;
    }
    arena.splice(y,1);
    arena.unshift(new Array(12).fill(0));
    score += rowCount * 10;
    rowCount *= 2;
  }
}

function rotate(matrix) {
  for (let y=0;y<matrix.length;y++) {
    for (let x=0;x<y;x++) {
      [matrix[x][y], matrix[y][x]] =
      [matrix[y][x], matrix[x][y]];
    }
  }
  matrix.forEach(row => row.reverse());
}

function playerRotate() {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix);
      rotate(player.matrix);
      rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function playerReset() {
  const pieces = "ILJOTSZ";
  player.matrix =
    createPiece(pieces[Math.floor(Math.random()*pieces.length)]);
  player.pos.y = 0;
  player.pos.x = 4;
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    score = 0;
    level = 1;
    dropInterval = 1000;
    updateScore();
  }
}

function updateScore() {
  scoreElement.innerText = score;
  levelElement.innerText = level;
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let level = 1;
let paused = false;

function update(time=0) {
  if (paused) {
    draw();
    return requestAnimationFrame(update);
  }

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) {
    player.pos.y += 1;
    if (collide(arena, player)) {
      player.pos.y--;
      merge(arena, player);
      playerReset();
      arenaSweep();
      updateScore();
    }
    dropCounter = 0;
  }

  if (score >= level * 100) {
    level++;
    dropInterval *= 0.85;
  }

  draw();
  requestAnimationFrame(update);
}

document.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") playerMove(-1);
  else if (event.key === "ArrowRight") playerMove(1);
  else if (event.key === "ArrowDown") playerDrop();
  else if (event.key === "ArrowUp") playerRotate();
  else if (event.key === "p" || event.key === "P")
    paused = !paused;
});

const arena = createMatrix(12,20);
const player = { pos:{x:0,y:0}, matrix:null };

playerReset();
updateScore();
update();
