# Mass-Spring System Visualization - System Design

**Target Audience**: LLM Agents (like Claude)
**Purpose**: Educational interactive visualization of mass-spring ODE systems
**Key Requirements**: Embeddable, testable, deterministic, lightweight

---

## System Overview

This is a single-page JavaScript application that visualizes a mass-spring-damper system governed by the second-order ODE:

```
m·y'' = -b·y' - k·y + f(t)
```

Where:
- `m` = mass (kg)
- `b` = damping coefficient (N·s/m)
- `k` = spring constant (N/m)
- `y` = displacement from equilibrium (m)
- `f(t)` = external forcing function (N)

Students can adjust parameters in real-time and observe the physical behavior through animation and graphing.

---

## Architecture: Separation of Concerns

The system is designed with **4 independent layers** to enable robust AI agent testing:

### 1. Physics Engine (Pure, Deterministic Core)

**File**: `src/physics/MassSpringSystem.js`

**Responsibilities**:
- Solve the ODE using RK4 (Runge-Kutta 4th order) numerical integration
- Maintain system state: `{position, velocity, time}`
- Apply forcing functions: `f(t)`
- Provide programmatic API for headless operation

**Key Design Decisions**:
- **Deterministic time-stepping**: Fixed `dt` (e.g., 0.016s for 60fps), no `Date.now()` or variable timesteps
- **State is immutable input**: Each `step(dt)` returns new state, doesn't mutate global state
- **No side effects**: Pure functions enable perfect unit testing
- **Headless mode**: Can run without any rendering (critical for tests)

**API**:
```javascript
const system = new MassSpringSystem({
  m: 1.0,      // mass
  b: 0.1,      // damping
  k: 1.0,      // spring constant
  y0: 1.0,     // initial position
  v0: 0.0      // initial velocity
});

// Step simulation forward
const newState = system.step(0.016); // {y, v, t}

// Change parameters mid-simulation
system.setParameters({m: 2.0, b: 0.5, k: 3.0});

// Set forcing function
system.setForcing('sine', {amplitude: 1.0, frequency: 2.0});
```

**File**: `src/physics/integrators.js`

**Provides**: RK4 implementation
```javascript
// RK4 integrator for system of ODEs
function rk4Step(state, derivativeFn, dt) {
  // Returns new state after one RK4 step
}
```

**File**: `src/physics/forcingFunctions.js`

**Presets**:
- `none`: `f(t) = 0`
- `sine`: `f(t) = A·sin(ω·t)`
- `cosine`: `f(t) = A·cos(ω·t)`
- `step`: `f(t) = A·H(t - t0)` (Heaviside step at time t0)

---

### 2. Rendering Layer (Canvas-based, Stateless)

**File**: `src/rendering/SpringAnimator.js`

**Responsibilities**:
- Draw animated spring with mass (vertical oscillation)
- Render spring coils that compress/extend based on position
- Draw mass as a rectangle/circle at the current position
- Show equilibrium line for reference

**Input**: Current physics state `{y, v, t}`
**Output**: Canvas drawing

**Design Decisions**:
- **Stateless**: Takes state as input, doesn't store anything
- **Coordinate mapping**: Maps physics coordinates (meters) to canvas pixels
- **Visual clarity**: Spring should clearly show compression/extension

**File**: `src/rendering/GraphPlotter.js`

**Responsibilities**:
- Real-time position vs. time graph: `y(t)`
- Scrolling window (e.g., last 10 seconds)
- Grid lines, axes, labels

**Input**: History buffer of states `[{y, t}, ...]`
**Output**: Canvas drawing

---

### 3. UI Controls (Interactive Parameter Adjustment)

**File**: `src/ui/ControlPanel.js`

**Responsibilities**:
- Sliders + numeric inputs for `m`, `b`, `k`
- Dropdown for forcing function presets
- Additional controls for forcing amplitude/frequency (when applicable)
- Play/Pause/Reset buttons
- Display current values

**Event Flow**:
```
User adjusts slider → ControlPanel emits event → Orchestrator updates physics engine
```

**Validation**:
- Prevent invalid values (e.g., `m <= 0`, `k < 0`, `b < 0`)
- Reasonable ranges for educational context:
  - `m`: [0.1, 10] kg
  - `b`: [0, 5] N·s/m
  - `k`: [0.1, 20] N/m

---

### 4. Orchestration (Main Application Class)

**File**: `src/MassSpringViz.js`

**Responsibilities**:
- Initialize all components (physics, rendering, UI)
- Animation loop using `requestAnimationFrame`
- Connect UI events to physics updates
- Manage play/pause/reset state
- Expose public API for embedding

**Animation Loop**:
```javascript
function animationLoop(timestamp) {
  if (!paused) {
    // Step physics forward by dt
    const newState = physics.step(dt);

    // Update history buffer for graph
    history.push({y: newState.y, t: newState.t});

    // Render current state
    springAnimator.draw(newState);
    graphPlotter.draw(history);
  }

  requestAnimationFrame(animationLoop);
}
```

**Public API** (for embedding):
```javascript
// Initialize in any webpage
const viz = new MassSpringViz(containerElement, {
  initialParams: {m: 1, b: 0.1, k: 1},
  width: 800,
  height: 600,
  headless: false  // Set true for testing without rendering
});

// Programmatic control (for AI agent testing)
viz.setParameters({m: 2, b: 0.5, k: 3});
viz.setForcing('sine', {amplitude: 1, frequency: 2});
viz.play();
viz.pause();
viz.reset();
viz.simulate(10);  // Run 10 seconds without rendering
const data = viz.getHistory();  // Extract trajectory data
```

---

## Embedding Design

**Goal**: Single-line embed in any website

**Build Output**: `dist/mass-spring-embed.js` (bundled, minified)

**Usage**:
```html
<!DOCTYPE html>
<html>
<head>
  <script src="mass-spring-embed.js"></script>
</head>
<body>
  <div id="mass-spring-container"></div>
  <script>
    new MassSpringViz(document.getElementById('mass-spring-container'), {
      initialParams: {m: 1, b: 0.2, k: 2}
    });
  </script>
</body>
</html>
```

**Design Decisions**:
- **Vanilla JavaScript**: No React/Vue/Angular dependencies
- **Self-contained CSS**: Inlined or bundled, no external stylesheets
- **Small bundle size**: Target < 50kb gzipped
- **No external fonts/icons**: Use Unicode or inline SVG if needed

---

## AI Agent Testing Strategy

### Test Type 1: Physics Accuracy Validation (Unit Tests)

**File**: `tests/physics.test.js` (using Vitest)

**Strategy**: Validate numerical solutions against known analytical solutions

**Test Cases**:

1. **Simple Harmonic Motion (SHM)**: `b=0`, `f(t)=0`
   - Analytical: `y(t) = A·cos(ω₀·t + φ)` where `ω₀ = √(k/m)`
   - Test: Run simulation, compare to analytical solution
   - Tolerance: < 0.1% error over 10 periods

2. **Exponential Decay (Overdamped)**: `b² > 4mk`, `f(t)=0`
   - Analytical: `y(t) = C₁·e^(r₁·t) + C₂·e^(r₂·t)`
   - Test: Verify exponential decay behavior

3. **Critical Damping**: `b² = 4mk`, `f(t)=0`
   - Analytical: `y(t) = (C₁ + C₂·t)·e^(-b/2m·t)`
   - Test: Verify fastest decay without oscillation

4. **Forced Resonance**: `f(t) = A·sin(ω₀·t)` at natural frequency
   - Expected: Amplitude grows linearly (if undamped)
   - Test: Verify amplitude growth rate

5. **Energy Conservation** (for undamped case):
   - Total energy: `E = ½kx² + ½mv²`
   - Test: Verify E remains constant within numerical error

**Example Test**:
```javascript
import { MassSpringSystem } from '../src/physics/MassSpringSystem.js';

test('SHM: undamped free oscillation matches analytical solution', () => {
  const system = new MassSpringSystem({
    m: 1.0, b: 0.0, k: 1.0,
    y0: 1.0, v0: 0.0
  });

  const omega0 = Math.sqrt(1.0 / 1.0); // sqrt(k/m)
  const dt = 0.01;
  const numSteps = 1000; // 10 seconds

  for (let i = 0; i < numSteps; i++) {
    const state = system.step(dt);
    const expected = Math.cos(omega0 * state.t);
    const error = Math.abs(state.y - expected);
    expect(error).toBeLessThan(0.001);
  }
});
```

---

### Test Type 2: Visual Regression Testing

**File**: `tests/visual.test.js` (using Playwright)

**Strategy**: Screenshot comparisons to detect rendering regressions

**Test Cases**:

1. **Baseline snapshots** at key parameter combinations:
   - Undamped oscillation
   - Overdamped decay
   - Resonance condition

2. **UI state snapshots**:
   - Initial load
   - After parameter change
   - Paused state
   - Reset state

**Example Test**:
```javascript
import { test, expect } from '@playwright/test';

test('renders undamped oscillation correctly', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Set parameters
  await page.fill('#mass-input', '1.0');
  await page.fill('#damping-input', '0.0');
  await page.fill('#spring-input', '1.0');

  // Wait for animation to settle
  await page.waitForTimeout(2000);

  // Take snapshot
  await expect(page).toHaveScreenshot('undamped-oscillation.png');
});
```

---

### Test Type 3: Interactive UI Testing

**File**: `tests/integration.test.js` (using Playwright)

**Strategy**: Automate user interactions and validate behavior

**Test Cases**:

1. **Parameter sliders update simulation**:
   - Move mass slider → verify physics engine receives new value
   - Check animation responds to change

2. **Play/Pause/Reset buttons**:
   - Pause → verify time stops advancing
   - Resume → verify time continues
   - Reset → verify returns to initial state

3. **Forcing function dropdown**:
   - Select "Sine" → verify sine wave appears in simulation
   - Verify amplitude/frequency controls appear

4. **Parameter validation**:
   - Enter invalid value (e.g., `m = -1`) → verify error message
   - Verify simulation doesn't break

**Example Test**:
```javascript
test('changing mass parameter updates simulation', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Get initial frequency (higher mass = lower frequency)
  const initialPeriod = await measureOscillationPeriod(page);

  // Increase mass
  await page.fill('#mass-input', '4.0');
  await page.waitForTimeout(500);

  // Verify period increased (frequency decreased)
  const newPeriod = await measureOscillationPeriod(page);
  expect(newPeriod).toBeGreaterThan(initialPeriod);
});
```

---

### Programmatic API for Headless Testing

**Critical for AI Agents**: Run simulations without browser/rendering

**Usage**:
```javascript
import { MassSpringViz } from '../src/MassSpringViz.js';

// Headless mode (no rendering)
const viz = new MassSpringViz(null, { headless: true });

viz.setParameters({m: 1, b: 0.1, k: 1});
viz.setForcing('sine', {amplitude: 0.5, frequency: 1.0});

// Run 10 seconds of simulation
viz.simulate(10);

// Extract data
const history = viz.getHistory(); // [{t, y, v}, ...]

// Validate results
const maxAmplitude = Math.max(...history.map(s => Math.abs(s.y)));
expect(maxAmplitude).toBeLessThan(2.0); // Sanity check
```

---

## File Structure

```
mass-spring/
├── index.html                    # Demo page
├── DESIGN.md                     # This file
├── CLAUDE.md                     # Instructions for AI agents
├── package.json                  # Dependencies
├── vite.config.js                # Build configuration
├── playwright.config.js          # Test configuration
├── .gitignore                    # Git ignore rules
│
├── src/
│   ├── physics/
│   │   ├── MassSpringSystem.js   # Core physics engine (ODE solver)
│   │   ├── integrators.js        # RK4 numerical integrator
│   │   └── forcingFunctions.js   # Preset forcing functions
│   │
│   ├── rendering/
│   │   ├── SpringAnimator.js     # Canvas-based spring animation
│   │   └── GraphPlotter.js       # Position vs. time graph
│   │
│   ├── ui/
│   │   └── ControlPanel.js       # Parameter sliders and controls
│   │
│   └── MassSpringViz.js          # Main orchestration class
│
├── tests/
│   ├── physics.test.js           # Unit tests (analytical validation)
│   ├── visual.test.js            # Playwright screenshot tests
│   └── integration.test.js       # UI interaction tests
│
└── dist/
    └── mass-spring-embed.js      # Bundled output for embedding
```

---

## Build System

**Tool**: Vite (fast, modern, minimal config)

**Why Vite**:
- Fast dev server with HMR
- Simple bundling for production
- Native ES modules support
- Small bundle sizes
- Built-in minification

**Commands**:
```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run test        # Run unit tests (Vitest)
npm run test:e2e    # Run Playwright tests
npm run preview     # Preview production build
```

**vite.config.js**:
```javascript
export default {
  build: {
    lib: {
      entry: 'src/MassSpringViz.js',
      name: 'MassSpringViz',
      fileName: 'mass-spring-embed'
    },
    rollupOptions: {
      output: {
        format: 'umd',
        globals: {}
      }
    }
  }
}
```

---

## Development Workflow for AI Agents

### When implementing new features:

1. **Start with physics layer** (if applicable)
   - Write the pure function
   - Add unit test with analytical validation
   - Verify deterministic behavior

2. **Add rendering** (if visual change)
   - Implement in stateless renderer
   - Take baseline screenshot with Playwright
   - Verify no visual regressions

3. **Wire up UI** (if user-facing)
   - Add control elements
   - Write integration test for interaction
   - Validate parameter ranges

4. **Update documentation**
   - Document API changes in this file
   - Add examples to CLAUDE.md if helpful

### Before committing:

```bash
npm run test        # All unit tests must pass
npm run test:e2e    # All E2E tests must pass
npm run build       # Must build successfully
```

---

## Physics Validation Reference

### Natural Frequency
```
ω₀ = √(k/m)  [rad/s]
f₀ = ω₀/(2π)  [Hz]
T₀ = 1/f₀     [s]
```

### Damping Regimes
```
Underdamped:    b² < 4mk  → Oscillates with decay
Critically damped: b² = 4mk  → Fastest decay, no oscillation
Overdamped:     b² > 4mk  → Slow decay, no oscillation
```

### Damping Ratio
```
ζ = b / (2√(mk))
ζ < 1: Underdamped
ζ = 1: Critical
ζ > 1: Overdamped
```

### Quality Factor (for resonance)
```
Q = √(mk) / b = 1 / (2ζ)
Higher Q → sharper resonance peak
```

---

## Performance Targets

- **Frame rate**: 60 FPS (16.67ms per frame)
- **Bundle size**: < 50kb gzipped
- **Load time**: < 1s on 3G connection
- **Memory**: < 50MB heap usage
- **Simulation accuracy**: < 0.1% error vs. analytical solutions

---

## Browser Compatibility

- **Modern browsers** (last 2 versions):
  - Chrome, Firefox, Safari, Edge
- **Required features**:
  - Canvas API
  - ES6 modules
  - requestAnimationFrame

---

## Future Extensibility (Not in MVP)

Potential enhancements (design allows for):
- Multiple springs in series/parallel
- 2D motion (horizontal + vertical)
- Non-linear springs (F = -kx³)
- Collision detection with boundaries
- Phase plane visualization (position vs. velocity)
- Export data as CSV
- Custom forcing function via formula input
- Fourier analysis of motion

---

## Summary for AI Agents

**When working on this codebase:**

1. **Physics changes**: Always validate against analytical solutions
2. **Rendering changes**: Run visual regression tests
3. **UI changes**: Test interactions with Playwright
4. **Keep separation of concerns**: Physics ≠ Rendering ≠ UI
5. **Maintain determinism**: No random numbers, no Date.now() in physics
6. **Document assumptions**: If you make a trade-off, document it here
7. **Test before commit**: All tests must pass

**Key principle**: This is an educational tool. Correctness > cleverness. Students must be able to trust the physics.
