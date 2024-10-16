import {
  BulletSize,
  MY_NAME,
  MapSize,
  ObjectSize,
  TankSize,
  TankSpeed,
  TankTimeSpeed,
} from "./constants";
import {
  bulletPositionAtPlustime,
  bulletPositionAtRunTime,
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

export let isShootAble: boolean = true;

export let isMoveAble: boolean = true;

export let isDodgeAble: boolean = false;

export let startPromise = new Promise<boolean>(
  (resolve) => (resolveStartPromise = resolve)
);

export let movePromise = new Promise<boolean>(
  (resolve) => (resolveMovePromise = resolve)
);

export let shootPromise = new Promise<boolean>(
  (resolve) => (resolveShootPromise = resolve)
);

export const resetMovePromise = () => {
  movePromise = new Promise<boolean>(
    (resolve) => (resolveMovePromise = resolve)
  );
};

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
  blockPosition.add(
    `${parseInt(position.x.toString())}-${parseInt(position.y.toString())}`
  );
};

export const hasBlockPosition = (position: Position) => {
  return blockPosition.has(
    `${parseInt(position.x.toString())}-${position.y.toString()}`
  );
};

export const addObjectPosition = (position: Position) => {
  objectPosition.add(
    `${parseInt(position.x.toString())}-${parseInt(position.y.toString())}`
  );
};

export const hasObjectPosition = (position: Position) => {
  return objectPosition.has(
    `${parseInt(position.x.toString())}-${parseInt(position.y.toString())}`
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
    tanks.set(tank?.name, tank);
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

export const bulletInsideTankVertical = (
  tankPosition: Position,
  bulletPosition: Position
) => {
  return (
    _.inRange(
      bulletPosition?.x ?? 0,
      tankPosition.x,
      tankPosition.x + TankSize + 1
    ) ||
    _.inRange(
      (bulletPosition?.x ?? 0) + BulletSize,
      tankPosition.x,
      tankPosition.x + TankSize + 1 + 1
    )
  );
};

export const bulletInsideTankHorizontal = (
  tankPosition: Position,
  bulletPosition: Position
) => {
  return (
    _.inRange(
      bulletPosition?.y ?? 0,
      tankPosition.y,
      tankPosition.y + TankSize + 1
    ) ||
    _.inRange(
      (bulletPosition?.y ?? 0) + BulletSize,
      tankPosition.y,
      tankPosition.y + TankSize + 1
    )
  );
};

export const checkTankPositionIsObject = (tankPosition: Position) => {
  return (
    hasBlockPosition({
      x: tankPosition.x,
      y: tankPosition.y,
    }) ||
    hasBlockPosition({
      x: tankPosition.x + TankSize,
      y: tankPosition.y,
    }) ||
    hasBlockPosition({
      x: tankPosition.x + TankSize,
      y: tankPosition.y + TankSize,
    }) ||
    hasBlockPosition({
      x: tankPosition.x,
      y: tankPosition.y + TankSize,
    }) ||
    hasBlockPosition({
      x: tankPosition.x + TankSize / 2,
      y: tankPosition.y + TankSize / 2,
    }) ||
    hasObjectPosition({
      x: tankPosition.x,
      y: tankPosition.y,
    }) ||
    hasObjectPosition({
      x: tankPosition.x + TankSize,
      y: tankPosition.y,
    }) ||
    hasObjectPosition({
      x: tankPosition.x + TankSize,
      y: tankPosition.y + TankSize,
    }) ||
    hasObjectPosition({
      x: tankPosition.x,
      y: tankPosition.y + TankSize,
    }) ||
    hasObjectPosition({
      x: tankPosition.x + TankSize / 2,
      y: tankPosition.y + TankSize / 2,
    })
  );
};

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

export const checkBulletInsideTank = (
  tankPosition: Position,
  bullet: Position
) => {
  if (
    _.inRange(bullet.x, tankPosition.x - 8, tankPosition.x + TankSize + 9) &&
    _.inRange(bullet.y, tankPosition.y - 8, tankPosition.y + TankSize + 9)
  ) {
    return true;
  }
  if (
    _.inRange(
      bullet.x + BulletSize,
      tankPosition.x - 8,
      tankPosition.x + TankSize + 9
    ) &&
    _.inRange(bullet.y, tankPosition.y - 8, tankPosition.y + TankSize + 9)
  ) {
    return true;
  }
  if (
    _.inRange(bullet.x, tankPosition.x - 8, tankPosition.x + TankSize + 9) &&
    _.inRange(
      bullet.y + BulletSize,
      tankPosition.y - 8,
      tankPosition.y + TankSize + 9
    )
  ) {
    return true;
  }
  if (
    _.inRange(
      bullet.x + BulletSize,
      tankPosition.x - 8,
      tankPosition.x + TankSize + 9
    ) &&
    _.inRange(
      bullet.y + BulletSize,
      tankPosition.y - 8,
      tankPosition.y + TankSize + 9
    )
  ) {
    return true;
  }
  return false;
};

/*
{ x: 359.5, y: 191.73529411764778, orient: 'DOWN' } { x: 120, y: 368, orient: 'UP' }
*/

export const checkBulletRunningToTank = (
  tankPosition: Position,
  bulletPosition: Position & { orient: Orient },
  distance = TankSize * 4
) => {
  if (
    bulletInsideTankVertical(tankPosition, bulletPosition) &&
    ["DOWN", "UP"].includes(bulletPosition.orient)
  ) {
    if (
      bulletPosition.orient === "DOWN" &&
      bulletPosition.y <= tankPosition.y &&
      tankPosition.y - bulletPosition.y < distance
    ) {
      return true;
    }
    if (
      bulletPosition.orient === "UP" &&
      bulletPosition.y >= tankPosition.y &&
      bulletPosition.y - tankPosition.y < distance
    ) {
      return true;
    }
    return false;
  }
  if (
    bulletInsideTankHorizontal(tankPosition, bulletPosition) &&
    ["RIGHT", "LEFT"].includes(bulletPosition.orient)
  ) {
    if (
      bulletPosition.orient === "RIGHT" &&
      bulletPosition.x <= tankPosition.x &&
      tankPosition.x - bulletPosition.x < distance
    ) {
      return true;
    }
    if (
      bulletPosition.orient === "LEFT" &&
      bulletPosition.x >= tankPosition.x &&
      tankPosition.x - bulletPosition.x < distance
    ) {
      return true;
    }
    return false;
  }
  return false;
};

export const checkBlockBetweenBulletAndTank = (
  tankPosition: Position,
  bulletPosition: Position & { orient: Orient }
) => {
  if (
    bulletInsideTankVertical(tankPosition, bulletPosition) &&
    ["DOWN", "UP"].includes(bulletPosition.orient)
  ) {
    if (bulletPosition.orient === "DOWN" && bulletPosition.y < tankPosition.y) {
      for (
        let i = parseInt((bulletPosition.y + BulletSize).toString(), 10);
        i <= parseInt(tankPosition.y.toString(), 10);
        i += 10
      ) {
        if (
          hasBlockPosition({
            x: parseInt(bulletPosition.x.toString(), 10),
            y: i,
          }) ||
          hasBlockPosition({
            x: parseInt((bulletPosition.x + BulletSize).toString(), 10),
            y: i,
          })
        ) {
          return true;
        }
      }
    }
    if (bulletPosition.orient === "UP" && bulletPosition.y > tankPosition.y) {
      for (
        let i = parseInt((tankPosition.y + TankSize).toString());
        i <= parseInt(bulletPosition.y.toString());
        i += 10
      ) {
        if (
          hasBlockPosition({
            x: parseInt(bulletPosition.x.toString()),
            y: i,
          }) ||
          hasBlockPosition({
            x: parseInt((bulletPosition.x + BulletSize).toString()),
            y: i,
          })
        ) {
          return true;
        }
      }
    }
    return false;
  }
  if (
    bulletInsideTankHorizontal(tankPosition, bulletPosition) &&
    ["RIGHT", "LEFT"].includes(bulletPosition.orient)
  ) {
    if (
      bulletPosition.orient === "RIGHT" &&
      bulletPosition.x < tankPosition.x
    ) {
      for (
        let i = parseInt((bulletPosition.x + BulletSize).toString());
        i <= parseInt(tankPosition.x.toString());
        i += 10
      ) {
        if (
          hasBlockPosition({
            x: i,
            y: parseInt(bulletPosition.y.toString()),
          }) ||
          hasBlockPosition({
            x: i,
            y: parseInt((bulletPosition.y + BulletSize).toString()),
          })
        ) {
          return true;
        }
      }
    }
    if (bulletPosition.orient === "LEFT" && bulletPosition.x > tankPosition.x) {
      for (
        let i = parseInt((tankPosition.x + TankSize).toString());
        i <= parseInt(bulletPosition.x.toString());
        i += 10
      ) {
        if (
          hasBlockPosition({
            x: i,
            y: parseInt(bulletPosition.y.toString()),
          }) ||
          hasBlockPosition({
            x: i,
            y: parseInt((bulletPosition.y + BulletSize).toString()),
          })
        ) {
          return true;
        }
      }
    }
    return false;
  }
  return false;
};

export let dodgeRoad: Array<{ orient: Orient | null; count: number }> = [];

export let dodgeRoadChecked: Set<string> = new Set();

export const hasDodgeRoadChecked = (
  position: Position & { orient: Orient }
) => {
  return dodgeRoadChecked.has(`${position.x}-${position.y}-${position.orient}`);
};

export const addDodgeRoadChecked = (
  position: Position & { orient: Orient }
) => {
  dodgeRoadChecked.add(`${position.x}-${position.y}-${position.orient}`);
};

export const deleteDodgeRoadChecked = (
  position: Position & { orient: Orient }
) => {
  dodgeRoadChecked.delete(`${position.x}-${position.y}-${position.orient}`);
};

export const clearDedgeRoad = () => {
  dodgeRoad = [];
  dodgeRoadChecked.clear();
};

export const dodgeBullets = (
  tankPosition: Position & { orient: Orient },
  bullets: Array<Bullet>,
  ms: number,
  stepCount: number
): boolean => {
  if (
    tankPosition.x >= 900 ||
    tankPosition.x < 0 ||
    tankPosition.y >= 700 ||
    tankPosition.y < 0
  ) {
    return false;
  }
  if (stepCount >= 40) {
    return false;
  }
  if (checkTankPositionIsObject(tankPosition)) {
    return false;
  }
  let isSafe = true;
  const bulletUnblock = bullets.filter((bullet) => {
    const bulletPosition = bulletPositionAtPlustime(bullet, ms);
    if (checkBulletInsideBlock(bulletPosition)) {
      return false;
    }
    return true;
  });
  for (const bullet of bulletUnblock) {
    if (bullet.uid === myTank?.uid) {
      continue;
    }
    const bulletPosition = bulletPositionAtPlustime(bullet, ms);
    if (checkBulletInsideTank(tankPosition, bulletPosition)) {
      return false;
    }
    if (
      checkBulletRunningToTank(tankPosition, {
        ...bulletPosition,
        orient: bullet.orient,
      })
    ) {
      isSafe = false;
      const orients = ["UP", "DOWN", "RIGHT", "LEFT"];
      const unOrients = ["DOWN", "UP", "LEFT", "RIGHT"];
      for (const i in orients) {
        const orient = orients[i];
        const unOrient = unOrients[i];
        if (unOrient === bullet.orient) {
          continue;
        }
        const movePosition = {
          ...tankPositionAtNextTime(tankPosition, orient as never),
          orient,
        };
        if (!hasDodgeRoadChecked(movePosition as never)) {
          dodgeRoad.push({
            orient,
            count: 1,
          } as never);
          addDodgeRoadChecked(movePosition as never);
          const responseUp = dodgeBullets(
            movePosition as never,
            bulletUnblock,
            ms + TankTimeSpeed,
            stepCount + 1
          );
          if (responseUp) {
            return responseUp;
          }
          dodgeRoad.pop();
          deleteDodgeRoadChecked(movePosition as never);
        }
      }
    }
  }
  return isSafe ? dodgeRoad.length > 0 : false;
};
