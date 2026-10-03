export interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  color: string;
  depth: number; // For parallax effect
}

/**
 * Procedural starfield with parallax depth and subtle twinkling.
 */
export class Starfield {
  private stars: Star[] = [];
  private readonly numStars: number;
  private width = 0;
  private height = 0;

  constructor(numStars = 350) {
    this.numStars = numStars;
  }

  resize(width: number, height: number): void {
    if (this.width === width && this.height === height && this.stars.length > 0) {
      return;
    }
    this.width = width;
    this.height = height;
    this.initStars();
  }

  private initStars(): void {
    this.stars = [];
    const colors = [
      '#ffffff',
      '#f8fafc',
      '#e2e8f0',
      '#bae6fd', // subtle blue tint
      '#fef08a', // subtle warm tint
    ];

    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * (this.width || 1920),
        y: Math.random() * (this.height || 1080),
        radius: Math.random() < 0.85 ? Math.random() * 1.2 + 0.5 : Math.random() * 1.8 + 1.2,
        baseAlpha: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        depth: Math.random() * 0.6 + 0.1, // 0.1 to 0.7 parallax factor
      });
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, time: number): void {
    if (!this.width || !this.height) return;

    for (const star of this.stars) {
      // Parallax shift based on camera position
      const parallaxX = (star.x - cameraX * star.depth * 0.005) % this.width;
      const parallaxY = (star.y + cameraY * star.depth * 0.005) % this.height;

      const screenX = parallaxX < 0 ? parallaxX + this.width : parallaxX;
      const screenY = parallaxY < 0 ? parallaxY + this.height : parallaxY;

      // Subtle twinkling
      const twinkle = Math.sin(time * star.twinkleSpeed + star.x) * 0.2;
      const alpha = Math.max(0.1, Math.min(1.0, star.baseAlpha + twinkle));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, star.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
