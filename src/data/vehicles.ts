export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  grade: string;
  mileage: number;
  transmission: string;
  fuel: string;
  engine: string;
  color: string;
  auctionHouse: string;
  auctionDate: string;
  startingBid: number;
  image: string;
  status: 'available' | 'reserved' | 'sold';
  description: string;
  exteriorGrade: string;
  interiorGrade: string;
  damageCodes: string[];
  chassisCode: string;
}

export const vehicles: Vehicle[] = [
  {
    id: 'JD-2025-0847',
    year: 2022,
    make: 'Toyota',
    model: 'Land Cruiser Prado',
    grade: '4.5',
    mileage: 42000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    engine: '2.7L',
    color: 'Dark Gray',
    auctionHouse: 'USS',
    auctionDate: 'Mar 18, 2025',
    startingBid: 48500,
    image: '/images/vehicle-landcruiser.jpg',
    status: 'available',
    description: 'This 2022 Toyota Land Cruiser Prado features a robust 2.7L petrol engine, full-time 4WD, and an exceptional Grade 4.5 rating. The auction sheet indicates only minor surface scratches on the rear bumper (A1 code), with an otherwise immaculate exterior and interior condition. A highly sought-after model for East African markets.',
    exteriorGrade: '4.5',
    interiorGrade: 'B',
    damageCodes: ['A1'],
    chassisCode: 'GDJ150',
  },
  {
    id: 'JD-2025-0823',
    year: 2021,
    make: 'Toyota',
    model: 'Harrier',
    grade: '5',
    mileage: 28000,
    transmission: 'CVT',
    fuel: 'Hybrid',
    engine: '2.5L',
    color: 'Pearl White',
    auctionHouse: 'TAA',
    auctionDate: 'Mar 20, 2025',
    startingBid: 32200,
    image: '/images/vehicle-harrier.jpg',
    status: 'available',
    description: 'Premium 2021 Toyota Harrier hybrid with exceptional Grade 5 condition. Only 28,000 km with full service history. The hybrid powertrain delivers outstanding fuel economy for urban environments. Interior is virtually flawless with all premium features intact.',
    exteriorGrade: '5',
    interiorGrade: 'A',
    damageCodes: [],
    chassisCode: 'AXUH80',
  },
  {
    id: 'JD-2025-0811',
    year: 2023,
    make: 'Toyota',
    model: 'Aqua',
    grade: '4',
    mileage: 15000,
    transmission: 'CVT',
    fuel: 'Hybrid',
    engine: '1.5L',
    color: 'Silver',
    auctionHouse: 'CAA',
    auctionDate: 'Mar 22, 2025',
    startingBid: 12800,
    image: '/images/vehicle-aqua.jpg',
    status: 'available',
    description: 'Near-new 2023 Toyota Aqua hybrid with only 15,000 km. The Aqua remains one of the most popular Japanese imports for fuel-conscious markets. Grade 4 condition with clean auction sheet and no damage records.',
    exteriorGrade: '4',
    interiorGrade: 'B',
    damageCodes: [],
    chassisCode: 'MXPK10',
  },
  {
    id: 'JD-2025-0798',
    year: 2020,
    make: 'Toyota',
    model: 'Hiace Van',
    grade: '3.5',
    mileage: 65000,
    transmission: 'Automatic',
    fuel: 'Diesel',
    engine: '2.8L',
    color: 'White',
    auctionHouse: 'AUCNET',
    auctionDate: 'Mar 19, 2025',
    startingBid: 24500,
    image: '/images/vehicle-hiace.jpg',
    status: 'available',
    description: 'Reliable 2020 Toyota Hiace van with the durable 2.8L diesel engine. Perfect for commercial fleet use with spacious cargo capacity. Grade 3.5 reflects minor wear consistent with commercial use. Well-maintained with regular service intervals.',
    exteriorGrade: '3.5',
    interiorGrade: 'C',
    damageCodes: ['U1'],
    chassisCode: 'GDH201',
  },
  {
    id: 'JD-2025-0785',
    year: 2022,
    make: 'Toyota',
    model: 'RAV4',
    grade: '4',
    mileage: 35000,
    transmission: 'CVT',
    fuel: 'Hybrid',
    engine: '2.5L',
    color: 'Dark Blue',
    auctionHouse: 'USS',
    auctionDate: 'Mar 21, 2025',
    startingBid: 28900,
    image: '/images/vehicle-rav4.jpg',
    status: 'available',
    description: 'Well-equipped 2022 Toyota RAV4 hybrid with intelligent AWD system. The 2.5L hybrid delivers excellent fuel economy while maintaining the versatility expected of an SUV. Clean Grade 4 condition with modern safety features throughout.',
    exteriorGrade: '4',
    interiorGrade: 'B',
    damageCodes: ['W1'],
    chassisCode: 'AXAH54',
  },
  {
    id: 'JD-2025-0772',
    year: 2023,
    make: 'Toyota',
    model: 'Crown Crossover',
    grade: '5',
    mileage: 12000,
    transmission: 'CVT',
    fuel: 'Hybrid',
    engine: '2.5L',
    color: 'Black',
    auctionHouse: 'USS',
    auctionDate: 'Mar 23, 2025',
    startingBid: 45600,
    image: '/images/vehicle-crown.jpg',
    status: 'available',
    description: 'The flagship 2023 Toyota Crown Crossover represents the pinnacle of Toyota luxury. With its unique elevated sedan profile and hybrid powertrain, this near-new example with only 12,000 km offers an exceptional value proposition. Grade 5 condition is virtually as-new.',
    exteriorGrade: '5',
    interiorGrade: 'A',
    damageCodes: [],
    chassisCode: 'AZSH35',
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
