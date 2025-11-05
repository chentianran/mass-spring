# Mass-Spring System Visualization

An educational physics simulation tool for teaching mass-spring-damper systems.

## Project Status

**Phase 1: Physics Engine - COMPLETE ✓**

The core physics engine is fully implemented, tested, and validated with 40 passing tests.

## What's Been Implemented

### Physics Engine (Layer 1)

#### Core Components

1. **RK4 Integrator** (`src/physics/integrators.js`)
   - 4th-order Runge-Kutta numerical integration
   - High accuracy (O(dt^4) local error)
   - Comparison Euler method included for testing
   - Deterministic, pure functions

2. **Forcing Functions** (`src/physics/forcingFunctions.js`)
   - `none`: No external force
   - `sine`: Sinusoidal forcing for resonance studies
   - `cosine`: Cosinusoidal forcing
   - `step`: Heaviside step function
   - `square`: Square wave
   - `impulse`: Dirac delta approximation
   - All configurable with amplitude, frequency, timing parameters

3. **Mass-Spring System** (`src/physics/MassSpringSystem.js`)
   - Solves: `m·y'' = -b·y' - k·y + f(t)`
   - Complete API for headless operation
   - Parameter validation
   - Real-time parameter updates
   - System property calculations (natural frequency, damping ratio, etc.)
   - Energy calculation for validation

### Test Suite

**40 comprehensive tests across 3 test files:**

1. **Physics Validation Tests** (`tests/physics.test.js`) - 22 tests
   - Simple Harmonic Motion validation against analytical solutions
   - Energy conservation tests
   - Damping regime identification and behavior
   - Forcing functions and resonance
   - Parameter validation
   - State management
   - Numerical stability

2. **Integrator Comparison Tests** (`tests/integrator-comparison.test.js`) - 3 tests
   - RK4 vs Euler accuracy comparison
   - Long-term accuracy validation
   - Energy conservation comparison

3. **Edge Cases Tests** (`tests/edge-cases.test.js`) - 15 tests
   - Extreme parameter values
   - Boundary conditions
   - Initial condition variations
   - Forcing function edge cases
   - System property calculations

## Physics Validation

All numerical solutions are validated against known analytical solutions:

- **SHM (b=0, f=0)**: Matches `y(t) = A·cos(ω₀t)` to < 0.1% error over 10 periods
- **Energy Conservation**: < 0.01% error for undamped systems
- **Damping Regimes**: Correctly identifies and simulates underdamped, critically damped, and overdamped systems
- **Resonance**: Exhibits amplitude growth at natural frequency
- **Long-term Stability**: Maintains accuracy over 100+ oscillation periods

## Running the Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Physics Engine API

### Creating a System

```javascript
import { MassSpringSystem } from './src/physics/MassSpringSystem.js';

const system = new MassSpringSystem({
  m: 1.0,      // mass (kg)
  b: 0.1,      // damping coefficient (N·s/m)
  k: 1.0,      // spring constant (N/m)
  y0: 1.0,     // initial position (m)
  v0: 0.0      // initial velocity (m/s)
});
```

### Stepping the Simulation

```javascript
const dt = 0.016; // 60 FPS timestep

for (let i = 0; i < 1000; i++) {
  const state = system.step(dt);
  console.log(`t=${state.t.toFixed(2)}s, y=${state.y.toFixed(3)}m, v=${state.v.toFixed(3)}m/s`);
}
```

### Applying Forcing Functions

```javascript
// Sinusoidal forcing
system.setForcing('sine', {
  amplitude: 1.0,  // N
  frequency: 2.0   // Hz
});

// Step forcing
system.setForcing('step', {
  amplitude: 1.0,
  stepTime: 1.0    // s
});

// Impulse
system.setForcing('impulse', {
  amplitude: 10.0,
  impulseTime: 1.0,
  width: 0.01      // s
});
```

### Changing Parameters

```javascript
// Update system parameters mid-simulation
system.setParameters({
  m: 2.0,  // Double the mass
  b: 0.5,
  k: 3.0
});

// Get current parameters
const params = system.getParameters(); // {m, b, k}

// Get system properties
const props = system.getSystemProperties();
console.log(`Natural frequency: ${props.f0.toFixed(2)} Hz`);
console.log(`Damping regime: ${props.regime}`);
console.log(`Damping ratio: ${props.zeta.toFixed(3)}`);
console.log(`Quality factor: ${props.Q.toFixed(1)}`);
```

### State Management

```javascript
// Get current state
const state = system.getState(); // {y, v, t}

// Calculate energy
const energy = system.getEnergy(); // Joules

// Reset to initial conditions
system.reset();
```

## Key Design Principles

### 1. Determinism
- Fixed timesteps (no `Date.now()`)
- Pure functions with no side effects
- Reproducible results for same inputs

### 2. Physics Accuracy
- All numerical solutions validated against analytical solutions
- < 0.1% error tolerance
- RK4 integration for high accuracy

### 3. Testability
- Headless operation (no rendering required)
- Comprehensive test coverage
- Edge cases thoroughly tested

### 4. Separation of Concerns
- Physics layer is completely independent
- No DOM dependencies
- No rendering code mixed with physics

## System Properties

### Natural Frequency
```
ω₀ = √(k/m)  [rad/s]
f₀ = ω₀/(2π)  [Hz]
T₀ = 1/f₀     [s]
```

### Damping Regimes
```
Underdamped:      b² < 4mk  → Oscillates with decay
Critically damped: b² = 4mk  → Fastest decay, no oscillation
Overdamped:       b² > 4mk  → Slow decay, no oscillation
```

### Damping Ratio
```
ζ = b / (2√(mk))
ζ < 1: Underdamped
ζ = 1: Critical
ζ > 1: Overdamped
```

### Quality Factor
```
Q = √(mk) / b = 1 / (2ζ)
Higher Q → sharper resonance peak
```

## File Structure

```
mass-spring/
├── src/
│   └── physics/
│       ├── MassSpringSystem.js   # Core physics engine
│       ├── integrators.js        # RK4 numerical integrator
│       └── forcingFunctions.js   # Preset forcing functions
├── tests/
│   ├── physics.test.js           # Main physics validation tests
│   ├── integrator-comparison.test.js  # RK4 vs Euler comparison
│   └── edge-cases.test.js        # Edge cases and special scenarios
├── package.json                  # Dependencies and scripts
├── vite.config.js                # Build and test configuration
├── DESIGN.md                     # Detailed system design
├── CLAUDE.md                     # AI agent instructions
└── README.md                     # This file
```

## What's Next

The following layers remain to be implemented:

1. **Rendering Layer** (Layer 2)
   - Canvas-based spring animation
   - Position vs. time graph plotter

2. **UI Controls** (Layer 3)
   - Parameter sliders
   - Forcing function selection
   - Play/Pause/Reset buttons

3. **Orchestration** (Layer 4)
   - Main application class
   - Animation loop
   - Component integration
   - Embeddable bundle

4. **End-to-End Testing**
   - Playwright visual regression tests
   - UI interaction tests
   - Integration tests

## References

- **Design Document**: See `DESIGN.md` for complete architecture
- **AI Instructions**: See `CLAUDE.md` for development guidelines
- **Test Examples**: See `tests/` directory for usage patterns

## License

MIT
