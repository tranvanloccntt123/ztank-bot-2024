import {
  bullets,
  dodgeBullets,
  findRoadToPosition,
  findRoadToTarget,
  findTargetOnMap,
  findTargetTank,
  myTank,
  saveBullets,
  saveMap,
  saveTanks,
} from "../store";

import { mapTest } from "./mapTest";

saveMap(mapTest as any);

saveTanks([
  {
    x: 320,
    y: 481,
    speed: 3,
    type: 1,
    uid: "q00dtJ1HlyOhBjAVAAVn",
    orient: "RIGHT",
    isAlive: true,
    size: 33,
    name: "The Fool",
    shootable: true,
    movable: false,
    shootCooldown: 0,
    invulnerable: false,
    protectCooldown: 0,
    score: 0,
    streak: 0,
    bounty: 0,
    color: 1,
  },
  {
    x: 351,
    y: 58,
    speed: 3,
    type: 1,
    uid: "TAKAd3flPK_tuIFMAALh",
    orient: "RIGHT",
    isAlive: true,
    size: 33,
    name: "zarenabot",
    shootable: false,
    movable: false,
    shootCooldown: 37,
    invulnerable: false,
    protectCooldown: 0,
    score: 903,
    streak: 1,
    bounty: 0,
    color: 1,
  },
]);

saveBullets([
  {
    x: 800,
    y: 100,
    orient: "UP",
    speed: 4,
    type: 1,
    size: 8,
    uid: "yVATgaV9tvd5WjhDAAAF",
    id: 27231,
    time: new Date().getTime(),
  },
] as any);

test("Dodge", () => {
  expect(myTank).not.toBe(null);
  const result = dodgeBullets(
    {
      x: myTank!.x,
      y: myTank!.y,
      orient: myTank!.orient,
    },
    Array.from(bullets.values()),
    0
  );
  expect(result.result.length).toBe(1);
});
//{ x: 34, y: 4 }
test("Find road", () => {
  const result = findTargetOnMap();

  expect(result.length).toBeGreaterThanOrEqual(1);

  const road = findRoadToPosition({ x: 16, y: 25 });

  console.log(road);

  expect(road.length).toBeGreaterThanOrEqual(1);
});
