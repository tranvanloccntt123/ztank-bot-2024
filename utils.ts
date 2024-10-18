import {
  BulletSize,
  BulletSpeed,
  BulletTimeSpeed,
  EmitEvent,
  MY_NAME,
  ObjectSize,
  ShootArea,
  ShootAreaSize,
  TankOnObjectPercent,
  TankSize,
  TankSpeed,
} from "./constants";
import {
  bullets,
  hasBlockPosition,
  hasObjectPosition,
  isReborn,
} from "./store";
import * as _ from "lodash";

export const initPosition = (x: number, y: number) => ({ x, y });

export const moveRight = (position: { x: number; y: number }) => ({
  x: position?.x + TankSpeed,
  y: position?.y,
});
export const moveLeft = (position: { x: number; y: number }) => ({
  x: position?.x - TankSpeed,
  y: position?.y,
});
export const moveUp = (position: { x: number; y: number }) => ({
  x: position?.x,
  y: position?.y - TankSpeed,
});
export const moveDown = (position: { x: number; y: number }) => ({
  x: position?.x,
  y: position?.y + TankSpeed,
});

// export const mapIndexMoveRight = (mapIndex: MapIndex):MapIndex => ({

// })

export const sleep = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
  });

export const mapIndexOnMapMatch = (
  position: Position,
  size?: number
): MapIndex => {
  const mapIndex = initPosition(
    (position?.x ?? 0) / ObjectSize,
    (position?.y ?? 0) / ObjectSize
  );
  const startX = parseInt(mapIndex.x.toString(), 10);
  const startY = parseInt(mapIndex.y.toString(), 10);
  const endX = parseInt(
    (mapIndex.x + (size ?? TankOnObjectPercent)).toString(),
    10
  );
  const endY = parseInt(
    (mapIndex.y + (size ?? TankOnObjectPercent)).toString(),
    10
  );
  return {
    startX,
    startY,
    endX,
    endY,
  };
};

export const moveVisible = (map: MapMatch, tank: Tank): Orient[] => {
  const currentPosition = initPosition(tank.x, tank.y);
  let visible: Array<Orient> = ["RIGHT", "LEFT", "UP", "DOWN"];
  const visiblePosition = [
    moveRight(currentPosition),
    moveLeft(currentPosition),
    moveUp(currentPosition),
    moveDown(currentPosition),
  ];
  return visible.filter((_, index) => {
    const position = visiblePosition[index];
    //TODO, xac dinh vi tri co the di duoc tren ban do
    const mapIndex = mapIndexOnMapMatch(position);
    return (
      map[mapIndex.startY][mapIndex.startX] === null &&
      map[mapIndex.endY][mapIndex.endX] === null
    );
  });
};

export const bulletPositionAtRunTime = (bullet: Bullet) => {
  const _runTime = new Date().getTime();
  const minusTime = _runTime - bullet.time ?? 0;
  const change = (minusTime / BulletTimeSpeed) * BulletSpeed;
  switch (bullet.orient) {
    case "DOWN":
      return { ...initPosition(bullet.x, bullet.y + change), time: _runTime };
    case "UP":
      return { ...initPosition(bullet.x, bullet.y - change), time: _runTime };
    case "LEFT":
      return { ...initPosition(bullet.x - change, bullet.y), time: _runTime };
    case "RIGHT":
      return { ...initPosition(bullet.x + change, bullet.y), time: _runTime };
    default:
      return { ...initPosition(bullet.x, bullet.y), time: _runTime };
  }
};

export const checkTargetOnMapIndex = (
  mapMatch: MapMatch,
  a: MapIndex,
  b: MapIndex
) => {
  const checkPosition =
    (a.startX === b.startX && a.endX === b.endX) ||
    (a.startY === b.startY && a.endY === b.endY);
  if (!checkPosition) {
    return false;
  }
  const minStartX = Math.min(a.startX, b.startX);
  const maxStartX = Math.max(a.startX, b.startX);
  const minStartY = Math.min(a.startY, b.startY);
  const maxStartY = Math.max(a.startY, b.startY);
  const minEndX = Math.min(a.endX, b.endX);
  const maxEndX = Math.max(a.endX, b.endX);
  const minEndY = Math.min(a.endY, b.endY);
  const maxEndY = Math.max(a.endY, b.endY);
  if (a.startX === b.startX && b.endX === a.endX) {
    //find block
    for (let i = minStartY; i <= maxStartY; i++) {
      if (mapMatch[i][a.startX] === "B") {
        return false;
      }
    }
    for (let i = minEndY; i <= maxEndY; i++) {
      if (mapMatch[i][a.endX] === "B") {
        return false;
      }
    }
    return true;
  }
  if (a.startY === b.startY && a.endY === b.endY) {
    for (let i = minStartX; i <= maxStartX; i++) {
      if (mapMatch[a.startY][i] === "B") {
        return false;
      }
    }
    for (let i = minEndX; i <= maxEndX; i++) {
      if (mapMatch[a.endY][i] === "B") {
        return false;
      }
    }
    return true;
  }
  return false;
};

export const tankPositionWithMyTank = (
  tank: Tank,
  myTank: Tank
): Orient | null => {
  if (Math.abs(tank.x - myTank.x) <= ShootAreaSize) {
    //is horizontal
    if (tank.y > myTank.y) {
      return "DOWN";
    }
    return "UP";
  }
  if (Math.abs(tank.y - myTank.y) <= ShootAreaSize) {
    //is vertical
    if (tank.x > myTank.x) {
      return "RIGHT";
    }
    return "LEFT";
  }
  return null;
};

export const isShootArea = (tank: Tank, myTank: Tank) =>
  Math.abs(tank.x - myTank.x) <= ShootAreaSize ||
  Math.abs(tank.y - myTank.y) <= ShootAreaSize;

export const checkTanksCanShootNow = (
  map: MapMatch,
  tanks: Map<string, Tank>,
  myTank: Tank
) => {
  const myPosition = mapIndexOnMapMatch({ x: myTank.x, y: myTank.y });
  const events: Array<{ eventName: string; data?: any }> = [];
  const tanksList = Array.from(tanks.values())
    .filter((tank) => tank.name !== MY_NAME)
    .sort((a, b) => {
      const aPosition = euclideanDistance(
        { x: a.x, y: a.y },
        { x: myTank.x, y: myTank.y }
      );
      const bPosition = euclideanDistance(
        { x: b.x, y: b.y },
        { x: myTank.x, y: myTank.y }
      );
      return aPosition - bPosition;
    });
  tanksList.forEach((tank) => {
    if (isShootArea(tank, myTank) && !isReborn.has(tank.name)) {
      const position = mapIndexOnMapMatch({ x: tank.x, y: tank.y });
      if (
        checkTargetOnMapIndex(map, myPosition, position) &&
        euclideanDistance(myTank, tank) <= ShootArea
      ) {
        const orientTargetTank = tankPositionWithMyTank(tank, myTank);
        if (!orientTargetTank) {
          return;
        }
        if (orientTargetTank === myTank.orient) {
          events.push({ eventName: EmitEvent.Shoot });
        } else {
          events.push({
            eventName: EmitEvent.Move,
            data: orientTargetTank,
          });
        }
      }
    }
  });
  return events;
};

export const sortBulletWithMyTank = (tank: Tank): Array<Bullet> => {
  return Array.from(bullets.values()).sort((a, b) => {
    const aPosition = euclideanDistance(
      { x: a.x, y: a.y },
      { x: tank.x, y: tank.y }
    );
    const bPosition = euclideanDistance(
      { x: b.x, y: b.y },
      { x: tank.x, y: tank.y }
    );
    return aPosition - bPosition;
  });
};

export const euclideanDistance = (point1: Position, point2: Position) => {
  const x1 = point1.x;
  const y1 = point1.y;
  const x2 = point2.x;
  const y2 = point2.y;

  const xDistance = x2 - x1;
  const yDistance = y2 - y1;

  // Tính khoảng cách theo công thức Euclid
  return Math.sqrt(xDistance * xDistance + yDistance * yDistance);
};

export const bulletPositionAtPlustime = (bullet: Bullet, ms: number) => {
  const runTime = bullet.time + ms;
  const minusTime = runTime - bullet.time;
  const change = (minusTime / BulletTimeSpeed) * BulletSpeed;
  switch (bullet.orient) {
    case "LEFT":
      return initPosition(bullet.x - change, bullet.y);
    case "DOWN":
      return initPosition(bullet.x, bullet.y + change);
    case "RIGHT":
      return initPosition(bullet.x + change, bullet.y);
    case "UP":
      return initPosition(bullet.x, bullet.y - change);
  }
};

export const tankPositionAtNextTime = (tank: Position, orient: Orient) => {
  switch (orient) {
    case "DOWN":
      return initPosition(tank.x, tank.y + TankSpeed);
    case "LEFT":
      return initPosition(tank.x - TankSpeed, tank.y);
    case "RIGHT":
      return initPosition(tank.x + TankSpeed, tank.y);
    case "UP":
      return initPosition(tank.x, tank.y - TankSpeed);
    default:
      return initPosition(tank.x, tank.y);
  }
};

export const tankAtNextTime = (tank: Tank, orient: Orient) => {
  switch (orient) {
    case "DOWN":
      return initPosition(tank?.x ?? 0, (tank?.y ?? 0) + TankSpeed);
    case "LEFT":
      return initPosition((tank?.x ?? 0) - TankSpeed, tank?.y ?? 0);
    case "RIGHT":
      return initPosition((tank?.x ?? 0) + TankSpeed, tank?.y ?? 0);
    case "UP":
      return initPosition(tank?.x ?? 0, (tank?.y ?? 0) - TankSpeed);
    default:
      return initPosition(tank?.x ?? 0, tank.y ?? 0);
  }
};

export const bulletInsideTankVertical = (
  tankPosition: Position,
  bulletPosition: Position
) => {
  return (
    _.inRange(
      bulletPosition?.x ?? 0,
      tankPosition.x - 1,
      tankPosition.x + TankSize + 2
    ) ||
    _.inRange(
      (bulletPosition?.x ?? 0) + BulletSize,
      tankPosition.x - 1,
      tankPosition.x + TankSize + 1 + 2
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
      tankPosition.y - 1,
      tankPosition.y + TankSize + 2
    ) ||
    _.inRange(
      (bulletPosition?.y ?? 0) + BulletSize,
      tankPosition.y - 1,
      tankPosition.y + TankSize + 2
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

export const checkBulletInsideTank = (
  tankPosition: Position,
  bullet: Position
) => {
  if (
    _.inRange(bullet.x, tankPosition.x - 1, tankPosition.x + TankSize + 2) &&
    _.inRange(bullet.y, tankPosition.y - 1, tankPosition.y + TankSize + 2)
  ) {
    return true;
  }
  if (
    _.inRange(
      bullet.x + BulletSize,
      tankPosition.x - 1,
      tankPosition.x + TankSize + 2
    ) &&
    _.inRange(bullet.y, tankPosition.y - 1, tankPosition.y + TankSize + 2)
  ) {
    return true;
  }
  if (
    _.inRange(bullet.x, tankPosition.x - 1, tankPosition.x + TankSize + 2) &&
    _.inRange(
      bullet.y + BulletSize,
      tankPosition.y - 1,
      tankPosition.y + TankSize + 2
    )
  ) {
    return true;
  }
  if (
    _.inRange(
      bullet.x + BulletSize,
      tankPosition.x - 1,
      tankPosition.x + TankSize + 2
    ) &&
    _.inRange(
      bullet.y + BulletSize,
      tankPosition.y - 1,
      tankPosition.y + TankSize + 2
    )
  ) {
    return true;
  }
  return false;
};

export const checkBulletRunningToTank = (
  tankPosition: Position,
  bulletPosition: Position & { orient: Orient },
  distance = TankSize * 5
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
  return false;
};
