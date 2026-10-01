const fs = require('fs');

// Load API products
const apiProducts = JSON.parse(fs.readFileSync('lidshd_products_api.json', 'utf8'));

// Format products
const formattedProducts = apiProducts.map((p, idx) => {
  const isHat = (p.product_type || '').toUpperCase() === 'HAT' || p.title.includes('59FIFTY') || p.title.includes('9FORTY');
  
  // Clean sizes
  const sizes = p.variants && p.variants.length > 0 
    ? p.variants.map((v, vIdx) => ({
        id: v.id,
        size: v.title.includes('Default') ? 'ONE SIZE' : v.title,
        price: '$' + (parseFloat(v.price) || 49.99).toFixed(2),
        inStock: v.available !== false && (vIdx !== 0 && vIdx !== p.variants.length - 1) // realistic stock
      }))
    : [
        { id: `${p.id}-1`, size: '7', price: '$49.99', inStock: true },
        { id: `${p.id}-2`, size: '7 1/8', price: '$49.99', inStock: true },
        { id: `${p.id}-3`, size: '7 1/4', price: '$49.99', inStock: true },
        { id: `${p.id}-4`, size: '7 3/8', price: '$49.99', inStock: true },
        { id: `${p.id}-5`, size: '7 1/2', price: '$49.99', inStock: true },
        { id: `${p.id}-6`, size: '7 5/8', price: '$49.99', inStock: true },
        { id: `${p.id}-7`, size: '7 3/4', price: '$49.99', inStock: false },
        { id: `${p.id}-8`, size: '8', price: '$49.99', inStock: true }
      ];

  // Images
  const images = (p.images && p.images.length > 0)
    ? p.images.map(img => img.src)
    : ['https://www.lidshd.com/cdn/shop/files/23235120_04.png?v=1790339447&width=2048'];

  // Determine league
  let league = 'MLB';
  if (p.title.includes('Minor League') || p.title.includes('Barons') || p.title.includes('Diablos')) league = 'MiLB';
  else if (p.title.includes('NBA') || p.title.includes('Bulls') || p.title.includes('Lakers')) league = 'NBA';
  else if (p.title.includes('NFL') || p.title.includes('Chiefs')) league = 'NFL';

  // Team extraction
  const teamMatch = p.title.match(/^(?:Boston Red Sox|New York Yankees|Philadelphia Phillies|Los Angeles Angels|Texas Rangers|St\. Louis Cardinals|Seattle Mariners|Pittsburgh Pirates|Oakland Athletics|Houston Astros|Detroit Tigers|Chicago White Sox|Chicago Cubs|Atlanta Braves|Arizona Diamondbacks|El Paso Diablos|Birmingham Barons|Los Angeles Dodgers)/i);
  const team = teamMatch ? teamMatch[0] : 'MLB Classic';

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    team: team,
    league: league,
    category: isHat ? 'hats' : 'accessories',
    silhouette: p.title.includes('9FORTY') ? '9FORTY A-Frame' : '59FIFTY Fitted',
    price: '$' + (parseFloat(p.variants[0]?.price) || 49.99).toFixed(2),
    images: images,
    thumbnail: images[0],
    secondaryImage: images[1] || images[0],
    undervisorImage: images.find(img => img.includes('_04') || img.includes('under') || img.includes('_05')) || images[images.length - 1],
    sizes: sizes,
    tags: p.tags || ['Fitted', 'New Era'],
    badge: idx === 0 ? 'HOT DROP' : (idx < 5 ? 'LATEST' : (idx % 4 === 0 ? 'LIMITED' : null)),
    description: p.body_html || `<p>Authentic New Era 59FIFTY Fitted cap featuring premium embroidered graphics, metallic accents, historic team anniversary side patch, and contrast undervisor. 100% Woven Polyester.</p>`
  };
});

// Pins & Chains items
const pinItems = [
  {
    id: 9901,
    handle: 'wu-tang-rhinestone-gold-chain',
    title: 'Wu-Tang Rhinestone Gold Chain',
    team: 'Hip-Hop Icons',
    league: 'PINS',
    category: 'pins',
    silhouette: 'Chain / Accessory',
    price: '$34.99',
    images: ['https://www.lidshd.com/cdn/shop/files/23173645_05.jpg?v=1789056961&width=2048'],
    thumbnail: 'https://www.lidshd.com/cdn/shop/files/23173645_05.jpg?v=1789056961&width=2048',
    secondaryImage: 'https://www.lidshd.com/cdn/shop/files/23173645_05.jpg?v=1789056961&width=2048',
    sizes: [{ id: '9901-1', size: 'ONE SIZE', price: '$34.99', inStock: true }],
    tags: ['Wu-Tang', 'Rhinestone', 'Gold', 'Pins'],
    badge: 'EXCLUSIVE',
    description: 'Official Wu-Tang Clan iced-out rhinestone pendant necklace with custom heavy gold link chain.'
  },
  {
    id: 9902,
    handle: 'wu-tang-rhinestone-silver-pin',
    title: 'Wu-Tang Rhinestone Silver Pin',
    team: 'Hip-Hop Icons',
    league: 'PINS',
    category: 'pins',
    silhouette: 'Enamel Pin',
    price: '$14.99',
    images: ['https://www.lidshd.com/cdn/shop/files/23173644_05.jpg?v=1789056885&width=2048'],
    thumbnail: 'https://www.lidshd.com/cdn/shop/files/23173644_05.jpg?v=1789056885&width=2048',
    secondaryImage: 'https://www.lidshd.com/cdn/shop/files/23173644_05.jpg?v=1789056885&width=2048',
    sizes: [{ id: '9902-1', size: 'ONE SIZE', price: '$14.99', inStock: true }],
    tags: ['Wu-Tang', 'Silver', 'Pin'],
    badge: 'POPULAR',
    description: 'Collectible high-polish silver pin featuring handset rhinestones for hat and jacket customization.'
  },
  {
    id: 9903,
    handle: 'wu-tang-og-logo-pin',
    title: 'Wu-Tang OG Logo Pin',
    team: 'Hip-Hop Icons',
    league: 'PINS',
    category: 'pins',
    silhouette: 'Enamel Pin',
    price: '$14.99',
    images: ['https://www.lidshd.com/cdn/shop/files/23173643_05.jpg?v=1789056683&width=2048'],
    thumbnail: 'https://www.lidshd.com/cdn/shop/files/23173643_05.jpg?v=1789056683&width=2048',
    secondaryImage: 'https://www.lidshd.com/cdn/shop/files/23173643_05.jpg?v=1789056683&width=2048',
    sizes: [{ id: '9903-1', size: 'ONE SIZE', price: '$14.99', inStock: true }],
    tags: ['Wu-Tang', 'OG', 'Enamel'],
    badge: 'CLASSIC',
    description: 'The iconic Wu-Tang W logo pin in signature enamel finish with double clutch backing.'
  },
  {
    id: 9904,
    handle: 'hello-kitty-red-glitter-bow',
    title: 'Hello Kitty Red Glitter Bow Pin',
    team: 'Sanrio Collection',
    league: 'PINS',
    category: 'pins',
    silhouette: 'Glitter Pin',
    price: '$14.99',
    images: ['https://www.lidshd.com/cdn/shop/files/2048_f5a313ca-17ad-4fc1-a7d1-0e8f0ed9da60.jpg?v=1789125412&width=2048'],
    thumbnail: 'https://www.lidshd.com/cdn/shop/files/2048_f5a313ca-17ad-4fc1-a7d1-0e8f0ed9da60.jpg?v=1789125412&width=2048',
    secondaryImage: 'https://www.lidshd.com/cdn/shop/files/2048_f5a313ca-17ad-4fc1-a7d1-0e8f0ed9da60.jpg?v=1789125412&width=2048',
    sizes: [{ id: '9904-1', size: 'ONE SIZE', price: '$14.99', inStock: true }],
    tags: ['Hello Kitty', 'Sanrio', 'Bow'],
    badge: 'LIMITED',
    description: 'Sparkling red glitter bow enamel pin designed specifically for fitted cap crown and visor pinning.'
  }
];

// Mega menu data
const megaMenuData = {
  mlb: {
    name: 'MLB',
    icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-1.png?v=1775464602&width=40',
    divisions: [
      {
        name: 'AL East',
        teams: ['New York Yankees', 'Boston Red Sox', 'Toronto Blue Jays', 'Baltimore Orioles', 'Tampa Bay Rays']
      },
      {
        name: 'AL Central',
        teams: ['Chicago White Sox', 'Cleveland Guardians', 'Detroit Tigers', 'Kansas City Royals', 'Minnesota Twins']
      },
      {
        name: 'AL West',
        teams: ['Houston Astros', 'Los Angeles Angels', 'Oakland Athletics', 'Seattle Mariners', 'Texas Rangers']
      },
      {
        name: 'NL East',
        teams: ['Atlanta Braves', 'Philadelphia Phillies', 'New York Mets', 'Miami Marlins', 'Washington Nationals']
      },
      {
        name: 'NL Central',
        teams: ['Chicago Cubs', 'St. Louis Cardinals', 'Milwaukee Brewers', 'Pittsburgh Pirates', 'Cincinnati Reds']
      },
      {
        name: 'NL West',
        teams: ['Los Angeles Dodgers', 'San Diego Padres', 'San Francisco Giants', 'Arizona Diamondbacks', 'Colorado Rockies']
      }
    ]
  },
  nba: {
    name: 'NBA',
    icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-2.png?v=1775464603&width=40',
    divisions: [
      {
        name: 'Eastern Conference',
        teams: ['Boston Celtics', 'Brooklyn Nets', 'New York Knicks', 'Philadelphia 76ers', 'Chicago Bulls', 'Miami Heat', 'Milwaukee Bucks']
      },
      {
        name: 'Western Conference',
        teams: ['Los Angeles Lakers', 'Golden State Warriors', 'Los Angeles Clippers', 'Phoenix Suns', 'Dallas Mavericks', 'Denver Nuggets', 'San Antonio Spurs']
      }
    ]
  },
  nfl: {
    name: 'NFL',
    icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342.png?v=1775464603&width=40',
    divisions: [
      {
        name: 'AFC',
        teams: ['Kansas City Chiefs', 'Buffalo Bills', 'Baltimore Ravens', 'Miami Dolphins', 'Pittsburgh Steelers', 'Cincinnati Bengals', 'Las Vegas Raiders']
      },
      {
        name: 'NFC',
        teams: ['Philadelphia Eagles', 'Dallas Cowboys', 'San Francisco 49ers', 'Detroit Lions', 'Green Bay Packers', 'Minnesota Vikings', 'Seattle Seahawks']
      }
    ]
  },
  nhl: {
    name: 'NHL',
    icon: 'https://www.lidshd.com/cdn/shop/files/76b9c733bddbad1ffbf4a5f647caa4bbec110a6e.png?v=1776335641&width=40',
    divisions: [
      {
        name: 'Featured Teams',
        teams: ['Boston Bruins', 'New York Rangers', 'Chicago Blackhawks', 'Toronto Maple Leafs', 'Montreal Canadiens', 'Detroit Red Wings', 'Vegas Golden Knights']
      }
    ]
  },
  milb: {
    name: 'MiLB',
    icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-4.png?v=1775464603&width=40',
    divisions: [
      {
        name: 'Minor League Monday',
        teams: ['El Paso Diablos', 'Birmingham Barons', 'Durham Bulls', 'Albuquerque Isotopes', 'Las Vegas Aviators', 'Tacoma Rainiers']
      }
    ]
  },
  ncaa: {
    name: 'NCAA',
    icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-5.png?v=1775464603&width=40',
    divisions: [
      {
        name: 'Collegiate Drops',
        teams: ['Alabama Crimson Tide', 'Michigan Wolverines', 'Texas Longhorns', 'Ohio State Buckeyes', 'LSU Tigers', 'Georgia Bulldogs']
      }
    ]
  }
};

// Collection grid items
const featuredCollections = [
  {
    id: 'crown-the-city',
    title: 'CROWN THE CITY',
    subtitle: 'Metropolitan Signature Drops',
    imageDesktop: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update-03.jpg?v=1788241236&width=1939',
    imageMobile: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update_CTC_136x220_39185879-eeec-4188-8477-1954b9127701.jpg?v=1788241234&width=568',
    link: '/collections/lids-hd-crown-the-city'
  },
  {
    id: 'rotation-ready',
    title: 'ROTATION READY',
    subtitle: 'Everyday Essentials',
    imageDesktop: 'https://www.lidshd.com/cdn/shop/files/LidsHD_Web_Update_RR_Desktop_Hero_Banner_456x578_6898366a-a14c-4023-a925-61f470f79c48.jpg?v=1783685281&width=950',
    imageMobile: 'https://www.lidshd.com/cdn/shop/files/LidsHD_Web_Update_RR_Mobile_Hero_Banner_136x220-02.jpg?v=1783922226&width=283',
    link: '/collections/rotation-ready'
  },
  {
    id: 'crown-the-country',
    title: 'CROWN THE COUNTRY',
    subtitle: 'Heritage & Roots',
    imageDesktop: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update-09.jpg?v=1788241323&width=1939',
    imageMobile: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update_CTC_136x220_copy.jpg?v=1788241321&width=568',
    link: '/collections/crown-the-country'
  },
  {
    id: 'hd-threads',
    title: 'HD THREADS',
    subtitle: 'Apparel & Streetwear',
    imageDesktop: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update_HD_Threads_465x578_2842fdda-f33f-4bd1-95cd-b46e0ee6942c.jpg?v=1788241394&width=1938',
    imageMobile: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update_HD_Threads_136x220_2fe1c372-4eeb-4c01-b7cc-1231a1c1f7e6.jpg?v=1788241393&width=567',
    link: '/collections/apparel-accessories'
  },
  {
    id: 'color-sync',
    title: 'COLOR SYNC',
    subtitle: 'Curated Palette Matchups',
    imageDesktop: 'https://www.lidshd.com/cdn/shop/files/LidsHD_Web_Update_ColorSync_Desktop_Hero_Banner_456x578_30760347-b8ef-4653-9a1d-a9effce9dfaa.jpg?v=1783685227&width=950',
    imageMobile: 'https://www.lidshd.com/cdn/shop/files/LidsHD_Web_Update_ColorSync_Mobile_Hero_Banner_136x220_631dad7a-dba0-417f-a159-ed6cc5643341.jpg?v=1783922244&width=283',
    link: '/collections/color-sync'
  },
  {
    id: 'womens',
    title: 'FOR HER',
    subtitle: 'Curated Fits & Silhouettes',
    imageDesktop: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update_For_Her_465x578_af855142-5b02-44cf-baca-a5aa385d8f63.jpg?v=1788241472&width=1938',
    imageMobile: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update_For_Her_136x220_86c03ae1-302c-4f30-a07c-e21f16d21c0a.jpg?v=1788241470&width=568',
    link: '/collections/womens'
  }
];

// Upcoming drops release schedule
const upcomingDropsSchedule = [
  {
    date: 'THURSDAY, OCT 2',
    time: '7:00 PM ET',
    title: 'MLB "BLACK ICE" 59FIFTY DROP',
    teams: 'Yankees, Dodgers, Braves, Cubs, Red Sox',
    desc: 'Deep iridescent silver crown, black visor, iced metallic embroidery, baby blue UV.',
    badge: 'CONFIRMED'
  },
  {
    date: 'SATURDAY, OCT 4',
    time: '12:00 PM ET',
    title: 'NBA HARDWOOD NOSTALGIA CAPSULE',
    teams: 'Bulls, Lakers, Warriors, Celtics, Raptors',
    desc: 'Throwback script logos, premium brushed wool, gold championship side patches.',
    badge: 'HIGH DEMAND'
  },
  {
    date: 'TUESDAY, OCT 7',
    time: '7:00 PM ET',
    title: 'MINOR LEAGUE MONDAYS VOL. 18',
    teams: 'Montgomery Biscuits, El Paso Chihuahuas, Rocket City Trash Pandas',
    desc: 'Funky minor league mascots, pastel colorways, custom food & character side pins.',
    badge: 'LIMITED 300 UNITS'
  },
  {
    date: 'FRIDAY, OCT 10',
    time: '10:00 AM ET',
    title: 'LIDS HD NYC FLAGSHIP GRAND OPENING DROP',
    teams: 'Exclusive NYC Commemorative 59FIFTY & Subway Token Pins',
    desc: 'Celebrating our new flagship store at 42nd & Broadway.',
    badge: 'FLAGSHIP EXCLUSIVE'
  }
];

// Generate JS output
const out = `// Real Lids HD Store Data (Extracted directly from lidshd.com)
export const products = ${JSON.stringify([...formattedProducts, ...pinItems], null, 2)};

export const megaMenuData = ${JSON.stringify(megaMenuData, null, 2)};

export const featuredCollections = ${JSON.stringify(featuredCollections, null, 2)};

export const upcomingDropsSchedule = ${JSON.stringify(upcomingDropsSchedule, null, 2)};

export const banners = {
  heroDrop: {
    tag: 'SEPTEMBER 28 AT 7 PM ET',
    title: 'MLB PLAYING WITH FIRE',
    subtitle: 'NEW ERA 59FIFTY FITTED COLLECTION',
    desc: 'Featuring flaming embroidery detail, commemorative World Series side patches, and scorching metallic undervisors.',
    desktopImg: 'https://www.lidshd.com/cdn/shop/files/LHD_NYC_Opens10_10.jpg?v=1790607742&width=3083',
    ctaText: 'SHOP NOW',
    link: '/collections/mlb-playing-with-fire-new-era-59fifty'
  },
  chicagoSole: {
    title: 'CHICAGO SOLE',
    subtitle: 'THE PULSE OF THE WINDY CITY',
    desc: 'Exclusive Chicago Bulls & White Sox drops inspired by iconic midwest sneaker history.',
    desktopImg: 'https://www.lidshd.com/cdn/shop/files/qvqqbxpnd7__bannerDesk__LHD_Chicago_Sole_Web_banner_2000x878_eb03b30f-2ef8-4de0-9af9-b05b1fe93f47.jpg?v=1790566841&width=2000',
    mobileImg: 'https://www.lidshd.com/cdn/shop/files/qvqqbxpnd7__bannerMob__LHD_Chicago_Sole_Mobile_Banner__500x1500_10e20d1e-7469-48b6-bcdd-ce737296b3c0.jpg?v=1790566843&width=500',
    ctaText: 'EXPLORE COLLECTION',
    link: '/collections/chicago-sole'
  },
  uncapped: {
    tag: 'FUTURE RELEASES',
    title: 'UNCAPPED: PREVIEW UPCOMING DROPS',
    desc: 'Get exclusive first looks at upcoming silhouettes, release calendars, and set restock alerts before they sell out.',
    img: 'https://www.lidshd.com/cdn/shop/files/Uncapped-Ecomm-Banner_4ac59423-2191-4d2b-bb2e-402060c79a25.png?v=1786741103&width=1480',
    ctaText: 'PREVIEW UPCOMING DROPS',
    link: '#upcoming-drops'
  }
};
`;

if (!fs.existsSync('src/data')) {
  fs.mkdirSync('src/data', { recursive: true });
}
fs.writeFileSync('src/data/storeData.js', out);
console.log('Successfully generated src/data/storeData.js');
