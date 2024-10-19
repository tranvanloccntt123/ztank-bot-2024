import { EmitEvent, TankSpeed, TankTimeSpeed } from "./constants";
import socket, { joinMatch, moveTank, shoot } from "./connect";
import {
  bulletPositionAtPlustime,
  checkBulletInsideTank,
  checkTanksCanShootNow,
  moveVisible,
  sleep,
  tankAtNextTime,
  checkBulletRunningToTank,
} from "./utils";
import {
  MovePriority,
  bullets,
  clearRoad,
  dodgeBullets,
  isReborn,
  isShootAble,
  mapMatch,
  movePromise,
  myTank,
  resetRunningPromise,
  resolveMovePromise,
  resolveRunningPromise,
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

const shootNow = async () => {
  if (!isShootAble) {
    return false;
  }
  const canShootEvents = checkTanksCanShootNow(mapMatch, tanks, myTank!);
  for (const event of canShootEvents) {
    if (event.eventName === EmitEvent.Move) {
      moveTank(event.data);
      shoot();
      await movePromise;
      return true;
    } else {
      shoot();
      return true;
    }
  }
  return false;
};

const dodge = async () => {
  if (myTank && !isReborn.has(myTank.name) && myTank.x && myTank.y) {
    if (bullets.size) {
      const _dodge = dodgeBullets(
        { x: myTank.x, y: myTank.y, orient: myTank.orient },
        Array.from(bullets.values()),
        0
      );
      if (!_dodge.isSafe && _dodge.result.length >= 1) {
        for (let i = 1; i < _dodge.result.length; i++) {
          moveTank(_dodge.result[i].orient as never);
          await movePromise;
        }
        return true;
      }
    }
  }
  return false;
};

// const main = async () => {
//   let isRunning = false;
//   await startPromise;
//   while (true) {
//     try {
//       if (myTank && myTank.x && myTank.y) {
//         const orientList = moveVisible(mapMatch, myTank);
//         //TODO TEST
//         let orientTest = orientList[
//           Math.floor(Math.random() * orientList.length)
//         ] as any;
//         for (
//           let i = 0;
//           i <= Math.floor(Math.random() * Math.floor(300 / TankSpeed) + 20);
//           i++
//         ) {
//           if (await dodge()) {
//             isRunning = true;
//             continue;
//           }
//           if (isShootAble) {
//             const isShoot = await shootNow();
//             if (isShoot) {
//               isRunning = true;
//             }
//           }
//           if (await dodge()) {
//             isRunning = true;
//             continue;
//           }
//           const _orientList = moveVisible(mapMatch, myTank);
//           if (!_orientList.includes(orientTest)) {
//             orientTest = _orientList[
//               Math.floor(Math.random() * _orientList.length)
//             ] as any;
//           }
//           const nextPosition = tankAtNextTime(myTank, orientTest);
//           let canMoveNextPosition = true;
//           bullets.forEach((bullet) => {
//             const position = bulletPositionAtPlustime(bullet, TankTimeSpeed);
//             if (
//               bullet &&
//               bullet.x &&
//               bullet.y &&
//               nextPosition.x &&
//               nextPosition.y &&
//               position.x &&
//               position.y
//             ) {
//               if (
//                 checkBulletRunningToTank(nextPosition, {
//                   ...position,
//                   orient: bullet.orient,
//                 }) ||
//                 checkBulletInsideTank(nextPosition, position)
//               ) {
//                 canMoveNextPosition = false;
//               }
//             }
//           });
//           if (canMoveNextPosition) {
//             moveTank(orientTest);
//             await movePromise;
//             isRunning = true;
//           }
//         }
//       }
//     } catch (e) {
//       console.log(e);
//     } finally {
//       await sleep(3);
//       if (socket.disconnected) {
//         socket.connect();
//       }
//     }
//   }
// };

joinMatch();

// main();

const init = async () => {
  resolveMovePromise(true);
  while (true) {
    let canMoveNextPosition = false;

    try {
      if (road.index !== -1 && road.data.length && road.data[road.index]) {
        const orient = road.data[road.index];
        canMoveNextPosition = true;
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
          road.index = road.index + 1;
          await movePromise;
          if (road.index === road.data.length) {
            clearRoad();
          }
        }
      } else {
        findTargetSystem();
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

// findTargetSystem();

startDodgeRoadSystem();
