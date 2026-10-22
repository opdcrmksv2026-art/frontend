import { CompanyProfile, PartyProfile, CatalogItem, KiyavaInvoice } from '@/types/kiyavaBilling'

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
    transport: 'Chandra Mangal Tpt Co.',
    station: 'Delhi'
  },
  {
    id: 'party_kiyava',
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

// Clean default catalog - starts empty so only admin-added products are shown
export const DEFAULT_CATALOG: CatalogItem[] = []

export const DUMMY_CATALOG_NAMES = [
  'JADI BUTTI BAIL GIRI',
  'Giloy',
  'CHOTI ELAICHI',
  'DHANIA',
  'SAT PUDINA',
  'Katira Gond',
  '460 CC HDPE JAR WHITE',
  'Injection Vial'
]

// NO DUMMY INVOICES - Users start clean with empty ledger
export const SEEDED_INVOICES: KiyavaInvoice[] = []
