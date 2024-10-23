import _ from "lodash";
import { BulletSize, MapSize, TankTimeSpeed, MY_NAME } from "./constants";
import {
  MovePriority,
  bullets,
  dodgeBullets,
  findRoadToTarget,
  findTargetTank,
  hasBlockBetweenObjects,
  hasBlockPosition,
  isReborn,
  isShootAble,
  mapMatch,
  myTank,
  road,
  saveRoad,
  tanks,
  targetTankUID,
} from "./store";
import {
  bulletPositionAtRunTime,
  euclideanDistance,
  otherTankInsideHorizontal,
  otherTankInsideVertical,
} from "./utils";

export const startTrickShootSystem = async () => {
  setInterval(() => {
    try {
      if (
        (myTank?.shootable || isShootAble) &&
        myTank &&
        myTank.x &&
        myTank.y &&
        road.priority > MovePriority.SHOOT
      ) {
        Array.from(tanks.values())
          .sort((a, b) => {
            const aPosition = euclideanDistance(
              { x: a.x, y: a.y },
              { x: myTank!.x, y: myTank!.y }
            );
            const bPosition = euclideanDistance(
              { x: b.x, y: b.y },
              { x: myTank!.x, y: myTank!.y }
            );
            return aPosition - bPosition;
          })
          .forEach((tank) => {
            if (
              !myTank?.x ||
              !myTank?.y ||
              tank.name === MY_NAME ||
              isReborn.has(tank.name)
            ) {
              return;
            }
            //Vertical
            if (
              otherTankInsideVertical(tank) &&
              !hasBlockBetweenObjects(myTank, tank)
            ) {
              if (myTank?.orient === "UP" && tank.y < (myTank?.y ?? 0)) {
                saveRoad(MovePriority.SHOOT, ["UP"]);
              } else if (
                myTank?.orient === "DOWN" &&
                tank.y > (myTank?.y ?? 0)
              ) {
                saveRoad(MovePriority.SHOOT, ["DOWN"]);
              } else {
                if (tank.y < (myTank?.y ?? 0)) {
                  saveRoad(MovePriority.SHOOT, ["UP"]);
                } else {
                  saveRoad(MovePriority.SHOOT, ["DOWN"]);
                }
              }
            }
            //Horizontal
            if (
              otherTankInsideHorizontal(tank) &&
              !hasBlockBetweenObjects(myTank, tank)
            ) {
              if (myTank?.orient === "LEFT" && tank.x < (myTank?.x ?? 0)) {
                saveRoad(MovePriority.SHOOT, ["LEFT"]);
              } else if (
                myTank?.orient === "RIGHT" &&
                tank.x > (myTank?.x ?? 0)
              ) {
                saveRoad(MovePriority.SHOOT, ["RIGHT"]);
              } else {
                if (tank.x < (myTank?.x ?? 0)) {
                  saveRoad(MovePriority.SHOOT, ["LEFT"]);
                } else {
                  saveRoad(MovePriority.SHOOT, ["RIGHT"]);
                }
              }
            }
          });
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

export const startIntervalToCheckBullet = () => {
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
  setInterval(() => {
    try {
      if (myTank && !isReborn.has(myTank.name)) {
        if (bullets.size) {
          const _dodge = dodgeBullets(
            { x: myTank.x, y: myTank.y, orient: myTank.orient },
            Array.from(bullets.values()),
            0
          );
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
  setInterval(async () => {
    try {
      if (
        myTank &&
        myTank.x &&
        myTank.y &&
        road.priority > MovePriority.NORMAL &&
        road.data.length === 0
      ) {
        if (targetTankUID === "") {
          findTargetTank();
        }
        const _road = findRoadToTarget(
          { x: myTank.x, y: myTank.y, orient: myTank.orient },
          0
        );
        if (_road.length >= 1) {
          saveRoad(
            MovePriority.NORMAL,
            _road.slice(1).map((v) => v.orient)
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, TankTimeSpeed);
};
