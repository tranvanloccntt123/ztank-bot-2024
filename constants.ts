import { initPosition } from "./utils";

export const EmitEvent = {
  Join: "join",
  Move: "move",
  Shoot: "shoot",
  User: "user",
};

export const Events = {
  User: "user",
  UserJoining: "new_enemy",
  Start: "start",
  Move: "player_move",
  Shoot: "new_bullet",
  Reborn: "new_life",
  Die: "user_die_update",
  UserUpdate: "user_update",
  UserDisconnect: "user_disconnect",
  Finish: "finish",
};

export const MY_NAME = "The Fool";

export const SERVER_1: string = "https://zarena-dev1.zinza.com.vn";

export const SERVER_2: string = "https://zarena-dev2.zinza.com.vn";

export const SERVER_3: string = "https://zarena-dev3.zinza.com.vn";

export const SERVER_4: string = "https://zarena-dev4.zinza.com.vn";

export const loginUser: string = "view";

export const loginPassword: string = "4tRWMfxCfR";

export const Token: string = "p9lcmt2v";

export const ObjectSize: number = 20;

export const TankSize: number = 33;

export const TankOnObjectPercent = TankSize / ObjectSize;

export const TankSpeed: number = 3;

export const BulletSpeed: number = 4;

export const TankTimeSpeed: number = 17; //ms

export const BulletTimeSpeed: number = 17; //ms

export const BulletSize = 3;

export const ShootAbleTime = 510;

export const ShootAreaSize = 20;

export const MapSize = {
  width: 900,
  height: 700,
};

export let isFinish = true;

export let prevPosition = initPosition(-1, -1);

export let prevOrient: Orient | null = null;

export let runTime = new Date().getTime();

export let resolveStartPromise: any = null;

export let resolveShootPromise: any = null;

export let resolveMovePromise: any = null;

export let isShootAble: boolean = true;

export let startPromise = new Promise<boolean>(
  (resolve) => (resolveStartPromise = resolve)
);

export let movePromise = new Promise<boolean>(
  (resolve) => (resolveMovePromise = resolve)
);

export let shootPromise = new Promise<boolean>(
  (resolve) => (resolveShootPromise = resolve)
);

export const resetMovePromise = () => {
  movePromise = new Promise<boolean>(
    (resolve) => (resolveMovePromise = resolve)
  );
};

export const saveIsShootAble = (_v: boolean) => (isShootAble = _v);
