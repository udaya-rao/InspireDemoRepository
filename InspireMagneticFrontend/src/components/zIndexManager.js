// Simple shared z-index manager so different overlays can coordinate stacking
let zSeed = 2000; // start above most bootstrap/tabler layers
let topId = null;

export function allocateTop(id) {
  zSeed += 1;
  topId = id;
  return zSeed;
}

export function bringToFront(setter, id) {
  setter(allocateTop(id));
}

export function isTop(id) {
  return topId === id;
}

export function currentSeed() {
  return zSeed;
}


