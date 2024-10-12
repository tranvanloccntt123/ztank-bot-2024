import { clearInterval } from "timers";
import {
  BulletSize,
  MY_NAME,
  MapSize,
  ObjectSize,
  TankTimeSpeed,
  saveIsShootAble,
} from "./constants";
import { bulletPositionAtRunTime } from "./utils";

export const tanks: Map<string, Tank> = new Map();

export const bullets: Map<number, Bullet> = new Map();

export let mapMatch: MapMatch = [];

export let myTank: Tank | null = null;

export let blockPosition: Set<Position> = new Set();

export const saveMap = (map: MapMatch) => {
  mapMatch = map;
  for (let y = 1; y < map.length - 1; y++) {
    for (let x = 1; x < map[y].length - 1; x++) {
      if (map[y][x] === "B") {
        for (let by = 0; by < 20; by++) {
          for (let bx = 0; bx < 20; bx++) {
            blockPosition.add({
              x: bx + x * ObjectSize,
              y: by + y * ObjectSize,
            });
          }
        }
      }
    }
  }
};

export const saveTanks = (_tanks: Array<Tank>) => {
  _tanks.forEach((tank) => {
    tanks.set(tank?.uid, tank);
    if (tank.name === MY_NAME) {
      myTank = tank;
      saveIsShootAble(tank.shootable);
    }
  });
};

export const saveBullets = (_bullets: Array<Bullet>) => {
  _bullets.forEach((bullet) => {
    bullets.set(bullet.id, bullet);
  });
};

export const clearBulletNotWorking = () => {
  Array.from(bullets.keys()).forEach((id) => {
    if (!bullets.has(id)) {
      return;
    }
    const bulletData = bullets.get(id);
    if (!bulletData) {
      return;
    }
    const runTimePosition = bulletPositionAtRunTime(bulletData);
    if (!runTimePosition) {
      return;
    }
    if (
      runTimePosition.x < 0 ||
      runTimePosition.x > MapSize.width ||
      runTimePosition.y < 0 ||
      runTimePosition.y > MapSize.height
    ) {
      bullets.delete(id);
    } else {
      if (blockPosition.has({ x: runTimePosition.x, y: runTimePosition.y })) {
        bullets.delete(id);
      }
      else if (
        blockPosition.has({
          x: runTimePosition.x + BulletSize,
          y: runTimePosition.y + BulletSize,
        })
      ) {
        bullets.delete(id);
      }
    }
  });
};

let countDownMove: any = null;

export const stopIntervalCheckBullet = () => {
  clearInterval(countDownMove);
};

export const startIntervalToCheckBullet = () => {
  countDownMove = setInterval(() => {
    if (!mapMatch.length) {
      return;
    }
    Array.from(bullets.keys()).forEach((id) => {
      if (!bullets.has(id)) {
        return;
      }
      const bullet = bullets.get(id);
      if (!bullet) {
        return;
      }
      const runTimePosition = bulletPositionAtRunTime(bullet);
      if (
        runTimePosition.x < 0 ||
        runTimePosition.x > MapSize.width ||
        runTimePosition.y < 0 ||
        runTimePosition.y > MapSize.height
      ) {
        bullets.delete(id);
      } else {
        if (blockPosition.has({x: runTimePosition.x, y: runTimePosition.y})) {
          bullets.delete(id);
        } else if (blockPosition.has({x: runTimePosition.x + BulletSize, y: runTimePosition.y + BulletSize})) {
          bullets.delete(id);
        } else {
          bullets.set(bullet.id, {
            ...bullet,
            y: runTimePosition.y,
            x: runTimePosition.x,
            time: runTimePosition.time,
          });
        }
      }
    });
  }, TankTimeSpeed / 3);
};
