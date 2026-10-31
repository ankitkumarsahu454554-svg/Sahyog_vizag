'use strict';

/**
 * AI Triage Service — SahyogAI (Visakhapatnam, Andhra Pradesh Deployment)
 * ------------------------------------------------------------------------
 * Powered by Antigravity AI Engine & Hugging Face NLP / Whisper Pipeline
 * Supports Telugu (తెలుగు), English, and Phonetic Regional Disaster Reports.
 * Server-side Gemini API with strict JSON schema and deterministic rule fallback.
 * NEVER exposes API keys to client.
 */

let GoogleGenerativeAI = null;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (_) {}
const URGENCY_LEVELS = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORIES = [
  'Medical Emergency',
  'Trapped / Missing People',
  'Flooding',
  'Fire',
  'Food & Drinking Water',
  'Shelter',
  'Rescue Assistance',
  'Transportation',
  'Power Outage',
  'Communication Failure',
  'Sanitation',
  'Roadblock & Fallen Trees',
  'Other Emergency',
];

const TIMEOUT_MS = 12000; // 12-second hard limit

// ── Strict output schema for AI ─────────────────────────────────────────────
const SCHEMA_EXAMPLE = {
  recommendedUrgency: 'Critical | High | Medium | Low',
  recommendedCategory: '<one of the valid categories>',
  incidentTitle: '<4-6 word title>',
  summary: '<1-2 sentence dispatch brief>',
  affectedCount: '<number or null>',
  immediateNeeds: ['<need 1>', '<need 2>'],
  hazards: ['<hazard 1>'],
  recommendedNextSteps: ['<step 1>', '<step 2>'],
  missingInfo: ['<info 1>'],
  confidence: 'high | medium | low | uncertain',
  reasoning: '<brief explanation of urgency recommendation>',
  detectedLanguage: 'en | te | mixed | unknown',
};

const SYSTEM_PROMPT = `You are SahyogAI Powered by Antigravity AI Engine, an emergency disaster response triage intelligence deployed in Visakhapatnam (Vizag), Andhra Pradesh, India.
You assist trained emergency coordinators, APSDMA (Andhra Pradesh State Disaster Management Authority), GVMC (Greater Visakhapatnam Municipal Corporation), NDRF 10th Bn, and Indian Navy Eastern Naval Command (ENC) — you do NOT replace them.

Key operational landmarks in Visakhapatnam include:
- King George Hospital (KGH) — apex government super-speciality & emergency trauma center (Maharanipeta, Beach Road)
- Visakha Institute of Medical Sciences (VIMS, Hanumanthavaka)
- Apollo Hospitals & CARE Hospitals (Health City Arilova / Ramnagar)
- SevenHills Hospital & Medicover MVP Colony
- Ramakrishna (RK) Beach & Coastal Beach Road corridor (cyclone storm surge corridor)
- Visakhapatnam Port, Naval Dockyard & Eastern Naval Command
- Jagadamba Junction, MVP Colony, Gajuwaka Industrial Hub, Madhurawada, Rushikonda, Simhachalam, Pendurthi.

Your task is to analyze an incoming emergency SOS report and return a structured JSON triage assessment.

URGENCY LEVELS (choose one):
- Critical: Immediate threat to life, severe trauma, drowning in floodwaters/beach, cardiac emergency, fire/gas leak, active childbirth in distress, snakebite, live snapped electric wires in water, trapped under collapsed roof.
- High: Significant risk, deteriorating situation, vulnerable populations (elderly, infants, pregnant women), essential medical needs (insulin, dialysis, oxygen), roof blow-off during cyclone.
- Medium: Serious but stable situation, essential food/drinking water shortage, urban waterlogging without immediate drowning threat.
- Low: Minor property damage, road blockage with alternate bypass available, general informational inquiries.

SAFETY RULES:
- Do NOT downgrade urgency solely because a formal keyword is absent.
- Treat reports of trapped people, rooftop stranded victims, flood entering homes, heavy bleeding, unconsciousness, fire, live electric lines, or coastal storm surge as at least High or Critical urgency.
- If uncertain, lean toward higher urgency and set confidence to "uncertain".
- Do NOT invent names, locations, injuries, or numbers not stated in the report.
- The report may be in Telugu (తెలుగు script or phonetic English), English, or mixed.

VALID CATEGORIES: ${CATEGORIES.join(' | ')}

Respond with ONLY a valid JSON object matching this exact schema (no markdown, no code fences):
${JSON.stringify(SCHEMA_EXAMPLE, null, 2)}`;

// ── Validation: check AI output before using it ─────────────────────────────
function validateAIOutput(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (!URGENCY_LEVELS.includes(obj.recommendedUrgency)) return false;
  if (typeof obj.summary !== 'string' || obj.summary.length < 5) return false;
  if (!['high', 'medium', 'low', 'uncertain'].includes(obj.confidence)) return false;
  return true;
}

function sanitizeAIOutput(obj) {
  return {
    recommendedUrgency: URGENCY_LEVELS.includes(obj.recommendedUrgency) ? obj.recommendedUrgency : 'Medium',
    recommendedCategory: CATEGORIES.includes(obj.recommendedCategory) ? obj.recommendedCategory : null,
    incidentTitle: typeof obj.incidentTitle === 'string' ? obj.incidentTitle.slice(0, 100) : null,
    summary: typeof obj.summary === 'string' ? obj.summary.slice(0, 1000) : '',
    affectedCount: typeof obj.affectedCount === 'number' && obj.affectedCount >= 0 ? Math.floor(obj.affectedCount) : null,
    immediateNeeds: Array.isArray(obj.immediateNeeds) ? obj.immediateNeeds.map(String).slice(0, 10) : [],
    hazards: Array.isArray(obj.hazards) ? obj.hazards.map(String).slice(0, 10) : [],
    recommendedNextSteps: Array.isArray(obj.recommendedNextSteps) ? obj.recommendedNextSteps.map(String).slice(0, 8) : [],
    missingInfo: Array.isArray(obj.missingInfo) ? obj.missingInfo.map(String).slice(0, 6) : [],
    confidence: ['high', 'medium', 'low', 'uncertain'].includes(obj.confidence) ? obj.confidence : 'uncertain',
    reasoning: typeof obj.reasoning === 'string' ? obj.reasoning.slice(0, 1000) : '',
    detectedLanguage: ['en', 'te', 'mixed', 'unknown'].includes(obj.detectedLanguage) ? obj.detectedLanguage : 'unknown',
  };
}

// ── Rule-based fallback (Visakhapatnam, Andhra Pradesh emergency vocabulary) ──
function ruleFallback(reportText, location, userCategory, affectedCountRange) {
  const lower = (reportText || '').toLowerCase();

  // Critical triggers (English, Telugu Unicode, and Phonetic Telugu / Tanglish)
  const criticalPatterns = [
    // English
    'trapped', 'trap', 'unconscious', 'not breathing', 'heart attack', 'cardiac',
    'drowning', 'drown', 'bleeding heavily', 'blood', 'fire', 'burning', 'burn',
    'collapse', 'collapsed', 'labor', 'labour', 'childbirth', 'ambulance',
    'critical', 'dying', 'died', 'dead', 'terrace', 'rooftop stranded', 'snakebite',
    'electric wire', 'live cable', 'snapped wire', 'gas leak', 'suffocation',
    'tsunami', 'high tide', 'storm surge', 'sea water entered',
    // Telugu Unicode
    'నీరు చేరింది', 'వరద', 'బోటు పంపండి', 'బోటు కావాలి', 'మునిగిపోతున్నారు',
    'పైకప్పు మీద', 'స్పృహ లేదు', 'రక్తం కారుతోంది', 'అత్యవసరం', 'వైద్య సహాయం',
    'కరెంట్ వైరు', 'కూలిపోయింది', 'చనిపోతారు', 'కాపాడండి', 'త్వరగా రండి',
    'పాము కాటు', 'గుండె నొప్పి', 'గ్యాస్ లీక్', 'తుఫాను', 'ఆసుపత్రి', 'కె.జి.హెచ్',
    // Phonetic Telugu / Tanglish
    'neellu cherindi', 'neellu perigipoyayi', 'varadha', 'boat pampandi', 'boat kavali',
    'munigipotunnam', 'roof meeda', 'chikkukunnam', 'spruha ledu', 'raktham',
    'emergency', 'rescue cheyandi', 'kapadandi', 'pamu katu', 'current wire tegindi',
    'electric cable', 'kgh hospital', 'twaraga randi', 'gunde noppi', 'gas leak'
  ];

  const highPatterns = [
    // English
    'water', 'flood', 'flooded', 'inundation', 'elderly', 'senior', 'infant',
    'baby', 'pregnant', 'diabetic', 'insulin', 'medicine', 'bp medicine',
    'no food', 'no water', 'drinking water', 'shelter needed', 'roof damaged',
    'power cut', 'no electricity', 'cyclone', 'missing', 'storm surge', 'tree fell',
    // Telugu Unicode
    'వరదలు', 'తాగునీరు', 'ఆహారం లేదు', 'గర్భిణీ', 'చిన్న పిల్లలు', 'వృద్ధులు',
    'ఇన్సులిన్', 'మందులు', 'రహదారి బంద్', 'చెట్టు పడిపోయింది', 'కరెంట్ లేదు',
    'తుపాను', 'ఇల్లు దెబ్బతింది', 'సహాయం కావాలి',
    // Phonetic Telugu
    'varadhalu', 'aaharam ledu', 'neellu levu', 'taguneeru', 'garbhini', 'pillalu',
    'vruddhulu', 'mandulu kavali', 'road block', 'chettu padipoyindi', 'current ledu',
    'cyclone', 'shelter kavali', 'sahayam'
  ];

  const hasCritical = criticalPatterns.some(p => lower.includes(p));
  const hasHigh = highPatterns.some(p => lower.includes(p));

  let urgency = 'Medium';
  if (hasCritical) urgency = 'Critical';
  else if (hasHigh || userCategory === 'Medical Emergency') urgency = 'High';
  else if (userCategory === 'Food & Drinking Water' || userCategory === 'Shelter') urgency = 'Medium';
  else urgency = 'Low';

  // Category detection
  let category = userCategory;
  if (!CATEGORIES.includes(category)) {
    if (lower.includes('water') || lower.includes('flood') || lower.includes('వరద') || lower.includes('నీరు') || lower.includes('surge')) category = 'Flooding';
    else if (lower.includes('fire') || lower.includes('burn') || lower.includes('నిప్పు') || lower.includes('మంటలు') || lower.includes('gas')) category = 'Fire';
    else if (lower.includes('trapped') || lower.includes('missing') || lower.includes('చిక్కు') || lower.includes('పైకప్పు') || lower.includes('roof')) category = 'Trapped / Missing People';
    else if (lower.includes('food') || lower.includes('ration') || lower.includes('ఆహారం') || lower.includes('తాగునీరు') || lower.includes('water')) category = 'Food & Drinking Water';
    else if (lower.includes('medicine') || lower.includes('hospital') || lower.includes('doctor') || lower.includes('వైద్యం') || lower.includes('kgh') || lower.includes('ఆసుపత్రి')) category = 'Medical Emergency';
    else if (lower.includes('tree') || lower.includes('road') || lower.includes('చెట్టు') || lower.includes('రహదారి')) category = 'Roadblock & Fallen Trees';
    else category = 'Other Emergency';
  }

  // Immediate needs customized for Visakhapatnam disaster infrastructure
  const needs = [];
  if (lower.includes('boat') || lower.includes('బోటు') || lower.includes('flood') || lower.includes('వరద')) needs.push('NDRF / Navy Inflatable Rescue Boat');
  if (lower.includes('insulin') || lower.includes('medicine') || lower.includes('bp') || lower.includes('మందులు') || lower.includes('snakebite')) needs.push('Critical Medicines / Antivenom Kit to KGH');
  if (lower.includes('food') || lower.includes('ration') || lower.includes('ఆహారం') || lower.includes('rice')) needs.push('GVMC Relief Food Packets & Ready Meals');
  if (lower.includes('water') || lower.includes('తాగునీరు') || lower.includes('నీరు')) needs.push('Packaged Drinking Water (20L Cans)');
  if (lower.includes('shelter') || lower.includes('roof') || lower.includes('పైకప్పు') || lower.includes('cyclone')) needs.push('Cyclone Shelter Tarpaulin & Dry Bedding');
  if (lower.includes('ambulance') || lower.includes('hospital') || lower.includes('kgh') || lower.includes('ఆసుపత్రి')) needs.push('108 Advanced Life Support Ambulance to KGH Vizag');
  if (lower.includes('electric') || lower.includes('wire') || lower.includes('కరెంట్') || lower.includes('వైరు')) needs.push('APEPDCL Power Isolation & Restoration Crew');
  if (needs.length === 0) needs.push('GVMC / SDRF Rapid Field Assessment Team');

  // Language detection
  const teluguChars = /[\u0C00-\u0C7F]/;
  const hasEnglish = /[a-zA-Z]/.test(reportText);
  const hasTelugu = teluguChars.test(reportText);

  let lang = 'unknown';
  if (hasTelugu && hasEnglish) lang = 'mixed';
  else if (hasTelugu) lang = 'te';
  else if (hasEnglish) lang = 'en';

  const summary = `Visakhapatnam Emergency Sector at ${location}. ${reportText.slice(0, 140)}${reportText.length > 140 ? '...' : ''}`;
  const title = `${category.split('/')[0].trim()} — ${location.split(',')[0].trim()}`.slice(0, 80);

  return {
    recommendedUrgency: urgency,
    recommendedCategory: category,
    incidentTitle: title,
    summary,
    affectedCount: null,
    immediateNeeds: needs,
    hazards: hasCritical ? ['Imminent life-safety hazard or rising coastal floodwaters reported'] : [],
    recommendedNextSteps: [
      'Visakhapatnam EOC / GVMC Coordinator to verify incident via registered phone.',
      'Dispatch nearest NDRF 10th Bn / 108 Ambulance / Coast Guard unit in Vizag sector.',
    ],
    missingInfo: [
      'Exact head count of vulnerable persons (infants/elderly) pending confirmation.',
      'Water ingress depth and street accessibility status to be verified by field scout.',
    ],
    confidence: 'medium',
    reasoning: `Antigravity AI Rule-based heuristic classification for Visakhapatnam sector. Category: ${category}. Urgency set to ${urgency} based on high-risk disaster keywords. Coordinator review recommended.`,
    detectedLanguage: lang,
  };
}

// ── Main export ──────────────────────────────────────────────────────────────
async function runTriage({ reportText, location, userCategory, affectedCountRange }) {
  const startMs = Date.now();

  // Attempt Gemini call only if key is configured
  if (process.env.GEMINI_API_KEY && GoogleGenerativeAI) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      });

      const userPrompt = `Operational Sector: Visakhapatnam (Vizag), Andhra Pradesh, India
Location: "${location}"
Reported category: "${userCategory || 'Not specified'}"
Estimated people affected: "${affectedCountRange || 'Unknown'}"
Emergency report (may be in Telugu తెలుగు, English, or phonetic Tanglish/Telugu):
"""
${reportText}
"""`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), TIMEOUT_MS)
      );

      const resultPromise = model.generateContent([SYSTEM_PROMPT, userPrompt]);
      const result = await Promise.race([resultPromise, timeoutPromise]);

      const rawText = result.response.text();
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (_e) {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error('Gemini returned non-JSON response');
      }

      if (!validateAIOutput(parsed)) {
        throw new Error('Gemini output failed schema validation');
      }

      const sanitized = sanitizeAIOutput(parsed);
      return {
        ...sanitized,
        source: 'gemini',
        model: 'gemini-1.5-flash',
        processedAt: new Date(),
        processingMs: Date.now() - startMs,
        rawResponse: parsed,
      };

    } catch (err) {
      console.warn('[TriageService] Gemini failed, using Antigravity AI rule-based fallback:', err.message);
    }
  }

  // Deterministic fallback
  const fallback = ruleFallback(reportText, location, userCategory, affectedCountRange);
  return {
    ...fallback,
    source: 'fallback',
    model: 'antigravity-vizag-v2.5',
    processedAt: new Date(),
    processingMs: Date.now() - startMs,
    rawResponse: null,
  };
}

module.exports = { runTriage, ruleFallback };
