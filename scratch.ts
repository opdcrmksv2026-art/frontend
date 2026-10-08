import { calculateGSTInvoice } from './src/utils/gstCalculator';

const res = calculateGSTInvoice(
  [
    {
      kitName: "Test",
      price: 0,
      products: [
        { name: "Product 1", quantity: "2", rate: 2380.95, taxRate: 5 }
      ]
    }
  ] as any,
  1000,
  0,
  "Himachal Pradesh",
  "Himachal Pradesh",
  true
);
console.log(JSON.stringify(res, null, 2));
