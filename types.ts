export enum PetRarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary'
}

export interface Pet {
  id: string;
  name: string;
  multiplier: number;
  rarity: PetRarity;
  cost: number;
  description: string;
}

export interface PlayerState {
  speed: number;
  jump: number; // New stat for jump height
  rebirths: number;
  pets: Pet[];
  world: number; // 1 = Hub, 2 = Cyber, 3 = Magma
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isGrounded: boolean;
  checkpoint: { x: number; y: number };
  collectedIds: string[];
  teleportId: number; // Used to signal a forced position reset
}

export type PlatformType = 'ground' | 'portal' | 'finish' | 'hazard';

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  world: number;
  type?: PlatformType; 
  // Portal properties
  portalTarget?: { world: number, x: number, y: number };
  portalReq?: number; // Speed required to enter
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

export interface GameConfig {
  gravity: number;
  jumpForce: number;
  moveSpeedBase: number;
  friction: number;
}