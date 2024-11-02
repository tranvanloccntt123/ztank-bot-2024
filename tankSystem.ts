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
  findRoadToReady,
  findRoadToTarget,
  findTargetOnMap,
  findTargetTank,
  findToBlockNearest,
  hasBlockBetweenObjects,
  hasBlockPosition,
  isReborn,
  isShootAble,
  lastMoveTime,
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
  otherTankInsideHorizontal,
  otherTankInsideVertical,
} from "./utils";

export const startTrickShootSystem = async () => {
  await startPromise;
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
              )
            ) {
              if (myTank?.orient === "UP" && tank.y < (myTank?.y ?? 0)) {
                saveRoad(MovePriority.SHOOT, ["SHOOT"]);
              } else if (
                myTank?.orient === "DOWN" &&
                tank.y > (myTank?.y ?? 0)
              ) {
                saveRoad(MovePriority.SHOOT, ["SHOOT"]);
              } else {
                if (tank.y < (myTank?.y ?? 0)) {
                  saveRoad(MovePriority.SHOOT, ["UP", "SHOOT"]);
                } else {
                  saveRoad(MovePriority.SHOOT, ["DOWN", "SHOOT"]);
                }
              }
            }
            //Horizontal
            if (
              otherTankInsideHorizontal(tank) &&
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
              )
            ) {
              if (myTank?.orient === "LEFT" && tank.x < (myTank?.x ?? 0)) {
                saveRoad(MovePriority.SHOOT, ["SHOOT"]);
              } else if (
                myTank?.orient === "RIGHT" &&
                tank.x > (myTank?.x ?? 0)
              ) {
                saveRoad(MovePriority.SHOOT, ["SHOOT"]);
              } else {
                if (tank.x < (myTank?.x ?? 0)) {
                  saveRoad(MovePriority.SHOOT, ["LEFT", "SHOOT"]);
                } else {
                  saveRoad(MovePriority.SHOOT, ["RIGHT", "SHOOT"]);
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
  await startPromise;
  setInterval(async () => {
    try {
      if (
        myTank &&
        myTank.x &&
        myTank.y &&
        road.priority > MovePriority.NORMAL &&
        road.data.length === 0
      ) {
        if (targetTankName === "" || Boolean(targetTankName) === false) {
          findTargetTank();
        }
        const onMapPositions = findTargetOnMap();
        const _road = findRoadOnListMapIndex(myTank!, onMapPositions, 0);
        if (_road.length >= 1) {
          saveRoad(
            MovePriority.NORMAL,
            _road.map((v) => v.orient)
          );
        } else {
          if (targetTankName) {
            console.log(myTank, tanks.get(targetTankName));
          }
          findTargetTank(targetTankName);
          const _roadToBlock = findToBlockNearest(
            { x: myTank.x, y: myTank.y, orient: myTank.orient },
            0
          );
          if (_roadToBlock.length > 1) {
            saveRoad(
              MovePriority.NORMAL,
              _roadToBlock.slice(1).map((v) => v.orient)
            );
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, TankTimeSpeed * 2);
};
