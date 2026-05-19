export interface Vehicle {
  _id: string;
  sourceUrl: string;
  timestamp: Date;
  supplierName: string;
  stockId: string;
  chassisNumber?: string;
  make: string;
  model: string;
  grade?: string;
  year: number;
  mileage: number;
  transmission: string;
  fuel: string;
  color: string;
  price: number;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  images: string[];
  rawData: any;
}

// Existing static data, will be replaced by fetched data
export const vehicles: Vehicle[] = [
  {
    _id: '60c72b2f9b1e8b001c8e4d1a',
    sourceUrl: 'https://example.com/static-landcruiser',
    timestamp: new Date('2025-03-18T00:00:00.000Z'),
    supplierName: 'Static Data',
    stockId: 'JD-2025-0847',
    year: 2022,
    make: 'Toyota',
    model: 'Land Cruiser Prado',
    grade: '4.5',
    mileage: 42000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    chassisNumber: 'GDJ150',
    color: 'Dark Gray',
    price: 48500,
    location: 'Mombasa',
    status: 'approved',
    images: ['/images/vehicle-landcruiser.jpg'],
    rawData: {},
  },
  {
    _id: '60c72b2f9b1e8b001c8e4d1b',
    sourceUrl: 'https://example.com/static-harrier',
    timestamp: new Date('2025-03-20T00:00:00.000Z'),
    supplierName: 'Static Data',
    stockId: 'JD-2025-0823',
    year: 2021,
    make: 'Toyota',
    model: 'Harrier',
    grade: '5',
    mileage: 28000,
    transmission: 'CVT',
    fuel: 'Hybrid',
    chassisNumber: 'AXUH80',
    color: 'Pearl White',
    price: 32200,
    location: 'Mombasa',
    status: 'approved',
    images: ['/images/vehicle-harrier.jpg'],
    rawData: {},
  },
  {
    _id: '60c72b2f9b1e8b001c8e4d1c',
    sourceUrl: 'https://example.com/static-aqua',
    timestamp: new Date('2025-03-22T00:00:00.000Z'),
    supplierName: 'Static Data',
    stockId: 'JD-2025-0811',
    year: 2023,
    make: 'Toyota',
    model: 'Aqua',
    grade: '4',
    mileage: 15000,
    transmission: 'CVT',
    fuel: 'Hybrid',
    chassisNumber: 'MXPK10',
    color: 'Silver',
    price: 12800,
    location: 'Mombasa',
    status: 'approved',
    images: ['/images/vehicle-aqua.jpg'],
    rawData: {},
  },
  {
    _id: '60c72b2f9b1e8b001c8e4d1d',
    sourceUrl: 'https://example.com/static-hiace',
    timestamp: new Date('2025-03-19T00:00:00.000Z'),
    supplierName: 'Static Data',
    stockId: 'JD-2025-0798',
    year: 2020,
    make: 'Toyota',
    model: 'Hiace Van',
    grade: '3.5',
    mileage: 65000,
    transmission: 'Automatic',
    fuel: 'Diesel',
    chassisNumber: 'GDH201',
    color: 'White',
    price: 24500,
    location: 'Mombasa',
    status: 'approved',
    images: ['/images/vehicle-hiace.jpg'],
    rawData: {},
  },
  {
    _id: '60c72b2f9b1e8b001c8e4d1e',
    sourceUrl: 'https://example.com/static-rav4',
    timestamp: new Date('2025-03-21T00:00:00.000Z'),
    supplierName: 'Static Data',
    stockId: 'JD-2025-0785',
    year: 2022,
    make: 'Toyota',
    model: 'RAV4',
    grade: '4',
    mileage: 35000,
    transmission: 'CVT',
    fuel: 'Hybrid',
    chassisNumber: 'AXAH54',
    color: 'Dark Blue',
    price: 28900,
    location: 'Mombasa',
    status: 'approved',
    images: ['/images/vehicle-rav4.jpg'],
    rawData: {},
  },
  {
    _id: '60c72b2f9b1e8b001c8e4d1f',
    sourceUrl: 'https://example.com/static-crown',
    timestamp: new Date('2025-03-23T00:00:00.000Z'),
    supplierName: 'Static Data',
    stockId: 'JD-2025-0772',
    year: 2023,
    make: 'Toyota',
    model: 'Crown Crossover',
    grade: '5',
    mileage: 12000,
    transmission: 'CVT',
    fuel: 'Hybrid',
    chassisNumber: 'AZSH35',
    color: 'Black',
    price: 45600,
    location: 'Mombasa',
    status: 'approved',
    images: ['/images/vehicle-crown.jpg'],
    rawData: {},
  },
];

export const destinations = [
  { country: 'Kenya', flag: '🇰🇪', port: 'Mombasa', transit: '21–28 days' },
  { country: 'Tanzania', flag: '🇹🇿', port: 'Dar es Salaam', transit: '24–32 days' },
  { country: 'Zambia', flag: '🇿🇲', port: 'Durban (land bridge)', transit: '30–40 days' },
  { country: 'Jamaica', flag: '🇯🇲', port: 'Kingston', transit: '28–35 days' },
  { country: 'Trinidad & Tobago', flag: '🇹🇹', port: 'Port of Spain', transit: '25–30 days' },
  { country: 'Guyana', flag: '🇬🇾', port: 'Georgetown', transit: '30–38 days' },
  { country: 'Sri Lanka', flag: '🇱🇰', port: 'Colombo', transit: '18–24 days' },
  { country: 'Bangladesh', flag: '🇧🇩', port: 'Chittagong', transit: '20–26 days' },
  { country: 'Papua New Guinea', flag: '🇵🇬', port: 'Lae', transit: '22–28 days' },
  { country: 'Fiji', flag: '🇫🇯', port: 'Suva', transit: '25–32 days' },
  { country: 'Malaysia', flag: '🇲🇾', port: 'Port Klang', transit: '14–20 days' },
  { country: 'Philippines', flag: '🇵🇭', port: 'Manila', transit: '16–22 days' },
];

export const marqueeDestinations = [
  'Mombasa', 'Dar es Salaam', 'Durban', 'Kingston', 'Port of Spain',
  'Georgetown', 'Colombo', 'Chittagong', 'Lae', 'Suva', 'Port Klang', 'Manila',
];

export const processSteps = [
  {
    number: '01',
    title: 'Browse & Select',
    description: 'Search 150,000+ vehicles with detailed auction sheets and inspection reports.',
  },
  {
    number: '02',
    title: 'Reserve & Deposit',
    description: 'Place a refundable deposit to secure your chosen vehicle before auction.',
  },
  {
    number: '03',
    title: 'We Bid & Win',
    description: 'Our licensed buyers bid at auction on your behalf using your maximum budget.',
  },
  {
    number: '04',
    title: 'Ship & Track',
    description: 'Vehicle is transported to port, documentation prepared, and vessel booked.',
  },
  {
    number: '05',
    title: 'Receive',
    description: 'Confirm receipt at your destination port or final delivery address.',
  },
];
