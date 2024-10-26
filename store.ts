import {
  BulletSize,
  MY_NAME,
  MapSize,
  ObjectSize,
  TankSize,
  TankTimeSpeed,
} from "./constants";
import {
  bulletPositionAtRunTime,
  safeArea,
  checkBulletsInsideTank,
  checkTankPositionIsObject,
  euclideanDistance,
  initPosition,
  tankPositionAtNextTime,
  isSameHorizontalAxisWithSize,
  isSameVerticalAxisWithSize,
  checkFullTankNearestBlock,
  checkTankOverlap,
} from "./utils";
import * as _ from "lodash";

export const tanks: Map<string, Tank> = new Map();

export const tanksId: Map<string, string> = new Map();

export const bullets: Map<number, Bullet> = new Map();

export const isReborn: Set<string> = new Set();

export let mapMatch: MapMatch = [];

export let myTank: Tank | null = null;

export let blockPosition: Set<string> = new Set();

export let blockPositionHorizontal: Record<number, Array<number>> = {};

export let blockPositionVertical: Record<number, Array<number>> = {};

export let objectPosition: Set<string> = new Set();

export let objectPositionHorizontal: Record<number, Array<number>> = {};

export let objectPositionVertical: Record<number, Array<number>> = {};

export let isFinish = true;

export let runTime = new Date().getTime();

export let resolveStartPromise: any = null;

export let resolveShootPromise: any = null;

export let resolveMovePromise: any = null;

export let resolveJoiningPromise: any = null;

export let isShootAble: boolean = true;

export let isMoveAble: boolean = true;

export let isJoinning: boolean = false;

export let targetTankName: string = "";

export let loadedMap = false;

export let lastMoveTime = 0;

export let banTankByName: string = "";

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
  data: Array<Orient | "SHOOT">;
  index: number;
} = {
  priority: 3,
  data: [],
  index: -1,
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

export const resetShootPromise = () => {
  shootPromise = new Promise<boolean>(
    (resolve) => (resolveShootPromise = resolve)
  );
};

export const resetMovePromise = () => {
  movePromise = new Promise<boolean>(
    (resolve) => (resolveMovePromise = resolve)
  );
};

export const clearRoad = () => {
  road.priority = 3;
  road.data = [];
  road.index = -1;
};

export const saveLastMoveTime = (timestamp: number) =>
  (lastMoveTime = timestamp);

export const saveBanTankByName = (name: string) => {
  banTankByName = name;
};

export const findTargetTank = (_banName: string = "") => {
  if (myTank && myTank.x && myTank.y && tanks.size) {
    const _tanks = Array.from(tanks.values())
      .filter(
        (tank) =>
          tank.name !== MY_NAME &&
          !isReborn.has(tank.name) &&
          tank.name !== _banName
      )
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
      saveTargetTankName(_tanks?.[0]?.name ?? "");
    }
  }
};

export const saveTargetTankName = (name: string) => {
  targetTankName = name;
};

export const saveRoad = (priority: number, data: Array<Orient | "SHOOT">) => {
  try {
    if (data.length) {
      if (priority < road.priority) {
        road.priority = priority;
        road.data = data.concat();
        road.index = 0;
      } else if (!Boolean(road.data.length)) {
        road.priority = priority;
        road.data = data.concat();
        road.index = 0;
      }
    }
  } catch (e) {
    console.log(e);
  }
};

export const saveIsJoinning = (_v: boolean) => (isJoinning = _v);

export const saveIsMoveAble = (_v: boolean) => (isMoveAble = _v);

export const saveIsShootAble = (_v: boolean) => (isShootAble = _v);

export const isReboring = (tankName: string) => {
  isReborn.add(tankName);
};

export const clearIsReboring = (tankName: string) => {
  isReborn.delete(tankName);
};

export const addBlockPosition = (position: Position) => {
  blockPosition.add(`${Math.round(position.x)}-${Math.round(position.y)}`);
};

export const hasBlockPosition = (position: Position) => {
  return blockPosition.has(
    `${Math.round(position.x)}-${Math.round(position.y)}`
  );
};

export const hasBlockBetweenObjects = (
  largeSize: Position & { size: number },
  smallSize: Position & { size: number },
  isHorizontal: boolean = false
): boolean => {
  const minX = Math.min(Math.round(largeSize.x), Math.round(smallSize.x));
  const maxX = Math.max(Math.round(largeSize.x), Math.round(smallSize.x));

  const minY = Math.min(Math.round(largeSize.y), Math.round(smallSize.y));
  const maxY = Math.max(Math.round(largeSize.y), Math.round(smallSize.y));
  if (isHorizontal) {
    for (let i = minY; i <= maxY; i++) {
      if (
        blockPositionHorizontal[i]?.findIndex((v) => v >= minX && v <= maxX) >=
        0
      ) {
        return true;
      }
    }
    return false;
  }

  for (let i = minX; i <= maxX; i++) {
    if (
      blockPositionVertical[i]?.findIndex((v) => v >= minY && v <= maxY) >= 0
    ) {
      return true;
    }
  }

  return false;
};

export const addObjectPosition = (position: Position) => {
  objectPosition.add(`${Math.round(position.x)}-${Math.round(position.y)}`);
};

export const hasObjectPosition = (position: Position) => {
  return objectPosition.has(
    `${Math.round(position.x)}-${Math.round(position.y)}`
  );
};

export const addBlockPositionHorizontal = (position: Position) => {
  if (!blockPositionHorizontal[position.y]) {
    blockPositionHorizontal[position.y] = [];
  }
  blockPositionHorizontal[position.y].push(position.x);
};

export const addBlockPositionVertical = (position: Position) => {
  if (!blockPositionVertical[position.x]) {
    blockPositionVertical[position.x] = [];
  }
  blockPositionVertical[position.x].push(position.y);
};

export const saveMap = (map: MapMatch) => {
  if (loadedMap) {
    return;
  }
  mapMatch = map;
  for (let y = 1; y < map.length - 1; y++) {
    for (let x = 1; x < map[y].length - 1; x++) {
      if (map[y][x] === "B") {
        for (let by = 0; by < ObjectSize; by++) {
          for (let bx = 0; bx < ObjectSize; bx++) {
            const position = initPosition(
              bx + x * ObjectSize,
              by + y * ObjectSize
            );
            addBlockPosition(position);
            if (by === 0 || (by > 0 && bx === 0)) {
              addBlockPositionHorizontal(position);
            }
            if (bx === 0 || (bx > 0 && by === 0)) {
              addBlockPositionVertical(position);
            }
          }
        }
      }
      if (map[y][x] === "T" || map[y][x] === "W") {
        for (let by = 0; by < ObjectSize; by++) {
          for (let bx = 0; bx < ObjectSize; bx++) {
            const position = initPosition(
              bx + x * ObjectSize,
              by + y * ObjectSize
            );
            addObjectPosition(position);
          }
        }
      }
    }
  }
  console.log("Save Done");
  loadedMap = true;
};

export const saveTanks = (_tanks: Array<Tank>) => {
  _tanks.forEach((tank) => {
    if (tank.x && tank.y) {
      if (tank.name === MY_NAME) {
        myTank = tank;
        saveIsShootAble(tank.shootable);
      } else {
        tanks.set(tank?.name, tank);
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

export let roadMapX20: Array<Position> = [];

const movePostionDirection = [
  { x: 1, y: 0 }, // Di chuyển theo x+
  { x: -1, y: 0 }, // Di chuyển theo x-
  { x: 0, y: 1 }, // Di chuyển theo y+
  { x: 0, y: -1 }, // Di chuyển theo y-
];

export const findTargetOnMap = () => {
  if (targetTankName === "") {
    findTargetTank();
  }
  if (targetTankName === "" || !myTank || !myTank.x || !myTank.y) {
    return [];
  }
  const tank = tanks.get(targetTankName);
  if (!tank) {
    return [];
  }
  const myTankIndex = initPosition(
    Math.round((myTank.x + TankSize / 2) / ObjectSize),
    Math.round((myTank.y + TankSize / 2) / ObjectSize)
  );
  const targetTankIndex = initPosition(
    Math.round((tank.x + TankSize / 2) / ObjectSize),
    Math.round((tank.y + TankSize / 2) / ObjectSize)
  );
  const result: Array<Position> = [];
  const checked: any = {
    [myTankIndex.y]: {
      [myTankIndex.x]: null,
    },
  };
  const queue: Array<Position> = [
    {
      x: myTankIndex.x,
      y: myTankIndex.y,
    },
  ];
  while (queue.length) {
    const tankPosition = queue.shift();
    if (!tankPosition) {
      continue;
    }
    if (
      tankPosition.x === targetTankIndex.x &&
      tankPosition.y === targetTankIndex.y
    ) {
      //finded
      let position = checked[tankPosition?.y ?? ""][tankPosition?.x ?? ""];
      while (
        position !== null &&
        (position?.x !== myTankIndex.x || position?.y !== myTankIndex.y)
      ) {
        result.unshift(position as never);
        position = checked[position?.y ?? ""][position?.x ?? ""];
      }
      break;
    }
    for (let dir of movePostionDirection) {
      const moveNextPosition = initPosition(
        tankPosition.x + dir.x,
        tankPosition.y + dir.y
      );
      if (
        moveNextPosition.x < 1 ||
        moveNextPosition.x > 43 ||
        moveNextPosition.y < 1 ||
        moveNextPosition.y > 33 ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y][moveNextPosition.x] as never
        )
      ) {
        continue;
      }
      if (!checked?.[moveNextPosition.y]?.[moveNextPosition.x]) {
        if (!checked?.[moveNextPosition.y]) {
          checked[moveNextPosition.y] = {};
        }
        checked[moveNextPosition.y][moveNextPosition.x] = {
          x: tankPosition.x,
          y: tankPosition.y,
        };
        queue.push(moveNextPosition);
      }
    }
  }
  return result;
};

const orients = ["UP", "DOWN", "RIGHT", "LEFT"];

const unOrients = ["DOWN", "UP", "LEFT", "RIGHT"];

const findDistance = [
  800, 750, 700, 650, 600, 550, 500, 450, 400, 320, 232, 200, 132, 96,
];

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
    if (unOrient === "ROOT") {
      break;
    }
    findOrientIndex = unOrients.findIndex((v) => v === unOrient);
    prevPosition = tankPositionAtNextTime(prevPosition as never, unOrient);
    result.unshift({
      ...prevPosition,
      orient: orients[findOrientIndex] ?? "null",
    } as never);
  }
  return result;
};

export const findToBlockNearest = (
  tankPosition: Position & { orient: Orient },
  ms: number
) => {
  try {
    const result: Array<any> = [];
    let findRoad: any = {
      [tankPosition.y]: {
        [tankPosition.x]: "ROOT",
      },
    };

    if (tankPosition && tankPosition.x && tankPosition.y) {
      const queue: Array<Position & { ms: number }> = [
        { ...tankPosition, ms: ms },
      ];

      let correct = false;

      let countBlock = 0;

      while (queue.length) {
        const tankPosition = queue.shift();
        if (tankPosition) {
          if (
            correct &&
            _.inRange(tankPosition.x, 100, 800) &&
            _.inRange(tankPosition.y, 100, 600)
          ) {
            result.push(...revertRoad(findRoad, tankPosition as any));
            break;
          }
          correct = false;
          for (let i = 0; i < orients.length; i++) {
            const orient = orients[i];
            const moveNextPosition = tankPositionAtNextTime(
              tankPosition as never,
              orient as never
            );
            if (
              !(
                moveNextPosition!.x >= 848 ||
                moveNextPosition!.x < 20 ||
                moveNextPosition!.y >= 648 ||
                moveNextPosition!.y < 20
              )
            ) {
              if (checkTankPositionIsObject(moveNextPosition as never)) {
                if (checkFullTankNearestBlock(moveNextPosition)) {
                  countBlock++;
                }
              } else if (
                !findRoad?.[moveNextPosition.y]?.[moveNextPosition.x]
              ) {
                if (!findRoad?.[moveNextPosition.y]) {
                  findRoad[moveNextPosition.y] = {};
                }
                findRoad[moveNextPosition.y][moveNextPosition.x] = unOrients[i];
                queue.push({
                  ...moveNextPosition,
                  ms: (tankPosition?.ms ?? 0) + TankTimeSpeed,
                });
              }
            }
          }
          if (countBlock >= 1) {
            correct = true;
          }
        }
        countBlock = 0;
      }
    }
    return result;
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const checkTankInLine = (tankPosition: Position, tank: Tank) => {
  const isHorizontal = isSameHorizontalAxisWithSize(
    { x: tank.x, y: tank.y, size: TankSize },
    {
      x: tankPosition.x,
      y: tankPosition.y,
      size: TankSize,
    }
  );
  const isVertical = isSameVerticalAxisWithSize(
    { x: tank.x, y: tank.y, size: TankSize },
    {
      x: tankPosition.x,
      y: tankPosition.y,
      size: TankSize,
    }
  );
  if (
    (isVertical || isHorizontal) &&
    euclideanDistance(tankPosition, tank) <= TankSize * 4 &&
    euclideanDistance(tankPosition, tank) >= TankSize &&
    !hasBlockBetweenObjects(
      { x: tank.x, y: tank.y, size: TankSize },
      {
        x: tankPosition.x,
        y: tankPosition.y,
        size: TankSize,
      },
      isHorizontal ? true : false
    )
  ) {
    return true;
  }
  return false;
};

export const findRoadToTarget = (
  tankPosition: Position & { orient: Orient },
  ms: number
) => {
  try {
    // if (targetTankUID === "") {
    //   return [];
    // }
    const result: Array<any> = [];
    let findRoad: any = {
      [tankPosition.y]: {
        [tankPosition.x]: "ROOT",
      },
    };

    const _bullets = Array.from(bullets.values());

    if (tankPosition) {
      const queue: Array<Position & { ms: number }> = [
        { ...tankPosition, ms: ms },
      ];

      const tank = tanks.get(targetTankName);

      while (queue.length) {
        const tankPosition = queue.shift();
        if (tankPosition && tankPosition?.ms < 4000) {
          if (tank) {
            if (checkTankInLine(tankPosition, tank)) {
              result.push(...revertRoad(findRoad, tankPosition as any));
              break;
            }
          } else {
            let finded = false;
            let tankName = "";
            tanks.forEach((tank) => {
              if (
                tank.name !== MY_NAME &&
                checkTankInLine(tankPosition, tank)
              ) {
                finded = true;
                tankName = tank.name;
              }
            });
            if (finded && tankName) {
              saveTargetTankName(tankName);
              result.push(...revertRoad(findRoad, tankPosition as any));
              break;
            }
          }
        }
        for (let i = 0; i < orients.length; i++) {
          const orient = orients[i];
          const moveNextPosition = tankPositionAtNextTime(
            tankPosition as never,
            orient as never
          );
          if (
            !checkTankPositionIsObject(moveNextPosition as never) &&
            safeArea(
              moveNextPosition,
              _bullets,
              (tankPosition?.ms ?? 0) + TankTimeSpeed
            ) &&
            !(
              moveNextPosition!.x >= 848 ||
              moveNextPosition!.x < 20 ||
              moveNextPosition!.y >= 648 ||
              moveNextPosition!.y < 20
            )
          ) {
            if (!findRoad?.[moveNextPosition.y]?.[moveNextPosition.x]) {
              if (!findRoad?.[moveNextPosition.y]) {
                findRoad[moveNextPosition.y] = {};
              }
              findRoad[moveNextPosition.y][moveNextPosition.x] = unOrients[i];
              queue.push({
                ...moveNextPosition,
                ms: (tankPosition?.ms ?? 0) + TankTimeSpeed,
              });
            }
          }
        }
      }
    }
    return result;
  } catch (e) {
    console.log(e);
    return [];
  }
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
    const _tankPosition = queue.shift();
    if (safeArea(_tankPosition as never, bullets, _tankPosition?.ms as never)) {
      //REVERT POSITION
      result.push(...revertRoad(dodgeRoad, _tankPosition as any));
      break;
    }
    isSafe = false;
    for (let i = 0; i < orients.length; i++) {
      const orient = orients[i];
      const moveNextPosition = tankPositionAtNextTime(
        _tankPosition as never,
        orient as never
      );
      if (
        !checkTankPositionIsObject(moveNextPosition as never) &&
        !checkTankOverlap(moveNextPosition, tanks) &&
        !checkBulletsInsideTank(
          _tankPosition as never,
          bullets,
          _tankPosition!.ms
        ) &&
        !(
          moveNextPosition!.x >= 848 ||
          moveNextPosition!.x < 20 ||
          moveNextPosition!.y >= 648 ||
          moveNextPosition!.y < 20
        )
      ) {
        if (!dodgeRoad?.[moveNextPosition.y]?.[moveNextPosition.x]) {
          if (!dodgeRoad?.[moveNextPosition.y]) {
            dodgeRoad[moveNextPosition.y] = {};
          }
          dodgeRoad[moveNextPosition.y][moveNextPosition.x] = unOrients[i];
          queue.push({
            ...moveNextPosition,
            ms: (_tankPosition?.ms ?? 0) + TankTimeSpeed,
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
