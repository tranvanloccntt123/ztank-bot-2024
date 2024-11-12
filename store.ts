import {
  BulletSize,
  MY_NAME,
  ObjectSize,
  TankOnObjectPercent,
  TankSize,
  TankTimeSpeed,
} from "./constants";
import {
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
  mapIndexOnMapMatch,
  inRange,
} from "./utils";
import { map1 } from "./map/map1";
import { map2 } from "./map/map2";
import { map3 } from "./map/map3";
import { map4 } from "./map/map4";
import { map5 } from "./map/map5";

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

export let mapNumber = -1;

export let lastMoveTime = 0;

export let banTankByName: string = "";

export const listDefZoneV2: Record<
  number,
  Record<number, Record<number, boolean>>
> = {
  1: {
    8: {
      8: true,
      35: true,
    },
    13: {
      10: true,
      33: true,
    },
    5: {
      12: true,
      29: true,
    },
    7: {
      17: true,
      26: true,
    },
    19: {
      10: true,
      33: true,
    },
    26: {
      17: true,
      26: true,
    },
    28: {
      12: true,
      29: true,
    },
    25: {
      8: true,
      35: true,
    },
  },
  2: {
    8: { 21: true },
    25: { 21: true },
    15: { 11: true, 32: true },
    18: { 11: true, 32: true },
  },
  3: {
    9: { 14: true, 29: true },
    20: { 12: true, 31: true },
    13: { 12: true, 31: true },
    24: { 14: true, 29: true },
  },
  4: {
    3: { 6: true, 16: true, 37: true },
    6: { 3: true, 9: true, 34: true, 40: true },
    9: { 6: true, 37: true },
    24: { 6: true, 37: true },
    26: { 16: true },
    27: { 3: true, 9: true, 34: true, 40: true },
    30: { 6: true, 26: true, 37: true },
  },
  5: {
    1: { 15: true },
    3: { 4: true },
    14: { 4: true },
    16: { 15: true },
    17: { 28: true },
    19: { 39: true },
    30: {
      39: true,
    },
    32: {
      28: true,
    },
  },
};

export const listDefZone: Record<
  number,
  Record<number, Record<number, boolean>>
> = {
  1: {
    7: { 17: true, 24: true },
    14: { 32: true, 9: true },
    19: { 32: true, 9: true },
    26: { 17: true, 24: true },
  },
  2: {
    7: { 21: true },
    25: { 21: true },
    17: { 25: true, 15: true },
  },
  3: {
    7: { 20: true },
    25: { 20: true },
    23: { 34: true, 7: true },
    10: { 34: true, 7: true },
  },
  4: {
    7: { 19: true },
    25: { 19: true },
    16: { 34: true, 9: true },
  },
  5: {
    11: { 20: true },
    22: { 20: true },
    15: { 30: true },
    17: { 12: true },
  },
};

/*
  Priority:
  - 0: dodge
  - 1: shoot
  - 2: normal
*/
export const MovePriority = {
  DODGE: 0,
  SHOOT: 1,
  PAUSE: 2,
  NORMAL: 3,
  RANDOM_BLOCK: 4,
  CLEAR: 9999,
};

export let road: {
  priority: number;
  data: Array<Orient | "SHOOT" | "PAUSE">;
  index: number;
} = {
  priority: MovePriority.CLEAR,
  data: [],
  index: -1,
};

export const clearLoadedMap = () => {
  loadedMap = false;
  blockPositionHorizontal = {};
  blockPositionVertical = {};
  blockPosition.clear();
  objectPosition.clear();
  objectPositionHorizontal = {};
  objectPositionVertical = {};
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
  road.priority = MovePriority.CLEAR;
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

export const saveRoad = (
  priority: number,
  data: Array<Orient | "SHOOT" | "PAUSE">
) => {
  try {
    if (priority === MovePriority.SHOOT && !isShootAble) {
      return;
    }
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
  const minX = Math.min(
    Math.round(largeSize.x),
    Math.round(smallSize.x),
    Math.round(largeSize.x + largeSize.size),
    Math.round(smallSize.x + smallSize.size)
  );
  const maxX = Math.max(
    Math.round(largeSize.x),
    Math.round(smallSize.x),
    Math.round(largeSize.x + largeSize.size),
    Math.round(smallSize.x + smallSize.size)
  );

  const minY = Math.min(
    Math.round(largeSize.y),
    Math.round(smallSize.y),
    Math.round(largeSize.y + largeSize.size),
    Math.round(smallSize.y + smallSize.size)
  );
  const maxY = Math.max(
    Math.round(largeSize.y),
    Math.round(smallSize.y),
    Math.round(largeSize.y + largeSize.size),
    Math.round(smallSize.y + smallSize.size)
  );
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
  let mapString = map.toString();
  if (mapString === map1.toString()) {
    mapNumber = 1;
  }
  if (mapString === map2.toString()) {
    mapNumber = 2;
  }
  if (mapString === map3.toString()) {
    mapNumber = 3;
  }
  if (mapString === map4.toString()) {
    mapNumber = 4;
  }
  if (mapString === map5.toString()) {
    mapNumber = 5;
  }
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

const movePositionDirection: Array<Position> = [
  { x: 1, y: 0 }, // Di chuyển theo x+
  { x: -1, y: 0 }, // Di chuyển theo x-
  { x: 0, y: 1 }, // Di chuyển theo y+
  { x: 0, y: -1 }, // Di chuyển theo y-
];

const movePositionDirectionRandom = (): Array<Position> => {
  return movePositionDirection.sort(() => Math.random() - 0.5);
};

export const findTargetTankV2 = () => {
  if (!myTank || !myTank.x || !myTank.y) {
    return [];
  }
  const _tanks = Array.from(tanks.values());
  let isFinding = false;
  const tankVisible: Array<Tank> = [];
  const tankMapIndex: Array<Position> = [];
  const tankOrient: Array<Orient> = [];
  for (const tank of _tanks) {
    if (!isReborn.has(tank.name)) {
      isFinding = true;
      tankVisible.push(tank);
      tankMapIndex.push(
        initPosition(
          Math.floor(tank.x / ObjectSize),
          Math.floor(tank.y / ObjectSize)
        )
      );
      tankOrient.push(tank.orient);
    }
  }
  const myTankIndex = initPosition(
    Math.floor(myTank.x / ObjectSize),
    Math.floor(myTank.y / ObjectSize)
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

  const tankMapIndexUnVisible: Record<number, Record<number, boolean>> = [];
  tanks.forEach((tank) => {
    if (tank.name !== MY_NAME) {
      let tankIndex = mapIndexOnMapMatch(tank, ObjectSize);

      if (!tankMapIndexUnVisible?.[tankIndex.startY]) {
        tankMapIndexUnVisible[tankIndex.startY] = {};
      }

      if (!tankMapIndex?.[tankIndex.endY]) {
        tankMapIndexUnVisible[tankIndex.endY] = {};
      }

      if (!tankMapIndexUnVisible?.[tankIndex.startY + 1]) {
        tankMapIndexUnVisible[tankIndex.startY + 1] = {};
      }

      if (!tankMapIndexUnVisible?.[tankIndex.startY - 1]) {
        tankMapIndexUnVisible[tankIndex.startY - 1] = {};
      }

      if (!tankMapIndexUnVisible?.[tankIndex.endY + 1]) {
        tankMapIndexUnVisible[tankIndex.endY + 1] = {};
      }

      if (!tankMapIndexUnVisible?.[tankIndex.endY - 1]) {
        tankMapIndexUnVisible[tankIndex.endY - 1] = {};
      }
      //
      tankMapIndexUnVisible[tankIndex.startY - 1][tankIndex.startX - 1] = true;
      tankMapIndexUnVisible[tankIndex.startY - 1][tankIndex.startX] = true;
      tankMapIndexUnVisible[tankIndex.startY - 1][tankIndex.endX] = true;
      tankMapIndexUnVisible[tankIndex.startY - 1][tankIndex.endX + 1] = true;
      //
      tankMapIndexUnVisible[tankIndex.startY][tankIndex.startX - 1] = true;
      tankMapIndexUnVisible[tankIndex.startY][tankIndex.startX] = true;
      tankMapIndexUnVisible[tankIndex.startY][tankIndex.endX] = true;
      tankMapIndexUnVisible[tankIndex.startY][tankIndex.endX + 1] = true;
      //
      tankMapIndexUnVisible[tankIndex.endY][tankIndex.startX - 1] = true;
      tankMapIndexUnVisible[tankIndex.endY][tankIndex.startX] = true;
      tankMapIndexUnVisible[tankIndex.endY][tankIndex.endX] = true;
      tankMapIndexUnVisible[tankIndex.endY][tankIndex.endX + 1] = true;
      //
      tankMapIndexUnVisible[tankIndex.endY + 1][tankIndex.startX - 1] = true;
      tankMapIndexUnVisible[tankIndex.endY + 1][tankIndex.startX] = true;
      tankMapIndexUnVisible[tankIndex.endY + 1][tankIndex.endX] = true;
      tankMapIndexUnVisible[tankIndex.endY + 1][tankIndex.endX + 1] = true;
    }
  });

  while (queue.length) {
    const currentPosition = queue.shift();
    if (!currentPosition) {
      continue;
    }
    let finded = false;
    for (const index in tankMapIndex) {
      const targetTankIndex = tankMapIndex[index];
      if (
        ((targetTankIndex.x === currentPosition.x &&
          !hasBlockBetweenObjects(
            {
              x: currentPosition.x * ObjectSize,
              y: currentPosition.y * ObjectSize,
              size: TankSize,
            },
            {
              x: targetTankIndex.x * ObjectSize,
              y: targetTankIndex.y * ObjectSize,
              size: TankSize,
            },
            false
          )) ||
          (targetTankIndex.y === currentPosition.y &&
            !hasBlockBetweenObjects(
              {
                x: currentPosition.x * ObjectSize,
                y: currentPosition.y * ObjectSize,
                size: TankSize,
              },
              {
                x: targetTankIndex.x * ObjectSize,
                y: targetTankIndex.y * ObjectSize,
                size: TankSize,
              }
            ))) &&
        euclideanDistance(currentPosition, targetTankIndex) <= 5
      ) {
        //finded
        result.unshift(currentPosition as never);
        let position =
          checked[currentPosition?.y ?? ""][currentPosition?.x ?? ""];
        while (
          position !== null &&
          (position?.x !== myTankIndex.x || position?.y !== myTankIndex.y)
        ) {
          result.unshift(position as never);
          position = checked[position?.y ?? ""][position?.x ?? ""];
        }
        finded = true;
        saveTargetTankName(tankVisible[index].name);
        break;
      }
    }
    if (finded) {
      break;
    }
    for (let dir of movePositionDirectionRandom()) {
      const moveNextPosition = initPosition(
        currentPosition.x + dir.x,
        currentPosition.y + dir.y
      );
      if (
        moveNextPosition.x < 1 ||
        moveNextPosition.x > 43 ||
        moveNextPosition.y < 1 ||
        moveNextPosition.y > 33 ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y][moveNextPosition.x] as never
        ) ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y][moveNextPosition.x + 1] as never
        ) ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y + 1][moveNextPosition.x] as never
        ) ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y + 1][moveNextPosition.x + 1] as never
        ) ||
        tankMapIndexUnVisible?.[moveNextPosition.y]?.[moveNextPosition.x] ||
        tankMapIndexUnVisible?.[moveNextPosition.y + 1]?.[moveNextPosition.x] ||
        tankMapIndexUnVisible?.[moveNextPosition.y]?.[moveNextPosition.x + 1] ||
        tankMapIndexUnVisible?.[moveNextPosition.y + 1]?.[
          moveNextPosition.x + 1
        ]
      ) {
        continue;
      }
      if (!checked?.[moveNextPosition.y]?.[moveNextPosition.x]) {
        if (!checked?.[moveNextPosition.y]) {
          checked[moveNextPosition.y] = {};
        }
        checked[moveNextPosition.y][moveNextPosition.x] = {
          x: currentPosition.x,
          y: currentPosition.y,
        };
        queue.push(moveNextPosition);
      }
    }
  }
  return result;
};

export const findToDefZoneOnMap = (
  listZone?: Record<number, Record<number, Record<number, boolean>>>
) => {
  if (!myTank || !myTank.x || !myTank.y || !listDefZone[mapNumber]) {
    return [];
  }
  //y - x - true
  const tankMapIndex: Record<number, Record<number, boolean>> = [];
  tanks.forEach((tank) => {
    if (tank.name !== MY_NAME) {
      let tankIndex = mapIndexOnMapMatch(tank, ObjectSize);

      if (!tankMapIndex?.[tankIndex.startY]) {
        tankMapIndex[tankIndex.startY] = {};
      }

      if (!tankMapIndex?.[tankIndex.endY]) {
        tankMapIndex[tankIndex.endY] = {};
      }

      if (!tankMapIndex?.[tankIndex.startY + 1]) {
        tankMapIndex[tankIndex.startY + 1] = {};
      }

      if (!tankMapIndex?.[tankIndex.startY - 1]) {
        tankMapIndex[tankIndex.startY - 1] = {};
      }

      if (!tankMapIndex?.[tankIndex.endY + 1]) {
        tankMapIndex[tankIndex.endY + 1] = {};
      }

      if (!tankMapIndex?.[tankIndex.endY - 1]) {
        tankMapIndex[tankIndex.endY - 1] = {};
      }
      //
      tankMapIndex[tankIndex.startY - 1][tankIndex.startX - 1] = true;
      tankMapIndex[tankIndex.startY - 1][tankIndex.startX] = true;
      tankMapIndex[tankIndex.startY - 1][tankIndex.endX] = true;
      tankMapIndex[tankIndex.startY - 1][tankIndex.endX + 1] = true;
      //
      tankMapIndex[tankIndex.startY][tankIndex.startX - 1] = true;
      tankMapIndex[tankIndex.startY][tankIndex.startX] = true;
      tankMapIndex[tankIndex.startY][tankIndex.endX] = true;
      tankMapIndex[tankIndex.startY][tankIndex.endX + 1] = true;
      //
      tankMapIndex[tankIndex.endY][tankIndex.startX - 1] = true;
      tankMapIndex[tankIndex.endY][tankIndex.startX] = true;
      tankMapIndex[tankIndex.endY][tankIndex.endX] = true;
      tankMapIndex[tankIndex.endY][tankIndex.endX + 1] = true;
      //
      tankMapIndex[tankIndex.endY + 1][tankIndex.startX - 1] = true;
      tankMapIndex[tankIndex.endY + 1][tankIndex.startX] = true;
      tankMapIndex[tankIndex.endY + 1][tankIndex.endX] = true;
      tankMapIndex[tankIndex.endY + 1][tankIndex.endX + 1] = true;
    }
  });
  //TODO
  const myTankIndex = initPosition(
    Math.floor(myTank.x / ObjectSize),
    Math.floor(myTank.y / ObjectSize)
  );

  const defZones =
    (listZone ? listZone[mapNumber] : listDefZoneV2[mapNumber]) ?? {};

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
    const currentPosition = queue.shift();
    if (!currentPosition) {
      continue;
    }
    let finded = false;
    if (
      defZones[currentPosition.y]?.[currentPosition.x] &&
      !inRange(currentPosition.x, myTankIndex.x - 1, myTankIndex.x + 2) &&
      !inRange(currentPosition.y, myTankIndex.y - 1, myTankIndex.y + 2)
    ) {
      let checkTankInside: boolean = false;
      tanks.forEach((tank) => {
        if (tank.name === MY_NAME || !!checkTankInside) {
          return;
        }
        const mapIndex = mapIndexOnMapMatch(tank, TankOnObjectPercent);
        if (
          inRange(currentPosition.x, mapIndex.startX, mapIndex.endX + 1) ||
          inRange(currentPosition.y, mapIndex.startY, mapIndex.endY + 1)
        ) {
          checkTankInside = true;
        }
      });
      if (checkTankInside) {
        break;
      }
      //finded
      result.unshift(currentPosition as never);
      let position =
        checked[currentPosition?.y ?? ""][currentPosition?.x ?? ""];
      while (
        position !== null &&
        (position?.x !== myTankIndex.x || position?.y !== myTankIndex.y)
      ) {
        result.unshift(position as never);
        position = checked[position?.y ?? ""][position?.x ?? ""];
      }
      finded = true;
      break;
    }
    if (finded) {
      break;
    }
    for (let dir of movePositionDirectionRandom()) {
      const moveNextPosition = initPosition(
        currentPosition.x + dir.x,
        currentPosition.y + dir.y
      );
      if (
        moveNextPosition.x < 1 ||
        moveNextPosition.x > 43 ||
        moveNextPosition.y < 1 ||
        moveNextPosition.y > 33 ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y][moveNextPosition.x] as never
        ) ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y][moveNextPosition.x + 1] as never
        ) ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y + 1][moveNextPosition.x] as never
        ) ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y + 1][moveNextPosition.x + 1] as never
        ) ||
        tankMapIndex?.[moveNextPosition.y]?.[moveNextPosition.x]
      ) {
        continue;
      }
      if (!checked?.[moveNextPosition.y]?.[moveNextPosition.x]) {
        if (!checked?.[moveNextPosition.y]) {
          checked[moveNextPosition.y] = {};
        }
        checked[moveNextPosition.y][moveNextPosition.x] = {
          x: currentPosition.x,
          y: currentPosition.y,
        };
        queue.push(moveNextPosition);
      }
    }
  }
  return result;
};

export const findTargetOnMap = () => {
  if (targetTankName === "" || !myTank || !myTank.x || !myTank.y) {
    return [];
  }
  const tank = tanks.get(targetTankName);
  if (!tank) {
    return [];
  }
  const myTankIndex = initPosition(
    Math.floor(myTank.x / ObjectSize),
    Math.floor(myTank.y / ObjectSize)
  );
  const targetTankIndex = initPosition(
    Math.floor(tank.x / ObjectSize),
    Math.floor(tank.y / ObjectSize)
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
    const currentPosition = queue.shift();
    if (!currentPosition) {
      continue;
    }
    if (
      ((targetTankIndex.x === currentPosition.x &&
        !hasBlockBetweenObjects(
          {
            x: currentPosition.x * ObjectSize,
            y: currentPosition.y * ObjectSize,
            size: TankSize,
          },
          {
            x: targetTankIndex.x * ObjectSize,
            y: targetTankIndex.y * ObjectSize,
            size: TankSize,
          },
          false
        )) ||
        (targetTankIndex.y === currentPosition.y &&
          !hasBlockBetweenObjects(
            {
              x: currentPosition.x * ObjectSize,
              y: currentPosition.y * ObjectSize,
              size: TankSize,
            },
            {
              x: targetTankIndex.x * ObjectSize,
              y: targetTankIndex.y * ObjectSize,
              size: TankSize,
            }
          ))) &&
      euclideanDistance(currentPosition, targetTankIndex) >= 2 &&
      euclideanDistance(currentPosition, targetTankIndex) <= 5
    ) {
      //finded
      result.unshift(currentPosition as never);
      let position =
        checked[currentPosition?.y ?? ""][currentPosition?.x ?? ""];
      while (
        position !== null &&
        (position?.x !== myTankIndex.x || position?.y !== myTankIndex.y)
      ) {
        result.unshift(position as never);
        position = checked[position?.y ?? ""][position?.x ?? ""];
      }
      break;
    }
    for (let dir of movePositionDirectionRandom()) {
      const moveNextPosition = initPosition(
        currentPosition.x + dir.x,
        currentPosition.y + dir.y
      );
      if (
        moveNextPosition.x < 1 ||
        moveNextPosition.x > 43 ||
        moveNextPosition.y < 1 ||
        moveNextPosition.y > 33 ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y][moveNextPosition.x] as never
        ) ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y][moveNextPosition.x + 1] as never
        ) ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y + 1][moveNextPosition.x] as never
        ) ||
        ["B", "T", "W"].includes(
          mapMatch[moveNextPosition.y + 1][moveNextPosition.x + 1] as never
        )
      ) {
        continue;
      }
      if (!checked?.[moveNextPosition.y]?.[moveNextPosition.x]) {
        if (!checked?.[moveNextPosition.y]) {
          checked[moveNextPosition.y] = {};
        }
        checked[moveNextPosition.y][moveNextPosition.x] = {
          x: currentPosition.x,
          y: currentPosition.y,
        };
        queue.push(moveNextPosition);
      }
    }
  }
  return result;
};

const orients: Array<Orient> = ["UP", "DOWN", "RIGHT", "LEFT"];

const unOrients: Array<Orient> = ["DOWN", "UP", "LEFT", "RIGHT"];

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
  while (unOrient !== "ROOT" && unOrient !== undefined) {
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
            inRange(tankPosition.x, 100, 800) &&
            inRange(tankPosition.y, 100, 600)
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
                moveNextPosition!.x >= 879 ||
                moveNextPosition!.x < 20 ||
                moveNextPosition!.y >= 679 ||
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

export const checkTankInLine = (
  tankPosition: Position,
  tank: Tank,
  distance: number
) => {
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
    euclideanDistance(tankPosition, tank) <= (distance ?? TankSize * 4) &&
    euclideanDistance(tankPosition, tank) >= TankSize * 1.5
  ) {
    return true;
  }
  return false;
};

export const checkReadyPosition = (mapIndex: MapIndex) => {
  if (
    mapIndex.startX % 2 === 0 &&
    mapIndex.startY % 2 === 0 &&
    mapIndex.endX % 2 !== 0 &&
    mapIndex.endY % 2 !== 0
  ) {
    return true;
  }
  return false;
};

export const findRoadOnListMapIndex = (
  tankPosition: Position,
  positions: Array<Position>,
  ms: number
) => {
  try {
    if (!positions.length) {
      return [];
    }

    const result: Array<any> = [];

    let findedTankPosition = null;

    let findRoad: any = {
      [tankPosition.y]: {
        [tankPosition.x]: "ROOT",
      },
    };

    if (tankPosition) {
      let queue: Array<Position & { ms: number }> = [
        { ...tankPosition, ms: ms },
      ];

      let listIndex = 0;

      const initMapIndex = mapIndexOnMapMatch(tankPosition);
      if (
        positions.length === 1 &&
        initMapIndex.startX === positions[0].x &&
        initMapIndex.startY === positions[0].y
      ) {
        return result;
      }

      // console.log(
      //   "CURRENT MAP INDEX",
      //   initMapIndex,
      //   mapMatch[initMapIndex.startY][initMapIndex.startX]
      // );

      const threadhold = 0.2;

      while (queue.length) {
        const tankPosition = queue.shift();
        // console.log(tankPosition);
        if (tankPosition) {
          const mapIndex = mapIndexOnMapMatch(tankPosition);
          if (
            positions[listIndex].x === mapIndex.startX &&
            positions[listIndex].y === mapIndex.startY &&
            tankPosition.x / ObjectSize >= positions[listIndex].x &&
            tankPosition.x / ObjectSize < positions[listIndex].x + threadhold &&
            tankPosition.y / ObjectSize >= positions[listIndex].y &&
            tankPosition.y / ObjectSize < positions[listIndex].y + threadhold
          ) {
            listIndex++;
            findedTankPosition = tankPosition;
            queue = [];
            if (listIndex === positions.length) {
              break;
            }
          }
          let _orients = orients;
          let _unOrients = unOrients;
          if (
            mapIndex.startX !== positions[listIndex].x ||
            mapIndex.startY !== positions[listIndex].y
          ) {
            _orients = [];
            _unOrients = [];
            if (tankPosition.x < positions[listIndex].x * ObjectSize) {
              _orients.push("RIGHT");
              _unOrients.push("LEFT");
            }
            if (tankPosition.x > positions[listIndex].x * ObjectSize) {
              _orients.push("LEFT");
              _unOrients.push("RIGHT");
            }
            if (tankPosition.y < positions[listIndex].y * ObjectSize) {
              _orients.push("DOWN");
              _unOrients.push("UP");
            }
            if (tankPosition.y > positions[listIndex].y * ObjectSize) {
              _orients.push("UP");
              _unOrients.push("DOWN");
            }
          }
          // console.log(_orients, mapIndex, positions[listIndex]);
          for (let i = 0; i < _orients.length; i++) {
            const orient = _orients[i];
            const moveNextPosition = tankPositionAtNextTime(
              tankPosition as never,
              orient as never
            );
            // console.log(orient, moveNextPosition);
            if (
              !checkTankPositionIsObject(moveNextPosition as never) &&
              !(
                moveNextPosition!.x >= 879 ||
                moveNextPosition!.x < 20 ||
                moveNextPosition!.y >= 679 ||
                moveNextPosition!.y < 20
              )
            ) {
              if (!findRoad?.[moveNextPosition.y]?.[moveNextPosition.x]) {
                if (!findRoad?.[moveNextPosition.y]) {
                  findRoad[moveNextPosition.y] = {};
                }
                findRoad[moveNextPosition.y][moveNextPosition.x] =
                  _unOrients[i];
                queue.push({
                  ...moveNextPosition,
                  ms: (tankPosition?.ms ?? 0) + TankTimeSpeed,
                });
              }
            }
          }
        }
      }
    }
    if (findedTankPosition) {
      result.push(...revertRoad(findRoad, findedTankPosition as any));
    }
    return result;
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const findRoadToTarget = (
  tankPosition: Position & { orient: Orient },
  ms: number
) => {
  try {
    if (targetTankName === "") {
      return [];
    }
    const result: Array<any> = [];
    let findRoad: any = {
      [tankPosition.y]: {
        [tankPosition.x]: "ROOT",
      },
    };

    const tank = tanks.get(targetTankName);

    if (tankPosition && tank) {
      const queue: Array<Position & { ms: number }> = [
        { ...tankPosition, ms: ms },
      ];

      while (queue.length) {
        const tankPosition = queue.shift();
        if (tankPosition && tankPosition?.ms < 2000) {
          if (tank) {
            if (checkTankInLine(tankPosition, tank, TankSize * 3)) {
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
            !(
              moveNextPosition!.x >= 879 ||
              moveNextPosition!.x < 20 ||
              moveNextPosition!.y >= 679 ||
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
  const _bullets = Array.from(bullets.values());
  while (queue.length) {
    let _tankPosition = queue.shift();
    if (
      safeArea(_tankPosition as never, _bullets, _tankPosition?.ms as never)
    ) {
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
        (!checkTankPositionIsObject(moveNextPosition as never) &&
          !checkTankOverlap(moveNextPosition, tanks) &&
          !checkBulletsInsideTank(
            _tankPosition as never,
            _bullets,
            _tankPosition!.ms
          )) ||
        !(
          moveNextPosition!.x >= 879 ||
          moveNextPosition!.x < 20 ||
          moveNextPosition!.y >= 679 ||
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
