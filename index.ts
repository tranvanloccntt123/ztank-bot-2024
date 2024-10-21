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
  initPosition,
} from "./utils";
import {
  MovePriority,
  bullets,
  clearRoad,
  dodgeBullets,
  findRoadToPosition,
  findTargetOnMap,
  isReborn,
  isShootAble,
  mapMatch,
  movePromise,
  myTank,
  resetRunningPromise,
  resolveMovePromise,
  resolveRunningPromise,
  resolveShootPromise,
  road,
  startPromise,
  tanks,
  targetTankUID,
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
      await movePromise;
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

const dodgeAndShoot = async () => {
  if (await dodge()) {
    if (isShootAble) {
      const isShoot = await shootNow();
      if (isShoot) {
        if (await dodge()) {
          return true;
        }
      }
    }
  }
  if (isShootAble) {
    const isShoot = await shootNow();
    if (isShoot) {
      if (await dodge()) {
        return true;
      }
    }
  }
  return false;
};

const main = async () => {
  joinMatch();
  resolveMovePromise(true);
  resolveShootPromise(true);
  let isRunning = false;
  await startPromise;
  let listRoad: Array<Position> = [];
  const resetRoad = () => {
    listRoad = [];
  };
  while (true) {
    try {
      if (myTank && myTank.x && myTank.y) {
        if (!listRoad.length) {
          //Chua tim duong
          await dodgeAndShoot();
          //Tim duong tren map
          const findOnMap = findTargetOnMap();
          if (findOnMap.length) {
            listRoad = findOnMap;
          } else {
            resetRoad();
          }
          continue;
        } else {
          //Da tim duoc duong
          if (await dodgeAndShoot()) {
            resetRoad();
            console.log("DODGE");
            continue;
          }
          const roadIndex = listRoad.shift();
          const findRoad = findRoadToPosition(roadIndex!);
          const listOrients =
            findRoad.length >= 1 ? findRoad.slice(1).map((v) => v.orient) : [];
          if (listOrients.length) {
            let i = 0;
            await movePromise;
            while (i < listOrients.length) {
              const orient = listOrients[i];
              if (await dodgeAndShoot()) {
                isRunning = true;
                console.log("DODGE");
                resetRoad();
                break;
              }
              const nextPosition = tankAtNextTime(myTank, orient);
              let canMoveNextPosition = true;
              bullets.forEach((bullet) => {
                const position = bulletPositionAtPlustime(
                  bullet,
                  TankTimeSpeed
                );
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
              if (canMoveNextPosition) {
                moveTank(orient);
                await movePromise;
                isRunning = true;
                i++;
              } else {
                resetRoad();
                break;
              }
            }
          } else {
            console.log(roadIndex, myTank, tanks.get(targetTankUID));
            resetRoad();
            continue;
          }
        }
      }
    } catch (e) {
      console.log(e, myTank, tanks.get(targetTankUID));
    } finally {
      await sleep(3);
      if (socket.disconnected) {
        socket.connect();
      }
    }
  }
};

main();

// const init = async () => {
//   resolveMovePromise(true);
//   resolveShootPromise(true);
//   joinMatch();
//   while (true) {
//     let canMoveNextPosition = false;
//     try {
//       if (road.index !== -1 && road.data.length && road.data[road.index]) {
//         const orient = road.data[road.index];
//         canMoveNextPosition = true;
//         if (road.priority === MovePriority.DODGE) {
//           console.log("DODGE");
//         }
//         if (myTank && road.priority !== MovePriority.DODGE) {
//           const nextPosition = tankAtNextTime(myTank, orient);
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
//         }
//         if (canMoveNextPosition) {
//           moveTank(orient);
//           road.index = road.index + 1;
//           await movePromise;
//           if (road.index === road.data.length) {
//             clearRoad();
//           }
//         }
//       }
//     } catch (e) {
//       console.log("MAIN", e);
//     } finally {
//       if (!canMoveNextPosition) {
//         await sleep(2);
//       }
//     }
//   }
// };

// init();

startIntervalToCheckBullet();

// startTrickShootSystem();

// startDodgeRoadSystem();

// findTargetSystem();
