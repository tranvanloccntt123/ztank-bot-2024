import { MY_NAME, TankSize, TankTimeSpeed } from "./constants";
import { joinMatch, moveTank, shoot } from "./connect";
import {
  bulletPositionAtPlusTime,
  checkBulletInsideTank,
  sleep,
  tankAtNextTime,
  checkBulletRunningToTank,
  isSameVerticalAxisWithSize,
  euclideanDistance,
  isSameHorizontalAxisWithSize,
} from "./utils";
import {
  MovePriority,
  bullets,
  clearRoad,
  movePromise,
  myTank,
  resolveMovePromise,
  resolveShootPromise,
  resolveStartPromise,
  road,
  startPromise,
  tanks,
} from "./store";
import * as _ from "lodash";
import {
  findTargetSystem,
  startDodgeRoadSystem,
  startIntervalToCheckBullet,
  startTrickShootSystem,
} from "./tankSystem";

const init = async () => {
  resolveMovePromise(true);
  resolveShootPromise(true);
  joinMatch();
  //TEST
  resolveStartPromise(true);
  //
  await startPromise;
  while (true) {
    let canMoveNextPosition = false;
    try {
      if (road.index !== -1 && road.data.length && road.data[road.index]) {
        const orient = road.data[road.index];
        canMoveNextPosition = true;
        if (
          myTank &&
          road.priority !== MovePriority.DODGE &&
          orient !== "SHOOT"
        ) {
          const nextPosition = tankAtNextTime(myTank, orient);
          bullets.forEach((bullet) => {
            const bulletPosition = bulletPositionAtPlusTime(
              bullet,
              TankTimeSpeed
            );
            if (
              bullet &&
              bullet.x &&
              bullet.y &&
              nextPosition.x &&
              nextPosition.y &&
              bulletPosition.x &&
              bulletPosition.y
            ) {
              if (
                checkBulletRunningToTank(nextPosition, {
                  ...bulletPosition,
                  orient: bullet.orient,
                }) ||
                checkBulletInsideTank(nextPosition, bulletPosition)
              ) {
                canMoveNextPosition = false;
              }
            }
          });
          if (canMoveNextPosition) {
            tanks.forEach((tank) => {
              if (tank.name === MY_NAME || !tank.shootable) {
                return;
              }
              if (
                (isSameVerticalAxisWithSize(tank, {
                  ...nextPosition,
                  size: TankSize,
                }) ||
                  isSameHorizontalAxisWithSize(tank, {
                    ...nextPosition,
                    size: TankSize,
                  })) &&
                euclideanDistance(tank, { ...nextPosition }) <= TankSize * 2
              ) {
                canMoveNextPosition = false;
              }
            });
          }
        }
        if (orient === "SHOOT") {
          await sleep(1);
          shoot();
          road.index = road.index + 1;
        }

        if (canMoveNextPosition) {
          if (orient !== "SHOOT") {
            moveTank(orient);
            road.index = road.index + 1;
            await movePromise;
          }
        } else {
          clearRoad();
        }

        if (road.index === road.data.length) {
          clearRoad();
        }
      }
    } catch (e) {
      console.log("MAIN", e);
    } finally {
      if (!canMoveNextPosition) {
        await sleep(1);
      }
    }
  }
};

init();

startIntervalToCheckBullet();

startTrickShootSystem();

startDodgeRoadSystem();

findTargetSystem();
