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
  myTank,
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
  const startX = Math.round(mapIndex.x);
  const startY = Math.round(mapIndex.y);
  const endX = Math.round(mapIndex.x + (size ?? TankOnObjectPercent));
  const endY = Math.round(mapIndex.y + (size ?? TankOnObjectPercent));
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

export const bulletPositionAtPlusTime = (bullet: Bullet, ms: number) => {
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

export const tankPositionAtNextTime = (
  tank: Position,
  orient: Orient,
  ms: number = 1
) => {
  switch (orient) {
    case "DOWN":
      return initPosition(tank.x, tank.y + TankSpeed * ms);
    case "LEFT":
      return initPosition(tank.x - TankSpeed * ms, tank.y);
    case "RIGHT":
      return initPosition(tank.x + TankSpeed * ms, tank.y);
    case "UP":
      return initPosition(tank.x, tank.y - TankSpeed * ms);
    default:
      return initPosition(tank.x, tank.y);
  }
};

export const tankPositionDownStep = (
  tank: Position,
  orient: Orient,
  step: number
) => {
  switch (orient) {
    case "DOWN":
      return initPosition(tank.x, tank.y + step);
    case "LEFT":
      return initPosition(tank.x - step, tank.y);
    case "RIGHT":
      return initPosition(tank.x + step, tank.y);
    case "UP":
      return initPosition(tank.x, tank.y - step);
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

export const isSameHorizontalAxisWithSize = (
  object1: Position & { size: number },
  object2: Position & { size: number }
) => {
  // Tính biên trên và biên dưới của A và B
  let topA = object1.y; // Biên trên của A
  let bottomA = object1.y + object1.size; // Biên dưới của A
  let topB = object2.y; // Biên trên của B
  let bottomB = object2.y + object2.size; // Biên dưới của B

  // Kiểm tra xem các biên có chồng lên nhau không
  return !(bottomA < topB || bottomB < topA);
};

// Hàm kiểm tra xem A và B có nằm cùng trục dọc không, dựa trên tọa độ x và kích thước
export const isSameVerticalAxisWithSize = (
  object1: Position & { size: number },
  object2: Position & { size: number }
) => {
  // Tính biên trái và biên phải của A và B
  let leftA = object1.x; // Biên trái của A
  let rightA = object1.x + object1.size; // Biên phải của A
  let leftB = object2.x; // Biên trái của B
  let rightB = object2.x + object2.size; // Biên phải của B

  // Kiểm tra xem các biên có chồng lên nhau không
  return !(rightA < leftB || rightB < leftA);
};

export const checkFullTankNearestBlock = (tankPosition: Position) => {
  //FULL UP
  if (
    hasBlockPosition({ x: tankPosition.x, y: tankPosition.y }) &&
    hasBlockPosition({ x: tankPosition.x + TankSize, y: tankPosition.y })
  ) {
    return true;
  }
  //FULL LEFT
  if (
    hasBlockPosition({ x: tankPosition.x, y: tankPosition.y }) &&
    hasBlockPosition({ x: tankPosition.x, y: tankPosition.y + TankSize })
  ) {
    return true;
  }
  //FULL RIGHT
  if (
    hasBlockPosition({ x: tankPosition.x + TankSize, y: tankPosition.y }) &&
    hasBlockPosition({ x: tankPosition.x + TankSize, y: tankPosition.y + TankSize })
  ) {
    return true;
  }
  //FULL BOTTOM
  if (
    hasBlockPosition({ x: tankPosition.x, y: tankPosition.y + TankSize }) &&
    hasBlockPosition({ x: tankPosition.x + TankSize, y: tankPosition.y + TankSize })
  ) {
    return true;
  }
  return false;
};

export const checkTankPositionIsBlock = (tankPosition: Position) => {
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
    })
  );
};

export const checkTankPositionIsObject = (tankPosition: Position) => {
  return (
    checkTankPositionIsBlock(tankPosition) ||
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

export const otherTankInsideVertical = (tank: Position) => {
  if (!myTank || !myTank.x || !myTank.y) {
    return false;
  }
  return (
    _.inRange(
      tank?.x ?? 0,
      myTank.x + (TankSize / 2 - BulletSize / 2) - 2,
      myTank.x + TankSize - (TankSize / 2 - BulletSize / 2) + 2
    ) ||
    _.inRange(
      (tank?.x ?? 0) + TankSize,
      myTank.x + (TankSize / 2 - BulletSize / 2) - 2,
      myTank.x + TankSize - (TankSize / 2 - BulletSize / 2) + 2
    ) ||
    _.inRange(
      myTank.x + (TankSize / 2 - BulletSize / 2),
      tank.x,
      tank.x + TankSize
    ) ||
    _.inRange(
      myTank.x + (TankSize / 2 - BulletSize / 2) + BulletSize,
      tank.x,
      tank.x + TankSize
    )
  );
};

export const otherTankInsideHorizontal = (tank: Position) => {
  if (!myTank || !myTank.x || !myTank.y) {
    return false;
  }
  return (
    _.inRange(
      tank?.y ?? 0,
      myTank.y + (TankSize / 2 - BulletSize / 2) - 2,
      myTank.y + TankSize - (TankSize / 2 - BulletSize / 2) + 2
    ) ||
    _.inRange(
      (tank?.y ?? 0) + TankSize,
      myTank.y + (TankSize / 2 - BulletSize / 2) - 2,
      myTank.y + TankSize - (TankSize / 2 - BulletSize / 2) + 2
    ) ||
    _.inRange(
      myTank.y + (TankSize / 2 - BulletSize / 2),
      tank.y,
      tank.y + TankSize
    ) ||
    _.inRange(
      myTank.y + (TankSize / 2 - BulletSize / 2) + BulletSize,
      tank.y,
      tank.y + TankSize
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

export const checkBulletRunningToTank = (
  tankPosition: Position,
  bulletPosition: Position & { orient: Orient },
  distance = TankSize * 7
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

export const safeArea = (
  tankPosition: Position,
  bullets: Array<Bullet>,
  ms: number
) => {
  for (const bullet of bullets) {
    const bulletPosition = bulletPositionAtPlusTime(bullet, ms);
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

export const checkBulletsInsideTank = (
  tankPosition: Position,
  bullets: Array<Bullet>,
  ms: number
) => {
  for (const bullet of bullets) {
    const bulletPosition = bulletPositionAtPlusTime(bullet, ms);
    if (checkBulletInsideTank(tankPosition, bulletPosition)) {
      return true;
    }
  }
  return false;
};

export const checkTankOverlap = (
  tankPosition: Position,
  tanks: Map<string, Tank>
) => {
  let overlap = false;
  tanks.forEach((tank) => {
    if (overlap === true) {
      return;
    }
    if (isOverlap(tankPosition.x, tankPosition.y, tank.x, tank.y, TankSize)) {
      overlap = true;
    }
  });
  return overlap;
};

export const isOverlap = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number
) => {
  // Tính biên của A
  let leftA = x1; // Biên trái của A
  let rightA = x1 + size; // Biên phải của A
  let topA = y1; // Biên trên của A
  let bottomA = y1 + size; // Biên dưới của A

  // Tính biên của B
  let leftB = x2; // Biên trái của B
  let rightB = x2 + size; // Biên phải của B
  let topB = y2; // Biên trên của B
  let bottomB = y2 + size; // Biên dưới của B

  // Kiểm tra xem có chồng lấn trên cả trục x và trục y hay không
  let overlapX = !(rightA < leftB || rightB < leftA);
  let overlapY = !(bottomA < topB || bottomB < topA);

  // Nếu chồng lấn trên cả trục x và y thì trả về true (overlap)
  return overlapX && overlapY;
};
