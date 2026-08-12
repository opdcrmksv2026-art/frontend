export interface CompanyProfile {
  id: string
  name: string
  tagline?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  stateCode: string
  pincode: string
  gstin: string
  pan?: string
  email?: string
  phone: string
  bankName: string
  branch: string
  accountNo: string
  ifscCode: string
  terms?: string[]
  declaration?: string
  isDefault?: boolean
}

export interface PartyProfile {
  id: string
  name: string
  contactPerson?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  stateCode: string
  pincode: string
  gstin: string
  phone: string
  email?: string
  transport?: string
  station?: string
}

export interface CatalogItem {
  id: string
  name: string
  hsnCode: string
  defaultUnit: string
  defaultRate: number
  defaultTaxRate: number // e.g. 5, 12, 18
  description?: string
  category?: 'raw_material' | 'packaging' | 'herb' | 'medicine' | 'general'
}

export interface InvoiceItemRow {
  id: string
  description: string
  hsnSac: string
  quantity: number
  unit: string
  rate: number // Tax exclusive rate
  rateInclTax?: number // Tax inclusive rate
  taxRate: number // Tax percentage e.g. 5, 12, 18, 0
  discountPercent: number
  amount: number // Final line total = Qty * Rate * (1 - Disc/100)
}

export interface HsnSummaryRow {
  hsnSac: string
  taxableValue: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  igstRate: number
  igstAmount: number
  totalTaxAmount: number
}

export interface KiybaInvoice {
  id: string
  invoiceNo: string
  refNo?: string
  invoiceDate: string // YYYY-MM-DD
  dueDate?: string
  poNo?: string
  eWayBillNo?: string
  transport?: string
  vehicleNo?: string
  station?: string
  grRrNo?: string
  salesmanName?: string
  paymentTerms?: string
  placeOfSupply: string
  placeOfSupplyCode: string
  reverseCharge: 'N' | 'Y'
  totalBags?: string
  matCenter?: string

  // Company / Seller info
  company: CompanyProfile

  // Party / Buyer info
  buyer: PartyProfile
  shippedToSameAsBilled: boolean
  shippedTo?: PartyProfile

  // Item rows
  items: InvoiceItemRow[]

  // Totals & Financials
  subtotal: number
  totalQuantity: number
  isInterState: boolean // true = IGST, false = CGST + SGST

  // Tax calculations
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalTaxAmount: number

  // Adjustments
  freightCharges: number
  otherCharges: number
  extraDiscount: number
  roundOff: number
  grandTotal: number

  // Words
  amountInWords: string
  taxInWords: string

  // HSN Breakdown
  hsnSummary: HsnSummaryRow[]

  // Status & Metadata
  status: 'PAID' | 'PENDING' | 'CANCELLED'
  paymentMode: string
  notes?: string
  createdAt: string
  updatedAt: string
}
