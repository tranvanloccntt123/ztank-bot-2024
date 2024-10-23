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

export const BulletSize = 8;

export const ShootAbleTime = 1020;

export const ShootAreaSize = 20;

export const ShootArea = 33 / 3 * 17 - 3;

export const MapSize = {
  width: 900,
  height: 700,
};
