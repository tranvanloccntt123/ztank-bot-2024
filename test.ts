import { checkBulletInsideTank, checkBulletRunningToTank } from "./store";

console.log(
  checkBulletRunningToTank(
    { x: 20, y: 121, orient: 'DOWN' },
    { x: 74.97058823528424, y: 112.5, orient: 'LEFT' }
  )
);
