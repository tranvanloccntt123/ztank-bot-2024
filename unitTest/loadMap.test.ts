import {
  bullets,
  dodgeBullets,
  findRoadOnListMapIndex,
  findRoadToReady,
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
    x: 522,
    y: 600,
    speed: 3,
    type: 1,
    uid: "9WTn1GyRD_D3NWm9AB8F",
    orient: "UP",
    isAlive: true,
    size: 33,
    name: "The Fool",
    shootable: false,
    movable: true,
    shootCooldown: 52,
    invulnerable: false,
    protectCooldown: 0,
    score: 172,
    streak: 16,
    bounty: 45,
    color: 0,
  },
  {
    x: 376,
    y: 580,
    speed: 3,
    type: 1,
    uid: "gOvOWWx18Csd0vc2ABAw",
    orient: "RIGHT",
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
    x: 600,
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
  expect(result.result.length).toBe(1);
});

test("New find road", () => {
  findTargetTank();
  const readyLine = findRoadToReady(myTank!, 0);
  const onMapPositions = findTargetOnMap();
  // console.log(onMapPositions);
  expect(onMapPositions.length).toBeGreaterThanOrEqual(1);
  if (onMapPositions.length) {
    const road = findRoadOnListMapIndex(myTank!, onMapPositions, 0);
    expect(road.length).toBeGreaterThan(1);
  }
});
