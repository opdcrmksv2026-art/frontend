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

export const DEFAULT_MAXXI_CATALOG: CatalogItem[] = [
  {
    id: 'cat_mx_ston_80',
    name: 'STONVAIDHA KSG 80',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 2500.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 240 GRM'
  },
  {
    id: 'cat_mx_ston_40',
    name: 'STONVAIDHA KSG 40',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 120 GRM'
  },
  {
    id: 'cat_mx_ston_12',
    name: 'STONVAIDHA KSGA 12',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 120 GRM'
  },
  {
    id: 'cat_mx_ston_6',
    name: 'STONVAIDHA KSGA 6',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 60 GRM'
  },
  {
    id: 'cat_mx_ston_108',
    name: 'STONVAIDHA KSS 108',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: KSS 108'
  },
  {
    id: 'cat_mx_ston_72',
    name: 'STONVAIDHA KSS 72',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: KSS 72'
  },
  {
    id: 'cat_mx_ston_36',
    name: 'STONVAIDHA KSS 36',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: KSS 36'
  },
  {
    id: 'cat_mx_vidhu_tr_30',
    name: 'VIDHUVAIDHA TR 30 CHURAN',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 120 GRM'
  },
  {
    id: 'cat_mx_vidhu_aks_30',
    name: 'VIDHUVAIDHA AKS 30 CHURAN',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 30 POUCH'
  },
  {
    id: 'cat_mx_vidhu_ls_30',
    name: 'VIDHUVAIDHA LS 30 CHURAN',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 30 POUCH'
  },
  {
    id: 'cat_mx_madhu_sm_30',
    name: 'MADHUVAIDHA SM 30 CHURAN',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 30 POUCH'
  },
  {
    id: 'cat_mx_vidhu_bbn_30',
    name: 'VIDHUVAIDHA BBN 30 CHURAN',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 180 GRM'
  },
  {
    id: 'cat_mx_vidhu_hgp_30',
    name: 'VIDHUVAIDHA HGP 30 CHURAN',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 120 GRM'
  },
  {
    id: 'cat_mx_vidhu_pssf_30',
    name: 'VIDHUVAIDHA PSSF 30 CHURAN',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 90 GRM'
  },
  {
    id: 'cat_mx_vidhu_pssf_60',
    name: 'VIDHUVAIDHA PSSF 60 CHURAN',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 180 GRM'
  },
  {
    id: 'cat_mx_vidhu_hbp_30',
    name: 'VIDHUVAIDHA HBP 30 CHURAN',
    hsnCode: '3003',
    defaultUnit: 'NOS',
    defaultRate: 0.0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: 'Packing: 30 POUCH'
  }
]

export const SEEDED_MAXXI_INVOICES: KiyavaInvoice[] = [
  {
    id: 'inv_maxxi_pur_001',
    type: 'PURCHASE',
    invoiceNo: 'MXP/2026/012',
    refNo: 'PO-MXP-102',
    invoiceDate: '2026-08-28',
    dueDate: '2026-09-28',
    poNo: 'PO-MXP-102',
    transport: 'Chandra Mangal Tpt Co.',
    vehicleNo: 'HP-12-C-8812',
    station: 'Solan Industrial Area',
    placeOfSupply: 'Himachal Pradesh (02)',
    placeOfSupplyCode: '02',
    reverseCharge: 'N',
    company: DEFAULT_MAXXI_COMPANIES[0],
    buyer: DEFAULT_MAXXI_PARTIES[1], // KIYAVA
    shippedToSameAsBilled: true,
    items: [
      {
        id: 'row_m1',
        description: 'JADI BUTTI BAIL GIRI (Raw Material Herb)',
        hsnSac: '12119011',
        quantity: 40,
        unit: 'kg',
        rate: 180.0,
        taxRate: 5,
        discountPercent: 0,
        amount: 7200
      },
      {
        id: 'row_m2',
        description: 'SAT PUDINA Menthol Crystals',
        hsnSac: '12119011',
        quantity: 5,
        unit: 'kg',
        rate: 2220.0,
        taxRate: 5,
        discountPercent: 0,
        amount: 11100
      }
    ],
    subtotal: 18300,
    totalQuantity: 45,
    isInterState: false,
    cgstAmount: 457.5,
    sgstAmount: 457.5,
    igstAmount: 0,
    totalTaxAmount: 915,
    freightCharges: 350,
    otherCharges: 0,
    extraDiscount: 0,
    roundOff: 0.5,
    grandTotal: 19565,
    amountInWords: 'Rupees Nineteen Thousand Five Hundred Sixty Five Only',
    taxInWords: 'Rupees Nine Hundred Fifteen Only',
    hsnSummary: [
      {
        hsnSac: '12119011',
        taxableValue: 18300,
        cgstRate: 2.5,
        cgstAmount: 457.5,
        sgstRate: 2.5,
        sgstAmount: 457.5,
        igstRate: 0,
        igstAmount: 0,
        totalTaxAmount: 915
      }
    ],
    status: 'PAID',
    paymentMode: 'Bank Transfer (NEFT)',
    notes: 'Raw herbal batch procured for Maxxi Pharma formulations.',
    createdAt: '2026-08-28T11:00:00Z',
    updatedAt: '2026-08-28T11:00:00Z'
  }
]
