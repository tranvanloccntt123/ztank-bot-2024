type Orient = "UP" | "DOWN" | "LEFT" | "RIGHT";

type Tank = {
  x: number;
  y: number;
  speed: number;
  type: number;
  uid: string;
  orient: Orient;
  isAlive: boolean;
  size: number;
  name: string;
  shootable: boolean;
  shootCooldown: number;
  invulnerable: boolean;
  protectCooldown: number;
  score: number;
  streak: number;
  bounty: number;
  color: number;
  movable: boolean;
};

type Bullet = {
  x: number;
  y: number;
  orient: Orient;
  speed: number;
  type: number;
  size: number;
  uid: string;
  id: number;
  time: number;
};

type MapMatch = Array<Array<"B" | "T" | "W" | null>>;

type Position = { x: number; y: number };

type MoveState = {
  postion: Position;
  orient: Orient;
};

type MapIndex = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}