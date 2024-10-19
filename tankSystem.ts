import _ from "lodash";
import { moveTank, shoot } from "./connect";
import {
  TankSize,
  BulletSize,
  ShootAbleTime,
  MapSize,
  ShootArea,
  TankTimeSpeed,
  TankSpeed,
  MY_NAME,
} from "./constants";
import {
  MovePriority,
  bullets,
  clearRoad,
  dodgeBullets,
  findRoadToTarget,
  findTargetTank,
  hasBlockPosition,
  isReborn,
  isShootAble,
  mapMatch,
  movePromise,
  myTank,
  resetRunningPromise,
  resolveRunningPromise,
  road,
  runningPromise,
  saveRoad,
  tanks,
  targetTankUID,
} from "./store";
import {
  bulletPositionAtPlustime,
  bulletPositionAtRunTime,
  checkBulletInsideTank,
  checkBulletRunningToTank,
  euclideanDistance,
  moveVisible,
  tankAtNextTime,
} from "./utils";

export const startTrickShootSystem = () => {
  setInterval(async () => {
    try {
      if (isShootAble && myTank && myTank.x && myTank.y) {
        tanks.forEach((tank) => {
          if (!myTank?.x || !myTank?.y || tank.name === MY_NAME) {
            return;
          }
          // if (euclideanDistance(tank, myTank!) > ShootArea) {
          //   return;
          // }
          //Vertical
          if (
            _.inRange(tank.x, myTank?.x ?? 0, (myTank?.x ?? 0) + TankSize) &&
            _.inRange(
              Math.abs((myTank?.x ?? 0) - tank.x),
              (TankSize - BulletSize) / 2,
              (TankSize - BulletSize) / 2 + BulletSize
            )
          ) {
            if (myTank?.orient === "UP" && tank.y < (myTank?.y ?? 0)) {
              shoot();
            }
            if (myTank?.orient === "DOWN" && tank.y > (myTank?.y ?? 0)) {
              shoot();
            }
          }
          if (
            _.inRange(
              tank.x + TankSize,
              myTank?.x ?? 0,
              (myTank?.x ?? 0) + TankSize
            ) &&
            _.inRange(
              Math.abs((myTank?.x ?? 0) - tank.x + TankSize),
              (TankSize - BulletSize) / 2,
              (TankSize - BulletSize) / 2 + BulletSize
            )
          ) {
            if (myTank?.orient === "UP" && tank.y < (myTank?.y ?? 0)) {
              shoot();
            }
            if (myTank?.orient === "DOWN" && tank.y > (myTank?.y ?? 0)) {
              shoot();
            }
          }
          //Horizontal
          if (
            _.inRange(tank.y, myTank?.y ?? 0, (myTank?.y ?? 0) + TankSize) &&
            _.inRange(
              Math.abs((myTank?.y ?? 0) - tank.x),
              (TankSize - BulletSize) / 2,
              (TankSize - BulletSize) / 2 + BulletSize
            )
          ) {
            if (myTank?.orient === "LEFT" && tank.x < (myTank?.x ?? 0)) {
              shoot();
            }
            if (myTank?.orient === "RIGHT" && tank.x > (myTank?.x ?? 0)) {
              shoot();
            }
          }
          if (
            _.inRange(
              tank.y + TankSize,
              myTank?.y ?? 0,
              (myTank?.y ?? 0) + TankSize
            ) &&
            _.inRange(
              Math.abs((myTank?.y ?? 0) - tank.x + TankSize),
              (TankSize - BulletSize) / 2,
              (TankSize - BulletSize) / 2 + BulletSize
            )
          ) {
            if (myTank?.orient === "LEFT" && tank.x < (myTank?.x ?? 0)) {
              shoot();
            }
            if (myTank?.orient === "RIGHT" && tank.x > (myTank?.x ?? 0)) {
              shoot();
            }
          }
        });
      }
    } catch (e) {
      console.log("startTrickShootSystem", e);
    }
  }, ShootAbleTime);
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

export const startDodgeRoadSystem = () => {
  intervalDodge = setInterval(async () => {
    if (road.priority === MovePriority.DODGE) {
      await runningPromise;
    }
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
              _dodge.result.slice(1).map((v) => v.orient)
            );
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, 1);
};

let intervalRunning: any = null;

export const stopIntervalRunning = () => {
  clearInterval(intervalRunning);
};

export const runSystem = (road: { priority: number; data: Array<Orient> }) => {
  // console.log(
  //   road.priority === 0
  //     ? "DODGE"
  //     : road.priority === 1
  //     ? "SHOOT"
  //     : road.priority === 2
  //     ? "NORMAL"
  //     : "NOTHING"
  // );
  intervalRunning = setInterval(async () => {
    if (road.data.length) {
      resetRunningPromise();
      await movePromise;
      let i = 0;
      while (i < road.data.length) {
        const orient = road.data[i];
        let canMoveNextPosition = true;
        if (myTank && road.priority !== MovePriority.DODGE) {
          const nextPosition = tankAtNextTime(myTank, orient);
          bullets.forEach((bullet) => {
            const position = bulletPositionAtPlustime(bullet, TankTimeSpeed);
            if (
              bullet &&
              bullet.x &&
              bullet.y &&
              nextPosition.x &&
              nextPosition.y &&
              position.x &&
              position.y
            ) {
              if (
                checkBulletRunningToTank(nextPosition, {
                  ...position,
                  orient: bullet.orient,
                }) ||
                checkBulletInsideTank(nextPosition, position)
              ) {
                canMoveNextPosition = false;
              }
            }
          });
        }
        if (canMoveNextPosition) {
          moveTank(orient);
          i++;
          await movePromise;
        }
      }
      clearRoad();
      resolveRunningPromise(true);
    }
  }, 17);
};

let intervalFindTargetRoad: any = null;

export const stopIntervalFindTargetRoad = () => {
  clearInterval(intervalFindTargetRoad);
};

export const findTargetSystem = () => {
  if (targetTankUID === "") {
    findTargetTank();
  }
  try {
    if (
      myTank &&
      myTank.x &&
      myTank.y &&
      road.priority > MovePriority.NORMAL &&
      road.data.length === 0
    ) {
      const _road = findRoadToTarget(
        { x: myTank.x, y: myTank.y, orient: myTank.orient },
        0
      );
      if (_road.length >= 1) {
        saveRoad(
          MovePriority.NORMAL,
          _road.slice(1).map((v) => v.orient)
        );
        console.log("SAVE FIND TARGET", _road.length);
      }
    }
  } catch (e) {
    console.log(e);
  }
};
