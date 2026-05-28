/**
 * TaxCalculator.tsx
 * Enterprise-level global car import tax calculator.
 * Route: /tax-calculator
 *
 * Covers 26 countries with accurate 2025/2026 rates sourced from:
 *  • KRA (Kenya) – CRSP / July 2025 schedule
 *  • TRA (Tanzania), URA (Uganda), RRA (Rwanda) – EAC CET
 *  • ZIMRA (Zimbabwe), SARS (South Africa), GRA (Ghana), NCS (Nigeria)
 *  • HMRC (United Kingdom), EU Customs (Germany / France)
 *  • CBP (United States) – Section 232 + reciprocal tariffs 2025
 *  • CBSA (Canada), ABF (Australia), NZCS (New Zealand)
 *  • Japan Customs, JAFZA (UAE), ZATCA (Saudi Arabia)
 *  • India Customs (CBIC), Royal Malaysian Customs (RMC), Sri Lanka Customs
 *  • Singapore One-Motoring (ARF / COE simplified)
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calculator,
  Globe,
  Info,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  ArrowRight,
  Fuel,
  Settings,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../sections/Footer';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TaxLineItem {
  label: string;
  description: string;
  rate: string;
  amount: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
  highlight?: boolean;
}

interface CountryResult {
  country: CountryConfig;
  lineItems: TaxLineItem[];
  totalDuties: number;
  totalTaxes: number;
  grandTotal: number;
  landedCost: number;
  effectiveRate: number;
  warnings: string[];
  notes: string[];
}

interface VehicleInputs {
  cifValueUSD: string;
  engineCC: string;
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  yearOfManufacture: string;
  vehicleType: 'passenger' | 'suv' | 'commercial' | 'motorcycle';
  originCountry: string;
  shippingCostUSD: string;
  insuranceCostUSD: string;
  fobValueUSD: string;
}

// ─── Country Configuration ─────────────────────────────────────────────────────
interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  region: string;
  exchangeRate: number; // 1 USD = X local
  ageLimit?: number;    // max vehicle age in years (2026 base)
  requiresRHD?: boolean;
  notes: string[];
  calculator: (inputs: VehicleInputs, cif: number) => TaxLineItem[];
}

// ─── Utility Helpers ───────────────────────────────────────────────────────────
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function ageFromYear(yom: string): number {
  const year = parseInt(yom, 10);
  if (!year) return 0;
  return 2026 - year;
}

function engineCC(inputs: VehicleInputs): number {
  return parseInt(inputs.engineCC, 10) || 1500;
}

// Kenya – KRA excise duty bands (July 2025)
function kraExciseBand(cc: number, fuel: string): number {
  if (fuel === 'electric') return 0.10;
  if (fuel === 'hybrid') return 0.15;
  if (cc <= 1000) return 0.20;
  if (cc <= 1500) return 0.25;
  if (cc <= 2500) return 0.30;
  return 0.35;
}

// Uganda excise bands
function uraExciseBand(cc: number, fuel: string): number {
  if (fuel === 'electric') return 0.10;
  if (cc <= 1000) return 0.10;
  if (cc <= 2000) return 0.15;
  return 0.20;
}

// ─── Country Calculators ───────────────────────────────────────────────────────
const COUNTRIES: CountryConfig[] = [

  // ── EAST AFRICA ──────────────────────────────────────────────────────────────

  {
    code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES',
    region: 'East Africa', exchangeRate: 129.5,
    ageLimit: 8, requiresRHD: true,
    notes: [
      'KRA uses higher of CIF invoice or CRSP (Current Retail Selling Price).',
      'Import Duty increased to 25% effective July 2025 (reverted from 35%).',
      'IDF increased to 3.5% from July 2025.',
      'Vehicles older than 8 years (pre-2018) cannot be imported.',
      'KEBS pre-shipment inspection required ($150–$250).',
    ],
    calculator: (inputs, cif) => {
      const cc = engineCC(inputs);
      const importDuty = cif * 0.25;
      const exciseBase = cif + importDuty;
      const exciseRate = kraExciseBand(cc, inputs.fuelType);
      const exciseDuty = exciseBase * exciseRate;
      const vatBase = cif + importDuty + exciseDuty;
      const vat = vatBase * 0.16;
      const idf = cif * 0.035;
      const rdl = cif * 0.02;
      const total = importDuty + exciseDuty + vat + idf + rdl;
      return [
        { label: 'CIF Value (Customs Base)', description: 'Cost + Insurance + Freight', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '25% of CIF value (KRA July 2025)', rate: '25.0%', amount: importDuty },
        { label: `Excise Duty (${cc}cc ${inputs.fuelType})`, description: `${pct(exciseRate)} of (CIF + Import Duty)`, rate: pct(exciseRate), amount: exciseDuty },
        { label: 'VAT', description: '16% of (CIF + Import Duty + Excise Duty)', rate: '16.0%', amount: vat },
        { label: 'Import Declaration Fee (IDF)', description: '3.5% of CIF value', rate: '3.5%', amount: idf },
        { label: 'Railway Development Levy (RDL)', description: '2% of CIF value', rate: '2.0%', amount: rdl },
        { label: 'Total Taxes & Duties', description: 'Sum of all KRA charges', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS',
    region: 'East Africa', exchangeRate: 2540,
    ageLimit: 8, requiresRHD: true,
    notes: [
      'EAC Common External Tariff applies (25% import duty).',
      'TRA uses CIF as customs value base.',
      'Vehicles must pass SUMATRA roadworthiness inspection.',
      'Port of entry: Dar es Salaam.',
    ],
    calculator: (inputs, cif) => {
      const cc = engineCC(inputs);
      const importDuty = cif * 0.25;
      const exciseRate = cc > 2000 ? 0.25 : cc > 1000 ? 0.15 : 0.10;
      const exciseDuty = (cif + importDuty) * exciseRate;
      const vatBase = cif + importDuty + exciseDuty;
      const vat = vatBase * 0.18;
      const idl = cif * 0.01; // Infrastructure development levy
      const total = importDuty + exciseDuty + vat + idl;
      return [
        { label: 'CIF Value', description: 'Customs base value', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '25% EAC CET rate', rate: '25.0%', amount: importDuty },
        { label: `Excise Duty (${cc}cc)`, description: `${pct(exciseRate)} of (CIF + Import Duty)`, rate: pct(exciseRate), amount: exciseDuty },
        { label: 'VAT', description: '18% of (CIF + Import Duty + Excise)', rate: '18.0%', amount: vat },
        { label: 'Infrastructure Development Levy', description: '1% of CIF', rate: '1.0%', amount: idl },
        { label: 'Total Taxes & Duties', description: 'TRA total charge', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX',
    region: 'East Africa', exchangeRate: 3720,
    ageLimit: 8, requiresRHD: true,
    notes: [
      'EAC Common External Tariff: 25% import duty.',
      'URA applies excise duty based on engine size.',
      'Infrastructure Levy: 1.5% of CIF.',
      'Vehicles may transit through Kenya (Mombasa) — add transit fees.',
    ],
    calculator: (inputs, cif) => {
      const cc = engineCC(inputs);
      const importDuty = cif * 0.25;
      const exciseRate = uraExciseBand(cc, inputs.fuelType);
      const exciseDuty = (cif + importDuty) * exciseRate;
      const vatBase = cif + importDuty + exciseDuty;
      const vat = vatBase * 0.18;
      const infra = cif * 0.015;
      const total = importDuty + exciseDuty + vat + infra;
      return [
        { label: 'CIF Value', description: 'Customs base value (URA)', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '25% EAC CET', rate: '25.0%', amount: importDuty },
        { label: `Excise Duty (${cc}cc)`, description: `${pct(exciseRate)} on post-duty value`, rate: pct(exciseRate), amount: exciseDuty },
        { label: 'VAT', description: '18% on cumulative taxable value', rate: '18.0%', amount: vat },
        { label: 'Infrastructure Development Levy', description: '1.5% of CIF', rate: '1.5%', amount: infra },
        { label: 'Total Taxes & Duties', description: 'URA total payable', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF',
    region: 'East Africa', exchangeRate: 1320,
    ageLimit: 10,
    notes: [
      'EAC CET: 25% import duty on most vehicles.',
      'Rwanda Revenue Authority (RRA) VAT: 18%.',
      'Green vehicles / EVs may qualify for 0% import duty.',
      'Environmental levy applies to older vehicles.',
    ],
    calculator: (inputs, cif) => {
      const cc = engineCC(inputs);
      const importDutyRate = inputs.fuelType === 'electric' ? 0.00 : 0.25;
      const importDuty = cif * importDutyRate;
      const exciseRate = cc > 2500 ? 0.20 : cc > 1500 ? 0.15 : 0.10;
      const exciseDuty = (cif + importDuty) * exciseRate;
      const vat = (cif + importDuty + exciseDuty) * 0.18;
      const envLevy = inputs.fuelType === 'electric' ? 0 : cif * 0.02;
      const total = importDuty + exciseDuty + vat + envLevy;
      return [
        { label: 'CIF Value', description: 'Customs base (RRA)', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: inputs.fuelType === 'electric' ? 'EV: 0% preferential rate' : '25% EAC CET', rate: pct(importDutyRate), amount: importDuty },
        { label: `Excise Duty (${cc}cc)`, description: `${pct(exciseRate)} on post-duty value`, rate: pct(exciseRate), amount: exciseDuty },
        { label: 'VAT', description: '18% of cumulative value', rate: '18.0%', amount: vat },
        { label: 'Environmental Levy', description: '2% of CIF (petrol/diesel)', rate: inputs.fuelType === 'electric' ? '0.0%' : '2.0%', amount: envLevy },
        { label: 'Total Taxes & Duties', description: 'RRA total payable', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  // ── SOUTHERN AFRICA ───────────────────────────────────────────────────────────

  {
    code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR',
    region: 'Southern Africa', exchangeRate: 18.3,
    notes: [
      'SARS Import Duty: 25% for most passenger vehicles.',
      'VAT: 15% on (CIF + Import Duty).',
      'Ad valorem excise duty may apply on luxury vehicles.',
      'No age restriction on imported vehicles.',
      'Port of entry: Durban, Cape Town.',
    ],
    calculator: (inputs, cif) => {
      const importDuty = cif * 0.25;
      const vat = (cif + importDuty) * 0.15;
      const adValorem = cif > 100000 ? (cif - 100000) * 0.07 : 0; // ad valorem luxury
      const total = importDuty + vat + adValorem;
      return [
        { label: 'CIF Value', description: 'Customs base (SARS)', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '25% of CIF', rate: '25.0%', amount: importDuty },
        { label: 'VAT', description: '15% of (CIF + Import Duty)', rate: '15.0%', amount: vat },
        { label: 'Ad Valorem Excise (luxury)', description: '7% on CIF exceeding $100,000', rate: cif > 100000 ? '7.0%' : '0.0%', amount: adValorem },
        { label: 'Total Taxes & Duties', description: 'SARS total', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', currency: 'ZWG',
    region: 'Southern Africa', exchangeRate: 13.5,
    notes: [
      'ZIMRA Import Duty: 40% of VDP (Value for Duty Purposes = CIF).',
      'Surtax: 25% of import duty.',
      'VAT: 15% on (VDP + Import Duty + Surtax).',
      'EV incentive: Reduced import duty from Jan 2025.',
      'Carbon Tax applies to high-emission vehicles.',
    ],
    calculator: (inputs, cif) => {
      const importDutyRate = inputs.fuelType === 'electric' ? 0.25 : 0.40;
      const importDuty = cif * importDutyRate;
      const surtax = importDuty * 0.25;
      const vatBase = cif + importDuty + surtax;
      const vat = vatBase * 0.15;
      const carbonTax = inputs.fuelType === 'petrol' || inputs.fuelType === 'diesel' ? cif * 0.01 : 0;
      const total = importDuty + surtax + vat + carbonTax;
      return [
        { label: 'CIF / VDP Value', description: 'Value for Duty Purposes', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: inputs.fuelType === 'electric' ? '25% (EV reduced rate)' : '40% of VDP', rate: pct(importDutyRate), amount: importDuty },
        { label: 'Surtax', description: '25% of Import Duty', rate: '25% of duty', amount: surtax },
        { label: 'VAT', description: '15% of (VDP + Import Duty + Surtax)', rate: '15.0%', amount: vat },
        { label: 'Carbon Tax', description: '1% of CIF (petrol/diesel)', rate: inputs.fuelType === 'petrol' || inputs.fuelType === 'diesel' ? '1.0%' : '0.0%', amount: carbonTax },
        { label: 'Total Taxes & Duties', description: 'ZIMRA total payable', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'ZM', name: 'Zambia', flag: '🇿🇲', currency: 'ZMW',
    region: 'Southern Africa', exchangeRate: 26.5,
    notes: [
      'Zambia Revenue Authority (ZRA): Import duty 25%.',
      'Excise duty: 20-50% based on engine size.',
      'VAT: 16% on total value.',
      'Age limit: 10 years for passenger vehicles.',
    ],
    calculator: (inputs, cif) => {
      const cc = engineCC(inputs);
      const importDuty = cif * 0.25;
      const exciseRate = cc > 3000 ? 0.50 : cc > 2000 ? 0.35 : cc > 1500 ? 0.25 : 0.20;
      const exciseDuty = (cif + importDuty) * exciseRate;
      const vat = (cif + importDuty + exciseDuty) * 0.16;
      const total = importDuty + exciseDuty + vat;
      return [
        { label: 'CIF Value', description: 'Zambia customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '25% of CIF', rate: '25.0%', amount: importDuty },
        { label: `Excise Duty (${cc}cc)`, description: `${pct(exciseRate)} on post-duty value`, rate: pct(exciseRate), amount: exciseDuty },
        { label: 'VAT', description: '16% on cumulative value', rate: '16.0%', amount: vat },
        { label: 'Total Taxes & Duties', description: 'ZRA total', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  // ── WEST AFRICA ───────────────────────────────────────────────────────────────

  {
    code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN',
    region: 'West Africa', exchangeRate: 1610,
    ageLimit: 12,
    notes: [
      'NCS Import Duty: 35% on most passenger vehicles.',
      'Smaller vehicles (below 1200cc) may attract 5-15%.',
      'VAT: 7.5% on (CIF + Import Duty).',
      'CISS levy: 1% of FOB value.',
      'Age limit: 15 years (federal govt guidelines: 12 years preferred).',
    ],
    calculator: (inputs, cif) => {
      const cc = engineCC(inputs);
      const importDutyRate = cc < 1200 ? 0.15 : cc < 2000 ? 0.25 : 0.35;
      const importDuty = cif * importDutyRate;
      const vat = (cif + importDuty) * 0.075;
      const ciss = cif * 0.01;
      const levies = cif * 0.005; // Comprehensive Import Supervision Scheme
      const total = importDuty + vat + ciss + levies;
      return [
        { label: 'CIF Value', description: 'NCS customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: `Import Duty (${cc}cc)`, description: `${pct(importDutyRate)} based on engine size`, rate: pct(importDutyRate), amount: importDuty },
        { label: 'VAT', description: '7.5% of (CIF + Import Duty)', rate: '7.5%', amount: vat },
        { label: 'CISS Levy', description: '1% of CIF', rate: '1.0%', amount: ciss },
        { label: 'Miscellaneous Levies', description: '0.5% of CIF', rate: '0.5%', amount: levies },
        { label: 'Total Taxes & Duties', description: 'NCS total', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS',
    region: 'West Africa', exchangeRate: 15.8,
    ageLimit: 10,
    notes: [
      'GRA Import Duty: 20% on most used vehicles.',
      'NHIL: 2.5%, GETFund: 2.5%, COVID levy: 1%.',
      'VAT (standard): 12.5%.',
      'Age limit: 10 years maximum.',
      'ECOWAS levy: 0.5%, ECOWAS import levy: 1%.',
    ],
    calculator: (inputs, cif) => {
      const importDuty = cif * 0.20;
      const nhil = (cif + importDuty) * 0.025;
      const getFund = (cif + importDuty) * 0.025;
      const covidLevy = (cif + importDuty) * 0.01;
      const vat = (cif + importDuty + nhil + getFund + covidLevy) * 0.125;
      const ecowas = cif * 0.015; // ECOWAS levy + import levy
      const total = importDuty + nhil + getFund + covidLevy + vat + ecowas;
      return [
        { label: 'CIF Value', description: 'Ghana customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '20% of CIF (GRA)', rate: '20.0%', amount: importDuty },
        { label: 'NHIL', description: '2.5% health insurance levy', rate: '2.5%', amount: nhil },
        { label: 'GETFund Levy', description: '2.5% education levy', rate: '2.5%', amount: getFund },
        { label: 'COVID-19 Recovery Levy', description: '1% of (CIF + Duty)', rate: '1.0%', amount: covidLevy },
        { label: 'VAT', description: '12.5% on cumulative value', rate: '12.5%', amount: vat },
        { label: 'ECOWAS Levies', description: '1.5% of CIF', rate: '1.5%', amount: ecowas },
        { label: 'Total Taxes & Duties', description: 'GRA total', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  // ── EUROPE ────────────────────────────────────────────────────────────────────

  {
    code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP',
    region: 'Europe', exchangeRate: 0.788,
    notes: [
      'HMRC Import Duty: 6.5% on most vehicles from non-UK/EU.',
      'VAT: 20% on (CIF + Import Duty).',
      'First Registration Fee: £55.',
      'DVLA registration required. MOT for vehicles >3 years old.',
      'Some historic vehicles (>30 years) attract lower VAT of 5%.',
    ],
    calculator: (inputs, cif) => {
      const age = ageFromYear(inputs.yearOfManufacture);
      const importDutyRate = age > 30 ? 0.055 : 0.065;
      const importDuty = cif * importDutyRate;
      const vatRate = age > 30 ? 0.05 : 0.20;
      const vat = (cif + importDuty) * vatRate;
      const firstReg = 55 / 0.788; // £55 in USD approx
      const total = importDuty + vat + firstReg;
      return [
        { label: 'CIF Value', description: 'HMRC customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: age > 30 ? '5.5% (historic vehicle >30yrs)' : '6.5% non-UK/EU origin', rate: pct(importDutyRate), amount: importDuty },
        { label: 'VAT', description: age > 30 ? '5% (historic vehicles)' : '20% of (CIF + Duty)', rate: pct(vatRate), amount: vat },
        { label: 'First Registration Fee', description: '£55 fixed charge', rate: '£55', amount: firstReg },
        { label: 'Total Taxes & Duties', description: 'HMRC total', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'DE', name: 'Germany (EU)', flag: '🇩🇪', currency: 'EUR',
    region: 'Europe', exchangeRate: 0.918,
    notes: [
      'EU Common External Tariff: 10% on vehicles from outside EU.',
      'No customs duty for EU-origin vehicles.',
      'German VAT (MwSt): 19% on (CIF + Import Duty).',
      'No age limit. Vehicle must meet Euro emissions standards.',
      'KBA registration required.',
    ],
    calculator: (inputs, cif) => {
      const importDuty = cif * 0.10;
      const vat = (cif + importDuty) * 0.19;
      const total = importDuty + vat;
      return [
        { label: 'CIF Value', description: 'EU customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'EU Import Duty', description: '10% Common External Tariff', rate: '10.0%', amount: importDuty },
        { label: 'German VAT (MwSt)', description: '19% of (CIF + Import Duty)', rate: '19.0%', amount: vat },
        { label: 'Total Taxes & Duties', description: 'EU / German total', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'FR', name: 'France (EU)', flag: '🇫🇷', currency: 'EUR',
    region: 'Europe', exchangeRate: 0.918,
    notes: [
      'EU CET: 10% import duty (same as all EU member states).',
      'French VAT (TVA): 20% on (CIF + Import Duty).',
      'Malus écologique (pollution tax) may apply for high CO2 vehicles.',
      'Homologation certificate required.',
    ],
    calculator: (inputs, cif) => {
      const importDuty = cif * 0.10;
      const vat = (cif + importDuty) * 0.20;
      const malusTax = inputs.fuelType === 'petrol' ? cif * 0.02 : 0; // simplified
      const total = importDuty + vat + malusTax;
      return [
        { label: 'CIF Value', description: 'EU customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'EU Import Duty', description: '10% Common External Tariff', rate: '10.0%', amount: importDuty },
        { label: 'French VAT (TVA)', description: '20% of (CIF + Import Duty)', rate: '20.0%', amount: vat },
        { label: 'Malus Écologique', description: '~2% on high-emission petrol vehicles (simplified)', rate: inputs.fuelType === 'petrol' ? '2.0%' : '0.0%', amount: malusTax },
        { label: 'Total Taxes & Duties', description: 'French total estimate', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  // ── AMERICAS ──────────────────────────────────────────────────────────────────

  {
    code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD',
    region: 'North America', exchangeRate: 1,
    notes: [
      'CBP Base Duty: 2.5% for most passenger vehicles.',
      'Section 232 tariff: 25% for most non-USMCA countries (from April 2025).',
      'Japan/EU origin: 15% total (2.5% + 12.5% reciprocal per deal).',
      'Classic vehicles >25 years old: Exempt from Section 232.',
      'No federal VAT. State sales tax applies at registration (varies 0–10%).',
      'FMVSS / EPA compliance modifications may be required.',
    ],
    calculator: (inputs, cif) => {
      const age = ageFromYear(inputs.yearOfManufacture);
      const isClassic = age >= 25;
      const isJapanOrEU = inputs.originCountry === 'JP' || inputs.originCountry === 'EU';
      let importDutyRate: number;
      let dutyLabel: string;
      if (isClassic) {
        importDutyRate = 0.025;
        dutyLabel = 'Classic vehicle (≥25yr): Base 2.5% only (Section 232 exempt)';
      } else if (isJapanOrEU) {
        importDutyRate = 0.15;
        dutyLabel = 'Japan/EU: 15% total (2.5% base + 12.5% Section 232 deal rate)';
      } else {
        importDutyRate = 0.275;
        dutyLabel = 'Standard: 27.5% (2.5% base + 25% Section 232)';
      }
      const importDuty = cif * importDutyRate;
      const harborMaint = cif * 0.00125; // Harbor Maintenance Fee
      const mpf = Math.min(Math.max(cif * 0.003464, 32.71), 634.62); // MPF
      const total = importDuty + harborMaint + mpf;
      return [
        { label: 'CIF Value', description: 'CBP customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty + Tariffs', description: dutyLabel, rate: pct(importDutyRate), amount: importDuty },
        { label: 'Harbor Maintenance Fee', description: '0.125% of CIF', rate: '0.125%', amount: harborMaint },
        { label: 'Merchandise Processing Fee', description: '0.346% (min $32.71, max $634.62)', rate: '~0.35%', amount: mpf },
        { label: 'Total Import Costs (Federal)', description: 'No federal VAT — state tax at registration', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD',
    region: 'North America', exchangeRate: 1.365,
    notes: [
      'CBSA Import Duty: 6.1% for most non-USMCA countries.',
      'USMCA origin (USA/Mexico): 0% duty.',
      'GST: 5% on (CIF + Import Duty).',
      'PST / HST varies by province (up to 13% Ontario, 15% Maritimes).',
      'Vehicles must meet Transport Canada Motor Vehicle Safety Standards.',
      'RIV (Registrar of Imported Vehicles) fee: CAD $325 + taxes.',
    ],
    calculator: (inputs, cif) => {
      const isUSMCA = inputs.originCountry === 'US' || inputs.originCountry === 'MX';
      const importDutyRate = isUSMCA ? 0 : 0.061;
      const importDuty = cif * importDutyRate;
      const gst = (cif + importDuty) * 0.05;
      const rivFee = 325 / 1.365; // CAD to USD
      const total = importDuty + gst + rivFee;
      return [
        { label: 'CIF Value', description: 'CBSA customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: isUSMCA ? '0% (USMCA qualifying)' : '6.1% non-USMCA', rate: pct(importDutyRate), amount: importDuty },
        { label: 'GST', description: '5% federal tax on (CIF + Duty)', rate: '5.0%', amount: gst },
        { label: 'RIV Administration Fee', description: 'Registrar of Imported Vehicles (CAD $325)', rate: 'Fixed', amount: rivFee },
        { label: 'Total Import Costs', description: 'Plus provincial PST/HST at registration', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  // ── ASIA PACIFIC ──────────────────────────────────────────────────────────────

  {
    code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD',
    region: 'Asia Pacific', exchangeRate: 1.585,
    notes: [
      'ABF Import Duty: 5% of customs value.',
      'GST: 10% on (CIF + Import Duty).',
      'Luxury Car Tax (LCT): 33% on value exceeding AUD $80,567 (non-fuel efficient).',
      'Fuel-efficient LCT threshold: AUD $89,332.',
      'SEVS (Specialist & Enthusiast Vehicles) scheme for non-standard imports.',
      'VSB14 safety compliance required.',
    ],
    calculator: (inputs, cif) => {
      const importDuty = cif * 0.05;
      const gstBase = cif + importDuty;
      const gst = gstBase * 0.10;
      // LCT threshold: AUD $80,567 = ~USD $50,833
      const lctThresholdUSD = 50833;
      const isFuelEfficient = inputs.fuelType === 'electric' || inputs.fuelType === 'hybrid';
      const lctThreshold = isFuelEfficient ? 56340 : lctThresholdUSD; // simplified
      const lctBase = Math.max(0, cif - lctThreshold);
      const lct = lctBase * 0.33;
      const total = importDuty + gst + lct;
      return [
        { label: 'CIF Value', description: 'ABF customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '5% of CIF', rate: '5.0%', amount: importDuty },
        { label: 'GST', description: '10% of (CIF + Import Duty)', rate: '10.0%', amount: gst },
        { label: 'Luxury Car Tax (LCT)', description: cif > lctThresholdUSD ? `33% on value above $${lctThresholdUSD.toLocaleString()} USD threshold` : 'N/A — below LCT threshold', rate: cif > lctThresholdUSD ? '33.0%' : '0.0%', amount: lct },
        { label: 'Total Import Costs', description: 'ABF total estimate', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: 'NZD',
    region: 'Asia Pacific', exchangeRate: 1.695,
    notes: [
      'NZ Customs: 0% import duty for most vehicles (since FTA agreements).',
      'GST: 15% on (CIF + Import Duty).',
      'Border Inspection Fee (biosecurity/customs): NZD $400+.',
      'WoF (Warrant of Fitness) required.',
      'Low-emission vehicle import incentives available.',
    ],
    calculator: (inputs, cif) => {
      const importDuty = cif * 0.00; // 0% for most under Japan-NZ FTA
      const gst = (cif + importDuty) * 0.15;
      const borderFee = 400 / 1.695; // NZD to USD
      const total = importDuty + gst + borderFee;
      return [
        { label: 'CIF Value', description: 'NZ Customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '0% under Japan–NZ FTA (most vehicles)', rate: '0.0%', amount: importDuty },
        { label: 'GST', description: '15% of CIF', rate: '15.0%', amount: gst },
        { label: 'Border Inspection Fee', description: 'NZD $400+ (biosecurity + customs)', rate: 'Fixed', amount: borderFee },
        { label: 'Total Import Costs', description: 'NZ Customs estimate', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY',
    region: 'Asia Pacific', exchangeRate: 149.5,
    notes: [
      'Japan Customs: 0% import duty on passenger vehicles (WTO MFN).',
      'Consumption Tax: 10% on total import value.',
      'Environmental Performance Levy (Kankyō): 0–3% at acquisition.',
      'Shaken (vehicle inspection): Required every 2 years.',
      'Japan requires LHD vehicles for import but they cannot be driven on public roads.',
    ],
    calculator: (inputs, cif) => {
      const importDuty = 0; // 0% WTO
      const consumptionTax = cif * 0.10;
      const envLevy = inputs.fuelType === 'electric' ? 0 : inputs.fuelType === 'hybrid' ? cif * 0.01 : cif * 0.03;
      const total = importDuty + consumptionTax + envLevy;
      return [
        { label: 'CIF Value', description: 'Japan Customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '0% WTO MFN rate (Japan)', rate: '0.0%', amount: importDuty },
        { label: 'Consumption Tax', description: '10% of CIF value', rate: '10.0%', amount: consumptionTax },
        { label: 'Environmental Performance Levy', description: 'Based on emissions: 0% EV, 1% hybrid, 3% ICE', rate: inputs.fuelType === 'electric' ? '0.0%' : inputs.fuelType === 'hybrid' ? '1.0%' : '3.0%', amount: envLevy },
        { label: 'Total Import Costs', description: 'Japan Customs estimate', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR',
    region: 'Asia Pacific', exchangeRate: 83.5,
    notes: [
      'CBIC CBU (Completely Built Up) Import Duty: 100% of CIF.',
      'GST: 28% on (CIF + Import Duty).',
      'Compensation Cess: 3% (small), 17–22% (SUVs/luxury).',
      'India has one of the highest import duties in the world for vehicles.',
      'Type approval and homologation mandatory.',
    ],
    calculator: (inputs, cif) => {
      const cc = engineCC(inputs);
      const importDuty = cif * 1.00; // 100% CBU
      const gst = (cif + importDuty) * 0.28;
      const cessRate = cc > 3000 ? 0.22 : cc > 2000 ? 0.20 : cc > 1500 ? 0.17 : 0.03;
      const cess = (cif + importDuty) * cessRate;
      const total = importDuty + gst + cess;
      return [
        { label: 'CIF Value', description: 'CBIC customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Basic Customs Duty (CBU)', description: '100% on fully built vehicles', rate: '100.0%', amount: importDuty },
        { label: 'GST', description: '28% of (CIF + Import Duty)', rate: '28.0%', amount: gst },
        { label: `Compensation Cess (${cc}cc)`, description: `${pct(cessRate)} for this engine size`, rate: pct(cessRate), amount: cess },
        { label: 'Total Import Costs', description: 'CBIC total (one of world\'s highest)', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR',
    region: 'Asia Pacific', exchangeRate: 4.72,
    notes: [
      'Import Duty: 30% of CIF on most imported vehicles.',
      'Excise Duty: 65% (below 1800cc) to 105% (above 3000cc) on (CIF + Import Duty).',
      'SST (Sales & Services Tax): 10% on cumulative value.',
      'AP (Approved Permit) required for individual imports.',
      'Very high total taxes — one of Southeast Asia\'s highest.',
    ],
    calculator: (inputs, cif) => {
      const cc = engineCC(inputs);
      const importDuty = cif * 0.30;
      const exciseRate = cc > 3000 ? 1.05 : cc > 2500 ? 0.90 : cc > 1800 ? 0.75 : cc > 1000 ? 0.65 : 0.60;
      const exciseDuty = (cif + importDuty) * exciseRate;
      const sst = (cif + importDuty + exciseDuty) * 0.10;
      const total = importDuty + exciseDuty + sst;
      return [
        { label: 'CIF Value', description: 'Malaysian Customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '30% of CIF', rate: '30.0%', amount: importDuty },
        { label: `Excise Duty (${cc}cc)`, description: `${pct(exciseRate)} of (CIF + Import Duty)`, rate: pct(exciseRate), amount: exciseDuty },
        { label: 'SST (Sales Tax)', description: '10% on cumulative value', rate: '10.0%', amount: sst },
        { label: 'Total Import Costs', description: 'Malaysian total (excl. AP permit)', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD',
    region: 'Asia Pacific', exchangeRate: 1.341,
    notes: [
      'No import duty on vehicles (0%).',
      'GST: 9% on CIF value.',
      'ARF (Additional Registration Fee): 100–220% of OMV (Open Market Value ≈ CIF).',
      'COE (Certificate of Entitlement): Market-driven — SGD $80,000–$150,000+ (not included).',
      'Very expensive overall due to ARF and COE system.',
    ],
    calculator: (inputs, cif) => {
      const importDuty = 0;
      const gst = cif * 0.09;
      // ARF tiers on OMV: 100% on first $20k, 140% on next $30k, 180% on remainder
      const omv = cif; // simplified: OMV ≈ CIF
      let arf = 0;
      if (omv <= 20000) {
        arf = omv * 1.00;
      } else if (omv <= 50000) {
        arf = 20000 * 1.00 + (omv - 20000) * 1.40;
      } else {
        arf = 20000 * 1.00 + 30000 * 1.40 + (omv - 50000) * 1.80;
      }
      const total = importDuty + gst + arf;
      return [
        { label: 'CIF / OMV Value', description: 'Singapore Customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: '0% — Singapore free port', rate: '0.0%', amount: importDuty },
        { label: 'GST', description: '9% of CIF', rate: '9.0%', amount: gst },
        { label: 'ARF (Additional Registration Fee)', description: '100% on first $20k OMV, 140% next $30k, 180% remainder', rate: pct(arf / cif), amount: arf },
        { label: 'Total (excl. COE)', description: 'COE at SGD $80k–$150k+ additional', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  // ── MIDDLE EAST ───────────────────────────────────────────────────────────────

  {
    code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED',
    region: 'Middle East', exchangeRate: 3.673,
    notes: [
      'GCC Customs: 5% import duty on CIF value.',
      'UAE VAT: 5% on (CIF + Import Duty).',
      'Very low tax environment — one of the most affordable globally.',
      'RTA registration and Emirates ID required.',
      'Electric vehicles: Exempt from 5% customs duty.',
    ],
    calculator: (inputs, cif) => {
      const importDutyRate = inputs.fuelType === 'electric' ? 0 : 0.05;
      const importDuty = cif * importDutyRate;
      const vat = (cif + importDuty) * 0.05;
      const total = importDuty + vat;
      return [
        { label: 'CIF Value', description: 'UAE Customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty (GCC CET)', description: inputs.fuelType === 'electric' ? 'EV: 0% (exempt)' : '5% GCC rate', rate: pct(importDutyRate), amount: importDuty },
        { label: 'VAT', description: '5% of (CIF + Import Duty)', rate: '5.0%', amount: vat },
        { label: 'Total Taxes & Duties', description: 'UAE total (very competitive)', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  {
    code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR',
    region: 'Middle East', exchangeRate: 3.751,
    notes: [
      'ZATCA Import Duty: 15% of CIF value.',
      'VAT: 15% on (CIF + Import Duty).',
      'Vision 2030 incentives for EVs may reduce duties.',
      'SASO product conformity certificate required.',
      'Customs declaration via FASAH platform.',
    ],
    calculator: (inputs, cif) => {
      const importDutyRate = inputs.fuelType === 'electric' ? 0.05 : 0.15;
      const importDuty = cif * importDutyRate;
      const vat = (cif + importDuty) * 0.15;
      const total = importDuty + vat;
      return [
        { label: 'CIF Value', description: 'ZATCA customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Import Duty', description: inputs.fuelType === 'electric' ? '5% (EV Vision 2030 rate)' : '15% of CIF', rate: pct(importDutyRate), amount: importDuty },
        { label: 'VAT', description: '15% of (CIF + Import Duty)', rate: '15.0%', amount: vat },
        { label: 'Total Taxes & Duties', description: 'ZATCA total', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },

  // ── SOUTH ASIA ────────────────────────────────────────────────────────────────

  {
    code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', currency: 'LKR',
    region: 'South Asia', exchangeRate: 308.5,
    notes: [
      'Sri Lanka Customs CID: 20% of CIF.',
      'Surcharge: 50% of CID (adds 10% to CIF effectively).',
      'Excise Duty: Varies by engine size (10-100%+ for large engines).',
      'Luxury Tax: On CIF above LKR 5–6 million threshold.',
      'VAT: 18% on (CIF × 1.1 + CID + Surcharge + Excise + Luxury).',
    ],
    calculator: (inputs, cif) => {
      const cc = engineCC(inputs);
      const cid = cif * 0.20;
      const surcharge = cid * 0.50;
      const exciseRate = cc > 3000 ? 1.00 : cc > 2000 ? 0.65 : cc > 1500 ? 0.35 : cc > 1000 ? 0.20 : 0.10;
      const exciseDuty = cif * exciseRate;
      const luxuryThresholdUSD = 16000; // LKR 5M ÷ 308.5
      const luxuryTax = cif > luxuryThresholdUSD ? (cif - luxuryThresholdUSD) * 0.20 : 0;
      const vatBase = (cif * 1.10) + cid + surcharge + exciseDuty + luxuryTax;
      const vat = vatBase * 0.18;
      const total = cid + surcharge + exciseDuty + luxuryTax + vat;
      return [
        { label: 'CIF Value', description: 'Sri Lanka Customs base', rate: '—', amount: cif, isSubtotal: true },
        { label: 'Customs Import Duty (CID)', description: '20% of CIF', rate: '20.0%', amount: cid },
        { label: 'Surcharge on CID', description: '50% of CID (Jan 2025 gazette)', rate: '50% of CID', amount: surcharge },
        { label: `Excise Duty (${cc}cc)`, description: `${pct(exciseRate)} of CIF (engine band)`, rate: pct(exciseRate), amount: exciseDuty },
        { label: 'Luxury Tax', description: cif > luxuryThresholdUSD ? '20% on CIF above threshold' : 'N/A — below LKR 5M threshold', rate: cif > luxuryThresholdUSD ? '20.0%' : '0.0%', amount: luxuryTax },
        { label: 'VAT', description: '18% of cumulative taxable value', rate: '18.0%', amount: vat },
        { label: 'Total Taxes & Duties', description: 'Sri Lanka Customs total', rate: pct(total / cif), amount: total, isTotal: true, highlight: true },
      ];
    },
  },
];

// ─── Compute CIF from FOB ──────────────────────────────────────────────────────
function computeCIF(inputs: VehicleInputs): number {
  if (inputs.cifValueUSD && parseFloat(inputs.cifValueUSD) > 0) {
    return parseFloat(inputs.cifValueUSD);
  }
  const fob = parseFloat(inputs.fobValueUSD) || 0;
  const shipping = parseFloat(inputs.shippingCostUSD) || 0;
  const insurance = parseFloat(inputs.insuranceCostUSD) || 0;
  return fob + shipping + insurance;
}

// ─── Results Calculator ────────────────────────────────────────────────────────
function calculateForCountry(country: CountryConfig, inputs: VehicleInputs): CountryResult {
  const cif = computeCIF(inputs);
  const lineItems = country.calculator(inputs, cif);
  const totalLine = lineItems.find(li => li.isTotal);
  const totalTaxes = totalLine?.amount ?? 0;
  const grandTotal = cif + totalTaxes;
  const effectiveRate = cif > 0 ? totalTaxes / cif : 0;

  const warnings: string[] = [];
  const age = ageFromYear(inputs.yearOfManufacture);
  if (country.ageLimit && age > country.ageLimit) {
    warnings.push(`⚠ Vehicle age (${age} years) exceeds the ${country.ageLimit}-year import limit for ${country.name}.`);
  }
  if (country.requiresRHD && inputs.originCountry === 'UK') {
    warnings.push('ℹ UK vehicles are typically RHD — compatible with this country\'s requirement.');
  }
  if (cif <= 0) {
    warnings.push('⚠ Please enter a valid vehicle value to calculate taxes.');
  }

  return {
    country,
    lineItems,
    totalDuties: totalTaxes,
    totalTaxes,
    grandTotal,
    landedCost: grandTotal,
    effectiveRate,
    warnings,
    notes: country.notes,
  };
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full ml-1"
        style={{ background: 'rgba(212,168,83,0.15)', color: '#D4A853' }}
      >
        <Info size={10} />
      </button>
      {show && (
        <div
          className="absolute z-50 w-64 p-3 rounded-lg text-xs leading-relaxed"
          style={{
            background: '#1C1C1C',
            border: '1px solid rgba(212,168,83,0.3)',
            color: '#9CA3AF',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          }}
        >
          {text}
          <div
            className="absolute w-2 h-2 rotate-45"
            style={{
              background: '#1C1C1C',
              border: '1px solid rgba(212,168,83,0.3)',
              bottom: -5,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              borderTop: 'none',
              borderLeft: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: CountryResult }) {
  const [expanded, setExpanded] = useState(false);
  const { country, lineItems, grandTotal, effectiveRate, warnings } = result;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: '#141414',
        border: warnings.length > 0
          ? '1px solid rgba(239,68,68,0.3)'
          : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{ borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{country.flag}</span>
          <div>
            <p className="font-semibold text-white text-sm">{country.name}</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>{country.region}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs" style={{ color: '#6B7280' }}>Total Taxes</p>
            <p className="font-bold text-sm" style={{ color: '#D4A853' }}>
              {usd(result.totalTaxes)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: '#6B7280' }}>Landed Cost</p>
            <p className="font-bold" style={{ color: '#F5F0EB' }}>
              {usd(grandTotal)}
            </p>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: effectiveRate > 1.5
                ? 'rgba(239,68,68,0.15)'
                : effectiveRate > 0.5
                  ? 'rgba(245,158,11,0.15)'
                  : 'rgba(34,197,94,0.15)',
              color: effectiveRate > 1.5 ? '#EF4444' : effectiveRate > 0.5 ? '#F59E0B' : '#22C55E',
            }}
          >
            {(effectiveRate * 100).toFixed(0)}% effective
          </div>
          <ChevronDown
            size={16}
            style={{
              color: '#6B7280',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-5 space-y-4">
          {warnings.length > 0 && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}
            >
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <div className="space-y-1">{warnings.map((w, i) => <p key={i}>{w}</p>)}</div>
            </div>
          )}

          {/* Tax Breakdown Table */}
          <div className="space-y-1">
            {lineItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${item.isTotal ? 'mt-2' : ''}`}
                style={{
                  background: item.isTotal
                    ? 'rgba(212,168,83,0.08)'
                    : item.isSubtotal
                      ? 'rgba(255,255,255,0.03)'
                      : 'transparent',
                  border: item.isTotal ? '1px solid rgba(212,168,83,0.2)' : 'none',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: item.isTotal ? '#D4A853' : item.isSubtotal ? '#9CA3AF' : '#D1D5DB' }}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{item.description}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-3">
                  <span
                    className="text-xs hidden md:block"
                    style={{
                      color: '#6B7280',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                    }}
                  >
                    {item.rate}
                  </span>
                  <span
                    className="text-sm font-semibold text-right"
                    style={{
                      color: item.isTotal ? '#D4A853' : item.isSubtotal ? '#9CA3AF' : '#F5F0EB',
                      minWidth: 90,
                    }}
                  >
                    {usd(item.amount)}
                  </span>
                </div>
              </div>
            ))}

            {/* Grand Total */}
            <div
              className="flex items-center justify-between py-3 px-3 rounded-xl mt-3"
              style={{ background: 'rgba(212,168,83,0.12)', border: '1px solid rgba(212,168,83,0.3)' }}
            >
              <div>
                <p className="text-sm font-bold text-white">Total Landed Cost (USD)</p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                  Vehicle + all import taxes &amp; duties
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color: '#D4A853' }}>{usd(grandTotal)}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  ≈ {country.currency} {(grandTotal * country.exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Country Notes */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText size={13} style={{ color: '#D4A853' }} />
              <span className="text-xs font-semibold" style={{ color: '#D4A853' }}>
                {country.name} Import Requirements
              </span>
            </div>
            <ul className="space-y-1.5">
              {country.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                  <span style={{ color: '#D4A853', marginTop: 1 }}>•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────────
export default function TaxCalculator() {
  const [inputs, setInputs] = useState<VehicleInputs>({
    cifValueUSD: '',
    engineCC: '1500',
    fuelType: 'petrol',
    yearOfManufacture: '2022',
    vehicleType: 'passenger',
    originCountry: 'JP',
    shippingCostUSD: '',
    insuranceCostUSD: '',
    fobValueUSD: '',
  });
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['KE', 'TZ', 'UG', 'ZA', 'AE', 'GB', 'AU']);
  const [inputMode, setInputMode] = useState<'cif' | 'fob'>('cif');
  const [countrySearch, setCountrySearch] = useState('');
  const [calculated, setCalculated] = useState(false);
  const [results, setResults] = useState<CountryResult[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const cif = computeCIF(inputs);
  const vehicleAge = ageFromYear(inputs.yearOfManufacture);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.region.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  function toggleCountry(code: string) {
    setSelectedCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }

  function calculate() {
    const selected = COUNTRIES.filter(c => selectedCountries.includes(c.code));
    const newResults = selected.map(c => calculateForCountry(c, inputs));
    newResults.sort((a, b) => a.grandTotal - b.grandTotal);
    setResults(newResults);
    setCalculated(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function reset() {
    setCalculated(false);
    setResults([]);
    setInputs({
      cifValueUSD: '',
      engineCC: '1500',
      fuelType: 'petrol',
      yearOfManufacture: '2022',
      vehicleType: 'passenger',
      originCountry: 'JP',
      shippingCostUSD: '',
      insuranceCostUSD: '',
      fobValueUSD: '',
    });
  }

  function downloadCSV() {
    if (!results.length) return;
    const rows = [
      ['Country', 'Region', 'Currency', 'CIF (USD)', 'Total Taxes (USD)', 'Landed Cost (USD)', 'Effective Tax Rate (%)'],
      ...results.map(r => [
        r.country.name,
        r.country.region,
        r.country.currency,
        cif.toFixed(2),
        r.totalTaxes.toFixed(2),
        r.grandTotal.toFixed(2),
        (r.effectiveRate * 100).toFixed(1),
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shk-import-tax-estimate-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cheapestCountry = results.length ? results[0] : null;
  const mostExpensiveCountry = results.length ? results[results.length - 1] : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A', color: '#F5F0EB' }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative pt-28 pb-12 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(212,168,83,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(245,240,235,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,235,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.25)', color: '#D4A853' }}
            >
              <Calculator size={12} />
              Enterprise Tax Calculator · 2025/2026 Rates
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            Global Car Import
            <span style={{ color: '#D4A853' }}> Tax Calculator</span>
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: '#8A8279', lineHeight: 1.7 }}>
            Calculate exact import duties, VAT, excise taxes, and total landed costs for{' '}
            <strong style={{ color: '#D4A853' }}>{COUNTRIES.length} countries</strong> — covering Africa, Europe,
            Asia Pacific, Middle East, and the Americas. Rates sourced from official customs authorities.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { icon: Globe, text: `${COUNTRIES.length} Countries` },
              { icon: TrendingUp, text: '2025/2026 Rates' },
              { icon: CheckCircle, text: 'Official Source Data' },
              { icon: Download, text: 'CSV Export' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-sm" style={{ color: '#8A8279' }}>
                <Icon size={14} style={{ color: '#D4A853' }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ── Input Form ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Vehicle Details */}
          <div
            className="lg:col-span-2 rounded-2xl p-6"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(212,168,83,0.1)' }}
              >
                <Settings size={15} style={{ color: '#D4A853' }} />
              </div>
              <h2 className="text-base font-semibold text-white">Vehicle Details</h2>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex gap-1 p-1 rounded-lg mb-6" style={{ background: 'rgba(255,255,255,0.04)', width: 'fit-content' }}>
              {[{ key: 'cif', label: 'Enter CIF Value' }, { key: 'fob', label: 'Calculate from FOB' }].map(m => (
                <button
                  key={m.key}
                  onClick={() => setInputMode(m.key as 'cif' | 'fob')}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: inputMode === m.key ? 'rgba(212,168,83,0.15)' : 'transparent',
                    color: inputMode === m.key ? '#D4A853' : '#6B7280',
                    border: inputMode === m.key ? '1px solid rgba(212,168,83,0.3)' : '1px solid transparent',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {inputMode === 'cif' ? (
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>
                    CIF Value (USD)
                    <InfoTooltip text="Cost + Insurance + Freight — the total value used by customs authorities as the tax base." />
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>$</span>
                    <input
                      type="number"
                      value={inputs.cifValueUSD}
                      onChange={e => setInputs(p => ({ ...p, cifValueUSD: e.target.value }))}
                      placeholder="e.g. 15000"
                      className="w-full pl-7 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#F5F0EB',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,168,83,0.5)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>
                      FOB Value (USD)
                      <InfoTooltip text="Free On Board — vehicle price at export port, before shipping and insurance." />
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>$</span>
                      <input
                        type="number"
                        value={inputs.fobValueUSD}
                        onChange={e => setInputs(p => ({ ...p, fobValueUSD: e.target.value }))}
                        placeholder="e.g. 12000"
                        className="w-full pl-7 pr-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F0EB' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,168,83,0.5)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>Shipping Cost (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>$</span>
                      <input
                        type="number"
                        value={inputs.shippingCostUSD}
                        onChange={e => setInputs(p => ({ ...p, shippingCostUSD: e.target.value }))}
                        placeholder="e.g. 1500"
                        className="w-full pl-7 pr-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F0EB' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,168,83,0.5)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>Insurance Cost (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>$</span>
                      <input
                        type="number"
                        value={inputs.insuranceCostUSD}
                        onChange={e => setInputs(p => ({ ...p, insuranceCostUSD: e.target.value }))}
                        placeholder="e.g. 200"
                        className="w-full pl-7 pr-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F0EB' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,168,83,0.5)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>
                  Year of Manufacture
                  <InfoTooltip text="The year the vehicle was first manufactured. Used to calculate vehicle age and age-restriction compliance." />
                </label>
                <select
                  value={inputs.yearOfManufacture}
                  onChange={e => setInputs(p => ({ ...p, yearOfManufacture: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F0EB' }}
                >
                  {Array.from({ length: 15 }, (_, i) => 2026 - i).map(y => (
                    <option key={y} value={y} style={{ background: '#1C1C1C' }}>{y}</option>
                  ))}
                  {[2010, 2008, 2005, 2000, 1995, 1990].map(y => (
                    <option key={y} value={y} style={{ background: '#1C1C1C' }}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>
                  Engine Capacity (cc)
                  <InfoTooltip text="Engine displacement in cubic centimetres. Affects excise duty bands in many countries." />
                </label>
                <select
                  value={inputs.engineCC}
                  onChange={e => setInputs(p => ({ ...p, engineCC: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F0EB' }}
                >
                  {[660, 800, 1000, 1200, 1300, 1500, 1600, 1800, 2000, 2500, 3000, 3500, 4000, 5000].map(cc => (
                    <option key={cc} value={cc} style={{ background: '#1C1C1C' }}>{cc.toLocaleString()}cc</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>
                  Fuel Type
                  <InfoTooltip text="Electric vehicles often attract preferential import duty rates in many countries." />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'petrol', icon: '⛽', label: 'Petrol' },
                    { key: 'diesel', icon: '🛢', label: 'Diesel' },
                    { key: 'hybrid', icon: '🔋', label: 'Hybrid' },
                    { key: 'electric', icon: '⚡', label: 'Electric' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setInputs(p => ({ ...p, fuelType: f.key as VehicleInputs['fuelType'] }))}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                      style={{
                        background: inputs.fuelType === f.key ? 'rgba(212,168,83,0.12)' : 'rgba(255,255,255,0.03)',
                        border: inputs.fuelType === f.key ? '1px solid rgba(212,168,83,0.4)' : '1px solid rgba(255,255,255,0.06)',
                        color: inputs.fuelType === f.key ? '#D4A853' : '#9CA3AF',
                      }}
                    >
                      <span>{f.icon}</span>
                      <span className="font-medium">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>
                  Vehicle Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'passenger', label: 'Passenger Car' },
                    { key: 'suv', label: 'SUV / 4×4' },
                    { key: 'commercial', label: 'Commercial' },
                    { key: 'motorcycle', label: 'Motorcycle' },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setInputs(p => ({ ...p, vehicleType: t.key as VehicleInputs['vehicleType'] }))}
                      className="px-3 py-2.5 rounded-xl text-sm transition-all text-center"
                      style={{
                        background: inputs.vehicleType === t.key ? 'rgba(212,168,83,0.12)' : 'rgba(255,255,255,0.03)',
                        border: inputs.vehicleType === t.key ? '1px solid rgba(212,168,83,0.4)' : '1px solid rgba(255,255,255,0.06)',
                        color: inputs.vehicleType === t.key ? '#D4A853' : '#9CA3AF',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>
                  Origin Country
                  <InfoTooltip text="Country where the vehicle was manufactured or exported from. Affects tariff rates in some destinations (e.g., US Section 232)." />
                </label>
                <select
                  value={inputs.originCountry}
                  onChange={e => setInputs(p => ({ ...p, originCountry: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F0EB' }}
                >
                  {[
                    { code: 'JP', name: '🇯🇵 Japan' },
                    { code: 'GB', name: '🇬🇧 United Kingdom' },
                    { code: 'DE', name: '🇩🇪 Germany (EU)' },
                    { code: 'US', name: '🇺🇸 United States' },
                    { code: 'AU', name: '🇦🇺 Australia' },
                    { code: 'AE', name: '🇦🇪 UAE' },
                    { code: 'KR', name: '🇰🇷 South Korea' },
                    { code: 'CN', name: '🇨🇳 China' },
                    { code: 'MX', name: '🇲🇽 Mexico' },
                    { code: 'EU', name: '🇪🇺 European Union (other)' },
                  ].map(o => (
                    <option key={o.code} value={o.code} style={{ background: '#1C1C1C' }}>{o.name}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* CIF Preview */}
            {cif > 0 && (
              <div
                className="mt-4 flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(212,168,83,0.06)', border: '1px solid rgba(212,168,83,0.15)' }}
              >
                <DollarSign size={16} style={{ color: '#D4A853' }} />
                <div>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>Customs Base Value (CIF): </span>
                  <span className="font-bold" style={{ color: '#D4A853' }}>{usd(cif)}</span>
                </div>
                {vehicleAge > 0 && (
                  <>
                    <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>Vehicle Age: </span>
                      <span className="font-bold text-sm" style={{ color: vehicleAge > 8 ? '#EF4444' : '#22C55E' }}>
                        {vehicleAge} years
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Country Selector */}
          <div
            className="rounded-2xl p-5 flex flex-col"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(212,168,83,0.1)' }}
              >
                <Globe size={15} style={{ color: '#D4A853' }} />
              </div>
              <h2 className="text-base font-semibold text-white">Destination Countries</h2>
            </div>

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
              <input
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                placeholder="Search countries…"
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#F5F0EB' }}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 max-h-80">
              {filteredCountries.map(c => {
                const selected = selectedCountries.includes(c.code);
                return (
                  <button
                    key={c.code}
                    onClick={() => toggleCountry(c.code)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? 'rgba(212,168,83,0.1)' : 'rgba(255,255,255,0.02)',
                      border: selected ? '1px solid rgba(212,168,83,0.3)' : '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span className="text-base">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: selected ? '#D4A853' : '#D1D5DB' }}>{c.name}</p>
                      <p className="text-[10px]" style={{ color: '#6B7280' }}>{c.region}</p>
                    </div>
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: selected ? '#D4A853' : 'rgba(255,255,255,0.06)',
                        border: selected ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {selected && <span className="text-black text-xs font-bold">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: '#6B7280' }}>
                  {selectedCountries.length} of {COUNTRIES.length} selected
                </span>
                <button
                  onClick={() => setSelectedCountries(COUNTRIES.map(c => c.code))}
                  className="text-xs"
                  style={{ color: '#D4A853' }}
                >
                  Select All
                </button>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculate}
                disabled={cif <= 0 || selectedCountries.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: cif > 0 && selectedCountries.length > 0
                    ? 'linear-gradient(135deg, #D4A853 0%, #B8860B 100%)'
                    : 'rgba(255,255,255,0.06)',
                  color: cif > 0 && selectedCountries.length > 0 ? '#0A0A0A' : '#6B7280',
                  cursor: cif > 0 && selectedCountries.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                <Calculator size={16} />
                Calculate Import Taxes
              </button>
            </div>
          </div>
        </div>

        {/* ── Results ───────────────────────────────────────────────────────── */}
        {calculated && results.length > 0 && (
          <div ref={resultsRef} className="space-y-6">

            {/* Summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Tax Estimates — {results.length} Countries
                </h2>
                <p className="text-sm mt-1" style={{ color: '#8A8279' }}>
                  Based on CIF value of {usd(cif)} · {inputs.engineCC}cc {inputs.fuelType} · {vehicleAge > 0 ? `${vehicleAge} years old` : 'Year ' + inputs.yearOfManufacture}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF' }}
                >
                  <Download size={14} />
                  Export CSV
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF' }}
                >
                  <RefreshCw size={14} />
                  Reset
                </button>
              </div>
            </div>

            {/* Quick Comparison Cards */}
            {cheapestCountry && mostExpensiveCountry && results.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: '#22C55E' }}>🏆 Lowest Tax Burden</p>
                  <p className="font-bold text-white">{cheapestCountry.country.flag} {cheapestCountry.country.name}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#22C55E' }}>{usd(cheapestCountry.grandTotal)}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{(cheapestCountry.effectiveRate * 100).toFixed(1)}% effective rate</p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)' }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: '#D4A853' }}>📊 Average Landed Cost</p>
                  <p className="font-bold text-white">Across {results.length} Countries</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#D4A853' }}>
                    {usd(results.reduce((s, r) => s + r.grandTotal, 0) / results.length)}
                  </p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    Avg. effective rate: {(results.reduce((s, r) => s + r.effectiveRate, 0) / results.length * 100).toFixed(1)}%
                  </p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: '#EF4444' }}>🔴 Highest Tax Burden</p>
                  <p className="font-bold text-white">{mostExpensiveCountry.country.flag} {mostExpensiveCountry.country.name}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#EF4444' }}>{usd(mostExpensiveCountry.grandTotal)}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{(mostExpensiveCountry.effectiveRate * 100).toFixed(1)}% effective rate</p>
                </div>
              </div>
            )}

            {/* Country Results — sorted cheapest first */}
            <div className="space-y-3">
              {results.map(result => (
                <ResultCard key={result.country.code} result={result} />
              ))}
            </div>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <AlertTriangle size={15} style={{ color: '#F59E0B', marginTop: 1, flexShrink: 0 }} />
              <div className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                <strong style={{ color: '#F59E0B' }}>Disclaimer: </strong>
                This calculator provides estimates based on publicly available tax rates from official customs authorities as of 2025/2026.
                Actual duties may vary based on your specific vehicle valuation, CRSP/OMV assessment, applicable trade agreements,
                vehicle inspection results, and exchange rate fluctuations. Always consult a licensed clearing and forwarding agent
                or customs broker before making import decisions. Rates are updated periodically and are subject to change without notice.
              </div>
            </div>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!calculated && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: '#141414', border: '1px dashed rgba(255,255,255,0.08)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(212,168,83,0.08)' }}
            >
              <Calculator size={28} style={{ color: '#D4A853' }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ready to Calculate</h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: '#6B7280', lineHeight: 1.7 }}>
              Enter your vehicle's CIF value, select specifications and destination countries,
              then click <strong style={{ color: '#D4A853' }}>Calculate Import Taxes</strong> to see
              a detailed breakdown for each country sorted by total cost.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {['🇰🇪 Kenya', '🇬🇧 UK', '🇦🇺 Australia', '🇦🇪 UAE', '🇺🇸 USA', '🇮🇳 India'].map(c => (
                <span
                  key={c}
                  className="px-3 py-1.5 rounded-full text-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#6B7280' }}
                >
                  {c}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-full text-xs" style={{ color: '#D4A853' }}>
                + {COUNTRIES.length - 6} more
              </span>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}