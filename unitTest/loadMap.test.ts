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

saveMap(map1 as any);

saveTanks([
  {
    x: 20,
    y: 20,
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
  // console.log(onMapPositions);
  expect(onMapPositions.length).toBeGreaterThanOrEqual(1);
  // if (onMapPositions.length) {
  //   const road = findRoadOnListMapIndex(myTank!, onMapPositions, 0);
  //   expect(road.length).toBeGreaterThanOrEqual(1);
  // }
});

test("Check Map", () => {
  expect(map1.toString() === map1Tmp.toString()).toBe(true);
});

test("Find Def Zone", () => {
  const keys = Object.keys(listDefZone);
  for (const key of keys) {
    clearLoadedMap();
    if (key === `1`) {
      saveMap(map1 as never);
    }
    if (key === `2`) {
      saveMap(map2 as never);
    }
    if (key === `3`) {
      saveMap(map3 as never);
    }
    if (key === `4`) {
      saveMap(map4 as never);
    }
    if (key === `5`) {
      saveMap(map5 as never);
    }
    console.log("RUN ON MAP ", mapNumber);
    const listZone = listDefZone[mapNumber];
      listZone.forEach(zone => {
        const onMapPositions = findToDefZoneOnMap(zone);
        expect(onMapPositions.length).toBeGreaterThanOrEqual(1);
      })
  }
})