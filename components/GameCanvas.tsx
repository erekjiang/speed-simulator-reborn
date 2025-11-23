
import React, { useRef, useEffect } from 'react';
import { PlayerState, Platform, Collectible } from '../types';
import { CONFIG, ALL_PLATFORMS, ALL_COLLECTIBLES } from '../constants';

interface GameCanvasProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  onFinishObby: () => void;
}

// AABB Collision for Rectangles
function checkRectCollision(player: { x: number; y: number; w: number; h: number }, rect: {x: number, y: number, width: number, height: number}) {
  return (
    player.x < rect.x + rect.width &&
    player.x + player.w > rect.x &&
    player.y < rect.y + rect.height &&
    player.y + player.h > rect.y
  );
}

// Circle Collision for Collectibles
function checkCircleCollision(player: { x: number; y: number; w: number; h: number }, circle: Collectible) {
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const dist = Math.sqrt(Math.pow(playerCenterX - circle.x, 2) + Math.pow(playerCenterY - circle.y, 2));
    return dist < (player.w / 2 + circle.radius);
}

const PLAYER_SIZE = 30;

const GameCanvas: React.FC<GameCanvasProps> = ({ playerState, setPlayerState, onFinishObby }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  const stateRef = useRef(playerState);
  const prevPlayerStateRef = useRef(playerState);

  // --- SMART STATE SYNC ---
  // Only overwrite physics position if it was explicitly changed in App (Teleport),
  // otherwise keep local physics position while updating other stats (Speed).
  useEffect(() => {
    const curr = playerState;
    const prev = prevPlayerStateRef.current;

    // Always update stats
    stateRef.current.speed = curr.speed;
    stateRef.current.jump = curr.jump;
    stateRef.current.rebirths = curr.rebirths;
    stateRef.current.pets = curr.pets;
    stateRef.current.collectedIds = curr.collectedIds;
    
    // Only update position/world if teleportId changed
    if (curr.teleportId !== prev.teleportId) {
       stateRef.current.world = curr.world;
       stateRef.current.position = curr.position;
       stateRef.current.velocity = curr.velocity;
       stateRef.current.checkpoint = curr.checkpoint;
       stateRef.current.teleportId = curr.teleportId;
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

    // Jump Logic with Jump Stat
    const jumpMultiplier = 1 + Math.log(currentState.jump + 1) * 0.15; // Scale jump force with jump stat
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
        
        // Hazard Logic
        if (plat.type === 'hazard') {
            // Respawn logic
            x = currentState.checkpoint.x;
            y = currentState.checkpoint.y;
            vx = 0;
            vy = 0;
            continue; 
        }

        // Portal Logic
        if (plat.type === 'portal' && plat.portalTarget) {
            // Check requirements
            if (currentState.speed >= (plat.portalReq || 0)) {
                // Teleport!
                const target = plat.portalTarget;
                
                // 1. Trigger React Update
                setPlayerState(prev => ({
                    ...prev,
                    world: target.world,
                    position: { x: target.x, y: target.y },
                    checkpoint: { x: target.x, y: target.y },
                    velocity: { x: 0, y: 0 },
                    teleportId: prev.teleportId + 1 // Increment ID so effect knows to sync
                }));

                // 2. Immediate Local Update (Prevents physics loops before React renders)
                stateRef.current = {
                    ...currentState,
                    world: target.world,
                    position: { x: target.x, y: target.y },
                    checkpoint: { x: target.x, y: target.y },
                    velocity: { x: 0, y: 0 },
                    // Note: teleportId in ref will be updated by effect later, 
                    // but we update world/pos now to stop this 'if' block from running next frame
                };

                return; // Stop frame to prevent glitches
            }
        }

        // Finish Logic
        if (plat.type === 'finish') {
             onFinishObby();
             // Teleport back to Hub
             const hubPos = { x: -50, y: 500 };
             setPlayerState(prev => ({
                 ...prev,
                 world: 1,
                 position: hubPos,
                 checkpoint: hubPos,
                 velocity: { x: 0, y: 0 },
                 teleportId: prev.teleportId + 1
             }));
             
             // Immediate local update
             stateRef.current = {
                 ...currentState,
                 world: 1,
                 position: hubPos,
                 checkpoint: hubPos,
                 velocity: { x: 0, y: 0 }
             };
             return;
        }

        // Solid Ground Logic (Only land if falling downwards)
        const prevY = currentState.position.y;
        if (prevY + PLAYER_SIZE <= plat.y + 10 && vy >= 0) {
            y = plat.y - PLAYER_SIZE;
            vy = 0;
            onPlatform = true;
        }
      }
    }

    // 3. Collision with Collectibles
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

    // 4. Void Death
    if (y > canvas.height + 500) {
       x = currentState.checkpoint.x;
       y = currentState.checkpoint.y;
       vy = 0;
    }

    // Update Ref for next frame
    stateRef.current = {
        ...currentState,
        position: { x, y },
        velocity: { x: vx, y: vy },
        isGrounded: onPlatform
    };

    // --- RENDER ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Camera
    let camX = -x + canvas.width / 2 - PLAYER_SIZE / 2;
    let camY = -y + canvas.height * 0.6;
    // Limit Camera Y so we don't see too much sky/void
    if (camY > 100) camY = 100;
    
    ctx.translate(camX, camY);

    // Draw Portals Background (behind player)
    currentPlatforms.filter(p => p.type === 'portal').forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.globalAlpha = 1.0;
        
        // Portal Frame
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeRect(p.x, p.y, p.width, p.height);

        // Portal Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Fredoka One';
        ctx.fillText(p.portalName || "Portal", p.x - 20, p.y - 30);
        
        const locked = currentState.speed < (p.portalReq || 0);
        ctx.fillStyle = locked ? '#ef4444' : '#4ade80';
        ctx.font = '14px Inter';
        ctx.fillText(locked ? `🔒 Need ${p.portalReq}` : 'Open!', p.x - 10, p.y - 10);
    });

    // Draw Solid Platforms
    currentPlatforms.filter(p => p.type !== 'portal').forEach(plat => {
      ctx.fillStyle = plat.color;
      // Shadow
      ctx.fillRect(plat.x, plat.y + 10, plat.width, plat.height);
      // Main
      ctx.fillStyle = plat.type === 'hazard' ? '#ef4444' : plat.color;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      
      // Texture
      if (plat.type !== 'hazard') {
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          for(let sx = 0; sx < plat.width; sx+=20) {
             ctx.beginPath();
             ctx.arc(plat.x + sx + 10, plat.y + 5, 3, 0, Math.PI * 2);
             ctx.fill();
          }
      } else {
          // Lava texture
          ctx.fillStyle = '#fca5a5';
          for(let sx = 0; sx < plat.width; sx+=20) {
              ctx.fillRect(plat.x + sx, plat.y + Math.random()*5, 10, 5);
          }
      }

      if (plat.type === 'finish') {
          ctx.fillStyle = 'yellow';
          ctx.font = '30px Fredoka One';
          ctx.fillText("FINISH!", plat.x + 10, plat.y - 40);
      }
    });

    // Draw Collectibles
    const time = Date.now() / 500;
    currentCollectibles.forEach(c => {
        const bobY = Math.sin(time + c.x) * 10;
        
        // Glow
        const gradient = ctx.createRadialGradient(c.x, c.y + bobY, c.radius * 0.2, c.x, c.y + bobY, c.radius * 2);
        gradient.addColorStop(0, c.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(c.x, c.y + bobY, c.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y + bobY, c.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Value Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(`+${c.value}`, c.x - 15, c.y + bobY - 20);
    });

    // Draw Player
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x, y, PLAYER_SIZE, PLAYER_SIZE);
    
    // Face
    ctx.fillStyle = 'black';
    ctx.fillRect(x + 5, y + 8, 5, 5);
    ctx.fillRect(x + 20, y + 8, 5, 5);
    ctx.beginPath();
    ctx.arc(x + 15, y + 20, 5, 0, Math.PI);
    ctx.stroke();

    // Speed Trail
    if (currentState.speed > 100) {
        for(let i=1; i<4; i++) {
           ctx.globalAlpha = 0.4 / i;
           ctx.fillStyle = 'cyan';
           ctx.fillRect(x - vx * i * 2, y, PLAYER_SIZE, PLAYER_SIZE);
        }
        ctx.globalAlpha = 1.0;
    }

    ctx.restore();
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
       {/* Dynamic Sky */}
       <div className={`absolute inset-0 opacity-50 transition-colors duration-1000 
           ${playerState.world === 1 ? 'bg-gradient-to-b from-sky-400 to-green-200' : ''}
           ${playerState.world === 2 ? 'bg-gradient-to-b from-indigo-900 to-purple-900' : ''}
           ${playerState.world === 3 ? 'bg-gradient-to-b from-orange-900 to-red-900' : ''}
       `}></div>
       
       <canvas 
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block relative z-10"
       />
    </div>
  );
};

export default GameCanvas;
