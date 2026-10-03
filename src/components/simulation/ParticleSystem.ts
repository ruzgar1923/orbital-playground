import { Vector2 } from '../../physics/Vector2';

export interface ExhaustParticle {
  position: Vector2; // World km
  velocity: Vector2; // km/s
  life: number; // remaining life in seconds
  maxLife: number;
  size: number; // in pixels or world km
  color: string;
}

/**
 * Particle system for rocket engine exhaust plume and thruster firings.
 */
export class ParticleSystem {
  private particles: ExhaustParticle[] = [];
  private readonly maxParticles = 250;

  emitExhaust(
    nozzlePos: Vector2,
    spacecraftHeading: Vector2,
    spacecraftVel: Vector2,
    throttle: number,
    count = 3
  ): void {
    if (throttle <= 0) return;

    // Plume shoots backwards (-heading)
    const exhaustDir = spacecraftHeading.scale(-1);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      // Random cone spread (±15 degrees)
      const spreadAngle = (Math.random() - 0.5) * 0.45;
      const spreadDir = exhaustDir.rotate(spreadAngle);

      // Exhaust ejection speed relative to spacecraft (~0.2 to 0.8 km/s for visual effect)
      const ejectionSpeed = (0.25 + Math.random() * 0.55) * throttle;
      const particleVel = spacecraftVel.add(spreadDir.scale(ejectionSpeed));

      // Color variation from bright fiery core to smoke
      const life = 0.2 + Math.random() * 0.35;
      const colors = ['#fef08a', '#f97316', '#ef4444', '#60a5fa'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        position: nozzlePos.clone(),
        velocity: particleVel,
        life,
        maxLife: life,
        size: (2.5 + Math.random() * 3.5) * throttle,
        color,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.position = p.position.add(p.velocity.scale(dt));
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    worldToScreen: (worldPos: Vector2) => { x: number; y: number }
  ): void {
    ctx.save();
    for (const p of this.particles) {
      const screen = worldToScreen(p.position);
      const alpha = Math.max(0, p.life / p.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, p.size * (1 + (1 - alpha) * 0.8), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  clear(): void {
    this.particles.length = 0;
  }
}
