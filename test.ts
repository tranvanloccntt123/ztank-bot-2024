import { checkBulletInsideTank, checkBulletRunningToTank } from "./store";

console.log(
  checkBulletRunningToTank(
    { x: 447, y: 566, orient: "LEFT" },
    { id: 191677, orient: "UP", x: 483.5, y: 181.02941176468565 }
  )
);

console.log(
  checkBulletRunningToTank(
    { x: 447, y: 566, orient: "LEFT" },
    { id: 191678, orient: "DOWN", x: 484.5, y: 549.0294117647213 }
  )
);

console.log(
  checkBulletRunningToTank(
    { x: 447, y: 566, orient: "LEFT" },
    { id: 191679, orient: "UP", x: 130.5, y: 98.8529411764533 }
  )
);

console.log(
  checkBulletRunningToTank(
    { x: 447, y: 566, orient: "LEFT" },
    { id: 191680, orient: "UP", x: 130.5, y: 340.0294117646993 }
  )
);

console.log(
  checkBulletRunningToTank(
    { x: 447, y: 566, orient: "LEFT" },
    { id: 191681, orient: "LEFT", x: 316.85294117646623, y: 32.5 }
  )
);
