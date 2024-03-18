import type { Schema, Attribute } from '@strapi/strapi';

export interface DamagingDamaging extends Schema.Component {
  collectionName: 'components_damaging_damagings';
  info: {
    displayName: 'damaging';
    icon: 'chartBubble';
  };
  attributes: {
    dmgAmount: Attribute.Integer;
    ignoresInvulnerability: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface HealingHealing extends Schema.Component {
  collectionName: 'components_healing_healings';
  info: {
    displayName: 'healing';
    icon: 'heart';
  };
  attributes: {
    healAmount: Attribute.Integer;
  };
}

export interface MechanicMechanic extends Schema.Component {
  collectionName: 'components_mechanic_mechanics';
  info: {
    displayName: 'mechanic';
    icon: 'cog';
    description: '';
  };
  attributes: {
    targeting: Attribute.Enumeration<['Single', 'AoE']>;
    duration: Attribute.Integer;
    damage: Attribute.Component<'damaging.damaging'>;
    healing: Attribute.Component<'healing.healing'>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'damaging.damaging': DamagingDamaging;
      'healing.healing': HealingHealing;
      'mechanic.mechanic': MechanicMechanic;
    }
  }
}
