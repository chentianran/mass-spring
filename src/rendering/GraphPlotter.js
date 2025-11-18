/**
 * GraphPlotter - Renders a position vs. time graph
 *
 * Design: Auto-compressing timeline
 * - Shows entire history from t=0 to current time
 * - Automatically compresses x-axis as time increases
 * - Auto-scales y-axis based on min/max values
 * - Stateless rendering (takes data array as input)
 */

export class GraphPlotter {
  /**
   * Create a new GraphPlotter
   * @param {Object} config - Configuration options
   * @param {number} config.width - Canvas width in pixels
   * @param {number} config.height - Canvas height in pixels
   * @param {number} config.marginLeft - Left margin for y-axis labels (default: 50)
   * @param {number} config.marginRight - Right margin (default: 20)
   * @param {number} config.marginTop - Top margin (default: 20)
   * @param {number} config.marginBottom - Bottom margin for x-axis labels (default: 40)
   * @param {string} config.lineColor - Plot line color (default: '#e74c3c')
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
    lineColor = '#e74c3c',
    gridColor = '#e0e0e0',
    axisColor = '#2c3e50'
  } = {}) {
    this.width = width;
    this.height = height;
    this.marginLeft = marginLeft;
    this.marginRight = marginRight;
    this.marginTop = marginTop;
    this.marginBottom = marginBottom;
    this.lineColor = lineColor;
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
   * @param {Object} bounds - Axis bounds {tMin, tMax, yMin, yMax}
   * @param {Object} intervals - Grid intervals {tInterval, yInterval}
   */
  drawGrid(ctx, bounds, intervals) {
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical grid lines (time)
    for (let t = 0; t <= bounds.tMax; t += intervals.tInterval) {
      const x = this.plotLeft + (t / bounds.tMax) * this.plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, this.plotTop);
      ctx.lineTo(x, this.plotBottom);
      ctx.stroke();
    }

    // Horizontal grid lines (position)
    for (let y = bounds.yMin; y <= bounds.yMax; y += intervals.yInterval) {
      if (Math.abs(y) < intervals.yInterval * 0.01) continue; // Skip if too close to zero (will draw axis)
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
   * @param {Object} bounds - Axis bounds {tMin, tMax, yMin, yMax}
   * @param {Object} intervals - Grid intervals {tInterval, yInterval}
   */
  drawAxes(ctx, bounds, intervals) {
    ctx.strokeStyle = this.axisColor;
    ctx.fillStyle = this.axisColor;
    ctx.lineWidth = 2;
    ctx.font = '12px Arial';

    // Draw x-axis (time)
    ctx.beginPath();
    ctx.moveTo(this.plotLeft, this.plotBottom);
    ctx.lineTo(this.plotRight, this.plotBottom);
    ctx.stroke();

    // Draw y-axis (position)
    ctx.beginPath();
    ctx.moveTo(this.plotLeft, this.plotTop);
    ctx.lineTo(this.plotLeft, this.plotBottom);
    ctx.stroke();

    // Draw zero line if in range
    if (bounds.yMin < 0 && bounds.yMax > 0) {
      const zeroY = this.plotBottom - ((0 - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;
      ctx.strokeStyle = this.axisColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.plotLeft, zeroY);
      ctx.lineTo(this.plotRight, zeroY);
      ctx.stroke();
    }

    // X-axis labels (time)
    ctx.fillStyle = this.axisColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let t = 0; t <= bounds.tMax; t += intervals.tInterval) {
      const x = this.plotLeft + (t / bounds.tMax) * this.plotWidth;
      ctx.fillText(t.toFixed(1) + 's', x, this.plotBottom + 5);
    }

    // X-axis label
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Time (s)', this.plotLeft + this.plotWidth / 2, this.plotBottom + 25);

    // Y-axis labels (position)
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = bounds.yMin; y <= bounds.yMax; y += intervals.yInterval) {
      const canvasY = this.plotBottom - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;
      ctx.fillText(y.toFixed(1) + 'm', this.plotLeft - 5, canvasY);
    }

    // Y-axis label
    ctx.save();
    ctx.translate(15, this.plotTop + this.plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Position (m)', 0, 0);
    ctx.restore();
  }

  /**
   * Draw the forcing function plot
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Function} forcingFn - Forcing function
   * @param {Object} forcingParams - Parameters for forcing function
   * @param {Object} bounds - Axis bounds {tMin, tMax, yMin, yMax}
   */
  drawForcingPlot(ctx, forcingFn, forcingParams, bounds) {
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    // Sample the forcing function at many points for smooth curve
    const numSamples = 200;
    const dt = (bounds.tMax - bounds.tMin) / numSamples;

    for (let i = 0; i <= numSamples; i++) {
      const t = bounds.tMin + i * dt;
      const force = forcingFn(t, forcingParams);

      // Map to canvas coordinates
      const x = this.plotLeft + ((t - bounds.tMin) / (bounds.tMax - bounds.tMin)) * this.plotWidth;
      const y = this.plotBottom - ((force - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  /**
   * Draw the plot line
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} data - Array of {t, y} points
   * @param {Object} bounds - Axis bounds {tMin, tMax, yMin, yMax}
   */
  drawPlot(ctx, data, bounds) {
    if (data.length < 2) return;

    ctx.strokeStyle = this.lineColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const point = data[i];

      // Map to canvas coordinates
      const x = this.plotLeft + ((point.t - bounds.tMin) / (bounds.tMax - bounds.tMin)) * this.plotWidth;
      const y = this.plotBottom - ((point.y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw current point
    const lastPoint = data[data.length - 1];
    const x = this.plotLeft + ((lastPoint.t - bounds.tMin) / (bounds.tMax - bounds.tMin)) * this.plotWidth;
    const y = this.plotBottom - ((lastPoint.y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * this.plotHeight;

    ctx.fillStyle = this.lineColor;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw the complete graph
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} data - Array of {t, y} data points
   * @param {number} initialY0 - Initial position (for setting initial vertical range)
   * @param {Object} forcingInfo - Forcing function information (optional)
   * @param {string} forcingInfo.name - Name of forcing function
   * @param {Function} forcingInfo.fn - Forcing function
   * @param {Object} forcingInfo.params - Parameters for forcing function
   */
  draw(ctx, data, initialY0 = null, forcingInfo = null) {
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
    const tValues = data.map(p => p.t);
    const yValues = data.map(p => p.y);

    const tMin = 0; // Always start from t=0
    const currentMaxT = Math.max(...tValues);
    // Start with window of t=0 to t=5, only compress after t>5
    const tMax = Math.max(currentMaxT, 5);

    const dataYMin = Math.min(...yValues);
    const dataYMax = Math.max(...yValues);

    // Start vertical range at ±|initialY0|, only expand when needed
    let yMin, yMax;
    if (initialY0 !== null) {
      const absY0 = Math.abs(initialY0);
      // Set initial range, but expand if data goes outside
      yMin = Math.min(dataYMin, -absY0);
      yMax = Math.max(dataYMax, absY0);
    } else {
      // Fallback if no initial condition provided
      yMin = dataYMin;
      yMax = dataYMax;
    }

    // If there's a forcing function, include it in the bounds calculation
    if (forcingInfo && forcingInfo.name !== 'none' && forcingInfo.fn) {
      // Sample forcing function to get its range
      const numSamples = 50;
      const dt = tMax / numSamples;
      for (let i = 0; i <= numSamples; i++) {
        const t = i * dt;
        const force = forcingInfo.fn(t, forcingInfo.params);
        yMin = Math.min(yMin, force);
        yMax = Math.max(yMax, force);
      }
    }

    const yBounds = this.calculateNiceBounds(yMin, yMax);

    // Calculate nice time interval
    let tInterval;
    if (tMax <= 5) {
      tInterval = 1;
    } else if (tMax <= 20) {
      tInterval = 2;
    } else if (tMax <= 50) {
      tInterval = 5;
    } else if (tMax <= 100) {
      tInterval = 10;
    } else {
      tInterval = 20;
    }

    const bounds = {
      tMin,
      tMax,
      yMin: yBounds.min,
      yMax: yBounds.max
    };

    const intervals = {
      tInterval,
      yInterval: yBounds.interval
    };

    // Draw components
    this.drawGrid(ctx, bounds, intervals);
    this.drawAxes(ctx, bounds, intervals);

    // Draw forcing function first (so it's behind the position plot)
    if (forcingInfo && forcingInfo.name !== 'none' && forcingInfo.fn) {
      this.drawForcingPlot(ctx, forcingInfo.fn, forcingInfo.params, bounds);
    }

    this.drawPlot(ctx, data, bounds);
  }

  /**
   * Get rendering statistics (for testing)
   * @param {Array} data - Data array
   * @returns {Object} Statistics
   */
  getStats(data) {
    if (data.length === 0) {
      return { dataPoints: 0, tRange: 0, yRange: 0 };
    }

    const tValues = data.map(p => p.t);
    const yValues = data.map(p => p.y);

    return {
      dataPoints: data.length,
      tMin: Math.min(...tValues),
      tMax: Math.max(...tValues),
      tRange: Math.max(...tValues) - Math.min(...tValues),
      yMin: Math.min(...yValues),
      yMax: Math.max(...yValues),
      yRange: Math.max(...yValues) - Math.min(...yValues)
    };
  }
}
