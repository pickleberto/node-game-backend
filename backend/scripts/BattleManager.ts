import { Socket } from "socket.io";
import { Character_Plain } from "../src/api/character/content-types/character/character";
import { User_Plain } from "../src/common/schemas-to-ts/User";

export type QueuePlayer = {
    userId:number,
    characterId:number,
    socket: Socket
}

type BattlePlayer = {
    id:number,
    username:string,
    socket:Socket,
    character:Character_Plain
}

class Battle{
    player1:BattlePlayer;
    player2:BattlePlayer;

    constructor(player1:BattlePlayer, player2:BattlePlayer){
        this.player1 = player1;
        this.player2 = player2;
    }
}


let queue: QueuePlayer[] = []

async function QueryPlayer(player:QueuePlayer){
    const playerFromStrapi:User_Plain = await strapi.db.query("plugin::users-permissions.user")
    .findOne({where:{id:player.userId}});

    const playerCharacter = await strapi.entityService.findOne("api::character.character",
     player.characterId, {}) as Character_Plain;

    const bPlayer:BattlePlayer = {
        id:player.userId,
        username:playerFromStrapi.username,
        socket:player.socket,
        character:playerCharacter,
    }

    return bPlayer;
}

export const addToQueue = async (player:QueuePlayer) => {
    if(queue.length > 0) {
        const player1 = await QueryPlayer(player);
        const opponent = queue.shift();
        const player2 = await QueryPlayer(opponent);
        const battle = new Battle(player1, player2);
        
        console.log("----------Battle:")
        console.log(player1.username, player1.character.name);
        console.log("-----VS-----");
        console.log(player2.username, player2.character.name);
    } else {
        queue.push(player);
    }
}
