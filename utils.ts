import {
  BulletSize,
  BulletSpeed,
  BulletTimeSpeed,
  EmitEvent,
  ObjectSize,
  ShootAreaSize,
  TankOnObjectPercent,
  TankSize,
  TankSpeed,
} from "./constants";
import { bullets } from "./store";
import * as _ from "lodash";

export const initPosition = (x: number, y: number) => ({ x, y });

export const moveRight = (position: { x: number; y: number }) => ({
  x: position.x + TankSpeed,
  y: position.y,
});
export const moveLeft = (position: { x: number; y: number }) => ({
  x: position.x - TankSpeed,
  y: position.y,
});
export const moveUp = (position: { x: number; y: number }) => ({
  x: position.x,
  y: position.y - TankSpeed,
});
export const moveDown = (position: { x: number; y: number }) => ({
  x: position.x,
  y: position.y + TankSpeed,
});

// export const mapIndexMoveRight = (mapIndex: MapIndex):MapIndex => ({

// })

export const sleep = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
  });

export const mapIndexOnMapMatch = (position: Position): MapIndex => {
  const mapIndex = initPosition(
    position.x / ObjectSize,
    position.y / ObjectSize
  );
  const startX = parseInt(mapIndex.x.toString(), 10);
  const startY = parseInt(mapIndex.y.toString(), 10);
  const endX = parseInt((mapIndex.x + TankOnObjectPercent).toString(), 10);
  const endY = parseInt((mapIndex.y + TankOnObjectPercent).toString(), 10);
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

export const findRoad = (
  map: MapMatch,
  targetPosition: Position,
  myTankPosition: Position
) => {
  const targetMapIndex = mapIndexOnMapMatch(targetPosition);
  let myTankMapIndex = mapIndexOnMapMatch(myTankPosition);
  //Dieu kien dung la mapIndex x || y === targetMapIndex x || y
  const _map = map.concat();
  const queue = [myTankMapIndex];
  while (queue.length) {
    const position = queue.shift();
    if (checkTargetOnMapIndex(map, position!, targetMapIndex)) {
      //Tim thay duong den tank muc tieu
      return;
    }
  }
};

export const calculateRoadToOtherTanks = (
  map: MapMatch,
  tanks: Array<Tank>,
  myTank: Tank
) => {
  // const tanksPositions: Map<string, Position> = new Map();
  // tanks.forEach((tank) => {
  //   if (tank.uid !== myTank.uid) {
  //     tanksPositions.set(tank.uid, {
  //       x: tank.x / ObjectSize,
  //       y: tank.y / ObjectSize,
  //     });
  //   }
  // });
  //const findTargetPosition =
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
  }
};

export const comparePostions = (a: Position, b: Position) =>
  a.x === b.x && a.y === b.y;

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

export const checkBlockShoot = (map: MapMatch, tank: Tank, myTank: Tank) => {
  const position = mapIndexOnMapMatch({ x: tank.x, y: tank.y });
  const myPosition = mapIndexOnMapMatch({ x: myTank.x, y: myTank.y });
  if (Math.abs(tank.x - myTank.x) <= ShootAreaSize) {
    //is horizontal
    const { min, max } = {
      min: Math.min(position.startY, myPosition.startY),
      max: Math.max(position.startY, myPosition.startY),
    };
    for (let i = min + 1; i < max; i++) {
      if (map[i][myPosition.startX] === "B") {
        return true;
      }
    }
  }
  if (Math.abs(tank.y - myTank.y) <= ShootAreaSize) {
    //is vertical
    const { min, max } = {
      min: Math.min(position.startX, myPosition.startX),
      max: Math.max(position.startX, myPosition.startX),
    };
    for (let i = min + 1; i < max; i++) {
      if (map[myPosition.startY][i] === "B") {
        return true;
      }
    }
  }
  return false;
};

export const checkTanksCanShootNow = (
  map: MapMatch,
  tanks: Map<string, Tank>,
  myTank: Tank
) => {
  const myPosition = mapIndexOnMapMatch({ x: myTank.x, y: myTank.y });
  const events: Array<{ eventName: string; data?: any }> = [];
  tanks.forEach((tank) => {
    if (
      tank.uid !== myTank.uid &&
      isShootArea(tank, myTank) &&
      !checkBlockShoot(map, tank, myTank)
    ) {
      const position = mapIndexOnMapMatch({ x: tank.x, y: tank.y });
      if (checkTargetOnMapIndex(map, myPosition, position)) {
        const orientTargetTank = tankPositionWithMyTank(tank, myTank);
        if (!orientTargetTank) {
          return;
        }
        if (orientTargetTank === myTank.orient) {
          events.push({ eventName: EmitEvent.Shoot });
        } else {
          events.push(
            {
              eventName: EmitEvent.Move,
              data: orientTargetTank,
            },
            {
              eventName: EmitEvent.Shoot,
            }
          );
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

export const tankAtNextTime = (tank: Tank, orient: Orient) => {
  switch (orient) {
    case "DOWN":
      return initPosition(tank.x, tank.y + TankSpeed);
    case "LEFT":
      return initPosition(tank.x - TankSpeed, tank.y);
    case "RIGHT":
      return initPosition(tank.x + TankSpeed, tank.y);
    case "UP":
      return initPosition(tank.x, tank.y - TankSpeed);
  }
};

export const positionInSideTank = (
  tankPosition: Position,
  checkPosition: Position
) => {
  return (
    _.inRange(
      checkPosition.x,
      tankPosition.x - TankSize * 2 - BulletSize * 2,
      tankPosition.x + TankSize * 2 + BulletSize * 2
    ) &&
    _.inRange(
      checkPosition.y,
      tankPosition.y - TankSize * 2 - BulletSize * 2,
      tankPosition.y + TankSize * 2 + BulletSize * 2
    )
  );
};
