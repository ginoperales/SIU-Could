'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createTimeline, stagger } from 'animejs';
import * as THREE from 'three';
import { Button, Card, Badge } from '../ui/custom';
import { 
  Calculator, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  BrainCircuit, 
  Sparkles, 
  Check, 
  MousePointer, 
  DollarSign, 
  PieChart, 
  Laptop 
} from 'lucide-react';

import { PromoBanner } from '../shared/promobanner';
import { dbService } from '../../core/services/firebase';
import { Promocion } from '../../core/models/types';

interface LandingProps {
  onEnterERP: () => void;
}

export function LandingModule({ onEnterERP }: LandingProps) {
  const [mounted, setMounted] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'mensual' | 'anual'>('mensual');
  const [activePromo, setActivePromo] = useState<Promocion | null>(null);
  
  // Refs for elements and canvas
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const loadActivePromo = async () => {
      try {
        const list = await dbService.getAllPromociones();
        const nowStr = new Date().toISOString().split('T')[0];
        const found = list.find(promo => 
          promo.activo && 
          promo.mostrarLanding &&
          nowStr >= promo.fechaInicio && 
          nowStr <= promo.fechaFin
        );
        setActivePromo(found || null);
      } catch (err) {
        console.error('Error loading landing promotion:', err);
      }
    };
    loadActivePromo();
  }, [mounted]);

  // Three.js 3D Interactive Canvas Setup
  useEffect(() => {
    if (!mounted || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    // Add atmospheric fog
    scene.fog = new THREE.FogExp2(0x020617, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear previous canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Geometry - Premium Floating interlinked particles grid
    const particlesCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    const colorPrimary = new THREE.Color('#10b981'); // Emerald
    const colorSecondary = new THREE.Color('#3b82f6'); // Blue
    const colorWhite = new THREE.Color('#ffffff');

    for (let i = 0; i < particlesCount; i++) {
      // Create cluster layers
      const ratio = i / particlesCount;
      const angle = ratio * Math.PI * 2 * 8; // spiral effect
      const radius = 5 + ratio * 20;

      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15 + Math.sin(ratio * Math.PI * 4) * 2;
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 4;

      // Beautiful gradient color mixing
      let mixedColor = colorPrimary.clone();
      if (ratio < 0.4) {
        mixedColor.lerp(colorSecondary, ratio * 2.5);
      } else {
        mixedColor.lerp(colorWhite, (ratio - 0.4) * 1.6);
      }

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom glowing particle texture canvas
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const material = new THREE.PointsMaterial({
      size: 0.9,
      sizeAttenuation: true,
      transparent: true,
      alphaTest: 0.001,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: createParticleTexture()
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // 3. Animation loop with organic oscillations
    let mouseX = 0;
    let mouseY = 0;
    
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) / 100;
      mouseY = (event.clientY - window.innerHeight / 2) / 100;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Slow orbital rotate
      points.rotation.y = elapsedTime * 0.05;
      points.rotation.x = Math.sin(elapsedTime * 0.02) * 0.2;

      // Mouse interactive tilt
      points.position.x += (mouseX - points.position.x) * 0.05;
      points.position.y += (-mouseY - points.position.y) * 0.05;

      // Wave physics simulation on particles
      const positionsArray = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particlesCount; i++) {
        const x = positionsArray[i * 3];
        const z = positionsArray[i * 3 + 2];
        
        // Dynamic sine wave
        positionsArray[i * 3 + 1] += Math.sin(elapsedTime + x * 0.2 + z * 0.2) * 0.015;
      }
      geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 4. Resize responsiveness
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      material.dispose();
      geometry.dispose();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    // Anime.js Staggered Landing entrance sequence
    (createTimeline() as any)
      .add({
        targets: '.nav-animate',
        translateY: [-30, 0],
        opacity: [0, 1],
        delay: stagger(100),
        duration: 800,
        easing: 'easeOutQuad'
      })
      .add('.hero-animate', {
        translateY: [40, 0],
        opacity: [0, 1],
        delay: stagger(120),
        duration: 900
      }, '-=400')
      .add('.stat-animate', {
        scale: [0.9, 1],
        opacity: [0, 1],
        delay: stagger(100),
        duration: 700
      }, '-=600')
      .add('.card-animate', {
        translateY: [50, 0],
        opacity: [0, 1],
        delay: stagger(150),
        duration: 1000
      }, '-=600');

  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white relative overflow-x-hidden font-sans select-none selection:bg-primary selection:text-white">
      <PromoBanner />
      {/* Three.js Interactive background container */}
      <div 
        ref={canvasContainerRef} 
        className="absolute inset-0 z-0 opacity-60" 
      />

      {/* Grid Pattern mask overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-25 z-0" />

      {/* Floating orbs for extra luxury aesthetics */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[140px] pointer-events-none" />

      {/* --- 1. STICKY GLASSMORPHIC NAVBAR --- */}
      <header className="sticky top-0 w-full z-50 backdrop-blur-md bg-slate-950/60 border-b border-slate-900 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 nav-animate">
            <div className="bg-gradient-to-tr from-primary to-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-primary/25">
              <Calculator className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              ContaCould
            </span>
          </div>

          {/* Nav Links - Desktop only */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white font-medium transition-colors nav-animate">Características</a>
            <a href="#compliance" className="text-sm text-slate-400 hover:text-white font-medium transition-colors nav-animate">Regulaciones Perú</a>
            <a href="#ai" className="text-sm text-slate-400 hover:text-white font-medium transition-colors nav-animate">Analista IA</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white font-medium transition-colors nav-animate">Planes</a>
          </nav>

          <div className="flex items-center gap-4 nav-animate">
            <button 
              onClick={onEnterERP}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 active:scale-98 cursor-pointer transition-all duration-200"
            >
              Ingresar Demo
            </button>
            <Button 
              onClick={onEnterERP} 
              className="shadow-lg shadow-primary/25 font-bold"
            >
              Comenzar Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* --- 2. HERO SECTION --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 flex flex-col items-center text-center">
        {/* Animated Badge */}
        <div className="hero-animate mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800/80 backdrop-blur">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400 uppercase tracking-widest">
            SaaS ERP Multiempresa Peruano
          </span>
        </div>

        <h1 className="hero-animate max-w-4xl text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
          La gestión contable de tu empresa,{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-400 to-secondary">
            automatizada con Inteligencia Artificial
          </span>
        </h1>

        <p className="hero-animate max-w-2xl text-slate-400 text-base md:text-lg mb-10 leading-relaxed">
          ContaCould centraliza tu facturación electrónica (SUNAT), cajas, conciliación bancaria, planillas de recursos humanos y stock, impulsado por un asistente financiero con IA disponible 24/7.
        </p>

        {/* Hero CTA buttons */}
        <div className="hero-animate flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Button 
            onClick={onEnterERP} 
            className="px-8 py-3.5 text-base shadow-xl shadow-primary/30 flex items-center gap-2 group font-bold"
          >
            Acceder al ERP en Línea
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <a 
            href="#features" 
            className="px-6 py-3.5 text-sm font-semibold border border-slate-800 rounded-lg hover:bg-slate-900 text-slate-300 transition-colors cursor-pointer"
          >
            Explorar Características
          </a>
        </div>

        {/* --- LIVE STATISTICS / METRICS BAR --- */}
        <div 
          ref={statsRef}
          className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-900 p-8 rounded-2xl max-w-5xl shadow-2xl relative overflow-hidden"
        >
          {/* Subtle line background glow */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="stats-animate flex flex-col gap-1 items-center md:items-start text-center md:text-left">
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 tracking-tight">100%</span>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Multi-Tenant Aislado</span>
          </div>
          <div className="stats-animate flex flex-col gap-1 items-center md:items-start text-center md:text-left">
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 tracking-tight">18%</span>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Cálculo Automático IGV</span>
          </div>
          <div className="stats-animate flex flex-col gap-1 items-center md:items-start text-center md:text-left">
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 tracking-tight">&lt; 0.5s</span>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Conciliación Bancaria</span>
          </div>
          <div className="stats-animate flex flex-col gap-1 items-center md:items-start text-center md:text-left">
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 tracking-tight">24/7</span>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Analista con IA Contable</span>
          </div>
        </div>
      </section>

      {/* --- 3. DYNAMIC INTERACTIVE ERP DASHBOARD PREVIEW WIDGET --- */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="w-full bg-slate-950/80 backdrop-blur-2xl rounded-2xl border border-slate-900 shadow-2xl p-4 md:p-6 overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
          
          {/* Mock Browser Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-4 md:mb-6">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 block" />
            </div>
            <div className="bg-slate-900/80 px-4 py-1.5 rounded-lg border border-slate-800 text-[10px] md:text-xs text-slate-400 tracking-wide font-mono w-48 md:w-80 text-center truncate">
              contacould.pe/dashboard
            </div>
            <div className="w-8" />
          </div>

          {/* Mock Dashboard Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Interactive Balance Card */}
            <div className="md:col-span-2 bg-slate-900/30 border border-slate-900 p-5 rounded-xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Estado de Flujo Efectivo</span>
                  <span className="text-2xl font-extrabold text-white">S/. 142,850.00</span>
                </div>
                <Badge variant="success" className="px-2 py-0.5 text-xs font-semibold">+18.4% este mes</Badge>
              </div>

              {/* Graphic Mock */}
              <div className="h-40 w-full flex items-end gap-3 pt-4 border-b border-slate-900">
                {[45, 60, 52, 75, 90, 82, 110, 95, 125, 142].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div 
                      className={`w-full rounded-t bg-gradient-to-t transition-all duration-700 ease-out`} 
                      style={{ 
                        height: `${height}%`,
                        backgroundImage: idx === 9 
                          ? 'linear-gradient(to top, #16A34A, #4ade80)' 
                          : 'linear-gradient(to top, #1e293b, #475569)' 
                      }} 
                    />
                    <span className="text-[9px] text-slate-500 font-mono">M{idx+1}</span>
                  </div>
                ))}
              </div>

              {/* Quick info metrics */}
              <div className="grid grid-cols-3 gap-4 text-center pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Ventas del Mes</span>
                  <span className="text-sm font-extrabold text-slate-200">S/. 84,200.00</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Gastos Totales</span>
                  <span className="text-sm font-extrabold text-red-400">S/. 25,600.00</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Impuestos IGV</span>
                  <span className="text-sm font-extrabold text-primary">S/. 12,844.00</span>
                </div>
              </div>
            </div>

            {/* Right: Mock AI Accountant Chat Widget */}
            <div className="bg-slate-900/50 border border-slate-900 p-5 rounded-xl flex flex-col gap-4 relative overflow-hidden justify-between">
              {/* Glow badge overlay */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-none">Asistente ContaCould IA</span>
                  <span className="text-[10px] text-primary font-medium">Contador Senior en línea</span>
                </div>
              </div>

              {/* Chat flow messages */}
              <div className="flex-1 flex flex-col gap-3 py-2 justify-end">
                <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg text-[11px] text-slate-400 self-end max-w-[85%]">
                  ¿Cuál es el margen neto de utilidad de mi empresa en este mes?
                </div>
                <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-lg text-[11px] text-slate-200 self-start max-w-[90%] flex gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    El margen de utilidad neta actual de tu empresa es de **69.6%**. Esto se debe a una reducción de gastos en mercadería de un **12.5%** en relación al mes anterior.
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-900 rounded-lg p-2 flex items-center justify-between text-xs text-slate-500">
                <span>Escribe tu consulta contable...</span>
                <Button className="scale-90 px-3 py-1 font-bold">Enviar</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. CORE FEATURES SECTION --- */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-slate-900">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="px-3 py-0.5 mb-4 text-xs font-bold">CARACTERÍSTICAS TÉCNICAS</Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Todo lo que tu empresa necesita en una sola Suite</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
            Diseñado para cumplir con estándares contables de alto nivel empresarial y las complejidades de la regulación fiscal en el Perú.
          </p>
        </div>

        <div 
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Card 1: Multi-Tenant */}
          <Card className="card-animate border border-slate-900 bg-slate-900/30 p-8 rounded-xl flex flex-col gap-4 hover:border-slate-800 hover:bg-slate-900/50 transition-all duration-300">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary mb-2 shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Multi-Tenant (Multiempresa)</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Registra y gestiona múltiples razones sociales. Cada empresa cuenta con aislamiento absoluto de transacciones, cuentas bancarias, almacenes e impuestos mediante reglas de seguridad de Firestore.
            </p>
          </Card>

          {/* Card 2: Peruvian Compliance */}
          <Card className="card-animate border border-slate-900 bg-slate-900/30 p-8 rounded-xl flex flex-col gap-4 hover:border-slate-800 hover:bg-slate-900/50 transition-all duration-300">
            <div className="bg-secondary/10 w-12 h-12 rounded-xl flex items-center justify-center text-secondary mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Cumplimiento Tributario Perú</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Cálculo automático del IGV (18%), emisión de Facturas y Boletas simuladas con formato de impresión SUNAT, desglose de aportes de AFP/ONP e impuestos obligatorios del empleador (EsSalud 9%).
            </p>
          </Card>

          {/* Card 3: AI Accountant */}
          <Card className="card-animate border border-slate-900 bg-slate-900/30 p-8 rounded-xl flex flex-col gap-4 hover:border-slate-800 hover:bg-slate-900/50 transition-all duration-300">
            <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-400 mb-2">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Analista Financiero con IA</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Calcula instantáneamente ratios contables vitales (Liquidez, Prueba Ácida, Margen de Utilidad) y realiza consultas contables personalizadas a nuestro agente inteligente basado en tus saldos en vivo.
            </p>
          </Card>
        </div>
      </section>

      {/* --- 5. PERUVIAN FISCAL COMPLIANCE SPECIFICS SECTION --- */}
      <section id="compliance" className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-slate-900 bg-slate-900/10 rounded-3xl p-8 border border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-5">
            <Badge variant="success" className="px-3 py-0.5 text-xs font-bold self-start uppercase">SUNAT & Planilla Local</Badge>
            <h2 className="text-3xl font-extrabold text-white">Diseñado específicamente para el mercado peruano</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Las operaciones en el Perú requieren precisión milimétrica debido a regulaciones complejas de tributación y empleo. ContaCould ha sido estructurado con módulos especializados:
            </p>

            <ul className="flex flex-col gap-3.5">
              {[
                'Emisión de Facturas (con cálculo de IGV 18%) y Boletas de Venta.',
                'Validación rigurosa de longitudes de RUC (11 dígitos) y DNI (8 dígitos) de trabajadores y contactos.',
                'Deducciones automáticas de planilla: Sistema Nacional de Pensiones (ONP) o Administradoras de Fondos de Pensiones (AFP).',
                'Cuentas por cobrar y pagar con control visual de días de mora para evitar sanciones impositivas.',
                'Kardex de Inventario oficial por producto utilizando costo promedio ponderado.'
              ].map((item, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-slate-300">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* compliance interactive box showing payroll mockup */}
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl relative overflow-hidden flex flex-col gap-4 shadow-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cálculo de Boleta de Pago — Demo</span>
            <div className="flex justify-between items-center pb-3 border-b border-slate-900">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Carlos Mendoza</span>
                <span className="text-[10px] text-slate-500">Régimen Laboral Mype</span>
              </div>
              <Badge variant="secondary" className="text-xs">DNI 45781290</Badge>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sueldo Básico Mensual:</span>
                <span className="font-semibold text-slate-200">S/. 2,500.00</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>Deducción AFP (13% Est.):</span>
                <span>- S/. 325.00</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>EsSalud del Empleador (9%):</span>
                <span>+ S/. 225.00</span>
              </div>
              <div className="border-t border-slate-900 pt-2.5 flex justify-between font-bold text-sm text-white">
                <span>Neto a Pagar:</span>
                <span className="text-primary">S/. 2,175.00</span>
              </div>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-500 leading-normal">
              * El cálculo del Neto a Pagar ya incluye las retenciones del régimen laboral peruano vigentes para aportes de pensión.
            </div>
          </div>
        </div>
      </section>

      {/* --- 6. PRICING SECTION --- */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-slate-900">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="px-3 py-0.5 mb-4 text-xs font-bold">PLANES Y PRECIOS</Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Planes flexibles que crecen con tu negocio</h2>
          
          {/* Billing Switch */}
          <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-slate-900/80 border border-slate-800 mt-4">
            <button 
              onClick={() => setBillingPeriod('mensual')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                billingPeriod === 'mensual' ? 'bg-primary text-white font-bold' : 'text-slate-400'
              }`}
            >
              Facturación Mensual
            </button>
            <button 
              onClick={() => setBillingPeriod('anual')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                billingPeriod === 'anual' ? 'bg-primary text-white font-bold' : 'text-slate-400'
              }`}
            >
              Facturación Anual (-20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan 1: Emprendedor */}
          <Card className="border border-slate-900 bg-slate-900/30 p-8 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">MYPE & Emprendedor</span>
              <h3 className="text-2xl font-extrabold text-white">Plan Emprendedor</h3>
              <p className="text-slate-400 text-xs">Ideal para personas con negocio o microempresas que inician operaciones.</p>
              
              <div className="py-4 border-y border-slate-900 my-2 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">S/. 0.00</span>
                <span className="text-xs text-slate-500">/ de por vida</span>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-slate-300">
                {[
                  '1 Razón Social (RUC)',
                  'Hasta 50 Comprobantes al mes',
                  'Gestión de Caja Chica y Cuentas Bancarias',
                  'Acceso al Asistente IA Contable básico',
                  'Reportes financieros estándar'
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              onClick={onEnterERP}
              className="w-full font-bold mt-8 shadow-md"
            >
              Comenzar Gratis
            </Button>
          </Card>

          {/* Plan 2: Corporativo */}
          <Card className="border border-slate-800 bg-slate-900/50 p-8 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden">
            {/* Ribbon glowing tag */}
            <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-bl-lg">
              Recomendado
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Pymes y Medianas Empresas</span>
              <h3 className="text-2xl font-extrabold text-white">Plan Corporativo</h3>
              <p className="text-slate-400 text-xs">Completa suite contable y administrativa sin límites para expandir tu negocio.</p>
              
              <div className="py-4 border-y border-slate-900 my-2 flex flex-col gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {billingPeriod === 'mensual' ? 'S/. 149.00' : 'S/. 119.00'}
                  </span>
                  <span className="text-xs text-slate-500">/ al mes</span>
                </div>
                {activePromo && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-lg text-xs mt-1 flex flex-col gap-0.5 animate-pulse">
                    <span className="font-bold flex items-center gap-1 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 fill-emerald-500/20 text-emerald-400" />
                      ¡Oferta Activa! Cupón: {activePromo.codigo}
                    </span>
                    <span>Ahorra {activePromo.porcentajeDescuento}% hoy. Costo mensual final: S/. {(149 * (1 - activePromo.porcentajeDescuento / 100)).toFixed(2)}/mes.</span>
                  </div>
                )}
              </div>

              <ul className="flex flex-col gap-3 text-xs text-slate-300">
                {[
                  'Multiempresa Ilimitado (RUCs)',
                  'Facturación Electrónica sin límites',
                  'Conciliación Bancaria automática avanzada',
                  'Planilla completa de RRHH (AFP/ONP/EsSalud)',
                  'Analista Financiero IA ilimitado + Proyecciones de Flujo',
                  'Soporte corporativo prioritario 24/7'
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              onClick={onEnterERP}
              className="w-full font-extrabold mt-8 bg-gradient-to-r from-primary to-emerald-500 shadow-lg shadow-primary/20 hover:from-primary-hover hover:to-emerald-600 transition-all"
            >
              Comenzar Suscripción
            </Button>
          </Card>
        </div>
      </section>

      {/* --- 7. FINAL HERO CALL TO ACTION (CTA) --- */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800/80 p-10 md:p-14 rounded-2xl relative overflow-hidden shadow-2xl">
          {/* subtle decoration orb */}
          <div className="absolute top-[-50%] left-[-20%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Lleva la contabilidad de tu empresa al siguiente nivel hoy mismo
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-10 leading-relaxed">
            Obtén acceso inmediato al módulo ERP en modo de demostración. No necesitas ingresar tarjetas de crédito para registrarte y comenzar.
          </p>

          <Button 
            onClick={onEnterERP} 
            className="px-10 py-4 text-base font-extrabold shadow-xl shadow-primary/30 flex items-center gap-2.5 mx-auto group active:scale-98"
          >
            Iniciar Demo Gratuita
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* --- 8. FOOTER --- */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary p-2 rounded-xl text-white">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-wider uppercase text-white">
              ContaCould
            </span>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ContaCould. Todos los derechos reservados. Diseñado para empresas peruanas.
          </p>

          <div className="flex gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
            <a href="#" className="hover:text-white transition-colors">Políticas de Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
