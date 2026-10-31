# SahyogAI Vizag — AI-Powered Disaster Response & Relief Coordination

> **⚡ Powered by Antigravity AI Engine v2.5**  
> Operational Deployment: **Visakhapatnam (Vizag), Andhra Pradesh**  
> Disaster Authorities: **APSDMA**, **GVMC**, **NDRF 10th Battalion**, **Indian Navy Eastern Naval Command (ENC)**, **District Collectorate EOC**  
> Emergency Hotline: **112 (National)** · **108 (Ambulance)** · **1077 (Vizag Collectorate EOC)** · **0891-2564891 (KGH Casualty)**  
> 
> **⚠️ Prototype Notice:** This is an advanced disaster emergency coordination platform. Always dial official emergency services (112 or 108 in India) for immediate life-threatening situations.

---

## 🌟 Key Features

1. **Bilingual Emergency Intake (Telugu తెలుగు + English)**
   - Complete localized UI/UX with instant 1-tap language switching.
   - Tailored for citizen victims facing cyclones, tidal storm surges, flash floods, and medical trauma along the Andhra Pradesh coast.

2. **Antigravity AI Engine + Hugging Face Whisper ASR Integration**
   - High-performance microphone recording with real-time **Web Audio API Frequency Waveform Visualizer**.
   - Continuous bilingual speech-to-text (`te-IN` and `en-IN`).
   - Seamless **Hugging Face Whisper** Automatic Speech Recognition (`openai/whisper-large-v3-turbo` / `facebook/mms-1b-all`).
   - Automated **Emergency Situation Recognition**:
     - Identifies situation category (Flooding, Critical Trauma, Live Wire, Cyclone Damage, Childbirth).
     - Calculates Triage Urgency (`Critical`, `High`, `Medium`, `Low`).
     - Extracts immediate responder needs (NDRF Inflatable Gemini Boats, 108 Cardiac Ambulances to KGH, APEPDCL Power Crews).
     - Surfaces immediate calming reassurance & survival instructions for victims in panic.

3. **High-Accuracy GPS & Automated Nearby Hospital Locator**
   - Live HTML5 Geolocation with satellite fix.
   - Automatic **Haversine Distance Calculation** to all 10 major emergency hospitals in Visakhapatnam:
     - **King George Hospital (KGH)** — Apex Government Tertiary & Trauma Center (Maharanipeta)
     - **Apollo Hospitals Health City** — Super Speciality & Emergency Cardiac (Arilova)
     - **CARE Hospitals** — Level 1 Trauma Care & Critical Resuscitation (Ramnagar)
     - **SevenHills Hospital** — Multi-Specialty Disaster Emergency (Waltair)
     - **Govt Victoria Hospital (Ghosha)** — Maternal & Pediatric Speciality (Chengal Rao Peta)
     - **Visakha Institute of Medical Sciences (VIMS)** — Government Super Speciality (Hanumanthavaka)
     - **Medicover Hospitals** — 24x7 Trauma (MVP Colony)
     - **INHS Kalyani** — Indian Naval Armed Forces Hospital (Malkapuram)
     - **Govt Regional Eye Hospital** — Emergency Ophthalmic Trauma (Ramnagar)
     - **GVP Institute of Medical Technology** — North Vizag Highway Trauma (Madhurawada)
   - Highlights the closest hospital with distance (e.g. `0.8 km away • ~3 mins`), 1-tap casualty phone call button, and Google Maps turn-by-turn navigation!
   - Plotted on interactive Leaflet map with emergency hospital pins.

4. **Offline-First Resilience & Zero-Network SMS Fallback**
   - Progressive Web App (PWA) with Service Worker (`sw.js`) shell caching.
   - IndexedDB Outbox queue for buffering SOS mutations during cellular tower outages.
   - **1-Tap Offline SMS SOS Fallback**: Automatically creates an emergency SMS to `112` or `1077` with exact GPS coordinates and situation description (works on 2G GSM when 4G/5G mobile internet drops).
   - 100% Offline Disaster Survival & First-Aid Manual (Cyclone Hudhud storm rules, flood safety, CPR, snakebite, bleeding control).

5. **Mobile-First Victim-Empathetic UX**
   - Pinned mobile bottom navigation bar (`🚨 SOS`, `🏥 Medical`, `🗺️ Map`, `📋 Track`, `🛡️ Guide`).
   - Large tactile buttons (minimum 48px height) for wet or shaking hands.
   - 1-Tap distress preset chips (Boat, KGH Ambulance, Water, Food, Terrace Stranded, Live Wire).
   - High contrast emergency theme with tactile vibration feedback.

---

## 🏗️ Architecture

```
Sahyog/
  ├── client/public/        → Served frontend SPA (HTML5 + Tailwind CSS + Vanilla JS + Leaflet + Chart.js)
  ├── offline/              → IndexedDB offline engine, sync manager, and HUD
  │     ├── offlineDB.js
  │     ├── syncEngine.js
  │     └── OfflineStatusBanner.js
  ├── server/
  │     ├── src/
  │     │     ├── app.js               → Express application entry point
  │     │     ├── models/              → Mongoose schemas (Incident, User, Resource, Assignment)
  │     │     ├── routes/
  │     │     │     ├── incidents.js   → REST API + Hugging Face /voice-triage endpoint
  │     │     │     ├── demo.js        → Visakhapatnam simulation scenarios
  │     │     │     └── ...
  │     │     ├── services/
  │     │     │     └── triageService.js → Antigravity AI & Gemini triage engine
  │     │     └── utils/seed.js        → Visakhapatnam demo data seeder
  ├── manifest.json         → PWA manifest configured for Visakhapatnam
  └── sw.js                 → Production service worker with offline caching
```

---

## 🚀 Quick Start

### 1. Run Directly in Browser (Antigravity Offline Mode)
Open `Sahyog/index.html` directly in any web browser (Google Chrome, Edge, Safari, Firefox). The built-in Antigravity Offline Engine provides complete localized triage, GPS hospital distance calculation, interactive Vizag maps, and bilingual speech recognition in-browser!

### 2. Run with Node.js Server
```bash
cd Sahyog/server
npm install
npm run seed     # Seeds Visakhapatnam incidents, volunteers & resources
npm start        # Starts server on http://localhost:5000
```

---

## 🛡️ Antigravity AI Engine Details

| Capability | Specification |
| :--- | :--- |
| **Operational Region** | Visakhapatnam (Vizag), Andhra Pradesh (`17.6868° N, 83.2185° E`) |
| **Speech Engine** | Bilingual Web Speech API + Hugging Face Whisper ASR (`openai/whisper-large-v3-turbo`) |
| **Audio Visualizer** | Live Web Audio API (`AnalyserNode` Oscilloscope Waveform) |
| **Hospital Geospatial** | Haversine Vector Distance Engine (10 Vizag Emergency Hospitals) |
| **Offline Protocol** | IndexedDB Priority Queue + Service Worker v4 + 2G SMS Beaconing |
| **Languages** | Telugu (తెలుగు) & Indian English (en-IN) |
