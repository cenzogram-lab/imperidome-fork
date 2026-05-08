import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const NEON = "#39FF14";
const NEON_COLOR = new THREE.Color(NEON);
const BUG_COUNT = 45;
const DOME_RADIUS = 3;
const SPAWN_MIN = 4.5;
const SPAWN_MAX = 6;

// ─── Bug particle state ───────────────────────────────────────────────────────
interface BugState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  opacity: number;
  dissolving: boolean;
  dissolveProgress: number;
}

function randomSpawnPosition(): THREE.Vector3 {
  const r = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
  // Hemisphere spawn — keep y >= -1 so bugs come from sides + top
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI * 0.75; // 0..135deg — mostly upper hemisphere
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, Math.max(y, -0.5), z);
}

function randomVelocityTowardCenter(pos: THREE.Vector3): THREE.Vector3 {
  const speed = 0.012 + Math.random() * 0.018;
  return pos.clone().negate().normalize().multiplyScalar(speed);
}

// ─── Bugs (InstancedMesh) ─────────────────────────────────────────────────────
function Bugs() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const bugs = useMemo<BugState[]>(() => {
    return Array.from({ length: BUG_COUNT }, () => {
      const pos = randomSpawnPosition();
      return {
        position: pos,
        velocity: randomVelocityTowardCenter(pos),
        opacity: 0.7 + Math.random() * 0.3,
        dissolving: false,
        dissolveProgress: 0,
      };
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArr = useMemo(
    () => Array.from({ length: BUG_COUNT }, () => NEON_COLOR.clone()),
    [],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < BUG_COUNT; i++) {
      const bug = bugs[i];

      if (bug.dissolving) {
        bug.dissolveProgress += 0.04;
        bug.opacity = Math.max(0, 0.8 - bug.dissolveProgress);
        if (bug.opacity <= 0) {
          // Respawn
          const newPos = randomSpawnPosition();
          bug.position.copy(newPos);
          bug.velocity.copy(randomVelocityTowardCenter(newPos));
          bug.opacity = 0.7 + Math.random() * 0.3;
          bug.dissolving = false;
          bug.dissolveProgress = 0;
        }
      } else {
        // Move bug toward center
        bug.position.addScaledVector(bug.velocity, 1);

        const distFromCenter = bug.position.length();

        if (distFromCenter <= DOME_RADIUS + 0.05) {
          // Hit the dome — 50% bounce, 50% dissolve
          if (Math.random() < 0.5) {
            // Bounce: reflect velocity relative to dome surface normal
            const normal = bug.position.clone().normalize();
            const dot = bug.velocity.dot(normal);
            bug.velocity.addScaledVector(normal, -2 * dot);
            // Small nudge outward so it doesn't re-collide immediately
            bug.position.addScaledVector(normal, 0.15);
          } else {
            // Dissolve
            bug.dissolving = true;
            bug.dissolveProgress = 0;
          }
        }

        // Safety: if bug somehow escaped very far, respawn
        if (distFromCenter > SPAWN_MAX + 1) {
          const newPos = randomSpawnPosition();
          bug.position.copy(newPos);
          bug.velocity.copy(randomVelocityTowardCenter(newPos));
        }
      }

      // Apply transform to instance
      dummy.position.copy(bug.position);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Update color with opacity baked into emissiveIntensity via color alpha hack
      // We use a separate color per instance to encode opacity (luminance trick)
      const lum = bug.opacity;
      colorArr[i].setRGB(
        NEON_COLOR.r * lum,
        NEON_COLOR.g * lum,
        NEON_COLOR.b * lum,
      );
      mesh.setColorAt(i, colorArr[i]);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, BUG_COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.055, 4, 4]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}

// ─── Dome (hemisphere wireframe) ─────────────────────────────────────────────
function Dome() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Wireframe hemisphere */}
      <mesh>
        <sphereGeometry
          args={[
            DOME_RADIUS,
            32,
            16,
            0, // phiStart
            Math.PI * 2, // phiLength
            0, // thetaStart
            Math.PI / 2, // thetaLength — top half only
          ]}
        />
        <meshBasicMaterial color={NEON} wireframe transparent opacity={0.85} />
      </mesh>

      {/* Glow layer — very slightly larger, low opacity */}
      <mesh>
        <sphereGeometry
          args={[DOME_RADIUS * 1.015, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshBasicMaterial
          color={NEON}
          transparent
          opacity={0.04}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Base ring at y=0 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[DOME_RADIUS - 0.02, DOME_RADIUS + 0.02, 64]} />
        <meshBasicMaterial color={NEON} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ─── Faint grid floor ─────────────────────────────────────────────────────────
function GridFloor() {
  const gridHelper = useMemo(
    () =>
      new THREE.GridHelper(
        16,
        20,
        new THREE.Color(NEON),
        new THREE.Color(NEON),
      ),
    [],
  );

  useEffect(() => {
    const mat = gridHelper.material;
    const applyOpacity = (m: THREE.LineBasicMaterial) => {
      m.transparent = true;
      m.opacity = 0.06;
    };
    if (Array.isArray(mat)) mat.forEach(applyOpacity);
    else applyOpacity(mat as THREE.LineBasicMaterial);
  }, [gridHelper]);

  return <primitive object={gridHelper} position={[0, 0, 0]} />;
}

// ─── Scene root ───────────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight
        position={[0, 4, 0]}
        intensity={1.5}
        color={NEON}
        distance={20}
      />
      {/* Second subtle light from below for better dome visibility */}
      <pointLight
        position={[0, -3, 2]}
        intensity={0.6}
        color={NEON}
        distance={14}
      />
      <GridFloor />
      <Dome />
      <Bugs />
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ImperidomeBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ fov: 50, position: [0, 2, 8], near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        dpr={[1, 1.5]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
