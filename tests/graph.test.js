/**
 * GraphPlotter Tests
 *
 * Tests the auto-compressing timeline graph using a mock canvas context
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GraphPlotter } from '../src/rendering/GraphPlotter.js';
import { MockCanvasContext } from './helpers/MockCanvas.js';

describe('GraphPlotter - Position vs Time Graph', () => {
  let grapher;
  let ctx;

  beforeEach(() => {
    grapher = new GraphPlotter({
      width: 400,
      height: 200
    });
    ctx = new MockCanvasContext();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const defaultGrapher = new GraphPlotter();

      expect(defaultGrapher.width).toBe(400);
      expect(defaultGrapher.height).toBe(200);
    });

    it('should accept custom configuration', () => {
      const customGrapher = new GraphPlotter({
        width: 800,
        height: 300,
        marginLeft: 60,
        marginBottom: 50
      });

      expect(customGrapher.width).toBe(800);
      expect(customGrapher.height).toBe(300);
      expect(customGrapher.marginLeft).toBe(60);
      expect(customGrapher.marginBottom).toBe(50);
    });

    it('should calculate plot area correctly', () => {
      expect(grapher.plotWidth).toBe(400 - 50 - 20); // width - marginLeft - marginRight
      expect(grapher.plotHeight).toBe(200 - 20 - 40); // height - marginTop - marginBottom
    });
  });

  describe('Empty Data Handling', () => {
    it('should handle empty data gracefully', () => {
      const data = [];

      expect(() => {
        grapher.draw(ctx, data);
      }).not.toThrow();

      // Should display a message
      const texts = ctx.getOperations('fillText');
      const waitingMessage = texts.find(t => t.text && t.text.includes('Waiting'));
      expect(waitingMessage).toBeDefined();
    });
  });

  describe('Data Processing', () => {
    it('should calculate statistics correctly', () => {
      const data = [
        { t: 0, y: 1.0 },
        { t: 1, y: 0.5 },
        { t: 2, y: -0.5 },
        { t: 3, y: -1.0 },
        { t: 4, y: 0.0 }
      ];

      const stats = grapher.getStats(data);

      expect(stats.dataPoints).toBe(5);
      expect(stats.tMin).toBe(0);
      expect(stats.tMax).toBe(4);
      expect(stats.tRange).toBe(4);
      expect(stats.yMin).toBe(-1.0);
      expect(stats.yMax).toBe(1.0);
      expect(stats.yRange).toBe(2.0);
    });

    it('should handle single data point', () => {
      const data = [{ t: 0, y: 1.0 }];

      expect(() => {
        grapher.draw(ctx, data);
      }).not.toThrow();

      const stats = grapher.getStats(data);
      expect(stats.dataPoints).toBe(1);
    });
  });

  describe('Nice Bounds Calculation', () => {
    it('should calculate nice bounds for typical ranges', () => {
      const bounds = grapher.calculateNiceBounds(-0.8, 1.2);

      expect(bounds.min).toBeLessThanOrEqual(-0.8);
      expect(bounds.max).toBeGreaterThanOrEqual(1.2);
      expect(bounds.interval).toBeGreaterThan(0);
    });

    it('should handle equal min and max', () => {
      const bounds = grapher.calculateNiceBounds(1.0, 1.0);

      expect(bounds.min).toBeLessThan(1.0);
      expect(bounds.max).toBeGreaterThan(1.0);
      expect(bounds.interval).toBeGreaterThan(0);
    });

    it('should produce bounds that include the data range', () => {
      const min = -2.3;
      const max = 3.7;
      const bounds = grapher.calculateNiceBounds(min, max);

      expect(bounds.min).toBeLessThanOrEqual(min);
      expect(bounds.max).toBeGreaterThanOrEqual(max);
    });
  });

  describe('Drawing Components', () => {
    const sampleData = [
      { t: 0, y: 1.0 },
      { t: 1, y: 0.5 },
      { t: 2, y: 0.0 },
      { t: 3, y: -0.5 },
      { t: 4, y: 0.0 },
      { t: 5, y: 0.5 }
    ];

    it('should draw grid lines', () => {
      grapher.draw(ctx, sampleData);

      // Should have drawn lines for grid
      const lines = ctx.getOperations('lineTo');
      expect(lines.length).toBeGreaterThan(0);

      // Should have set dashed line style for grid
      const dashOps = ctx.getOperations('setLineDash');
      expect(dashOps.length).toBeGreaterThan(0);
    });

    it('should draw axes', () => {
      grapher.draw(ctx, sampleData);

      // Should have stroke operations for axes
      const strokes = ctx.getOperations('stroke');
      expect(strokes.length).toBeGreaterThan(0);
    });

    it('should draw axis labels', () => {
      grapher.draw(ctx, sampleData);

      // Should have text for labels
      const texts = ctx.getOperations('fillText');

      // Should have time labels
      const timeLabels = texts.filter(t => t.text && t.text.includes('s'));
      expect(timeLabels.length).toBeGreaterThan(0);

      // Should have position labels
      const posLabels = texts.filter(t => t.text && t.text.includes('m'));
      expect(posLabels.length).toBeGreaterThan(0);
    });

    it('should draw the plot line', () => {
      grapher.draw(ctx, sampleData);

      // Should have path operations
      const moves = ctx.getOperations('moveTo');
      const lines = ctx.getOperations('lineTo');

      expect(moves.length).toBeGreaterThan(0);
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should draw current point indicator', () => {
      grapher.draw(ctx, sampleData);

      // Should have an arc for the current point
      const arcs = ctx.getOperations('arc');
      expect(arcs.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-Compression', () => {
    it('should compress time axis as data grows', () => {
      const shortData = [
        { t: 0, y: 0 },
        { t: 1, y: 1 },
        { t: 2, y: 0 }
      ];

      const longData = [
        { t: 0, y: 0 },
        { t: 5, y: 1 },
        { t: 10, y: 0 },
        { t: 15, y: -1 },
        { t: 20, y: 0 }
      ];

      grapher.draw(ctx, shortData);
      const coordsShort = ctx.getPathCoordinates();

      ctx.reset();
      grapher.draw(ctx, longData);
      const coordsLong = ctx.getPathCoordinates();

      // Both should have similar number of drawn points
      // but long data should be more compressed
      expect(coordsShort.length).toBeGreaterThan(0);
      expect(coordsLong.length).toBeGreaterThan(0);
    });

    it('should always show full time range from t=0', () => {
      const data = [
        { t: 5, y: 1.0 },
        { t: 10, y: 0.5 },
        { t: 15, y: 0.0 }
      ];

      grapher.draw(ctx, data);

      const texts = ctx.getOperations('fillText');

      // Should have a "0.0s" label for t=0
      const zeroLabel = texts.find(t => t.text && t.text.includes('0.0s'));
      expect(zeroLabel).toBeDefined();
    });
  });

  describe('Y-Axis Scaling', () => {
    it('should auto-scale to fit all data', () => {
      const data = [
        { t: 0, y: -5.0 },
        { t: 1, y: 5.0 }
      ];

      grapher.draw(ctx, data);

      // Should draw without errors
      expect(ctx.operations.length).toBeGreaterThan(0);

      // Stats should reflect the range
      const stats = grapher.getStats(data);
      expect(stats.yMin).toBe(-5.0);
      expect(stats.yMax).toBe(5.0);
    });

    it('should handle positive-only data', () => {
      const data = [
        { t: 0, y: 0.5 },
        { t: 1, y: 1.0 },
        { t: 2, y: 1.5 }
      ];

      expect(() => {
        grapher.draw(ctx, data);
      }).not.toThrow();
    });

    it('should handle negative-only data', () => {
      const data = [
        { t: 0, y: -1.5 },
        { t: 1, y: -1.0 },
        { t: 2, y: -0.5 }
      ];

      expect(() => {
        grapher.draw(ctx, data);
      }).not.toThrow();
    });
  });

  describe('Determinism', () => {
    it('should produce identical output for same data', () => {
      const data = [
        { t: 0, y: 1.0 },
        { t: 1, y: 0.5 },
        { t: 2, y: 0.0 }
      ];

      grapher.draw(ctx, data);
      const ops1 = [...ctx.operations];

      ctx.reset();
      grapher.draw(ctx, data);
      const ops2 = [...ctx.operations];

      expect(ops1.length).toBe(ops2.length);
      expect(JSON.stringify(ops1)).toBe(JSON.stringify(ops2));
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long simulations', () => {
      // Generate 1000 points (over 16 seconds at 60fps)
      const data = [];
      for (let i = 0; i < 1000; i++) {
        data.push({
          t: i * 0.016,
          y: Math.sin(i * 0.1)
        });
      }

      expect(() => {
        grapher.draw(ctx, data);
      }).not.toThrow();

      const stats = grapher.getStats(data);
      expect(stats.dataPoints).toBe(1000);
      expect(stats.tMax).toBeGreaterThan(15);
    });

    it('should handle constant value', () => {
      const data = [
        { t: 0, y: 1.0 },
        { t: 1, y: 1.0 },
        { t: 2, y: 1.0 },
        { t: 3, y: 1.0 }
      ];

      expect(() => {
        grapher.draw(ctx, data);
      }).not.toThrow();
    });

    it('should handle oscillating data', () => {
      const data = [];
      for (let i = 0; i <= 20; i++) {
        data.push({
          t: i * 0.1,
          y: Math.cos(i * 0.5)
        });
      }

      expect(() => {
        grapher.draw(ctx, data);
      }).not.toThrow();

      const stats = grapher.getStats(data);
      expect(stats.yMin).toBeLessThan(0);
      expect(stats.yMax).toBeGreaterThan(0);
    });

    it('should handle very small values', () => {
      const data = [
        { t: 0, y: 0.001 },
        { t: 1, y: 0.002 },
        { t: 2, y: 0.001 }
      ];

      expect(() => {
        grapher.draw(ctx, data);
      }).not.toThrow();
    });

    it('should handle very large values', () => {
      const data = [
        { t: 0, y: 1000 },
        { t: 1, y: 2000 },
        { t: 2, y: 1500 }
      ];

      expect(() => {
        grapher.draw(ctx, data);
      }).not.toThrow();
    });
  });

  describe('Statelessness', () => {
    it('should not store internal state between draws', () => {
      const data1 = [{ t: 0, y: 1.0 }, { t: 1, y: 0.5 }];
      const data2 = [{ t: 0, y: -1.0 }, { t: 1, y: -0.5 }];

      grapher.draw(ctx, data1);
      ctx.reset();
      grapher.draw(ctx, data2);
      ctx.reset();
      grapher.draw(ctx, data1);
      const ops3 = [...ctx.operations];

      ctx.reset();
      grapher.draw(ctx, data1);
      const ops4 = [...ctx.operations];

      // Same data should produce same output regardless of history
      expect(JSON.stringify(ops3)).toBe(JSON.stringify(ops4));
    });
  });
});
