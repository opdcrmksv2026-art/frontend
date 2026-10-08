import { calculateGSTInvoice, InvoiceTreatment } from './src/utils/gstCalculator';

const testTreatments: InvoiceTreatment[] = [
  {
    kitName: "gbs",
    products: [
      { name: "Stonevaidha KSG-80", quantity: 1, rate: 2380.95, taxRate: 5, hsnCode: "30031000" },
      { name: "Stonevaidha KSGA-120", quantity: 1, rate: 2380.95, taxRate: 5, hsnCode: "30031000" },
      { name: "Vidhuvaidha AK-40", quantity: 2, rate: 571.43, taxRate: 5, hsnCode: "30031000" },
      { name: "Apple Cider Vinegar", quantity: 3, rate: 483.05, taxRate: 18, hsnCode: "22090090" },
    ]
  }
];

// Test 1: Customer from Himachal Pradesh (Intra-State)
console.log("=========================================");
console.log("TEST 1: Himachal Pradesh (Intra-State)");
console.log("=========================================");
const hpResult = calculateGSTInvoice(testTreatments, 3108, 1200, "Himachal Pradesh", "Himachal Pradesh", true, "02");

console.log(`Gross Medicines: ₹${hpResult.grossMedicines}`);
console.log(`Consultancy Charges: ₹${hpResult.consultancyCharges}`);
console.log(`Original Bill Total: ₹${hpResult.originalInvoiceTotal}`);
console.log(`Product Discount: ₹${hpResult.discountApplied}`);
console.log(`Total Taxable Value: ₹${hpResult.totalTaxableValue}`);
console.log(`isInterState: ${hpResult.isInterState}`);
console.log(`CGST: ₹${hpResult.totalCgst}, SGST: ₹${hpResult.totalSgst}, IGST: ₹${hpResult.totalIgst}`);
console.log(`Total Tax: ₹${hpResult.totalTax}`);
console.log(`Round Off: ₹${hpResult.roundOff}`);
console.log(`Grand Total (Final Payable): ₹${hpResult.grandTotal}`);

console.log("\nLines:");
hpResult.lines.forEach(l => {
  console.log(`- ${l.name}: Qty=${l.qty}, Rate=₹${l.rate}, Gross=₹${l.grossAmount}, Disc=₹${l.lineDiscount}, Taxable=₹${l.taxableValue}, Tax=₹${l.totalTax}, Final=₹${l.finalAmount}`);
});

console.log("\nHSN Summary:");
hpResult.hsnSummary.forEach(h => {
  console.log(`- HSN ${h.hsn}: Taxable=₹${h.taxableValue}, Rate=${h.taxRate}%, CGST=₹${h.cgstAmount}, SGST=₹${h.sgstAmount}, Total Tax=₹${h.totalTax}`);
});

// Test 2: Customer from Punjab (Inter-State)
console.log("\n=========================================");
console.log("TEST 2: Punjab (Inter-State)");
console.log("=========================================");
const pbResult = calculateGSTInvoice(testTreatments, 3108, 1200, "Himachal Pradesh", "Punjab", true, "03");
console.log(`isInterState: ${pbResult.isInterState}`);
console.log(`Total Taxable Value: ₹${pbResult.totalTaxableValue}`);
console.log(`CGST: ₹${pbResult.totalCgst}, SGST: ₹${pbResult.totalSgst}, IGST: ₹${pbResult.totalIgst}`);
console.log(`Total Tax: ₹${pbResult.totalTax}`);
console.log(`Round Off: ₹${pbResult.roundOff}`);
console.log(`Grand Total: ₹${pbResult.grandTotal}`);

console.log("\nHSN Summary (Inter-State):");
pbResult.hsnSummary.forEach(h => {
  console.log(`- HSN ${h.hsn}: Taxable=₹${h.taxableValue}, Rate=${h.taxRate}%, IGST=₹${h.igstAmount}, Total Tax=₹${h.totalTax}`);
});
