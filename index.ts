import { EmitEvent, MY_NAME, TankSpeed, TankTimeSpeed } from "./constants";
import { joinMatch, moveTank, shoot } from "./connect";
import {
  bulletPositionAtPlustime,
  checkTanksCanShootNow,
  moveVisible,
  sleep,
  tankAtNextTime,
} from "./utils";
import {
  addDodgeRoadChecked,
  bullets,
  checkBulletInsideTank,
  clearDedgeRoad,
  dodgeBullets,
  dodgeRoad,
  isReborn,
  isShootAble,
  mapMatch,
  movePromise,
  myTank,
  startPromise,
  tanks,
  tanksId,
} from "./store";
import * as _ from "lodash";
import {
  startIntervalToCheckBullet,
  startTrickShootSystem,
} from "./tankSystem";

const shootNow = async () => {
  if (!isShootAble) {
    return;
  }
  const canShootEvents = checkTanksCanShootNow(mapMatch, tanks, myTank!);
  for (const event of canShootEvents) {
    if (event.eventName === EmitEvent.Move) {
      moveTank(event.data);
      shoot();
      await movePromise;
    } else {
      shoot();
      return;
    }
  }
};

const main = async () => {
  await startPromise;
  while (true) {
    try {
      if (myTank) {
        const orientList = moveVisible(mapMatch, myTank);
        //TODO TEST
        let orientTest = orientList[
          Math.floor(Math.random() * orientList.length)
        ] as any;
        for (
          let i = 0;
          i <= Math.floor(Math.random() * Math.floor(300 / TankSpeed) + 20);
          i++
        ) {
          if (!isReborn.has(myTank.uid)) {
            clearDedgeRoad(Array.from(bullets.values()));
            if (bullets.size) {
              const currentPosition = {
                x: myTank.x,
                y: myTank.y,
                orient: myTank.orient,
              };
              addDodgeRoadChecked(currentPosition as never);
              const dodge = dodgeBullets(
                { x: myTank.x, y: myTank.y, orient: myTank.orient },
                0,
                0
              );
              if (dodge && dodgeRoad.length) {
                for (const road of dodgeRoad) {
                  if (!road.orient) {
                    continue;
                  }
                  for (let i = 0; i < road.count; i++) {
                    moveTank(road.orient);
                    orientTest = road.orient;
                    await movePromise;
                  }
                }
                continue;
              }
            }
          }
          const _orientList = moveVisible(mapMatch, myTank);
          if (!_orientList.includes(orientTest)) {
            orientTest = _orientList[
              Math.floor(Math.random() * _orientList.length)
            ] as any;
          }
          const nextPosition = tankAtNextTime(myTank, orientTest);
          let canMoveNextPosition = true;
          bullets.forEach((bullet) => {
            const position = bulletPositionAtPlustime(bullet, TankTimeSpeed);
            const name = tanksId.get(bullet.uid);
            if (name === MY_NAME) {
              return;
            }
            if (checkBulletInsideTank(nextPosition, position)) {
              canMoveNextPosition = false;
            }
          });
          if (canMoveNextPosition) {
            moveTank(orientTest);
            await movePromise;
          }
          if (isShootAble) {
            await shootNow();
          }
        }
      }
    } catch (e) {
    } finally {
      await sleep(2);
    }
  }
};

joinMatch();

main();

startIntervalToCheckBullet();

startTrickShootSystem();
