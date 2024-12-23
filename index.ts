import { MY_NAME, TankSize, TankTimeSpeed } from "./constants";
import { joinMatch, moveTank, shoot } from "./connect";
import {
  bulletPositionAtPlusTime,
  checkBulletInsideTank,
  sleep,
  tankAtNextTime,
  checkBulletRunningToTank,
  isSameVerticalAxisWithSize,
  isSameHorizontalAxisWithSize,
  euclideanDistance,
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
import {
  findTargetSystem,
  startDodgeRoadSystem,
  startIntervalToCheckBullet,
  startTrickShootSystem,
} from "./tankSystem";

const init = async () => {
  joinMatch();
  //TEST
  resolveStartPromise(true);
  await startPromise;
  resolveMovePromise(true);
  resolveShootPromise(true);
  while (true) {
    let canMoveNextPosition = false;
    // if ((new Date().getTime() - lastMoveTime ?? 0) > 500) {
    //   console.log("NOT MOVE", myTank, tanks.get("Pink1"));
    // }
    try {
      if (road.index !== -1 && road.data.length && road.data[road.index]) {
        const orient = road.data[road.index];
        if (orient === "SHOOT") {
          // if (canMoveNextPosition) {
          //   await sleep(1);
          // }
          shoot();
          road.index = road.index + 1;
        }
        canMoveNextPosition = true;
        if (
          myTank &&
          road.priority !== MovePriority.DODGE &&
          // road.priority !== MovePriority.SHOOT &&
          orient !== "SHOOT" &&
          orient !== "PAUSE"
        ) {
          const nextPosition = tankAtNextTime(myTank, orient);
          for (const bullet of Array.from(bullets.values())) {
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
                break;
              }
            }
          }
        }

        if (canMoveNextPosition) {
          if (orient !== "SHOOT" && orient !== "PAUSE") {
            moveTank(orient);
            road.index = road.index + 1;
            await movePromise;
          }
        } else {
          clearRoad();
        }

        if (road.index >= road.data.length) {
          clearRoad();
        }
      } else {
        clearRoad();
      }
    } catch (e) {
      clearRoad();
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
