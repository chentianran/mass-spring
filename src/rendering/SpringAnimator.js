/**
 * SpringAnimator - Renders a visual representation of a mass-spring system
 *
 * Design principles:
 * - Stateless: Takes physics state as input, produces visual output
 * - No internal state storage
 * - Pure rendering function
 * - Maps physics coordinates (meters) to canvas pixels
 */

export class SpringAnimator {
  /**
   * Create a new SpringAnimator
   * @param {Object} config - Configuration options
   * @param {number} config.width - Canvas width in pixels
   * @param {number} config.height - Canvas height in pixels
   * @param {number} config.scale - Pixels per meter (default: 100)
   * @param {number} config.springCoils - Number of spring coils (default: 10)
   * @param {number} config.massWidth - Width of mass block (default: 60)
   * @param {number} config.massHeight - Height of mass block (default: 40)
   * @param {string} config.springColor - Spring color (default: '#4a90e2')
   * @param {string} config.massColor - Mass color (default: '#e74c3c')
   * @param {string} config.equilibriumColor - Equilibrium line color (default: '#95a5a6')
   */
  constructor({
    width = 400,
    height = 600,
    scale = 100,
    springCoils = 10,
    massWidth = 60,
    massHeight = 40,
    springColor = '#4a90e2',
    massColor = '#e74c3c',
    equilibriumColor = '#95a5a6'
  } = {}) {
    this.width = width;
    this.height = height;
    this.scale = scale; // pixels per meter
    this.springCoils = springCoils;
    this.massWidth = massWidth;
    this.massHeight = massHeight;
    this.springColor = springColor;
    this.massColor = massColor;
    this.equilibriumColor = equilibriumColor;

    // Fixed anchor point at top of canvas
    this.anchorX = width / 2;
    this.anchorY = 50;

    // Equilibrium position (where spring is at rest)
    this.equilibriumY = height / 2;
  }

  /**
   * Convert physics position (meters) to canvas Y coordinate
   * @param {number} y - Position in meters (positive = down)
   * @returns {number} Canvas Y coordinate in pixels
   */
  physicsToCanvasY(y) {
    return this.equilibriumY + y * this.scale;
  }

  /**
   * Draw the spring as a series of connected coils
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startY - Start Y position in canvas coordinates
   * @param {number} endY - End Y position in canvas coordinates
   */
  drawSpring(ctx, startY, endY) {
    const x = this.anchorX;
    const springLength = endY - startY;
    const coilAmplitude = 15; // Width of coil oscillation
    const segmentsPerCoil = 4;
    const totalSegments = this.springCoils * segmentsPerCoil;

    ctx.strokeStyle = this.springColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x, startY);

    for (let i = 0; i <= totalSegments; i++) {
      const t = i / totalSegments;
      const y = startY + t * springLength;

      // Sinusoidal offset for coil appearance
      const angle = i * Math.PI / 2;
      const offset = Math.sin(angle) * coilAmplitude;

      ctx.lineTo(x + offset, y);
    }

    ctx.stroke();
  }

  /**
   * Draw the mass as a rectangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} centerY - Center Y position in canvas coordinates
   */
  drawMass(ctx, centerY) {
    const x = this.anchorX - this.massWidth / 2;
    const y = centerY - this.massHeight / 2;

    // Draw shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x + 3, y + 3, this.massWidth, this.massHeight);

    // Draw mass
    ctx.fillStyle = this.massColor;
    ctx.fillRect(x, y, this.massWidth, this.massHeight);

    // Draw border
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, this.massWidth, this.massHeight);

    // Draw label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('m', this.anchorX, centerY);
  }

  /**
   * Draw the anchor point at the top
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawAnchor(ctx) {
    const x = this.anchorX;
    const y = this.anchorY;

    // Draw ceiling/wall
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 40, y);
    ctx.lineTo(x + 40, y);
    ctx.stroke();

    // Draw hatching to indicate fixed surface
    ctx.lineWidth = 2;
    for (let i = -40; i <= 40; i += 10) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i - 5, y - 8);
      ctx.stroke();
    }

    // Draw anchor circle
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw the equilibrium reference line
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawEquilibriumLine(ctx) {
    const y = this.equilibriumY;

    ctx.strokeStyle = this.equilibriumColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(this.width - 20, y);
    ctx.stroke();

    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = this.equilibriumColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('equilibrium', 25, y - 8);
  }

  /**
   * Draw position indicator and value
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} y - Position in meters
   * @param {number} v - Velocity in m/s
   */
  drawInfo(ctx, y, v) {
    ctx.fillStyle = '#2c3e50';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';

    const info = [
      `Position: ${y >= 0 ? '+' : ''}${y.toFixed(3)} m`,
      `Velocity: ${v >= 0 ? '+' : ''}${v.toFixed(3)} m/s`
    ];

    info.forEach((text, i) => {
      ctx.fillText(text, 20, 20 + i * 20);
    });
  }

  /**
   * Draw velocity vector arrow
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} massY - Mass center Y in canvas coordinates
   * @param {number} velocity - Velocity in m/s
   */
  drawVelocityVector(ctx, massY, velocity) {
    if (Math.abs(velocity) < 0.01) return; // Don't draw tiny velocities

    const x = this.anchorX + this.massWidth / 2 + 20;
    const arrowLength = Math.min(Math.abs(velocity) * 30, 100);
    const direction = velocity > 0 ? 1 : -1;

    ctx.strokeStyle = '#27ae60';
    ctx.fillStyle = '#27ae60';
    ctx.lineWidth = 3;

    // Draw arrow shaft
    ctx.beginPath();
    ctx.moveTo(x, massY);
    ctx.lineTo(x, massY + arrowLength * direction);
    ctx.stroke();

    // Draw arrowhead
    const headSize = 8;
    ctx.beginPath();
    ctx.moveTo(x, massY + arrowLength * direction);
    ctx.lineTo(x - headSize, massY + arrowLength * direction - headSize * direction);
    ctx.lineTo(x + headSize, massY + arrowLength * direction - headSize * direction);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('v', x + 10, massY);
  }

  /**
   * Clear the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  clear(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw the complete spring-mass system
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} state - Physics state {y, v, t}
   */
  draw(ctx, state) {
    const { y, v } = state;

    // Clear canvas
    this.clear(ctx);

    // Convert physics position to canvas coordinates
    const massY = this.physicsToCanvasY(y);

    // Draw in proper order (back to front)
    this.drawEquilibriumLine(ctx);
    this.drawAnchor(ctx);
    this.drawSpring(ctx, this.anchorY, massY);
    this.drawMass(ctx, massY);
    this.drawVelocityVector(ctx, massY, v);
    this.drawInfo(ctx, y, v);
  }

  /**
   * Get rendering statistics (for testing)
   * @param {Object} state - Physics state
   * @returns {Object} Rendering stats
   */
  getStats(state) {
    const { y } = state;
    const massY = this.physicsToCanvasY(y);
    const springLength = massY - this.anchorY;

    return {
      massY,
      springLength,
      isCompressed: y < 0,
      isExtended: y > 0,
      isAtEquilibrium: Math.abs(y) < 0.001
    };
  }
}
