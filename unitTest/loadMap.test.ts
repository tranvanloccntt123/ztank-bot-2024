import { BulletSize, MY_NAME, TankSize } from "../constants";
import {
  MovePriority,
  bullets,
  dodgeBullets,
  findRoadOnListMapIndex,
  findTargetOnMap,
  findTargetTank,
  hasBlockBetweenObjects,
  isReborn,
  isShootAble,
  myTank,
  road,
  saveBullets,
  saveMap,
  saveTanks,
  tanks,
} from "../store";
import {
  euclideanDistance,
  otherTankInsideHorizontal,
  otherTankInsideVertical,
} from "../utils";

import { mapTest } from "./map1Test";

saveMap(mapTest as any);

saveTanks([
  {
    x: 667,
    y: 32,
    speed: 3,
    type: 1,
    uid: "St3F4HFo6JZzLB2qAAFH",
    orient: "RIGHT",
    isAlive: true,
    size: 33,
    name: "The Fool",
    shootable: true,
    movable: true,
    shootCooldown: 0,
    invulnerable: false,
    protectCooldown: 0,
    score: 20,
    streak: 2,
    bounty: 3,
    color: 1,
  },
  {
    x: 765,
    y: 190,
    speed: 3,
    type: 1,
    uid: "8dTOBtblMpjylpaPAACj",
    orient: "DOWN",
    isAlive: true,
    size: 33,
    name: "zarenabot",
    shootable: true,
    movable: false,
    shootCooldown: 0,
    invulnerable: false,
    protectCooldown: 0,
    score: 2250,
    streak: 0,
    bounty: 0,
    color: 0,
  },
]);

saveBullets([
  {
    x: 105.97058823527153,
    y: 313.5,
    orient: "LEFT",
    speed: 4,
    type: 1,
    size: 8,
    uid: "n8p_WytpPJuUdo_HAAAF",
    id: 134667,
    time: 1730596223734,
  },
  {
    x: 576.5,
    y: 564.9117647058963,
    orient: "DOWN",
    speed: 4,
    type: 1,
    size: 8,
    uid: "n8p_WytpPJuUdo_HAAAF",
    id: 134669,
    time: 1730596223734,
  },
] as any);

test("Dodge", () => {
  expect(myTank).not.toBe(null);
  const result = dodgeBullets(myTank!, 0);
  console.log(result);
  expect(result.result.length).toBe(1);
});

test("New find road", () => {
  findTargetTank();
  const onMapPositions = findTargetOnMap();
  console.log(onMapPositions);
  expect(onMapPositions.length).toBeGreaterThanOrEqual(1);
  if (onMapPositions.length) {
    const road = findRoadOnListMapIndex(myTank!, onMapPositions, 0);
    expect(road.length).toBeGreaterThanOrEqual(1);
  }
});

test("Bullet System", () => {
  if ((myTank?.shootable || isShootAble) && myTank && myTank.x && myTank.y) {
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
          isReborn.has(tank.name)
        ) {
          return;
        }
        //Vertical
        if (
          otherTankInsideVertical(tank) &&
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
            // shoot();
            // return;
          } else if (myTank?.orient === "DOWN" && tank.y > (myTank?.y ?? 0)) {
            // shoot();
          } else {
            if (road.priority > MovePriority.SHOOT) {
              if (tank.y < (myTank?.y ?? 0)) {
                // saveRoad(MovePriority.SHOOT, ["UP", "SHOOT"]);
                // return;
              } else {
                // saveRoad(MovePriority.SHOOT, ["DOWN", "SHOOT"]);
                // return;
              }
            }
          }
        }
        //Horizontal
        if (
          otherTankInsideHorizontal(tank) &&
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
            // shoot();
            // return;
          } else if (myTank?.orient === "RIGHT" && tank.x > (myTank?.x ?? 0)) {
            // shoot();
            return;
          } else {
            if (road.priority > MovePriority.SHOOT) {
              if (tank.x < (myTank?.x ?? 0)) {
                // saveRoad(MovePriority.SHOOT, ["LEFT", "SHOOT"]);
                // if (tank.name === "Pink1") {
                //   console.log(myTank, tank);
                // }
                // return
              } else {
                // saveRoad(MovePriority.SHOOT, ["RIGHT", "SHOOT"]);
                // if (tank.name === "Pink1") {
                //   console.log(myTank, tank);
                // }
                // return;
              }
            }
          }
        }
      });
  }
});
