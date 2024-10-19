
import {
  bullets,
  dodgeBullets,
  findRoadToTarget,
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
    x: 356,
    y: 313,
    speed: 3,
    type: 1,
    uid: "WCtVAOVrQnI2CxjIAAE4",
    orient: "LEFT",
    isAlive: true,
    size: 33,
    name: "thoixong!",
    shootable: false,
    // movable: false,
    shootCooldown: 43,
    invulnerable: false,
    protectCooldown: 0,
    score: 235,
    streak: 2,
    bounty: 3,
    color: 0,
  },
  {
    x: 800,
    y: 21,
    speed: 3,
    type: 1,
    uid: "zMmEAyVC-_MOx8p_AAFY",
    orient: "UP",
    isAlive: true,
    size: 33,
    name: "The Fool",
    shootable: true,
    // moveable: true,
    shootCooldown: 0,
    invulnerable: false,
    protectCooldown: 0,
    score: 0,
    streak: 0,
    bounty: 0,
    color: 0,
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
  expect(result.result.length).toBeGreaterThan(1);
});

test("Find road", () => {
  findTargetTank();
  const result = findRoadToTarget(
    {
      x: myTank!.x,
      y: myTank!.y,
      orient: myTank!.orient,
    },
    0
  );

  console.log(result);

  expect(result.length).toBeGreaterThan(1);
});
