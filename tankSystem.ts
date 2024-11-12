import {
  BulletSize,
  MapSize,
  TankTimeSpeed,
  MY_NAME,
  TankSize,
  BulletTimeSpeed,
} from "./constants";
import {
  MovePriority,
  bullets,
  dodgeBullets,
  findRoadOnListMapIndex,
  findTargetTankV2,
  findToDefZoneOnMap,
  hasBlockBetweenObjects,
  hasBlockPosition,
  isReborn,
  isShootAble,
  listDefZone,
  mapMatch,
  myTank,
  road,
  saveRoad,
  startPromise,
  tanks,
} from "./store";
import {
  bulletPositionAtRunTime,
  euclideanDistance,
  otherTankInsideHorizontal,
  otherTankInsideVertical,
} from "./utils";
import { shoot } from "./connect";

export const startTrickShootSystem = async () => {
  await startPromise;
  let checking = false;
  setInterval(() => {
    try {
      if (
        (myTank?.shootable || isShootAble) &&
        myTank &&
        myTank.x &&
        myTank.y
      ) {
        Array.from(tanks.values())
          .sort((a, b) => {
            const aPosition = euclideanDistance(
              { x: a.x, y: a.y },
              { x: myTank!.x, y: myTank!.y }
            );
            const bPosition = euclideanDistance(
              { x: b.x, y: b.y },
              { x: myTank!.x, y: myTank!.y }
            );
            return aPosition - bPosition;
          })
          .forEach((tank) => {
            if (
              !myTank?.x ||
              !myTank?.y ||
              tank.name === MY_NAME ||
              isReborn.has(tank.name) ||
              !(myTank?.shootable || isShootAble)
            ) {
              return;
            }
            //Vertical
            if (otherTankInsideVertical(tank)) {
              if (
                euclideanDistance(tank, myTank) <= 53 ||
                !hasBlockBetweenObjects(
                  {
                    x: myTank.x + (TankSize / 2 - BulletSize / 2) - 2,
                    y: myTank.y,
                    size: BulletSize,
                  },
                  {
                    x: myTank.x + (TankSize / 2 - BulletSize / 2) - 2,
                    y: tank.y,
                    size: BulletSize,
                  }
                )
              ) {
                if (myTank?.orient === "UP" && tank.y < (myTank?.y ?? 0)) {
                  // saveRoad(MovePriority.SHOOT, ["SHOOT"]);
                  if (euclideanDistance(tank, myTank) <= TankSize * 6) {
                    shoot();
                  }
                } else if (
                  myTank?.orient === "DOWN" &&
                  tank.y > (myTank?.y ?? 0)
                ) {
                  // saveRoad(MovePriority.SHOOT, ["SHOOT"]);
                  if (euclideanDistance(tank, myTank) <= TankSize * 6) {
                    shoot();
                  }
                } else {
                  if (tank.y < (myTank?.y ?? 0)) {
                    saveRoad(MovePriority.SHOOT, ["UP", "SHOOT"]);
                  } else {
                    saveRoad(MovePriority.SHOOT, ["DOWN", "SHOOT"]);
                  }
                }
                return;
              }
            }
            //Horizontal
            if (otherTankInsideHorizontal(tank)) {
              if (
                euclideanDistance(tank, myTank) <= 53 ||
                !hasBlockBetweenObjects(
                  {
                    x: myTank.x,
                    y: myTank.y + (TankSize / 2 - BulletSize / 2) - 2,
                    size: BulletSize,
                  },
                  {
                    x: tank.x,
                    y: myTank.y + (TankSize / 2 - BulletSize / 2) - 2,
                    size: BulletSize,
                  }
                )
              ) {
                if (myTank?.orient === "LEFT" && tank.x < (myTank?.x ?? 0)) {
                  // saveRoad(MovePriority.SHOOT, ["SHOOT"]);
                  if (euclideanDistance(tank, myTank) <= TankSize * 6) {
                    shoot();
                  }
                } else if (
                  myTank?.orient === "RIGHT" &&
                  tank.x > (myTank?.x ?? 0)
                ) {
                  // saveRoad(MovePriority.SHOOT, ["SHOOT"]);
                  if (euclideanDistance(tank, myTank) <= TankSize * 6) {
                    shoot();
                  }
                } else {
                  if (tank.x < (myTank?.x ?? 0)) {
                    saveRoad(MovePriority.SHOOT, ["LEFT", "SHOOT"]);
                  } else {
                    saveRoad(MovePriority.SHOOT, ["RIGHT", "SHOOT"]);
                  }
                }
                return;
              }
            }
          });
      }
    } catch (e) {
      console.log(e);
    }
  }, 2);
};

let countDownMove: any = null;

export const stopIntervalCheckBullet = () => {
  clearInterval(countDownMove);
};

export const startIntervalToCheckBullet = async () => {
  await startPromise;
  countDownMove = setInterval(() => {
    try {
      if (!mapMatch.length) {
        return;
      }
      bullets.forEach((bullet) => {
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
          bullets.delete(bullet.id);
        } else {
          if (
            hasBlockPosition({
              x: runTimePosition?.x ?? 0,
              y: runTimePosition?.y ?? 0,
            })
          ) {
            bullets.delete(bullet.id);
          } else if (
            hasBlockPosition({
              x: (runTimePosition?.x ?? 0) + BulletSize,
              y: (runTimePosition?.y ?? 0) + BulletSize,
            })
          ) {
            bullets.delete(bullet.id);
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
  }, BulletTimeSpeed);
};

let intervalDodge: any = null;

export const stopIntervalDodge = () => {
  clearInterval(intervalDodge);
};

export const startDodgeRoadSystem = async () => {
  await startPromise;
  setInterval(() => {
    try {
      if (
        myTank &&
        !isReborn.has(myTank.name) &&
        road.priority > MovePriority.DODGE
      ) {
        if (bullets.size) {
          const _dodge = dodgeBullets(myTank, 0);
          if (!_dodge.isSafe && _dodge.result.length) {
            saveRoad(
              MovePriority.DODGE,
              _dodge.result
                .filter((v) => v.orient !== null)
                .map((v) => v.orient)
            );
          }
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
    }
  }, 3);
};

let intervalFindTargetRoad: any = null;

export const stopIntervalFindTargetRoad = () => {
  clearInterval(intervalFindTargetRoad);
};

export const findTargetSystem = async () => {
  await startPromise;
  setInterval(async () => {
    try {
      if (
        myTank &&
        myTank.x &&
        myTank.y &&
        road.priority > MovePriority.NORMAL
      ) {
        const findLine = findTargetTankV2();
        const isSmallList = findLine.length > 4;
        const _road = findRoadOnListMapIndex(
          myTank!,
          isSmallList ? findLine.slice(0, 3) : findLine,
          0
        );
        if (_road.length) {
          saveRoad(
            MovePriority.NORMAL,
            _road.map((v) => v.orient)
          );
          return;
        }
        // move to center
        const _roadToDefArea = findToDefZoneOnMap(listDefZone);
        if (_roadToDefArea.length) {
          const findLineToDefArea = findRoadOnListMapIndex(
            myTank!,
            _roadToDefArea,
            0
          );
          if (findLineToDefArea.length > 1) {
            saveRoad(
              MovePriority.NORMAL,
              findLineToDefArea.map((v) => v.orient)
            );
            return;
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, TankTimeSpeed * 2);
};
