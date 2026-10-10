"use client";

import React, { useState, useEffect, useRef } from "react";
import { Activity, Zap, ArrowUpRight } from "lucide-react";

export default function Dashboard() {
  // Telemetry Inputs
  const [irradiation, setIrradiation] = useState<number>(0.85);
  const [ambientTemp, setAmbientTemp] = useState<number>(32.0);
  const [moduleTemp, setModuleTemp] = useState<number>(48.5);

  // States
  const [acPower, setAcPower] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [endpointUrl, setEndpointUrl] = useState<string>("");

  // Refs for latest slider values on release
  const irrRef = useRef(irradiation);
  const ambRef = useRef(ambientTemp);
  const modRef = useRef(moduleTemp);

  useEffect(() => {
    irrRef.current = irradiation;
  }, [irradiation]);

  useEffect(() => {
    ambRef.current = ambientTemp;
  }, [ambientTemp]);

  useEffect(() => {
    modRef.current = moduleTemp;
  }, [moduleTemp]);

  // Determine API base URL
  useEffect(() => {
    const configuredUrl = (process.env.NEXT_PUBLIC_API_URL || "https://heliosense-api.onrender.com").replace(/\/$/, "");
    setEndpointUrl(configuredUrl);
    checkHealth(configuredUrl);
    executePrediction(configuredUrl, 0.85, 32.0, 48.5);
  }, []);

  const checkHealth = async (url: string) => {
    try {
      const res = await fetch(`${url}/health`, { method: "GET", mode: "cors" });
      if (res.ok) {
        setApiStatus("online");
      } else {
        setApiStatus("offline");
      }
    } catch {
      setApiStatus("offline");
    }
  };

  const executePrediction = async (url: string, irr: number, amb: number, mod: number) => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(`${url}/predict`, {
        method: "POST",
        mode: "cors",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          irradiation: Number(irr),
          ambient_temperature: Number(amb),
          module_temperature: Number(mod),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAcPower(data.predicted_ac_power_kw);
      setApiStatus("online");
    } catch (err) {
      console.error("ML Inference Request Failed:", err);
      setApiStatus("offline");
      setAcPower(null);
    } finally {
      setLoading(false);
    }
  };

  // Triggered ONLY when the user releases the slider
  const handleSliderRelease = () => {
    executePrediction(endpointUrl, irrRef.current, ambRef.current, modRef.current);
  };

  return (
    <div className="min-h-screen bg-carbon-gray100 text-carbon-gray10 flex flex-col font-sans">
      {/* Carbon Top Shell */}
      <header className="h-12 border-b border-carbon-gray80 bg-[#161616] px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-carbon-blue60 flex items-center justify-center font-mono font-bold text-xs text-white">
            H
          </div>
          <span className="font-semibold text-sm tracking-wide">
            HelioSense <span className="text-carbon-gray50 font-normal">/ Inverter Analytics</span>
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 ${
                apiStatus === "online"
                  ? "bg-carbon-supportGreen"
                  : apiStatus === "checking"
                  ? "bg-yellow-400"
                  : "bg-carbon-supportRed"
              }`}
            />
            <span className="text-carbon-gray50 font-mono">
              API: {apiStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Telemetry Controls */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-carbon-gray90 border border-carbon-gray80 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-carbon-gray80">
              <h2 className="text-xs uppercase font-mono tracking-wider text-carbon-gray30 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-carbon-blue60" /> Input Parameters
              </h2>
              <span className="text-xs text-carbon-gray50 font-mono">RELEASE TO PREDICT</span>
            </div>

            {/* Slider 1: Irradiation */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-carbon-gray30">Solar Irradiance (G)</span>
                <span className="font-mono text-carbon-blue60 font-medium">{irradiation.toFixed(2)} kW/m²</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.2"
                step="0.01"
                value={irradiation}
                onChange={(e) => setIrradiation(parseFloat(e.target.value))}
                onPointerUp={handleSliderRelease}
                onKeyUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-carbon-gray60 font-mono">
                <span>0.00 (Dark)</span>
                <span>0.60 (Overcast)</span>
                <span>1.20 (Peak)</span>
              </div>
            </div>

            {/* Slider 2: Ambient Temp */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-carbon-gray30">Ambient Temperature (T_amb)</span>
                <span className="font-mono text-carbon-blue60 font-medium">{ambientTemp.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="50.0"
                step="0.5"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
                onPointerUp={handleSliderRelease}
                onKeyUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-carbon-gray60 font-mono">
                <span>10.0 °C</span>
                <span>30.0 °C</span>
                <span>50.0 °C</span>
              </div>
            </div>

            {/* Slider 3: Module Temp */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-carbon-gray30">Module Surface Temp (T_mod)</span>
                <span className="font-mono text-carbon-blue60 font-medium">{moduleTemp.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="75.0"
                step="0.5"
                value={moduleTemp}
                onChange={(e) => setModuleTemp(parseFloat(e.target.value))}
                onPointerUp={handleSliderRelease}
                onKeyUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-carbon-gray60 font-mono">
                <span>10.0 °C (Cool)</span>
                <span>45.0 °C (Nominal)</span>
                <span>75.0 °C (Derating)</span>
              </div>
            </div>

            {/* Manual Run Button */}
            <button
              onClick={() => executePrediction(endpointUrl, irrRef.current, ambRef.current, modRef.current)}
              disabled={loading}
              className="mt-6 w-full h-11 bg-carbon-blue60 hover:bg-carbon-blue70 text-white text-xs uppercase tracking-wider font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>{loading ? "Computing Vector..." : "Recalculate Inference"}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Output Metrics */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-carbon-gray90 border border-carbon-gray80 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-carbon-gray80">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-carbon-blue60" />
                <span className="text-xs uppercase font-mono tracking-wider text-carbon-gray30">
                  Predicted AC Power Output
                </span>
              </div>
            </div>

            <div className="py-12">
              {loading ? (
                <div className="text-2xl font-mono text-carbon-blue60 animate-pulse">
                  Computing ONNX inference...
                </div>
              ) : acPower !== null ? (
                <div className="text-5xl md:text-7xl font-light tracking-tight font-mono text-white">
                  {acPower.toFixed(2)}
                  <span className="text-xl md:text-2xl text-carbon-gray50 font-sans ml-2">kW</span>
                </div>
              ) : (
                <div className="text-lg font-mono text-carbon-supportRed">
                  {apiStatus === "offline" ? "Backend Connecting / Waking Up..." : "--"}
                </div>
              )}
              <p className="text-xs text-carbon-gray50 mt-3">
                Calculated via 3-phase grid inverter inference model.
              </p>
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-carbon-gray80">
              <div>
                <div className="text-[10px] uppercase font-mono text-carbon-gray50">Panel Efficiency Derating</div>
                <div className="text-sm font-mono mt-1 text-carbon-gray10">
                  {moduleTemp > 25.0 ? `-${((moduleTemp - 25.0) * 0.4).toFixed(1)}%` : "0.0% (STC)"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-carbon-gray50">Estimated Daily Yield</div>
                <div className="text-sm font-mono mt-1 text-carbon-gray10">
                  {acPower !== null ? (acPower * 5.2).toFixed(1) : "--"} kWh
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Carbon Footer */}
      <footer className="h-10 border-t border-carbon-gray80 bg-[#161616] px-6 flex items-center justify-between text-[11px] text-carbon-gray50 font-mono">
        <div>HELIOSENSE / CARBON DESIGN SYSTEM SPEC</div>
        <div>ONNX RUNTIME PREDICTOR</div>
      </footer>
    </div>
  );
}
