import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface GlobeProps {
  radius?: number;
  rotationSpeed?: number; // radians per second
  dark?: boolean;
  className?: string;
}

// Simple Three.js canvas-based revolving globe with subtle dark textures
export function Globe({ radius = 1.6, rotationSpeed = 0.12, dark = true, className }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Precompute colors depending on dark mode
  const [{ ambient, light, bg }] = useMemo(() => {
    const ambient = new THREE.Color(0x0b1220);
    const light = new THREE.Color(0x8fd8ff); // cool key light
    const bg = new THREE.Color(0x050b16);
    return [{ ambient, light, bg }];
  }, [dark]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(ambient, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(light, 1.0);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Globe geometry and material (with realistic texture)
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const globeMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.95,
      metalness: 0.0,
      color: new THREE.Color(0.9, 0.95, 0.95), // slight dim multiplier to keep darker tone
    });

  const globe = new THREE.Mesh(geometry, globeMaterial);
    scene.add(globe);

    // Load Earth day texture (public domain) with proper color space
    const textureLoader = new THREE.TextureLoader();
    const dayUrl = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
    const normalUrl = "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg";

    let landGlow: THREE.Mesh | null = null;

    textureLoader.load(dayUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      globeMaterial.map = tex;
      globeMaterial.needsUpdate = true;

      // Remove previous gold tint overlay: keep real Earth colors (no tint layer)
    });

    textureLoader.load(normalUrl, (nrm) => {
      globeMaterial.normalMap = nrm;
      globeMaterial.normalScale = new THREE.Vector2(0.35, 0.35);
      globeMaterial.needsUpdate = true;
    });

    // Blue emissive points over land - derived from sphere vertices
    const landPointsGeom = new THREE.BufferGeometry();
    {
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const points: number[] = [];
      for (let i = 0; i < posAttr.count; i += 6) {
        // Sample every ~3rd vertex for density control
        const v = new THREE.Vector3().fromBufferAttribute(posAttr, i).normalize().multiplyScalar(radius * 1.001);
        // Simple heuristic: prefer regions likely to be land (use y and a sin pattern)
        const lat = Math.acos(v.y / (radius * 1.001)) / Math.PI; // [0..1]
        const lon = (Math.atan2(v.z, v.x) + Math.PI) / (2 * Math.PI); // [0..1]
        const landMask = Math.sin(lon * Math.PI * 6.0) * Math.sin(lat * Math.PI * 3.0);
        if (landMask > 0.5 && Math.random() > 0.7) {
          points.push(v.x, v.y, v.z);
        }
      }
      landPointsGeom.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    }
    const landPointsMat = new THREE.PointsMaterial({
      color: new THREE.Color(0x66ccff), // cyan-ish coastal sparkle
      size: 0.007,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const landPoints = new THREE.Points(landPointsGeom, landPointsMat);
    scene.add(landPoints);

    // Atmosphere rim glow using a Fresnel-like shader
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.03, 64, 64),
      new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(0x64c7ff) },
          intensity: { value: 0.55 },
          power: { value: 2.3 },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 glowColor;
          uniform float intensity;
          uniform float power;
          void main() {
            float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), power);
            gl_FragColor = vec4(glowColor, intensity * fresnel);
          }
        `,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(atmosphere);

    let last = performance.now();
    let orbit = 0; // base y-rotation angle

    // Drag-to-rotate interaction
    let dragging = false;
    let yawOffset = 0; // additional yaw added by user
    let pitchOffset = 0; // additional pitch added by user
    let lastX = 0;
    let lastY = 0;
    const ROTATE_SENS = 0.008; // radians per px

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      yawOffset += -dx * ROTATE_SENS;
      pitchOffset += -dy * ROTATE_SENS;
      // clamp pitch to avoid flipping
      pitchOffset = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchOffset));
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    };
    containerRef.current.addEventListener("pointerdown", onPointerDown);
    containerRef.current.addEventListener("pointermove", onPointerMove);
    containerRef.current.addEventListener("pointerup", onPointerUp);
    containerRef.current.addEventListener("pointerleave", onPointerUp);

    const animate = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (!dragging) {
        orbit += rotationSpeed * dt; // default constant speed
      }
      globe.rotation.x = THREE.MathUtils.lerp(globe.rotation.x, pitchOffset, 0.12);
      globe.rotation.y = orbit + yawOffset;
      landPoints.rotation.copy(globe.rotation);
      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(containerRef.current);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      ro.disconnect();
      geometry.dispose();
      atmosphere.geometry.dispose();
      (atmosphere.material as THREE.Material).dispose();
      if (landGlow) {
        landGlow.geometry.dispose();
        (landGlow.material as THREE.Material).dispose();
      }
  landPointsGeom.dispose();
  (landPoints.material as THREE.Material).dispose();
      renderer.dispose();
      containerRef.current?.removeEventListener("pointerdown", onPointerDown);
      containerRef.current?.removeEventListener("pointermove", onPointerMove);
      containerRef.current?.removeEventListener("pointerup", onPointerUp);
      containerRef.current?.removeEventListener("pointerleave", onPointerUp);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [ambient, bg, light, radius, rotationSpeed]);

  return <div ref={containerRef} className={className} />;
}
