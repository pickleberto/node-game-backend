import { Strapi } from '@strapi/strapi';
import socketio from 'socket.io';
import jwt from 'jsonwebtoken';

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
        
        const myJwt = data.jwt;
        const charId = data.characterId;
        const jwtSecret = process.env.JWT_SECRET;

        const decoded = jwt.verify(myJwt, jwtSecret) as jwt.JwtPayload;
        const userId = decoded.id;

        // add into the matchmaking queue
      });

      socket.on('sendTurn', (data)=>{
        console.log('send TURN!');
      })

    })
  },
};
