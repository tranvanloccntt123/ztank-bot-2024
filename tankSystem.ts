import _ from "lodash";
import { shoot } from "./connect";
import {
  TankSize,
  BulletSize,
  ShootAbleTime,
  MapSize,
} from "./constants";
import {
  bullets,
  hasBlockPosition,
  isShootAble,
  mapMatch,
  myTank,
  tanks,
} from "./store";
import { bulletPositionAtRunTime, euclideanDistance } from "./utils";

export const startTrickShootSystem = () => {
  setInterval(async () => {
    if (isShootAble && myTank) {
      tanks.forEach((tank) => {
        if (
          euclideanDistance(
            { x: myTank?.x ?? 0, y: myTank?.y ?? 0 },
            { x: tank.x, y: tank.y }
          ) > 300
        ) {
          return;
        }
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
  }, ShootAbleTime);
};

let countDownMove: any = null;

export const stopIntervalCheckBullet = () => {
  clearInterval(countDownMove);
};

export const startIntervalToCheckBullet = () => {
  countDownMove = setInterval(() => {
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
  }, 1);
};
