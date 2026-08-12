import { CompanyProfile, PartyProfile, CatalogItem, KiybaInvoice } from '@/types/kiybaBilling'

export const DEFAULT_COMPANIES: CompanyProfile[] = [
  {
    id: 'comp_kiyava',
    name: 'KIYAVA',
    tagline: 'Herbal & Ayurvedic Raw Material Supplies',
    addressLine1: 'Upper Thari, Near M.G. Steel Hardware',
    addressLine2: 'Subathu Main Road, Subathu Chowk',
    city: 'Sabathu, Solan',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '173206',
    gstin: '02DFBPS6121B1Z3',
    pan: 'DFBPS6121B',
    email: 'karansinghvaidh@gmail.com',
    phone: '78076 22577',
    bankName: 'State Bank of India',
    branch: 'Subathu Branch, Solan',
    accountNo: '38920194821',
    ifscCode: 'SBIN0001234',
    isDefault: true,
    declaration:
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    terms: [
      'Goods once sold will not be taken back.',
      'Interest @ 18% p.a. will be charged if payment is delayed beyond due date.',
      'Seller is not responsible for any loss or damage of goods in transit.',
      'Subject to Solan (H.P.) Jurisdiction only.'
    ]
  },
  {
    id: 'comp_nbh',
    name: 'NATIONAL BOTTLE HOUSE',
    tagline: 'Pharma Packaging & Bottle Solutions',
    addressLine1: 'H.O. : 135, TILAK BAZAR, DELHI-110006',
    addressLine2:
      'B.O. : PLOT NO 15, GROUND FLOOR, KHASRA NO 63/1, VILLAGE TIKRI KALAN',
    city: 'Delhi',
    state: 'Delhi',
    stateCode: '07',
    pincode: '110041',
    gstin: '07AAIPK2009F1Z4',
    pan: 'AAIPK2009F',
    email: 'info@nationalbottlehouse.com',
    phone: '011-45122410, 9811540333, 7827198878',
    bankName: 'HDFC Bank',
    branch: 'Chandni Chowk, Delhi',
    accountNo: '02172560003588',
    ifscCode: 'HDFC0000217',
    isDefault: false,
    declaration:
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    terms: [
      'Goods once sold will not be taken back.',
      'Interest @ 18% p.a. for delayed payment.',
      'Seller is not responsible for any loss or damage of goods in transit.',
      'Subject to Delhi Jurisdiction only.'
    ]
  },
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
    isDefault: false,
    declaration:
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    terms: [
      'Goods once sold will not be returned.',
      'Medicines to be taken strictly as per prescription.',
      'Subject to Solan Jurisdiction.'
    ]
  }
]

export const DEFAULT_PARTIES: PartyProfile[] = [
  {
    id: 'party_ksv',
    name: 'KARAN SINGH VAIDH',
    contactPerson: 'Dr. Karan Singh Vaidh',
    addressLine1: 'VILL- RADIYANA, PO SUBATHU',
    addressLine2: 'TEH & DISTT - SOLAN',
    city: 'Solan',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '173206',
    gstin: '02DFBPS6121B2Z2',
    phone: '78076 22577',
    email: 'karansinghvaidh@gmail.com',
    transport: 'Direct Delivery',
    station: 'Sabathu (SOLAN)'
  },
  {
    id: 'party_kiyba',
    name: 'KIYAVA',
    contactPerson: 'Manager',
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
  }
]

export const DEFAULT_CATALOG: CatalogItem[] = [
  {
    id: 'cat_1',
    name: 'JADI BUTTI BAIL GIRI',
    hsnCode: '12119011',
    defaultUnit: 'kg',
    defaultRate: 180.0,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Dry Bael Giri Herb'
  },
  {
    id: 'cat_2',
    name: 'Giloy',
    hsnCode: '12119011',
    defaultUnit: 'kg',
    defaultRate: 120.0,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Pure Giloy Stem'
  },
  {
    id: 'cat_3',
    name: 'CHOTI ELAICHI',
    hsnCode: '09083130',
    defaultUnit: 'kg',
    defaultRate: 4800.0,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Green Cardamom'
  },
  {
    id: 'cat_4',
    name: 'DHANIA',
    hsnCode: '09092190',
    defaultUnit: 'kg',
    defaultRate: 232.5,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Coriander Seeds'
  },
  {
    id: 'cat_5',
    name: 'SAT PUDINA',
    hsnCode: '12119011',
    defaultUnit: 'kg',
    defaultRate: 2220.0,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Menthol Crystals'
  },
  {
    id: 'cat_6',
    name: 'Katira Gond',
    hsnCode: '13019019',
    defaultUnit: 'kg',
    defaultRate: 405.0,
    defaultTaxRate: 5,
    category: 'herb',
    description: 'Tragacanth Gum'
  },
  {
    id: 'cat_7',
    name: '460 CC HDPE JAR WHITE',
    hsnCode: '39233090',
    defaultUnit: 'PCS',
    defaultRate: 10.45,
    defaultTaxRate: 18,
    category: 'packaging',
    description: 'HDPE Jar Container'
  },
  {
    id: 'cat_8',
    name: 'Injection Vial',
    hsnCode: '701090',
    defaultUnit: 'PCS',
    defaultRate: 1.6,
    defaultTaxRate: 18,
    category: 'packaging',
    description: 'Glass Injection Vial'
  }
]

// NO DUMMY INVOICES - Users start clean with empty ledger
export const SEEDED_INVOICES: KiybaInvoice[] = []
