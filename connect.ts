import { io } from "socket.io-client";
import {
  EmitEvent,
  Events,
  MY_NAME,
  SERVER_1,
  SERVER_2,
  SERVER_3,
  TankTimeSpeed,
  Token,
} from "./constants";
import {
  saveMap,
  saveTanks,
  saveBullets,
  bullets,
  tanks,
  isReboring,
  clearIsReboring,
  myTank,
  tanksId,
  resetMovePromise,
  resolveMovePromise,
  resolveStartPromise,
  saveIsMoveAble,
  saveIsJoinning,
  resolveJoiningPromise,
  isJoinning,
  clearRoad,
  resetShootPromise,
  saveIsShootAble,
  resolveShootPromise,
  targetTankName,
  saveTargetTankName,
  saveLastMoveTime,
} from "./store";

import dotenv from "dotenv";

dotenv.config();

const socket = io(
  (process?.env?.SOCKET_SERVER ?? SERVER_3).replace("https", "wss"),
  {
    auth: {
      token: Token,
    },
    transports: ["websocket"],
    // reconnectionDelay: 500,
    // reconnection: true,
    // reconnectionDelayMax: 200,
    upgrade: false,
    autoConnect: true,
  }
);

export const joinMatch = () => {
  socket.emit(EmitEvent.Join);
  saveIsJoinning(true);
};

export const shoot = () => {
  resetShootPromise();
  saveIsShootAble(false);
  socket.emit(EmitEvent.Shoot);
};

export const moveTank = (orient: Orient) => {
  resetMovePromise();
  saveIsMoveAble(false);
  setTimeout(() => {
    resolveMovePromise(true);
    saveIsMoveAble(true);
  }, TankTimeSpeed);
  socket.emit(EmitEvent.Move, { orient });
};

socket.on(Events.Start, () => {
  resolveStartPromise(true);
});

socket.on(
  Events.User,
  (data: { map: MapMatch; tanks: Array<Tank>; bullets: Array<Bullet> }) => {
    saveMap(data.map);
    saveTanks(data.tanks);
    saveBullets(
      data.bullets.map((bullet) => ({ ...bullet, time: new Date().getTime() }))
    );
    resolveJoiningPromise(true);
  }
);

socket.on(Events.UserJoining, (data: { tank: Tank; tanks: Array<Tank> }) => {
  saveTanks(data.tanks);
  saveTanks([data.tank]);
});

socket.on(Events.Reborn, (data: Tank) => {
  saveTanks([data]);
});

socket.on(Events.Move, (data: Tank) => {
  if (data.name === MY_NAME && (data.x !== myTank?.x || data.y !== myTank?.y)) {
    saveLastMoveTime(new Date().getTime());
  }
  saveTanks([data]);
});

socket.on(
  Events.Die,
  (data: {
    killer: Tank;
    killed: Tank;
    bullet: Bullet;
    tanks: Array<Tank>;
  }) => {
    saveTanks([...data.tanks, data?.killer]);
    isReboring(data?.killed?.name);
    setTimeout(() => {
      clearIsReboring(data?.killed?.name);
    }, 2800);
    if (data.killed?.name === MY_NAME) {
      // console.log(bullets)
      // console.log(data.killed);
      // console.log(data.bullet);
      clearRoad();
      saveTargetTankName("");
    }
    if (data.killed?.name === targetTankName) {
      saveTargetTankName("");
      clearRoad();
    }
    if (data.bullet) {
      bullets.delete(data.bullet?.id);
    }
  }
);

socket.on(Events.Shoot, (data: Bullet) => {
  const name = tanksId.get(data.uid);
  // console.log(data);
  const tank = tanks.get(name ?? "");
  if (tank) {
    saveTanks([{ ...tank, x: data.x, y: data.y }]);
  }
  saveBullets([{ ...data, time: new Date().getTime() }]);
  if (data.uid === myTank?.uid) {
    resolveShootPromise(true);
    saveIsShootAble(true);
  }
});

socket.on(Events.UserDisconnect, (data: string) => {
  if (!myTank) {
    joinMatch();
  } else {
    if (data === myTank?.uid) {
      console.log("USER DISCONNECT");
      joinMatch();
    }
  }
});

socket.on(Events.Finish, () => {
  console.log("FINISHED");
});

export default socket;
