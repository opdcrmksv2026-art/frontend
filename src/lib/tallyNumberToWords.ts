// Indian Currency Number to Words converter (Lakhs, Crores, Paise)

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
]

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety"
]

function convertGroup(num: number): string {
  let output = ""
  if (num >= 100) {
    output += ones[Math.floor(num / 100)] + " Hundred "
    num %= 100
  }
  if (num >= 20) {
    output += tens[Math.floor(num / 10)] + " "
    num %= 10
  }
  if (num > 0) {
    output += ones[num] + " "
  }
  return output.trim()
}

export function numberToIndianWords(amount: number, prefix: string = "INR", suffix: string = "Only"): string {
  if (isNaN(amount) || amount === 0) return `${prefix} Zero ${suffix}`.trim()

  const absAmount = Math.abs(amount)
  const integerPart = Math.floor(absAmount)
  const decimalPart = Math.round((absAmount - integerPart) * 100)

  let words = ""
  let temp = integerPart

  const crore = Math.floor(temp / 10000000)
  temp %= 10000000

  const lakh = Math.floor(temp / 100000)
  temp %= 100000

  const thousand = Math.floor(temp / 1000)
  temp %= 1000

  const hundred = temp

  if (crore > 0) {
    words += convertGroup(crore) + " Crore "
  }
  if (lakh > 0) {
    words += convertGroup(lakh) + " Lakh "
  }
  if (thousand > 0) {
    words += convertGroup(thousand) + " Thousand "
  }
  if (hundred > 0) {
    words += convertGroup(hundred) + " "
  }

  words = words.trim()

  let result = prefix ? `${prefix} ${words}` : words

  if (decimalPart > 0) {
    const paiseWords = convertGroup(decimalPart)
    result += ` and ${paiseWords} paise`
  }

  if (suffix) {
    result += ` ${suffix}`
  }

  return result.replace(/\s+/g, " ").trim()
}
