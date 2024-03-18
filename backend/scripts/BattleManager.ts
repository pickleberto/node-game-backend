import { Socket } from "socket.io";
import { Character_Plain } from "../src/api/character/content-types/character/character";
import { User_Plain } from "../src/common/schemas-to-ts/User";
import { BlockList } from "./BlockList";
import { Targeting } from "../src/components/mechanic/interfaces/Mechanic";
import { RegisterSkillFunctions } from "./Mechanics";

export type QueuePlayer = {
    userId:number,
    characterId:number,
    socket: Socket
}

export type CharacterFull = Character_Plain & {
    TakeDamage: (amount:number) => void,
    Heal:(amount:number) => void
}

type BattlePlayer = {
    id:number,
    username:string,
    socket:Socket,
    character:CharacterFull
}

type TurnData = {
    skillSlot:number
}


export let SocketToBattleMap = new Map<Socket, Battle>();
let queue: QueuePlayer[] = []

class Battle{
    player1:BattlePlayer;
    player2:BattlePlayer;

    constructor(player1:BattlePlayer, player2:BattlePlayer){
        this.player1 = player1;
        this.player2 = player2;
    }

    Start(){
        console.log("Starting battle");
        //send the start event to both player clients
        this.player1.socket.emit("startbattle",{
            "left": JSON.stringify(this.player1, BlockList),
            "right": JSON.stringify(this.player2, BlockList)
        });

        this.player2.socket.emit("startbattle",{
            "left": JSON.stringify(this.player2, BlockList),
            "right": JSON.stringify(this.player1, BlockList)
        });
    }

    doTurn(mySocket:Socket, turnData:TurnData){
        const me = mySocket === this.player1.socket ? this.player1 : this.player2;
        const opponent = mySocket === this.player1.socket ? this.player2 : this.player1;

        const skillToUse = me.character.skills[turnData.skillSlot];

        if(skillToUse === undefined)
        {
            console.log("skill (slot :", turnData.skillSlot, ") is undefined ");
            return;
        }

        if(skillToUse.manaCost <= me.character.mana) 
        {
            skillToUse.mechanic.forEach(mechanic => {
                
                if(mechanic.damage)
                {
                    switch(mechanic.targeting)
                    {
                        case Targeting.AoE:
                            break;
                        case Targeting.Single:
                            opponent.character.TakeDamage(mechanic.damage.dmgAmount);
                            break;
                        default:
                            break;
                    }
                }

                if(mechanic.healing)
                {
                    me.character.Heal(mechanic.healing.healAmount);
                }
            });
            
            me.character.mana -= skillToUse.manaCost;
        }            
                        
        me.socket.emit("turnResult", {
            "left": JSON.stringify(me, BlockList),
            "right": JSON.stringify(opponent, BlockList)
        });

        opponent.socket.emit("turnResult", {
            "left": JSON.stringify(opponent, BlockList),
            "right": JSON.stringify(me, BlockList)
        });

        console.log("turn done!");
    }
}

async function QueryPlayer(player:QueuePlayer){
    const playerFromStrapi:User_Plain = await strapi.db.query("plugin::users-permissions.user")
    .findOne({where:{id:player.userId}});

    const playerCharacter = await strapi.entityService.findOne("api::character.character",
     player.characterId, { 
        populate:["skills", "skills.mechanic", "skills.mechanic.damage", "skills.mechanic.healing"] 
    }) as Character_Plain;

    const bPlayer:BattlePlayer = {
        id:player.userId,
        username:playerFromStrapi.username,
        socket:player.socket,
        character:playerCharacter as CharacterFull,
    }

    return bPlayer;
}

export const addToQueue = async (player:QueuePlayer) => {
    if(queue.length > 0) {
        const player1 = await QueryPlayer(player);
        const opponent = queue.shift();
        const player2 = await QueryPlayer(opponent);
        const battle = new Battle(player1, player2);
        
        RegisterSkillFunctions(player1.character);
        RegisterSkillFunctions(player2.character);

        SocketToBattleMap.set(player.socket, battle);
        SocketToBattleMap.set(opponent.socket, battle);
        
        console.log("----------Battle:")
        console.log(player1.username, player1.character.name);
        console.log("-----VS-----");
        console.log(player2.username, player2.character.name);
        
        battle.Start();
    } else {
        queue.push(player);
    }
}
