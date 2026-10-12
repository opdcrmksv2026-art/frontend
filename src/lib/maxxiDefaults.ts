import { CompanyProfile, PartyProfile, CatalogItem, KiyavaInvoice } from '@/types/kiyavaBilling'

export const DEFAULT_MAXXI_COMPANIES: CompanyProfile[] = [
  {
    id: 'comp_maxxi',
    name: 'MAXXI PHARMA PVT. LTD.',
    tagline: 'Pharmaceutical Manufacturing & Healthcare Formulations',
    addressLine1: 'Plot No. 45, Industrial Area Phase 1',
    addressLine2: 'Near ESI Hospital, Solan',
    city: 'Solan',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '173212',
    gstin: '02AAACM8821F1Z9',
    pan: 'AAACM8821F',
    email: 'info@maxxipharma.com',
    phone: '01792-234890 / 98160 54321',
    bankName: 'ICICI Bank',
    branch: 'Mall Road, Solan',
    accountNo: '034105009812',
    ifscCode: 'ICIC0000341',
    isDefault: true,
    declaration:
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    terms: [
      'Goods once sold will not be taken back or exchanged.',
      'All disputes are subject to Solan (H.P.) Jurisdiction only.',
      'Interest @ 18% p.a. will be charged if payment is not cleared within due date.'
    ]
  }
]

export const DEFAULT_MAXXI_PARTIES: PartyProfile[] = [
  {
    id: 'party_ksv',
    name: 'KARAN SINGH VAIDH (KSV)',
    contactPerson: 'Dr. Karan Singh Vaidh',
    addressLine1: 'VILL- RADIYANA, PO SUBATHU',
    addressLine2: 'TEH & DISTT - SOLAN',
    city: 'Solan',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '173206',
    gstin: '02DFBPS6121B2Z2',
    phone: '98160 12345',
    email: 'karansinghvaidh@gmail.com',
    transport: 'Direct Counter Delivery',
    station: 'Solan'
  },
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
    id: 'party_mediplus',
    name: 'MEDIPLUS PHARMA DISTRIBUTORS',
    contactPerson: 'Rajesh Sharma',
    addressLine1: 'Shop No. 12, Wholesale Pharma Market',
    addressLine2: 'Near Bus Stand',
    city: 'Chandigarh',
    state: 'Chandigarh',
    stateCode: '04',
    pincode: '160017',
    gstin: '04ABCPM9920K1Z5',
    phone: '0172-4651920',
    email: 'orders@mediplusdistributors.com',
    transport: 'Himachal Roadways Cargo',
    station: 'Chandigarh'
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
  }
]

// Clean default catalog - starts empty so users can manage their own products without dummy data
export const DEFAULT_MAXXI_CATALOG: CatalogItem[] = []

// Clean start - no dummy seeded invoices
export const SEEDED_MAXXI_INVOICES: KiyavaInvoice[] = []

