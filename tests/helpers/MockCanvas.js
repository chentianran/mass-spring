/**
 * MockCanvas - A mock canvas context for testing rendering code
 *
 * Records all drawing operations so tests can verify:
 * - Correct methods are called
 * - Coordinates are calculated properly
 * - Rendering is deterministic
 */

export class MockCanvasContext {
  constructor() {
    this.reset();
  }

  reset() {
    // Recording of all operations
    this.operations = [];

    // Current state
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.font = '10px sans-serif';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
    this.globalAlpha = 1;
    this.lineDashSegments = [];

    // Path state
    this.currentPath = [];
    this.isPathOpen = false;
  }

  // Recording helper
  record(operation, data = {}) {
    this.operations.push({ operation, ...data });
  }

  // Drawing methods
  fillRect(x, y, width, height) {
    this.record('fillRect', { x, y, width, height, fillStyle: this.fillStyle });
  }

  strokeRect(x, y, width, height) {
    this.record('strokeRect', { x, y, width, height, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth });
  }

  clearRect(x, y, width, height) {
    this.record('clearRect', { x, y, width, height });
  }

  fillText(text, x, y, maxWidth) {
    this.record('fillText', { text, x, y, maxWidth, fillStyle: this.fillStyle, font: this.font });
  }

  strokeText(text, x, y, maxWidth) {
    this.record('strokeText', { text, x, y, maxWidth, strokeStyle: this.strokeStyle, font: this.font });
  }

  // Path methods
  beginPath() {
    this.isPathOpen = true;
    this.currentPath = [];
    this.record('beginPath');
  }

  closePath() {
    this.record('closePath');
  }

  moveTo(x, y) {
    this.currentPath.push({ type: 'moveTo', x, y });
    this.record('moveTo', { x, y });
  }

  lineTo(x, y) {
    this.currentPath.push({ type: 'lineTo', x, y });
    this.record('lineTo', { x, y });
  }

  arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
    this.currentPath.push({ type: 'arc', x, y, radius, startAngle, endAngle, counterclockwise });
    this.record('arc', { x, y, radius, startAngle, endAngle, counterclockwise });
  }

  rect(x, y, width, height) {
    this.currentPath.push({ type: 'rect', x, y, width, height });
    this.record('rect', { x, y, width, height });
  }

  fill() {
    this.record('fill', { fillStyle: this.fillStyle, pathLength: this.currentPath.length });
    this.isPathOpen = false;
  }

  stroke() {
    this.record('stroke', {
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth,
      pathLength: this.currentPath.length
    });
    this.isPathOpen = false;
  }

  // Line style
  setLineDash(segments) {
    this.lineDashSegments = segments;
    this.record('setLineDash', { segments: [...segments] });
  }

  getLineDash() {
    return [...this.lineDashSegments];
  }

  // Transform methods
  save() {
    this.record('save');
  }

  restore() {
    this.record('restore');
  }

  translate(x, y) {
    this.record('translate', { x, y });
  }

  rotate(angle) {
    this.record('rotate', { angle });
  }

  scale(x, y) {
    this.record('scale', { x, y });
  }

  transform(a, b, c, d, e, f) {
    this.record('transform', { a, b, c, d, e, f });
  }

  setTransform(a, b, c, d, e, f) {
    this.record('setTransform', { a, b, c, d, e, f });
  }

  resetTransform() {
    this.record('resetTransform');
  }

  // Helpers for testing
  getOperationCount(operationType) {
    return this.operations.filter(op => op.operation === operationType).length;
  }

  getOperations(operationType) {
    return this.operations.filter(op => op.operation === operationType);
  }

  hasOperation(operationType) {
    return this.operations.some(op => op.operation === operationType);
  }

  getLastOperation(operationType) {
    const ops = this.getOperations(operationType);
    return ops.length > 0 ? ops[ops.length - 1] : null;
  }

  // Find operations by partial match
  findOperations(criteria) {
    return this.operations.filter(op => {
      return Object.keys(criteria).every(key => {
        if (typeof criteria[key] === 'function') {
          return criteria[key](op[key]);
        }
        return op[key] === criteria[key];
      });
    });
  }

  // Get all coordinates from path operations
  getPathCoordinates() {
    const coords = [];
    this.operations.forEach(op => {
      if (op.operation === 'moveTo' || op.operation === 'lineTo') {
        coords.push({ x: op.x, y: op.y, type: op.operation });
      }
    });
    return coords;
  }

  // Verify a sequence of operations
  hasSequence(operations) {
    const sequence = operations.map(op => op.operation || op);

    for (let i = 0; i <= this.operations.length - sequence.length; i++) {
      const match = sequence.every((op, j) => {
        return this.operations[i + j].operation === op;
      });
      if (match) return true;
    }

    return false;
  }

  // Get summary statistics
  getSummary() {
    const summary = {};
    this.operations.forEach(op => {
      summary[op.operation] = (summary[op.operation] || 0) + 1;
    });
    return summary;
  }
}

/**
 * Create a mock canvas element
 */
export function createMockCanvas(width = 800, height = 600) {
  const ctx = new MockCanvasContext();

  const canvas = {
    width,
    height,
    getContext: (type) => {
      if (type === '2d') return ctx;
      return null;
    },
    // For testing
    _context: ctx
  };

  return canvas;
}

/**
 * Helper assertions for canvas testing
 */
export const canvasAssertions = {
  /**
   * Assert that a drawing operation occurred
   */
  hasDrawn(ctx, operationType) {
    return ctx.hasOperation(operationType);
  },

  /**
   * Assert that coordinates are within expected range
   */
  coordinatesInRange(ctx, operationType, xRange, yRange) {
    const ops = ctx.getOperations(operationType);
    return ops.every(op => {
      const xOk = op.x >= xRange[0] && op.x <= xRange[1];
      const yOk = op.y >= yRange[0] && op.y <= yRange[1];
      return xOk && yOk;
    });
  },

  /**
   * Get bounding box of all draw operations
   */
  getBoundingBox(ctx) {
    const coords = ctx.getPathCoordinates();
    if (coords.length === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    coords.forEach(({ x, y }) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }
};
