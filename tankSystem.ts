import _ from "lodash";
import {
  BulletSize,
  MapSize,
  TankTimeSpeed,
  MY_NAME,
  TankSize,
} from "./constants";
import {
  MovePriority,
  bullets,
  dodgeBullets,
  findRoadOnListMapIndex,
  findTargetTankV2,
  findToBlockNearest,
  findToDefZoneOnMap,
  hasBlockBetweenObjects,
  hasBlockPosition,
  isReborn,
  isShootAble,
  mapMatch,
  myTank,
  road,
  saveRoad,
  startPromise,
  tanks,
  targetTankName,
} from "./store";
import {
  bulletPositionAtRunTime,
  euclideanDistance,
  isSameHorizontalAxisWithSize,
  isSameVerticalAxisWithSize,
  otherTankInsideHorizontal,
  otherTankInsideVertical,
} from "./utils";
import { shoot } from "./connect";

const checkShootVertical = (tank: Tank) => {
  if (
    !myTank ||
    tank.name === MY_NAME ||
    isReborn.has(tank.name) ||
    !isShootAble
  ) {
    return;
  }
  if (isSameVerticalAxisWithSize(myTank, tank)) {
    if (otherTankInsideVertical(tank)) {
      if (
        !hasBlockBetweenObjects(
          {
            x: myTank.x + (TankSize / 2 - BulletSize / 2) - 2,
            y: myTank.y,
            size: BulletSize,
          },
          {
            x: myTank.x + (TankSize / 2 - BulletSize / 2) - 2,
            y: tank.y,
            size: BulletSize,
          }
        ) &&
        euclideanDistance(tank, myTank) <= TankSize * 6
      ) {
        if (myTank?.orient === "UP" && tank.y < (myTank?.y ?? 0)) {
          // saveRoad(MovePriority.SHOOT, ["SHOOT"]);
          shoot();
          return true;
        } else if (myTank?.orient === "DOWN" && tank.y > (myTank?.y ?? 0)) {
          // saveRoad(MovePriority.SHOOT, ["SHOOT"]);
          shoot();
          return true;
        } else {
          if (tank.y < (myTank?.y ?? 0)) {
            saveRoad(MovePriority.SHOOT, ["UP", "SHOOT"]);
          } else {
            saveRoad(MovePriority.SHOOT, ["DOWN", "SHOOT"]);
          }
          return true;
        }
      }
    }
  }
  return false;
};

const checkShootHorizontal = (tank: Tank) => {
  if (
    !myTank ||
    tank.name === MY_NAME ||
    isReborn.has(tank.name) ||
    !isShootAble
  ) {
    return;
  }
  if (isSameHorizontalAxisWithSize(myTank, tank)) {
    if (otherTankInsideHorizontal(tank)) {
      if (
        !hasBlockBetweenObjects(
          {
            x: myTank.x,
            y: myTank.y + (TankSize / 2 - BulletSize / 2) - 2,
            size: BulletSize,
          },
          {
            x: tank.x,
            y: myTank.y + (TankSize / 2 - BulletSize / 2) - 2,
            size: BulletSize,
          }
        ) &&
        euclideanDistance(tank, myTank) <= TankSize * 6
      ) {
        if (myTank?.orient === "LEFT" && tank.x < (myTank?.x ?? 0)) {
          // saveRoad(MovePriority.SHOOT, ["SHOOT"]);
          shoot();
          return true;
        } else if (myTank?.orient === "RIGHT" && tank.x > (myTank?.x ?? 0)) {
          // saveRoad(MovePriority.SHOOT, ["SHOOT"]);
          shoot();
          return true;
        } else {
          if (tank.x < (myTank?.x ?? 0)) {
            saveRoad(MovePriority.SHOOT, ["LEFT", "SHOOT"]);
          } else {
            saveRoad(MovePriority.SHOOT, ["RIGHT", "SHOOT"]);
          }
          return true;
        }
      }
    } else {
    }
  }
  return false;
};

export const startTrickShootSystem = async () => {
  await startPromise;
  setInterval(() => {
    try {
      if (
        (myTank?.shootable || isShootAble) &&
        myTank &&
        myTank.x &&
        myTank.y
      ) {
        for (const tank of Array.from(tanks.values()).sort((a, b) => {
          const aPosition = euclideanDistance(
            { x: a.x, y: a.y },
            { x: myTank!.x, y: myTank!.y }
          );
          const bPosition = euclideanDistance(
            { x: b.x, y: b.y },
            { x: myTank!.x, y: myTank!.y }
          );
          return aPosition - bPosition;
        })) {
          if (checkShootVertical(tank) || checkShootHorizontal(tank)) {
            return;
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, 2);
};

let countDownMove: any = null;

export const stopIntervalCheckBullet = () => {
  clearInterval(countDownMove);
};

export const startIntervalToCheckBullet = async () => {
  await startPromise;
  countDownMove = setInterval(() => {
    try {
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
          } else {
            bullets.set(bullet.id, {
              ...bullet,
              y: runTimePosition?.y ?? 0,
              x: runTimePosition?.x ?? 0,
              time: runTimePosition.time,
            });
          }
        }
      });
    } catch (e) {
      console.log("startIntervalToCheckBullet", e);
    }
  }, 1);
};

let intervalDodge: any = null;

export const stopIntervalDodge = () => {
  clearInterval(intervalDodge);
};

export const startDodgeRoadSystem = async () => {
  await startPromise;
  setInterval(() => {
    try {
      if (
        myTank &&
        !isReborn.has(myTank.name) &&
        road.priority > MovePriority.DODGE
      ) {
        if (bullets.size) {
          const _dodge = dodgeBullets(myTank, 0);
          if (!_dodge.isSafe && _dodge.result.length >= 1) {
            saveRoad(
              MovePriority.DODGE,
              _dodge.result
                .filter((v) => v.orient !== null)
                .map((v) => v.orient)
            );
          }
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
    }
  }, 2);
};

let intervalFindTargetRoad: any = null;

export const stopIntervalFindTargetRoad = () => {
  clearInterval(intervalFindTargetRoad);
};

export const findTargetSystem = async () => {
  await startPromise;
  setInterval(async () => {
    try {
      if (
        myTank &&
        myTank.x &&
        myTank.y &&
        road.priority > MovePriority.NORMAL
      ) {
        if (isShootAble || myTank.shootable) {
          const findLine = findTargetTankV2();
          const isSmallList = findLine.length > 4;
          const _road = findRoadOnListMapIndex(
            myTank!,
            isSmallList ? findLine.slice(0, 3) : findLine,
            0
          );
          if (_road.length >= 1) {
            const list = _road.map((v) => v.orient);
            if (!isSmallList) {
              const target = tanks.get(targetTankName);
              const lastPosition = _.last(_road);
              if (
                isSameHorizontalAxisWithSize(
                  { ...lastPosition, size: TankSize },
                  target!
                )
              ) {
                if (lastPosition.x < target!.x) {
                  if (lastPosition.orient !== "RIGHT") list.push("RIGHT");
                } else {
                  if (lastPosition.orient !== "LEFT") list.push("LEFT");
                }
              } else if (
                isSameVerticalAxisWithSize(
                  { ...lastPosition, size: TankSize },
                  target!
                )
              ) {
                if (lastPosition.y < target!.y) {
                  if (lastPosition.orient !== "DOWN") list.push("DOWN");
                } else {
                  if (lastPosition.orient !== "UP") list.push("UP");
                }
              }
            }
            saveRoad(MovePriority.NORMAL, list);
            return;
          }
        }
        if (targetTankName !== "") {
          const _roadToDefArea = findToDefZoneOnMap();
          if (_roadToDefArea.length >= 1) {
            const findLineToDefArea = findRoadOnListMapIndex(
              myTank!,
              _roadToDefArea,
              0
            );
            if (findLineToDefArea.length > 1) {
              saveRoad(
                MovePriority.NORMAL,
                findLineToDefArea.map((v) => v.orient)
              );
              return;
            }
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, TankTimeSpeed * 2);
};
