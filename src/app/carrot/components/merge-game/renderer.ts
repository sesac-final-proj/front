import { BOARD, type MergeGame } from "./engine";
import { VEGETABLES } from "./characters";

export function loadCharacterImages() {
  return VEGETABLES.map(({ image }) => {
    const sprite = new Image();
    sprite.src = image;
    return sprite;
  });
}

export function drawGame(ctx: CanvasRenderingContext2D, game: MergeGame, sprites: HTMLImageElement[], reducedMotion: boolean) {
  const { width, height, wall, floor, line } = BOARD;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fff1a1";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fffdef";
  ctx.fillRect(wall, line - 8, width - wall * 2, floor - line + 8);

  // The open top and solid sides are also the physical bounds of the basket.
  ctx.strokeStyle = "#75945b";
  ctx.lineWidth = 7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(wall - 3, line - 9);
  ctx.lineTo(wall - 3, floor + 4);
  ctx.lineTo(width - wall + 3, floor + 4);
  ctx.lineTo(width - wall + 3, line - 9);
  ctx.stroke();
  ctx.strokeStyle = "#b7c991";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wall, line - 9);
  ctx.lineTo(wall, floor);
  ctx.lineTo(width - wall, floor);
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = game.snapshot.danger ? "#cf6255" : "#dbd5ac";
  ctx.lineWidth = game.snapshot.danger ? 2.5 : 1;
  ctx.beginPath();
  ctx.moveTo(wall + 4, line);
  ctx.lineTo(width - wall - 4, line);
  ctx.stroke();
  ctx.restore();

  const character = (level: number, x: number, y: number, radius: number, angle = 0, scale = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    const sprite = sprites[level];
    const size = radius * 2.32;
    if (sprite.complete && sprite.naturalWidth) ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    else {
      ctx.fillStyle = VEGETABLES[level].color;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  if (game.snapshot.status === "ready") {
    character(0, 34, floor - 16, 16, -0.2);
    character(1, 72, floor - 21, 21, 0.16);
    character(4, 135, floor - 42, 42, -0.2);
    character(6, 239, floor - 62, 62, 0.13);
    character(2, 326, floor - 27, 27, -0.17);
  }
  if (game.snapshot.status === "playing") {
    const radius = VEGETABLES[game.snapshot.current].radius;
    ctx.save();
    ctx.globalAlpha = game.canDrop() ? 0.7 : 0.25;
    ctx.strokeStyle = "#81976a";
    ctx.setLineDash([3, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(game.aim, BOARD.dropY + radius + 6);
    ctx.lineTo(game.aim, floor - 4);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = game.canDrop() ? 1 : 0.4;
    character(game.snapshot.current, game.aim, BOARD.dropY, radius);
    ctx.restore();
  }
  for (const { body, level, born } of game.vegetables.values()) {
    const age = game.time - born;
    const scale = reducedMotion || age >= 170 ? 1 : 1 + Math.sin(age / 170 * Math.PI) * 0.075;
    character(level, body.position.x, body.position.y, VEGETABLES[level].radius, body.angle, scale);
  }
  if (reducedMotion) return;
  for (const burst of game.bursts) {
    const progress = (game.time - burst.born) / 550;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.strokeStyle = VEGETABLES[burst.level].color;
    ctx.lineWidth = 3 * (1 - progress);
    const radius = VEGETABLES[burst.level].radius + 12 + progress * 22;
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(burst.x + Math.cos(angle) * radius, burst.y + Math.sin(angle) * radius);
      ctx.lineTo(burst.x + Math.cos(angle) * (radius + 6), burst.y + Math.sin(angle) * (radius + 6));
      ctx.stroke();
    }
    ctx.fillStyle = "#587046";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`+${VEGETABLES[burst.level].score}`, burst.x, burst.y - radius - progress * 12);
    ctx.restore();
  }
}
