import {
  BulletSize,
  MY_NAME,
  MapSize,
  ObjectSize,
  TankTimeSpeed,
} from "./constants";
import { runSystem, stopIntervalRunning } from "./tankSystem";
import {
  bulletPositionAtPlustime,
  bulletPositionAtRunTime,
  checkBulletInsideTank,
  checkBulletRunningToTank,
  checkTankPositionIsObject,
  euclideanDistance,
  initPosition,
  tankPositionAtNextTime,
} from "./utils";
import * as _ from "lodash";

export const tanks: Map<string, Tank> = new Map();

export const tanksId: Map<string, string> = new Map();

export const bullets: Map<number, Bullet> = new Map();

export const isReborn: Set<string> = new Set();

export let mapMatch: MapMatch = [];

export let myTank: Tank | null = null;

export let blockPosition: Set<string> = new Set();

export let objectPosition: Set<string> = new Set();

export let isFinish = true;

export let prevPosition = initPosition(-1, -1);

export let prevOrient: Orient | null = null;

export let runTime = new Date().getTime();

export let resolveStartPromise: any = null;

export let resolveShootPromise: any = null;

export let resolveMovePromise: any = null;

export let resolveJoiningPromise: any = null;

export let resolveRunningPromise: any = null;

export let isShootAble: boolean = true;

export let isMoveAble: boolean = true;

export let isDodgeAble: boolean = false;

export let isJoinning: boolean = false;

export let targetTankUID: string = "";

/*
  Priority:
  - 0: dodge
  - 1: shoot
  - 2: normal
*/
export const MovePriority = {
  DODGE: 0,
  SHOOT: 1,
  NORMAL: 2,
};

export let road: {
  priority: number;
  data: Array<Orient>;
} = {
  priority: 3,
  data: [],
};

export let startPromise = new Promise<boolean>(
  (resolve) => (resolveStartPromise = resolve)
);

export let movePromise = new Promise<boolean>(
  (resolve) => (resolveMovePromise = resolve)
);

export let shootPromise = new Promise<boolean>(
  (resolve) => (resolveShootPromise = resolve)
);

export let joiningPromise = new Promise<boolean>(
  (resolve) => (resolveJoiningPromise = resolve)
);

export let runningPromise = new Promise<boolean>(
  (resolve) => (resolveRunningPromise = resolve)
);

export const resetMovePromise = () => {
  movePromise = new Promise<boolean>(
    (resolve) => (resolveMovePromise = resolve)
  );
};

export const resetRunningPromise = () => {
  runningPromise = new Promise<boolean>(
    (resolve) => (resolveRunningPromise = resolve)
  );
};

export const clearRoad = () => {
  road.priority = 3;
  road.data = [];
  stopIntervalRunning();
};

export const findTargetTank = () => {
  if (myTank && myTank.x && myTank.y && tanks.size) {
    const _tanks = Array.from(tanks.values())
      .filter((tank) => tank.name !== MY_NAME)
      .sort((a, b) => {
        const aPosition = euclideanDistance(
          { x: a.x, y: a.y },
          { x: myTank!.x, y: myTank!.y }
        );
        const bPosition = euclideanDistance(
          { x: b.x, y: b.y },
          { x: myTank!.x, y: myTank!.y }
        );
        if (aPosition === bPosition && a.streak > b.streak) {
          return -1;
        }
        return aPosition - bPosition;
      });
    if (_tanks.length) {
      saveTargetTankUID(_tanks[0].uid);
    }
  }
};

export const saveTargetTankUID = (uid: string) => {
  targetTankUID = uid;
};

export const saveRoad = (priority: number, data: Array<Orient>) => {
  try {
    if (priority < road.priority) {
      stopIntervalRunning();
      road.priority = priority;
      road.data = data.concat();
      runSystem(road);
    } else if (!Boolean(road.data.length)) {
      stopIntervalRunning();
      road.priority = priority;
      road.data = data.concat();
      runSystem(road);
    }
  } catch (e) {
    console.log(e);
  }
};

export const saveIsJoinning = (_v: boolean) => (isJoinning = _v);

export const saveIsDodgeAble = (_v: boolean) => (isDodgeAble = _v);

export const saveIsMoveAble = (_v: boolean) => (isMoveAble = _v);

export const saveIsShootAble = (_v: boolean) => (isShootAble = _v);

export const isReboring = (tankName: string) => {
  isReborn.add(tankName);
};

export const clearIsReboring = (tankName: string) => {
  isReborn.delete(tankName);
};

export const addBlockPosition = (position: Position) => {
  blockPosition.add(`${Math.floor(position.x)}-${Math.floor(position.y)}`);
};

export const hasBlockPosition = (position: Position) => {
  return blockPosition.has(
    `${Math.floor(position.x)}-${Math.floor(position.y)}`
  );
};

export const addObjectPosition = (position: Position) => {
  objectPosition.add(`${Math.floor(position.x)}-${Math.floor(position.y)}`);
};

export const hasObjectPosition = (position: Position) => {
  return objectPosition.has(
    `${Math.floor(position.x)}-${Math.floor(position.y)}`
  );
};

export const saveMap = (map: MapMatch) => {
  mapMatch = map;
  for (let y = 1; y < map.length - 1; y++) {
    for (let x = 1; x < map[y].length - 1; x++) {
      if (map[y][x] === "B") {
        for (let by = 0; by < 20; by++) {
          for (let bx = 0; bx < 20; bx++) {
            addBlockPosition({
              x: bx + x * ObjectSize,
              y: by + y * ObjectSize,
            });
          }
        }
      }
      if (map[y][x] === "T" || map[y][x] === "W") {
        for (let by = 0; by < 20; by++) {
          for (let bx = 0; bx < 20; bx++) {
            addObjectPosition({
              x: bx + x * ObjectSize,
              y: by + y * ObjectSize,
            });
          }
        }
      }
    }
  }
  console.log("Save Done");
};

export const saveTanks = (_tanks: Array<Tank>) => {
  _tanks.forEach((tank) => {
    if (tank.x && tank.y) {
      tanks.set(tank?.name, tank);
      if (tank.name === MY_NAME) {
        myTank = tank;
        saveIsShootAble(tank.shootable);
      }
    }
  });
};

export const saveBullets = (_bullets: Array<Bullet>) => {
  _bullets.forEach((bullet) => {
    if (bullet.uid !== myTank?.uid && bullet.x && bullet.y) {
      bullets.set(bullet.id, bullet);
    }
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
      runTimePosition?.x < 0 ||
      runTimePosition?.x > MapSize.width ||
      runTimePosition?.y < 0 ||
      runTimePosition?.y > MapSize.height
    ) {
      bullets.delete(id);
    } else {
      if (
        hasBlockPosition({
          x: runTimePosition?.x ?? 0,
          y: runTimePosition?.y ?? 0,
        })
      ) {
        bullets.delete(id);
      } else if (
        hasBlockPosition({
          x: (runTimePosition?.x ?? 0) + BulletSize,
          y: (runTimePosition?.y ?? 0) + BulletSize,
        })
      ) {
        bullets.delete(id);
      }
    }
  });
};

/*
KILLED {
  x: 353.5,
  y: 473.5,
  orient: 'DOWN',
  speed: 4,
  type: 1,
  size: 8,
  uid: 'daJKGf6r0SD37j1JAAnb',
  id: 321078
}
LOCAL {
  x: 360,
  y: 480,
  speed: 3,
  type: 1,
  uid: 'U1kR0kFLDjaCboYcABG7',
  orient: 'LEFT',
  isAlive: false,
  size: 33,
  name: 'The Fool',
  shootable: true,
  movable: true,
  shootCooldown: 0,
  invulnerable: false,
  protectCooldown: 0,
  score: 203,
  streak: 1,
  bounty: 0,
  color: 0
}
*/

export const checkBulletInsideBlock = (position: Position) => {
  return (
    hasBlockPosition({
      x: (position?.x ?? 0) + BulletSize,
      y: (position?.y ?? 0) + BulletSize,
    }) ||
    hasBlockPosition({
      x: position?.x,
      y: position?.y,
    }) ||
    hasBlockPosition({
      x: position?.x,
      y: position?.y + BulletSize,
    }) ||
    hasBlockPosition({
      x: (position?.x ?? 0) + BulletSize,
      y: position?.y ?? 0,
    })
  );
};

const orients = ["UP", "DOWN", "RIGHT", "LEFT"];

const unOrients = ["DOWN", "UP", "LEFT", "RIGHT"];

const safeArea = (
  tankPosition: Position,
  bullets: Array<Bullet>,
  ms: number
) => {
  for (const bullet of bullets) {
    const bulletPosition = bulletPositionAtPlustime(bullet, ms);
    if (
      checkBulletRunningToTank(tankPosition, {
        ...bulletPosition,
        orient: bullet.orient,
      })
    ) {
      return false;
    }
  }
  return true;
};

const checkBulletsInsideTank = (
  tankPosition: Position,
  bullets: Array<Bullet>,
  ms: number
) => {
  for (const bullet of bullets) {
    const bulletPosition = bulletPositionAtPlustime(bullet, ms);
    if (checkBulletInsideTank(tankPosition, bulletPosition)) {
      return true;
    }
  }
  return false;
};

export const revertRoad = (
  roads: any,
  tankPosition: Position & {
    ms: number;
  }
) => {
  const result: Array<any> = [];
  let unOrient = roads[tankPosition?.y ?? ""][tankPosition?.x ?? ""];
  let findOrientIndex = unOrients.findIndex((v) => v === unOrient);
  let prevPosition = tankPositionAtNextTime(tankPosition as never, unOrient);
  result.unshift({
    ...prevPosition,
    orient: orients[findOrientIndex] ?? "null",
  } as never);
  while (unOrient !== "ROOT") {
    unOrient = roads[prevPosition?.y ?? ""][prevPosition?.x ?? ""];
    findOrientIndex = unOrients.findIndex((v) => v === unOrient);
    prevPosition = tankPositionAtNextTime(prevPosition as never, unOrient);
    result.unshift({
      ...prevPosition,
      orient: orients[findOrientIndex] ?? "null",
    } as never);
  }
  return result;
};

export const dodgeBullets = (
  tankPosition: Position & { orient: Orient },
  bullets: Array<Bullet>,
  ms: number
) => {
  //make dodge queue
  let dodgeRoad: any = {
    [tankPosition.y]: {
      [tankPosition.x]: "ROOT",
    },
  };
  let isSafe = true;
  const queue: Array<Position & { ms: number }> = [{ ...tankPosition, ms: ms }];
  const result: Array<any> = [];
  while (queue.length) {
    const tankPosition = queue.shift();
    if (safeArea(tankPosition as never, bullets, tankPosition?.ms as never)) {
      //REVERT POSTION
      result.push(...revertRoad(dodgeRoad, tankPosition as any));
      break;
    }
    isSafe = false;
    for (let i = 0; i < orients.length; i++) {
      const orient = orients[i];
      const moveNextPosition = tankPositionAtNextTime(
        tankPosition as never,
        orient as never
      );
      if (
        !checkTankPositionIsObject(moveNextPosition as never) &&
        !checkBulletsInsideTank(
          tankPosition as never,
          bullets,
          tankPosition!.ms
        ) &&
        !(
          tankPosition!.x >= 848 ||
          tankPosition!.x < 20 ||
          tankPosition!.y >= 648 ||
          tankPosition!.y < 20
        )
      ) {
        if (!dodgeRoad?.[moveNextPosition.y]?.[moveNextPosition.x]) {
          if (!dodgeRoad?.[moveNextPosition.y]) {
            dodgeRoad[moveNextPosition.y] = {};
          }
          dodgeRoad[moveNextPosition.y][moveNextPosition.x] = unOrients[i];
          queue.push({
            ...moveNextPosition,
            ms: (tankPosition?.ms ?? 0) + TankTimeSpeed,
          });
        }
      }
    }
  }
  return {
    isSafe,
    result,
  };
};
