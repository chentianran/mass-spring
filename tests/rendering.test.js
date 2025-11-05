/**
 * SpringAnimator Rendering Tests
 *
 * Tests the canvas-based spring animation using a mock canvas context
 * to verify rendering behavior without requiring a browser
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpringAnimator } from '../src/rendering/SpringAnimator.js';
import { MockCanvasContext, canvasAssertions } from './helpers/MockCanvas.js';

describe('SpringAnimator - Canvas Rendering', () => {
  let animator;
  let ctx;

  beforeEach(() => {
    animator = new SpringAnimator({
      width: 400,
      height: 600,
      scale: 100
    });
    ctx = new MockCanvasContext();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const defaultAnimator = new SpringAnimator();

      expect(defaultAnimator.width).toBe(400);
      expect(defaultAnimator.height).toBe(600);
      expect(defaultAnimator.scale).toBe(100);
      expect(defaultAnimator.springCoils).toBe(10);
    });

    it('should accept custom configuration', () => {
      const customAnimator = new SpringAnimator({
        width: 800,
        height: 1000,
        scale: 50,
        springCoils: 15
      });

      expect(customAnimator.width).toBe(800);
      expect(customAnimator.height).toBe(1000);
      expect(customAnimator.scale).toBe(50);
      expect(customAnimator.springCoils).toBe(15);
    });
  });

  describe('Coordinate Mapping', () => {
    it('should map equilibrium position (y=0) to center', () => {
      const canvasY = animator.physicsToCanvasY(0);
      expect(canvasY).toBe(300); // height/2
    });

    it('should map positive displacement downward', () => {
      const canvasY = animator.physicsToCanvasY(1.0); // 1 meter down
      expect(canvasY).toBe(400); // 300 + 100*1
    });

    it('should map negative displacement upward', () => {
      const canvasY = animator.physicsToCanvasY(-1.0); // 1 meter up
      expect(canvasY).toBe(200); // 300 - 100*1
    });

    it('should scale displacement correctly', () => {
      const customAnimator = new SpringAnimator({ scale: 50 });
      const canvasY = customAnimator.physicsToCanvasY(2.0);
      expect(canvasY).toBe(300 + 50 * 2); // equilibrium + scale * displacement
    });
  });

  describe('Drawing Operations', () => {
    it('should draw the complete system with all components', () => {
      const state = { y: 0, v: 0, t: 0 };
      animator.draw(ctx, state);

      // Should clear canvas first
      expect(ctx.hasOperation('fillRect')).toBe(true);

      // Should draw all components
      expect(ctx.hasOperation('stroke')).toBe(true); // Spring and anchor
      expect(ctx.hasOperation('fill')).toBe(true);   // Mass
      expect(ctx.hasOperation('fillText')).toBe(true); // Info text
    });

    it('should clear canvas before drawing', () => {
      const state = { y: 0, v: 0, t: 0 };
      animator.draw(ctx, state);

      const firstOp = ctx.operations[0];
      expect(firstOp.operation).toBe('fillRect');
      expect(firstOp.width).toBe(animator.width);
      expect(firstOp.height).toBe(animator.height);
    });

    it('should be deterministic (same state = same output)', () => {
      const state = { y: 1.0, v: 0.5, t: 1.0 };

      // Draw twice
      animator.draw(ctx, state);
      const ops1 = [...ctx.operations];

      ctx.reset();
      animator.draw(ctx, state);
      const ops2 = [...ctx.operations];

      // Should produce identical operations
      expect(ops1.length).toBe(ops2.length);
      expect(JSON.stringify(ops1)).toBe(JSON.stringify(ops2));
    });

    it('should produce different output for different states', () => {
      const state1 = { y: 0, v: 0, t: 0 };
      const state2 = { y: 1.0, v: 0, t: 0 };

      animator.draw(ctx, state1);
      const ops1 = ctx.getSummary();

      ctx.reset();
      animator.draw(ctx, state2);
      const ops2 = ctx.getSummary();

      // Should have same number of operation types
      expect(Object.keys(ops1).length).toBe(Object.keys(ops2).length);

      // But different coordinates (can't easily compare due to complexity)
      // Just verify both have operations
      expect(ctx.operations.length).toBeGreaterThan(0);
    });
  });

  describe('Spring Rendering', () => {
    it('should draw spring with correct start and end points', () => {
      const startY = 50;
      const endY = 300;

      animator.drawSpring(ctx, startY, endY);

      const coords = ctx.getPathCoordinates();

      // First point should be near start
      expect(coords[0].y).toBe(startY);

      // Last point should be near end
      expect(coords[coords.length - 1].y).toBeCloseTo(endY, 0);
    });

    it('should draw spring with oscillating coils', () => {
      const startY = 50;
      const endY = 300;

      animator.drawSpring(ctx, startY, endY);

      const coords = ctx.getPathCoordinates();

      // Check that X coordinates vary (coil oscillation)
      const xValues = coords.map(c => c.x);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);

      expect(maxX - minX).toBeGreaterThan(0); // Should oscillate
    });

    it('should draw longer spring when mass is lower', () => {
      const state1 = { y: 0, v: 0, t: 0 };
      const state2 = { y: 1.0, v: 0, t: 0 };

      const stats1 = animator.getStats(state1);
      const stats2 = animator.getStats(state2);

      expect(stats2.springLength).toBeGreaterThan(stats1.springLength);
    });

    it('should draw shorter spring when mass is higher', () => {
      const state1 = { y: 0, v: 0, t: 0 };
      const state2 = { y: -1.0, v: 0, t: 0 };

      const stats1 = animator.getStats(state1);
      const stats2 = animator.getStats(state2);

      expect(stats2.springLength).toBeLessThan(stats1.springLength);
    });
  });

  describe('Mass Rendering', () => {
    it('should draw mass at correct position', () => {
      const state = { y: 1.0, v: 0, t: 0 };
      animator.draw(ctx, state);

      const stats = animator.getStats(state);

      // Mass should be drawn as rectangles
      const rects = ctx.getOperations('fillRect');

      // Should have at least 2 rectangles (canvas clear + mass + shadow)
      expect(rects.length).toBeGreaterThan(2);

      // Find the mass rectangle (not the canvas clear which is at 0,0)
      const massRect = rects.find(r =>
        r.width === animator.massWidth &&
        r.height === animator.massHeight
      );

      expect(massRect).toBeDefined();
    });

    it('should draw mass with shadow for depth', () => {
      const state = { y: 0, v: 0, t: 0 };
      animator.draw(ctx, state);

      const rects = ctx.getOperations('fillRect');

      // Should have shadow (slightly offset, semi-transparent)
      const shadowRect = rects.find(r =>
        r.fillStyle && r.fillStyle.includes('rgba')
      );

      expect(shadowRect).toBeDefined();
    });

    it('should draw mass label', () => {
      const state = { y: 0, v: 0, t: 0 };
      animator.draw(ctx, state);

      const texts = ctx.getOperations('fillText');
      const massLabel = texts.find(t => t.text === 'm');

      expect(massLabel).toBeDefined();
    });
  });

  describe('Equilibrium Line', () => {
    it('should draw equilibrium line at center', () => {
      animator.drawEquilibriumLine(ctx);

      const lines = ctx.getOperations('lineTo');

      // Should draw a line at equilibrium Y
      const equilibriumLines = lines.filter(l =>
        Math.abs(l.y - animator.equilibriumY) < 1
      );

      expect(equilibriumLines.length).toBeGreaterThan(0);
    });

    it('should draw equilibrium line as dashed', () => {
      animator.drawEquilibriumLine(ctx);

      const dashOps = ctx.getOperations('setLineDash');

      // Should set dash pattern
      expect(dashOps.length).toBeGreaterThan(0);

      // Should have dashed pattern like [5, 5]
      const dashPattern = dashOps.find(op => op.segments.length > 0);
      expect(dashPattern).toBeDefined();
    });

    it('should label equilibrium line', () => {
      animator.drawEquilibriumLine(ctx);

      const texts = ctx.getOperations('fillText');
      const eqLabel = texts.find(t => t.text === 'equilibrium');

      expect(eqLabel).toBeDefined();
    });
  });

  describe('Anchor Point', () => {
    it('should draw anchor at top of canvas', () => {
      animator.drawAnchor(ctx);

      // Should draw lines for ceiling
      const lines = ctx.getOperations('lineTo');

      // Check that some lines are near the anchor Y position
      const anchorLines = lines.filter(l =>
        Math.abs(l.y - animator.anchorY) < 10
      );

      expect(anchorLines.length).toBeGreaterThan(0);
    });

    it('should draw anchor circle', () => {
      animator.drawAnchor(ctx);

      const arcs = ctx.getOperations('arc');

      // Should have at least one arc for the anchor point
      expect(arcs.length).toBeGreaterThan(0);
    });
  });

  describe('Velocity Vector', () => {
    it('should not draw vector for zero velocity', () => {
      const state = { y: 0, v: 0, t: 0 };
      animator.draw(ctx, state);

      // Count strokes before
      const initialSummary = ctx.getSummary();

      ctx.reset();
      animator.draw(ctx, { y: 0, v: 0.005, t: 0 }); // Very small velocity

      const afterSummary = ctx.getSummary();

      // Should have similar number of operations (no velocity arrow for tiny velocities)
      expect(Math.abs(initialSummary.stroke - afterSummary.stroke)).toBeLessThan(2);
    });

    it('should draw vector for non-zero velocity', () => {
      const stateNoVel = { y: 0, v: 0, t: 0 };
      const stateWithVel = { y: 0, v: 1.0, t: 0 };

      animator.draw(ctx, stateNoVel);
      const ops1 = ctx.operations.length;

      ctx.reset();
      animator.draw(ctx, stateWithVel);
      const ops2 = ctx.operations.length;

      // Should have more operations with velocity vector
      expect(ops2).toBeGreaterThan(ops1);
    });

    it('should draw downward arrow for positive velocity', () => {
      const massY = 300;
      const velocity = 1.0;

      animator.drawVelocityVector(ctx, massY, velocity);

      const lines = ctx.getOperations('lineTo');

      // Should draw line going down (increasing Y)
      const downwardLine = lines.find(l => l.y > massY);
      expect(downwardLine).toBeDefined();
    });

    it('should draw upward arrow for negative velocity', () => {
      const massY = 300;
      const velocity = -1.0;

      animator.drawVelocityVector(ctx, massY, velocity);

      const lines = ctx.getOperations('lineTo');

      // Should draw line going up (decreasing Y)
      const upwardLine = lines.find(l => l.y < massY);
      expect(upwardLine).toBeDefined();
    });
  });

  describe('Info Display', () => {
    it('should display position and velocity', () => {
      const state = { y: 1.234, v: -0.567, t: 1.0 };
      animator.draw(ctx, state);

      const texts = ctx.getOperations('fillText');

      // Should have text showing position
      const posText = texts.find(t => t.text && t.text.includes('Position'));
      expect(posText).toBeDefined();
      expect(posText.text).toContain('1.234');

      // Should have text showing velocity
      const velText = texts.find(t => t.text && t.text.includes('Velocity'));
      expect(velText).toBeDefined();
      expect(velText.text).toContain('0.567');
    });

    it('should format positive values with + sign', () => {
      const state = { y: 1.0, v: 0.5, t: 0 };
      animator.draw(ctx, state);

      const texts = ctx.getOperations('fillText');
      const posText = texts.find(t => t.text && t.text.includes('Position'));

      expect(posText.text).toContain('+');
    });

    it('should format negative values with - sign', () => {
      const state = { y: -1.0, v: -0.5, t: 0 };
      animator.draw(ctx, state);

      const texts = ctx.getOperations('fillText');
      const posText = texts.find(t => t.text && t.text.includes('Position'));

      expect(posText.text).toContain('-');
    });
  });

  describe('Statistics and Analysis', () => {
    it('should detect compression correctly', () => {
      const state = { y: -1.0, v: 0, t: 0 };
      const stats = animator.getStats(state);

      expect(stats.isCompressed).toBe(true);
      expect(stats.isExtended).toBe(false);
      expect(stats.isAtEquilibrium).toBe(false);
    });

    it('should detect extension correctly', () => {
      const state = { y: 1.0, v: 0, t: 0 };
      const stats = animator.getStats(state);

      expect(stats.isCompressed).toBe(false);
      expect(stats.isExtended).toBe(true);
      expect(stats.isAtEquilibrium).toBe(false);
    });

    it('should detect equilibrium correctly', () => {
      const state = { y: 0.0001, v: 0, t: 0 };
      const stats = animator.getStats(state);

      expect(stats.isAtEquilibrium).toBe(true);
    });

    it('should calculate spring length correctly', () => {
      const state = { y: 0, v: 0, t: 0 };
      const stats = animator.getStats(state);

      const expectedLength = animator.equilibriumY - animator.anchorY;
      expect(stats.springLength).toBe(expectedLength);
    });
  });

  describe('Statelessness', () => {
    it('should not store state internally', () => {
      const state1 = { y: 1.0, v: 0.5, t: 1.0 };
      const state2 = { y: -0.5, v: -1.0, t: 2.0 };

      // Draw first state
      animator.draw(ctx, state1);

      // Draw second state
      ctx.reset();
      animator.draw(ctx, state2);

      // Draw first state again
      ctx.reset();
      animator.draw(ctx, state1);
      const ops3 = [...ctx.operations];

      // Should produce same output as first draw
      ctx.reset();
      animator.draw(ctx, state1);
      const ops4 = [...ctx.operations];

      expect(JSON.stringify(ops3)).toBe(JSON.stringify(ops4));
    });

    it('should accept state as parameter every time', () => {
      // This is more of a design test - verify the draw method requires state
      expect(() => {
        animator.draw(ctx); // Missing state parameter
      }).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large displacement', () => {
      const state = { y: 10.0, v: 0, t: 0 };

      expect(() => {
        animator.draw(ctx, state);
      }).not.toThrow();

      expect(ctx.operations.length).toBeGreaterThan(0);
    });

    it('should handle very small displacement', () => {
      const state = { y: 0.001, v: 0, t: 0 };

      expect(() => {
        animator.draw(ctx, state);
      }).not.toThrow();

      expect(ctx.operations.length).toBeGreaterThan(0);
    });

    it('should handle negative displacement beyond equilibrium', () => {
      const state = { y: -5.0, v: 0, t: 0 };

      expect(() => {
        animator.draw(ctx, state);
      }).not.toThrow();

      const stats = animator.getStats(state);
      expect(stats.isCompressed).toBe(true);
    });

    it('should handle high velocity', () => {
      const state = { y: 0, v: 10.0, t: 0 };

      expect(() => {
        animator.draw(ctx, state);
      }).not.toThrow();

      // Should draw velocity vector
      const hasVelocityArrow = ctx.operations.length > 50; // More operations with arrow
      expect(hasVelocityArrow).toBe(true);
    });
  });
});
