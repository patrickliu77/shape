import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Surface3DSpec } from "../types";
import { useLang } from "../lib/lang";
import { useT } from "../lib/translate";

type Props = { spec: Surface3DSpec };

const STR = {
  reset: "↻ Reset view",
  drag: "Drag to rotate · scroll to zoom",
};

// Map height → colour along a violet→cyan→yellow ramp. Highlights extrema.
function heightColor(t: number, target: THREE.Color) {
  // t in [0, 1]
  const c1 = new THREE.Color(0x4338ca); // indigo
  const c2 = new THREE.Color(0x06b6d4); // cyan
  const c3 = new THREE.Color(0xfbbf24); // amber
  if (t < 0.5) {
    target.copy(c1).lerp(c2, t * 2);
  } else {
    target.copy(c2).lerp(c3, (t - 0.5) * 2);
  }
}

export function Surface3DView({ spec }: Props) {
  const { lang } = useLang();
  void lang;
  const t = {
    reset: useT(STR.reset),
    drag: useT(STR.drag),
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(spec.params.map((p) => [p.name, p.default])),
  );

  // Reset values when theorem changes
  useEffect(() => {
    setValues(Object.fromEntries(spec.params.map((p) => [p.name, p.default])));
  }, [spec]);

  const liveNarration = spec.narrate?.(values, lang);

  // Initial Three.js setup — runs once per mount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111216);

    const w = container.clientWidth;
    const h = container.clientHeight || 360;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(4.5, 4.5, 4.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 18;
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(5, 8, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9ca3af, 0.3);
    fill.position.set(-4, -2, 5);
    scene.add(fill);

    // Coordinate axes (gray, semi-transparent)
    const axesGroup = new THREE.Group();
    const axisMat = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.7 });
    const xRange = spec.xRange[1] - spec.xRange[0];
    const yRange = spec.yRange[1] - spec.yRange[0];
    const axisHalf = Math.max(xRange, yRange) * 0.55;
    for (const dir of [
      [axisHalf, 0, 0],
      [0, 0, axisHalf],
      [0, axisHalf, 0],
    ]) {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(dir[0], dir[1], dir[2]),
      ]);
      axesGroup.add(new THREE.Line(geom, axisMat));
    }
    scene.add(axesGroup);

    // Build initial surface mesh (placeholder; will be replaced)
    const surfaceMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
      roughness: 0.55,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), surfaceMat);
    scene.add(mesh);
    meshRef.current = mesh;

    // Wireframe overlay for the grid pattern
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
    const wire = new THREE.LineSegments(new THREE.BufferGeometry(), wireMat);
    mesh.add(wire);
    (mesh as unknown as { _wire: THREE.LineSegments })._wire = wire;

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight || 360;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      mesh.geometry.dispose();
      surfaceMat.dispose();
      wireMat.dispose();
      wire.geometry.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [spec]);

  // Rebuild the surface geometry whenever values change.
  const grid = useMemo(() => spec.resolution ?? 48, [spec.resolution]);
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const [x0, x1] = spec.xRange;
    const [y0, y1] = spec.yRange;
    const dx = (x1 - x0) / grid;
    const dy = (y1 - y0) / grid;

    // Sample heights and find min/max for colour normalisation
    const heights = new Float32Array((grid + 1) * (grid + 1));
    let zMin = Infinity;
    let zMax = -Infinity;
    for (let i = 0; i <= grid; i++) {
      for (let j = 0; j <= grid; j++) {
        const x = x0 + i * dx;
        const y = y0 + j * dy;
        const z = spec.fn(x, y, values);
        heights[i * (grid + 1) + j] = z;
        if (Number.isFinite(z)) {
          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;
        }
      }
    }
    // Override with explicit zRange if provided
    if (spec.zRange) {
      zMin = spec.zRange[0];
      zMax = spec.zRange[1];
    }
    if (zMin === zMax) zMax = zMin + 1;

    const verts: number[] = [];
    const colors: number[] = [];
    const tmp = new THREE.Color();
    for (let i = 0; i <= grid; i++) {
      for (let j = 0; j <= grid; j++) {
        const x = x0 + i * dx;
        const y = y0 + j * dy;
        const z = heights[i * (grid + 1) + j];
        verts.push(x, z, y); // map (x, y) plane to (x, z) world; z (height) is up
        const t = (z - zMin) / (zMax - zMin);
        heightColor(Math.max(0, Math.min(1, t)), tmp);
        colors.push(tmp.r, tmp.g, tmp.b);
      }
    }
    const indices: number[] = [];
    const wireIndices: number[] = [];
    const idx = (i: number, j: number) => i * (grid + 1) + j;
    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        const a = idx(i, j);
        const b = idx(i + 1, j);
        const c = idx(i + 1, j + 1);
        const d = idx(i, j + 1);
        indices.push(a, b, c, a, c, d);
        // sparse wire — every 4th line so the grid reads
        if (i % 4 === 0) wireIndices.push(a, b);
        if (j % 4 === 0) wireIndices.push(a, d);
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const old = mesh.geometry;
    mesh.geometry = geom;
    old.dispose();

    // Update wireframe overlay
    const wire = (mesh as unknown as { _wire: THREE.LineSegments })._wire;
    if (wire) {
      const wireGeom = new THREE.BufferGeometry();
      wireGeom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      wireGeom.setIndex(wireIndices);
      const oldWire = wire.geometry;
      wire.geometry = wireGeom;
      oldWire.dispose();
    }
  }, [values, spec, grid]);

  const resetView = () => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (cam && ctrl) {
      cam.position.set(4.5, 4.5, 4.5);
      ctrl.target.set(0, 0, 0);
      ctrl.update();
    }
  };

  const onChange = (name: string, v: number) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="w-full h-80 rounded-lg overflow-hidden bg-stone-900 cursor-grab active:cursor-grabbing"
      />

      <div className="text-[10px] text-stone-500 italic">{t.drag}</div>

      <div className="space-y-2">
        {spec.params.map((p) => (
          <div key={p.name} className="flex items-center gap-3">
            <label className="text-xs font-mono text-stone-600 w-24 shrink-0">
              {p.label ?? p.name} = {values[p.name].toFixed(2)}
            </label>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={values[p.name]}
              onChange={(e) => onChange(p.name, parseFloat(e.target.value))}
              className="flex-1 accent-accent"
            />
          </div>
        ))}
      </div>

      {liveNarration && (
        <div className="text-sm text-stone-600 italic bg-stone-50 rounded-md p-3 border border-stone-200">
          {liveNarration}
        </div>
      )}

      <button
        onClick={resetView}
        className="px-3 py-1.5 text-sm bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-50 transition"
      >
        {t.reset}
      </button>
    </div>
  );
}
