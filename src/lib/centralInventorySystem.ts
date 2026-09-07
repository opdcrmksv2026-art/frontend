import { CompanyProfile, PartyProfile, CatalogItem, KiyavaInvoice, InvoiceItemRow } from '@/types/kiyavaBilling'

export type StockEntity = 'THIRD_PARTY' | 'KSV' | 'MAXXI_PHARMA'

export type TransactionType =
  | 'PURCHASE'
  | 'SALE'
  | 'STOCK_TRANSFER'
  | 'SALE_RETURN'
  | 'PURCHASE_RETURN'
  | 'STOCK_ADJUSTMENT'
  | 'STOCK_RETURN'

export interface BatchStock {
  id: string
  entity: StockEntity
  productName: string
  sku: string
  category: string
  batchNumber: string
  mfgDate: string
  expiryDate: string
  availableQty: number
  reservedQty: number
  soldQty: number
  purchaseRate: number
  sellingRate: number
  hsnCode: string
  unit: string
  taxRate: number
  minStockLevel: number
  status: 'In Stock' | 'Low Stock' | 'Expiring Soon' | 'Expired' | 'Out of Stock'
  supplierId?: string
  supplierName?: string
  createdAt: string
  updatedAt: string
}

export interface InventoryTransaction {
  id: string
  timestamp: string
  sourceEntity: StockEntity | 'EXTERNAL_SUPPLIER' | 'CUSTOMER'
  destinationEntity: StockEntity | 'EXTERNAL_SUPPLIER' | 'CUSTOMER'
  type: TransactionType
  productName: string
  sku: string
  batchNumber: string
  expiryDate: string
  quantity: number
  unitPrice: number
  totalAmount: number
  referenceInvoiceNo?: string
  sourceInvoiceId?: string
  destInvoiceId?: string
  createdBy: string
  notes?: string
  parentTransactionId?: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  user: string
  action: string
  entity: StockEntity
  productName: string
  batchNumber: string
  oldQty: number
  changeQty: number
  newQty: number
  reason: string
  referenceInvoiceNo?: string
}

export interface TraceabilityStep {
  stepIndex: number
  stage: 'EXTERNAL_SUPPLIER_PURCHASE' | 'THIRD_PARTY_STOCK' | 'KSV_TRANSFER' | 'MAXXI_TRANSFER' | 'CUSTOMER_SALE'
  entity: string
  action: string
  invoiceNo?: string
  partyName: string
  date: string
  batchNumber: string
  quantity: number
  amount: number
}

// STORAGE KEYS
const CENTRAL_STOCK_KEY = 'ksv_central_inventory_stock_v3'
const CENTRAL_TX_KEY = 'ksv_central_inventory_transactions_v3'
const CENTRAL_AUDIT_KEY = 'ksv_central_inventory_audit_v3'
const CENTRAL_INVOICES_KEY = 'ksv_central_invoices_v3'

export const CENTRAL_INVENTORY_EVENT = 'ksv_central_inventory_updated'

// SEEDED INITIAL STOCK FOR THE 3 ENTITIES
const INITIAL_BATCHES: BatchStock[] = [
  // --- THIRD PARTY (KIYAVA / MAIN SOURCE) ---
  {
    id: 'batch_tp_1',
    entity: 'THIRD_PARTY',
    productName: 'Paracetamol IP 500mg Raw Bulk Powder',
    sku: 'SKU-PCM-500',
    category: 'Raw Material',
    batchNumber: 'TP-BATCH-2026-A1',
    mfgDate: '2026-01-10',
    expiryDate: '2028-12-31',
    availableQty: 100,
    reservedQty: 0,
    soldQty: 0,
    purchaseRate: 250,
    sellingRate: 400,
    hsnCode: '29222990',
    unit: 'kg',
    taxRate: 18,
    minStockLevel: 20,
    status: 'In Stock',
    supplierName: 'Bharat Chemicals Mumbai',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'batch_tp_2',
    entity: 'THIRD_PARTY',
    productName: 'JADI BUTTI BAIL GIRI (Raw Herb)',
    sku: 'SKU-BG-100',
    category: 'Raw Herb',
    batchNumber: 'KYV-HERB-809',
    mfgDate: '2026-03-01',
    expiryDate: '2028-03-01',
    availableQty: 250,
    reservedQty: 0,
    soldQty: 0,
    purchaseRate: 140,
    sellingRate: 180,
    hsnCode: '12119011',
    unit: 'kg',
    taxRate: 5,
    minStockLevel: 30,
    status: 'In Stock',
    supplierName: 'Himalayan Herbal Mandi',
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-03-05T10:00:00Z'
  },
  {
    id: 'batch_tp_3',
    entity: 'THIRD_PARTY',
    productName: 'Gallstone Dissolution Raw Extract Kit',
    sku: 'SKU-GDK-30',
    category: 'Formulation',
    batchNumber: 'KYV-GDK-901',
    mfgDate: '2026-04-10',
    expiryDate: '2028-04-10',
    availableQty: 150,
    reservedQty: 0,
    soldQty: 0,
    purchaseRate: 1500,
    sellingRate: 2800,
    hsnCode: '30049011',
    unit: 'KIT',
    taxRate: 12,
    minStockLevel: 15,
    status: 'In Stock',
    supplierName: 'Kiyava Processing Unit',
    createdAt: '2026-04-12T10:00:00Z',
    updatedAt: '2026-04-12T10:00:00Z'
  },

  // --- KSV (KARAN SINGH VAIDH) ---
  {
    id: 'batch_ksv_1',
    entity: 'KSV',
    productName: 'Gallstone Dissolution Kit (30 Days)',
    sku: 'SKU-GDK-30',
    category: 'Ayurvedic Kit',
    batchNumber: 'KYV-GDK-901',
    mfgDate: '2026-04-10',
    expiryDate: '2028-04-10',
    availableQty: 40,
    reservedQty: 0,
    soldQty: 0,
    purchaseRate: 2800,
    sellingRate: 4200,
    hsnCode: '30049011',
    unit: 'KIT',
    taxRate: 12,
    minStockLevel: 10,
    status: 'In Stock',
    supplierName: 'KIYAVA',
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z'
  },

  // --- MAXXI PHARMA ---
  {
    id: 'batch_mx_1',
    entity: 'MAXXI_PHARMA',
    productName: 'Maxxi-Cal D3 Softgel Capsules',
    sku: 'SKU-MX-CAL',
    category: 'Capsules',
    batchNumber: 'MXP-BATCH-102',
    mfgDate: '2026-05-01',
    expiryDate: '2028-05-01',
    availableQty: 80,
    reservedQty: 0,
    soldQty: 0,
    purchaseRate: 90,
    sellingRate: 145,
    hsnCode: '30049099',
    unit: 'STRIP',
    taxRate: 12,
    minStockLevel: 15,
    status: 'In Stock',
    supplierName: 'KARAN SINGH VAIDH (KSV)',
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-05-10T10:00:00Z'
  }
]

// HELPER: Compute batch status automatically
export function computeBatchStatus(batch: BatchStock): BatchStock['status'] {
  if (batch.availableQty <= 0) return 'Out of Stock'

  const expiry = new Date(batch.expiryDate)
  const now = new Date()
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24)

  if (diffDays <= 0) return 'Expired'
  if (diffDays <= 90) return 'Expiring Soon'
  if (batch.availableQty <= batch.minStockLevel) return 'Low Stock'

  return 'In Stock'
}

// LOAD CENTRAL STOCK
export function getCentralStock(entity?: StockEntity): BatchStock[] {
  if (typeof window === 'undefined') return INITIAL_BATCHES
  try {
    const raw = localStorage.getItem(CENTRAL_STOCK_KEY)
    let batches: BatchStock[] = raw ? JSON.parse(raw) : INITIAL_BATCHES
    if (!raw) {
      localStorage.setItem(CENTRAL_STOCK_KEY, JSON.stringify(INITIAL_BATCHES))
    }
    // Recompute statuses
    batches = batches.map((b) => ({ ...b, status: computeBatchStatus(b) }))
    return entity ? batches.filter((b) => b.entity === entity) : batches
  } catch (e) {
    console.error('Failed to read central stock:', e)
    return INITIAL_BATCHES
  }
}

// SAVE CENTRAL STOCK
function saveCentralStock(batches: BatchStock[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CENTRAL_STOCK_KEY, JSON.stringify(batches))
  window.dispatchEvent(new CustomEvent(CENTRAL_INVENTORY_EVENT, { detail: { batches } }))
}

// LOAD TRANSACTIONS
export function getCentralTransactions(entity?: StockEntity): InventoryTransaction[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CENTRAL_TX_KEY)
    const txs: InventoryTransaction[] = raw ? JSON.parse(raw) : []
    return entity
      ? txs.filter((t) => t.sourceEntity === entity || t.destinationEntity === entity)
      : txs
  } catch (e) {
    console.error('Failed to read central transactions:', e)
    return []
  }
}

// SAVE TRANSACTION
function saveCentralTransaction(tx: InventoryTransaction): void {
  if (typeof window === 'undefined') return
  const txs = getCentralTransactions()
  txs.unshift(tx)
  localStorage.setItem(CENTRAL_TX_KEY, JSON.stringify(txs))
}

// LOAD AUDIT LOGS
export function getCentralAuditLogs(entity?: StockEntity): AuditLogEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CENTRAL_AUDIT_KEY)
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : []
    return entity ? logs.filter((l) => l.entity === entity) : logs
  } catch (e) {
    console.error('Failed to read audit logs:', e)
    return []
  }
}

// SAVE AUDIT LOG
function saveAuditLog(entry: AuditLogEntry): void {
  if (typeof window === 'undefined') return
  const logs = getCentralAuditLogs()
  logs.unshift(entry)
  localStorage.setItem(CENTRAL_AUDIT_KEY, JSON.stringify(logs))
}

// LOAD INVOICES FOR ENTITY OR CENTRAL
export function getCentralInvoices(entityStorageKey?: string): KiyavaInvoice[] {
  if (typeof window === 'undefined') return []
  try {
    const key = entityStorageKey || CENTRAL_INVOICES_KEY
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

// SAVE INVOICE TO ENTITY LEDGER AND CENTRAL LEDGER
export function appendInvoiceToLedger(storageKey: string, invoice: KiyavaInvoice): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getCentralInvoices(storageKey)
    const filtered = existing.filter((inv) => inv.id !== invoice.id)
    filtered.unshift(invoice)
    localStorage.setItem(storageKey, JSON.stringify(filtered))

    // Also sync to central invoices list
    const central = getCentralInvoices(CENTRAL_INVOICES_KEY)
    const centralFiltered = central.filter((inv) => inv.id !== invoice.id)
    centralFiltered.unshift(invoice)
    localStorage.setItem(CENTRAL_INVOICES_KEY, JSON.stringify(centralFiltered))
  } catch (e) {
    console.error('Failed to append invoice:', e)
  }
}

// -------------------------------------------------------------------
// 1. EXTERNAL PURCHASE INTO THIRD PARTY
// -------------------------------------------------------------------
export interface ExternalPurchasePayload {
  supplierName: string
  supplierGstin?: string
  invoiceNo: string
  productName: string
  category: string
  batchNumber: string
  mfgDate: string
  expiryDate: string
  quantity: number
  purchaseRate: number
  sellingRate: number
  hsnCode: string
  unit: string
  taxRate: number
  createdBy?: string
}

export function executeExternalPurchase(payload: ExternalPurchasePayload): {
  success: boolean
  message: string
  batch?: BatchStock
  invoice?: KiyavaInvoice
} {
  if (payload.quantity <= 0) return { success: false, message: 'Quantity must be greater than 0.' }

  const batches = getCentralStock()
  const now = new Date().toISOString()
  const createdBy = payload.createdBy || 'Dr. Vikas'

  // Check if exact batch already exists in Third Party
  let batch = batches.find(
    (b) =>
      b.entity === 'THIRD_PARTY' &&
      b.productName.toLowerCase() === payload.productName.toLowerCase() &&
      b.batchNumber.toUpperCase() === payload.batchNumber.toUpperCase()
  )

  const oldQty = batch ? batch.availableQty : 0

  if (batch) {
    batch.availableQty += payload.quantity
    batch.purchaseRate = payload.purchaseRate
    batch.sellingRate = payload.sellingRate
    batch.expiryDate = payload.expiryDate
    batch.updatedAt = now
    batch.status = computeBatchStatus(batch)
  } else {
    batch = {
      id: `batch_tp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      entity: 'THIRD_PARTY',
      productName: payload.productName,
      sku: `SKU-${payload.productName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      category: payload.category || 'Raw Material',
      batchNumber: payload.batchNumber.toUpperCase(),
      mfgDate: payload.mfgDate,
      expiryDate: payload.expiryDate,
      availableQty: payload.quantity,
      reservedQty: 0,
      soldQty: 0,
      purchaseRate: payload.purchaseRate,
      sellingRate: payload.sellingRate,
      hsnCode: payload.hsnCode || '12119011',
      unit: payload.unit || 'kg',
      taxRate: payload.taxRate || 5,
      minStockLevel: 20,
      status: 'In Stock',
      supplierName: payload.supplierName,
      createdAt: now,
      updatedAt: now
    }
    batch.status = computeBatchStatus(batch)
    batches.unshift(batch)
  }

  saveCentralStock(batches)

  const totalAmount = payload.quantity * payload.purchaseRate
  const taxAmount = (totalAmount * (payload.taxRate || 5)) / 100
  const grandTotal = totalAmount + taxAmount

  // Create Transaction
  const tx: InventoryTransaction = {
    id: `TX-PUR-${Date.now()}`,
    timestamp: now,
    sourceEntity: 'EXTERNAL_SUPPLIER',
    destinationEntity: 'THIRD_PARTY',
    type: 'PURCHASE',
    productName: payload.productName,
    sku: batch.sku,
    batchNumber: payload.batchNumber,
    expiryDate: payload.expiryDate,
    quantity: payload.quantity,
    unitPrice: payload.purchaseRate,
    totalAmount: grandTotal,
    referenceInvoiceNo: payload.invoiceNo,
    createdBy,
    notes: `External purchase from ${payload.supplierName}`
  }
  saveCentralTransaction(tx)

  // Audit Log
  saveAuditLog({
    id: `AUD-${Date.now()}`,
    timestamp: now,
    user: createdBy,
    action: 'PURCHASE_STOCK_IN',
    entity: 'THIRD_PARTY',
    productName: payload.productName,
    batchNumber: payload.batchNumber,
    oldQty,
    changeQty: payload.quantity,
    newQty: batch.availableQty,
    reason: `External Procurement (Inv #${payload.invoiceNo})`,
    referenceInvoiceNo: payload.invoiceNo
  })

  // Create Purchase Invoice for Third Party (Kiyava)
  const purchaseInvoice: KiyavaInvoice = {
    id: `inv_tp_pur_${Date.now()}`,
    type: 'PURCHASE',
    invoiceNo: payload.invoiceNo,
    refNo: `PO-EXT-${Date.now().toString().slice(-4)}`,
    invoiceDate: now.split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    poNo: `PO-EXT-${Date.now().toString().slice(-4)}`,
    transport: 'Direct Transport',
    station: 'Solan',
    placeOfSupply: 'Himachal Pradesh (02)',
    placeOfSupplyCode: '02',
    reverseCharge: 'N',
    company: {
      id: 'comp_kiyava',
      name: 'KIYAVA (Third Party)',
      addressLine1: 'Upper Thari, Subathu Chowk',
      city: 'Solan',
      state: 'Himachal Pradesh',
      stateCode: '02',
      pincode: '173206',
      gstin: '02DFBPS6121B1Z3',
      phone: '78076 22577',
      isDefault: true
    },
    buyer: {
      id: `party_ext_${Date.now()}`,
      name: payload.supplierName,
      addressLine1: 'Industrial Vendor Yard',
      city: 'External Supplier',
      state: 'Himachal Pradesh',
      stateCode: '02',
      pincode: '173206',
      gstin: payload.supplierGstin || 'URP',
      phone: '98160 00000'
    },
    shippedToSameAsBilled: true,
    items: [
      {
        id: `item_1`,
        description: `${payload.productName} (Batch: ${payload.batchNumber})`,
        hsnSac: payload.hsnCode,
        quantity: payload.quantity,
        unit: payload.unit,
        rate: payload.purchaseRate,
        taxRate: payload.taxRate,
        discountPercent: 0,
        amount: totalAmount
      }
    ],
    subtotal: totalAmount,
    totalQuantity: payload.quantity,
    isInterState: false,
    cgstAmount: taxAmount / 2,
    sgstAmount: taxAmount / 2,
    igstAmount: 0,
    totalTaxAmount: taxAmount,
    grandTotal,
    amountInWords: `Rupees ${Math.round(grandTotal)} Only`,
    taxInWords: `Rupees ${Math.round(taxAmount)} Only`,
    status: 'PAID',
    paymentMode: 'Bank Transfer',
    notes: 'External Supplier Purchase',
    createdAt: now,
    updatedAt: now
  }

  appendInvoiceToLedger('ksv_kiyava_invoices', purchaseInvoice)

  return { success: true, message: `Successfully purchased ${payload.quantity} ${payload.unit} into Third Party inventory.`, batch, invoice: purchaseInvoice }
}

// -------------------------------------------------------------------
// 2. SUPPLY CHAIN STOCK TRANSFER (THIRD_PARTY -> KSV or KSV -> MAXXI_PHARMA)
// -------------------------------------------------------------------
export interface StockTransferPayload {
  sourceEntity: StockEntity
  destinationEntity: StockEntity
  batchId: string
  quantity: number
  transferRate?: number
  createdBy?: string
  notes?: string
}

export function executeStockTransfer(payload: StockTransferPayload): {
  success: boolean
  message: string
  sourceInvoice?: KiyavaInvoice
  destInvoice?: KiyavaInvoice
} {
  const { sourceEntity, destinationEntity, batchId, quantity } = payload
  if (quantity <= 0) return { success: false, message: 'Transfer quantity must be greater than 0.' }
  if (sourceEntity === destinationEntity) return { success: false, message: 'Source and Destination entities cannot be the same.' }

  const batches = getCentralStock()
  const sourceBatch = batches.find((b) => b.id === batchId && b.entity === sourceEntity)

  if (!sourceBatch) {
    return { success: false, message: 'Source batch not found in inventory.' }
  }

  // Check Expiry
  const isExpired = new Date(sourceBatch.expiryDate).getTime() < new Date().getTime()
  if (isExpired) {
    return { success: false, message: `Cannot transfer expired batch ${sourceBatch.batchNumber} (Expired: ${sourceBatch.expiryDate}).` }
  }

  // Check Available Quantity (STRICT PREVENT OVER-TRANSFER)
  if (sourceBatch.availableQty < quantity) {
    return {
      success: false,
      message: `Insufficient stock in ${sourceEntity}. Available: ${sourceBatch.availableQty} ${sourceBatch.unit}, Requested: ${quantity} ${sourceBatch.unit}.`
    }
  }

  const now = new Date().toISOString()
  const createdBy = payload.createdBy || 'Dr. Vikas'
  const rate = payload.transferRate || sourceBatch.sellingRate

  const sourceOldQty = sourceBatch.availableQty

  // 1. DECREASE SOURCE STOCK (Stock OUT)
  sourceBatch.availableQty -= quantity
  sourceBatch.soldQty += quantity
  sourceBatch.updatedAt = now
  sourceBatch.status = computeBatchStatus(sourceBatch)

  // 2. INCREASE DESTINATION STOCK (Stock IN)
  let destBatch = batches.find(
    (b) =>
      b.entity === destinationEntity &&
      b.productName.toLowerCase() === sourceBatch.productName.toLowerCase() &&
      b.batchNumber.toUpperCase() === sourceBatch.batchNumber.toUpperCase()
  )

  const destOldQty = destBatch ? destBatch.availableQty : 0

  if (destBatch) {
    destBatch.availableQty += quantity
    destBatch.purchaseRate = rate
    destBatch.sellingRate = Math.round(rate * 1.25) // Standard 25% margin default
    destBatch.updatedAt = now
    destBatch.status = computeBatchStatus(destBatch)
  } else {
    destBatch = {
      id: `batch_${destinationEntity.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      entity: destinationEntity,
      productName: sourceBatch.productName,
      sku: sourceBatch.sku,
      category: sourceBatch.category,
      batchNumber: sourceBatch.batchNumber,
      mfgDate: sourceBatch.mfgDate,
      expiryDate: sourceBatch.expiryDate,
      availableQty: quantity,
      reservedQty: 0,
      soldQty: 0,
      purchaseRate: rate,
      sellingRate: Math.round(rate * 1.25),
      hsnCode: sourceBatch.hsnCode,
      unit: sourceBatch.unit,
      taxRate: sourceBatch.taxRate,
      minStockLevel: sourceBatch.minStockLevel,
      status: 'In Stock',
      supplierName: sourceEntity === 'THIRD_PARTY' ? 'KIYAVA' : 'KARAN SINGH VAIDH (KSV)',
      createdAt: now,
      updatedAt: now
    }
    destBatch.status = computeBatchStatus(destBatch)
    batches.unshift(destBatch)
  }

  saveCentralStock(batches)

  // Financials
  const invoiceNo = `TRF-${sourceEntity.slice(0, 2)}-${destinationEntity.slice(0, 2)}-${Date.now().toString().slice(-5)}`
  const subtotal = quantity * rate
  const taxAmount = (subtotal * sourceBatch.taxRate) / 100
  const grandTotal = subtotal + taxAmount

  // Create Central Transaction
  const tx: InventoryTransaction = {
    id: `TX-TRF-${Date.now()}`,
    timestamp: now,
    sourceEntity,
    destinationEntity,
    type: 'STOCK_TRANSFER',
    productName: sourceBatch.productName,
    sku: sourceBatch.sku,
    batchNumber: sourceBatch.batchNumber,
    expiryDate: sourceBatch.expiryDate,
    quantity,
    unitPrice: rate,
    totalAmount: grandTotal,
    referenceInvoiceNo: invoiceNo,
    createdBy,
    notes: payload.notes || `Stock Transfer from ${sourceEntity} to ${destinationEntity}`
  }
  saveCentralTransaction(tx)

  // Audit Logs for both entities
  saveAuditLog({
    id: `AUD-SRC-${Date.now()}`,
    timestamp: now,
    user: createdBy,
    action: 'TRANSFER_STOCK_OUT',
    entity: sourceEntity,
    productName: sourceBatch.productName,
    batchNumber: sourceBatch.batchNumber,
    oldQty: sourceOldQty,
    changeQty: -quantity,
    newQty: sourceBatch.availableQty,
    reason: `Transfer to ${destinationEntity} (Inv #${invoiceNo})`,
    referenceInvoiceNo: invoiceNo
  })

  saveAuditLog({
    id: `AUD-DST-${Date.now()}`,
    timestamp: now,
    user: createdBy,
    action: 'TRANSFER_STOCK_IN',
    entity: destinationEntity,
    productName: sourceBatch.productName,
    batchNumber: sourceBatch.batchNumber,
    oldQty: destOldQty,
    changeQty: quantity,
    newQty: destBatch.availableQty,
    reason: `Transfer from ${sourceEntity} (Inv #${invoiceNo})`,
    referenceInvoiceNo: invoiceNo
  })

  // 3. AUTOMATICALLY CREATE SOURCE SALE INVOICE & DESTINATION PURCHASE INVOICE
  const sourceInvoiceStorageKey =
    sourceEntity === 'THIRD_PARTY'
      ? 'ksv_kiyava_invoices'
      : sourceEntity === 'KSV'
      ? 'ksv_app_invoices'
      : 'maxxi_app_invoices'

  const destInvoiceStorageKey =
    destinationEntity === 'THIRD_PARTY'
      ? 'ksv_kiyava_invoices'
      : destinationEntity === 'KSV'
      ? 'ksv_app_invoices'
      : 'maxxi_app_invoices'

  const sourceName = sourceEntity === 'THIRD_PARTY' ? 'KIYAVA' : sourceEntity === 'KSV' ? 'KARAN SINGH VAIDH (KSV)' : 'MAXXI PHARMA PVT. LTD.'
  const destName = destinationEntity === 'THIRD_PARTY' ? 'KIYAVA' : destinationEntity === 'KSV' ? 'KARAN SINGH VAIDH (KSV)' : 'MAXXI PHARMA PVT. LTD.'

  const saleInvoice: KiyavaInvoice = {
    id: `inv_sale_${Date.now()}`,
    type: 'SALE',
    invoiceNo,
    refNo: `PO-${Date.now().toString().slice(-4)}`,
    invoiceDate: now.split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    transport: 'Inter-Firm Transport',
    station: 'Solan',
    placeOfSupply: 'Himachal Pradesh (02)',
    placeOfSupplyCode: '02',
    reverseCharge: 'N',
    company: {
      id: `comp_${sourceEntity.toLowerCase()}`,
      name: sourceName,
      addressLine1: 'Main Plant Warehouse',
      city: 'Solan',
      state: 'Himachal Pradesh',
      stateCode: '02',
      pincode: '173206',
      gstin: '02DFBPS6121B1Z3',
      phone: '98160 12345',
      isDefault: true
    },
    buyer: {
      id: `party_${destinationEntity.toLowerCase()}`,
      name: destName,
      addressLine1: 'Receiving Depot',
      city: 'Solan',
      state: 'Himachal Pradesh',
      stateCode: '02',
      pincode: '173206',
      gstin: '02DFBPS6121B2Z2',
      phone: '98160 54321'
    },
    shippedToSameAsBilled: true,
    items: [
      {
        id: 'item_1',
        description: `${sourceBatch.productName} (Batch: ${sourceBatch.batchNumber}, Exp: ${sourceBatch.expiryDate})`,
        hsnSac: sourceBatch.hsnCode,
        quantity,
        unit: sourceBatch.unit,
        rate,
        taxRate: sourceBatch.taxRate,
        discountPercent: 0,
        amount: subtotal
      }
    ],
    subtotal,
    totalQuantity: quantity,
    isInterState: false,
    cgstAmount: taxAmount / 2,
    sgstAmount: taxAmount / 2,
    igstAmount: 0,
    totalTaxAmount: taxAmount,
    grandTotal,
    amountInWords: `Rupees ${Math.round(grandTotal)} Only`,
    taxInWords: `Rupees ${Math.round(taxAmount)} Only`,
    status: 'PAID',
    paymentMode: 'Internal Ledger Credit',
    notes: `Automated Supply Chain Transfer from ${sourceName} to ${destName}`,
    createdAt: now,
    updatedAt: now
  }

  const purchaseInvoice: KiyavaInvoice = {
    ...saleInvoice,
    id: `inv_pur_${Date.now()}`,
    type: 'PURCHASE',
    company: saleInvoice.buyer as unknown as CompanyProfile,
    buyer: saleInvoice.company as unknown as PartyProfile
  }

  appendInvoiceToLedger(sourceInvoiceStorageKey, saleInvoice)
  appendInvoiceToLedger(destInvoiceStorageKey, purchaseInvoice)

  return {
    success: true,
    message: `Transferred ${quantity} ${sourceBatch.unit} of ${sourceBatch.productName} from ${sourceEntity} to ${destinationEntity}.`,
    sourceInvoice: saleInvoice,
    destInvoice: purchaseInvoice
  }
}

// -------------------------------------------------------------------
// 3. CUSTOMER SALE FROM ENTITY (MAXXI PHARMA / KSV)
// -------------------------------------------------------------------
export interface CustomerSalePayload {
  entity: StockEntity
  batchId: string
  customerName: string
  customerPhone?: string
  quantity: number
  sellingPrice?: number
  discountPercent?: number
  createdBy?: string
}

export function executeCustomerSale(payload: CustomerSalePayload): {
  success: boolean
  message: string
  invoice?: KiyavaInvoice
} {
  const { entity, batchId, quantity, customerName } = payload
  if (quantity <= 0) return { success: false, message: 'Quantity must be greater than 0.' }

  const batches = getCentralStock()
  const batch = batches.find((b) => b.id === batchId && b.entity === entity)

  if (!batch) {
    return { success: false, message: 'Batch not found in inventory.' }
  }

  // Check Expiry (STRICT BLOCK EXPIRED SALE)
  const isExpired = new Date(batch.expiryDate).getTime() < new Date().getTime()
  if (isExpired) {
    return {
      success: false,
      message: `CRITICAL ACTION BLOCKED: Cannot sell expired product batch ${batch.batchNumber} (Expired on ${batch.expiryDate}).`
    }
  }

  // Check Stock Availability (STRICT PREVENT NEGATIVE STOCK)
  if (batch.availableQty < quantity) {
    return {
      success: false,
      message: `INSUFFICIENT STOCK: Available quantity in ${entity} for ${batch.productName} is ${batch.availableQty} ${batch.unit}. Requested: ${quantity}.`
    }
  }

  const now = new Date().toISOString()
  const createdBy = payload.createdBy || 'Dr. Vikas'
  const unitPrice = payload.sellingPrice || batch.sellingRate
  const discountPercent = payload.discountPercent || 0

  const oldQty = batch.availableQty

  // DEDUCT STOCK
  batch.availableQty -= quantity
  batch.soldQty += quantity
  batch.updatedAt = now
  batch.status = computeBatchStatus(batch)

  saveCentralStock(batches)

  // Financial Calculations
  const grossAmount = quantity * unitPrice
  const discountAmount = (grossAmount * discountPercent) / 100
  const subtotal = grossAmount - discountAmount
  const taxAmount = (subtotal * batch.taxRate) / 100
  const grandTotal = subtotal + taxAmount

  const invoiceNo = `CUST-INV-${entity.slice(0, 2)}-${Date.now().toString().slice(-5)}`

  // Central Transaction
  const tx: InventoryTransaction = {
    id: `TX-SALE-${Date.now()}`,
    timestamp: now,
    sourceEntity: entity,
    destinationEntity: 'CUSTOMER',
    type: 'SALE',
    productName: batch.productName,
    sku: batch.sku,
    batchNumber: batch.batchNumber,
    expiryDate: batch.expiryDate,
    quantity,
    unitPrice,
    totalAmount: grandTotal,
    referenceInvoiceNo: invoiceNo,
    createdBy,
    notes: `Customer Sale to ${customerName}`
  }
  saveCentralTransaction(tx)

  // Audit Log
  saveAuditLog({
    id: `AUD-SALE-${Date.now()}`,
    timestamp: now,
    user: createdBy,
    action: 'CUSTOMER_SALE_OUT',
    entity,
    productName: batch.productName,
    batchNumber: batch.batchNumber,
    oldQty,
    changeQty: -quantity,
    newQty: batch.availableQty,
    reason: `Customer Sale to ${customerName} (Inv #${invoiceNo})`,
    referenceInvoiceNo: invoiceNo
  })

  // Customer Sale Invoice
  const entityStorageKey =
    entity === 'THIRD_PARTY'
      ? 'ksv_kiyava_invoices'
      : entity === 'KSV'
      ? 'ksv_app_invoices'
      : 'maxxi_app_invoices'

  const entityName =
    entity === 'THIRD_PARTY'
      ? 'KIYAVA'
      : entity === 'KSV'
      ? 'KARAN SINGH VAIDH (KSV)'
      : 'MAXXI PHARMA PVT. LTD.'

  const saleInvoice: KiyavaInvoice = {
    id: `inv_cust_${Date.now()}`,
    type: 'SALE',
    invoiceNo,
    refNo: `CUST-${Date.now().toString().slice(-4)}`,
    invoiceDate: now.split('T')[0],
    dueDate: now.split('T')[0],
    transport: 'Counter Pickup / Courier',
    station: 'Solan',
    placeOfSupply: 'Himachal Pradesh (02)',
    placeOfSupplyCode: '02',
    reverseCharge: 'N',
    company: {
      id: `comp_${entity.toLowerCase()}`,
      name: entityName,
      addressLine1: 'Clinical & Pharmacy Counter',
      city: 'Solan',
      state: 'Himachal Pradesh',
      stateCode: '02',
      pincode: '173206',
      gstin: '02DFBPS6121B2Z2',
      phone: '98160 12345',
      isDefault: true
    },
    buyer: {
      id: `cust_${Date.now()}`,
      name: customerName,
      addressLine1: 'OPD / Patient Residence',
      city: 'Solan',
      state: 'Himachal Pradesh',
      stateCode: '02',
      pincode: '173206',
      gstin: 'URP',
      phone: payload.customerPhone || '98160 00000'
    },
    shippedToSameAsBilled: true,
    items: [
      {
        id: 'item_1',
        description: `${batch.productName} (Batch: ${batch.batchNumber}, Exp: ${batch.expiryDate})`,
        hsnSac: batch.hsnCode,
        quantity,
        unit: batch.unit,
        rate: unitPrice,
        taxRate: batch.taxRate,
        discountPercent,
        amount: subtotal
      }
    ],
    subtotal,
    totalQuantity: quantity,
    isInterState: false,
    cgstAmount: taxAmount / 2,
    sgstAmount: taxAmount / 2,
    igstAmount: 0,
    totalTaxAmount: taxAmount,
    grandTotal,
    amountInWords: `Rupees ${Math.round(grandTotal)} Only`,
    taxInWords: `Rupees ${Math.round(taxAmount)} Only`,
    status: 'PAID',
    paymentMode: 'Cash / Online UPI',
    notes: `Customer Patient Dispatch`,
    createdAt: now,
    updatedAt: now
  }

  appendInvoiceToLedger(entityStorageKey, saleInvoice)

  return {
    success: true,
    message: `Sold ${quantity} ${batch.unit} of ${batch.productName} to ${customerName}.`,
    invoice: saleInvoice
  }
}

// -------------------------------------------------------------------
// 4. STOCK RETURN (REVERSAL / RETURN TO UPSTREAM SUPPLIER)
// -------------------------------------------------------------------
export interface StockReturnPayload {
  sourceEntity: StockEntity // Entity returning the stock (e.g. MAXXI_PHARMA or KSV)
  targetEntity: StockEntity // Entity receiving return (e.g. KSV or THIRD_PARTY)
  batchId: string
  quantity: number
  reason: string
  referenceInvoiceNo?: string
  createdBy?: string
}

export function executeStockReturn(payload: StockReturnPayload): {
  success: boolean
  message: string
} {
  const { sourceEntity, targetEntity, batchId, quantity, reason } = payload
  if (quantity <= 0) return { success: false, message: 'Return quantity must be greater than 0.' }

  const batches = getCentralStock()
  const sourceBatch = batches.find((b) => b.id === batchId && b.entity === sourceEntity)

  if (!sourceBatch) return { success: false, message: 'Batch not found in source entity.' }
  if (sourceBatch.availableQty < quantity) {
    return { success: false, message: `Cannot return more quantity than available stock (${sourceBatch.availableQty}).` }
  }

  const now = new Date().toISOString()
  const createdBy = payload.createdBy || 'Dr. Vikas'

  // Decrease Source
  sourceBatch.availableQty -= quantity
  sourceBatch.updatedAt = now
  sourceBatch.status = computeBatchStatus(sourceBatch)

  // Increase Target
  let targetBatch = batches.find(
    (b) =>
      b.entity === targetEntity &&
      b.productName.toLowerCase() === sourceBatch.productName.toLowerCase() &&
      b.batchNumber.toUpperCase() === sourceBatch.batchNumber.toUpperCase()
  )

  if (targetBatch) {
    targetBatch.availableQty += quantity
    targetBatch.updatedAt = now
    targetBatch.status = computeBatchStatus(targetBatch)
  }

  saveCentralStock(batches)

  // Transaction
  saveCentralTransaction({
    id: `TX-RET-${Date.now()}`,
    timestamp: now,
    sourceEntity,
    destinationEntity: targetEntity,
    type: 'STOCK_RETURN',
    productName: sourceBatch.productName,
    sku: sourceBatch.sku,
    batchNumber: sourceBatch.batchNumber,
    expiryDate: sourceBatch.expiryDate,
    quantity,
    unitPrice: sourceBatch.purchaseRate,
    totalAmount: quantity * sourceBatch.purchaseRate,
    referenceInvoiceNo: payload.referenceInvoiceNo,
    createdBy,
    notes: `Stock Return: ${reason}`
  })

  // Audit Logs
  saveAuditLog({
    id: `AUD-RET-${Date.now()}`,
    timestamp: now,
    user: createdBy,
    action: 'STOCK_RETURN',
    entity: sourceEntity,
    productName: sourceBatch.productName,
    batchNumber: sourceBatch.batchNumber,
    oldQty: sourceBatch.availableQty + quantity,
    changeQty: -quantity,
    newQty: sourceBatch.availableQty,
    reason: `Stock Return to ${targetEntity}: ${reason}`,
    referenceInvoiceNo: payload.referenceInvoiceNo
  })

  return { success: true, message: `Successfully returned ${quantity} ${sourceBatch.unit} to ${targetEntity}.` }
}

// -------------------------------------------------------------------
// 5. ADMIN STOCK ADJUSTMENT
// -------------------------------------------------------------------
export interface StockAdjustmentPayload {
  batchId: string
  adjustmentType: 'INCREASE' | 'DECREASE'
  quantity: number
  reason: string
  createdBy?: string
}

export function executeStockAdjustment(payload: StockAdjustmentPayload): {
  success: boolean
  message: string
} {
  const { batchId, adjustmentType, quantity, reason } = payload
  if (quantity <= 0) return { success: false, message: 'Adjustment quantity must be greater than 0.' }
  if (!reason.trim()) return { success: false, message: 'Adjustment reason is required.' }

  const batches = getCentralStock()
  const batch = batches.find((b) => b.id === batchId)

  if (!batch) return { success: false, message: 'Batch not found.' }

  if (adjustmentType === 'DECREASE' && batch.availableQty < quantity) {
    return { success: false, message: `Cannot decrease stock below 0. Current stock: ${batch.availableQty}.` }
  }

  const now = new Date().toISOString()
  const createdBy = payload.createdBy || 'Dr. Vikas'
  const oldQty = batch.availableQty
  const changeQty = adjustmentType === 'INCREASE' ? quantity : -quantity

  batch.availableQty += changeQty
  batch.updatedAt = now
  batch.status = computeBatchStatus(batch)

  saveCentralStock(batches)

  // Transaction
  saveCentralTransaction({
    id: `TX-ADJ-${Date.now()}`,
    timestamp: now,
    sourceEntity: batch.entity,
    destinationEntity: batch.entity,
    type: 'STOCK_ADJUSTMENT',
    productName: batch.productName,
    sku: batch.sku,
    batchNumber: batch.batchNumber,
    expiryDate: batch.expiryDate,
    quantity: Math.abs(changeQty),
    unitPrice: batch.purchaseRate,
    totalAmount: Math.abs(changeQty) * batch.purchaseRate,
    createdBy,
    notes: `Manual Stock Adjustment (${adjustmentType}): ${reason}`
  })

  // Audit Log
  saveAuditLog({
    id: `AUD-ADJ-${Date.now()}`,
    timestamp: now,
    user: createdBy,
    action: `MANUAL_ADJUSTMENT_${adjustmentType}`,
    entity: batch.entity,
    productName: batch.productName,
    batchNumber: batch.batchNumber,
    oldQty,
    changeQty,
    newQty: batch.availableQty,
    reason: `Manual Adjustment: ${reason}`
  })

  return { success: true, message: `Stock for ${batch.productName} (${batch.batchNumber}) adjusted to ${batch.availableQty} ${batch.unit}.` }
}

// -------------------------------------------------------------------
// 6. INVOICE TRACEABILITY CHAIN (Customer -> Maxxi -> KSV -> Third Party -> Supplier)
// -------------------------------------------------------------------
export function getInvoiceTraceabilityChain(batchNumber: string): TraceabilityStep[] {
  const txs = getCentralTransactions()
  const matchingTxs = txs.filter((t) => t.batchNumber.toUpperCase() === batchNumber.toUpperCase())

  // Sort chronological
  matchingTxs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return matchingTxs.map((tx, index) => {
    let stage: TraceabilityStep['stage'] = 'CUSTOMER_SALE'
    if (tx.type === 'PURCHASE') stage = 'EXTERNAL_SUPPLIER_PURCHASE'
    else if (tx.sourceEntity === 'THIRD_PARTY' && tx.destinationEntity === 'KSV') stage = 'THIRD_PARTY_STOCK'
    else if (tx.sourceEntity === 'KSV' && tx.destinationEntity === 'MAXXI_PHARMA') stage = 'KSV_TRANSFER'
    else if (tx.destinationEntity === 'MAXXI_PHARMA') stage = 'MAXXI_TRANSFER'

    return {
      stepIndex: index + 1,
      stage,
      entity: tx.sourceEntity,
      action: `${tx.type} (${tx.sourceEntity} ➔ ${tx.destinationEntity})`,
      invoiceNo: tx.referenceInvoiceNo,
      partyName: tx.notes || `${tx.sourceEntity} to ${tx.destinationEntity}`,
      date: tx.timestamp.split('T')[0],
      batchNumber: tx.batchNumber,
      quantity: tx.quantity,
      amount: tx.totalAmount
    }
  })
}
