
import React, { useState, useCallback, useEffect } from 'react';
import { PlayerState, Pet, PetRarity } from './types';
import { REBIRTH_COST_BASE, AVAILABLE_PETS } from './constants';
import GameCanvas from './components/GameCanvas';
import { getGeminiGameTip } from './services/geminiService';
import { Zap, ShoppingBag, Repeat, Home, MessageSquare, ArrowUp } from 'lucide-react';

const App: React.FC = () => {
  // --- Game State ---
  const [playerState, setPlayerState] = useState<PlayerState>({
    speed: 0,
    jump: 0,
    rebirths: 0,
    pets: [],
    world: 1, // Start in Hub
    position: { x: -50, y: 500 }, // Spawn in middle of hub
    velocity: { x: 0, y: 0 },
    isGrounded: false,
    checkpoint: { x: -50, y: 500 },
    collectedIds: [],
    teleportId: 0
  });

  const [uiOpen, setUiOpen] = useState<'shop' | 'rebirth' | null>(null);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // --- Derived Stats ---
  const petMultiplier = playerState.pets.reduce((acc, pet) => acc + pet.multiplier, 0);
  const clickPower = (1 + playerState.rebirths) * (1 + petMultiplier);
  const rebirthCost = REBIRTH_COST_BASE * Math.pow(2, playerState.rebirths);

  // --- Actions ---
  const handleClick = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      speed: prev.speed + clickPower
    }));
  }, [clickPower]);

  const handleJumpClick = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      jump: prev.jump + clickPower
    }));
  }, [clickPower]);

  // Global Key Listener for 'E' (Speed) and 'R' (Jump)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        handleClick();
      }
      if (e.code === 'KeyR') {
        handleJumpClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick, handleJumpClick]);

  const handleRebirth = () => {
    if (playerState.speed >= rebirthCost) {
      setPlayerState(prev => ({
        ...prev,
        speed: 0,
        jump: 0, // Reset Jump as well
        rebirths: prev.rebirths + 1,
        world: 1, // Reset to hub
        position: { x: -50, y: 500 },
        collectedIds: [],
        teleportId: prev.teleportId + 1 // Force Teleport
      }));
      setUiOpen(null);
    }
  };

  const handleBuyPet = (pet: Pet) => {
    if (playerState.speed >= pet.cost) {
      setPlayerState(prev => ({
        ...prev,
        speed: prev.speed - pet.cost,
        pets: [...prev.pets, { ...pet, id: pet.id + Math.random() }]
      }));
    }
  };

  const handleGoHome = (e?: React.MouseEvent<HTMLButtonElement>) => {
       // Remove focus from button so game controls work immediately
       e?.currentTarget.blur();
       
       setPlayerState(prev => ({
           ...prev,
           world: 1,
           position: { x: -50, y: 500 },
           checkpoint: { x: -50, y: 500 },
           velocity: { x: 0, y: 0 },
           teleportId: prev.teleportId + 1 // Force Teleport
       }));
  };

  const handleFinishObby = useCallback(() => {
     const reward = 500 * (playerState.rebirths + 1);
     setPlayerState(prev => ({
         ...prev,
         speed: prev.speed + reward
     }));
  }, [playerState.rebirths]);

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

  const openUi = (type: 'shop' | 'rebirth', e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur();
      setUiOpen(uiOpen === type ? null : type);
  }

  return (
    <div className="relative w-screen h-screen bg-black select-none">
      <audio id="bg-music" loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" />
      
      {/* Game World Render */}
      <GameCanvas 
        playerState={playerState} 
        setPlayerState={setPlayerState} 
        onFinishObby={handleFinishObby}
      />

      {/* --- HUD --- */}
      
      {/* Stats Bar */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-50">
         {/* Speed Stat */}
         <div className="bg-blue-600 border-b-4 border-blue-800 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-300 fill-current animate-pulse" />
            <div>
               <div className="text-xs uppercase opacity-80 font-bold tracking-wider">Speed</div>
               <div className="text-2xl font-display">{Math.floor(playerState.speed).toLocaleString()}</div>
            </div>
         </div>
         
         {/* Jump Stat */}
         <div className="bg-sky-500 border-b-4 border-sky-700 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <ArrowUp className="w-6 h-6 text-white" />
            <div>
               <div className="text-xs uppercase opacity-80 font-bold tracking-wider">Jump Power</div>
               <div className="text-2xl font-display">{Math.floor(playerState.jump).toLocaleString()}</div>
            </div>
         </div>

         {/* Rebirth Stat */}
         <div className="bg-purple-600 border-b-4 border-purple-800 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <Repeat className="w-6 h-6 text-white" />
            <div>
               <div className="text-xs uppercase opacity-80 font-bold tracking-wider">Rebirths</div>
               <div className="text-2xl font-display">{playerState.rebirths}</div>
            </div>
         </div>
         
         {playerState.world !== 1 && (
             <div className="bg-orange-600 border-b-4 border-orange-800 text-white px-6 py-2 rounded-xl shadow-lg font-bold animate-pulse">
                 {playerState.world === 2 ? "CYBER WORLD" : "MAGMA CAVERNS"}
             </div>
         )}
      </div>

      {/* Training Buttons (Bottom Center) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-end gap-6">
         
         {/* Speed Button */}
         <div className="flex flex-col items-center">
             <div className="mb-2 text-white font-bold text-shadow text-lg animate-bounce">Press <span className="bg-white text-black px-1 rounded mx-1">E</span></div>
             <button 
               onClick={(e) => {
                   handleClick();
                   e.currentTarget.blur();
               }}
               className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 transition-all border-b-8 border-yellow-600 text-yellow-900 rounded-full w-24 h-24 flex items-center justify-center shadow-2xl group relative"
             >
                <Zap className="w-12 h-12 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-10 bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                   Train Speed
                </span>
             </button>
         </div>

         {/* Jump Button */}
         <div className="flex flex-col items-center">
             <div className="mb-2 text-white font-bold text-shadow text-lg animate-bounce">Press <span className="bg-white text-black px-1 rounded mx-1">R</span></div>
             <button 
               onClick={(e) => {
                   handleJumpClick();
                   e.currentTarget.blur();
               }}
               className="bg-blue-400 hover:bg-blue-300 active:scale-95 transition-all border-b-8 border-blue-600 text-blue-900 rounded-full w-24 h-24 flex items-center justify-center shadow-2xl group relative"
             >
                <ArrowUp className="w-12 h-12 group-hover:scale-110 transition-transform" />
                 <span className="absolute -top-10 bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                   Train Jump
                </span>
             </button>
         </div>

      </div>

      {/* Right Side Menu */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-50">
         <button 
            onClick={(e) => openUi('shop', e)}
            className="bg-green-500 hover:bg-green-400 border-b-4 border-green-700 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
         >
            <ShoppingBag className="w-6 h-6" />
            <span className="font-bold hidden md:block">Pets</span>
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
            className="bg-indigo-600 hover:bg-indigo-500 border-b-4 border-indigo-800 text-white p-3 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
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
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-indigo-900 px-6 py-4 rounded-2xl shadow-2xl z-[60] max-w-md text-center border-2 border-indigo-200 animate-bounce">
              <p className="font-bold text-lg mb-1">🧙‍♂️ Game Master Says:</p>
              <p>{aiMessage}</p>
          </div>
      )}

      {/* Modals */}
      {uiOpen && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative animate-[popIn_0.2s_ease-out]">
                <button 
                   onClick={() => setUiOpen(null)}
                   className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
                >
                    Close ✕
                </button>

                {uiOpen === 'shop' && (
                    <div>
                        <h2 className="text-3xl font-black text-center mb-6 text-gray-800">Pet Shop</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
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
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {playerState.pets.length === 0 && <span className="text-gray-400 italic">No pets yet...</span>}
                                {playerState.pets.map((p, idx) => (
                                    <div key={idx} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap">
                                        {p.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {uiOpen === 'rebirth' && (
                    <div className="text-center">
                        <h2 className="text-3xl font-black mb-2 text-red-600">Rebirth?</h2>
                        <p className="text-gray-600 mb-8">Reset Speed & Jump to gain a permanent Multiplier!</p>
                        
                        <div className="flex justify-center gap-8 mb-8">
                            <div className="bg-gray-100 p-4 rounded-xl">
                                <div className="text-sm text-gray-500 uppercase font-bold">Current Multiplier</div>
                                <div className="text-3xl font-black">{playerState.rebirths + 1}x</div>
                            </div>
                            <div className="text-4xl self-center">➔</div>
                             <div className="bg-red-100 p-4 rounded-xl text-red-900">
                                <div className="text-sm text-red-400 uppercase font-bold">New Multiplier</div>
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
                            Rebirth Cost: {rebirthCost.toLocaleString()} Speed
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
      
      {/* Controls Hint */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs font-mono pointer-events-none">
          WASD / Arrows to Move • Space to Jump
      </div>
    </div>
  );
};

export default App;
