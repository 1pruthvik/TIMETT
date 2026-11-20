"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";

// Declare THREE namespace for CDN-loaded Three.js
declare global {
  interface Window {
    THREE: any;
    __threeCleanup: (() => void) | undefined;
  }
}

export function ThreeBackground() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamic import Three.js from CDN
    let cancelled = false;

    async function loadThree() {
      try {
        // Load Three.js from CDN
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.min.js";
        script.async = true;
        script.onload = () => {
          if (!cancelled) setThreeLoaded(true);
        };
        script.onerror = () => {
          if (!cancelled) setError("Failed to load Three.js");
        };
        document.head.appendChild(script);

        // Wait for script to load
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Three.js"));
        });

        if (cancelled) return;

        // Now initialize Three.js scene
        initThreeScene();
      } catch (err) {
        if (!cancelled) setError("Three.js initialization failed");
      }
    }

    function initThreeScene() {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      // @ts-ignore - Three.js loaded globally
      const THREE = window.THREE;

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 50);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // ============ PARTICLE SYSTEM ============
      const particleCount = 3000;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const velocities = new Float32Array(particleCount * 3);

      const colorPalette = [
        new THREE.Color(0x7c4dff), // deep purple
        new THREE.Color(0x00bcd4), // cyan/teal
        new THREE.Color(0xe040fb), // magenta
        new THREE.Color(0x651fff), // deep violet
        new THREE.Color(0x1de9b6), // bright teal
        new THREE.Color(0xd500f9), // vivid magenta
      ];

      for (let i = 0; i < particleCount; i++) {
        const radius = 20 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = 0.5 + Math.random() * 2;

        velocities[i * 3] = (Math.random() - 0.5) * 0.002;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      particleGeometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

      const particleMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);

      // ============ CENTRAL SPINE / SCULPTURE ============
      const spineGroup = new THREE.Group();

      // Create iridescent metallic spine segments
      const segmentCount = 12;
      const spineGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8, 1, true);

      for (let i = 0; i < segmentCount; i++) {
        const material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color().setHSL(0.6 + i * 0.02, 0.8, 0.3),
          metalness: 0.9,
          roughness: 0.1,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          iridescence: 1.0,
          iridescenceIOR: 1.3,
          iridescenceThicknessRange: [100, 400],
          transmission: 0.1,
          thickness: 0.5,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(spineGeometry, material);
        mesh.position.y = (i - segmentCount / 2) * 2.2;
        mesh.rotation.y = i * 0.15;
        mesh.rotation.x = Math.sin(i * 0.5) * 0.1;
        spineGroup.add(mesh);
      }

      // Add floating rings around spine
      for (let i = 0; i < 5; i++) {
        const ringGeometry = new THREE.TorusGeometry(2 + i * 0.5, 0.08, 16, 64);
        const ringMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color().setHSL(0.55 + i * 0.05, 0.9, 0.4),
          metalness: 0.8,
          roughness: 0.15,
          clearcoat: 1.0,
          clearcoatRoughness: 0.0,
          iridescence: 0.8,
          iridescenceIOR: 1.4,
          iridescenceThicknessRange: [200, 600],
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = (i - 2) * 5;
        ring.rotation.x = Math.PI / 2;
        ring.userData = { baseY: ring.position.y, speed: 0.002 + i * 0.001 };
        spineGroup.add(ring);
      }

      scene.add(spineGroup);

      // ============ LIGHTING ============
      const ambientLight = new THREE.AmbientLight(0x222233, 0.5);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0x7c4dff, 1.5);
      keyLight.position.set(20, 30, 20);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x00bcd4, 0.8);
      fillLight.position.set(-20, 10, -20);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xe040fb, 1.0);
      rimLight.position.set(0, -20, 30);
      scene.add(rimLight);

      const pointLight1 = new THREE.PointLight(0x7c4dff, 50, 100);
      pointLight1.position.set(0, 15, 10);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0x00bcd4, 40, 80);
      pointLight2.position.set(0, -15, -10);
      scene.add(pointLight2);

      // ============ STATE ============
      const mouse = { x: 0, y: 0 };
      let scrollY = 0;
      let time = 0;
      let animationId: number | null = null;

      // ============ EVENT HANDLERS ============
      const handleMouseMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };

      const handleScroll = () => {
        scrollY = window.scrollY;
      };

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleResize, { passive: true });

      // ============ ANIMATION LOOP ============
      const animate = () => {
        time += 0.01;
        animationId = requestAnimationFrame(animate);

        // Animate particles
        const posArray = particleGeometry.attributes.position.array as Float32Array;
        const velArray = particleGeometry.attributes.velocity.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          posArray[i * 3] += velArray[i * 3];
          posArray[i * 3 + 1] += velArray[i * 3 + 1];
          posArray[i * 3 + 2] += velArray[i * 3 + 2];

          // Mouse influence
          const dx = posArray[i * 3] - mouse.x * 30;
          const dy = posArray[i * 3 + 1] - mouse.y * 30;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 50) {
            const force = (50 - dist) / 50 * 0.01;
            velArray[i * 3] += dx / dist * force;
            velArray[i * 3 + 1] += dy / dist * force;
          }

          // Scroll influence - vertical drift
          posArray[i * 3 + 1] -= scrollY * 0.0001;

          // Boundary wrap
          const radius = Math.sqrt(
            posArray[i * 3] ** 2 + posArray[i * 3 + 1] ** 2 + posArray[i * 3 + 2] ** 2
          );
          if (radius > 100) {
            const newRadius = 20 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            posArray[i * 3] = newRadius * Math.sin(phi) * Math.cos(theta);
            posArray[i * 3 + 1] = newRadius * Math.sin(phi) * Math.sin(theta);
            posArray[i * 3 + 2] = newRadius * Math.cos(phi);
          }
        }

        particleGeometry.attributes.position.needsUpdate = true;

        // Subtle rotation
        particles.rotation.y += 0.00005;
        particles.rotation.x += 0.00002;

        // Animate spine
        spineGroup.rotation.y += 0.0003;
        spineGroup.rotation.x = Math.sin(time * 0.3) * 0.05;

        spineGroup.children.forEach((child: any, index: number) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry.type === "TorusGeometry") {
              child.rotation.z += child.userData.speed;
              child.rotation.y += child.userData.speed * 0.5;
              child.position.y = child.userData.baseY + Math.sin(time * 0.5 + index) * 0.3;
            } else {
              child.rotation.y += 0.0005 + index * 0.0001;
              child.position.y += Math.sin(time * 0.7 + index * 0.5) * 0.002;
            }
          }
        });

        // Mouse parallax on spine
        spineGroup.position.x = mouse.x * 2;
        spineGroup.position.y = mouse.y * 2;

        // Camera subtle movement
        camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
        camera.position.y += (-mouse.y * 3 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };

      animate();

      // Store cleanup function
      (window as any).__threeCleanup = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
        if (animationId) cancelAnimationFrame(animationId);

        particleGeometry.dispose();
        particleMaterial.dispose();
        spineGroup.traverse((obj: any) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m: any) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
        renderer.dispose();
      };
    }

    loadThree();

    return () => {
      cancelled = true;
      if ((window as any).__threeCleanup) {
        (window as any).__threeCleanup();
      }
    };
  }, [theme]);

  if (error) {
    return (
      <div
        className="fixed inset-0 z-0 flex items-center justify-center text-white/30 text-xs font-mono"
        aria-hidden="true"
      >
        WebGL background unavailable
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none select-none"
      aria-hidden="true"
      style={{ touchAction: "none", display: threeLoaded ? "block" : "none" }}
    />
  );
}