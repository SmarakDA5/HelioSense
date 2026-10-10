import os
import numpy as np
import onnxruntime as ort
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Solar Power Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.getenv("MODEL_PATH", "solar_power_model.onnx")
session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
input_name = session.get_inputs()[0].name

class SolarTelemetryInput(BaseModel):
    irradiation: float
    ambient_temperature: float
    module_temperature: float

@app.get("/health")
def health_check():
    return {"status": "online", "model_loaded": True}

@app.post("/predict")
def predict_power(data: SolarTelemetryInput):
    input_vector = np.array([[
        data.irradiation,
        data.ambient_temperature,
        data.module_temperature
    ]], dtype=np.float32)
    
    raw_output = session.run(None, {input_name: input_vector})[0]
    power_kw = float(np.squeeze(raw_output))
    output_kw = float(max(0.0, power_kw))
    
    return {
        "predicted_ac_power_kw": round(output_kw, 2),
        "input_telemetry": data.model_dump()
    }
