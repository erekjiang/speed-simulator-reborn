import React, { useState, useCallback, useEffect } from 'react';
import { PlayerState, Pet, PetRarity, PetMutation, Skin, QuestType } from './types';
import { REBIRTH_COST_BASE, AVAILABLE_PETS, WORLDS, AVAILABLE_SKINS, MUTATION_CHANCES, MUTATION_MULTIPLIERS, CAMPAIGN_QUESTS } from './constants';
import GameCanvas, { ActiveEnemy } from './components/GameCanvas';
import { getGeminiGameTip } from './services/geminiService';
import { Zap, ShoppingBag, Repeat, Home, MessageSquare, ArrowUp, Globe, Lock, Shirt, Check, Sword, Sparkles, Heart, Shield, Anchor, Scroll, Gift } from 'lucide-react';

const App: React.FC = () => {
  // --- Game State with Persistence ---
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const saved = localStorage.getItem('speedSimSave_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          speed: 0,
          jump: 0,
          attack: 1,
          maxHealth: 100,
          health: 100,
          thorn: 0,
          rebirths: 0,
          pets: [],
          unlockedSkins: ['default'],
          equippedSkin: 'default',
          world: 1,
          position: { x: -50, y: 500 },
          isGrounded: false,
          checkpoint: { x: -50, y: 500 },
          collectedIds: [],
          teleportId: 0,
          questIndex: 0,
          questProgress: 0,
          ...parsed,
          velocity: { x: 0, y: 0 }
        };
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return {
      speed: 0,
      jump: 0,
      attack: 1,
      maxHealth: 100,
      health: 100,
      thorn: 0,
      rebirths: 0,
      pets: [],
      unlockedSkins: ['default'],
      equippedSkin: 'default',
      world: 1, 
      position: { x: -50, y: 500 }, 
      velocity: { x: 0, y: 0 },
      isGrounded: false,
      checkpoint: { x: -50, y: 500 },
      collectedIds: [],
      teleportId: 0,
      questIndex: 0,
      questProgress: 0
    };
  });

  useEffect(() => {
    const saveState = {
        speed: playerState.speed,
        jump: playerState.jump,
        attack: playerState.attack,
        maxHealth: playerState.maxHealth,
        thorn: playerState.thorn,
        rebirths: playerState.rebirths,
        pets: playerState.pets,
        unlockedSkins: playerState.unlockedSkins,
        equippedSkin: playerState.equippedSkin,
        world: playerState.world,
        position: playerState.position,
        checkpoint: playerState.checkpoint,
        collectedIds: playerState.collectedIds,
        teleportId: playerState.teleportId,
        questIndex: playerState.questIndex,
        questProgress: playerState.questProgress
    };
    localStorage.setItem('speedSimSave_v6', JSON.stringify(saveState));
  }, [playerState]);

  const [uiOpen, setUiOpen] = useState<'shop' | 'rebirth' | 'travel' | 'skins' | 'quests' | null>(null);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // --- Derived Stats ---
  const currentSkin = AVAILABLE_SKINS.find(s => s.id === playerState.equippedSkin) || AVAILABLE_SKINS[0];
  
  // Sum up Generic Pet Multipliers
  const petGenericMult = playerState.pets.reduce((acc, pet) => acc + pet.multiplier, 0);
  
  // Sum up Specific Stat Bonuses (Mutations)
  const petSpeedBonus = playerState.pets.reduce((acc, pet) => acc + (pet.speedMult || 0), 0);
  const petJumpBonus = playerState.pets.reduce((acc, pet) => acc + (pet.jumpMult || 0), 0);
  const petAttackBonus = playerState.pets.reduce((acc, pet) => acc + (pet.attackMult || 0), 0);
  const petHealthBonus = playerState.pets.reduce((acc, pet) => acc + (pet.healthMult || 0), 0);
  const petThornBonus = playerState.pets.reduce((acc, pet) => acc + (pet.thornMult || 0), 0);
  
  const totalSpeedMult = (1 + petGenericMult + petSpeedBonus) * currentSkin.speedMult;
  const totalJumpMult = (1 + petGenericMult + petJumpBonus) * currentSkin.jumpMult;
  const totalAttackMult = (1 + petGenericMult + petAttackBonus) * (currentSkin.attackMult || 1);
  const totalHealthMult = (currentSkin.healthMult || 1) + (petHealthBonus / 100);
  const totalThornMult = (currentSkin.thornMult || 1) + (petThornBonus / 100);
  const currentLuckMult = currentSkin.luckMult || 1;

  const clickPowerSpeed = (1 + playerState.rebirths) * totalSpeedMult;
  const clickPowerJump = (1 + playerState.rebirths) * totalJumpMult;
  const clickPowerAttack = (1 + playerState.rebirths) * totalAttackMult;
  const clickPowerHealth = (1 + playerState.rebirths) * 10 * (1 + petHealthBonus); 
  const clickPowerThorn = (1 + playerState.rebirths) * totalThornMult;

  const rebirthCost = REBIRTH_COST_BASE * Math.pow(2, playerState.rebirths);

  // Effective Max Health with Multipliers
  const effectiveMaxHealth = Math.floor(playerState.maxHealth * totalHealthMult);
  
  // Current Quest
  const currentQuest = CAMPAIGN_QUESTS[playerState.questIndex];
  const questIsCompleted = currentQuest && playerState.questProgress >= currentQuest.target;

  // --- Helpers ---
  const checkQuestProgress = useCallback((type: QuestType, amount: number = 1) => {
      setPlayerState(prev => {
          const quest = CAMPAIGN_QUESTS[prev.questIndex];
          if (!quest) return prev; // No quest
          
          if (quest.type === type && prev.questProgress < quest.target) {
              const newProgress = Math.min(quest.target, prev.questProgress + amount);
              return { ...prev, questProgress: newProgress };
          }
          return prev;
      });
  }, []);

  const handleClaimQuest = () => {
      if (!currentQuest || !questIsCompleted) return;
      
      const rewardVal = currentQuest.rewardAmount;
      const type = currentQuest.rewardType;

      setPlayerState(prev => {
          let updates: Partial<PlayerState> = {
              questIndex: prev.questIndex + 1,
              questProgress: 0
          };
          
           if (type === 'speed') updates.speed = prev.speed + rewardVal;
          else if (type === 'jump') updates.jump = prev.jump + rewardVal;
          else if (type === 'attack') updates.attack = prev.attack + rewardVal;
          else if (type === 'health') {
              updates.maxHealth = prev.maxHealth + rewardVal;
              updates.health = prev.health + rewardVal;
          }
          else if (type === 'thorn') updates.thorn = prev.thorn + rewardVal;
          else if (type === 'random') {
              updates.speed = prev.speed + rewardVal; 
          }
          
          return { ...prev, ...updates };
      });
      
      setAiMessage(`🎉 Quest Complete! +${rewardVal} ${type.toUpperCase()}`);
      setTimeout(() => setAiMessage(""), 3000);
  };

  // --- Actions ---
  const handleClick = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      speed: prev.speed + clickPowerSpeed
    }));
    checkQuestProgress('train_speed');
  }, [clickPowerSpeed, checkQuestProgress]);

  const handleJumpClick = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      jump: prev.jump + clickPowerJump
    }));
    checkQuestProgress('train_jump');
  }, [clickPowerJump, checkQuestProgress]);

  const handleAttackClick = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      attack: prev.attack + clickPowerAttack
    }));
    checkQuestProgress('train_attack');
  }, [clickPowerAttack, checkQuestProgress]);

  const handleHealthClick = useCallback(() => {
      setPlayerState(prev => ({
          ...prev,
          maxHealth: prev.maxHealth + clickPowerHealth,
          health: prev.health + clickPowerHealth // Heal when training
      }));
      checkQuestProgress('train_health'); 
  }, [clickPowerHealth, checkQuestProgress]);

  const handleThornClick = useCallback(() => {
      setPlayerState(prev => ({
          ...prev,
          thorn: prev.thorn + clickPowerThorn
      }));
      checkQuestProgress('train_thorn');
  }, [clickPowerThorn, checkQuestProgress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (uiOpen === null) {
          if (e.code === 'KeyE') handleClick();
          if (e.code === 'KeyR') handleJumpClick();
          if (e.code === 'KeyF') handleAttackClick();
          if (e.code === 'KeyH') handleHealthClick();
          if (e.code === 'KeyT') handleThornClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick, handleJumpClick, handleAttackClick, handleHealthClick, handleThornClick, uiOpen]);

  const handleEnemyKill = useCallback((enemy: ActiveEnemy) => {
      const rewardVal = Math.floor(enemy.reward * (1 + playerState.rebirths));
      
      setPlayerState(prev => {
          let updates: Partial<PlayerState> = {};
          
          // 1. Give Stats
          if (enemy.rewardType === 'speed') updates.speed = prev.speed + rewardVal;
          else if (enemy.rewardType === 'jump') updates.jump = prev.jump + rewardVal;
          else if (enemy.rewardType === 'attack') updates.attack = prev.attack + rewardVal;
          else if (enemy.rewardType === 'health') {
              updates.maxHealth = prev.maxHealth + rewardVal;
              updates.health = prev.health + rewardVal;
          }
          else if (enemy.rewardType === 'thorn') updates.thorn = prev.thorn + rewardVal;
          else if (enemy.rewardType === 'random') {
              // Give a random stat
              const r = Math.random();
              if (r < 0.2) updates.speed = prev.speed + rewardVal;
              else if (r < 0.4) updates.jump = prev.jump + rewardVal;
              else if (r < 0.6) updates.attack = prev.attack + rewardVal;
              else if (r < 0.8) { updates.maxHealth = prev.maxHealth + rewardVal; updates.health = prev.health + rewardVal; }
              else updates.thorn = prev.thorn + rewardVal;
          }

          // 2. Chance for Pet
          if (enemy.petDropChance && Math.random() < enemy.petDropChance) {
               // Give a random available pet, but free
               const randomPetBase = AVAILABLE_PETS[Math.floor(Math.random() * AVAILABLE_PETS.length)];
               const newPet = { ...randomPetBase, id: randomPetBase.id + Math.random(), name: `Looted ${randomPetBase.name}`, cost: 0 };
               updates.pets = [...prev.pets, newPet];
               setAiMessage(`🎁 BOSS DROP! You found a ${randomPetBase.name}!`);
               setTimeout(() => setAiMessage(""), 4000);
          }
          
          return { ...prev, ...updates };
      });
      checkQuestProgress('kill_enemy');
  }, [playerState.rebirths, checkQuestProgress]);

  const handleRebirth = () => {
    if (playerState.speed >= rebirthCost) {
      setPlayerState(prev => ({
        ...prev,
        speed: 0,
        jump: 0, 
        attack: 1,
        maxHealth: 100,
        health: 100,
        thorn: 0,
        rebirths: prev.rebirths + 1,
        world: 1, 
        position: { x: -50, y: 500 },
        checkpoint: { x: -50, y: 500 },
        collectedIds: [],
        teleportId: prev.teleportId + 1 
      }));
      setUiOpen(null);
      checkQuestProgress('rebirth');
    }
  };

  const handleBuyPet = (pet: Pet) => {
    if (playerState.speed >= pet.cost) {
      const rand = Math.random();
      let mutation: PetMutation = 'Normal';
      let genericMultiplier = pet.multiplier;
      
      let speedMult = 0;
      let jumpMult = 0;
      let attackMult = 0;
      let healthMult = 0;
      
      const luck = currentLuckMult;

      if (rand < MUTATION_CHANCES.DARK_MATTER * luck) {
          mutation = 'Dark Matter';
          genericMultiplier *= MUTATION_MULTIPLIERS.DARK_MATTER;
      } else if (rand < MUTATION_CHANCES.RAINBOW * luck) { 
          mutation = 'Rainbow';
          genericMultiplier *= MUTATION_MULTIPLIERS.RAINBOW;
      } else if (rand < (MUTATION_CHANCES.GOLD + MUTATION_CHANCES.RAINBOW) * luck) {
          mutation = 'Gold';
          genericMultiplier *= MUTATION_MULTIPLIERS.GOLD;
      } else if (rand < (MUTATION_CHANCES.SHINY + MUTATION_CHANCES.GOLD + MUTATION_CHANCES.RAINBOW) * luck) {
          mutation = 'Shiny';
          genericMultiplier *= MUTATION_MULTIPLIERS.SHINY;
      } else if (rand < 0.15 + (MUTATION_CHANCES.SPECIALIST * luck)) { 
          const types = ['Speedy', 'Jumpy', 'Deadly', 'Tanky'];
          const type = types[Math.floor(Math.random() * types.length)];
          mutation = type as PetMutation;
          const bonus = pet.multiplier * MUTATION_MULTIPLIERS.SPECIALIST;
          
          if (type === 'Speedy') speedMult = bonus;
          if (type === 'Jumpy') jumpMult = bonus;
          if (type === 'Deadly') attackMult = bonus;
          if (type === 'Tanky') healthMult = bonus; 
      }

      const newPet: Pet = {
          ...pet,
          id: pet.id + Math.random(),
          mutation: mutation,
          multiplier: genericMultiplier,
          speedMult, jumpMult, attackMult, healthMult,
          name: mutation !== 'Normal' ? `${mutation} ${pet.name}` : pet.name
      };

      setPlayerState(prev => ({
        ...prev,
        speed: prev.speed - pet.cost,
        pets: [...prev.pets, newPet]
      }));
      checkQuestProgress('buy_pet');
    }
  };

  const handleBuySkin = (skin: Skin) => {
      let canAfford = false;
      if(skin.costType === 'speed') canAfford = playerState.speed >= skin.cost;
      else if(skin.costType === 'jump') canAfford = playerState.jump >= skin.cost;
      else if(skin.costType === 'attack') canAfford = playerState.attack >= skin.cost;
      else if(skin.costType === 'health') canAfford = playerState.maxHealth >= skin.cost;
      else if(skin.costType === 'thorn') canAfford = playerState.thorn >= skin.cost;
      else if(skin.costType === 'all') {
            canAfford = playerState.speed >= skin.cost && 
                        playerState.jump >= skin.cost && 
                        playerState.attack >= skin.cost && 
                        playerState.maxHealth >= skin.cost &&
                        playerState.thorn >= skin.cost;
      }

      if (canAfford) {
          setPlayerState(prev => {
              const next = { ...prev, unlockedSkins: [...prev.unlockedSkins, skin.id] };
              if(skin.costType === 'speed') next.speed -= skin.cost;
              else if(skin.costType === 'jump') next.jump -= skin.cost;
              else if(skin.costType === 'attack') next.attack -= skin.cost;
              else if(skin.costType === 'health') next.maxHealth -= skin.cost;
              else if(skin.costType === 'thorn') next.thorn -= skin.cost;
              else if(skin.costType === 'all') {
                  next.speed -= skin.cost;
                  next.jump -= skin.cost;
                  next.attack -= skin.cost;
                  next.maxHealth -= skin.cost;
                  next.thorn -= skin.cost;
              }
              return next;
          });
      }
  };

  const handleEquipSkin = (skinId: string) => {
      setPlayerState(prev => ({ ...prev, equippedSkin: skinId }));
  };

  const handleGoHome = (e?: React.MouseEvent<HTMLButtonElement>) => {
       e?.currentTarget.blur();
       setPlayerState(prev => ({
           ...prev,
           world: 1,
           position: { x: -50, y: 500 },
           checkpoint: { x: -50, y: 500 },
           velocity: { x: 0, y: 0 },
           health: prev.maxHealth,
           teleportId: prev.teleportId + 1 
       }));
  };

  const handleTeleport = (worldId: number) => {
      const world = WORLDS.find(w => w.id === worldId);
      if (!world) return;
      if (playerState.speed < world.req) return; 

      setPlayerState(prev => ({
          ...prev,
          world: world.id,
          position: world.spawn,
          checkpoint: world.spawn,
          velocity: { x: 0, y: 0 },
          health: prev.maxHealth,
          teleportId: prev.teleportId + 1
      }));
      setUiOpen(null);
  };

  const handleFinishObby = useCallback(() => {
     const reward = 2000 * (playerState.rebirths + 1);
     const hubPos = { x: -50, y: 500 };
     
     setPlayerState(prev => ({
         ...prev,
         speed: prev.speed + reward,
         world: 1,
         position: hubPos,
         checkpoint: hubPos,
         velocity: { x: 0, y: 0 },
         teleportId: prev.teleportId + 1
     }));
     checkQuestProgress('finish_obby');
     setAiMessage(`🏆 Course Complete! +${reward} Speed!`);
     setTimeout(() => setAiMessage(""), 5000);
  }, [playerState.rebirths, checkQuestProgress]);

  const handleAskAI = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (isAiLoading) return;
    setIsAiLoading(true);
    const msg = await getGeminiGameTip(playerState.speed, playerState.rebirths, playerState.world);
    setAiMessage(msg);
    setIsAiLoading(false);
    setTimeout(() => setAiMessage(""), 10000);
  };

  const toggleMusic = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur();
      const audio = document.getElementById('bg-music') as HTMLAudioElement;
      if (audio) {
          if (isPlayingMusic) audio.pause();
          else audio.play().catch(console.error);
          setIsPlayingMusic(!isPlayingMusic);
      }
  };

  const openUi = (type: 'shop' | 'rebirth' | 'travel' | 'skins' | 'quests', e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur();
      setUiOpen(uiOpen === type ? null : type);
  }

  const playerStateWithEffectiveHealth = {
      ...playerState,
      maxHealth: effectiveMaxHealth 
  };

  return (
    <div className="relative w-screen h-screen bg-black select-none">
      <audio id="bg-music" loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" />
      
      <GameCanvas 
        playerState={playerStateWithEffectiveHealth} 
        setPlayerState={setPlayerState} 
        onFinishObby={handleFinishObby}
        onEnemyKill={handleEnemyKill}
      />

      {/* --- HUD --- */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-50 pointer-events-none">
         {/* HEALTH BAR */}
         <div className="w-64 h-8 bg-gray-800 rounded-full border-2 border-white overflow-hidden relative shadow-xl pointer-events-auto group">
             <div 
                className="h-full bg-gradient-to-r from-red-600 to-pink-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (playerState.health / effectiveMaxHealth) * 100)}%` }}
             ></div>
             <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm drop-shadow-md">
                <Heart className="w-4 h-4 mr-1 fill-current" />
                {Math.ceil(playerState.health).toLocaleString()} / {effectiveMaxHealth.toLocaleString()}
             </div>
         </div>

         <div className="flex gap-2">
            <div className="bg-blue-600 border-b-4 border-blue-800 text-white px-3 py-1 rounded-xl shadow-lg flex items-center gap-2 pointer-events-auto w-fit">
                <Zap className="w-4 h-4 text-yellow-300 fill-current" />
                <div>
                <div className="text-[10px] uppercase opacity-80 font-bold">Speed</div>
                <div className="text-lg font-display">{Math.floor(playerState.speed).toLocaleString()}</div>
                </div>
            </div>
            
            <div className="bg-sky-500 border-b-4 border-sky-700 text-white px-3 py-1 rounded-xl shadow-lg flex items-center gap-2 pointer-events-auto w-fit">
                <ArrowUp className="w-4 h-4 text-white" />
                <div>
                <div className="text-[10px] uppercase opacity-80 font-bold">Jump</div>
                <div className="text-lg font-display">{Math.floor(playerState.jump).toLocaleString()}</div>
                </div>
            </div>
         </div>

         <div className="flex gap-2">
             <div className="bg-red-600 border-b-4 border-red-800 text-white px-3 py-1 rounded-xl shadow-lg flex items-center gap-2 pointer-events-auto w-fit">
                <Sword className="w-4 h-4 text-white" />
                <div>
                <div className="text-[10px] uppercase opacity-80 font-bold">Attack</div>
                <div className="text-lg font-display">{Math.floor(playerState.attack).toLocaleString()}</div>
                </div>
             </div>

             <div className="bg-emerald-600 border-b-4 border-emerald-800 text-white px-3 py-1 rounded-xl shadow-lg flex items-center gap-2 pointer-events-auto w-fit">
                <Anchor className="w-4 h-4 text-white" />
                <div>
                <div className="text-[10px] uppercase opacity-80 font-bold">Thorn</div>
                <div className="text-lg font-display">{Math.floor(playerState.thorn).toLocaleString()}</div>
                </div>
             </div>
         </div>

         <div className="bg-purple-600 border-b-4 border-purple-800 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto w-fit">
            <Repeat className="w-6 h-6 text-white" />
            <div>
               <div className="text-xs uppercase opacity-80 font-bold tracking-wider">Rebirths</div>
               <div className="text-2xl font-display">{playerState.rebirths}</div>
            </div>
         </div>
         
         <div className="bg-gray-800/80 backdrop-blur border-l-4 border-white text-white px-4 py-1 rounded-r-xl shadow-lg font-mono text-xs w-fit">
             World: {WORLDS.find(w => w.id === playerState.world)?.name || 'Unknown'}
         </div>

         {/* QUEST TRACKER HUD */}
         {currentQuest && (
             <div 
                className={`mt-4 bg-gray-900/90 border-2 border-yellow-500 p-3 rounded-xl shadow-xl max-w-xs pointer-events-auto cursor-pointer transition-transform hover:scale-105
                    ${questIsCompleted ? 'animate-pulse border-green-400' : ''}
                `}
                onClick={() => setUiOpen('quests')}
             >
                 <div className="text-yellow-400 font-bold text-xs uppercase mb-1 flex justify-between items-center">
                     Current Quest {questIsCompleted && "✅"}
                     <span className="text-white text-[10px]">Click for Details</span>
                 </div>
                 <div className="text-white font-bold text-sm mb-1">{currentQuest.name}</div>
                 <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                     <div 
                        className={`h-full transition-all ${questIsCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(100, (playerState.questProgress / currentQuest.target) * 100)}%` }}
                     ></div>
                 </div>
                 <div className="text-right text-xs text-gray-400 mt-1">
                     {playerState.questProgress} / {currentQuest.target}
                 </div>
             </div>
         )}
      </div>

      {/* Training Buttons */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-end gap-2 md:gap-4 pointer-events-auto">
         <div className="flex flex-col items-center group">
             <div className="mb-2 text-white font-bold text-shadow text-xs opacity-0 group-hover:opacity-100 transition-opacity">Key: E</div>
             <button 
               onClick={(e) => { handleClick(); e.currentTarget.blur(); }}
               className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 transition-all border-b-8 border-yellow-600 text-yellow-900 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-2xl relative"
             >
                <Zap className="w-8 h-8 md:w-10 md:h-10" />
                <span className="absolute -top-6 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">Speed</span>
             </button>
         </div>

         <div className="flex flex-col items-center group">
             <div className="mb-2 text-white font-bold text-shadow text-xs opacity-0 group-hover:opacity-100 transition-opacity">Key: R</div>
             <button 
               onClick={(e) => { handleJumpClick(); e.currentTarget.blur(); }}
               className="bg-blue-400 hover:bg-blue-300 active:scale-95 transition-all border-b-8 border-blue-600 text-blue-900 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-2xl relative"
             >
                <ArrowUp className="w-8 h-8 md:w-10 md:h-10" />
                <span className="absolute -top-6 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">Jump</span>
             </button>
         </div>

         <div className="flex flex-col items-center group">
             <div className="mb-2 text-white font-bold text-shadow text-xs opacity-0 group-hover:opacity-100 transition-opacity">Key: F</div>
             <button 
               onClick={(e) => { handleAttackClick(); e.currentTarget.blur(); }}
               className="bg-red-500 hover:bg-red-400 active:scale-95 transition-all border-b-8 border-red-700 text-red-900 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-2xl relative"
             >
                <Sword className="w-8 h-8 md:w-10 md:h-10" />
                <span className="absolute -top-6 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">Attack</span>
             </button>
         </div>

         <div className="flex flex-col items-center group">
             <div className="mb-2 text-white font-bold text-shadow text-xs opacity-0 group-hover:opacity-100 transition-opacity">Key: H</div>
             <button 
               onClick={(e) => { handleHealthClick(); e.currentTarget.blur(); }}
               className="bg-pink-500 hover:bg-pink-400 active:scale-95 transition-all border-b-8 border-pink-700 text-pink-900 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-2xl relative"
             >
                <Heart className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                <span className="absolute -top-6 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">Health</span>
             </button>
         </div>

         <div className="flex flex-col items-center group">
             <div className="mb-2 text-white font-bold text-shadow text-xs opacity-0 group-hover:opacity-100 transition-opacity">Key: T</div>
             <button 
               onClick={(e) => { handleThornClick(); e.currentTarget.blur(); }}
               className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all border-b-8 border-emerald-700 text-emerald-900 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-2xl relative"
             >
                <Anchor className="w-8 h-8 md:w-10 md:h-10" />
                <span className="absolute -top-6 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">Thorn</span>
             </button>
         </div>
      </div>

      {/* Right Side Menu */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-50 pointer-events-auto">
         <button 
            onClick={(e) => openUi('quests', e)}
            className="bg-yellow-500 hover:bg-yellow-400 border-b-4 border-yellow-700 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2 relative"
         >
            <Scroll className="w-6 h-6" />
            <span className="font-bold hidden md:block">Quests</span>
            {questIsCompleted && <span className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full text-xs flex items-center justify-center animate-bounce">!</span>}
         </button>

         <button 
            onClick={(e) => openUi('shop', e)}
            className="bg-green-500 hover:bg-green-400 border-b-4 border-green-700 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
         >
            <ShoppingBag className="w-6 h-6" />
            <span className="font-bold hidden md:block">Pets</span>
         </button>

         <button 
            onClick={(e) => openUi('skins', e)}
            className="bg-pink-500 hover:bg-pink-400 border-b-4 border-pink-700 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
         >
            <Shirt className="w-6 h-6" />
            <span className="font-bold hidden md:block">Skins</span>
         </button>

         <button 
            onClick={(e) => openUi('travel', e)}
            className="bg-indigo-500 hover:bg-indigo-400 border-b-4 border-indigo-700 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
         >
            <Globe className="w-6 h-6" />
            <span className="font-bold hidden md:block">Travel</span>
         </button>

         <button 
            onClick={(e) => openUi('rebirth', e)}
            className="bg-red-500 hover:bg-red-400 border-b-4 border-red-700 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
         >
            <Repeat className="w-6 h-6" />
            <span className="font-bold hidden md:block">Rebirth</span>
         </button>

         <button 
            onClick={handleGoHome}
            className="bg-sky-500 hover:bg-sky-400 border-b-4 border-sky-700 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
         >
            <Home className="w-6 h-6" />
            <span className="font-bold hidden md:block">Spawn</span>
         </button>
         
         <button 
            onClick={handleAskAI}
            className="bg-purple-600 hover:bg-purple-500 border-b-4 border-purple-800 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
         >
            <MessageSquare className="w-6 h-6" />
            <span className="font-bold hidden md:block">Ask Guide</span>
         </button>
         
          <button 
            onClick={toggleMusic}
            className="bg-gray-700 hover:bg-gray-600 border-b-4 border-gray-900 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105"
         >
            {isPlayingMusic ? "🔊" : "🔇"}
         </button>
      </div>

      {/* AI Message Toast */}
      {aiMessage && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-indigo-900 px-6 py-4 rounded-2xl shadow-2xl z-[60] max-w-md text-center border-2 border-indigo-200 animate-bounce pointer-events-none">
              <p className="font-bold text-lg mb-1">🧙‍♂️ Game Master Says:</p>
              <p>{aiMessage}</p>
          </div>
      )}

      {/* Modals */}
      {uiOpen && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative animate-[popIn_0.2s_ease-out] max-h-[80vh] overflow-y-auto">
                <button 
                   onClick={() => setUiOpen(null)}
                   className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
                >
                    Close ✕
                </button>

                {uiOpen === 'quests' && (
                    <div className="text-center">
                        <h2 className="text-3xl font-black mb-2 text-yellow-600 flex justify-center items-center gap-2">
                             <Scroll className="w-8 h-8" /> Campaign Quests
                        </h2>
                        <p className="text-gray-500 mb-6">Complete quests to earn big rewards!</p>

                        {currentQuest ? (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl border-2 border-yellow-400 shadow-inner">
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">{currentQuest.name}</h3>
                                <p className="text-gray-600 text-lg mb-6">{currentQuest.description}</p>
                                
                                <div className="mb-6 relative h-6 bg-gray-200 rounded-full overflow-hidden">
                                     <div 
                                        className={`absolute top-0 left-0 h-full transition-all duration-500 ${questIsCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}
                                        style={{ width: `${Math.min(100, (playerState.questProgress / currentQuest.target) * 100)}%` }}
                                     ></div>
                                     <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                                         {playerState.questProgress} / {currentQuest.target}
                                     </div>
                                </div>
                                
                                <div className="bg-white p-3 rounded-xl inline-block shadow-sm border border-gray-100 mb-6">
                                     <span className="text-gray-400 uppercase text-xs font-bold block mb-1">Reward</span>
                                     <div className="text-xl font-bold text-green-600 flex items-center gap-2 justify-center">
                                         <Gift className="w-5 h-5" />
                                         {currentQuest.rewardAmount.toLocaleString()} {currentQuest.rewardType.toUpperCase()}
                                     </div>
                                </div>

                                <div>
                                    <button
                                        onClick={handleClaimQuest}
                                        disabled={!questIsCompleted}
                                        className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all
                                            ${questIsCompleted 
                                                ? 'bg-green-500 hover:bg-green-400 text-white animate-pulse' 
                                                : 'bg-gray-300 text-gray-400 cursor-not-allowed'}
                                        `}
                                    >
                                        {questIsCompleted ? "CLAIM REWARD" : "IN PROGRESS"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-400 italic">
                                <div className="text-6xl mb-4">🏆</div>
                                You have completed all available quests! <br/> Check back later for more updates.
                            </div>
                        )}
                        
                        <div className="mt-8 text-xs text-gray-400">
                            Quest {playerState.questIndex + 1} of {CAMPAIGN_QUESTS.length}
                        </div>
                    </div>
                )}

                {uiOpen === 'travel' && (
                    <div>
                         <h2 className="text-3xl font-black text-center mb-6 text-gray-800 flex items-center justify-center gap-2">
                             <Globe className="w-8 h-8" /> Teleport
                         </h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {WORLDS.map(world => {
                                 const isLocked = playerState.speed < world.req;
                                 return (
                                     <button
                                         key={world.id}
                                         disabled={isLocked}
                                         onClick={() => handleTeleport(world.id)}
                                         className={`p-4 rounded-xl border-b-4 text-left transition-all relative overflow-hidden group
                                            ${isLocked 
                                                ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed' 
                                                : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-lg active:scale-95'
                                            }
                                         `}
                                     >
                                         <div className={`font-bold text-lg mb-1 ${!isLocked ? world.color : ''}`}>
                                             {world.name}
                                         </div>
                                         <div className="text-xs text-gray-500 mb-2">{world.desc}</div>
                                         {isLocked ? (
                                             <div className="flex items-center gap-1 text-red-500 text-sm font-bold bg-red-50 p-1 rounded">
                                                 <Lock className="w-3 h-3" /> Needs {world.req.toLocaleString()} Speed
                                             </div>
                                         ) : (
                                              <div className="text-green-500 text-sm font-bold flex items-center gap-1">
                                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Unlocked
                                              </div>
                                         )}
                                         {playerState.world === world.id && (
                                              <div className="absolute top-2 right-2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded-full">
                                                  Current
                                              </div>
                                         )}
                                     </button>
                                 )
                             })}
                         </div>
                    </div>
                )}

                {uiOpen === 'skins' && (
                    <div>
                        <h2 className="text-3xl font-black text-center mb-2 text-gray-800">Skin Shop</h2>
                         <p className="text-center text-gray-500 mb-6 text-sm">
                            Buy skins to boost your stats and LUCK!
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {AVAILABLE_SKINS.map(skin => {
                                const isUnlocked = playerState.unlockedSkins.includes(skin.id);
                                const isEquipped = playerState.equippedSkin === skin.id;
                                
                                let canAfford = false;
                                if(skin.costType === 'speed') canAfford = playerState.speed >= skin.cost;
                                else if(skin.costType === 'jump') canAfford = playerState.jump >= skin.cost;
                                else if(skin.costType === 'attack') canAfford = playerState.attack >= skin.cost;
                                else if(skin.costType === 'health') canAfford = playerState.maxHealth >= skin.cost;
                                else if(skin.costType === 'thorn') canAfford = playerState.thorn >= skin.cost;
                                else if(skin.costType === 'all') {
                                    canAfford = playerState.speed >= skin.cost && 
                                                playerState.jump >= skin.cost && 
                                                playerState.attack >= skin.cost && 
                                                playerState.maxHealth >= skin.cost &&
                                                playerState.thorn >= skin.cost;
                                }

                                let costIcon = '⚡';
                                if (skin.costType === 'jump') costIcon = '⬆️';
                                else if (skin.costType === 'attack') costIcon = '⚔️';
                                else if (skin.costType === 'health') costIcon = '❤️';
                                else if (skin.costType === 'thorn') costIcon = '⚓';
                                else if (skin.costType === 'all') costIcon = ' ALL STATS';
                                
                                return (
                                    <div key={skin.id} className="border-2 border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full border-2 border-black" style={{ backgroundColor: skin.color }}></div>
                                            <div>
                                                <div className="font-bold">{skin.name}</div>
                                                <div className="text-xs text-gray-500">{skin.description}</div>
                                                <div className="flex flex-col mt-1 text-xs font-bold">
                                                    {skin.speedMult > 1 && <span className="text-blue-600">+{Math.round((skin.speedMult - 1)*100)}% Speed</span>}
                                                    {skin.jumpMult > 1 && <span className="text-green-600">+{Math.round((skin.jumpMult - 1)*100)}% Jump</span>}
                                                    {skin.attackMult > 1 && <span className="text-red-600">+{Math.round((skin.attackMult - 1)*100)}% Attack</span>}
                                                    {(skin.healthMult || 0) > 1 && <span className="text-pink-600">+{Math.round(((skin.healthMult || 1) - 1)*100)}% HP</span>}
                                                    {(skin.thornMult || 0) > 1 && <span className="text-emerald-600">+{Math.round(((skin.thornMult || 1) - 1)*100)}% Thorn</span>}
                                                    {(skin.luckMult || 0) > 1 && <span className="text-purple-600">+{Math.round(((skin.luckMult || 1) - 1)*100)}% LUCK</span>}
                                                    {skin.speedMult > 1000 && <span className="text-orange-500 animate-pulse">GOD STATS</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {isUnlocked ? (
                                            <button 
                                                onClick={() => handleEquipSkin(skin.id)}
                                                disabled={isEquipped}
                                                className={`px-4 py-2 rounded-xl font-bold border-b-4 transition-all flex items-center gap-1
                                                    ${isEquipped ? 'bg-gray-800 border-gray-900 text-white cursor-default' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'}
                                                `}
                                            >
                                                {isEquipped ? <Check size={16}/> : 'Equip'}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleBuySkin(skin)}
                                                disabled={!canAfford}
                                                className={`px-4 py-2 rounded-xl font-bold border-b-4 transition-all
                                                    ${canAfford ? 'bg-green-500 hover:bg-green-400 border-green-700 text-white active:scale-95' : 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed'}
                                                `}
                                            >
                                                {skin.cost.toLocaleString()} {costIcon}
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {uiOpen === 'shop' && (
                    <div>
                        <h2 className="text-3xl font-black text-center mb-2 text-gray-800">Pet Shop</h2>
                        <div className="text-center mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-center gap-2 text-sm font-bold text-gray-700 mb-2">
                               <Sparkles className="w-4 h-4 text-purple-500" /> 
                               Current Luck: <span className="text-purple-600 text-lg">{currentLuckMult}x</span>
                            </div>
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Your Chances</div>
                            <div className="flex justify-center gap-2 text-xs font-bold flex-wrap">
                                <span className="text-blue-500">Shiny: {(Math.min(1, MUTATION_CHANCES.SHINY * currentLuckMult) * 100).toFixed(1)}%</span>
                                <span className="text-yellow-600">Gold: {(Math.min(1, MUTATION_CHANCES.GOLD * currentLuckMult) * 100).toFixed(1)}%</span>
                                <span className="text-purple-600 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-600">Rainbow: {(Math.min(1, MUTATION_CHANCES.RAINBOW * currentLuckMult) * 100).toFixed(2)}%</span>
                                <span className="bg-black text-white px-1 rounded">Dark Matter: {(Math.min(1, MUTATION_CHANCES.DARK_MATTER * currentLuckMult) * 100).toFixed(2)}%</span>
                                <span className="text-gray-500">Specialist: {(Math.min(1, MUTATION_CHANCES.SPECIALIST * currentLuckMult) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto pr-2 mb-4">
                            {AVAILABLE_PETS.map(pet => (
                                <div key={pet.id} className="border-2 border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div>
                                        <div className="font-bold text-lg">{pet.name}</div>
                                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-1
                                            ${pet.rarity === PetRarity.COMMON ? 'bg-gray-200 text-gray-600' : ''}
                                            ${pet.rarity === PetRarity.RARE ? 'bg-blue-100 text-blue-600' : ''}
                                            ${pet.rarity === PetRarity.EPIC ? 'bg-purple-100 text-purple-600' : ''}
                                            ${pet.rarity === PetRarity.LEGENDARY ? 'bg-yellow-100 text-yellow-600' : ''}
                                        `}>{pet.rarity}</div>
                                        <div className="text-sm text-gray-500">{pet.description}</div>
                                        <div className="text-green-600 font-bold mt-1 text-sm">+ {pet.multiplier}x Multiplier</div>
                                    </div>
                                    <button 
                                        onClick={() => handleBuyPet(pet)}
                                        disabled={playerState.speed < pet.cost}
                                        className={`px-4 py-2 rounded-xl font-bold border-b-4 transition-all
                                            ${playerState.speed >= pet.cost ? 'bg-green-500 hover:bg-green-400 border-green-700 text-white active:scale-95' : 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed'}
                                        `}
                                    >
                                        {pet.cost.toLocaleString()} ⚡
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-gray-700 mb-2">My Pets ({playerState.pets.length})</h3>
                            <div className="flex gap-2 flex-wrap pb-2 min-h-[40px]">
                                {playerState.pets.length === 0 && <span className="text-gray-400 italic">No pets yet...</span>}
                                {playerState.pets.map((p, idx) => (
                                    <div key={idx} className={`group relative px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap shadow-sm border-b-2 flex items-center gap-1 cursor-help
                                         ${(!p.mutation || p.mutation === 'Normal') ? 'bg-white border-gray-200 text-gray-700' : ''}
                                         ${p.mutation === 'Shiny' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}
                                         ${p.mutation === 'Gold' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : ''}
                                         ${p.mutation === 'Rainbow' ? 'bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 border-purple-300 text-purple-800' : ''}
                                         ${p.mutation === 'Dark Matter' ? 'bg-slate-900 text-purple-300 border-purple-500' : ''}
                                         ${p.mutation === 'Speedy' ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                                         ${p.mutation === 'Jumpy' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                                         ${p.mutation === 'Deadly' ? 'bg-red-100 text-red-800 border-red-300' : ''}
                                         ${p.mutation === 'Tanky' ? 'bg-pink-100 text-pink-800 border-pink-300' : ''}
                                    `}>
                                        {p.mutation === 'Speedy' && <Zap size={12}/>}
                                        {p.mutation === 'Jumpy' && <ArrowUp size={12}/>}
                                        {p.mutation === 'Deadly' && <Sword size={12}/>}
                                        {p.mutation === 'Tanky' && <Shield size={12}/>}
                                        {p.mutation === 'Dark Matter' && <Sparkles size={12}/>}
                                        {p.name} 
                                        <span className="text-xs opacity-75 ml-1">x{p.multiplier.toFixed(1)}</span>

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-3 rounded-xl shadow-2xl z-50 w-48 text-center pointer-events-none border border-gray-700">
                                            <div className="font-bold border-b border-gray-700 pb-1 mb-2 text-yellow-400">{p.name}</div>
                                            <div className="grid grid-cols-1 gap-1 text-[11px]">
                                                <div className="flex justify-between"><span>Base Mult:</span> <span className="font-mono">x{p.multiplier.toFixed(1)}</span></div>
                                                {p.speedMult && p.speedMult > 0 ? <div className="flex justify-between text-blue-300"><span>Speed:</span> <span className="font-mono">+{p.speedMult.toFixed(1)}x</span></div> : null}
                                                {p.jumpMult && p.jumpMult > 0 ? <div className="flex justify-between text-green-300"><span>Jump:</span> <span className="font-mono">+{p.jumpMult.toFixed(1)}x</span></div> : null}
                                                {p.attackMult && p.attackMult > 0 ? <div className="flex justify-between text-red-300"><span>Attack:</span> <span className="font-mono">+{p.attackMult.toFixed(1)}x</span></div> : null}
                                                {p.healthMult && p.healthMult > 0 ? <div className="flex justify-between text-pink-300"><span>Health:</span> <span className="font-mono">+{p.healthMult.toFixed(1)}x</span></div> : null}
                                                {p.thornMult && p.thornMult > 0 ? <div className="flex justify-between text-emerald-300"><span>Thorn:</span> <span className="font-mono">+{p.thornMult.toFixed(1)}x</span></div> : null}
                                                {!p.speedMult && !p.jumpMult && !p.attackMult && !p.healthMult && !p.thornMult && <div className="text-gray-500 italic mt-1">No special stats</div>}
                                            </div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {uiOpen === 'rebirth' && (
                    <div className="text-center">
                        <h2 className="text-3xl font-black mb-2 text-red-600">Rebirth?</h2>
                        <p className="text-gray-600 mb-8">Reset Stats to gain a permanent Multiplier!</p>
                        
                        <div className="flex justify-center gap-8 mb-8">
                            <div className="bg-gray-100 p-4 rounded-xl">
                                <div className="text-sm text-gray-500 uppercase font-bold">Current</div>
                                <div className="text-3xl font-black">{playerState.rebirths + 1}x</div>
                            </div>
                            <div className="text-4xl self-center">➔</div>
                             <div className="bg-red-100 p-4 rounded-xl text-red-900">
                                <div className="text-sm text-red-400 uppercase font-bold">New</div>
                                <div className="text-3xl font-black">{playerState.rebirths + 2}x</div>
                            </div>
                        </div>

                        <button 
                             onClick={handleRebirth}
                             disabled={playerState.speed < rebirthCost}
                             className={`w-full py-4 rounded-xl font-bold text-xl border-b-4 transition-all
                                ${playerState.speed >= rebirthCost ? 'bg-red-500 hover:bg-red-400 border-red-700 text-white' : 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed'}
                             `}
                        >
                            Cost: {rebirthCost.toLocaleString()} Speed
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
      
      {/* Controls Hint */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs font-mono pointer-events-none">
          WASD / Arrows to Move • Space to Jump • Click Enemies to Attack
      </div>
    </div>
  );
};

export default App;