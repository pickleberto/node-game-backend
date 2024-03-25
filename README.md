# node-game-backend
Online repo for the nodejs backend with Unity frontend course.

This is the backend for a game.

Using strapi api you can create users and login.
Using a socketio connection you can search for battles, send turns(battle) and keep track of your battle history.

On top of the course proof of concept, this project has some additional features:

* proccessing turns periodically;
* updating cooldowns;
* mana regeneration per turn; 
* battle result;
* send turn duration to clients;
* inactivity count as a lose condition;
* avoid battle against self;
* match making queue timeout;
* save battle results;
* send user history after battle;
* keep track of turn count;
