import { Socket } from "socket.io";
import { Character_Plain } from "../src/api/character/content-types/character/character";
import { User_Plain } from "../src/common/schemas-to-ts/User";
import { BlockList } from "./BlockList";
import { Targeting } from "../src/components/mechanic/interfaces/Mechanic";
import { CanUseSkill, ManaRegeneration, RegisterSkillFunctions, UpdateAllSkills } from "./Mechanics";

export type QueuePlayer = {
    userId:number,
    characterId:number,
    socket: Socket
}

export type CharacterFull = Character_Plain & {
    TakeDamage: (amount:number) => void,
    Heal:(amount:number) => void,
    currentHealth:number,
    currentMana:number,
    skillVars:SkillVars[]
}

export type SkillVars = {
    currentCooldown:number,
    currentDuration:number
}

type BattlePlayer = {
    id:number,
    username:string,
    socket:Socket,
    character:CharacterFull,
    turnData:TurnData,
    inactivityCount:number,
    wins:number,
    losses:number
}

type TurnData = {
    skillSlot:number
}


export let SocketToBattleMap = new Map<Socket, Battle>();
let queue: QueuePlayer[] = []

const INACTIVITY_MAX_TURNS = 12;

class Battle{
    player1:BattlePlayer;
    player2:BattlePlayer;
    endBattle:boolean;
    turnCount:number;
    ScheduleNextTurn;

    constructor(player1:BattlePlayer, player2:BattlePlayer){
        this.player1 = player1;
        this.player2 = player2;
    }

    Start(){
        console.log("Starting battle");
        this.turnCount = 0;
        this.endBattle = false;
        
        //send the start event to both player clients
        this.player1.socket.emit("startbattle",{
            "left": JSON.stringify(this.player1, BlockList),
            "right": JSON.stringify(this.player2, BlockList),
            "turnTime": TURN_TIME_S,
            "turnCount": this.turnCount

        });

        this.player2.socket.emit("startbattle",{
            "left": JSON.stringify(this.player2, BlockList),
            "right": JSON.stringify(this.player1, BlockList),
            "turnTime": TURN_TIME_S,
            "turnCount": this.turnCount
        });
    }

    ProccessTurn(){
        if(this.endBattle) return;
        
        console.log("proccessing turn");

        ProccessPlayerTurn(this.player1, this.player2);
        this.player1.turnData = undefined;

        ProccessPlayerTurn(this.player2, this.player1);
        this.player2.turnData = undefined;
        
        // reload mana
        ManaRegeneration(this.player1.character);
        ManaRegeneration(this.player2.character);
        
        console.debug("inactivity: %d, %d", this.player1.inactivityCount, this.player2.inactivityCount);

        if(this.player1.inactivityCount > INACTIVITY_MAX_TURNS || this.player2.inactivityCount > INACTIVITY_MAX_TURNS)
        {
            this.endBattle = true;
            console.log("Battle ended, player inactive");
        }

        if(this.player1.character.health <= 0 || this.player2.character.health <= 0)
        {
            this.endBattle = true;
            console.log("Battle ended, character is dead");
        }

        if(this.endBattle)
        {
            console.log("Battle finished");
            HandleResult(this.player1);
            HandleResult(this.player2);
        }
        else
        {
            console.log("turn %d done!", this.turnCount);
            this.turnCount += 1;

            this.player1.socket.emit("turnResult", {
                "left": JSON.stringify(this.player1, BlockList),
                "right": JSON.stringify(this.player2, BlockList),
                "turnTime": TURN_TIME_S,
                "turnCount": this.turnCount
            });
            
            this.player2.socket.emit("turnResult", {
                "left": JSON.stringify(this.player2, BlockList),
                "right": JSON.stringify(this.player1, BlockList),
                "turnTime": TURN_TIME_S,
                "turnCount": this.turnCount
            });            
        }
        
    }

    ReceiveTurn(mySocket:Socket, turnData:TurnData){

        if(mySocket === this.player1.socket)
        {
            this.player1.turnData = turnData;
        } 
        else 
        {
            this.player2.turnData = turnData;
        }
    }
}
const TURN_TIME_S = 10;
const ScheduleNextTurn = function(this:Battle){
    this.ProccessTurn();
    if(!this.endBattle)
    {
        setTimeout(this.ScheduleNextTurn, TURN_TIME_S * 1000);
    }
}

const ProccessPlayerTurn = function(me:BattlePlayer, opponent:BattlePlayer)
{
    if(me.turnData === undefined) 
    {
        console.log("no turn to proccess");
        UpdateAllSkills(me.character);
        me.inactivityCount += 1;
        return;
    }

    const skillToUse = me.character.skills[me.turnData.skillSlot];
    const skillVar = me.character.skillVars[me.turnData.skillSlot];
    if(skillToUse === undefined || skillVar === undefined)
    {
        console.debug("skill (slot :", me.turnData.skillSlot, ") is undefined ");
        UpdateAllSkills(me.character);
        me.inactivityCount += 1;
        return;
    }

    me.inactivityCount = 0;

    if(CanUseSkill(me.character, skillToUse, skillVar)) 
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
        // skillVar.currentDuration -= 1;
        skillVar.currentCooldown -= 1;
        UpdateAllSkills(me.character, me.turnData.skillSlot);
    }
    else
    {
        UpdateAllSkills(me.character);
    }
    
    console.log("turn proccessed");
}

const HandleResult = function(player:BattlePlayer)
{
    let playerLose = (player.character.health <= 0) || (player.inactivityCount > INACTIVITY_MAX_TURNS);
    let battleResult = playerLose ? "lose" : "win";
    
    const updateWins = playerLose ? player.wins : player.wins + 1;
    const updateLosses = playerLose ? player.losses + 1 : player.losses;
    
    strapi.entityService.update("plugin::users-permissions.user", player.id, { data:{wins:updateWins, losses:updateLosses} });

    player.socket.emit("battleResult", { "battleResult": battleResult, "userWins":updateWins, "userLosses":updateLosses });
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
        turnData:undefined,
        inactivityCount:0,
        wins:playerFromStrapi["wins"],
        losses:playerFromStrapi["losses"]
    }

    return bPlayer;
}

const QUEUE_TIMEOUT = 10 * 1000;
export const addToQueue = async (player:QueuePlayer) => {
    if(queue.length > 0) 
    {
        const opponents = queue.filter((p)=>p.userId!=player.userId)
        const opponent = opponents.shift();
        if(opponent === undefined)
        {
            return;
        }

        const index = queue.indexOf(opponent);
        if(index < 0)
        {
            return;
        }
        queue.splice(index, 1);

        const player1 = await QueryPlayer(player);
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
        battle.ScheduleNextTurn = ScheduleNextTurn.bind(battle);
        battle.ScheduleNextTurn();
    } else {
        queue.push(player);
        setTimeout(() => {
            const index = queue.indexOf(player);
            if(index < 0) return;
            
            queue.splice(index, 1);
            console.debug("player %d removed from queue", player.userId);
            player.socket.emit("noMatch", "No matches found");
        }, QUEUE_TIMEOUT);
    }
}
