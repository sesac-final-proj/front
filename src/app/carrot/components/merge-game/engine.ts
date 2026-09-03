import Matter from "matter-js";
import { VEGETABLES } from "./characters";

export const BOARD = { width: 356, height: 486, wall: 9, floor: 475, line: 78, dropY: 35 };
export const STEP_MS = 1000 / 60;
export type GameStatus = "ready" | "playing" | "paused" | "over";
export type GameSnapshot = { status: GameStatus; score: number; current: number; next: number; drops: number; danger: boolean; highest: number };
export type VegetableBody = { body: Matter.Body; level: number; born: number };
export type MergeBurst = { x: number; y: number; level: number; born: number };
export const INITIAL_GAME: GameSnapshot = { status: "ready", score: 0, current: 0, next: 0, drops: 0, danger: false, highest: 0 };

export function randomLevel(random = Math.random) {
  const value = random();
  return value < 0.58 ? 0 : value < 0.88 ? 1 : 2;
}

export class MergeGame {
  readonly physics = Matter.Engine.create({ positionIterations: 8, velocityIterations: 8 });
  readonly vegetables = new Map<number, VegetableBody>();
  readonly bursts: MergeBurst[] = [];
  snapshot = { ...INITIAL_GAME };
  aim = BOARD.width / 2;
  time = 0;
  private cooldown = 0;
  private overflowAt: number | null = null;
  private collisions: [number, number][] = [];
  private destroyed = false;

  constructor(private onChange: (snapshot: GameSnapshot) => void, private onMerge: (level: number) => void = () => {}, private random = Math.random) {
    this.physics.gravity.y = 1.5;
    const collect = (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const { bodyA, bodyB } of event.pairs) {
        if (this.vegetables.has(bodyA.id) && this.vegetables.has(bodyB.id)) {
          this.collisions.push([bodyA.id, bodyB.id]);
        }
      }
    };
    Matter.Events.on(this.physics, "collisionStart", collect);
    Matter.Events.on(this.physics, "collisionActive", collect);
    this.addWalls();
  }

  private publish(change: Partial<GameSnapshot>) {
    this.snapshot = { ...this.snapshot, ...change };
    this.onChange(this.snapshot);
  }

  private addWalls() {
    Matter.Composite.add(this.physics.world, [
      Matter.Bodies.rectangle(BOARD.wall - 20, 240, 40, 700, { isStatic: true }),
      Matter.Bodies.rectangle(BOARD.width - BOARD.wall + 20, 240, 40, 700, { isStatic: true }),
      Matter.Bodies.rectangle(BOARD.width / 2, BOARD.floor + 20, BOARD.width + 80, 40, { isStatic: true }),
    ]);
  }

  start() {
    if (this.destroyed) return;
    Matter.Composite.clear(this.physics.world, false);
    Matter.Engine.clear(this.physics);
    this.vegetables.clear();
    this.bursts.length = 0;
    this.collisions.length = 0;
    this.time = 0;
    this.cooldown = 0;
    this.overflowAt = null;
    this.aim = BOARD.width / 2;
    this.addWalls();
    this.publish({ ...INITIAL_GAME, status: "playing", current: randomLevel(this.random), next: randomLevel(this.random) });
  }

  setPaused(paused: boolean) {
    if (this.snapshot.status === "playing" && paused) this.publish({ status: "paused" });
    if (this.snapshot.status === "paused" && !paused) this.publish({ status: "playing" });
  }

  setAim(x: number) {
    if (!Number.isFinite(x)) return;
    const radius = VEGETABLES[this.snapshot.current].radius;
    this.aim = Math.max(BOARD.wall + radius + 1, Math.min(BOARD.width - BOARD.wall - radius - 1, x));
  }

  private addVegetable(level: number, x: number, y: number) {
    const radius = VEGETABLES[level].radius;
    const body = Matter.Bodies.circle(
      Math.max(BOARD.wall + radius, Math.min(BOARD.width - BOARD.wall - radius, x)),
      Math.min(BOARD.floor - radius, y), radius,
      { restitution: 0.23, friction: 0.35, frictionStatic: 0.5, frictionAir: 0.006, slop: 0.02 },
    );
    const vegetable = { body, level, born: this.time };
    this.vegetables.set(body.id, vegetable);
    Matter.Composite.add(this.physics.world, body);
    return vegetable;
  }

  drop() {
    if (this.destroyed || this.snapshot.status !== "playing" || this.time < this.cooldown) return false;
    this.setAim(this.aim);
    this.addVegetable(this.snapshot.current, this.aim, BOARD.dropY);
    this.cooldown = this.time + 420;
    this.publish({ current: this.snapshot.next, next: randomLevel(this.random), drops: this.snapshot.drops + 1 });
    this.setAim(this.aim);
    return true;
  }

  canDrop() {
    return this.snapshot.status === "playing" && this.time >= this.cooldown;
  }

  private mergeCollisions() {
    // Collision callbacks only queue pairs. Mutate the world after the physics step.
    for (const [leftId, rightId] of this.collisions) {
      const left = this.vegetables.get(leftId);
      const right = this.vegetables.get(rightId);
      if (!left || !right || left.level !== right.level || left.level >= VEGETABLES.length - 1) continue;
      if (this.time - Math.max(left.born, right.born) < 90) continue;
      this.vegetables.delete(leftId);
      this.vegetables.delete(rightId);
      Matter.Composite.remove(this.physics.world, [left.body, right.body]);
      const level = left.level + 1;
      const x = (left.body.position.x + right.body.position.x) / 2;
      const y = (left.body.position.y + right.body.position.y) / 2;
      const merged = this.addVegetable(level, x, y);
      Matter.Body.setVelocity(merged.body, { x: (left.body.velocity.x + right.body.velocity.x) * 0.2, y: -1.2 });
      Matter.Body.setAngularVelocity(merged.body, (left.body.angularVelocity + right.body.angularVelocity) * 0.2);
      this.bursts.push({ x, y, level, born: this.time });
      this.publish({ score: this.snapshot.score + VEGETABLES[level].score, highest: Math.max(this.snapshot.highest, level) });
      this.onMerge(level);
    }
    this.collisions.length = 0;
  }

  step(delta = STEP_MS) {
    if (this.destroyed || this.snapshot.status !== "playing") return;
    const dt = Math.min(STEP_MS, Math.max(0, delta));
    this.time += dt;
    Matter.Engine.update(this.physics, dt);
    this.mergeCollisions();
    while (this.bursts.length && this.time - this.bursts[0].born > 550) this.bursts.shift();
    const overflowing = [...this.vegetables.values()].some(({ body, level, born }) =>
      this.time - born > 900 && body.position.y - VEGETABLES[level].radius < BOARD.line,
    );
    if (overflowing) {
      this.overflowAt ??= this.time;
      if (!this.snapshot.danger) this.publish({ danger: true });
      if (this.time - this.overflowAt >= 1700) this.publish({ status: "over" });
    } else {
      this.overflowAt = null;
      if (this.snapshot.danger) this.publish({ danger: false });
    }
  }

  destroy() {
    this.destroyed = true;
    Matter.Events.off(this.physics, "collisionStart");
    Matter.Events.off(this.physics, "collisionActive");
    Matter.Composite.clear(this.physics.world, false);
    Matter.Engine.clear(this.physics);
    this.vegetables.clear();
    this.bursts.length = 0;
    this.collisions.length = 0;
  }
}
