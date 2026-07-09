"use client";
import { useEffect, useRef, useState } from "react";

interface SoccerSplashProps {
  onComplete: () => void;
}

interface Shard {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  gravity: number;
  points: { x: number; y: number }[];
  opacity: number;
}

export default function SoccerSplash({ onComplete }: SoccerSplashProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<"kick" | "shatter">("kick");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId: number;

    const ball = {
      x: 100,
      y: canvas.height - 150,
      radius: 20,
      scale: 1,
      speedX: 18,
      speedY: -12,
      gravity: 0.25,
      rotation: 0
    };

    const shards: Shard[] = [];

    function createShards() {
      const numShards = 120;
      if (!canvas) return;
      for (let i = 0; i < numShards; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 4;
        shards.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          size: Math.random() * 20 + 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 2,
          gravity: 0.3,
          points: [
            { x: 0, y: 0 },
            { x: Math.random() * 20, y: Math.random() * 10 },
            { x: Math.random() * 20, y: Math.random() * 20 },
            { x: Math.random() * 10, y: Math.random() * 20 }
          ],
          opacity: 1
        });
      }
    }

    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#09140c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (ball.scale < 3.5) {
        ball.x += ball.speedX;
        ball.y += ball.speedY;
        ball.speedY += ball.gravity;
        ball.scale += 0.04;
        ball.rotation += 0.15;

        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.rotate(ball.rotation);
        ctx.scale(ball.scale, ball.scale);

        ctx.beginPath();
        ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        ctx.fillStyle = "#111111";
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(Math.cos(i * 1.2) * 10, Math.sin(i * 1.2) * 10, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (ball.x >= canvas.width / 2 || ball.scale >= 3.3) {
          ball.scale = 4;
          createShards();
          setPhase("shatter");
        }
      } else {
        shards.forEach((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.vy += s.gravity;
          s.opacity -= 0.015;

          if (s.opacity > 0) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
            ctx.strokeStyle = `rgba(200, 255, 200, ${s.opacity})`;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for (let i = 1; i < s.points.length; i++) {
              ctx.lineTo(s.points[i].x, s.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        });

        if (shards[0] && shards[0].opacity <= 0) {
          cancelAnimationFrame(animationFrameId);
          onComplete();
          return;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-[#09140c] flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {phase === "kick" && (
        <div className="absolute bottom-10 left-10 text-emerald-400 font-mono text-lg animate-pulse">
          ⚽ PlayArena yuklanmoqda...
        </div>
      )}
    </div>
  );
}