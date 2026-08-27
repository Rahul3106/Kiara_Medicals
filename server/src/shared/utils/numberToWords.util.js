/**
 * Converts a numeric amount to Indian Currency Words (INR)
 * Example: 1452.50 -> "Rupees One Thousand Four Hundred Fifty-Two and Fifty Paise Only"
 */

const units = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertBelowThousand(num) {
  let str = '';
  if (num >= 100) {
    str += units[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num > 0) {
    if (num < 20) {
      str += units[num] + ' ';
    } else {
      str += tens[Math.floor(num / 10)] + ' ';
      if (num % 10 > 0) {
        str += units[num % 10] + ' ';
      }
    }
  }
  return str.trim();
}

export const numberToIndianWords = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num === 0) return 'Rupees Zero Only';

  const rupees = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - rupees) * 100);

  let result = '';

  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (crore > 0) {
    result += convertBelowThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertBelowThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertBelowThousand(thousand) + ' Thousand ';
  }
  if (rem > 0) {
    result += convertBelowThousand(rem) + ' ';
  }

  result = 'Rupees ' + result.trim();

  if (paise > 0) {
    result += ' and ' + convertBelowThousand(paise) + ' Paise';
  }

  result += ' Only';
  return result;
};

export const numberToWords = numberToIndianWords;
