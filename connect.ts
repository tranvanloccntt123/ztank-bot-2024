import { io } from "socket.io-client";
import {
  EmitEvent,
  Events,
  MY_NAME,
  SERVER_1,
  SERVER_2,
  SERVER_3,
  SERVER_4,
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
  dodgeRoad,
  dodgeRoadChecked,
} from "./store";

const socket = io(process?.env?.SOCKET_SERVER ?? SERVER_3, {
  auth: {
    token: Token,
  },
});

export const joinMatch = () => socket.emit(EmitEvent.Join);

export const shoot = () => {
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

socket.on(
  Events.User,
  (data: { map: MapMatch; tanks: Array<Tank>; bullets: Array<Bullet> }) => {
    saveMap(data.map);
    saveTanks(data.tanks);
    saveBullets(
      data.bullets.map((bullet) => ({ ...bullet, time: new Date().getTime() }))
    );
    resolveStartPromise(true);
    //run main it's here
  }
);

socket.on(Events.UserJoining, (data: { tank: Tank; tanks: Array<Tank> }) => {
  saveTanks(data.tanks);
  saveTanks([data.tank]);
});

socket.on(Events.Reborn, (data: Tank) => {
  saveTanks([data]);
  if (data.name === MY_NAME) {
    moveTank("DOWN");
  }
});

socket.on(Events.Move, (data: Tank) => {
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
    tanks.delete(data?.killed?.name);
    saveTanks([...data.tanks, data?.killer]);
    if (data.bullet) {
      bullets.delete(data.bullet?.id);
    }
    isReboring(data?.killed?.name);
    setTimeout(() => {
      clearIsReboring(data?.killed?.name);
    }, 2800);
    if (data.killed?.name === MY_NAME) {
      console.log(dodgeRoad);
      console.log(dodgeRoadChecked);
      console.log("KILLED", data.bullet);
      console.log("LOCAL", myTank);
      // console.log("SOCKET", data.killed);
    }
    // saveTanks([data.killer]);
  }
);

socket.on(Events.Shoot, (data: Bullet) => {
  const name = tanksId.get(data.uid);
  const tank = tanks.get(name ?? "");
  if (tank) {
    saveTanks([{ ...tank, x: data.x, y: data.y }]);
  }
  saveBullets([{ ...data, time: new Date().getTime() }]);
});

socket.on(Events.UserDisconnect, (data: string) => {
  //
  joinMatch();
});

socket.on(Events.Finish, () => {
  console.log("FINISHED");
});

export default socket;
