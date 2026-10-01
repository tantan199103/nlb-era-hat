import { products, megaMenuData } from '../data/storeData';

// Initial menu tree follows the Custom POD pattern: short intent-level roots,
// bounded children, and separate mobile/footer locations.
export const defaultMenus = [
  {
    id: 'menu-header',
    name: 'Main Header Navigation',
    location: 'HEADER',
    status: 'PUBLISHED',
    updatedAt: 'Just now',
    items: [
      { id: 'nav-shop', label: 'SHOP', target: '/collections', type: 'COLLECTION', visible: true, children: [
        { id: 'shop-all-hats', label: 'All hats', target: '/collections', type: 'COLLECTION', visible: true, children: [] },
        { id: 'shop-caps', label: 'Caps', target: '/collections?group=Caps', type: 'COLLECTION', visible: true, children: [] },
        { id: 'shop-knit-hats', label: 'Knit hats', target: '/collections?group=Knit Hats', type: 'COLLECTION', visible: true, children: [] },
        { id: 'shop-in-stock', label: 'In stock now', target: '/collections?stock=1', type: 'COLLECTION', visible: true, children: [] }
      ] },
      { id: 'nav-sports', label: 'SPORTS', target: '/collections', type: 'PAGE', visible: true, children: [
        { id: 'sport-mlb', label: 'MLB', target: '/collections?league=MLB', type: 'COLLECTION', visible: true, children: [] },
        { id: 'sport-nba', label: 'NBA', target: '/collections?league=NBA', type: 'COLLECTION', visible: true, children: [] },
        { id: 'sport-nfl', label: 'NFL', target: '/collections?league=NFL', type: 'COLLECTION', visible: true, children: [] },
        { id: 'sport-nhl', label: 'NHL', target: '/collections?league=NHL', type: 'COLLECTION', visible: true, children: [] },
        { id: 'sport-milb', label: 'MiLB', target: '/collections?league=MiLB', type: 'COLLECTION', visible: true, children: [] }
      ] },
      { id: 'nav-teams', label: 'TEAMS', target: '/collections', type: 'PAGE', visible: true, children: [
        { id: 'team-yankees', label: 'New York Yankees', target: '/collections?team=New%20York%20Yankees', type: 'COLLECTION', visible: true, children: [] },
        { id: 'team-dodgers', label: 'Los Angeles Dodgers', target: '/collections?team=Los%20Angeles%20Dodgers', type: 'COLLECTION', visible: true, children: [] },
        { id: 'team-red-sox', label: 'Boston Red Sox', target: '/collections?team=Boston%20Red%20Sox', type: 'COLLECTION', visible: true, children: [] },
        { id: 'team-bulls', label: 'Chicago Bulls', target: '/collections?team=Chicago%20Bulls', type: 'COLLECTION', visible: true, children: [] }
      ] },
      { id: 'nav-collections', label: 'COLLECTIONS', target: '/collections', type: 'COLLECTION', visible: true, children: [] },
      { id: 'nav-new', label: 'NEW & TRENDING', target: '/collections?sort=newest', type: 'COLLECTION', visible: true, children: [] },
      { id: 'nav-calendar', label: 'CALENDAR', target: '/calendar', type: 'PAGE', visible: true, children: [] },
      { id: 'nav-access-pass', label: 'ACCESS PASS', target: '/access-pass', type: 'PAGE', visible: true, children: [] }
    ]
  },
  {
    id: 'menu-footer',
    name: 'Footer Quick Links',
    location: 'FOOTER',
    status: 'PUBLISHED',
    updatedAt: 'Sep 28, 2026',
    items: [
      { id: 'footer-pass', label: 'Access Pass Rewards', target: '/access-pass', type: 'PAGE', visible: true, children: [] },
      { id: 'footer-stores', label: 'Flagship Store Locations', target: '/stores', type: 'PAGE', visible: true, children: [] },
      { id: 'footer-track', label: 'Track Order Shipment', target: '/track-order', type: 'PAGE', visible: true, children: [] },
      { id: 'footer-drops', label: 'All Catalog Drops', target: '/collections', type: 'COLLECTION', visible: true, children: [] }
    ]
  },
  {
    id: 'menu-mobile',
    name: 'Mobile Drawer Menu',
    location: 'MOBILE_DRAWER',
    status: 'PUBLISHED',
    updatedAt: 'Sep 29, 2026',
    items: [
      { id: 'mob-home', label: 'Home', target: '/', type: 'PAGE', visible: true, children: [] },
      { id: 'mob-shop', label: 'Shop hats', target: '/collections', type: 'COLLECTION', visible: true, children: [
        { id: 'mob-shop-caps', label: 'Caps', target: '/collections?group=Caps', type: 'COLLECTION', visible: true, children: [] },
        { id: 'mob-shop-knit', label: 'Knit hats', target: '/collections?group=Knit Hats', type: 'COLLECTION', visible: true, children: [] }
      ] },
      { id: 'mob-sports', label: 'Sports', target: '/collections', type: 'PAGE', visible: true, children: [
        { id: 'mob-mlb', label: 'MLB', target: '/collections?league=MLB', type: 'COLLECTION', visible: true, children: [] },
        { id: 'mob-nba', label: 'NBA', target: '/collections?league=NBA', type: 'COLLECTION', visible: true, children: [] },
        { id: 'mob-nfl', label: 'NFL', target: '/collections?league=NFL', type: 'COLLECTION', visible: true, children: [] },
        { id: 'mob-nhl', label: 'NHL', target: '/collections?league=NHL', type: 'COLLECTION', visible: true, children: [] }
      ] },
      { id: 'mob-collections', label: 'Collections', target: '/collections', type: 'COLLECTION', visible: true, children: [] },
      { id: 'mob-track', label: 'Track Order', target: '/track-order', type: 'PAGE', visible: true, children: [] },
      { id: 'mob-pass', label: 'Access Pass VIP', target: '/access-pass', type: 'PAGE', visible: true, children: [] }
    ]
  }
];

// Initial Collections (Drops & Themes)
export const defaultCollections = [
  {
    id: 'col-fire',
    name: 'MLB Playing with Fire 59FIFTY',
    handle: 'mlb-playing-with-fire-new-era-59fifty',
    status: 'PUBLISHED',
    description: 'Scorched metallic team logos, custom World Series side patches, vibrant fire-accent embroidery.',
    hero: 'https://www.lidshd.com/cdn/shop/files/jxft9s3bfh__bannerDesk__LHD_Playing_with_Fire_Web_banner_2000x878_4fc7ecd9-876d-4424-91d1-5aa6992ad77c.jpg?v=1790565524&width=4000',
    count: 8,
    sort: 'Newest',
    automation: {
      enabled: true,
      includeKeywords: ['playing with fire', 'fire'],
      excludeKeywords: ['damaged']
    }
  },
  {
    id: 'col-blue-heaven',
    name: 'Los Angeles Dodgers Blue Heaven',
    handle: 'dodgers-blue-heaven',
    status: 'PUBLISHED',
    description: 'Special baby blue and royal crown color syncs commemorating historic Chavez Ravine moments.',
    hero: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update-03.jpg?v=1788241236&width=1939',
    count: 6,
    sort: 'Featured first',
    automation: {
      enabled: true,
      includeKeywords: ['blue heaven', 'dodgers'],
      excludeKeywords: []
    }
  },
  {
    id: 'col-milb',
    name: 'Minor League Mondays',
    handle: 'minor-league-mondays',
    status: 'PUBLISHED',
    description: 'Rare farm team mascots, retro logos, and regional MiLB heritage franchises.',
    hero: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update_CTC_136x220_39185879-eeec-4188-8477-1954b9127701.jpg?v=1788241234&width=568',
    count: 7,
    sort: 'Newest',
    automation: {
      enabled: true,
      includeKeywords: ['milb', 'minor league'],
      excludeKeywords: []
    }
  },
  {
    id: 'col-chicago-sole',
    name: 'Chicago Sole Collection',
    handle: 'chicago-sole-collection',
    status: 'PUBLISHED',
    description: 'Bulls and White Sox sneaker-matching colorways with iconic championship side patches.',
    hero: 'https://www.lidshd.com/cdn/shop/files/qvqqbxpnd7__bannerDesk__LHD_Chicago_Sole_Web_banner_2000x878_4fc7ecd9-876d-4424-91d1-5aa6992ad77c.jpg?v=1790566841&width=2000',
    count: 5,
    sort: 'Manual',
    automation: {
      enabled: true,
      includeKeywords: ['chicago', 'bulls', 'white sox'],
      excludeKeywords: []
    }
  },
  {
    id: 'col-pins',
    name: 'Hat Customization Essentials (Pins & Chains)',
    handle: 'hat-pins-accessories',
    status: 'PUBLISHED',
    description: 'Bespoke enamel pins, rhinestone chains, and custom crown accessories.',
    hero: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update-09.jpg?v=1788241323&width=1939',
    count: 4,
    sort: 'Newest',
    automation: {
      enabled: true,
      includeKeywords: ['pin', 'chain'],
      excludeKeywords: []
    }
  }
];

// Initial Orders (Realistic Drop Shipments)
export const defaultOrders = [
  {
    id: 'ord-101',
    orderNumber: 'LHD-789210',
    date: '2026-09-29T14:30:00Z',
    customerName: 'Marcus Vance',
    customerEmail: 'm.vance91@gmail.com',
    shippingAddress: {
      city: 'Brooklyn, NY',
      country: 'United States',
      street: '450 Flatbush Ave'
    },
    paymentStatus: 'PAID',
    fulfillmentStatus: 'SHIPPED',
    carrier: 'UPS Ground Tracked',
    trackingNumber: '1Z9999999999999999',
    trackingUrl: 'https://www.ups.com/track?tracknum=1Z9999999999999999',
    grandTotal: 104.98,
    currency: 'USD',
    items: [
      {
        id: 1,
        title: 'Boston Red Sox MLB Playing with Fire New Era 59FIFTY',
        size: '7 3/8',
        sku: 'LHD-5950-BOS-PWF',
        price: 49.99,
        quantity: 1,
        thumbnail: 'https://www.lidshd.com/cdn/shop/files/23235120_04.png?v=1790339447&width=2048'
      },
      {
        id: 101,
        title: 'Wu-Tang Rhinestone Gold Hat Pin',
        size: 'ONE SIZE',
        sku: 'LHD-PIN-WUTANG-GLD',
        price: 19.99,
        quantity: 1,
        thumbnail: 'https://www.lidshd.com/cdn/shop/files/WU002_2_750x960_crop_center.png?v=1729606132'
      }
    ]
  },
  {
    id: 'ord-102',
    orderNumber: 'LHD-789211',
    date: '2026-09-30T09:15:00Z',
    customerName: 'Derek Reynolds',
    customerEmail: 'derek.reynolds@icloud.com',
    shippingAddress: {
      city: 'Los Angeles, CA',
      country: 'United States',
      street: '742 Evergreen Terrace'
    },
    paymentStatus: 'PAID',
    fulfillmentStatus: 'IN_PROGRESS',
    carrier: 'UPS 2nd Day Air',
    trackingNumber: '1Z8888888888888888',
    trackingUrl: '',
    grandTotal: 99.98,
    currency: 'USD',
    items: [
      {
        id: 2,
        title: 'New York Yankees MLB Playing with Fire New Era 59FIFTY',
        size: '7 1/2',
        sku: 'LHD-5950-NYY-PWF',
        price: 49.99,
        quantity: 2,
        thumbnail: 'https://www.lidshd.com/cdn/shop/files/23235133_04.png?v=1790339447&width=2048'
      }
    ]
  },
  {
    id: 'ord-103',
    orderNumber: 'LHD-789212',
    date: '2026-10-01T08:00:00Z',
    customerName: 'Aaliyah Chen',
    customerEmail: 'aaliyah.c@outlook.com',
    shippingAddress: {
      city: 'Chicago, IL',
      country: 'United States',
      street: '120 N LaSalle St'
    },
    paymentStatus: 'PAID',
    fulfillmentStatus: 'UNFULFILLED',
    carrier: '',
    trackingNumber: '',
    trackingUrl: '',
    grandTotal: 49.99,
    currency: 'USD',
    items: [
      {
        id: 3,
        title: 'Philadelphia Phillies MLB Playing with Fire New Era 59FIFTY',
        size: '7 1/4',
        sku: 'LHD-5950-PHI-PWF',
        price: 49.99,
        quantity: 1,
        thumbnail: 'https://www.lidshd.com/cdn/shop/files/23235136_04.png?v=1790339447&width=2048'
      }
    ]
  }
];

// Initial Access Pass Members
export const defaultMembers = [
  {
    id: 'mem-001',
    name: 'ANTHONY VALDEZ',
    email: 'anthony.v@capvault.com',
    tier: 'Hall of Fame',
    points: 2450,
    preferredSize: '7 1/2',
    joinedDate: '2025-06-12',
    ordersCount: 18,
    earlyAccess: true
  },
  {
    id: 'mem-002',
    name: 'DEREK REYNOLDS',
    email: 'derek.reynolds@icloud.com',
    tier: 'All-Star VIP',
    points: 1200,
    preferredSize: '7 1/4',
    joinedDate: '2026-01-20',
    ordersCount: 8,
    earlyAccess: true
  },
  {
    id: 'mem-003',
    name: 'MARCUS VANCE',
    email: 'm.vance91@gmail.com',
    tier: 'All-Star VIP',
    points: 750,
    preferredSize: '7 3/8',
    joinedDate: '2026-03-05',
    ordersCount: 5,
    earlyAccess: true
  },
  {
    id: 'mem-004',
    name: 'AALIYAH CHEN',
    email: 'aaliyah.c@outlook.com',
    tier: 'Rookie Collector',
    points: 250,
    preferredSize: '7 1/8',
    joinedDate: '2026-09-15',
    ordersCount: 2,
    earlyAccess: false
  }
];

// Initial Store Settings
export const defaultSettings = {
  storeName: 'Lids Hat Drop (Lids HD)',
  tagline: 'Authentic Streetwear Fitted Drops & Custom Collectibles',
  supportEmail: 'support@lidshatdrop.com',
  freeShippingThreshold: 99.0,
  defaultCurrency: 'USD',
  enabledCurrencies: ['USD', 'CAD', 'EUR', 'GBP', 'JPY', 'VND'],
  promoCodes: [
    { code: 'DROP15', discountPercent: 15, active: true },
    { code: 'LIDS15', discountPercent: 15, active: true },
    { code: 'VIP20', discountPercent: 20, active: true }
  ],
  paymentGateways: {
    shopPay: true,
    applePay: true,
    payPal: true,
    googlePay: true,
    creditCard: true
  },
  notifications: {
    smsDrops: true,
    emailDrops: true,
    earlyAccessMins: 15
  }
};
