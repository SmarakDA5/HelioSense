"use client";

import React, { useState, useEffect, useRef } from "react";
import { Activity, Zap, Sun, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const [irradiation, setIrradiation] = useState<number>(0.85);
  const [ambientTemp, setAmbientTemp] = useState<number>(32.0);
  const [moduleTemp, setModuleTemp] = useState<number>(48.5);

  const [acPower, setAcPower] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [endpointUrl, setEndpointUrl] = useState<string>("");

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

  useEffect(() => {
    const configuredUrl = (process.env.NEXT_PUBLIC_API_URL || "https://heliosense-api.onrender.com").replace(/\/$/, "");
    setEndpointUrl(configuredUrl);
    checkHealth(configuredUrl);
    executePrediction(configuredUrl, 0.85, 32.0, 48.5);
  }, []);

  const checkHealth = async (url: string) => {
    try {
      const res = await fetch(`${url}/health`, { method: "GET", mode: "cors" });
      setApiStatus(res.ok ? "online" : "offline");
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
          Accept: "application/json",
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
      console.error("Prediction request failed:", err);
      setApiStatus("offline");
      setAcPower(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderRelease = () => {
    executePrediction(endpointUrl, irrRef.current, ambRef.current, modRef.current);
  };

  const handleManualCommit = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    val: number,
    min: number,
    max: number,
    type: "irr" | "amb" | "mod"
  ) => {
    const clamped = Math.min(Math.max(Number(isNaN(val) ? min : val), min), max);
    setter(clamped);

    const targetIrr = type === "irr" ? clamped : irrRef.current;
    const targetAmb = type === "amb" ? clamped : ambRef.current;
    const targetMod = type === "mod" ? clamped : modRef.current;

    executePrediction(endpointUrl, targetIrr, targetAmb, targetMod);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#f4f4f4] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-12 border-b border-[#2d2d2d] bg-[#181818] px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Sun className="w-4 h-4 text-white stroke-[2.5]" />
          <span className="font-medium text-sm tracking-wide text-white">
            HelioSense <span className="text-[#888888] font-normal">/ Inverter Analytics</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span
            className={`w-2 h-2 ${
              apiStatus === "online"
                ? "bg-[#42be65]"
                : apiStatus === "checking"
                ? "bg-yellow-400"
                : "bg-[#da1e28]"
            }`}
          />
          <span className="text-[#888888] font-mono">
            API: {apiStatus.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Vertical-Only Stack */}
      <main className="flex-1 p-4 md:p-8 max-w-xl mx-auto w-full flex flex-col gap-6">
        {/* Output Readout */}
        <section className="bg-[#1c1c1c] border border-[#2d2d2d] p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#2d2d2d]">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#0f62fe]" />
              <span className="text-xs uppercase font-mono tracking-wider text-[#cccccc]">
                Predicted AC Power Output
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#888888]">3-PHASE GRID</span>
          </div>

          <div className="py-8">
            {loading ? (
              <div className="text-2xl font-mono text-[#0f62fe] animate-pulse">
                Evaluating physical telemetry...
              </div>
            ) : acPower !== null ? (
              <div className="text-6xl md:text-7xl font-light tracking-tight font-mono text-white">
                {acPower.toFixed(2)}
                <span className="text-2xl text-[#888888] font-sans ml-2">kW</span>
              </div>
            ) : (
              <div className="text-lg font-mono text-[#da1e28]">
                {apiStatus === "offline" ? "Backend Connecting..." : "--"}
              </div>
            )}
            <p className="text-xs text-[#888888] mt-2">
              Calculated real-time inverter yield based on current array telemetry.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2d2d2d]">
            <div>
              <div className="text-[10px] uppercase font-mono text-[#888888]">Efficiency Derating</div>
              <div className="text-sm font-mono mt-1 text-[#f4f4f4]">
                {moduleTemp > 25.0 ? `-${((moduleTemp - 25.0) * 0.4).toFixed(1)}%` : "0.0%"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-[#888888]">Estimated Daily Yield</div>
              <div className="text-sm font-mono mt-1 text-[#f4f4f4]">
                {acPower !== null ? (acPower * 5.2).toFixed(1) : "--"} kWh
              </div>
            </div>
          </div>
        </section>

        {/* Input Parameters */}
        <section className="bg-[#1c1c1c] border border-[#2d2d2d] p-6 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#2d2d2d]">
            <h2 className="text-xs uppercase font-mono tracking-wider text-[#cccccc] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#0f62fe]" /> Input Parameters
            </h2>
            <span className="text-[10px] text-[#888888] font-mono">EDIT OR SLIDE</span>
          </div>

          {/* Irradiance */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#cccccc]">Solar Irradiance (G)</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.01"
                  min="0.0"
                  max="1.2"
                  value={irradiation}
                  onChange={(e) => setIrradiation(parseFloat(e.target.value))}
                  onBlur={(e) => handleManualCommit(setIrradiation, parseFloat(e.target.value), 0.0, 1.2, "irr")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualCommit(setIrradiation, parseFloat((e.target as HTMLInputElement).value), 0.0, 1.2, "irr");
                    }
                  }}
                  className="w-16 bg-[#121212] border border-[#393939] text-[#0f62fe] font-mono text-right px-1.5 py-0.5 focus:border-[#0f62fe] focus:outline-none"
                />
                <span className="font-mono text-[#888888]">kW/m²</span>
              </div>
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
            <div className="flex justify-between text-[10px] text-[#666666] font-mono">
              <span>0.00</span>
              <span>0.60</span>
              <span>1.20</span>
            </div>
          </div>

          {/* Ambient Temp */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#cccccc]">Ambient Temperature (T_amb)</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.5"
                  min="10.0"
                  max="50.0"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
                  onBlur={(e) => handleManualCommit(setAmbientTemp, parseFloat(e.target.value), 10.0, 50.0, "amb")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualCommit(setAmbientTemp, parseFloat((e.target as HTMLInputElement).value), 10.0, 50.0, "amb");
                    }
                  }}
                  className="w-16 bg-[#121212] border border-[#393939] text-[#0f62fe] font-mono text-right px-1.5 py-0.5 focus:border-[#0f62fe] focus:outline-none"
                />
                <span className="font-mono text-[#888888]">°C</span>
              </div>
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
            <div className="flex justify-between text-[10px] text-[#666666] font-mono">
              <span>10.0 °C</span>
              <span>30.0 °C</span>
              <span>50.0 °C</span>
            </div>
          </div>

          {/* Module Temp */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#cccccc]">Module Surface Temp (T_mod)</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.5"
                  min="10.0"
                  max="75.0"
                  value={moduleTemp}
                  onChange={(e) => setModuleTemp(parseFloat(e.target.value))}
                  onBlur={(e) => handleManualCommit(setModuleTemp, parseFloat(e.target.value), 10.0, 75.0, "mod")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualCommit(setModuleTemp, parseFloat((e.target as HTMLInputElement).value), 10.0, 75.0, "mod");
                    }
                  }}
                  className="w-16 bg-[#121212] border border-[#393939] text-[#0f62fe] font-mono text-right px-1.5 py-0.5 focus:border-[#0f62fe] focus:outline-none"
                />
                <span className="font-mono text-[#888888]">°C</span>
              </div>
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
            <div className="flex justify-between text-[10px] text-[#666666] font-mono">
              <span>10.0 °C</span>
              <span>45.0 °C</span>
              <span>75.0 °C</span>
            </div>
          </div>

          {/* Sync Status */}
          <div className="mt-6 pt-4 border-t border-[#2d2d2d] flex items-center justify-between text-[11px] font-mono text-[#888888]">
            <span className="flex items-center gap-1.5 text-[#42be65]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Auto-synchronizing</span>
            </span>
            <span>3 SENSORS LINKED</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-[#2d2d2d] bg-[#181818] px-4 md:px-6 flex items-center justify-between text-[11px] text-[#888888] font-mono">
        <div>HELIOSENSE TELEMETRY DASHBOARD</div>
        <div>REAL-TIME SOLAR YIELD MONITOR</div>
      </footer>
    </div>
  );
}
