export type FirmType = 'kiyba' | 'ksv' | 'maxxi';

export interface FirmInfo {
  id: FirmType;
  name: string;
  shortName: string;
  fullName: string;
  tagline: string;
  badgeColor: string;
  accentGradient: string;
  borderHover: string;
  description: string;
  iconName: string;
}

export const FIRMS: Record<FirmType, FirmInfo> = {
  kiyba: {
    id: 'kiyba',
    name: 'Kiyba',
    shortName: 'Kiyba',
    fullName: 'Kiyba Herbal & Wellness',
    tagline: 'Herbal Extracts, Tonics & Wellness Formulations',
    badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50',
    accentGradient: 'from-indigo-600 via-indigo-500 to-purple-600',
    borderHover: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
    description: 'Pure herbal formulations, liquid extracts, wellness syrups, and immunity boosters.',
    iconName: 'Sparkles',
  },
  ksv: {
    id: 'ksv',
    name: 'Karan Singh Vaidh',
    shortName: 'KSV',
    fullName: 'Karan Singh Vaidh (KSV) Ayurvedic',
    tagline: 'Classical Ayurvedic Medicine & Signature Treatment Kits',
    badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
    accentGradient: 'from-emerald-600 via-teal-500 to-emerald-700',
    borderHover: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    description: 'Specialized Ayurvedic treatment kits for Gallstone, Kidney Stone, Joint Pain, Liver, and Rasayanas.',
    iconName: 'Leaf',
  },
  maxxi: {
    id: 'maxxi',
    name: 'Maxxi Pharma',
    shortName: 'Maxxi',
    fullName: 'Maxxi Pharma Healthcare',
    tagline: 'Modern Pharmaceutical Tablets, Syrups & Clinical Formulations',
    badgeColor: 'bg-sky-50 text-sky-600 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50',
    accentGradient: 'from-sky-600 via-blue-500 to-cyan-600',
    borderHover: 'hover:border-sky-500/40 hover:shadow-sky-500/10',
    description: 'Standardized pharmaceutical tablets, pediatric drops, capsules, and external third-party batches.',
    iconName: 'Pill',
  },
};

export interface InventoryItem {
  id: string;
  name: string;
  firm: FirmType;
  category: 'Kit' | 'Tablet' | 'Syrup' | 'Churna' | 'Oil' | 'Capsule' | 'Drops' | 'Ointment' | 'Raw Material';
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  plantStock: number; // Units in central manufacturing plant/warehouse
  opdStock: number;   // Units at OPD counter ready for billing
  inTransit: number;  // Units currently in transit from Plant to OPD
  minReorderLevel: number;
  unitPrice: number;  // Selling/MRP price
  costPrice: number;  // Manufacturing/Procurement cost
  dosageForm: string; // e.g. "30 Days Course", "60 Tablets", "200 ml Bottle", "100g Powder"
  description?: string;
  storageLocation: string; // e.g. "Rack A-04", "Cold Storage B", "OPD Shelf 2"
  status: 'In Stock' | 'Low Stock' | 'Critical' | 'Expiring Soon' | 'Out of Stock';
  createdAt: string;
  updatedAt: string;
}

export interface StockTransfer {
  id: string;
  itemId: string;
  itemName: string;
  firm: FirmType;
  fromLocation: 'Plant / Warehouse' | 'OPD Clinic Counter';
  toLocation: 'Plant / Warehouse' | 'OPD Clinic Counter';
  quantity: number;
  transferDate: string;
  status: 'COMPLETED' | 'IN_TRANSIT' | 'CANCELLED';
  notes: string;
  approvedBy?: string;
}

export const INITIAL_INVENTORY: InventoryItem[] = [
  // --- KARAN SINGH VAIDH (KSV) ITEMS ---
  {
    id: 'ksv-001',
    name: 'Gallstone Dissolution Kit (30 Days)',
    firm: 'ksv',
    category: 'Kit',
    batchNumber: 'KSV-GS-2026-08',
    mfgDate: '2026-05-10',
    expiryDate: '2028-05-10',
    plantStock: 340,
    opdStock: 85,
    inTransit: 20,
    minReorderLevel: 25,
    unitPrice: 4200,
    costPrice: 1850,
    dosageForm: 'Complete 30-Day Kit (4 Medicines)',
    description: 'Proprietary herbal decoctions and rasayanas for natural gallstone breakdown.',
    storageLocation: 'Plant Unit 1 - Bay A1',
    status: 'In Stock',
    createdAt: '2026-05-12T10:00:00Z',
    updatedAt: '2026-08-01T14:30:00Z',
  },
  {
    id: 'ksv-002',
    name: 'Kidney Stone Flusher Kit (30 Days)',
    firm: 'ksv',
    category: 'Kit',
    batchNumber: 'KSV-KS-2026-04',
    mfgDate: '2026-04-15',
    expiryDate: '2028-04-15',
    plantStock: 480,
    opdStock: 12,
    inTransit: 15,
    minReorderLevel: 30,
    unitPrice: 3800,
    costPrice: 1600,
    dosageForm: 'Complete 30-Day Kit',
    description: 'Herbal diuretic and lithotriptic formula for kidney stones up to 14mm.',
    storageLocation: 'Plant Unit 1 - Bay A2',
    status: 'Low Stock',
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-08-05T11:00:00Z',
  },
  {
    id: 'ksv-003',
    name: 'Sandhi-Vata Joint Pain Kit',
    firm: 'ksv',
    category: 'Kit',
    batchNumber: 'KSV-JP-2026-06',
    mfgDate: '2026-06-01',
    expiryDate: '2028-06-01',
    plantStock: 290,
    opdStock: 64,
    inTransit: 10,
    minReorderLevel: 20,
    unitPrice: 3500,
    costPrice: 1450,
    dosageForm: 'Kit (Tablets + Oil + Lep)',
    description: 'Ayurvedic anti-inflammatory formulation for knee, back and arthritis pain.',
    storageLocation: 'Plant Unit 1 - Bay B1',
    status: 'In Stock',
    createdAt: '2026-06-05T09:00:00Z',
    updatedAt: '2026-08-02T16:00:00Z',
  },
  {
    id: 'ksv-004',
    name: 'Yakrit-Shodhan Liver Care Churna',
    firm: 'ksv',
    category: 'Churna',
    batchNumber: 'KSV-LC-2026-07',
    mfgDate: '2026-07-02',
    expiryDate: '2028-07-02',
    plantStock: 650,
    opdStock: 110,
    inTransit: 0,
    minReorderLevel: 40,
    unitPrice: 650,
    costPrice: 220,
    dosageForm: '200g Powder Jar',
    description: 'Classical churna for fatty liver, sluggish metabolism, and enzyme detox.',
    storageLocation: 'Plant Unit 1 - Churna Section',
    status: 'In Stock',
    createdAt: '2026-07-05T10:00:00Z',
    updatedAt: '2026-08-08T12:00:00Z',
  },
  {
    id: 'ksv-005',
    name: 'Maha-Vishgarbha Taila (Pain Oil)',
    firm: 'ksv',
    category: 'Oil',
    batchNumber: 'KSV-VT-2026-03',
    mfgDate: '2026-03-10',
    expiryDate: '2029-03-10',
    plantStock: 820,
    opdStock: 140,
    inTransit: 30,
    minReorderLevel: 50,
    unitPrice: 450,
    costPrice: 160,
    dosageForm: '100ml Glass Bottle',
    description: 'Medicated herbal oil boiled 7 times for deep muscular and joint penetration.',
    storageLocation: 'Plant Unit 1 - Oil Section',
    status: 'In Stock',
    createdAt: '2026-03-15T11:00:00Z',
    updatedAt: '2026-08-04T10:00:00Z',
  },
  {
    id: 'ksv-006',
    name: 'Arsha-Mukti Piles Care Kit',
    firm: 'ksv',
    category: 'Kit',
    batchNumber: 'KSV-PC-2026-05',
    mfgDate: '2026-05-18',
    expiryDate: '2028-05-18',
    plantStock: 190,
    opdStock: 8,
    inTransit: 15,
    minReorderLevel: 20,
    unitPrice: 2900,
    costPrice: 1100,
    dosageForm: 'Kit (Tablets + Ointment + Fiber)',
    description: 'Fast acting Ayurvedic treatment for bleeding and non-bleeding hemorrhoids.',
    storageLocation: 'Plant Unit 1 - Bay B3',
    status: 'Low Stock',
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-08-07T15:00:00Z',
  },

  // --- KIYBA ITEMS ---
  {
    id: 'kyb-001',
    name: 'Kiyba Tri-Extract Immunity Tonic',
    firm: 'kiyba',
    category: 'Syrup',
    batchNumber: 'KYB-IM-2026-06',
    mfgDate: '2026-06-15',
    expiryDate: '2028-06-15',
    plantStock: 520,
    opdStock: 95,
    inTransit: 25,
    minReorderLevel: 30,
    unitPrice: 799,
    costPrice: 310,
    dosageForm: '450 ml Glass Bottle',
    description: 'Giloy, Ashwagandha, and Tulsi concentrated nano-extract for vital defense.',
    storageLocation: 'Kiyba Warehouse - Rack 1A',
    status: 'In Stock',
    createdAt: '2026-06-18T10:00:00Z',
    updatedAt: '2026-08-06T14:00:00Z',
  },
  {
    id: 'kyb-002',
    name: 'Kiyba Kesha-Glow Pure Herbal Drops',
    firm: 'kiyba',
    category: 'Drops',
    batchNumber: 'KYB-KG-2026-04',
    mfgDate: '2026-04-10',
    expiryDate: '2027-10-10',
    plantStock: 310,
    opdStock: 48,
    inTransit: 0,
    minReorderLevel: 25,
    unitPrice: 950,
    costPrice: 380,
    dosageForm: '50 ml Dropper Bottle',
    description: 'Biotin-fortified Bhringraj and Amla sublingual drops for hair rejuvenation.',
    storageLocation: 'Kiyba Warehouse - Rack 2B',
    status: 'In Stock',
    createdAt: '2026-04-15T12:00:00Z',
    updatedAt: '2026-08-03T11:00:00Z',
  },
  {
    id: 'kyb-003',
    name: 'Kiyba Madhu-Niyantran Glyco Capsules',
    firm: 'kiyba',
    category: 'Capsule',
    batchNumber: 'KYB-MN-2026-07',
    mfgDate: '2026-07-01',
    expiryDate: '2028-07-01',
    plantStock: 440,
    opdStock: 72,
    inTransit: 20,
    minReorderLevel: 35,
    unitPrice: 1100,
    costPrice: 420,
    dosageForm: '60 Veg Capsules (1000mg)',
    description: 'Gymnema Sylvestre + Karela standardized extract for healthy HbA1c levels.',
    storageLocation: 'Kiyba Warehouse - Rack 3A',
    status: 'In Stock',
    createdAt: '2026-07-03T09:00:00Z',
    updatedAt: '2026-08-07T10:00:00Z',
  },
  {
    id: 'kyb-004',
    name: 'Kiyba Deep Detox Digestive Elixir',
    firm: 'kiyba',
    category: 'Syrup',
    batchNumber: 'KYB-DD-2026-02',
    mfgDate: '2026-02-14',
    expiryDate: '2026-11-14',
    plantStock: 180,
    opdStock: 5,
    inTransit: 0,
    minReorderLevel: 25,
    unitPrice: 650,
    costPrice: 240,
    dosageForm: '300 ml Bottle',
    description: 'Enzyme-rich fermented herbal tonic for hyperacidity, gas and bowel regularity.',
    storageLocation: 'Kiyba Warehouse - Rack 1C',
    status: 'Expiring Soon',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-08-05T09:00:00Z',
  },
  {
    id: 'kyb-005',
    name: 'Kiyba Skin-Radiance Manjistha Capsules',
    firm: 'kiyba',
    category: 'Capsule',
    batchNumber: 'KYB-SR-2026-05',
    mfgDate: '2026-05-22',
    expiryDate: '2028-05-22',
    plantStock: 390,
    opdStock: 55,
    inTransit: 10,
    minReorderLevel: 20,
    unitPrice: 850,
    costPrice: 320,
    dosageForm: '60 Capsules',
    description: 'Blood purifier and pigment correction formula for clear luminous skin.',
    storageLocation: 'Kiyba Warehouse - Rack 3B',
    status: 'In Stock',
    createdAt: '2026-05-25T11:00:00Z',
    updatedAt: '2026-08-02T13:00:00Z',
  },

  // --- MAXXI PHARMA ITEMS ---
  {
    id: 'max-001',
    name: 'Maxxi-Cal D3 Forte Tablets',
    firm: 'maxxi',
    category: 'Tablet',
    batchNumber: 'MXP-CD-2026-05',
    mfgDate: '2026-05-01',
    expiryDate: '2028-05-01',
    plantStock: 1200,
    opdStock: 210,
    inTransit: 50,
    minReorderLevel: 60,
    unitPrice: 320,
    costPrice: 110,
    dosageForm: 'Strip of 15 Tablets (Box of 10)',
    description: 'Calcium Citrate Malate + Vitamin D3 + Zinc + Magnesium bone density booster.',
    storageLocation: 'Maxxi Pharma Bin M-01',
    status: 'In Stock',
    createdAt: '2026-05-05T08:00:00Z',
    updatedAt: '2026-08-04T12:00:00Z',
  },
  {
    id: 'max-002',
    name: 'Maxxi-Neuro Methylcobalamin 1500mcg',
    firm: 'maxxi',
    category: 'Tablet',
    batchNumber: 'MXP-NM-2026-06',
    mfgDate: '2026-06-10',
    expiryDate: '2028-06-10',
    plantStock: 860,
    opdStock: 150,
    inTransit: 30,
    minReorderLevel: 40,
    unitPrice: 480,
    costPrice: 180,
    dosageForm: 'Strip of 10 Sublingual Tabs',
    description: 'Bio-active Vitamin B12 + Alpha Lipoic Acid for peripheral neuropathy.',
    storageLocation: 'Maxxi Pharma Bin M-04',
    status: 'In Stock',
    createdAt: '2026-06-12T10:00:00Z',
    updatedAt: '2026-08-06T15:00:00Z',
  },
  {
    id: 'max-003',
    name: 'Maxxi-Zyme Multi-Enzyme Digestive Syrup',
    firm: 'maxxi',
    category: 'Syrup',
    batchNumber: 'MXP-MZ-2026-04',
    mfgDate: '2026-04-18',
    expiryDate: '2027-10-18',
    plantStock: 640,
    opdStock: 18,
    inTransit: 40,
    minReorderLevel: 35,
    unitPrice: 210,
    costPrice: 75,
    dosageForm: '200 ml Bottle (Pineapple flavor)',
    description: 'Fungal Diastase + Pepsin appetite and digestion stimulant.',
    storageLocation: 'Maxxi Pharma Bin S-02',
    status: 'Low Stock',
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-08-08T11:30:00Z',
  },
  {
    id: 'max-004',
    name: 'Maxxi-Heal Anti-Inflammatory Gel',
    firm: 'maxxi',
    category: 'Ointment',
    batchNumber: 'MXP-MH-2026-07',
    mfgDate: '2026-07-15',
    expiryDate: '2028-07-15',
    plantStock: 950,
    opdStock: 180,
    inTransit: 0,
    minReorderLevel: 50,
    unitPrice: 185,
    costPrice: 62,
    dosageForm: '50g Lami-tube',
    description: 'Diclofenac Diethylamine, Methyl Salicylate, Menthol & Linseed Oil pain gel.',
    storageLocation: 'Maxxi Pharma Bin G-01',
    status: 'In Stock',
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-08-01T17:00:00Z',
  },
  {
    id: 'max-005',
    name: 'Maxxi-Cough Relief Herbal-Pharma Blend',
    firm: 'maxxi',
    category: 'Syrup',
    batchNumber: 'MXP-CR-2026-03',
    mfgDate: '2026-03-01',
    expiryDate: '2026-10-01',
    plantStock: 420,
    opdStock: 4,
    inTransit: 25,
    minReorderLevel: 30,
    unitPrice: 195,
    costPrice: 68,
    dosageForm: '100 ml Honey-Based Syrup',
    description: 'Non-drowsy bronchial soothing formula for wet and dry cough.',
    storageLocation: 'Maxxi Pharma Bin S-05',
    status: 'Expiring Soon',
    createdAt: '2026-03-05T09:00:00Z',
    updatedAt: '2026-08-07T14:00:00Z',
  },
];

export const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: 'TRF-1001',
    itemId: 'ksv-001',
    itemName: 'Gallstone Dissolution Kit (30 Days)',
    firm: 'ksv',
    fromLocation: 'Plant / Warehouse',
    toLocation: 'OPD Clinic Counter',
    quantity: 20,
    transferDate: '2026-08-09T09:30:00Z',
    status: 'IN_TRANSIT',
    notes: 'Urgent batch replenishment for morning OPD consultations.',
    approvedBy: 'Dr. Vikas',
  },
  {
    id: 'TRF-1002',
    itemId: 'max-001',
    itemName: 'Maxxi-Cal D3 Forte Tablets',
    firm: 'maxxi',
    fromLocation: 'Plant / Warehouse',
    toLocation: 'OPD Clinic Counter',
    quantity: 50,
    transferDate: '2026-08-09T14:15:00Z',
    status: 'IN_TRANSIT',
    notes: 'Stock refill for orthopaedic patients.',
    approvedBy: 'Dr. Vikas',
  },
  {
    id: 'TRF-1003',
    itemId: 'kyb-001',
    itemName: 'Kiyba Tri-Extract Immunity Tonic',
    firm: 'kiyba',
    fromLocation: 'Plant / Warehouse',
    toLocation: 'OPD Clinic Counter',
    quantity: 25,
    transferDate: '2026-08-08T11:00:00Z',
    status: 'COMPLETED',
    notes: 'Seasonal wellness promotion stock dispatched and acknowledged.',
    approvedBy: 'Dr. Vikas',
  },
  {
    id: 'TRF-1004',
    itemId: 'ksv-002',
    itemName: 'Kidney Stone Flusher Kit (30 Days)',
    firm: 'ksv',
    fromLocation: 'Plant / Warehouse',
    toLocation: 'OPD Clinic Counter',
    quantity: 15,
    transferDate: '2026-08-08T16:45:00Z',
    status: 'IN_TRANSIT',
    notes: 'OPD counter ran low (<15 kits). Dispatched batch.',
    approvedBy: 'Dr. Vikas',
  },
];

const INVENTORY_STORAGE_KEY = 'ksv_crm_multi_firm_inventory';
const TRANSFERS_STORAGE_KEY = 'ksv_crm_multi_firm_transfers';
export const INVENTORY_CHANGE_EVENT = 'ksv_inventory_updated';

// Helper function to load inventory
export function getStoredInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return INITIAL_INVENTORY;
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(INITIAL_INVENTORY));
      return INITIAL_INVENTORY;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read inventory from localStorage', e);
    return INITIAL_INVENTORY;
  }
}

// Helper function to save inventory
export function saveInventory(items: InventoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(INVENTORY_CHANGE_EVENT, { detail: { items } }));
  } catch (e) {
    console.error('Failed to save inventory to localStorage', e);
  }
}

// Helper function to load transfers
export function getStoredTransfers(): StockTransfer[] {
  if (typeof window === 'undefined') return INITIAL_TRANSFERS;
  try {
    const raw = localStorage.getItem(TRANSFERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(INITIAL_TRANSFERS));
      return INITIAL_TRANSFERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read transfers from localStorage', e);
    return INITIAL_TRANSFERS;
  }
}

// Helper function to save transfers
export function saveTransfers(transfers: StockTransfer[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers));
    window.dispatchEvent(new CustomEvent(INVENTORY_CHANGE_EVENT, { detail: { transfers } }));
  } catch (e) {
    console.error('Failed to save transfers to localStorage', e);
  }
}

// Compute auto status based on stock levels and expiry
export function computeItemStatus(item: InventoryItem): InventoryItem['status'] {
  const totalStock = item.plantStock + item.opdStock;
  if (totalStock === 0) return 'Out of Stock';

  // Check expiry within 90 days
  const expiry = new Date(item.expiryDate);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);

  if (diffDays <= 90 && diffDays > 0) return 'Expiring Soon';
  if (diffDays <= 0) return 'Critical';

  if (item.opdStock <= item.minReorderLevel * 0.4) return 'Critical';
  if (item.opdStock <= item.minReorderLevel) return 'Low Stock';

  return 'In Stock';
}

// Add or update an inventory item
export function upsertInventoryItem(itemData: Partial<InventoryItem> & { name: string; firm: FirmType }): InventoryItem {
  const current = getStoredInventory();
  const now = new Date().toISOString();

  let updatedItem: InventoryItem;

  if (itemData.id) {
    // Update
    current.forEach((item, index) => {
      if (item.id === itemData.id) {
        updatedItem = {
          ...item,
          ...itemData,
          updatedAt: now,
        } as InventoryItem;

        // Auto compute status
        updatedItem.status = computeItemStatus(updatedItem);
        current[index] = updatedItem;
      }
    });
  } else {
    // Create new
    const id = `${itemData.firm}-${Date.now().toString(36)}`;
    updatedItem = {
      id,
      name: itemData.name,
      firm: itemData.firm,
      category: itemData.category || 'Tablet',
      batchNumber: itemData.batchNumber || `${itemData.firm.toUpperCase()}-B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      mfgDate: itemData.mfgDate || new Date().toISOString().split('T')[0],
      expiryDate: itemData.expiryDate || new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0],
      plantStock: Number(itemData.plantStock) || 0,
      opdStock: Number(itemData.opdStock) || 0,
      inTransit: Number(itemData.inTransit) || 0,
      minReorderLevel: Number(itemData.minReorderLevel) || 20,
      unitPrice: Number(itemData.unitPrice) || 500,
      costPrice: Number(itemData.costPrice) || 200,
      dosageForm: itemData.dosageForm || 'Standard Pack',
      description: itemData.description || '',
      storageLocation: itemData.storageLocation || 'Main Warehouse',
      status: 'In Stock',
      createdAt: now,
      updatedAt: now,
    };
    updatedItem.status = computeItemStatus(updatedItem);
    current.unshift(updatedItem);
  }

  saveInventory(current);
  return updatedItem!;
}

// Execute stock transfer between Plant and OPD
export function executeStockTransfer(
  itemId: string,
  quantity: number,
  from: 'Plant / Warehouse' | 'OPD Clinic Counter',
  to: 'Plant / Warehouse' | 'OPD Clinic Counter',
  notes: string = ''
): { success: boolean; message: string } {
  if (quantity <= 0) return { success: false, message: 'Transfer quantity must be greater than 0' };

  const inventory = getStoredInventory();
  const item = inventory.find(i => i.id === itemId);
  if (!item) return { success: false, message: 'Item not found in inventory' };

  if (from === 'Plant / Warehouse') {
    if (item.plantStock < quantity) {
      return { success: false, message: `Insufficient stock in Plant. Available: ${item.plantStock}` };
    }
    item.plantStock -= quantity;
    item.opdStock += quantity;
  } else {
    if (item.opdStock < quantity) {
      return { success: false, message: `Insufficient stock in OPD Counter. Available: ${item.opdStock}` };
    }
    item.opdStock -= quantity;
    item.plantStock += quantity;
  }

  item.updatedAt = new Date().toISOString();
  item.status = computeItemStatus(item);

  // Save new transfer log
  const transfers = getStoredTransfers();
  const newTransfer: StockTransfer = {
    id: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
    itemId: item.id,
    itemName: item.name,
    firm: item.firm,
    fromLocation: from,
    toLocation: to,
    quantity,
    transferDate: new Date().toISOString(),
    status: 'COMPLETED',
    notes: notes || `Direct transfer from ${from} to ${to}`,
    approvedBy: 'Dr. Vikas',
  };

  transfers.unshift(newTransfer);

  saveInventory(inventory);
  saveTransfers(transfers);

  return { success: true, message: `Successfully transferred ${quantity} units of ${item.name}` };
}

// Direct stock adjustment
export function adjustStock(itemId: string, field: 'plantStock' | 'opdStock', delta: number, reason: string): boolean {
  const inventory = getStoredInventory();
  const item = inventory.find(i => i.id === itemId);
  if (!item) return false;

  const currentVal = item[field];
  const newVal = Math.max(0, currentVal + delta);
  item[field] = newVal;
  item.updatedAt = new Date().toISOString();
  item.status = computeItemStatus(item);

  saveInventory(inventory);
  return true;
}

// Reset data to default initial state
export function resetInventoryToDefault(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(INITIAL_INVENTORY));
  localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(INITIAL_TRANSFERS));
  window.dispatchEvent(new CustomEvent(INVENTORY_CHANGE_EVENT, { detail: { items: INITIAL_INVENTORY } }));
}
