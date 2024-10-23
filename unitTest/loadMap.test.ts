import { time } from "console";
import {
  bullets,
  dodgeBullets,
  myTank,
  saveBullets,
  saveMap,
  saveTanks,
} from "../store";

import { mapTest } from "./mapTest";

saveMap(mapTest as any);

saveTanks([
  {
    x: 102,
    y: 540,
    speed: 3,
    type: 1,
    uid: "I6ErD9e9_-U-X-bGAAvu",
    orient: "UP",
    isAlive: false,
    size: 33,
    name: "The Fool",
    shootable: true,
    movable: true,
    shootCooldown: 0,
    invulnerable: false,
    protectCooldown: 0,
    score: 53,
    streak: 5,
    bounty: 12,
    color: 0,
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
    x: 330,
    y: 572.5,
    orient: "LEFT",
    speed: 4,
    type: 1,
    size: 8,
    uid: "TAKAd3flPK_tuIFMAALh",
    id: 404257,
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
  console.log(result);
  expect(result.result.length).toBe(1);
});
