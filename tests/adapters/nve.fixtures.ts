export const SAMPLE_OBSERVATION_RESPONSE = {
  data: [
    {
      stationId: '6.9.0',
      stationName: 'Akerselva, ndf. Maridalsvatn',
      parameter: 1001,
      parameterName: 'Vannføring',
      parameterNameEng: 'Discharge',
      method: 'Mean',
      unit: 'm³/s',
      observations: [
        { value: 1.438465, time: '2026-05-27T11:00:00Z', correction: 0, quality: 1 },
      ],
    },
    {
      stationId: '12.209.0',
      stationName: 'Urula',
      parameter: 1001,
      parameterName: 'Vannføring',
      parameterNameEng: 'Discharge',
      method: 'Mean',
      unit: 'm³/s',
      observations: [
        { value: 25.4171, time: '2026-05-27T11:00:00Z', correction: 0, quality: 1 },
      ],
    },
    {
      stationId: '151.15.0',
      stationName: 'Nervoll',
      parameter: 1001,
      parameterName: 'Vannføring',
      parameterNameEng: 'Discharge',
      method: 'Mean',
      unit: 'm³/s',
      observations: [
        { value: 111.2751, time: '2026-05-27T11:00:00Z', correction: 0, quality: 1 },
      ],
    },
  ],
}

export const EMPTY_OBSERVATION_RESPONSE = {
  data: [],
}

export const EXPECTED_STATION_COUNT = 3

export const SAMPLE_STATION_IDS = ['6.9.0', '12.209.0', '151.15.0']
