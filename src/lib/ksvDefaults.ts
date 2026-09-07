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

export const SEEDED_KSV_INVOICES: KiyavaInvoice[] = [
  {
    id: 'inv_ksv_pur_001',
    type: 'PURCHASE',
    invoiceNo: 'KYV/2026/089',
    refNo: 'PO-KSV-994',
    invoiceDate: '2026-08-25',
    dueDate: '2026-09-25',
    poNo: 'PO-KSV-994',
    transport: 'Chandra Mangal Tpt Co.',
    vehicleNo: 'HP-12-C-4581',
    station: 'Sabathu (SOLAN)',
    placeOfSupply: 'Himachal Pradesh (02)',
    placeOfSupplyCode: '02',
    reverseCharge: 'N',
    company: DEFAULT_KSV_COMPANIES[0], // KARAN SINGH VAIDH (KSV) - Buyer Firm
    buyer: DEFAULT_KSV_PARTIES[0], // KIYAVA - Supplier Party
    shippedToSameAsBilled: true,
    items: [
      {
        id: 'row_1',
        description: 'JADI BUTTI BAIL GIRI (Raw Herb from Kiyava)',
        hsnSac: '12119011',
        quantity: 50,
        unit: 'kg',
        rate: 180.0,
        taxRate: 5,
        discountPercent: 0,
        amount: 9000
      },
      {
        id: 'row_2',
        description: 'Giloy Pure Stem (Raw Herb from Kiyava)',
        hsnSac: '12119011',
        quantity: 100,
        unit: 'kg',
        rate: 120.0,
        taxRate: 5,
        discountPercent: 0,
        amount: 12000
      },
      {
        id: 'row_3',
        description: 'SAT PUDINA Menthol (Raw Herb from Kiyava)',
        hsnSac: '12119011',
        quantity: 5,
        unit: 'kg',
        rate: 2220.0,
        taxRate: 5,
        discountPercent: 0,
        amount: 11100
      }
    ],
    subtotal: 32100,
    totalQuantity: 155,
    isInterState: false,
    cgstAmount: 802.5,
    sgstAmount: 802.5,
    igstAmount: 0,
    totalTaxAmount: 1605,
    freightCharges: 500,
    otherCharges: 0,
    extraDiscount: 0,
    roundOff: 0.5,
    grandTotal: 34205,
    amountInWords: 'Rupees Thirty Four Thousand Two Hundred Five Only',
    taxInWords: 'Rupees One Thousand Six Hundred Five Only',
    hsnSummary: [
      {
        hsnSac: '12119011',
        taxableValue: 32100,
        cgstRate: 2.5,
        cgstAmount: 802.5,
        sgstRate: 2.5,
        sgstAmount: 802.5,
        igstRate: 0,
        igstAmount: 0,
        totalTaxAmount: 1605
      }
    ],
    status: 'PAID',
    paymentMode: 'Bank Transfer (NEFT)',
    notes: 'Raw herbal material batch received from Kiyava Subathu Warehouse for KSV pharmacy unit.',
    createdAt: '2026-08-25T10:30:00Z',
    updatedAt: '2026-08-25T10:30:00Z'
  }
]
