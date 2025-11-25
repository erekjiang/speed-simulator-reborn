
import React, { useRef, useEffect, useState } from 'react';
import { PlayerState, Platform, Collectible, EnemyDef, Skin } from '../types';
import { CONFIG, ALL_PLATFORMS, ALL_COLLECTIBLES, AVAILABLE_SKINS, ENEMIES } from '../constants';

interface GameCanvasProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  onFinishObby: () => void;
  onEnemyKill: (enemy: ActiveEnemy) => void;
}

export interface ActiveEnemy extends EnemyDef {
    currentHp: number;
    respawnTimer: number; // 0 = alive, >0 = time until respawn
    flashTimer: number;
    level: number; // Tracks how many times it has respawned/leveled up
}

interface FloatingText {
    id: number;
    x: number;
    y: number;
    text: string;
    life: number;
    color: string;
}

function checkRectCollision(player: { x: number; y: number; w: number; h: number }, rect: {x: number, y: number, width: number, height: number}) {
  return (
    player.x < rect.x + rect.width &&
    player.x + player.w > rect.x &&
    player.y < rect.y + rect.height &&
    player.y + player.h > rect.y
  );
}

function checkCircleCollision(player: { x: number; y: number; w: number; h: number }, circle: Collectible) {
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const dist = Math.sqrt(Math.pow(playerCenterX - circle.x, 2) + Math.pow(playerCenterY - circle.y, 2));
    return dist < (player.w / 2 + circle.radius);
}

const PLAYER_SIZE = 30;

const GameCanvas: React.FC<GameCanvasProps> = ({ playerState, setPlayerState, onFinishObby, onEnemyKill }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  const stateRef = useRef(playerState);
  const prevPlayerStateRef = useRef(playerState);
  const lastFinishTime = useRef(0);
  const invincibilityTimer = useRef(0);
  const damageFlashTimer = useRef(0);
  
  // Local Game State
  const enemiesRef = useRef<ActiveEnemy[]>([]);
  const textsRef = useRef<FloatingText[]>([]);

  // --- SMART STATE SYNC ---
  useEffect(() => {
    const curr = playerState;
    const prev = prevPlayerStateRef.current;

    stateRef.current.speed = curr.speed;
    stateRef.current.jump = curr.jump;
    stateRef.current.attack = curr.attack;
    stateRef.current.thorn = curr.thorn; // Sync Thorn
    stateRef.current.rebirths = curr.rebirths;
    stateRef.current.pets = curr.pets;
    stateRef.current.collectedIds = curr.collectedIds;
    stateRef.current.equippedSkin = curr.equippedSkin;
    stateRef.current.unlockedSkins = curr.unlockedSkins;
    
    // Sync Max Health changes
    if (curr.maxHealth !== prev.maxHealth) {
         stateRef.current.maxHealth = curr.maxHealth;
    }
    // We generally trust local health, but if it comes from save/load, we take it
    if (Math.abs(curr.health - prev.health) > 1 && curr.health !== stateRef.current.health) {
        stateRef.current.health = curr.health;
    }
    
    if (curr.teleportId !== prev.teleportId) {
       stateRef.current.world = curr.world;
       stateRef.current.position = curr.position;
       stateRef.current.velocity = curr.velocity;
       stateRef.current.checkpoint = curr.checkpoint;
       stateRef.current.teleportId = curr.teleportId;
       // Full Heal on teleport
       stateRef.current.health = curr.maxHealth;
       setPlayerState(prevS => ({ ...prevS, health: curr.maxHealth }));
       
       // Initialize enemies for the new world
       enemiesRef.current = ENEMIES.filter(e => e.world === curr.world).map(e => ({
           ...e,
           currentHp: e.maxHp,
           respawnTimer: 0,
           flashTimer: 0,
           level: 1 // Start at Level 1
       }));
       textsRef.current = [];
    }

    prevPlayerStateRef.current = curr;
  }, [playerState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleEnemyHit = (enemy: ActiveEnemy, damage: number) => {
      enemy.currentHp -= damage;
      enemy.flashTimer = 5;
      
      // Floating Text for Damage
      textsRef.current.push({
          id: Math.random(),
          x: enemy.x + enemy.width/2,
          y: enemy.y,
          text: `-${Math.floor(damage).toLocaleString()}`,
          life: 30,
          color: '#fff'
      });

      if (enemy.currentHp <= 0) {
          // Kill logic
          enemy.currentHp = 0;
          enemy.respawnTimer = 180; // 3 seconds
          
          // Reward logic passed to App.tsx
          onEnemyKill(enemy);

          // Show floating text for the kill
          let rewardLabel = "REWARD!";
          if (enemy.rewardType === 'speed') rewardLabel = 'SPD';
          if (enemy.rewardType === 'jump') rewardLabel = 'JMP';
          if (enemy.rewardType === 'health') rewardLabel = 'HP';
          if (enemy.rewardType === 'attack') rewardLabel = 'ATK';
          if (enemy.rewardType === 'thorn') rewardLabel = 'THRN';
          
          const rewardVal = Math.floor(enemy.reward * (1 + stateRef.current.rebirths));

          textsRef.current.push({
              id: Math.random(),
              x: enemy.x + enemy.width/2,
              y: enemy.y - 20,
              text: `+${rewardVal.toLocaleString()} ${rewardLabel}`,
              life: 60,
              color: '#fbbf24'
          });
          
          // SCALING LOGIC: Make them stronger!
          enemy.level = (enemy.level || 1) + 1;
          const hpScale = 1.2; // +20% HP
          const dmgScale = 1.1; // +10% Damage
          const rewardScale = 1.15; // +15% Reward

          enemy.maxHp = Math.floor(enemy.maxHp * hpScale);
          enemy.damage = Math.floor(enemy.damage * dmgScale);
          enemy.reward = Math.floor(enemy.reward * rewardScale);

          // Reset HP for next spawn (hidden until timer ends)
          enemy.currentHp = enemy.maxHp;

          // Level Up Text
          textsRef.current.push({
              id: Math.random(),
              x: enemy.x + enemy.width/2,
              y: enemy.y - 50,
              text: `LVL UP! Now Lvl ${enemy.level}`,
              life: 80,
              color: '#a855f7'
          });
      }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Transform click to world coordinates
      const currentState = stateRef.current;
      let camX = -currentState.position.x + canvas.width / 2 - PLAYER_SIZE / 2;
      let camY = -currentState.position.y + canvas.height * 0.6;
      if (camY > 100) camY = 100;

      const worldX = clickX - camX;
      const worldY = clickY - camY;

      const attackDamage = currentState.attack || 1;

      enemiesRef.current.forEach(enemy => {
          if (enemy.respawnTimer > 0) return;
          
          if (
              worldX >= enemy.x && worldX <= enemy.x + enemy.width &&
              worldY >= enemy.y && worldY <= enemy.y + enemy.height
          ) {
              handleEnemyHit(enemy, attackDamage);
          }
      });
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = stateRef.current;
    let { x, y } = currentState.position;
    let { x: vx, y: vy } = currentState.velocity;
    
    // --- PHYSICS ---

    // 1. Movement
    const speedMultiplier = 1 + Math.log(currentState.speed + 1) * 0.5; 
    const moveSpeed = CONFIG.moveSpeedBase * speedMultiplier;

    if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) {
      vx = -moveSpeed;
    } else if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) {
      vx = moveSpeed;
    } else {
      vx *= CONFIG.friction;
    }

    vy += CONFIG.gravity;

    // Jump
    const jumpMultiplier = 1 + Math.log(currentState.jump + 1) * 0.15;
    const currentJumpForce = CONFIG.jumpForce * jumpMultiplier;

    if ((keysPressed.current['Space'] || keysPressed.current['ArrowUp']) && currentState.isGrounded) {
      vy = currentJumpForce;
    }

    x += vx;
    y += vy;

    // 2. Collision with Platforms
    const currentPlatforms = ALL_PLATFORMS.filter(p => p.world === currentState.world);
    const currentCollectibles = ALL_COLLECTIBLES.filter(c => c.world === currentState.world && !currentState.collectedIds.includes(c.id));

    const playerBox = { x, y, w: PLAYER_SIZE, h: PLAYER_SIZE };
    let onPlatform = false;

    for (const plat of currentPlatforms) {
      if (checkRectCollision(playerBox, plat)) {
        
        if (plat.type === 'hazard') {
            // Instant death hazard
            stateRef.current.health = 0; 
            continue; 
        }

        if (plat.type === 'checkpoint') {
            if (currentState.checkpoint.x !== plat.x || currentState.checkpoint.y !== plat.y - 50) {
                const newCheckpoint = { x: plat.x + plat.width / 2 - PLAYER_SIZE/2, y: plat.y - 50 };
                setPlayerState(prev => ({ ...prev, checkpoint: newCheckpoint }));
                currentState.checkpoint = newCheckpoint;
            }
        }

        if (plat.type === 'portal' && plat.portalTarget) {
            if (currentState.speed >= (plat.portalReq || 0)) {
                const target = plat.portalTarget;
                setPlayerState(prev => ({
                    ...prev,
                    world: target.world,
                    position: { x: target.x, y: target.y },
                    checkpoint: { x: target.x, y: target.y },
                    velocity: { x: 0, y: 0 },
                    health: prev.maxHealth, // Full heal on travel
                    teleportId: prev.teleportId + 1
                }));
                stateRef.current = {
                    ...currentState,
                    world: target.world,
                    position: { x: target.x, y: target.y },
                    checkpoint: { x: target.x, y: target.y },
                    velocity: { x: 0, y: 0 },
                    health: currentState.maxHealth
                };
                return;
            }
        }

        if (plat.type === 'finish') {
             const now = Date.now();
             if (now - lastFinishTime.current > 2000) {
                 lastFinishTime.current = now;
                 onFinishObby();
                 const hubPos = { x: -50, y: 500 };
                 stateRef.current = {
                     ...currentState,
                     world: 1,
                     position: hubPos,
                     checkpoint: hubPos,
                     velocity: { x: 0, y: 0 },
                     health: currentState.maxHealth
                 };
                 return;
             }
        }

        if (plat.type !== 'portal' && plat.type !== 'finish') {
             const prevY = currentState.position.y;
             if (prevY + PLAYER_SIZE <= plat.y + 15 && vy >= 0) {
                y = plat.y - PLAYER_SIZE;
                vy = 0;
                onPlatform = true;
             }
        }
      }
    }

    // 3. Collectibles
    let collectedItem: Collectible | null = null;
    for (const item of currentCollectibles) {
        if (checkCircleCollision(playerBox, item)) {
            collectedItem = item;
            break;
        }
    }

    if (collectedItem) {
        setPlayerState(prev => ({
            ...prev,
            speed: prev.speed + collectedItem!.value,
            collectedIds: [...prev.collectedIds, collectedItem!.id]
        }));
    }
    
    // 4. Enemy Collision & Damage
    if (invincibilityTimer.current > 0) invincibilityTimer.current--;
    if (damageFlashTimer.current > 0) damageFlashTimer.current--;

    enemiesRef.current.forEach(enemy => {
        if (enemy.respawnTimer > 0) return;
        
        if (
            x < enemy.x + enemy.width &&
            x + PLAYER_SIZE > enemy.x &&
            y < enemy.y + enemy.height &&
            y + PLAYER_SIZE > enemy.y
        ) {
            if (invincibilityTimer.current <= 0) {
                 // Take Damage
                 const dmg = enemy.damage;
                 currentState.health = Math.max(0, currentState.health - dmg);
                 invincibilityTimer.current = 60; // 1 sec invincibility
                 damageFlashTimer.current = 10;
                 
                 textsRef.current.push({
                      id: Math.random(),
                      x: x,
                      y: y - 30,
                      text: `-${dmg} HP`,
                      life: 45,
                      color: '#ef4444'
                 });

                 // THORN DAMAGE LOGIC
                 if (currentState.thorn > 0) {
                     handleEnemyHit(enemy, currentState.thorn);
                     textsRef.current.push({
                        id: Math.random(),
                        x: enemy.x + enemy.width/2,
                        y: enemy.y - 40,
                        text: `-${Math.floor(currentState.thorn)} (Thorn)`,
                        life: 45,
                        color: '#10b981'
                    });
                 }
            }
        }
    });
    
    // 5. Health Regen
    if (currentState.health < currentState.maxHealth && currentState.health > 0) {
        currentState.health = Math.min(currentState.maxHealth, currentState.health + (currentState.maxHealth * 0.001));
    }
    
    // Sync Health to UI occasionally
    if (Math.floor(Date.now() / 1000) % 1 === 0 || invincibilityTimer.current === 59) {
         setPlayerState(prev => {
             if (Math.abs(prev.health - currentState.health) > 1) {
                 return { ...prev, health: currentState.health };
             }
             return prev;
         });
    }

    // 6. Death / Void
    if (y > canvas.height + 1000 || currentState.health <= 0) {
       // Respawn logic
       x = currentState.checkpoint.x;
       y = currentState.checkpoint.y;
       vy = 0;
       vx = 0;
       currentState.health = currentState.maxHealth; // Reset HP
       
       textsRef.current.push({
           id: Math.random(),
           x: x,
           y: y - 50,
           text: "RESPAWN!",
           life: 60,
           color: '#ef4444'
       });
       setPlayerState(prev => ({ ...prev, health: prev.maxHealth }));
    }

    // Update Ref
    stateRef.current = {
        ...currentState,
        position: { x, y },
        velocity: { x: vx, y: vy },
        isGrounded: onPlatform
    };

    // --- RENDER ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    let camX = -x + canvas.width / 2 - PLAYER_SIZE / 2;
    let camY = -y + canvas.height * 0.6;
    if (camY > 100) camY = 100;
    
    ctx.translate(camX, camY);

    // Platforms
    currentPlatforms.forEach(plat => {
        if (plat.type === 'portal') {
            ctx.fillStyle = plat.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Fredoka One';
            ctx.fillText(plat.portalName || "Portal", plat.x - 20, plat.y - 30);
            const locked = currentState.speed < (plat.portalReq || 0);
            ctx.fillStyle = locked ? '#ef4444' : '#4ade80';
            ctx.font = '14px Inter';
            ctx.fillText(locked ? `🔒 Need ${plat.portalReq}` : 'Open!', plat.x - 10, plat.y - 10);
        } else if (plat.type === 'hazard') {
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
            ctx.fillStyle = '#fca5a5';
            for(let sx = 0; sx < plat.width; sx+=20) {
                ctx.fillRect(plat.x + sx, plat.y + Math.random()*5, 10, 5);
            }
        } else if (plat.type === 'checkpoint') {
            ctx.fillStyle = plat.color;
            ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Inter';
            ctx.fillText("CHECKPOINT", plat.x + 10, plat.y - 10);
        } else if (plat.type === 'finish') {
            ctx.fillStyle = plat.color;
            ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
            ctx.fillStyle = 'yellow';
            ctx.font = '30px Fredoka One';
            ctx.fillText("FINISH!", plat.x + 10, plat.y - 40);
        } else {
            ctx.fillStyle = plat.color;
            ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(plat.x, plat.y + plat.height - 5, plat.width, 5);
        }
    });

    // Enemies
    enemiesRef.current.forEach(enemy => {
        if (enemy.respawnTimer > 0) {
            enemy.respawnTimer--;
            return;
        }
        
        if (enemy.flashTimer > 0) enemy.flashTimer--;

        // Simple idle animation
        const bounce = Math.sin(Date.now() / 200) * 5;
        
        ctx.fillStyle = enemy.flashTimer > 0 ? 'white' : enemy.color;
        ctx.fillRect(enemy.x, enemy.y + bounce, enemy.width, enemy.height);

        // Face
        ctx.fillStyle = 'black';
        ctx.fillRect(enemy.x + 10, enemy.y + 10 + bounce, 5, 5);
        ctx.fillRect(enemy.x + enemy.width - 15, enemy.y + 10 + bounce, 5, 5);

        // Boss Badge & Level Display
        if (enemy.isBoss) {
            ctx.fillStyle = 'gold';
            ctx.font = 'bold 16px Fredoka One';
            ctx.fillText(`BOSS LVL ${enemy.level}`, enemy.x, enemy.y - 30 + bounce);
        } else {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Inter';
            ctx.fillText(`Lvl ${enemy.level}`, enemy.x, enemy.y - 25 + bounce);
        }

        // HP Bar
        const hpPct = Math.max(0, enemy.currentHp / enemy.maxHp);
        ctx.fillStyle = 'black';
        ctx.fillRect(enemy.x, enemy.y - 15 + bounce, enemy.width, 8);
        ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : '#ef4444';
        ctx.fillRect(enemy.x + 1, enemy.y - 14 + bounce, (enemy.width - 2) * hpPct, 6);
        
        // HP Text (Simplified for large numbers)
        ctx.fillStyle = 'white';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        let hpText = Math.ceil(enemy.currentHp).toLocaleString();
        if (enemy.currentHp > 1000000000000) hpText = (enemy.currentHp / 1000000000000).toFixed(1) + 'T';
        else if (enemy.currentHp > 1000000000) hpText = (enemy.currentHp / 1000000000).toFixed(1) + 'B';
        else if (enemy.currentHp > 1000000) hpText = (enemy.currentHp / 1000000).toFixed(1) + 'M';
        
        ctx.fillText(hpText, enemy.x + enemy.width/2, enemy.y - 20 + bounce);
        ctx.textAlign = 'left';
    });

    // Collectibles
    const time = Date.now() / 500;
    currentCollectibles.forEach(c => {
        const bobY = Math.sin(time + c.x) * 10;
        const gradient = ctx.createRadialGradient(c.x, c.y + bobY, c.radius * 0.2, c.x, c.y + bobY, c.radius * 2);
        gradient.addColorStop(0, c.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(c.x, c.y + bobY, c.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y + bobY, c.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Player
    const skin = AVAILABLE_SKINS.find(s => s.id === currentState.equippedSkin);
    const playerColor = skin ? skin.color : '#ef4444';
    
    if (damageFlashTimer.current > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.fillStyle = 'white';
    } else {
        ctx.fillStyle = playerColor;
    }
    
    if (invincibilityTimer.current > 0 && invincibilityTimer.current % 10 < 5) {
        ctx.globalAlpha = 0.5;
    }

    ctx.fillRect(x, y, PLAYER_SIZE, PLAYER_SIZE);
    
    ctx.fillStyle = 'black';
    ctx.fillRect(x + 5, y + 8, 5, 5);
    ctx.fillRect(x + 20, y + 8, 5, 5);
    ctx.beginPath();
    ctx.arc(x + 15, y + 20, 5, 0, Math.PI);
    ctx.stroke();
    
    // Spikes for Thorn stat
    if (currentState.thorn > 0) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 5, y + 5); ctx.lineTo(x, y + 10);
        ctx.moveTo(x + PLAYER_SIZE + 5, y + 5); ctx.lineTo(x + PLAYER_SIZE, y + 10);
        ctx.moveTo(x + 15, y - 5); ctx.lineTo(x + 15, y);
        ctx.stroke();
    }

    ctx.globalAlpha = 1.0;

    // Trail
    if (currentState.speed > 500) {
        for(let i=1; i<4; i++) {
           ctx.globalAlpha = 0.3 / i;
           ctx.fillStyle = playerColor;
           ctx.fillRect(x - vx * i * 2, y, PLAYER_SIZE, PLAYER_SIZE);
        }
        ctx.globalAlpha = 1.0;
    }
    
    // Floating Texts
    textsRef.current.forEach((t, i) => {
        t.y -= 1;
        t.life--;
        ctx.fillStyle = t.color;
        ctx.font = 'bold 16px Fredoka One';
        ctx.fillText(t.text, t.x, t.y);
    });
    textsRef.current = textsRef.current.filter(t => t.life > 0);

    ctx.restore();
    
    // Damage Vignette
    if (damageFlashTimer.current > 0) {
         ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [onFinishObby]);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
       <div className={`absolute inset-0 opacity-50 transition-colors duration-1000 
           ${playerState.world === 1 ? 'bg-gradient-to-b from-sky-400 to-green-200' : ''}
           ${playerState.world === 2 ? 'bg-gradient-to-b from-indigo-900 to-purple-900' : ''}
           ${playerState.world === 3 ? 'bg-gradient-to-b from-orange-900 to-red-900' : ''}
           ${playerState.world === 4 ? 'bg-gradient-to-b from-gray-900 to-black' : ''}
       `}></div>
       
       <canvas 
        ref={canvasRef}
        onClick={handleCanvasClick}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block relative z-10 cursor-crosshair"
       />
    </div>
  );
};

export default GameCanvas;
