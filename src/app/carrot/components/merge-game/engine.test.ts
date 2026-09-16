import assert from "node:assert/strict";
import test from "node:test";
import Matter from "matter-js";
import { BOARD, MergeGame, randomLevel } from "./engine";
import { VEGETABLES } from "./characters";

function frames(game: MergeGame, count: number) {
  for (let index = 0; index < count; index++) game.step();
}
function fixture() {
  const game = new MergeGame(() => {}, () => {}, () => 0);
  game.start();
  return game;
}

test("only the first three vegetables spawn with the reference probabilities", () => {
  assert.equal(randomLevel(() => 0), 0);
  assert.equal(randomLevel(() => 0.579), 0);
  assert.equal(randomLevel(() => 0.58), 1);
  assert.equal(randomLevel(() => 0.879), 1);
  assert.equal(randomLevel(() => 0.88), 2);
  assert.equal(randomLevel(() => 0.999), 2);
});

test("drop cooldown, gravity and basket walls", () => {
  const game = fixture();
  try {
    game.setAim(-1000);
    assert.ok(game.aim >= BOARD.wall + VEGETABLES[0].radius);
    assert.equal(game.drop(), true);
    assert.equal(game.drop(), false);
    const vegetable = [...game.vegetables.values()][0];
    frames(game, 20);
    assert.ok(vegetable.body.position.y > BOARD.dropY + 20);
    frames(game, 160);
    assert.ok(Math.abs(vegetable.body.position.y + VEGETABLES[0].radius - BOARD.floor) < 2);
    assert.ok(vegetable.body.position.x >= BOARD.wall + VEGETABLES[0].radius - 1);
    game.setAim(1000);
    assert.ok(game.aim <= BOARD.width - BOARD.wall - VEGETABLES[0].radius);
    assert.equal(game.drop(), true);
  } finally { game.destroy(); }
});

test("identical vegetables merge once and repeated merges can chain", () => {
  const game = fixture();
  try {
    for (let index = 0; index < 4; index++) {
      game.setAim(BOARD.width / 2);
      assert.equal(game.drop(), true);
      frames(game, 170);
    }
    assert.equal(game.snapshot.score, 20);
    assert.equal(game.vegetables.size, 1);
    assert.equal([...game.vegetables.values()][0].level, 2);
    assert.equal(game.snapshot.highest, 2);
  } finally { game.destroy(); }
});

test("different vegetables do not merge", () => {
  let seed = 0;
  const game = new MergeGame(() => {}, () => {}, () => seed++ === 0 ? 0 : 0.7);
  try {
    game.start();
    game.drop(); frames(game, 160);
    game.drop(); frames(game, 160);
    assert.equal(game.snapshot.score, 0);
    assert.equal(game.vegetables.size, 2);
  } finally { game.destroy(); }
});

test("pause stops physics, drops and danger countdown; reset clears the world", () => {
  const game = fixture();
  try {
    game.drop(); frames(game, 10);
    const body = [...game.vegetables.values()][0].body;
    const y = body.position.y;
    const time = game.time;
    game.setPaused(true);
    frames(game, 120);
    assert.equal(body.position.y, y);
    assert.equal(game.time, time);
    assert.equal(game.drop(), false);
    game.setPaused(false); frames(game, 20);
    assert.ok(body.position.y > y);
    game.start();
    assert.equal(game.vegetables.size, 0);
    assert.equal(game.physics.world.bodies.length, 3);
    assert.equal(game.snapshot.score, 0);
    assert.equal(game.snapshot.drops, 0);
    assert.equal(game.snapshot.status, "playing");
  } finally { game.destroy(); }
});

test("a newly dropped vegetable does not trigger overflow; sustained overflow ends the game", () => {
  const game = fixture();
  try {
    game.drop();
    const body = [...game.vegetables.values()][0].body;
    Matter.Body.setStatic(body, true);
    frames(game, 53);
    assert.equal(game.snapshot.danger, false);
    frames(game, 3);
    assert.equal(game.snapshot.danger, true);
    frames(game, 90);
    assert.equal(game.snapshot.status, "playing");
    frames(game, 15);
    assert.equal(game.snapshot.status, "over");
    assert.equal(game.drop(), false);
  } finally { game.destroy(); }
});

test("settling below the line cancels danger", () => {
  const game = fixture();
  try {
    game.drop();
    const body = [...game.vegetables.values()][0].body;
    Matter.Body.setStatic(body, true);
    frames(game, 80);
    assert.equal(game.snapshot.danger, true);
    Matter.Body.setPosition(body, { x: 100, y: 300 });
    frames(game, 120);
    assert.equal(game.snapshot.danger, false);
    assert.equal(game.snapshot.status, "playing");
  } finally { game.destroy(); }
});

test("golden vegetables remain the final level", () => {
  const game = fixture();
  try {
    game.drop(); frames(game, 160);
    game.drop();
    const vegetables = [...game.vegetables.values()];
    for (const vegetable of vegetables) vegetable.level = 7;
    frames(game, 160);
    assert.equal(game.vegetables.size, 2);
    assert.equal(game.snapshot.score, 0);
  } finally { game.destroy(); }
});

test("destroy removes bodies and prohibits restarting", () => {
  const game = fixture();
  game.drop();
  game.destroy();
  assert.equal(game.physics.world.bodies.length, 0);
  assert.equal(game.vegetables.size, 0);
  assert.equal(game.drop(), false);
  game.start();
  assert.equal(game.physics.world.bodies.length, 0);
});
