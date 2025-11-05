# Instructions for AI Agents Working on Mass-Spring Visualization

## Project Context

This is an **educational physics visualization tool** for teaching mass-spring-damper systems. Students will use this to understand the relationship between system parameters (mass, damping, spring constant) and oscillatory behavior.

**Primary Goal**: Help students build intuition for the ODE: `m·y'' = -b·y' - k·y + f(t)`

**Secondary Goal**: Demonstrate that LLM agents can reliably test and maintain physics simulation code.

---

## Key Constraints

### 1. Embeddability is Critical
- Must work as a single `<script>` tag in any webpage
- Keep bundle size minimal (target < 50kb gzipped)
- No external dependencies (frameworks, large libraries)
- Self-contained styling (no external CSS files)

### 2. Physics Accuracy is Non-Negotiable
- Students must be able to trust the simulation
- All physics changes MUST be validated against analytical solutions
- Never sacrifice correctness for performance or aesthetics
- When in doubt, consult DESIGN.md for validation formulas

### 3. Testability by AI Agents
- Code must be deterministic (no random numbers, no Date.now() in physics)
- All components must support headless operation
- Write tests that can be verified programmatically
- Document expected behavior in test comments

---

## Development Guidelines

### Before Starting Any Task

1. **Read DESIGN.md** - Understand the architecture
2. **Check existing tests** - See what's already validated
3. **Understand the physics** - Don't guess, calculate
4. **Plan your approach** - Outline changes before coding

### When Writing Physics Code

```javascript
// ✅ GOOD: Deterministic, pure function
function step(state, params, dt) {
  const {y, v, t} = state;
  const {m, b, k} = params;
  const force = -k*y - b*v + forcing(t);
  const a = force / m;
  return {y: y + v*dt, v: v + a*dt, t: t + dt};
}

// ❌ BAD: Uses Date.now(), non-deterministic
function step(state, params) {
  const now = Date.now();
  const dt = now - this.lastTime;
  // ... rest of code
}
```

**Always include a unit test that validates against an analytical solution.**

### When Writing Rendering Code

```javascript
// ✅ GOOD: Stateless, takes state as input
class SpringAnimator {
  draw(state, canvas) {
    const {y, v, t} = state;
    // Draw based on state
  }
}

// ❌ BAD: Stores state, hard to test
class SpringAnimator {
  constructor() {
    this.currentY = 0;  // Don't do this
  }
  update() {
    this.currentY += 0.1;  // Don't do this
  }
}
```

**Rendering should be a pure visual representation of physics state.**

### When Adding UI Controls

1. **Validate user input** - Don't allow `m ≤ 0`, `k < 0`, or `b < 0`
2. **Use reasonable ranges** - See DESIGN.md for recommended parameter ranges
3. **Update in real-time** - Changes should be reflected immediately in simulation
4. **Write an integration test** - Use Playwright to verify the interaction

### Testing Requirements

**Before ANY commit, all tests must pass:**

```bash
npm run test        # Unit tests (physics validation)
npm run test:e2e    # End-to-end tests (UI + visual regression)
npm run build       # Must build without errors
```

**If you add a feature, add tests:**
- **Physics feature** → Unit test with analytical validation
- **Visual feature** → Playwright screenshot test
- **UI feature** → Playwright interaction test

---

## Common Tasks & How to Approach Them

### Task: "Add a new forcing function preset"

1. **Add to `src/physics/forcingFunctions.js`**:
   ```javascript
   export const presets = {
     // ... existing
     square: (t, {amplitude, frequency}) => {
       const period = 1 / frequency;
       return amplitude * (Math.floor(t / period) % 2 === 0 ? 1 : -1);
     }
   };
   ```

2. **Add to UI dropdown** in `src/ui/ControlPanel.js`

3. **Write unit test** in `tests/physics.test.js`:
   - Verify forcing function returns expected values at key times
   - Test with simulation, verify behavior matches expectations

4. **Update DESIGN.md** if this changes the API

### Task: "Fix a bug in the physics engine"

1. **Reproduce the bug** - Write a failing test first
2. **Understand the root cause** - Don't guess
3. **Fix the minimal code** - Don't refactor unrelated things
4. **Verify the fix** - Test should now pass
5. **Check for regressions** - Run full test suite
6. **Document if non-obvious** - Add comment explaining the fix

### Task: "Improve rendering performance"

1. **Profile first** - Use browser DevTools to identify bottleneck
2. **Don't optimize prematurely** - Only optimize if < 60 FPS
3. **Preserve visual correctness** - Take before/after screenshots
4. **Measure improvement** - Document FPS before/after
5. **Update visual regression tests** if rendering changes

### Task: "Add parameter validation to UI"

1. **Define valid ranges** in `src/ui/ControlPanel.js`
2. **Show helpful error messages** - "Mass must be greater than 0"
3. **Prevent invalid states** - Don't let simulation break
4. **Write Playwright test**:
   ```javascript
   test('shows error for negative mass', async ({ page }) => {
     await page.fill('#mass-input', '-1');
     await expect(page.locator('.error-message')).toBeVisible();
   });
   ```

---

## Physics Validation Quick Reference

### Simple Harmonic Motion (SHM)
**Parameters**: `b = 0`, `f(t) = 0`
**Analytical**: `y(t) = y₀·cos(ω₀t)` where `ω₀ = √(k/m)`
**Test**: Numerical solution should match within 0.1% over 10 periods

### Overdamped System
**Condition**: `b² > 4mk`
**Behavior**: Exponential decay, no oscillation
**Test**: Verify zero crossings = 0 (or 1 at most)

### Critically Damped
**Condition**: `b² = 4mk`
**Behavior**: Fastest return to equilibrium without oscillation
**Test**: Verify faster than overdamped, no oscillation

### Underdamped
**Condition**: `b² < 4mk`
**Behavior**: Oscillation with exponential decay
**Test**: Measure amplitude decay rate, compare to `e^(-bt/2m)`

### Resonance
**Forcing**: `f(t) = A·sin(ω₀t)` at natural frequency
**Behavior**: Amplitude grows (if undamped) or saturates (if damped)
**Test**: Verify amplitude growth/saturation matches theory

---

## Code Style

- **Use ES6 modules**: `import`/`export`, no CommonJS
- **Prefer `const`**: Only use `let` when reassignment needed
- **Clear naming**: `springConstant` not `k` in UI code (use `k` in physics formulas)
- **Document units**: `mass // kg`, `time // seconds`
- **Comments for "why"**: Explain reasoning, not what the code does

---

## Architecture Reminders

**4 Layers (don't mix them):**

1. **Physics** (`src/physics/`) - Pure functions, no rendering, no DOM
2. **Rendering** (`src/rendering/`) - Stateless canvas drawing
3. **UI** (`src/ui/`) - DOM controls, event handlers
4. **Orchestration** (`src/MassSpringViz.js`) - Connects everything

**Data flow:**
```
User input → UI → Orchestrator → Physics → State
                                           ↓
State → Rendering → Canvas display
```

---

## When You're Stuck

1. **Check DESIGN.md** - Detailed architecture and formulas
2. **Look at tests** - They show expected behavior
3. **Verify physics** - Use external calculator/Wolfram Alpha
4. **Ask questions** - It's better to clarify than guess

---

## What Success Looks Like

✅ **All tests pass** (`npm run test` and `npm run test:e2e`)
✅ **Physics is validated** (analytical solutions match numerical)
✅ **Bundle size is reasonable** (check `dist/` size after `npm run build`)
✅ **Code is deterministic** (same inputs → same outputs, always)
✅ **Documentation is updated** (DESIGN.md reflects reality)
✅ **Commits are atomic** (one logical change per commit)

---

## Emergency Contacts / Resources

- **Numerical Methods**: RK4 is implemented in `src/physics/integrators.js`
- **Canvas API**: MDN Web Docs
- **Physics Formulas**: See DESIGN.md "Physics Validation Reference" section
- **Test Examples**: Look in `tests/` directory for patterns

---

## Final Reminder

This tool will be used by **students learning physics**. They trust that the simulation is correct. If you're not 100% certain about a physics change, **validate it with a test against a known analytical solution** before committing.

When in doubt: **Correctness > Performance > Cleverness**
