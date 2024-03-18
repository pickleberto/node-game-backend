import { Strapi } from '@strapi/strapi';
import socketio from 'socket.io';
import jwt from 'jsonwebtoken';
import { QueuePlayer, SocketToBattleMap, addToQueue } from "../scripts/BattleManager";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    const _strapi = strapi as Strapi;
    const io = new socketio.Server(_strapi.server.httpServer);
    
    io.on('connection', (socket)=>{
      console.log("a user connect");
      
      socket.on('searchBattle', (data)=>{
        console.log('Search battle!');
        
        try {
          const myJwt = data.jwt;
          const charId = data.characterId;
          const jwtSecret = process.env.JWT_SECRET;
          const decoded = jwt.verify(myJwt, jwtSecret) as jwt.JwtPayload;
          const userId = decoded.id;
          const playerObjectForQueue:QueuePlayer = {
            userId: userId,
            characterId: charId,
            socket:socket
          }
          
          // add into the matchmaking queue
          addToQueue(playerObjectForQueue);

        } catch (error) {
          console.log(error);          
        }
      });

      socket.on('sendTurn', (data)=>{
        console.log('send TURN!');
        console.log('turn received: ', data);
        const myBattle = SocketToBattleMap.get(socket);
        myBattle.doTurn(socket,data);
      })

    })
  },
};
