import { Skill_Plain } from "../src/api/skill/content-types/skill/skill";
import { CharacterFull, SkillVars } from "./BattleManager";

export const RegisterSkillFunctions = (character: CharacterFull) => {
    character.TakeDamage = TakeDamage.bind(character);
    character.Heal = Heal.bind(character);
    InitSkillVars(character);
}

const TakeDamage = function(this:CharacterFull, amount:number){
    this.health -= amount;
}

const Heal = function(this:CharacterFull, amount:number){
    this.health = this.health + amount > 100 ? 100 : this.health + amount;
}

const InitSkillVars = (character:CharacterFull) => {
    character.skillVars = [];
    for (let index = 0; index < character.skills.length; index++) {
        const skill = character.skills[index];
        let skillVar:SkillVars = {
            currentCooldown:skill.cooldown,
            currentDuration:skill.mechanic[0].duration
        };
        character.skillVars[index] = skillVar;
    }
}

export const CanUseSkill = (character: CharacterFull, skill:Skill_Plain, skillVar:SkillVars) => {
    console.log("trying use skill %d of %d", skillVar.currentCooldown, skill.cooldown)
    return (skill.manaCost <= character.mana 
    // && skillVar.currentDuration > 0
    && skillVar.currentCooldown === skill.cooldown);
}

export const UpdateSkillVars = (skill:Skill_Plain, skillVar:SkillVars) => {
    if(skillVar.currentCooldown < skill.cooldown && skillVar.currentCooldown > 0)
    {
        skillVar.currentCooldown -= 1;
    }
    else if(skillVar.currentCooldown <= 0)
    {
        skillVar.currentCooldown = skill.cooldown;
    }
}

export const UpdateAllSkills = (character:CharacterFull, ignoreSlot = -1) => {
    for (let index = 0; index < character.skills.length; index++) 
    {
        if(index === ignoreSlot)
        {
            continue;
        }
        let skill:Skill_Plain = character.skills[index];
        let vars:SkillVars = character.skillVars[index];
        UpdateSkillVars(skill, vars);
    }
}