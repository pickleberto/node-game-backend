// Interface automatically generated by schemas-to-ts

import { Damaging } from '../../damaging/interfaces/Damaging';
import { Healing } from '../../healing/interfaces/Healing';
import { Damaging_Plain } from '../../damaging/interfaces/Damaging';
import { Healing_Plain } from '../../healing/interfaces/Healing';
import { Damaging_NoRelations } from '../../damaging/interfaces/Damaging';
import { Healing_NoRelations } from '../../healing/interfaces/Healing';

export enum Targeting {
  Single = 'Single',
  AoE = 'AoE',}

export interface Mechanic {
  targeting?: Targeting;
  duration?: number;
  damage?: Damaging;
  healing?: Healing;
}
export interface Mechanic_Plain {
  targeting?: Targeting;
  duration?: number;
  damage?: Damaging_Plain;
  healing?: Healing_Plain;
}

export interface Mechanic_NoRelations {
  targeting?: Targeting;
  duration?: number;
  damage?: Damaging_NoRelations;
  healing?: Healing_NoRelations;
}

