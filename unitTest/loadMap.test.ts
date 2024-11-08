import {
  clearLoadedMap,
  dodgeBullets,
  findRoadOnListMapIndex,
  findTargetOnMap,
  findTargetTank,
  findToDefZoneOnMap,
  listDefZone,
  mapNumber,
  myTank,
  saveBullets,
  saveMap,
  saveTanks,
} from "../store";

import { map1 } from "../map/map1";
import { map1Tmp } from "./map1Tmp";
import { map2 } from "../map/map2";
import { map3 } from "../map/map3";
import { map4 } from "../map/map4";
import { map5 } from "../map/map5";

saveTanks([
  {
    x: 675,
    y: 183,
    speed: 3,
    type: 1,
    uid: "2EmaU8jiVC3xD1OlAAHX",
    orient: "LEFT",
    isAlive: true,
    size: 33,
    name: "The Fool",
    shootable: false,
    movable: false,
    shootCooldown: 27,
    invulnerable: false,
    protectCooldown: 0,
    score: 450,
    streak: 9,
    bounty: 24,
    color: 0,
  },
  {
    x: 757,
    y: 318,
    speed: 3,
    type: 1,
    uid: "TnbghJznKGEblhMPAABF",
    orient: "UP",
    isAlive: true,
    size: 33,
    name: "zarenabot",
    shootable: false,
    movable: false,
    shootCooldown: 15,
    invulnerable: false,
    protectCooldown: 0,
    score: 5205,
    streak: 0,
    bounty: 0,
    color: 2,
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
  clearLoadedMap();
  saveMap(map1 as any);
  expect(myTank).not.toBe(null);
  const result = dodgeBullets(myTank!, 0);
  expect(result.result.length).toBe(1);
});

test("New find road", () => {
  clearLoadedMap();
  saveMap(map4 as any);
  findTargetTank();
  const onMapPositions = findTargetOnMap();
  // console.log(onMapPositions);
  expect(onMapPositions.length).toBeGreaterThanOrEqual(1);
  if (onMapPositions.length) {
    console.log(onMapPositions);
    const road = findRoadOnListMapIndex(myTank!, onMapPositions, 0);
    expect(road.length).toBeGreaterThanOrEqual(1);
  }
});

// test("Find Def Zone", () => {
//   const keys = Object.keys(listDefZone);
//   for (const key of keys) { 
//     clearLoadedMap();
//     if (key === `1`) {
//       saveMap(map1 as never);
//     }
//     if (key === `2`) {
//       saveMap(map2 as never);
//     }
//     if (key === `3`) {
//       saveMap(map3 as never);
//     }
//     if (key === `4`) {
//       saveMap(map4 as never);
//     }
//     if (key === `5`) {
//       saveMap(map5 as never);
//     }
//     console.log("RUN ON MAP ", mapNumber);
//     const listZone = listDefZone[mapNumber];
//     listZone.forEach((zone) => {
//       const onMapPositions = findToDefZoneOnMap(zone);
//       expect(onMapPositions.length).toBeGreaterThanOrEqual(1);
//     });
//   }
// });
