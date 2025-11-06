/**
 * Simple demonstration of the Mass-Spring Physics Engine
 *
 * Run this with: node demo.js
 */

import { MassSpringSystem } from './src/physics/MassSpringSystem.js';

console.log('='.repeat(60));
console.log('Mass-Spring System Physics Engine Demo');
console.log('='.repeat(60));
console.log();

// Demo 1: Simple Harmonic Motion (SHM)
console.log('Demo 1: Simple Harmonic Motion (No Damping)');
console.log('-'.repeat(60));

const systemSHM = new MassSpringSystem({
  m: 1.0,
  b: 0.0,  // No damping
  k: 1.0,
  y0: 1.0,
  v0: 0.0
});

const props1 = systemSHM.getSystemProperties();
console.log(`Natural frequency: ${props1.f0.toFixed(3)} Hz`);
console.log(`Period: ${props1.T0.toFixed(3)} s`);
console.log(`Damping regime: ${props1.regime}`);
console.log();

console.log('Time (s) | Position (m) | Velocity (m/s) | Energy (J)');
console.log('-'.repeat(60));

const dt = 0.1;
for (let i = 0; i <= 20; i++) {
  const state = systemSHM.getState();
  const energy = systemSHM.getEnergy();
  console.log(
    `${state.t.toFixed(1).padStart(8)} | ` +
    `${state.y.toFixed(6).padStart(12)} | ` +
    `${state.v.toFixed(6).padStart(14)} | ` +
    `${energy.toFixed(6).padStart(10)}`
  );
  systemSHM.step(dt);
}

console.log();
console.log('Notice: Energy remains constant (conservation)');
console.log();
console.log();

// Demo 2: Damped Oscillation
console.log('Demo 2: Underdamped Oscillation');
console.log('-'.repeat(60));

const systemDamped = new MassSpringSystem({
  m: 1.0,
  b: 0.2,  // Light damping
  k: 1.0,
  y0: 1.0,
  v0: 0.0
});

const props2 = systemDamped.getSystemProperties();
console.log(`Damping regime: ${props2.regime}`);
console.log(`Damping ratio: ${props2.zeta.toFixed(3)}`);
console.log(`Damped frequency: ${props2.fD.toFixed(3)} Hz`);
console.log(`Quality factor: ${props2.Q.toFixed(2)}`);
console.log();

console.log('Time (s) | Position (m) | Energy (J)');
console.log('-'.repeat(60));

for (let i = 0; i <= 20; i++) {
  const state = systemDamped.getState();
  const energy = systemDamped.getEnergy();
  console.log(
    `${state.t.toFixed(1).padStart(8)} | ` +
    `${state.y.toFixed(6).padStart(12)} | ` +
    `${energy.toFixed(6).padStart(10)}`
  );
  systemDamped.step(dt);
}

console.log();
console.log('Notice: Energy decays due to damping');
console.log();
console.log();

// Demo 3: Forced Resonance
console.log('Demo 3: Forced Oscillation at Resonance');
console.log('-'.repeat(60));

const systemResonance = new MassSpringSystem({
  m: 1.0,
  b: 0.05,  // Very light damping
  k: 1.0,
  y0: 0.0,
  v0: 0.0
});

const props3 = systemResonance.getSystemProperties();
const resonanceFreq = props3.f0;

console.log(`Natural frequency: ${resonanceFreq.toFixed(3)} Hz`);
console.log(`Driving frequency: ${resonanceFreq.toFixed(3)} Hz (resonance!)`);
console.log(`Damping ratio: ${props3.zeta.toFixed(4)}`);
console.log();

// Drive at natural frequency
systemResonance.setForcing('sine', {
  amplitude: 0.1,
  frequency: resonanceFreq
});

console.log('Time (s) | Position (m) | Max Amplitude (m)');
console.log('-'.repeat(60));

let maxAmplitude = 0;
for (let i = 0; i <= 50; i++) {
  const state = systemResonance.getState();
  maxAmplitude = Math.max(maxAmplitude, Math.abs(state.y));

  if (i % 5 === 0) {
    console.log(
      `${state.t.toFixed(1).padStart(8)} | ` +
      `${state.y.toFixed(6).padStart(12)} | ` +
      `${maxAmplitude.toFixed(6).padStart(17)}`
    );
  }

  systemResonance.step(dt);
}

console.log();
console.log('Notice: Amplitude grows over time due to resonance');
console.log();
console.log();

// Demo 4: Step Response (Different Damping Regimes)
console.log('Demo 4: Step Response - Damping Regime Comparison');
console.log('-'.repeat(60));

const regimes = [
  { name: 'Underdamped', m: 1.0, b: 0.5, k: 1.0 },
  { name: 'Critically Damped', m: 1.0, b: 2.0, k: 1.0 },
  { name: 'Overdamped', m: 1.0, b: 5.0, k: 1.0 }
];

const systems = regimes.map(r => {
  const sys = new MassSpringSystem({
    m: r.m,
    b: r.b,
    k: r.k,
    y0: 0.0,
    v0: 0.0
  });
  sys.setForcing('step', { amplitude: 1.0, stepTime: 0.0 });
  return { name: r.name, system: sys };
});

console.log('Time (s) | Underdamped | Critical    | Overdamped');
console.log('-'.repeat(60));

for (let i = 0; i <= 50; i++) {
  if (i % 5 === 0) {
    const positions = systems.map(s => {
      const state = s.system.getState();
      return state.y.toFixed(6).padStart(11);
    });

    console.log(
      `${systems[0].system.getState().t.toFixed(1).padStart(8)} | ` +
      positions.join(' | ')
    );
  }

  systems.forEach(s => s.system.step(dt));
}

console.log();
console.log('Notice: Critical damping reaches equilibrium fastest');
console.log();
console.log();

// Summary
console.log('='.repeat(60));
console.log('Demo Complete!');
console.log('='.repeat(60));
console.log();
console.log('The physics engine successfully demonstrates:');
console.log('  ✓ Simple Harmonic Motion with energy conservation');
console.log('  ✓ Damped oscillations with energy dissipation');
console.log('  ✓ Resonance behavior with amplitude growth');
console.log('  ✓ Different damping regimes (under/critical/over)');
console.log();
console.log('All simulations use RK4 integration for high accuracy.');
console.log('See tests/ directory for comprehensive validation against');
console.log('analytical solutions.');
console.log();
