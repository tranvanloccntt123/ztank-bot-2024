import { TankTimeSpeed } from "../constants";
import {
  bullets,
  checkBulletInsideTank,
  checkBulletRunningToTank,
  checkTankPositionIsObject,
  clearDedgeRoad,
  dodgeBullets,
  hasBlockPosition,
  hasObjectPosition,
  myTank,
  saveBullets,
  saveMap,
  saveTanks,
} from "../store";
import {
  bulletPositionAtPlustime,
  initPosition,
  tankAtNextTime,
  tankPositionAtNextTime,
} from "../utils";
import { mapTest } from "./mapTest";

saveMap(mapTest as any);

saveTanks([
  {
    x: 450,
    y: 645,
    speed: 3,
    type: 1,
    uid: "CsqJPa9mlLg9ISc7AAJl",
    orient: "DOWN",
    isAlive: false,
    size: 33,
    name: "The Fool",
    shootable: true,
    movable: true,
    shootCooldown: 0,
    invulnerable: false,
    protectCooldown: 0,
    score: 66,
    streak: 6,
    bounty: 15,
    color: 1,
  },
] as any);

saveBullets([
  {
    x: 450,
    y: 550,
    orient: "DOWN",
    speed: 4,
    type: 1,
    size: 8,
    uid: "yVATgaV9tvd5WjhDAAAF",
    id: 27231,
    time: new Date().getTime(),
  },
] as any);

if (myTank) {
  const tankPosition = {
    ...initPosition(myTank.x, myTank.y),
  };
  //make dodge queue
  let dodgeRoad: any = {
    [tankPosition.y]: {
      [tankPosition.x]: "ROOT",
    },
  };
  const queue: Array<Position & { ms: number }> = [{ ...tankPosition, ms: 0 }];
  const safeArea = (tankPosition: Position, ms: number) => {
    for (const bullet of Array.from(bullets.values())) {
      const bulletPosition = bulletPositionAtPlustime(bullet, ms);
      if (
        checkBulletRunningToTank(tankPosition, {
          ...bulletPosition,
          orient: bullet.orient,
        })
      ) {
        return false;
      }
    }
    return true;
  };
  const checkBulletsInsideTank = (tankPosition: Position, ms: number) => {
    for (const bullet of Array.from(bullets.values())) {
      const bulletPosition = bulletPositionAtPlustime(bullet, ms);
      if (checkBulletInsideTank(tankPosition, bulletPosition)) {
        return true;
      }
    }
    return false;
  };
  const result: Array<any> = [];
  while (queue.length) {
    const orients = ["UP", "DOWN", "RIGHT", "LEFT"];
    const unOrients = ["DOWN", "UP", "LEFT", "RIGHT"];
    const tankPosition = queue.shift();
    if (safeArea(tankPosition as never, tankPosition?.ms as never)) {
      //REVERT POSTION
      let unOrient = dodgeRoad[tankPosition?.y ?? ""][tankPosition?.x ?? ""];
      let findOrientIndex = unOrients.findIndex((v) => v === unOrient);
      let prevPosition = tankAtNextTime(tankPosition as never, unOrient);
      result.unshift({
        ...prevPosition,
        orient: orients[findOrientIndex] ?? "null",
      } as never);
      while (unOrient !== "ROOT") {
        unOrient = dodgeRoad[prevPosition?.y ?? ""][prevPosition?.x ?? ""];
        findOrientIndex = unOrients.findIndex((v) => v === unOrient);
        prevPosition = tankAtNextTime(prevPosition as never, unOrient);
        result.unshift({
          ...prevPosition,
          orient: orients[findOrientIndex] ?? "null",
        } as never);
      }
      break;
    }
    for (let i = 0; i < orients.length; i++) {
      const orient = orients[i];
      const moveNextPosition = tankPositionAtNextTime(
        tankPosition as never,
        orient as never
      );
      if (
        !checkTankPositionIsObject(moveNextPosition as never) &&
        !checkBulletsInsideTank(tankPosition as never, tankPosition!.ms) &&
        !(
          tankPosition!.x >= 848 ||
          tankPosition!.x < 20 ||
          tankPosition!.y >= 648 ||
          tankPosition!.y < 20
        )
      ) {
        if (!dodgeRoad?.[moveNextPosition.y]?.[moveNextPosition.x]) {
          if (!dodgeRoad?.[moveNextPosition.y]) {
            dodgeRoad[moveNextPosition.y] = {};
          }
          dodgeRoad[moveNextPosition.y][moveNextPosition.x] = unOrients[i];
          queue.push({
            ...moveNextPosition,
            ms: (tankPosition?.ms ?? 0) + TankTimeSpeed,
          });
        }
      }
    }
  }
  console.log(result);
}
