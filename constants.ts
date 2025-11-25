
import { GameConfig, Platform, Pet, PetRarity, Collectible, Skin, EnemyDef, Quest } from './types';

export const CONFIG: GameConfig = {
  gravity: 0.6,
  jumpForce: -12,
  moveSpeedBase: 5,
  friction: 0.85,
};

export const REBIRTH_COST_BASE = 1000;

export const MUTATION_CHANCES = {
  SHINY: 0.10,   // 10%
  GOLD: 0.02,    // 2%
  RAINBOW: 0.005, // 0.5%
  DARK_MATTER: 0.001, // 0.1% (New God Tier)
  SPECIALIST: 0.15 // 15% chance for a specific stat mutation (Speedy/Jumpy/etc) if not rare
};

export const MUTATION_MULTIPLIERS = {
    SHINY: 1.5,
    GOLD: 3,
    RAINBOW: 10,
    DARK_MATTER: 50,
    SPECIALIST: 2.5 
};

export const WORLDS = [
  { id: 1, name: "The Hub", req: 0, spawn: { x: -50, y: 500 }, color: "text-green-500", desc: "Safe zone" },
  { id: 3, name: "Magma Obby", req: 0, spawn: { x: 50, y: 500 }, color: "text-red-500", desc: "Harder & Longer!" },
  { id: 2, name: "Cyber World", req: 100000, spawn: { x: 50, y: 500 }, color: "text-cyan-500", desc: "Expert Jumping" },
  { id: 4, name: "The Void", req: 5000000, spawn: { x: 0, y: 500 }, color: "text-purple-500", desc: "God Tier Only" },
];

const MANUAL_QUESTS: Quest[] = [
    { id: 1, name: "Warm Up", description: "Click the Speed button 50 times.", type: 'train_speed', target: 50, rewardAmount: 500, rewardType: 'speed' },
    { id: 2, name: "Leg Day", description: "Train your Jump stat 30 times.", type: 'train_jump', target: 30, rewardAmount: 500, rewardType: 'jump' },
    { id: 3, name: "First Blood", description: "Defeat 3 Enemies.", type: 'kill_enemy', target: 3, rewardAmount: 1000, rewardType: 'attack' },
    { id: 4, name: "Pet Lover", description: "Buy 1 Pet from the shop.", type: 'buy_pet', target: 1, rewardAmount: 2000, rewardType: 'speed' },
    { id: 5, name: "Fighter", description: "Train Attack 50 times.", type: 'train_attack', target: 50, rewardAmount: 1000, rewardType: 'health' },
    { id: 6, name: "Parkour Pro", description: "Finish any Obby 1 time.", type: 'finish_obby', target: 1, rewardAmount: 5000, rewardType: 'speed' },
    { id: 7, name: "Monster Hunter", description: "Defeat 10 Enemies.", type: 'kill_enemy', target: 10, rewardAmount: 5000, rewardType: 'attack' },
    { id: 8, name: "A New Beginning", description: "Rebirth 1 time.", type: 'rebirth', target: 1, rewardAmount: 10000, rewardType: 'speed' },
    { id: 9, name: "Speed Demon", description: "Train Speed 200 times.", type: 'train_speed', target: 200, rewardAmount: 25000, rewardType: 'jump' },
    { id: 10, name: "Collector", description: "Buy 3 Pets.", type: 'buy_pet', target: 3, rewardAmount: 50000, rewardType: 'speed' },
    { id: 11, name: "Boss Slayer", description: "Defeat 5 Enemies (Bosses count too!).", type: 'kill_enemy', target: 5, rewardAmount: 50000, rewardType: 'thorn' },
    { id: 12, name: "Void Ready", description: "Train Health 100 times.", type: 'train_health', target: 100, rewardAmount: 100000, rewardType: 'health' },
    { id: 13, name: "Godly Power", description: "Rebirth 5 times.", type: 'rebirth', target: 5, rewardAmount: 1000000, rewardType: 'random' },
    // NEW QUESTS
    { id: 14, name: "Iron Skin", description: "Train Health 500 times.", type: 'train_health', target: 500, rewardAmount: 200000, rewardType: 'health' },
    { id: 15, name: "Spiky", description: "Train Thorn 500 times.", type: 'train_thorn', target: 500, rewardAmount: 200000, rewardType: 'thorn' },
    { id: 16, name: "Hunter", description: "Kill 20 Enemies.", type: 'kill_enemy', target: 20, rewardAmount: 500000, rewardType: 'attack' },
    { id: 17, name: "Super Sonic", description: "Train Speed 2,000 times.", type: 'train_speed', target: 2000, rewardAmount: 1000000, rewardType: 'jump' },
    { id: 18, name: "Sky High", description: "Train Jump 2,000 times.", type: 'train_jump', target: 2000, rewardAmount: 1000000, rewardType: 'speed' },
    { id: 19, name: "Pet Collector", description: "Buy 10 Pets.", type: 'buy_pet', target: 10, rewardAmount: 5000000, rewardType: 'random' },
    { id: 20, name: "Rebirth Specialist", description: "Rebirth 10 times.", type: 'rebirth', target: 10, rewardAmount: 10000000, rewardType: 'random' },
    { id: 21, name: "Void Hunter", description: "Kill 50 Enemies.", type: 'kill_enemy', target: 50, rewardAmount: 50000000, rewardType: 'attack' },
    { id: 22, name: "Marathon", description: "Finish Obby 5 times.", type: 'finish_obby', target: 5, rewardAmount: 100000000, rewardType: 'speed' },
    { id: 23, name: "Immortal", description: "Train Health 5,000 times.", type: 'train_health', target: 5000, rewardAmount: 500000000, rewardType: 'health' },
    { id: 24, name: "Cactus God", description: "Train Thorn 5,000 times.", type: 'train_thorn', target: 5000, rewardAmount: 500000000, rewardType: 'thorn' },
    { id: 25, name: "Ascension", description: "Rebirth 25 times.", type: 'rebirth', target: 25, rewardAmount: 1000000000, rewardType: 'random' },
    { id: 26, name: "The One", description: "Buy 20 Pets.", type: 'buy_pet', target: 20, rewardAmount: 5000000000, rewardType: 'speed' },
    { id: 27, name: "Genocide", description: "Kill 200 Enemies.", type: 'kill_enemy', target: 200, rewardAmount: 10000000000, rewardType: 'attack' },
    { id: 28, name: "Time Lord", description: "Rebirth 50 times.", type: 'rebirth', target: 50, rewardAmount: 100000000000, rewardType: 'random' },
    { id: 29, name: "Infinity", description: "Train Speed 50,000 times.", type: 'train_speed', target: 50000, rewardAmount: 1000000000000, rewardType: 'speed' },
    { id: 30, name: "Beyond God", description: "Rebirth 100 times.", type: 'rebirth', target: 100, rewardAmount: 1000000000000, rewardType: 'random' },
];

const GENERATED_QUESTS: Quest[] = [];

let genQuestId = 31;
let genTrainTarget = 60000;
let genKillTarget = 250;
let genObbyTarget = 6;
let genReward = 2000000000000; // 2 Trillion Start

for (let i = 0; i < 1000; i++) {
    const typeIndex = i % 7;
    // 0: Speed, 1: Jump, 2: Attack, 3: Health, 4: Thorn, 5: Kill, 6: Obby
    
    if (typeIndex === 0) {
        genTrainTarget = Math.floor(genTrainTarget * 1.1);
        genReward *= 1.25;
        GENERATED_QUESTS.push({
            id: genQuestId++,
            name: `Training Arc ${Math.floor(i/7) + 1}`,
            description: `Train Speed ${genTrainTarget.toLocaleString()} times.`,
            type: 'train_speed',
            target: genTrainTarget,
            rewardAmount: genReward,
            rewardType: 'speed'
        });
    } else if (typeIndex === 1) {
        GENERATED_QUESTS.push({
            id: genQuestId++,
            name: `Leap of Faith ${Math.floor(i/7) + 1}`,
            description: `Train Jump ${genTrainTarget.toLocaleString()} times.`,
            type: 'train_jump',
            target: genTrainTarget,
            rewardAmount: genReward,
            rewardType: 'jump'
        });
    } else if (typeIndex === 2) {
        GENERATED_QUESTS.push({
            id: genQuestId++,
            name: `Warrior's Path ${Math.floor(i/7) + 1}`,
            description: `Train Attack ${Math.floor(genTrainTarget/5).toLocaleString()} times.`, // Attack is slower
            type: 'train_attack',
            target: Math.floor(genTrainTarget/5),
            rewardAmount: genReward,
            rewardType: 'attack'
        });
    } else if (typeIndex === 3) {
        GENERATED_QUESTS.push({
            id: genQuestId++,
            name: `Iron Will ${Math.floor(i/7) + 1}`,
            description: `Train Health ${Math.floor(genTrainTarget/2).toLocaleString()} times.`,
            type: 'train_health',
            target: Math.floor(genTrainTarget/2),
            rewardAmount: genReward,
            rewardType: 'health'
        });
    } else if (typeIndex === 4) {
        GENERATED_QUESTS.push({
            id: genQuestId++,
            name: `Cactus Style ${Math.floor(i/7) + 1}`,
            description: `Train Thorn ${Math.floor(genTrainTarget/2).toLocaleString()} times.`,
            type: 'train_thorn',
            target: Math.floor(genTrainTarget/2),
            rewardAmount: genReward,
            rewardType: 'thorn'
        });
    } else if (typeIndex === 5) {
        genKillTarget = Math.floor(genKillTarget * 1.05);
        GENERATED_QUESTS.push({
            id: genQuestId++,
            name: `Monster Hunter ${Math.floor(i/7) + 1}`,
            description: `Kill ${genKillTarget.toLocaleString()} Enemies.`,
            type: 'kill_enemy',
            target: genKillTarget,
            rewardAmount: genReward * 3,
            rewardType: 'random'
        });
    } else if (typeIndex === 6) {
        genObbyTarget = Math.max(genObbyTarget, Math.floor(genObbyTarget * 1.02)); 
        GENERATED_QUESTS.push({
            id: genQuestId++,
            name: `Obby Master ${Math.floor(i/7) + 1}`,
            description: `Finish Obby ${genObbyTarget.toLocaleString()} times.`,
            type: 'finish_obby',
            target: genObbyTarget,
            rewardAmount: genReward * 5,
            rewardType: 'random'
        });
    }
}

export const CAMPAIGN_QUESTS: Quest[] = [...MANUAL_QUESTS, ...GENERATED_QUESTS];

export const AVAILABLE_PETS: Pet[] = [
  { id: 'dog', name: 'Basic Doggy', multiplier: 2, rarity: PetRarity.COMMON, cost: 500, description: "A loyal friend." },
  { id: 'cat', name: 'Speedy Cat', multiplier: 5, rarity: PetRarity.RARE, cost: 2500, description: "Zooms around at 3am." },
  { id: 'bunny', name: 'Hyper Bunny', multiplier: 10, rarity: PetRarity.EPIC, cost: 8000, description: "Never stops hopping." },
  { id: 'dragon', name: 'Inferno Dragon', multiplier: 25, rarity: PetRarity.EPIC, cost: 25000, description: "Breaths fire and speed." },
  { id: 'void', name: 'Void Walker', multiplier: 100, rarity: PetRarity.LEGENDARY, cost: 150000, description: "Existence is merely a suggestion." },
  { id: 'god', name: 'Galaxy God', multiplier: 500, rarity: PetRarity.LEGENDARY, cost: 5000000, description: "Creates universes." },
];

export const AVAILABLE_SKINS: Skin[] = [
  { id: 'default', name: 'Red Runner', color: '#ef4444', costType: 'speed', cost: 0, speedMult: 1, jumpMult: 1, attackMult: 1, description: "The classic look." },
  { id: 'blue', name: 'Blue Bolt', color: '#3b82f6', costType: 'speed', cost: 5000, speedMult: 1.5, jumpMult: 1, attackMult: 1, description: "Aerodynamic blue paint." },
  { id: 'green', name: 'Jumper Green', color: '#22c55e', costType: 'jump', cost: 5000, speedMult: 1, jumpMult: 1.5, attackMult: 1, description: "Spring-loaded shoes." },
  { id: 'paladin', name: 'Paladin', color: '#e5e7eb', costType: 'health', cost: 10000, speedMult: 0.8, jumpMult: 0.8, attackMult: 1, healthMult: 2.0, description: "Heavy armor for survival." },
  { id: 'spike', name: 'Spike', color: '#10b981', costType: 'thorn', cost: 10000, speedMult: 1, jumpMult: 1, attackMult: 1, thornMult: 2.0, description: "Don't touch me!" },
  { id: 'clover', name: 'Lucky Clover', color: '#4ade80', costType: 'speed', cost: 15000, speedMult: 1, jumpMult: 1, attackMult: 1, luckMult: 1.5, description: "Increases mutation luck!" },
  { id: 'gladiator', name: 'Gladiator', color: '#9ca3af', costType: 'attack', cost: 10000, speedMult: 1, jumpMult: 1, attackMult: 2, description: "Born to fight." },
  { id: 'cactus', name: 'Cactus King', color: '#166534', costType: 'thorn', cost: 50000, speedMult: 0.9, jumpMult: 0.9, attackMult: 1, thornMult: 5.0, description: "Prickly personality." },
  { id: 'tank', name: 'Iron Tank', color: '#475569', costType: 'health', cost: 50000, speedMult: 0.7, jumpMult: 0.7, attackMult: 2, healthMult: 5.0, description: "Takes a beating." },
  { id: 'dice', name: 'High Roller', color: '#fcd34d', costType: 'jump', cost: 25000, speedMult: 1, jumpMult: 1, attackMult: 1, luckMult: 2.0, description: "Rolling for rare pets." },
  { id: 'cyborg', name: 'Cyborg', color: '#0ea5e9', costType: 'attack', cost: 50000, speedMult: 2, jumpMult: 2, attackMult: 3, description: "Enhanced combat systems." },
  { id: 'gold', name: 'Golden God', color: '#eab308', costType: 'speed', cost: 1000000, speedMult: 3, jumpMult: 3, attackMult: 3, description: "Made of solid gold." },
  { id: 'titan', name: 'Titan', color: '#374151', costType: 'health', cost: 1000000, speedMult: 1, jumpMult: 1, attackMult: 5, healthMult: 10.0, description: "Unstoppable giant." },
  { id: 'fortune', name: 'Fortune Teller', color: '#a855f7', costType: 'attack', cost: 250000, speedMult: 1.5, jumpMult: 1.5, attackMult: 1.5, luckMult: 3.0, description: "Sees a shiny future." },
  { id: 'ninja', name: 'Shadow Ninja', color: '#171717', costType: 'jump', cost: 500000, speedMult: 2, jumpMult: 5, attackMult: 4, description: "One with the shadows." },
  { id: 'demon', name: 'Demon King', color: '#7f1d1d', costType: 'attack', cost: 1000000, speedMult: 3, jumpMult: 3, attackMult: 10, description: "Ruler of the underworld." },
  { id: 'neon', name: 'Neon Overload', color: '#d946ef', costType: 'speed', cost: 250000, speedMult: 5, jumpMult: 1, attackMult: 1, description: "Too bright to handle." },
  { id: 'omnipotent', name: 'The Omnipotent', color: '#ffffff', costType: 'all', cost: 10000000, speedMult: 10000000, jumpMult: 10000000, attackMult: 10000000, healthMult: 10000000, luckMult: 10000000, description: "GOD MODE ACTIVATED." },
  { id: 'eternal', name: 'The Eternal', color: '#00ffff', costType: 'all', cost: 10000000, speedMult: 23475764723673743748, jumpMult: 23475764723673743748, attackMult: 23475764723673743748, healthMult: 23475764723673743748, thornMult: 23475764723673743748, luckMult: 23475764723673743748, description: "BEYOND GOD." },
];

export const ENEMIES: EnemyDef[] = [
  // World 1: Hub
  { id: 'slime1', name: 'Slime', x: -300, y: 550, width: 40, height: 30, maxHp: 100, damage: 5, reward: 500, rewardType: 'speed', world: 1, color: '#84cc16' },
  { id: 'slime2', name: 'Slime', x: 300, y: 550, width: 40, height: 30, maxHp: 100, damage: 5, reward: 500, rewardType: 'speed', world: 1, color: '#84cc16' },
  { id: 'boss1', name: 'KING SLIME', x: -600, y: 500, width: 120, height: 100, maxHp: 5000, damage: 20, reward: 25000, rewardType: 'random', petDropChance: 0.2, world: 1, color: '#3f6212', isBoss: true },

  // World 3: Magma (Gives Health and Attack)
  { id: 'golem1', name: 'Magma Cube', x: 920, y: 450, width: 50, height: 50, maxHp: 2000, damage: 25, reward: 500, rewardType: 'health', world: 3, color: '#ea580c' },
  { id: 'golem2', name: 'Magma Cube', x: 1600, y: 350, width: 50, height: 50, maxHp: 2000, damage: 25, reward: 500, rewardType: 'attack', world: 3, color: '#ea580c' },
  { id: 'boss3', name: 'FIRE LORD', x: 2300, y: 150, width: 100, height: 120, maxHp: 50000, damage: 50, reward: 10000, rewardType: 'thorn', petDropChance: 0.3, world: 3, color: '#7f1d1d', isBoss: true },

  // World 2: Cyber (Gives Jump)
  { id: 'drone1', name: 'Security Bot', x: 510, y: 500, width: 40, height: 40, maxHp: 5000, damage: 40, reward: 1000, rewardType: 'jump', world: 2, color: '#0ea5e9' },
  { id: 'drone2', name: 'Security Bot', x: 1310, y: 200, width: 40, height: 40, maxHp: 5000, damage: 40, reward: 1000, rewardType: 'jump', world: 2, color: '#0ea5e9' },
  { id: 'boss2', name: 'MECH TANK', x: 2100, y: 50, width: 150, height: 80, maxHp: 200000, damage: 80, reward: 50000, rewardType: 'jump', petDropChance: 0.3, world: 2, color: '#1e1b4b', isBoss: true },

  // World 4: The Void (SCALED UP TO 100 TRILLION) - Gives Everything
  { id: 'void1', name: 'Void Crawler', x: 600, y: 500, width: 60, height: 60, maxHp: 10000000000, damage: 5000, reward: 100000, rewardType: 'random', world: 4, color: '#6b21a8' }, 
  { id: 'void2', name: 'Void Walker', x: 1500, y: 500, width: 60, height: 100, maxHp: 1000000000000, damage: 50000, reward: 100000, rewardType: 'thorn', world: 4, color: '#6b21a8' }, 
  { id: 'boss4', name: 'THE DESTROYER', x: 2500, y: 300, width: 200, height: 200, maxHp: 100000000000000, damage: 1000000, reward: 10000000, rewardType: 'random', petDropChance: 0.5, world: 4, color: '#000000', isBoss: true }, 
];

// --- PLATFORMS ---

// World 1: The Hub
const HUB_PLATFORMS: Platform[] = [
  // Main Floor
  { x: -1000, y: 600, width: 2000, height: 100, color: '#4ade80', world: 1, type: 'ground' },
  
  // Left Side: Magma Portal Area
  { x: -900, y: 500, width: 200, height: 20, color: '#7f1d1d', world: 1, type: 'ground' },
  { x: -950, y: 400, width: 20, height: 100, color: '#ef4444', world: 1, type: 'portal', portalReq: 0, portalName: "Magma Obby", portalTarget: { world: 3, x: 50, y: 500 } },

  // Right Side: Cyber Portal Area
  { x: 700, y: 500, width: 200, height: 20, color: '#1e3a8a', world: 1, type: 'ground' },
  { x: 850, y: 400, width: 20, height: 100, color: '#3b82f6', world: 1, type: 'portal', portalReq: 100000, portalName: "Cyber World", portalTarget: { world: 2, x: 50, y: 500 } },

  // Center Parkour
  { x: -100, y: 450, width: 200, height: 20, color: '#fbbf24', world: 1, type: 'ground' },
  { x: -50, y: 350, width: 100, height: 20, color: '#fbbf24', world: 1, type: 'ground' },
  { x: -25, y: 250, width: 50, height: 20, color: '#fbbf24', world: 1, type: 'ground' },

  // Void Portal (Sky)
  { x: -250, y: 100, width: 500, height: 20, color: '#581c87', world: 1, type: 'ground' },
  { x: -50, y: 0, width: 100, height: 100, color: '#3b0764', world: 1, type: 'portal', portalReq: 5000000, portalName: "THE VOID", portalTarget: { world: 4, x: 0, y: 500 } },
];

// World 2: Cyber Space (Harder, Longer, Checkpoints)
const WORLD_2_PLATFORMS: Platform[] = [
  // Start
  { x: 0, y: 600, width: 400, height: 50, color: '#1e1b4b', world: 2, type: 'ground' },
  
  // Section 1: The Basics
  { x: 500, y: 550, width: 100, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  { x: 700, y: 450, width: 80, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  { x: 900, y: 350, width: 80, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  
  // Checkpoint 1
  { x: 1100, y: 350, width: 100, height: 20, color: '#facc15', world: 2, type: 'checkpoint' },

  // Section 2: The Drop
  { x: 1300, y: 250, width: 60, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  { x: 1500, y: 400, width: 60, height: 20, color: '#06b6d4', world: 2, type: 'ground' }, // Drop down
  { x: 1700, y: 300, width: 60, height: 20, color: '#06b6d4', world: 2, type: 'ground' }, // Back up

  // Checkpoint 2
  { x: 1900, y: 300, width: 100, height: 20, color: '#facc15', world: 2, type: 'checkpoint' },

  // Section 3: The Tower (Vertical)
  { x: 2100, y: 200, width: 100, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  { x: 2100, y: 100, width: 100, height: 20, color: '#06b6d4', world: 2, type: 'ground' },
  { x: 2300, y: 0, width: 100, height: 20, color: '#06b6d4', world: 2, type: 'ground' }, // Very high
  
  // Finish
  { x: 2600, y: 0, width: 150, height: 20, color: '#ef4444', world: 2, type: 'finish' },
];

// World 3: Magma Caverns (Harder, Longer, Hazards, Checkpoints)
const WORLD_3_PLATFORMS: Platform[] = [
  // Start
  { x: 0, y: 600, width: 400, height: 50, color: '#27272a', world: 3, type: 'ground' },
  
  // Lava Pit 1
  { x: 500, y: 550, width: 100, height: 20, color: '#27272a', world: 3, type: 'ground' },
  { x: 600, y: 600, width: 300, height: 20, color: '#dc2626', world: 3, type: 'hazard' }, 
  { x: 700, y: 500, width: 50, height: 20, color: '#27272a', world: 3, type: 'ground' }, // Tiny island
  
  // Stairs
  { x: 900, y: 500, width: 100, height: 20, color: '#27272a', world: 3, type: 'ground' },
  
  // Checkpoint 1
  { x: 1100, y: 500, width: 100, height: 20, color: '#facc15', world: 3, type: 'checkpoint' },

  // Lava Ocean (Narrow platforms)
  { x: 1300, y: 600, width: 1000, height: 20, color: '#dc2626', world: 3, type: 'hazard' }, // Huge lava floor
  { x: 1350, y: 450, width: 50, height: 20, color: '#27272a', world: 3, type: 'ground' },
  { x: 1550, y: 400, width: 50, height: 20, color: '#27272a', world: 3, type: 'ground' },
  { x: 1750, y: 350, width: 50, height: 20, color: '#27272a', world: 3, type: 'ground' },

  // Checkpoint 2
  { x: 1950, y: 350, width: 100, height: 20, color: '#facc15', world: 3, type: 'checkpoint' },

  // The Blind Jump
  { x: 2200, y: 250, width: 100, height: 20, color: '#27272a', world: 3, type: 'ground' },
  { x: 2500, y: 250, width: 100, height: 20, color: '#27272a', world: 3, type: 'ground' }, // Far jump

  // Finish
  { x: 2800, y: 200, width: 150, height: 20, color: '#ef4444', world: 3, type: 'finish' },
];

// World 4: The Void
const WORLD_4_PLATFORMS: Platform[] = [
   { x: -500, y: 600, width: 1000, height: 50, color: '#581c87', world: 4, type: 'ground' },
   { x: 600, y: 500, width: 200, height: 20, color: '#581c87', world: 4, type: 'ground' },
   { x: 1000, y: 400, width: 200, height: 20, color: '#581c87', world: 4, type: 'ground' },
   { x: 1400, y: 300, width: 200, height: 20, color: '#581c87', world: 4, type: 'ground' },
   // Boss Arena
   { x: 2000, y: 500, width: 1000, height: 50, color: '#000000', world: 4, type: 'ground' },
];

export const ALL_PLATFORMS = [...HUB_PLATFORMS, ...WORLD_2_PLATFORMS, ...WORLD_3_PLATFORMS, ...WORLD_4_PLATFORMS];

// --- COLLECTIBLES ---

export const ALL_COLLECTIBLES: Collectible[] = [
  // Hub Collectibles
  { id: 'hub_1', x: -300, y: 550, radius: 15, value: 100, color: '#fde047', world: 1 },
  { id: 'hub_2', x: 300, y: 550, radius: 15, value: 100, color: '#fde047', world: 1 },
  { id: 'hub_top', x: -25, y: 200, radius: 20, value: 1000, color: '#8b5cf6', world: 1 }, 
  
  // Magma Collectibles
  { id: 'magma_1', x: 725, y: 450, radius: 15, value: 500, color: '#f87171', world: 3 },
  { id: 'magma_2', x: 1575, y: 350, radius: 15, value: 2000, color: '#f87171', world: 3 }, // Hard reach
  
  // Cyber Collectibles
  { id: 'cyber_1', x: 940, y: 300, radius: 15, value: 2500, color: '#67e8f9', world: 2 },
  { id: 'cyber_2', x: 2350, y: -50, radius: 20, value: 10000, color: '#8b5cf6', world: 2 }, // Top of tower

  // Void Collectibles
  { id: 'void_1', x: 800, y: 350, radius: 25, value: 100000, color: '#e879f9', world: 4 },
];
