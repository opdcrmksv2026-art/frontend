import { calculateGSTInvoice } from '../src/utils/gstCalculator';

console.log("=========================================");
console.log("RUNNING COMPREHENSIVE GST ENGINE TESTS");
console.log("=========================================\n");

// TEST CASE 1: User Problem Case
// Quantity: 2, Rate: 2380.95, Discount: 1000, GST: 5%, Consultancy: 0
console.log("--- TEST 1: User Reported Case (₹1,000 discount, 5% GST, Qty: 2) ---");
const test1 = calculateGSTInvoice(
  [
    {
      kitName: "Stonevaidha KSG-240",
      products: [
        { name: "Stonevaidha KSG-240", hsnCode: "30031000", quantity: 2, rate: 2380.95, taxRate: 5 }
      ]
    }
  ],
  1000,
  0,
  "Himachal Pradesh",
  "Himachal Pradesh",
  true
);

console.log("Gross Amount:", test1.grossAmount, "(Expected: 4761.90)");
console.log("Discount Applied:", test1.discountApplied, "(Expected: 1000.00)");
console.log("Taxable Value:", test1.totalTaxableValue, "(Expected: 3761.90)");
console.log("CGST (2.5%):", test1.totalCgst, "(Expected: 94.05)");
console.log("SGST (2.5%):", test1.totalSgst, "(Expected: 94.05)");
console.log("Total Tax:", test1.totalTax, "(Expected: 188.10)");
console.log("Round Off:", test1.roundOff, "(Expected: 0.00)");
console.log("Grand Total:", test1.grandTotal, "(Expected: 3950.00)");

if (
  test1.grossAmount === 4761.90 &&
  test1.discountApplied === 1000 &&
  test1.totalTaxableValue === 3761.90 &&
  test1.totalCgst === 94.05 &&
  test1.totalSgst === 94.05 &&
  test1.grandTotal === 3950
) {
  console.log(">>> TEST 1 PASSED! ✓\n");
} else {
  console.error(">>> TEST 1 FAILED! ✗\n");
}

// TEST CASE 2: No discount
console.log("--- TEST 2: No Discount (Qty: 2, Rate: 2380.95, GST: 5%) ---");
const test2 = calculateGSTInvoice(
  [
    {
      kitName: "Stonevaidha KSG-240",
      products: [
        { name: "Stonevaidha KSG-240", hsnCode: "30031000", quantity: 2, rate: 2380.95, taxRate: 5 }
      ]
    }
  ],
  0,
  0,
  "Himachal Pradesh",
  "Himachal Pradesh",
  true
);
console.log("Gross Amount:", test2.grossAmount, "(Expected: 4761.90)");
console.log("Taxable Value:", test2.totalTaxableValue, "(Expected: 4761.90)");
console.log("CGST (2.5%):", test2.totalCgst, "(Expected: 119.05)");
console.log("SGST (2.5%):", test2.totalSgst, "(Expected: 119.05)");
console.log("Grand Total:", test2.grandTotal, "(Expected: 5000.00)");

if (
  test2.grossAmount === 4761.90 &&
  test2.totalTaxableValue === 4761.90 &&
  test2.totalCgst === 119.05 &&
  test2.totalSgst === 119.05 &&
  test2.grandTotal === 5000
) {
  console.log(">>> TEST 2 PASSED! ✓\n");
} else {
  console.error(">>> TEST 2 FAILED! ✗\n");
}

// TEST CASE 3: Different GST Rates (12% and 18%)
console.log("--- TEST 3: Different GST Rates (12% and 18%) ---");
const test3 = calculateGSTInvoice(
  [
    {
      kitName: "Medicine Combo",
      products: [
        { name: "Product A", hsnCode: "3004", quantity: 1, rate: 1000, taxRate: 12 },
        { name: "Product B", hsnCode: "3005", quantity: 1, rate: 2000, taxRate: 18 }
      ]
    }
  ],
  300,
  0,
  "Himachal Pradesh",
  "Himachal Pradesh",
  true
);
console.log("Gross Amount:", test3.grossAmount, "(Expected: 3000.00)");
console.log("Discount:", test3.discountApplied, "(Expected: 300.00)");
console.log("Taxable Value:", test3.totalTaxableValue, "(Expected: 2700.00)");
console.log("HSN Summary:", JSON.stringify(test3.hsnSummary, null, 2));
console.log("Grand Total:", test3.grandTotal);
console.log(">>> TEST 3 COMPLETED! ✓\n");

// TEST CASE 4: Consultation Charges Added
console.log("--- TEST 4: Consultation Charges Explicitly Present (₹500 consult + ₹1000 discount) ---");
const test4 = calculateGSTInvoice(
  [
    {
      kitName: "Stonevaidha KSG-240",
      products: [
        { name: "Stonevaidha KSG-240", hsnCode: "30031000", quantity: 2, rate: 2380.95, taxRate: 5 }
      ]
    }
  ],
  1000,
  500,
  "Himachal Pradesh",
  "Himachal Pradesh",
  true
);
console.log("Gross Amount:", test4.grossAmount, "(Expected: 4761.90)");
console.log("Discount:", test4.discountApplied, "(Expected: 1000.00)");
console.log("Consultation:", test4.consultancyCharges, "(Expected: 500.00)");
console.log("Taxable Value:", test4.totalTaxableValue, "(Expected: 4261.90)");
console.log("Total Tax:", test4.totalTax, "(Expected: 188.10)");
console.log("Grand Total:", test4.grandTotal, "(Expected: 4450.00)");

if (
  test4.totalTaxableValue === 4261.90 &&
  test4.grandTotal === 4450
) {
  console.log(">>> TEST 4 PASSED! ✓\n");
} else {
  console.error(">>> TEST 4 FAILED! ✗\n");
}

console.log("=========================================");
console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
console.log("=========================================");
