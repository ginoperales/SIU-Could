'use client';

import React, { useState, useEffect } from 'react';
import { dbService } from '../../core/services/firebase';
import { Promocion } from '../../core/models/types';
import { Sparkles, X, Megaphone, Check } from 'lucide-react';

export function PromoBanner() {
  const [activePromo, setActivePromo] = useState<Promocion | null>(null);
  const [closed, setClosed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    loadActiveBannerPromo();
  }, []);

  // Live ticking countdown logic linked to active promo expiration
  useEffect(() => {
    if (!activePromo) return;

    // Set expiration time to 23:59:59 of the final day
    const expirationDate = new Date(`${activePromo.fechaFin}T23:59:59`);

    const updateCountdown = () => {
      const now = new Date();
      const diffMs = expirationDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setClosed(true);
        setActivePromo(null);
        return;
      }

      const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activePromo]);

  const loadActiveBannerPromo = async () => {
    try {
      const list = await dbService.getAllPromociones();
      const nowStr = new Date().toISOString().split('T')[0];
      
      // Find the first active promotion marked for top-bar display and within valid dates
      const found = list.find(promo => 
        promo.activo && 
        promo.mostrarBannerSuperior &&
        nowStr >= promo.fechaInicio && 
        nowStr <= promo.fechaFin
      );

      if (found) {
        // Verify if user closed this specific promo before in this browser
        const isDismissed = localStorage.getItem(`sv_dismiss_promo_${found.id}`);
        if (!isDismissed) {
          setActivePromo(found);
          setClosed(false);
        }
      }
    } catch (err) {
      console.error('Error loading top-bar active banner promotion:', err);
    }
  };

  const handleDismiss = () => {
    if (activePromo) {
      localStorage.setItem(`sv_dismiss_promo_${activePromo.id}`, 'true');
    }
    setClosed(true);
  };

  const copyToClipboard = () => {
    if (!activePromo) return;
    navigator.clipboard.writeText(activePromo.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (closed || !activePromo) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 dark:from-indigo-600 dark:via-purple-600 dark:to-indigo-600 text-white py-2 px-4 relative flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm font-medium z-50 shadow-md transition-all duration-300 animate-slide-down">
      <div className="flex items-center gap-2">
        <div className="bg-white/20 p-1 rounded-lg shrink-0">
          <Megaphone className="w-4 h-4 text-white animate-bounce" />
        </div>
        <span className="text-white drop-shadow font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
          {activePromo.descripcion}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span>Usa el cupón:</span>
        <button
          onClick={copyToClipboard}
          className="bg-white text-orange-600 dark:text-purple-600 font-mono font-bold px-2 py-0.5 rounded border border-white hover:bg-orange-50 dark:hover:bg-purple-50 transition-colors flex items-center gap-1 cursor-pointer outline-none relative group"
          title="Click para copiar código"
        >
          {activePromo.codigo}
          {copied ? (
            <Check className="w-3 h-3 text-emerald-600" />
          ) : (
            <span className="text-[9px] text-orange-400 dark:text-purple-400 group-hover:text-orange-600 dark:group-hover:text-purple-600 font-normal ml-0.5">Copiar</span>
          )}
        </button>

        <span className="text-[10px] bg-black/20 text-amber-200 dark:text-indigo-200 border border-white/10 px-2 py-0.5 rounded font-mono font-bold animate-pulse flex items-center gap-1.5 ml-1 select-none">
          <span>⌛ Termina en:</span>
          <span>
            {String(timeLeft.days).padStart(2, '0')}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </span>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-2 text-white/80 hover:text-white hover:bg-white/10 p-1 rounded transition-colors cursor-pointer outline-none"
        aria-label="Cerrar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
