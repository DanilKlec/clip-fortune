import { Suspense, createElement, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import brainAsset from "@/assets/brain_areas.glb.asset.json";
import brainImg from "@/assets/brain-preview.png";

const BASE_COLOR = "#FFFFFF";
const ACTIVITY_COLORS = ["var(--volt)", "#F7A11A", "#F26B4A", "var(--sky)"];

// Approx. patches per mesh and fraction that light up
const PATCHES_PER_MESH = 40;
const ACTIVE_FRACTION = 0.35;

interface ActiveRegion {
  material: THREE.MeshStandardMaterial;
  phase: number;
  speed: number;
  peak: number;
}

function splitMeshIntoPatches(mesh: THREE.Mesh, regions: ActiveRegion[]) {
  const src = mesh.geometry as THREE.BufferGeometry;
  // Ensure non-indexed so each face has independent vertices
  const geom = src.index ? src.toNonIndexed() : src.clone();
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;
  const faceCount = pos.count / 3;
  if (faceCount < 4) {
    // Too small to subdivide — leave as flat white
    mesh.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(BASE_COLOR),
      metalness: 0.05,
      roughness: 0.55,
    });
    return;
  }

  // Compute face centroids
  const centroids = new Float32Array(faceCount * 3);
  for (let f = 0; f < faceCount; f++) {
    const i0 = f * 3;
    const cx =
      (pos.getX(i0) + pos.getX(i0 + 1) + pos.getX(i0 + 2)) / 3;
    const cy =
      (pos.getY(i0) + pos.getY(i0 + 1) + pos.getY(i0 + 2)) / 3;
    const cz =
      (pos.getZ(i0) + pos.getZ(i0 + 1) + pos.getZ(i0 + 2)) / 3;
    centroids[f * 3] = cx;
    centroids[f * 3 + 1] = cy;
    centroids[f * 3 + 2] = cz;
  }

  // Seed patches by picking random face centroids
  const patchCount = Math.min(
    faceCount,
    Math.max(6, Math.round(PATCHES_PER_MESH * Math.min(1, faceCount / 400))),
  );
  const seedIdx: number[] = [];
  const usedSeeds = new Set<number>();
  while (seedIdx.length < patchCount) {
    const idx = Math.floor(Math.random() * faceCount);
    if (!usedSeeds.has(idx)) {
      usedSeeds.add(idx);
      seedIdx.push(idx);
    }
  }
  const seedPos = seedIdx.map((f) => [
    centroids[f * 3],
    centroids[f * 3 + 1],
    centroids[f * 3 + 2],
  ]);

  // Assign each face to nearest seed
  const faceGroup = new Int32Array(faceCount);
  for (let f = 0; f < faceCount; f++) {
    const cx = centroids[f * 3];
    const cy = centroids[f * 3 + 1];
    const cz = centroids[f * 3 + 2];
    let best = 0;
    let bestD = Infinity;
    for (let s = 0; s < seedPos.length; s++) {
      const dx = cx - seedPos[s][0];
      const dy = cy - seedPos[s][1];
      const dz = cz - seedPos[s][2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    faceGroup[f] = best;
  }

  // Reorder face vertices grouped by seed
  const facesByGroup: number[][] = Array.from({ length: patchCount }, () => []);
  for (let f = 0; f < faceCount; f++) facesByGroup[faceGroup[f]].push(f);

  const attrNames = Object.keys(geom.attributes);
  const newAttrs: Record<string, Float32Array> = {};
  for (const name of attrNames) {
    const a = geom.getAttribute(name) as THREE.BufferAttribute;
    newAttrs[name] = new Float32Array(a.array.length);
  }

  const newGeom = new THREE.BufferGeometry();
  let writeFace = 0;
  for (let g = 0; g < patchCount; g++) {
    const groupStart = writeFace * 3;
    for (const f of facesByGroup[g]) {
      for (let v = 0; v < 3; v++) {
        const srcVert = f * 3 + v;
        const dstVert = writeFace * 3 + v;
        for (const name of attrNames) {
          const a = geom.getAttribute(name) as THREE.BufferAttribute;
          const itemSize = a.itemSize;
          for (let k = 0; k < itemSize; k++) {
            newAttrs[name][dstVert * itemSize + k] =
              a.array[srcVert * itemSize + k];
          }
        }
      }
      writeFace++;
    }
    const groupCount = writeFace * 3 - groupStart;
    if (groupCount > 0) newGeom.addGroup(groupStart, groupCount, g);
  }

  for (const name of attrNames) {
    const a = geom.getAttribute(name) as THREE.BufferAttribute;
    newGeom.setAttribute(
      name,
      new THREE.BufferAttribute(newAttrs[name], a.itemSize),
    );
  }
  newGeom.computeBoundingBox();
  newGeom.computeBoundingSphere();

  // Build materials — most white, a fraction active with colored emissive
  const materials: THREE.MeshStandardMaterial[] = [];
  for (let g = 0; g < patchCount; g++) {
    const isActive = Math.random() < ACTIVE_FRACTION;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(BASE_COLOR),
      emissive: new THREE.Color(
        isActive
          ? ACTIVITY_COLORS[Math.floor(Math.random() * ACTIVITY_COLORS.length)]
          : "#ffffff",
      ),
      emissiveIntensity: isActive ? 0 : 0,
      metalness: 0.05,
      roughness: 0.55,
    });
    materials.push(mat);
    if (isActive) {
      regions.push({
        material: mat,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
        peak: 0.7 + Math.random() * 0.9,
      });
    }
  }

  mesh.geometry.dispose();
  mesh.geometry = newGeom;
  mesh.material = materials;
}

function BrainModel() {
  const { scene } = useGLTF(brainAsset.url);
  const groupRef = useRef<THREE.Group>(null);
  const regionsRef = useRef<ActiveRegion[]>([]);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) meshes.push(obj as THREE.Mesh);
    });

    const box = new THREE.Box3().setFromObject(cloned);

    const regions: ActiveRegion[] = [];
    meshes.forEach((mesh) => {
      splitMeshIntoPatches(mesh, regions);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });
    regionsRef.current = regions;

    // Center & scale to fit view
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.2 / maxDim;
    cloned.scale.setScalar(scale);
    const center = new THREE.Vector3();
    box.getCenter(center);
    cloned.position.sub(center.multiplyScalar(scale));
  }, [cloned]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.25;
      groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.08;
    }
    for (const r of regionsRef.current) {
      const pulse = Math.max(0, Math.sin(t * r.speed + r.phase));
      r.material.emissiveIntensity = pulse * r.peak;
    }
  });

  // Use createElement to bypass the JSX source instrumentation that would
  // otherwise inject `data-tsd-source` onto the R3F <primitive> and crash.
  return createElement("primitive", { ref: groupRef, object: cloned });
}

// Ensure GLB is preloaded (browser only)
if (typeof window !== "undefined") {
  useGLTF.preload(brainAsset.url);
}

function FallbackImg() {
  return (
    <img
      src={brainImg}
      alt="Brain activity map"
      className="h-full w-auto object-contain"
      loading="lazy"
    />
  );
}

export function Brain3D() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <FallbackImg />;

  return (
    <div className="relative h-full w-full">
      {/* Soft glow ring behind the brain */}
      <div
        className="pointer-events-none absolute inset-0 animate-pulse"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(200,243,29,0.22), transparent 60%)",
        }}
      />
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4.2], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {createElement("ambientLight", { intensity: 0.28, color: "#f4f2ee" })}
        {createElement("hemisphereLight", {
          args: ["#ffffff", "#3b3340", 0.55],
        })}
        {createElement("directionalLight", {
          position: [4, 5, 3],
          intensity: 1.35,
          color: "#ffffff",
        })}
        {createElement("directionalLight", {
          position: [-3, -1, -2],
          intensity: 0.25,
          color: "#c9d4ff",
        })}
        <Suspense fallback={null}>
          <BrainModel />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          rotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}

export default Brain3D;