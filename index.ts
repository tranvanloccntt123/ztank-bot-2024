import { TankTimeSpeed } from "./constants";
import { joinMatch, moveTank, shoot } from "./connect";
import {
  bulletPositionAtPlusTime,
  checkBulletInsideTank,
  sleep,
  tankAtNextTime,
  checkBulletRunningToTank,
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
        if (myTank && road.priority !== MovePriority.DODGE) {
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
        }
        if (canMoveNextPosition) {
          moveTank(orient);
          road.index = road.index + 1;
          await movePromise;
          if (road.index === road.data.length) {
            if (road.priority === MovePriority.SHOOT) {
              shoot();
            }
            clearRoad();
          }
        } else {
          clearRoad();
        }
      }
    } catch (e) {
      console.log("MAIN", e);
    } finally {
      if (!canMoveNextPosition) {
        await sleep(2);
      }
    }
  }
};

init();

startIntervalToCheckBullet();

startTrickShootSystem();

startDodgeRoadSystem();

findTargetSystem();
