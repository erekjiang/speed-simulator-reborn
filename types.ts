
export enum PetRarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary'
}

export type PetMutation = 'Normal' | 'Shiny' | 'Gold' | 'Rainbow' | 'Dark Matter' | 'Speedy' | 'Jumpy' | 'Deadly' | 'Tanky';

export interface Pet {
  id: string;
  name: string;
  multiplier: number; // Generic multiplier
  rarity: PetRarity;
  cost: number;
  description: string;
  mutation?: PetMutation;
  
  // Specific Stat Multipliers
  speedMult?: number;
  jumpMult?: number;
  attackMult?: number;
  healthMult?: number;
  thornMult?: number;
}

export interface Skin {
  id: string;
  name: string;
  color: string;
  costType: 'speed' | 'jump' | 'attack' | 'health' | 'thorn' | 'all';
  cost: number;
  speedMult: number;
  jumpMult: number;
  attackMult: number; 
  healthMult?: number; 
  thornMult?: number;
  luckMult?: number; 
  description: string;
}

export interface PlayerState {
  speed: number;
  jump: number;
  attack: number; 
  maxHealth: number; 
  health: number; 
  thorn: number;
  rebirths: number;
  pets: Pet[];
  unlockedSkins: string[];
  equippedSkin: string;
  world: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isGrounded: boolean;
  checkpoint: { x: number; y: number };
  collectedIds: string[];
  teleportId: number;
  
  // Quest System
  questIndex: number; // Which quest in the list are we on?
  questProgress: number; // Current progress count
}

export type PlatformType = 'ground' | 'portal' | 'finish' | 'hazard' | 'checkpoint';

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  world: number;
  type?: PlatformType; 
  portalTarget?: { world: number, x: number, y: number };
  portalReq?: number; 
  portalName?: string;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  radius: number;
  value: number;
  color: string;
  world: number;
}

export type RewardType = 'speed' | 'jump' | 'attack' | 'health' | 'thorn' | 'random';

export interface EnemyDef {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  maxHp: number;
  damage: number; 
  reward: number;
  rewardType: RewardType;
  petDropChance?: number; // 0-1 chance to drop a pet
  world: number;
  color: string;
  isBoss?: boolean;
}

export type QuestType = 'train_speed' | 'train_jump' | 'train_attack' | 'train_health' | 'train_thorn' | 'kill_enemy' | 'buy_pet' | 'rebirth' | 'finish_obby';

export interface Quest {
    id: number;
    name: string;
    description: string;
    type: QuestType;
    target: number;
    rewardAmount: number;
    rewardType: RewardType;
}

export interface GameConfig {
  gravity: number;
  jumpForce: number;
  moveSpeedBase: number;
  friction: number;
}