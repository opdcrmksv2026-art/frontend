export interface InvoiceProduct {
  name: string;
  hsnCode?: string;
  quantity: string | number;
  rate?: number | string;
  taxRate?: number;
}

export interface InvoiceTreatment {
  price?: string | number;
  quantity?: string | number;
  products?: InvoiceProduct[];
  kitName?: string;
}

export interface GSTCalculationResult {
  grossAmount: number;
  grossMedicines: number;
  consultancyCharges: number;
  discountApplied: number;
  discountedConsultancy: number;
  medicineTaxableValue: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  totalBeforeRoundOff: number;
  roundOff: number;
  grandTotal: number;
  originalInvoiceTotal: number;
  isInterState: boolean;
  hsnSummary: {
    hsn: string;
    taxableValue: number;
    taxRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
  }[];
  lines: {
    name: string;
    hsnCode: string;
    qty: number;
    rate: number;
    inclusiveRate?: number;
    grossAmount: number;
    lineDiscount: number;
    taxableValue: number;
    taxRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
    finalAmount: number;
    disease?: string;
    treatmentIdx?: number;
    isConsultation?: boolean;
  }[];
}

export const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

export const STATE_GST_CODES: Record<string, string> = {
  "Jammu and Kashmir": "01",
  "Himachal Pradesh": "02",
  "Punjab": "03",
  "Chandigarh": "04",
  "Uttarakhand": "05",
  "Haryana": "06",
  "Delhi": "07",
  "Rajasthan": "08",
  "Uttar Pradesh": "09",
  "Bihar": "10",
  "Sikkim": "11",
  "Arunachal Pradesh": "12",
  "Nagaland": "13",
  "Manipur": "14",
  "Mizoram": "15",
  "Tripura": "16",
  "Meghalaya": "17",
  "Assam": "18",
  "West Bengal": "19",
  "Jharkhand": "20",
  "Odisha": "21",
  "Chhattisgarh": "22",
  "Madhya Pradesh": "23",
  "Gujarat": "24",
  "Maharashtra": "27",
  "Andhra Pradesh": "37",
  "Karnataka": "29",
  "Goa": "30",
  "Kerala": "32",
  "Tamil Nadu": "33",
  "Telangana": "36",
  "Ladakh": "38",
  "Other": ""
};

export const getStateCode = (stateName?: string): string => {
  if (!stateName) return "02";
  const trimmed = stateName.trim();
  if (trimmed.toLowerCase() === "other") return "";
  for (const [name, code] of Object.entries(STATE_GST_CODES)) {
    if (name.toLowerCase() === trimmed.toLowerCase()) return code;
  }
  return STATE_GST_CODES[trimmed] ?? "";
};

export function isInterStateTransaction(
  buyerState: string,
  buyerStateCode?: string,
  companyState = "Himachal Pradesh",
  companyStateCode = "02"
): boolean {
  const cleanBuyer = (buyerState || "").trim().toLowerCase();
  const cleanCompany = (companyState || "").trim().toLowerCase();

  // 1. If buyer state is explicitly Himachal Pradesh, intra-state (CGST + SGST)
  if (cleanBuyer === "himachal pradesh" || cleanBuyer === "hp") {
    return false;
  }

  // 2. If buyer state is any other state (e.g. Haryana, Punjab, Delhi), inter-state (IGST)
  if (cleanBuyer && cleanBuyer !== cleanCompany) {
    return true;
  }

  // 3. Check state code derived or provided
  const code = (buyerStateCode || getStateCode(buyerState)).trim();
  if (code && code !== "02") {
    return true;
  }

  return false;
}

export function calculateGSTInvoice(
  treatments: InvoiceTreatment[],
  discountApplied: number,
  consultancyCharges: number,
  companyState: string,
  buyerState: string,
  isGstBilling: boolean,
  buyerStateCode?: string
): GSTCalculationResult {
  const parsedDiscount = Math.max(0, Math.abs(parseFloat(discountApplied?.toString() || "0") || 0));
  const parsedConsultancy = Math.max(0, Math.abs(parseFloat(consultancyCharges?.toString() || "0") || 0));

  let grossMedicines = 0;
  const flatProducts: any[] = [];

  treatments.forEach((t, idx) => {
    const tQty = parseFloat(t.quantity?.toString() || "1");
    if (t.products && t.products.length > 0) {
      t.products.forEach((p) => {
        const pQty = parseFloat(p.quantity?.toString() || "1");
        const rate = p.rate !== undefined && p.rate !== null 
          ? parseFloat(p.rate.toString()) 
          : parseFloat(t.price?.toString() || "0") / pQty;

        const amount = round2(pQty * rate);
        flatProducts.push({
          name: p.name,
          hsnCode: p.hsnCode || "-",
          qty: pQty,
          rate: rate,
          inclusiveRate: rate,
          amount: amount,
          taxRate: p.taxRate || 0,
          disease: (t as any).disease || "General Checkup",
          treatmentIdx: idx,
        });
        grossMedicines = round2(grossMedicines + amount);
      });
    } else {
      const rate = parseFloat(t.price?.toString() || "0");
      const amount = round2(tQty * rate);
      flatProducts.push({
        name: t.kitName || "General Treatment",
        hsnCode: "-",
        qty: tQty,
        rate: rate,
        inclusiveRate: rate,
        amount: amount,
        taxRate: 0,
        disease: (t as any).disease || "General Checkup",
        treatmentIdx: idx,
      });
      grossMedicines = round2(grossMedicines + amount);
    }
  });

  grossMedicines = round2(grossMedicines);

  // Add consultation line if present
  let totalPreGstBase = grossMedicines;
  if (parsedConsultancy > 0) {
    flatProducts.push({
      name: "Consultation Charges",
      hsnCode: "9993",
      qty: 1,
      rate: parsedConsultancy,
      inclusiveRate: parsedConsultancy,
      amount: parsedConsultancy,
      taxRate: 0,
      disease: "Consultation",
      treatmentIdx: -1,
      isConsultation: true,
    });
    totalPreGstBase = round2(totalPreGstBase + parsedConsultancy);
  }

  const effectiveDiscount = round2(Math.min(parsedDiscount, totalPreGstBase));
  const discountRatio = totalPreGstBase > 0 ? effectiveDiscount / totalPreGstBase : 0;

  let allocatedDiscountSoFar = 0;
  const numLines = flatProducts.length;

  let totalTaxableValue = 0;
  let medicineTaxableValue = 0;
  let discountedConsultancy = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const isInterState = isInterStateTransaction(buyerState, buyerStateCode, companyState, "02");
  const hsnSummaryMap: Record<string, any> = {};

  const lines = flatProducts.map((p, index) => {
    let lineDiscount = 0;
    if (effectiveDiscount > 0 && totalPreGstBase > 0) {
      if (index === numLines - 1) {
        // Last line absorbs remainder to guarantee exact sum(lineDiscount) === effectiveDiscount
        lineDiscount = round2(effectiveDiscount - allocatedDiscountSoFar);
      } else {
        lineDiscount = round2(p.amount * discountRatio);
        allocatedDiscountSoFar = round2(allocatedDiscountSoFar + lineDiscount);
      }
    }

    // Discounted taxable value for this line
    const taxableValue = round2(p.amount - lineDiscount);

    let totalLineTax = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (p.taxRate > 0) {
      if (isInterState) {
        igstAmount = round2((taxableValue * p.taxRate) / 100);
        totalLineTax = igstAmount;
      } else {
        const halfRate = p.taxRate / 2;
        cgstAmount = round2((taxableValue * halfRate) / 100);
        sgstAmount = cgstAmount; // CGST and SGST are always identical
        totalLineTax = round2(cgstAmount + sgstAmount);
      }
    }

    totalTaxableValue = round2(totalTaxableValue + taxableValue);
    if (p.isConsultation) {
      discountedConsultancy = taxableValue;
    } else {
      medicineTaxableValue = round2(medicineTaxableValue + taxableValue);
    }

    totalCgst = round2(totalCgst + cgstAmount);
    totalSgst = round2(totalSgst + sgstAmount);
    totalIgst = round2(totalIgst + igstAmount);

    const hsnKey = `${p.hsnCode}_${p.taxRate}`;
    if (!hsnSummaryMap[hsnKey]) {
      hsnSummaryMap[hsnKey] = {
        hsn: p.hsnCode,
        taxableValue: 0,
        taxRate: p.taxRate,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    hsnSummaryMap[hsnKey].taxableValue = round2(hsnSummaryMap[hsnKey].taxableValue + taxableValue);
    hsnSummaryMap[hsnKey].cgstAmount = round2(hsnSummaryMap[hsnKey].cgstAmount + cgstAmount);
    hsnSummaryMap[hsnKey].sgstAmount = round2(hsnSummaryMap[hsnKey].sgstAmount + sgstAmount);
    hsnSummaryMap[hsnKey].igstAmount = round2(hsnSummaryMap[hsnKey].igstAmount + igstAmount);
    hsnSummaryMap[hsnKey].totalTax = isInterState
      ? hsnSummaryMap[hsnKey].igstAmount
      : round2(hsnSummaryMap[hsnKey].cgstAmount + hsnSummaryMap[hsnKey].sgstAmount);

    return {
      name: p.name,
      hsnCode: p.hsnCode,
      qty: p.qty,
      rate: p.rate,
      inclusiveRate: p.inclusiveRate,
      grossAmount: p.amount,
      lineDiscount,
      taxableValue,
      taxRate: p.taxRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax: totalLineTax,
      finalAmount: round2(taxableValue + totalLineTax),
      disease: p.disease,
      treatmentIdx: p.treatmentIdx,
      isConsultation: p.isConsultation,
    };
  });

  totalTaxableValue = round2(totalTaxableValue);
  medicineTaxableValue = round2(medicineTaxableValue);
  totalCgst = round2(totalCgst);
  totalSgst = round2(totalSgst);
  totalIgst = round2(totalIgst);

  const totalTax = round2(totalCgst + totalSgst + totalIgst);
  const totalBeforeRoundOff = round2(totalTaxableValue + totalTax);

  const grandTotal = Math.round(totalBeforeRoundOff);
  const roundOff = round2(grandTotal - totalBeforeRoundOff);

  // Original Bill Total = Gross Medicines + Consultation Charges (Pre-discount pre-GST base = ₹9,753.91)
  const originalInvoiceTotal = round2(totalPreGstBase + (parsedConsultancy > 0 ? parsedConsultancy : 0));

  return {
    grossAmount: totalPreGstBase,
    grossMedicines,
    consultancyCharges: parsedConsultancy,
    discountApplied: effectiveDiscount,
    discountedConsultancy,
    medicineTaxableValue,
    totalTaxableValue,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    totalBeforeRoundOff,
    roundOff,
    grandTotal,
    originalInvoiceTotal,
    isInterState,
    lines,
    hsnSummary: Object.values(hsnSummaryMap).map((h: any) => ({
      ...h,
      taxableValue: round2(h.taxableValue),
      cgstAmount: round2(h.cgstAmount),
      sgstAmount: round2(h.sgstAmount),
      igstAmount: round2(h.igstAmount),
      totalTax: round2(h.totalTax),
    })),
  };
}

/**
 * Finds the exact required global pre-GST discount so that after proportional allocation
 * and GST recalculation, the final payable equals targetPayable.
 */
export function findDiscountForTargetPayable(
  treatments: InvoiceTreatment[],
  targetPayable: number,
  consultancyCharges: number,
  companyState: string,
  buyerState: string,
  isGstBilling: boolean,
  buyerStateCode?: string
): number {
  const baseCalc = calculateGSTInvoice(treatments, 0, consultancyCharges, companyState, buyerState, isGstBilling, buyerStateCode);
  const maxPayable = baseCalc.grandTotal;

  if (targetPayable >= maxPayable) return 0;
  if (targetPayable <= 0) return baseCalc.grossAmount;

  let low = 0;
  let high = Math.round(baseCalc.grossAmount * 100);
  let bestDiscount = 0;
  let minDiff = Infinity;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const disc = mid / 100;
    const res = calculateGSTInvoice(treatments, disc, consultancyCharges, companyState, buyerState, isGstBilling, buyerStateCode);
    const diff = res.grandTotal - targetPayable;

    if (Math.abs(diff) < minDiff) {
      minDiff = Math.abs(diff);
      bestDiscount = disc;
    }

    if (diff === 0) {
      return disc;
    } else if (diff > 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestDiscount;
}
