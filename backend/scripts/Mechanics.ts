import { CharacterFull } from "./BattleManager";

export const RegisterSkillFunctions = (character: CharacterFull) => {
    character.TakeDamage = TakeDamage.bind(character);
    character.Heal = Heal.bind(character);
}

const TakeDamage = function(this:CharacterFull, amount:number){
    this.health -= amount;
}

const Heal = function(this:CharacterFull, amount:number){
    this.health = this.health + amount > 100 ? 100 : this.health + amount;
}