import {
  EmitEvent,
  TankSize,
  TankSpeed,
  TankTimeSpeed,
  isShootAble,
  movePromise,
  startPromise,
} from "./constants";
import { joinMatch, moveTank, shoot } from "./connect";
import {
  bulletPositionAtPlustime,
  bulletPositionAtRunTime,
  checkTanksCanShootNow,
  moveVisible,
  positionInSideTank,
  sleep,
  sortBulletWithMyTank,
  tankAtNextTime,
} from "./utils";
import {
  clearBulletNotWorking,
  mapMatch,
  myTank,
  startIntervalToCheckBullet,
  tanks,
} from "./store";
import * as _ from "lodash";

const shootNow = async () => {
  if (!isShootAble) {
    return;
  }
  const canShootEvents = checkTanksCanShootNow(mapMatch, tanks, myTank!);
  for (const event of canShootEvents) {
    if (event.eventName === EmitEvent.Move) {
      moveTank(event.data);
      await movePromise;
    }
    if (event.eventName === EmitEvent.Shoot) {
      shoot();
    }
  }
};

const main = async () => {
  await startPromise;
  while (true) {
    if (myTank) {
      clearBulletNotWorking();
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
        if (isShootAble) {
          await shootNow();
        }
        const _orientList = moveVisible(mapMatch, myTank);
        if (!_orientList.includes(orientTest)) {
          orientTest = _orientList[
            Math.floor(Math.random() * _orientList.length)
          ] as any;
        }
        const checkBulletsAtOrient: any = _orientList.reduce(
          (prev, v) => ({ ...prev, [v]: v }),
          {}
        );
        //TODO: Ne dan
        const _bullets = sortBulletWithMyTank(myTank);
        if (_bullets.length) {
          const nextPosition = _orientList.map((v) => tankAtNextTime(myTank!, v));
          for (let bullet of _bullets) {
            const position = bulletPositionAtPlustime(bullet, TankTimeSpeed);
            nextPosition.forEach((v, i) => {
              if (positionInSideTank(v, position)) {
                // trung dan
                delete checkBulletsAtOrient?.[_orientList?.[i]];
              }
            });
          }
        }
        if (!checkBulletsAtOrient?.[orientTest] && Object.values(checkBulletsAtOrient ?? {}).length) {
          console.log('CHECKED', orientTest, Object.values(checkBulletsAtOrient ?? {}));
          moveTank(Object.values(checkBulletsAtOrient ?? {})?.[0] as never);
          await movePromise;
          moveTank(Object.values(checkBulletsAtOrient ?? {})?.[0] as never);
          await movePromise;
          continue;
        }
        moveTank(orientTest);
        await movePromise;
      }
    }
    await sleep(3);
  }

  // while (true) {
  //   if (isFinish) {
  //     continue;
  //   }
  //   if (myTank) {
  //     const orientList = moveVisible(mapMatch, myTank);
  //     let orientVisible = orientList.concat();
  //     for (const bullet of Array.from(bullets.values())) {
  //       const position = bulletPositionAtRunTime(bullet);
  //       const bulletMapIndex = initPosition(
  //         position.x / ObjectSize,
  //         position.y / ObjectSize
  //       );
  //       const mapIndex = mapIndexOnMapMatch({ x: myTank.x, y: myTank.y });
  //       //REMOVE ORIENT VISIBLE
  //       if (
  //         (bulletMapIndex.x === mapIndex.startX ||
  //           bulletMapIndex.x === mapIndex.endX) &&
  //         (bulletMapIndex.y + 2 > mapIndex.startY ||
  //           bulletMapIndex.y + 2 > mapIndex.startY)
  //       ) {
  //         //REMOVE DOWN VISIBLE
  //         orientVisible = orientVisible.filter((v) => v !== "DOWN");
  //       } else if (
  //         (bulletMapIndex.x === mapIndex.startX ||
  //           bulletMapIndex.x === mapIndex.endX) &&
  //         (bulletMapIndex.y - 2 < mapIndex.startY ||
  //           bulletMapIndex.y - 2 < mapIndex.startY)
  //       ) {
  //         //REMOVE UP VISIBLE
  //         orientVisible = orientVisible.filter((v) => v !== "UP");
  //       } else if (
  //         (bulletMapIndex.x + 2 > mapIndex.startX ||
  //           bulletMapIndex.x + 2 > mapIndex.endX) &&
  //         (bulletMapIndex.y === mapIndex.startY ||
  //           bulletMapIndex.y === mapIndex.startY)
  //       ) {
  //         //REMOVE RIGHT VISIBLE
  //         orientVisible = orientVisible.filter((v) => v !== "RIGHT");
  //       } else if (
  //         (bulletMapIndex.x - 2 < mapIndex.startX ||
  //           bulletMapIndex.x - 2 < mapIndex.endX) &&
  //         (bulletMapIndex.y === mapIndex.startY ||
  //           bulletMapIndex.y === mapIndex.startY)
  //       ) {
  //         //REMOVE LEFT VISIBLE
  //         orientVisible = orientVisible.filter((v) => v !== "LEFT");
  //       }
  //     }
  //     if (orientList.length !== orientVisible.length && orientVisible.length) {
  //       //Tranh dan
  //       moveTank(orientVisible[0]);
  //       moveTank(orientVisible[0]);
  //       continue;
  //     }
  //     const canShootEvents = checkTanksCanShootNow(mapMatch, tanks, myTank);
  //     for (const event of canShootEvents) {
  //       if (event.eventName === EmitEvent.Move) {
  //         moveTank(event.data);
  //       }
  //       await sleep(17);
  //       if (event.eventName === EmitEvent.Shoot) {
  //         shoot();
  //       }
  //     }
  //     if (
  //       !comparePostions(prevPosition, { x: myTank.x, y: myTank.y }) ||
  //       prevOrient !== myTank.orient
  //     ) {
  //       // const orientVisible = moveVisible(mapMatch, myTank);
  //       // prevPosition.x = myTank.x;
  //       // prevPosition.y = myTank.y;
  //       // if (orientVisible.length) {
  //       //   moveTank(orientVisible?.[0]);
  //       //   clearBulletNotWorking();
  //       // }
  //     }
  //   }
  //   clearBulletNotWorking();
  // }
};

joinMatch();

main();

startIntervalToCheckBullet();
