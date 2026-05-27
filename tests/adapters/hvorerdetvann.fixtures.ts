export const SAMPLE_API_RESPONSE = {
  sections: [
    {
      section: { id: 22, name: 'Drammenselva', limits: [50, 100, 300, 600, 1000] },
      last_flow: { timestamp: '2026-05-27T06:00:00Z', flow: 22.5, meters: 1.2 },
      zone: 'low',
    },
    {
      section: { id: 45, name: 'Glomma', limits: [200, 500, 1000, 2000, 4000] },
      last_flow: { timestamp: '2026-05-27T06:00:00Z', flow: 800.3, meters: 3.1 },
      zone: 'medium',
    },
    {
      section: { id: 78, name: 'Numedalslågen', limits: [30, 60, 120, 250, 500] },
      last_flow: { timestamp: '2026-05-27T06:00:00Z', flow: 90.1, meters: 1.8 },
      zone: 'high',
    },
  ],
}

export const MALFORMED_RESPONSE = {
  notSections: [],
}

export const ZONE_TO_LEVEL_MAP: Record<string, number> = {
  dry: 1,
  low: 2,
  medium: 3,
  high: 4,
  very_high: 5,
}
