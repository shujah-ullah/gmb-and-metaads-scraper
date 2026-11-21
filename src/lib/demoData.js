export function createDemoWorkspace() {
  const now = new Date().toISOString();
  const businessSource = {
    id: 'demo-business-source', name: 'Fictional demo businesses', type: 'demo',
    licenseLabel: 'Synthetic example data', rightsNote: 'Invented records for interface demonstration only.',
    importedAt: now, storageAllowed: true, exportAllowed: true, explicitAuthorization: true,
  };
  const adSource = {
    id: 'demo-ad-source', name: 'Fictional demo ads', type: 'demo',
    licenseLabel: 'Synthetic example data', rightsNote: 'Invented ad examples for interface demonstration only.',
    importedAt: now, storageAllowed: true, exportAllowed: true, explicitAuthorization: true,
  };
  const base = (id, source) => ({
    id, sourceId: source.id, sourceName: source.name, sourceType: source.type,
    licenseLabel: source.licenseLabel, rightsNote: source.rightsNote,
    storageAllowed: true, exportAllowed: true, importedAt: now,
  });

  const businesses = [
    {
      ...base('demo-b-1', businessSource), kind: 'business', name: 'Juniper Solar Co.', category: 'Solar installer',
      address: '420 Cedar Lane', city: 'Austin', state: 'TX', country: 'United States',
      website: 'https://juniper-solar.example', email: 'hello@juniper-solar.example', phone: '(512) 555-0142',
      rating: '4.8', reviewCount: '128', profileUrl: 'https://profiles.example/juniper-solar',
      profilePresence: 'Source reports profile', socialLinks: ['https://instagram.example/juniper-solar'], raw: {},
    },
    {
      ...base('demo-b-2', businessSource), kind: 'business', name: 'Cobalt Home Energy', category: 'Solar installer',
      address: '18 East Monroe', city: 'Phoenix', state: 'AZ', country: 'United States',
      website: 'https://cobalt-energy.example', email: '', phone: '(602) 555-0184',
      rating: '4.6', reviewCount: '76', profileUrl: '', profilePresence: 'Not supplied', socialLinks: [], raw: {},
    },
    {
      ...base('demo-b-3', businessSource), kind: 'business', name: 'Morrow Electric & Solar', category: 'Electrical contractor',
      address: '72 River Street', city: 'Denver', state: 'CO', country: 'United States',
      website: '', email: 'team@morrow-solar.example', phone: '(303) 555-0161',
      rating: '4.9', reviewCount: '203', profileUrl: 'https://profiles.example/morrow-electric',
      profilePresence: 'Source reports profile', socialLinks: [], raw: {},
    },
    {
      ...base('demo-b-4', businessSource), kind: 'business', name: 'Blue Mesa Roofing', category: 'Roofing contractor',
      address: '5 Market Street', city: 'Austin', state: 'TX', country: 'United States',
      website: 'https://bluemesa-roofing.example', email: '', phone: '(512) 555-0192',
      rating: '4.5', reviewCount: '54', profileUrl: '', profilePresence: 'Not supplied', socialLinks: [], raw: {},
    },
  ];

  const ads = [
    {
      ...base('demo-a-1', adSource), kind: 'ad', name: 'Juniper Solar Co.', title: 'A clearer path to rooftop solar',
      description: 'Explore a custom estimate for your home. Example creative only; not a real promotion.',
      status: 'Active', country: 'United States', city: 'Austin', startDate: '2026-10-18',
      libraryId: 'DEMO-001', pageId: 'DEMO-PAGE-001', adUrl: 'https://ads.example/library/demo-001',
      website: 'https://juniper-solar.example', platform: 'Facebook, Instagram', raw: {},
    },
    {
      ...base('demo-a-2', adSource), kind: 'ad', name: 'Morrow Electric & Solar', title: 'Get to know solar for your property',
      description: 'Learn what questions to ask before choosing an installer. Fictional demo copy.',
      status: 'Active', country: 'United States', city: 'Denver', startDate: '2026-11-02',
      libraryId: 'DEMO-002', pageId: 'DEMO-PAGE-002', adUrl: 'https://ads.example/library/demo-002',
      website: 'https://morrow-solar.example', platform: 'Facebook', raw: {},
    },
    {
      ...base('demo-a-3', adSource), kind: 'ad', name: 'Cobalt Home Energy', title: 'A neighborhood solar consultation',
      description: 'See a sample project overview and questions for your installer. Fictional demo copy.',
      status: 'Inactive', country: 'United States', city: 'Phoenix', startDate: '2026-09-21',
      libraryId: 'DEMO-003', pageId: 'DEMO-PAGE-003', adUrl: 'https://ads.example/library/demo-003',
      website: 'https://cobalt-energy.example', platform: 'Instagram', raw: {},
    },
  ];

  return {
    version: 1,
    businesses,
    ads,
    sources: [businessSource, adSource],
    matches: [],
    dismissedMatches: [],
    isDemo: true,
  };
}
