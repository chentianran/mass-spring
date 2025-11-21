/**
 * PhasePortrait - Renders a phase portrait (y' vs y)
 *
 * Design: Shows the relationship between velocity and position
 * - Horizontal axis: y' (velocity)
 * - Vertical axis: y (position)
 * - Current state: red dot
 * - Past trajectory: thin gray curve
 * - Stateless rendering (takes data array as input)
 */

export class PhasePortrait {
  /**
   * Create a new PhasePortrait
   * @param {Object} config - Configuration options
   * @param {number} config.width - Canvas width in pixels
   * @param {number} config.height - Canvas height in pixels
   * @param {number} config.marginLeft - Left margin for y-axis labels (default: 50)
   * @param {number} config.marginRight - Right margin (default: 20)
   * @param {number} config.marginTop - Top margin (default: 20)
   * @param {number} config.marginBottom - Bottom margin for x-axis labels (default: 40)
   * @param {string} config.trajectoryColor - Trajectory line color (default: '#888888')
   * @param {string} config.currentPointColor - Current point color (default: '#e74c3c')
   * @param {string} config.gridColor - Grid color (default: '#e0e0e0')
   * @param {string} config.axisColor - Axis color (default: '#2c3e50')
   */
  constructor({
    width = 400,
    height = 200,
    marginLeft = 50,
    marginRight = 20,
    marginTop = 20,
    marginBottom = 40,
    trajectoryColor = '#888888',
    currentPointColor = '#e74c3c',
    gridColor = '#e0e0e0',
    axisColor = '#2c3e50'
  } = {}) {
    this.width = width;
    this.height = height;
    this.marginLeft = marginLeft;
    this.marginRight = marginRight;
    this.marginTop = marginTop;
    this.marginBottom = marginBottom;
    this.trajectoryColor = trajectoryColor;
    this.currentPointColor = currentPointColor;
    this.gridColor = gridColor;
    this.axisColor = axisColor;

    // Calculate plot area
    this.plotWidth = width - marginLeft - marginRight;
    this.plotHeight = height - marginTop - marginBottom;
    this.plotLeft = marginLeft;
    this.plotTop = marginTop;
    this.plotRight = marginLeft + this.plotWidth;
    this.plotBottom = marginTop + this.plotHeight;
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
   * Calculate nice axis bounds and intervals
   * @param {number} min - Data minimum
   * @param {number} max - Data maximum
   * @returns {Object} {min, max, interval}
   */
  calculateNiceBounds(min, max) {
    // Handle edge case where min === max
    if (Math.abs(max - min) < 0.001) {
      return {
        min: min - 1,
        max: max + 1,
        interval: 0.5
      };
    }

    const range = max - min;
    const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
    const normalized = range / magnitude;

    // Choose nice interval
    let interval;
    if (normalized <= 1.5) {
      interval = 0.2 * magnitude;
    } else if (normalized <= 3) {
      interval = 0.5 * magnitude;
    } else if (normalized <= 7) {
      interval = 1 * magnitude;
    } else {
      interval = 2 * magnitude;
    }

    // Expand bounds to nice values
    const niceMin = Math.floor(min / interval) * interval;
    const niceMax = Math.ceil(max / interval) * interval;

    return { min: niceMin, max: niceMax, interval };
  }

  /**
   * Draw grid lines
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} bounds - Axis bounds {vMin, vMax, yMin, yMax}
   * @param {Object} intervals - Grid intervals {vInterval, yInterval}
   */
  drawGrid(ctx, bounds, intervals) {
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical grid lines (velocity)
    for (let v = bounds.vMin; v <= bounds.vMax; v += intervals.vInterval) {
      if (Math.abs(v) < intervals.vInterval * 0.01) continue; // Skip zero (will draw axis)
      const x = this.plotLeft + ((v - bounds.vMin) / (bounds.vMax - bounds.vMin)) * this.plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, this.plotTop);
      ctx.lineTo(x, this.plotBottom);
      ctx.stroke();
    }

    // Horizontal grid lines (position)
    for (let y = bounds.yMin; y <= bounds.yMax; y += intervals.yInterval) {
      if (Math.abs(y) < intervals.yInterval * 0.01) continue; // Skip zero (will draw axis)
      const canvasY = this.plotBottom - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;
      ctx.beginPath();
      ctx.moveTo(this.plotLeft, canvasY);
      ctx.lineTo(this.plotRight, canvasY);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  /**
   * Draw axes
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} bounds - Axis bounds {vMin, vMax, yMin, yMax}
   * @param {Object} intervals - Grid intervals {vInterval, yInterval}
   */
  drawAxes(ctx, bounds, intervals) {
    ctx.strokeStyle = this.axisColor;
    ctx.fillStyle = this.axisColor;
    ctx.lineWidth = 2;
    ctx.font = '12px Arial';

    // Draw x-axis (velocity) at y=0 if in range, otherwise at bottom
    let xAxisCanvasY = this.plotBottom;
    if (bounds.yMin < 0 && bounds.yMax > 0) {
      xAxisCanvasY = this.plotBottom - ((0 - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;
    }

    ctx.beginPath();
    ctx.moveTo(this.plotLeft, xAxisCanvasY);
    ctx.lineTo(this.plotRight, xAxisCanvasY);
    ctx.stroke();

    // Draw y-axis (position) at v=0 if in range, otherwise at left
    let yAxisCanvasX = this.plotLeft;
    if (bounds.vMin < 0 && bounds.vMax > 0) {
      yAxisCanvasX = this.plotLeft + ((0 - bounds.vMin) / (bounds.vMax - bounds.vMin)) * this.plotWidth;
    }

    ctx.beginPath();
    ctx.moveTo(yAxisCanvasX, this.plotTop);
    ctx.lineTo(yAxisCanvasX, this.plotBottom);
    ctx.stroke();

    // X-axis labels (velocity)
    ctx.fillStyle = this.axisColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = bounds.vMin; v <= bounds.vMax + intervals.vInterval * 0.01; v += intervals.vInterval) {
      const x = this.plotLeft + ((v - bounds.vMin) / (bounds.vMax - bounds.vMin)) * this.plotWidth;
      ctx.fillText(v.toFixed(1), x, this.plotBottom + 5);
    }

    // X-axis label
    ctx.font = 'bold 14px Arial';
    ctx.fillText("y' (m/s)", this.plotLeft + this.plotWidth / 2, this.plotBottom + 22);

    // Y-axis labels (position)
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = bounds.yMin; y <= bounds.yMax + intervals.yInterval * 0.01; y += intervals.yInterval) {
      const canvasY = this.plotBottom - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;
      ctx.fillText(y.toFixed(1), this.plotLeft - 5, canvasY);
    }

    // Y-axis label
    ctx.save();
    ctx.translate(15, this.plotTop + this.plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('y (m)', 0, 0);
    ctx.restore();
  }

  /**
   * Draw the trajectory line
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} data - Array of {y, v} points
   * @param {Object} bounds - Axis bounds {vMin, vMax, yMin, yMax}
   */
  drawTrajectory(ctx, data, bounds) {
    if (data.length < 2) return;

    ctx.strokeStyle = this.trajectoryColor;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const point = data[i];

      // Map to canvas coordinates
      // x-axis: velocity (y')
      const x = this.plotLeft + ((point.v - bounds.vMin) / (bounds.vMax - bounds.vMin)) * this.plotWidth;
      // y-axis: position (y) - inverted because canvas y increases downward
      const canvasY = this.plotBottom - ((point.y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;

      if (i === 0) {
        ctx.moveTo(x, canvasY);
      } else {
        ctx.lineTo(x, canvasY);
      }
    }

    ctx.stroke();
  }

  /**
   * Draw the current point
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} point - Current {y, v} point
   * @param {Object} bounds - Axis bounds {vMin, vMax, yMin, yMax}
   */
  drawCurrentPoint(ctx, point, bounds) {
    // Map to canvas coordinates
    const x = this.plotLeft + ((point.v - bounds.vMin) / (bounds.vMax - bounds.vMin)) * this.plotWidth;
    const canvasY = this.plotBottom - ((point.y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;

    ctx.fillStyle = this.currentPointColor;
    ctx.beginPath();
    ctx.arc(x, canvasY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw the complete phase portrait
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} data - Array of {y, v} data points
   * @param {number} initialY0 - Initial position (for setting initial range)
   * @param {number} initialV0 - Initial velocity (for setting initial range)
   */
  draw(ctx, data, initialY0 = 1, initialV0 = 0) {
    this.clear(ctx);

    // Need at least one data point
    if (data.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Waiting for data...', this.width / 2, this.height / 2);
      return;
    }

    // Calculate bounds
    const yValues = data.map(p => p.y);
    const vValues = data.map(p => p.v);

    const dataYMin = Math.min(...yValues);
    const dataYMax = Math.max(...yValues);
    const dataVMin = Math.min(...vValues);
    const dataVMax = Math.max(...vValues);

    // Set initial range based on initial conditions, expand if needed
    const absY0 = Math.max(Math.abs(initialY0), 0.5);
    const absV0 = Math.max(Math.abs(initialV0), 1);

    const yMin = Math.min(dataYMin, -absY0);
    const yMax = Math.max(dataYMax, absY0);
    const vMin = Math.min(dataVMin, -absV0);
    const vMax = Math.max(dataVMax, absV0);

    const yBounds = this.calculateNiceBounds(yMin, yMax);
    const vBounds = this.calculateNiceBounds(vMin, vMax);

    const bounds = {
      vMin: vBounds.min,
      vMax: vBounds.max,
      yMin: yBounds.min,
      yMax: yBounds.max
    };

    const intervals = {
      vInterval: vBounds.interval,
      yInterval: yBounds.interval
    };

    // Draw components
    this.drawGrid(ctx, bounds, intervals);
    this.drawAxes(ctx, bounds, intervals);
    this.drawTrajectory(ctx, data, bounds);

    // Draw current point (last point in data)
    const currentPoint = data[data.length - 1];
    this.drawCurrentPoint(ctx, currentPoint, bounds);
  }

  /**
   * Get rendering statistics (for testing)
   * @param {Array} data - Data array
   * @returns {Object} Statistics
   */
  getStats(data) {
    if (data.length === 0) {
      return { dataPoints: 0, yRange: 0, vRange: 0 };
    }

    const yValues = data.map(p => p.y);
    const vValues = data.map(p => p.v);

    return {
      dataPoints: data.length,
      yMin: Math.min(...yValues),
      yMax: Math.max(...yValues),
      yRange: Math.max(...yValues) - Math.min(...yValues),
      vMin: Math.min(...vValues),
      vMax: Math.max(...vValues),
      vRange: Math.max(...vValues) - Math.min(...vValues)
    };
  }
}
