'use strict';

const express = require('express');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Assignment = require('../models/Assignment');
const AuditEvent = require('../models/AuditEvent');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

// ============================================================================
// POST /api/demo/reset — reset all demo data (admin/coordinator only)
// Requires explicit confirmation token to prevent accidental resets
// ============================================================================
router.post('/reset', authenticate, authorize('admin', 'coordinator'), asyncHandler(async (req, res) => {
  const { confirm } = req.body;
  if (confirm !== 'RESET_DEMO_DATA') {
    throw createError('Provide { "confirm": "RESET_DEMO_DATA" } to confirm reset.', 422);
  }

  // Delete only demo-flagged records
  await Promise.all([
    Incident.deleteMany({ isDemo: true }),
    Assignment.deleteMany({ isDemo: true }),
    Resource.deleteMany({ isDemo: true }),
    AuditEvent.deleteMany({ isDemo: true }),
    User.deleteMany({ isDemo: true, role: { $ne: 'admin' } }), // never delete demo admin
  ]);

  // Re-seed demo data
  await seedDemoData(req.user);

  res.json({ success: true, message: 'Demo data has been reset to the default Visakhapatnam, Andhra Pradesh scenario.' });
}));

// ============================================================================
// GET /api/demo/status — check if demo mode is active
// ============================================================================
router.get('/status', (_req, res) => {
  res.json({
    success: true,
    demoMode: process.env.DEMO_MODE === 'true',
    operationalSector: 'Visakhapatnam (Vizag), Andhra Pradesh',
    message: 'Antigravity AI Disaster Demonstration environment active. All records labeled DEMO represent Visakhapatnam simulation data.',
  });
});

// ============================================================================
// Seed function (Visakhapatnam, Andhra Pradesh Sector)
// ============================================================================
async function seedDemoData(seedUser) {
  const seeder = seedUser || { _id: null, displayName: 'System Seed', role: 'admin' };

  // Demo volunteers in Visakhapatnam
  const volunteers = await User.create([
    {
      displayName: 'Suresh (Indian Red Cross - Vizag Chapter)',
      username: 'suresh_redcross',
      passwordHash: 'Demo@2024!',
      role: 'volunteer',
      isDemo: true,
      profile: {
        skills: ['First Aid', 'Patient Triage', 'Emergency Trauma Care'],
        serviceArea: 'Maharanipeta, Beach Road, Jagadamba',
        availability: 'available',
        teamAffiliation: 'Indian Red Cross Society - Visakhapatnam',
      },
    },
    {
      displayName: 'Ananya (Andhra University NSS Cell)',
      username: 'ananya_nss',
      passwordHash: 'Demo@2024!',
      role: 'volunteer',
      isDemo: true,
      profile: {
        skills: ['Ration Distribution', 'Relief Camp Logistics', 'Youth SAR Squad'],
        serviceArea: 'AU Campus, Siripuram, Waltair Uplands',
        availability: 'available',
        teamAffiliation: 'Andhra University NSS Volunteer Wing',
      },
    },
    {
      displayName: 'Team Sagar (Vizag Marine SAR & Fishermen Guild)',
      username: 'team_sagar',
      passwordHash: 'Demo@2024!',
      role: 'volunteer',
      isDemo: true,
      profile: {
        skills: ['Inflatable Boat Operation', 'Deep Surf Water Rescue', 'Flood Evacuation'],
        serviceArea: 'RK Beach, Jalaripeta, Fishing Harbour',
        availability: 'available',
        teamAffiliation: 'Visakhapatnam Coastal Marine SAR Guild',
      },
    },
    {
      displayName: 'Team Garuda (NDRF / SDRF Auxiliary Vizag)',
      username: 'team_garuda',
      passwordHash: 'Demo@2024!',
      role: 'volunteer',
      isDemo: true,
      profile: {
        skills: ['Off-road 4x4 Transport', 'Debris Clearance', 'Heavy Evacuation Equipment'],
        serviceArea: 'Gajuwaka Industrial Corridor, MVP Colony, Pendurthi',
        availability: 'available',
        teamAffiliation: 'Andhra Pradesh SDRF Auxiliary Squad',
      },
    },
  ]);

  // Demo resources in Visakhapatnam
  await Resource.create([
    {
      name: 'Packaged Safe Drinking Water (20L Cans)',
      resourceType: 'Drinking Water',
      unit: 'cans',
      quantityTotal: 650,
      quantityReserved: 40,
      quantityDispatched: 90,
      storageLocation: 'GVMC Central Relief Warehouse, Jagadamba Centre',
      responsibleOrg: 'Greater Visakhapatnam Municipal Corporation (GVMC)',
      lowStockThreshold: 50,
      isDemo: true,
    },
    {
      name: 'Emergency Dry Ration Kits (Rice, Dal, Biscuits, ORS)',
      resourceType: 'Food Packets',
      unit: 'kits',
      quantityTotal: 800,
      quantityReserved: 60,
      quantityDispatched: 180,
      storageLocation: 'Collectorate Emergency Depot, Maharanipeta',
      responsibleOrg: 'District Disaster Management Authority, Visakhapatnam',
      lowStockThreshold: 60,
      isDemo: true,
    },
    {
      name: 'Trauma First-Aid Kits & Snake Antivenom Vials',
      resourceType: 'First-Aid Kits',
      unit: 'kits',
      quantityTotal: 120,
      quantityReserved: 15,
      quantityDispatched: 35,
      storageLocation: 'King George Hospital (KGH) Emergency Casualty Annex',
      responsibleOrg: 'KGH Emergency & Trauma Department, Maharanipeta',
      lowStockThreshold: 20,
      isDemo: true,
    },
    {
      name: 'Inflatable Zodiac Rescue Boats with Outboard Motors',
      resourceType: 'Boats',
      unit: 'boats',
      quantityTotal: 8,
      quantityReserved: 2,
      quantityDispatched: 4,
      storageLocation: 'Visakhapatnam Fishing Harbour & Marine Police Depot',
      responsibleOrg: 'NDRF 10th Bn & Marine Coastal Police',
      lowStockThreshold: 2,
      isDemo: true,
    },
    {
      name: 'Heavy-Duty Tarpaulin Sheets & Cyclone Blankets',
      resourceType: 'Blankets',
      unit: 'units',
      quantityTotal: 450,
      quantityReserved: 30,
      quantityDispatched: 110,
      storageLocation: 'Port Indoor Stadium Relief Transit Camp',
      responsibleOrg: 'Indian Red Cross Society, Vizag',
      lowStockThreshold: 40,
      isDemo: true,
    },
    {
      name: 'Essential Emergency Antibiotics & Cold-Chain Coolers',
      resourceType: 'Medicines',
      unit: 'kits',
      quantityTotal: 110,
      quantityReserved: 10,
      quantityDispatched: 25,
      storageLocation: 'VIMS Super Speciality Hospital Cold Storage, Hanumanthavaka',
      responsibleOrg: 'Andhra Pradesh Medical Services & Infrastructure Corp',
      lowStockThreshold: 15,
      isDemo: true,
    },
  ]);

  // Demo incidents with realistic timestamps in Visakhapatnam
  const now = new Date();
  const mins = (m) => new Date(now - m * 60000);

  const incidentData = [
    {
      originalReport: 'Cyclone storm surge water entered our house in Jalaripeta near Beach Road. 6 people stranded on terrace, grandmother needs urgent BP medicine and food.',
      locationDescription: 'Jalaripeta Coastal Road, Near RK Beach, Visakhapatnam',
      reportedCategory: 'Medical Emergency',
      category: 'Medical Emergency',
      affectedCountRange: '4-8',
      aiRecommendedUrgency: 'Critical',
      effectiveUrgency: 'Critical',
      triageStatus: 'completed',
      status: 'awaiting_assignment',
      verificationStatus: 'under_review',
      coordinates: { lat: 17.7126, lng: 83.3216, source: 'gps' },
      aiTriage: {
        source: 'fallback',
        model: 'antigravity-vizag-v2.5',
        recommendedUrgency: 'Critical',
        incidentTitle: 'Beach Road Inundation & Geriatric Medical Distress — Jalaripeta',
        summary: 'Severe coastal storm surge flooding entered residential homes near RK Beach. Elderly patient requires blood pressure medication; evacuation boat and medical transit needed.',
        immediateNeeds: ['NDRF / Navy Inflatable Boat', 'BP Medicines', 'Elderly Evacuation Support'],
        hazards: ['High coastal tidal waves', 'Rising saltwater ingress'],
        confidence: 'high',
        reasoning: 'Critical coastal flood inundation coupled with essential geriatric medication dependency qualifies for Critical triage priority.',
        detectedLanguage: 'en',
        processedAt: mins(12),
        processingMs: 380,
      },
      isDemo: true,
    },
    {
      originalReport: 'Severe 18-hour cyclone power blackout in MVP Colony Sector 4. Diabetic patient needs cold-chain insulin pen urgently before 2 PM. Local medical shops flooded.',
      locationDescription: 'MVP Colony Sector 4, Near Double Road, Visakhapatnam',
      reportedCategory: 'Medical Emergency',
      category: 'Medical Emergency',
      affectedCountRange: '1-3',
      aiRecommendedUrgency: 'Critical',
      effectiveUrgency: 'Critical',
      triageStatus: 'completed',
      status: 'assigned',
      verificationStatus: 'verified',
      coordinates: { lat: 17.7408, lng: 83.3375, source: 'gps' },
      aiTriage: {
        source: 'fallback',
        model: 'antigravity-vizag-v2.5',
        recommendedUrgency: 'Critical',
        incidentTitle: 'Time-Critical Insulin Cold-Chain Transport — MVP Colony',
        summary: 'Diabetic patient requiring refrigerated insulin delivery amidst prolonged 18-hour grid blackout in MVP Colony.',
        immediateNeeds: ['Insulin pens (cold-chain)', 'Ice packs & portable cool-box', 'Medicover Hospital Coordination'],
        hazards: ['Time-critical medical deadline', 'Widespread grid blackout'],
        confidence: 'high',
        reasoning: 'Cold-chain medication deadline with zero electricity backup requires immediate urgent volunteer courier.',
        detectedLanguage: 'en',
        processedAt: mins(25),
        processingMs: 410,
      },
      isDemo: true,
    },
    {
      originalReport: 'సముద్రపు నీరు రోడ్డు మీదకు వచ్చింది, ఇళ్లలోకి నీరు చేరింది. మేము 7 గురం డాబా మీద చిక్కుకున్నాము. చుట్టూ నీరు పెరుగుతోంది, వెంటనే బోటు పంపండి!',
      locationDescription: 'Fishing Harbour Beach Approach, Chengal Rao Peta, Visakhapatnam',
      reportedCategory: 'Flooding',
      category: 'Flooding',
      affectedCountRange: '4-8',
      aiRecommendedUrgency: 'Critical',
      effectiveUrgency: 'Critical',
      detectedLanguage: 'te',
      triageStatus: 'completed',
      status: 'in_progress',
      verificationStatus: 'verified',
      coordinates: { lat: 17.6948, lng: 83.2980, source: 'gps' },
      aiTriage: {
        source: 'fallback',
        model: 'antigravity-vizag-v2.5',
        recommendedUrgency: 'Critical',
        incidentTitle: 'Harbour Approach Terrace Stranded Evacuation',
        summary: 'Telugu SOS: Severe coastal storm surge inundated coastal settlement near Port Harbour. 7 citizens stranded on terrace surrounded by rising seawater.',
        immediateNeeds: ['NDRF Inflatable Zodiac Boat', 'Emergency Life Jackets', 'Coastal Evacuation Squad'],
        hazards: ['High coastal storm surge', 'Rapidly eroding foundation'],
        confidence: 'high',
        reasoning: 'Telugu distress keywords confirmed: సముద్రపు నీరు (sea water), డాబా మీద (on terrace), బోటు (boat) — immediate life threat.',
        detectedLanguage: 'te',
        processedAt: mins(48),
        processingMs: 490,
      },
      isDemo: true,
    },
    {
      originalReport: 'Cyclone relief camp at Andhra University Gymnasium hall has 85 displaced coastal residents including 16 infants. Potable drinking water supply interrupted.',
      locationDescription: 'Andhra University Campus Gymnasium Hall, Siripuram, Visakhapatnam',
      reportedCategory: 'Food & Drinking Water',
      category: 'Food & Drinking Water',
      affectedCountRange: '25+',
      aiRecommendedUrgency: 'High',
      effectiveUrgency: 'High',
      triageStatus: 'completed',
      status: 'awaiting_assignment',
      verificationStatus: 'unverified',
      coordinates: { lat: 17.7280, lng: 83.3190, source: 'gps' },
      aiTriage: {
        source: 'fallback',
        model: 'antigravity-vizag-v2.5',
        recommendedUrgency: 'High',
        incidentTitle: 'Relief Shelter Potable Water Shortage — AU Campus',
        summary: 'Evacuation camp with 85 residents and 16 infants suffering from interrupted municipal water supply. High risk of dehydration and hygiene failure.',
        immediateNeeds: ['Safe drinking water (20L cans)', 'Infant formula & ORS kits', 'Water purification tablets'],
        hazards: ['High population density', 'Infant dehydration risk'],
        confidence: 'high',
        reasoning: 'High population density with vulnerable infants and lack of potable water demands High priority intervention.',
        detectedLanguage: 'en',
        processedAt: mins(70),
        processingMs: 330,
      },
      isDemo: true,
    },
    {
      originalReport: 'Cyclone gale winds knocked down two 11kV live electrical cables into flooded street near Jagadamba Junction. Road completely blocked for ambulances heading to KGH Hospital.',
      locationDescription: 'Jagadamba Centre Main Road, Near Old Post Office, Visakhapatnam',
      reportedCategory: 'Roadblock & Fallen Trees',
      category: 'Roadblock & Fallen Trees',
      affectedCountRange: '25+',
      aiRecommendedUrgency: 'High',
      effectiveUrgency: 'High',
      triageStatus: 'completed',
      status: 'submitted',
      verificationStatus: 'unverified',
      coordinates: { lat: 17.7107, lng: 83.3032, source: 'gps' },
      aiTriage: {
        source: 'fallback',
        model: 'antigravity-vizag-v2.5',
        recommendedUrgency: 'High',
        incidentTitle: 'Live 11kV Cables on KGH Hospital Arterial Route',
        summary: 'Snapped live high-voltage power lines submerged in standing rainwater on Jagadamba corridor, severing emergency transport access to King George Hospital (KGH).',
        immediateNeeds: ['APEPDCL Power Isolation Crew', 'GVMC Road Debris Clearance Team'],
        hazards: ['Live 11kV electrical wire in standing water', 'Blocks primary ambulance route to KGH'],
        confidence: 'high',
        reasoning: 'Severe electrocution hazard blocking the primary arterial corridor to KGH tertiary trauma care hospital.',
        detectedLanguage: 'en',
        processedAt: mins(95),
        processingMs: 310,
      },
      isDemo: true,
    },
    {
      originalReport: 'Active maternity labor contractions started. Ambulance stuck in waterlogged street near Gajuwaka Autonagar. Urgent high-clearance 4x4 or rescue transport needed to Victoria / KGH Obstetrics.',
      locationDescription: 'Autonagar Main Road, Gajuwaka Industrial Zone, Visakhapatnam',
      reportedCategory: 'Medical Emergency',
      category: 'Medical Emergency',
      affectedCountRange: '1-3',
      aiRecommendedUrgency: 'Critical',
      effectiveUrgency: 'Critical',
      triageStatus: 'completed',
      status: 'resolved',
      verificationStatus: 'verified',
      coordinates: { lat: 17.6908, lng: 83.2094, source: 'gps' },
      aiTriage: {
        source: 'fallback',
        model: 'antigravity-vizag-v2.5',
        recommendedUrgency: 'Critical',
        incidentTitle: 'Maternity Emergency — Waterlogged Street Access',
        summary: 'Pregnant mother in active labor trapped in waterlogged street. Emergency transit to King George Hospital (KGH) / Victoria Hospital required immediately.',
        immediateNeeds: ['High-clearance 4x4 or SDRF Rescue Vehicle', 'Paramedic escort to KGH Hospital'],
        hazards: ['Flooded access road', 'Time-critical obstetric delivery'],
        confidence: 'high',
        reasoning: 'Active labor with emergency vehicle blockage represents an immediate life-critical obstetric emergency.',
        detectedLanguage: 'en',
        processedAt: mins(140),
        processingMs: 290,
      },
      isDemo: true,
    },
  ];

  const now2 = new Date();
  const incidents = [];
  for (let i = 0; i < incidentData.length; i++) {
    const d = incidentData[i];
    const createdAt = new Date(now2 - (i + 1) * 18 * 60000);
    const inc = new Incident({ ...d, createdAt, updatedAt: createdAt });
    inc.statusHistory = [{ status: d.status || 'submitted', changedByName: 'System Seed (Vizag EOC)', timestamp: createdAt }];
    await inc.save();
    incidents.push(inc);
  }

  return { incidents, volunteers };
}

module.exports = router;
module.exports.seedDemoData = seedDemoData;
