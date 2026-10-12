import { CompanyProfile, PartyProfile, CatalogItem, KiyavaInvoice } from '@/types/kiyavaBilling'

export const DEFAULT_KSV_COMPANIES: CompanyProfile[] = [
  {
    id: 'comp_ksv',
    name: 'KARAN SINGH VAIDH (KSV)',
    tagline: 'Ayurvedic Treatment & Clinical Center',
    addressLine1: 'VILL- RADIYANA, PO SUBATHU',
    addressLine2: 'TEH & DISTT - SOLAN',
    city: 'Solan',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '173206',
    gstin: '02DFBPS6121B2Z2',
    pan: 'DFBPS6121B',
    email: 'karansinghvaidh@gmail.com',
    phone: '98160 12345',
    bankName: 'HDFC Bank',
    branch: 'Solan Branch',
    accountNo: '50200049281729',
    ifscCode: 'HDFC0001423',
    isDefault: true,
    declaration:
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    terms: [
      'Goods once sold will not be returned.',
      'Medicines to be taken strictly as per prescription.',
      'Subject to Solan Jurisdiction.'
    ]
  }
]

export const DEFAULT_KSV_PARTIES: PartyProfile[] = [
  {
    id: 'party_kiyava',
    name: 'KIYAVA',
    contactPerson: 'Karan Vaidh / Store Manager',
    addressLine1: 'Upper Thari, Near M.G. Steel Hardware',
    addressLine2: 'Subathu Main Road, Subathu Chowk',
    city: 'Sabathu, Solan',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '173206',
    gstin: '02DFBPS6121B1Z3',
    phone: '78076 22577',
    email: 'karansinghvaidh@gmail.com',
    transport: 'Chandra Mangal Tpt Co.',
    station: 'Sabathu (SOLAN)'
  },
  {
    id: 'party_nbh',
    name: 'NATIONAL BOTTLE HOUSE',
    contactPerson: 'Sales Manager',
    addressLine1: '135, TILAK BAZAR',
    addressLine2: 'DELHI-110006',
    city: 'Delhi',
    state: 'Delhi',
    stateCode: '07',
    pincode: '110041',
    gstin: '07AAIPK2009F1Z4',
    phone: '011-45122410',
    email: 'info@nationalbottlehouse.com',
    transport: 'V-Trans Logistics',
    station: 'Delhi'
  },
  {
    id: 'party_opd_patient',
    name: 'OPD CLINIC PATIENTS / WALKIN',
    contactPerson: 'Reception',
    addressLine1: 'KSV Ayurvedic Hospital & Clinic Counter',
    addressLine2: 'Vill- Radiyana, PO Subathu',
    city: 'Solan',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '173206',
    gstin: 'URP',
    phone: '98160 12345',
    email: 'opd@ksvayurveda.com',
    transport: 'Counter Pickup',
    station: 'Solan'
  },
  {
    id: 'party_maxxi',
    name: 'MAXXI PHARMA',
    contactPerson: 'Director',
    addressLine1: 'Solan',
    addressLine2: 'Himachal Pradesh',
    city: 'Solan',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '173206',
    gstin: 'URP',
    phone: '',
    email: '',
    transport: 'Direct',
    station: 'Solan'
  }
]

export const DEFAULT_KSV_CATALOG: CatalogItem[] = [
  {
    id: 'cat_ksv_1',
    name: 'Gallstone Dissolution Kit (30 Days)',
    hsnCode: '30049011',
    defaultUnit: 'KIT',
    defaultRate: 4200.0,
    defaultTaxRate: 12,
    category: 'medicine',
    description: 'Complete 30-Day Ayurvedic Gallstone Treatment Kit'
  },
  {
    id: 'cat_ksv_2',
    name: 'Kidney Stone Flusher Kit (30 Days)',
    hsnCode: '30049011',
    defaultUnit: 'KIT',
    defaultRate: 3800.0,
    defaultTaxRate: 12,
    category: 'medicine',
    description: '30-Day Herbal Lithotriptic Kit for Kidney Stones'
  },
  {
    id: 'cat_ksv_3',
    name: 'Sandhi-Vata Joint Pain Kit',
    hsnCode: '30049011',
    defaultUnit: 'KIT',
    defaultRate: 3500.0,
    defaultTaxRate: 12,
    category: 'medicine',
    description: 'Ayurvedic Knee & Joint Pain Kit'
  },
  {
    id: 'cat_ksv_4',
    name: 'JADI BUTTI BAIL GIRI (Raw Material from Kiyava)',
    hsnCode: '12119011',
    defaultUnit: 'kg',
    defaultRate: 180.0,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Pure Bael Giri supplied by Kiyava'
  },
  {
    id: 'cat_ksv_5',
    name: 'Giloy Pure Stem (Raw Material from Kiyava)',
    hsnCode: '12119011',
    defaultUnit: 'kg',
    defaultRate: 120.0,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Organic Giloy Stem supplied by Kiyava'
  },
  {
    id: 'cat_ksv_6',
    name: 'CHOTI ELAICHI (Raw Material from Kiyava)',
    hsnCode: '09083130',
    defaultUnit: 'kg',
    defaultRate: 4800.0,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Green Cardamom supplied by Kiyava'
  },
  {
    id: 'cat_ksv_7',
    name: 'SAT PUDINA Menthol (Raw Material from Kiyava)',
    hsnCode: '12119011',
    defaultUnit: 'kg',
    defaultRate: 2220.0,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Menthol Crystals supplied by Kiyava'
  }
]

// Clean start - no dummy seeded invoices
export const SEEDED_KSV_INVOICES: KiyavaInvoice[] = []

