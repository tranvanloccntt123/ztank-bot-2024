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

import { mapTest } from "./mapTest";

saveMap(mapTest as any);

saveTanks([
  {
    x: 302,
    y: 315,
    speed: 3,
    type: 1,
    uid: "NCzESvuC0Ba70xlzAABx",
    orient: "DOWN",
    isAlive: false,
    size: 33,
    name: "The Fool",
    shootable: true,
    movable: true,
    shootCooldown: 0,
    invulnerable: false,
    protectCooldown: 0,
    score: 70,
    streak: 1,
    bounty: 0,
    color: 0,
  },
  {
    x: 700,
    y: 300,
    speed: 3,
    type: 1,
    uid: "gOvOWWx18Csd0vc2ABAw",
    orient: "UP",
    isAlive: true,
    size: 33,
    name: "zarenabot",
    shootable: false,
    movable: true,
    shootCooldown: 39,
    invulnerable: false,
    protectCooldown: 0,
    score: 45227,
    streak: 1,
    bounty: 0,
    color: 3,
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
