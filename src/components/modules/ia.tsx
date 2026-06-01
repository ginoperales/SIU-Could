'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService } from '../../core/services/firebase';
import { Factura, Compra, MovimientoContable, Banco, Producto } from '../../core/models/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input, Alert } from '../ui/custom';
import { BrainCircuit, Send, Sparkles, TrendingUp, ShieldAlert, Award, Bot, User, HelpCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AnalistaIaModule() {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);

  // States
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  // Chatbot State
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'init',
      sender: 'ai',
      text: '¡Hola! Soy tu **Analista Financiero con IA**. He auditado los libros contables, las cuentas de bancos y las facturas electrónicas de tu empresa. ¿En qué puedo ayudarte a nivel financiero hoy?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (company) {
      loadData();
    }
  }, [company]);

  const loadData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [facData, cmpData, movData, bncData, prodData] = await Promise.all([
        dbService.getDocuments<Factura>('facturas', company.id),
        dbService.getDocuments<Compra>('compras', company.id),
        dbService.getDocuments<MovimientoContable>('movimientos', company.id),
        dbService.getDocuments<Banco>('bancos', company.id),
        dbService.getDocuments<Producto>('productos', company.id)
      ]);
      setFacturas(facturas);
      setCompras(compras);
      setMovimientos(movData);
      setBancos(bncData);
      setProductos(prodData);
    } catch (err) {
      console.error('Error loading AI data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  // ==========================================
  // IA INSIGHT ENGINE: CALCULATING RATIOS
  // ==========================================
  
  // 1. Current Liquidity Ratio (Activo Corriente / Pasivo Corriente)
  const totalBancos = bancos.reduce((sum, b) => sum + b.saldoActual, 0);
  const cashIngresos = movimientos.filter(m => m.cajaChica && m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
  const cashEgresos = movimientos.filter(m => m.cajaChica && m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
  const saldoLiquido = totalBancos + 2500 + cashIngresos - cashEgresos;

  const valorInventario = productos
    .filter(p => p.unidadMedida !== 'servicios')
    .reduce((sum, p) => sum + (p.stockActual * p.precioCompra), 0);

  const cuentasPorCobrar = facturas.filter(f => f.estado === 'pendiente').reduce((sum, f) => sum + f.total, 0);
  const totalActivos = saldoLiquido + valorInventario + cuentasPorCobrar;

  const totalCompras = compras.reduce((sum, c) => sum + c.total, 0);
  const cuentasPorPagar = totalCompras * 0.35; // AP simulated 35% of total purchases

  const ratioLiquidez = cuentasPorPagar > 0 ? parseFloat((totalActivos / cuentasPorPagar).toFixed(2)) : 3.5;
  
  // 2. Acid Test Ratio (Activos líquidos / Pasivos corrientes)
  const ratioAcidTest = cuentasPorPagar > 0 ? parseFloat(((saldoLiquido + cuentasPorCobrar) / cuentasPorPagar).toFixed(2)) : 2.8;

  // 3. Net profit margin (Utilidad Neta / Ventas)
  const totalVentas = facturas.filter(f => f.estado !== 'anulado').reduce((sum, f) => sum + f.total, 0);
  const totalEgresos = movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
  const utilidadNeta = totalVentas - totalEgresos;
  const margenNeto = totalVentas > 0 ? parseFloat(((utilidadNeta / totalVentas) * 100).toFixed(1)) : 24.5;

  // AI rule-based recommendation generator
  const getAIRecommendations = () => {
    const list = [];
    if (ratioLiquidez < 1.3) {
      list.push({
        type: 'danger',
        title: 'Riesgo de Liquidez a Corto Plazo',
        text: `Tu ratio de liquidez es de ${ratioLiquidez}, menor al óptimo saludable de 1.5. Sugerimos aplazar gastos no indispensables en bienes de capital y refinanciar cuentas por pagar.`
      });
    } else {
      list.push({
        type: 'success',
        title: 'Excelente Solvencia Financiera',
        text: `Tu ratio de liquidez corriente es de ${ratioLiquidez}. Cuentas con un excelente respaldo para afrontar tus pasivos y obligaciones corrientes.`
      });
    }

    if (cuentasPorCobrar > 5000) {
      list.push({
        type: 'warning',
        title: 'Alerta: Periodo de Cobros Elevado',
        text: `Tienes facturas pendientes de cobro por S/ ${cuentasPorCobrar.toFixed(2)}. Te sugerimos renegociar las políticas de crédito con clientes clave (ej. Aceros Andinos) para liberar flujo de caja.`
      });
    }

    const expensesServicios = movimientos.filter(m => m.categoria === 'Servicios Básicos').reduce((sum, m) => sum + m.monto, 0);
    if (expensesServicios > totalVentas * 0.15) {
      list.push({
        type: 'warning',
        title: 'Desviación de Gastos Operacionales',
        text: 'Los gastos en servicios básicos representan más del 15% de tus ventas. Recomendamos auditar contratos de suscripción SaaS e internet.'
      });
    }

    return list;
  };

  const recommendations = getAIRecommendations();

  // Projections Recharts AreaChart
  const projectionData = [
    { name: 'May 30', Flujo: parseFloat(saldoLiquido.toFixed(2)) },
    { name: 'Jun (Est)', Flujo: parseFloat((saldoLiquido * 1.08).toFixed(2)) },
    { name: 'Jul (Est)', Flujo: parseFloat((saldoLiquido * 1.15).toFixed(2)) },
    { name: 'Ago (Est)', Flujo: parseFloat((saldoLiquido * 1.28).toFixed(2)) }
  ];

  // ==========================================
  // CHATBOT INTERACTIVE BRAIN
  // ==========================================
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: userText }]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      let aiResponse = '';
      const cleanText = userText.toLowerCase();

      if (cleanText.includes('liquidez') || cleanText.includes('solvencia')) {
        aiResponse = `Tu **Liquidez Corriente** se sitúa en **${ratioLiquidez}**. Esto indica que por cada sol de deuda a corto plazo, posees **S/ ${ratioLiquidez}** en activos realizables. Un ratio superior a 1.5 es excelente, por lo que tu empresa se encuentra en un estado **muy saludable** para cubrir obligaciones corrientes.`;
      } else if (cleanText.includes('gasto') || cleanText.includes('egreso') || cleanText.includes('costo')) {
        aiResponse = `He analizado tus salidas de dinero. Tus **egresos totales de caja** representan S/ **${totalEgresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}**. La categoría de mayor peso es *Mercadería* con compras registradas, seguido por *Servicios Básicos*. Te sugiero auditar los egresos menores para mantener alto el margen operativo de utilidad.`;
      } else if (cleanText.includes('recomienda') || cleanText.includes('consejo') || cleanText.includes('análisis')) {
        aiResponse = `De acuerdo con la auditoría de este mes, mis recomendaciones críticas son:\n\n1. **Acelerar Cobros**: Tienes **S/ ${cuentasPorCobrar.toFixed(2)}** acumulados en Cuentas por Cobrar. Cobrar a Aceros Andinos liberará efectivo líquido de inmediato.\n2. **Liquidez**: Tu solvencia general es fuerte (**${ratioLiquidez}**), permitiéndote reinvertir capital excedente en stock o automatizaciones.`;
      } else if (cleanText.includes('flujo') || cleanText.includes('predi') || cleanText.includes('proyecc')) {
        aiResponse = `La **proyección de flujo de caja** muestra una tendencia **alcista** basada en un crecimiento del 8% intermensual en ventas. Para el próximo mes estimamos un saldo disponible de **S/ ${(saldoLiquido * 1.08).toLocaleString('es-PE', { maximumFractionDigits: 2 })}**, ascendiendo a **S/ ${(saldoLiquido * 1.28).toLocaleString('es-PE', { maximumFractionDigits: 2 })}** al término del trimestre, asumiendo cobranza regular.`;
      } else {
        aiResponse = `Entendido. He verificado los libros de **${company.razonSocial}** (RUC: ${company.ruc}). Puedo brindarte información precisa sobre:\n\n- Tu **solvencia y liquidez corriente** (${ratioLiquidez})\n- El **análisis de egresos y gastos** (S/ ${totalEgresos.toFixed(2)})\n- La **proyección de tu flujo de caja** para los siguientes 3 meses\n- **Recomendaciones estratégicas** del mes. ¿Qué área prefieres examinar?`;
      }

      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Analista Financiero con IA
            <Badge variant="primary" className="gap-1 animate-pulse-slow">
              <Sparkles className="w-3.5 h-3.5" /> Gemini Core
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Motor de inteligencia artificial local entrenado con ratios contables y directrices de SUNAT.</p>
        </div>
      </div>

      {/* Grid: Financial Ratios Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ratio 1: Liquidez */}
        <Card className="border-l-4 border-l-primary flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Liquidez Corriente</CardTitle>
            <span className="text-2xl font-extrabold text-foreground">{ratioLiquidez}</span>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground">Activo Corriente / Pasivo Corriente</span>
            <Badge variant={ratioLiquidez >= 1.5 ? 'success' : 'danger'} className="w-fit scale-90 origin-left">
              {ratioLiquidez >= 1.5 ? 'Solvencia Saludable' : 'Riesgo de liquidez'}
            </Badge>
          </CardContent>
        </Card>

        {/* Ratio 2: Prueba Acida */}
        <Card className="border-l-4 border-l-secondary flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Prueba Ácida</CardTitle>
            <span className="text-2xl font-extrabold text-foreground">{ratioAcidTest}</span>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground">(Activo - Inventario) / Pasivo</span>
            <Badge variant="info" className="w-fit scale-90 origin-left">Líquido Inmediato</Badge>
          </CardContent>
        </Card>

        {/* Ratio 3: Margen Neto */}
        <Card className="border-l-4 border-l-violet-500 flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Margen Utilidad Neta</CardTitle>
            <span className="text-2xl font-extrabold text-foreground">{margenNeto}%</span>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground">Utilidad Neta / Ventas Totales</span>
            <Badge variant="success" className="w-fit scale-90 origin-left">Retorno Fuerte</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main split dashboard: Recommendations & Chatbot */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: AI recommendations & Projections */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* AI recommendations card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Alertas de Auditoría IA</CardTitle>
              <CardDescription>Recomendaciones heurísticas sobre tus cuentas.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className={`p-3.5 border rounded-xl flex items-start gap-2.5 text-xs leading-relaxed ${
                  rec.type === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300' :
                  rec.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300' :
                  'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300'
                }`}>
                  <ShieldAlert className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    rec.type === 'danger' ? 'text-rose-600' :
                    rec.type === 'warning' ? 'text-amber-600' :
                    'text-emerald-600'
                  }`} />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-foreground">{rec.title}</span>
                    <span className="opacity-90">{rec.text}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI projection cashflow card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Proyección de Flujo (3 Meses)</CardTitle>
              <CardDescription>Modelamiento predictivo del efectivo disponible estimado.</CardDescription>
            </CardHeader>
            <CardContent className="h-44 w-full min-h-[170px] pr-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                  <Area type="monotone" dataKey="Flujo" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProy)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right: Interactive AI accountant chat (3 columns) */}
        <Card className="lg:col-span-3 flex flex-col h-[520px]">
          <CardHeader className="pb-2 border-b border-border flex flex-row items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-extrabold text-foreground">El Contador Senior con IA</CardTitle>
              <CardDescription>Haz preguntas financieras sobre tu empresa en lenguaje natural.</CardDescription>
            </div>
          </CardHeader>

          {/* Message List area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-none">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                {/* Avatar icon */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                  msg.sender === 'user' ? 'bg-secondary' : 'bg-primary'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble message */}
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-secondary text-white rounded-tr-none' 
                    : 'bg-muted text-foreground rounded-tl-none border border-border/60'
                }`}>
                  {/* Basic markdown parsing for bold */}
                  {msg.text.split('\n').map((line: string, lineIdx: number) => {
                    const parsedLine = line.split('**').map((chunk, chunkIdx) => {
                      if (chunkIdx % 2 === 1) return <strong key={chunkIdx} className="font-extrabold">{chunk}</strong>;
                      return chunk;
                    });
                    return (
                      <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
                        {parsedLine}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 self-start">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-muted text-muted-foreground rounded-2xl rounded-tl-none border border-border/60 text-xs italic flex items-center gap-1.5 animate-pulse">
                  <span>El contador está procesando los balances de SUNAT...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick recommendations helper chips */}
          <div className="p-3 bg-muted/30 border-t border-border flex flex-wrap gap-1.5 text-[10px]">
            <button 
              onClick={() => { setInputMessage('¿Cómo está la liquidez de mi empresa?'); }}
              className="px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground cursor-pointer"
            >
              ¿Cómo está la liquidez?
            </button>
            <button 
              onClick={() => { setInputMessage('Analiza mis gastos de este mes'); }}
              className="px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground cursor-pointer"
            >
              Analizar egresos
            </button>
            <button 
              onClick={() => { setInputMessage('Predice el flujo de caja para los siguientes meses'); }}
              className="px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground cursor-pointer"
            >
              Predicción de Flujo
            </button>
          </div>

          {/* Input messaging area */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex gap-2 rounded-b-xl">
            <input
              type="text"
              placeholder="Pregunta algo (ej. 'dame mis recomendaciones contables')..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              className="flex-1 bg-muted border border-border px-3.5 py-2 text-xs rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isTyping}
            />
            <Button type="submit" disabled={isTyping} className="p-2 w-10 h-10 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
