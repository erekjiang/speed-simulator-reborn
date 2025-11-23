import { GameConfig, Platform, Pet, PetRarity, Collectible } from './types';

export const CONFIG: GameConfig = {
  gravity: 0.6,
  jumpForce: -12,
  moveSpeedBase: 5,
  friction: 0.85,
};

export const REBIRTH_COST_BASE = 1000;

export const AVAILABLE_PETS: Pet[] = [
  { id: 'dog', name: 'Basic Doggy', multiplier: 2, rarity: PetRarity.COMMON, cost: 500, description: "A loyal friend." },
  { id: 'cat', name: 'Speedy Cat', multiplier: 5, rarity: PetRarity.RARE, cost: 2500, description: "Zooms around at 3am." },
  { id: 'bunny', name: 'Hyper Bunny', multiplier: 10, rarity: PetRarity.EPIC, cost: 8000, description: "Never stops hopping." },
  { id: 'dragon', name: 'Inferno Dragon', multiplier: 25, rarity: PetRarity.EPIC, cost: 25000, description: "Breaths fire and speed." },
  { id: 'void', name: 'Void Walker', multiplier: 100, rarity: PetRarity.LEGENDARY, cost: 150000, description: "Existence is merely a suggestion." },
];

// --- PLATFORMS ---

// World 1: The Hub
// A large central area with portals and some parkour for collectibles
const HUB_PLATFORMS: Platform[] = [
  // Main Floor
  { x: -1000, y: 600, width: 2000, height: 100, color: '#4ade80', world: 1, type: 'ground' },
  
  // Left Side: Magma Portal Area
  { x: -900, y: 500, width: 200, height: 20, color: '#7f1d1d', world: 1, type: 'ground' },
  { x: -950, y: 400, width: 20, height: 100, color: '#ef4444', world: 1, type: 'portal', portalReq: 0, portalName: "Magma Obby", portalTarget: { world: 3, x: 50, y: 500 } },

  // Right Side: Cyber Portal Area (Requires 100k)
  { x: 700, y: 500, width: 200, height: 20, color: '#1e3a8a', world: 1, type: 'ground' },
  { x: 850, y: 400, width: 20, height: 100, color: '#3b82f6', world: 1, type: 'portal', portalReq: 100000, portalName: "Cyber World", portalTarget: { world: 2, x: 50, y: 500 } },

  // Center Parkour (Tree/Fountain abstract)
  { x: -100, y: 450, width: 200, height: 20, color: '#fbbf24', world: 1, type: 'ground' }, // Low platform
  { x: -50, y: 350, width: 100, height: 20, color: '#fbbf24', world: 1, type: 'ground' }, // Mid
  { x: -25, y: 250, width: 50, height: 20, color: '#fbbf24', world: 1, type: 'ground' }, // Top
];

// World 2: Cyber Space (Hard)
const WORLD_2_PLATFORMS: Platform[] = [
  // Start
  { x: 0, y: 600, width: 400, height: 50, color: '#1e1b4b', world: 2, type: 'ground' },
  // Jumps
  { x: 500, y: 500, width: 100, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  { x: 700, y: 400, width: 80, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  { x: 900, y: 400, width: 80, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  { x: 1100, y: 300, width: 60, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  { x: 1300, y: 200, width: 40, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  // Finish
  { x: 1500, y: 200, width: 100, height: 20, color: '#ef4444', world: 2, type: 'finish' },
];

// World 3: Magma Caverns (Medium + Hazards)
const WORLD_3_PLATFORMS: Platform[] = [
  // Start
  { x: 0, y: 600, width: 400, height: 50, color: '#27272a', world: 3, type: 'ground' },
  
  // Lava Pit Jump
  { x: 500, y: 550, width: 100, height: 20, color: '#27272a', world: 3, type: 'ground' },
  { x: 600, y: 600, width: 200, height: 20, color: '#dc2626', world: 3, type: 'hazard' }, // Lava
  
  // Stairs
  { x: 800, y: 500, width: 100, height: 20, color: '#27272a', world: 3, type: 'ground' },
  { x: 950, y: 400, width: 100, height: 20, color: '#27272a', world: 3, type: 'ground' },
  
  // Tiny Lava jumps
  { x: 1150, y: 400, width: 50, height: 20, color: '#27272a', world: 3, type: 'ground' },
  { x: 1300, y: 400, width: 50, height: 20, color: '#27272a', world: 3, type: 'ground' },
  
  // Finish
  { x: 1500, y: 350, width: 100, height: 20, color: '#ef4444', world: 3, type: 'finish' },
];

export const ALL_PLATFORMS = [...HUB_PLATFORMS, ...WORLD_2_PLATFORMS, ...WORLD_3_PLATFORMS];

// --- COLLECTIBLES ---

export const ALL_COLLECTIBLES: Collectible[] = [
  // Hub Collectibles
  { id: 'hub_1', x: -300, y: 550, radius: 15, value: 100, color: '#fde047', world: 1 },
  { id: 'hub_2', x: 300, y: 550, radius: 15, value: 100, color: '#fde047', world: 1 },
  { id: 'hub_top', x: -25, y: 200, radius: 20, value: 1000, color: '#8b5cf6', world: 1 }, // Top of parkour
  
  // Magma Collectibles
  { id: 'magma_1', x: 650, y: 450, radius: 15, value: 500, color: '#f87171', world: 3 },
  
  // Cyber Collectibles
  { id: 'cyber_1', x: 1100, y: 250, radius: 15, value: 2500, color: '#67e8f9', world: 2 },
];