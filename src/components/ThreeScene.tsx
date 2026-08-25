import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 2. Custom Liquid Velvet Shader (Deep Obsidian Black, Crimson Red, Dark Wine, Amber & Cyan Shimmer)
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      varying vec2 vUv;

      // Simplex noise approximation
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,
                            0.366025403784439,
                           -0.577350269189626,
                            0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;

        vec2 mouse = u_mouse * 0.5;
        float t = u_time * 0.12;

        // Multilayer fluid domain warping
        vec2 q = vec2(0.0);
        q.x = snoise(st + vec2(t * 0.6, t * 0.4) + mouse * 0.2);
        q.y = snoise(st + vec2(1.0) + vec2(t * 0.4, -t * 0.5));

        vec2 r = vec2(0.0);
        r.x = snoise(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * t);
        r.y = snoise(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * t);

        float f = snoise(st + r * 1.4);

        // Prestige Royal Palette: Deep Obsidian Black, Crimson, Dark Wine Red, Amber Gold & Cyan Tint
        vec3 colBlack = vec3(0.02, 0.03, 0.05);
        vec3 colDarkWine = vec3(0.18, 0.02, 0.05);
        vec3 colCrimson = vec3(0.78, 0.09, 0.18);
        vec3 colAmber = vec3(0.92, 0.55, 0.12);
        vec3 colCyan = vec3(0.04, 0.58, 0.74);

        // Smooth fluid color transitions
        vec3 color = mix(colBlack, colDarkWine, clamp((f*f)*3.0, 0.0, 1.0));
        color = mix(color, colCrimson, clamp(length(q)*0.7, 0.0, 1.0));
        color = mix(color, colAmber, clamp(length(r.x)*0.35, 0.0, 0.45));
        color = mix(color, colCyan, clamp(length(r.y)*0.25, 0.0, 0.3));

        // Vignette effect to keep center and edges crisp and deep
        vec2 uvCenter = vUv - 0.5;
        float vignette = 1.0 - dot(uvCenter, uvCenter) * 0.95;
        color *= clamp(vignette, 0.2, 1.0);

        gl_FragColor = vec4(color, 0.92);
      }
    `;

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_mouse: { value: new THREE.Vector2(0, 0) }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    // Mouse interpolation
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2.0;
      targetMouseY = -(e.clientY / window.innerHeight - 0.5) * 2.0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      uniforms.u_time.value = elapsed;
      uniforms.u_mouse.value.set(currentMouseX, currentMouseY);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#04060a]"
    />
  );
};
