/**
 * ESC/POS Thermal Receipt Builder for Kiara Medicals
 *
 * Generates raw ESC/POS command buffers that can be sent directly to
 * 58mm (32 chars/line) or 80mm (48 chars/line) thermal receipt printers
 * via USB, serial, or network connection.
 *
 * Usage:
 *   const receipt = new ReceiptBuilder({ width: 80 });
 *   receipt.header('KIARA MEDICALS');
 *   receipt.addItem('Dolo 650', 3, 45.00);
 *   receipt.total(135.00);
 *   const buffer = receipt.build();
 *   // Send buffer to printer via USB/serial/TCP
 */

// ESC/POS Command Constants
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  INIT: Buffer.from([ESC, 0x40]),                    // Initialize printer
  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]),           // Bold on
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]),          // Bold off
  ALIGN_LEFT: Buffer.from([ESC, 0x61, 0x00]),        // Left align
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]),      // Center align
  ALIGN_RIGHT: Buffer.from([ESC, 0x61, 0x02]),       // Right align
  DOUBLE_HEIGHT: Buffer.from([ESC, 0x21, 0x10]),     // Double height
  DOUBLE_WIDTH: Buffer.from([ESC, 0x21, 0x20]),      // Double width
  DOUBLE_BOTH: Buffer.from([ESC, 0x21, 0x30]),       // Double height + width
  NORMAL_SIZE: Buffer.from([ESC, 0x21, 0x00]),       // Normal text size
  UNDERLINE_ON: Buffer.from([ESC, 0x2d, 0x01]),      // Underline on
  UNDERLINE_OFF: Buffer.from([ESC, 0x2d, 0x00]),     // Underline off
  CUT_PAPER: Buffer.from([GS, 0x56, 0x00]),          // Full cut
  PARTIAL_CUT: Buffer.from([GS, 0x56, 0x01]),        // Partial cut
  FEED_LINES: (n) => Buffer.from([ESC, 0x64, n]),    // Feed n lines
  LINE_SPACING: (n) => Buffer.from([ESC, 0x33, n]),  // Set line spacing
};

export class ReceiptBuilder {
  /**
   * @param {Object} options
   * @param {58|80} [options.width=80] - Paper width in mm
   * @param {string} [options.encoding='utf8'] - Text encoding
   */
  constructor({ width = 80, encoding = 'utf8' } = {}) {
    this.charsPerLine = width === 58 ? 32 : 48;
    this.encoding = encoding;
    this.buffers = [CMD.INIT];
  }

  // ── Primitives ──

  _text(str) {
    this.buffers.push(Buffer.from(str, this.encoding));
    return this;
  }

  _newline() {
    this.buffers.push(Buffer.from([LF]));
    return this;
  }

  _cmd(cmd) {
    this.buffers.push(cmd);
    return this;
  }

  // ── Layout Helpers ──

  /**
   * Pad/truncate a string to fit a specific column width
   */
  _pad(str, len, align = 'left') {
    str = String(str).slice(0, len);
    if (align === 'right') return str.padStart(len);
    if (align === 'center') {
      const left = Math.floor((len - str.length) / 2);
      return ' '.repeat(left) + str + ' '.repeat(len - left - str.length);
    }
    return str.padEnd(len);
  }

  /**
   * Print a two-column row: left-aligned label, right-aligned value
   */
  _twoCol(left, right) {
    const rightLen = String(right).length;
    const leftLen = this.charsPerLine - rightLen - 1;
    const line = this._pad(left, leftLen) + ' ' + this._pad(right, rightLen, 'right');
    return this._text(line)._newline();
  }

  /**
   * Print a separator line
   */
  separator(char = '-') {
    return this._text(char.repeat(this.charsPerLine))._newline();
  }

  /**
   * Print a double-line separator
   */
  doubleSeparator() {
    return this.separator('=');
  }

  /**
   * Print an empty line
   */
  emptyLine() {
    return this._newline();
  }

  // ── Pharmacy Receipt Sections ──

  /**
   * Print store header block (centered, bold, double-height store name)
   */
  header({
    storeName,
    address,
    phone,
    gstNumber,
    drugLicenseNo,
  }) {
    this._cmd(CMD.ALIGN_CENTER);

    // Store name in large text
    this._cmd(CMD.DOUBLE_BOTH);
    this._cmd(CMD.BOLD_ON);
    this._text(storeName.slice(0, this.charsPerLine / 2));
    this._newline();
    this._cmd(CMD.NORMAL_SIZE);
    this._cmd(CMD.BOLD_OFF);

    // Address & contact
    if (address) this._text(address.slice(0, this.charsPerLine))._newline();
    if (phone) this._text(`Ph: ${phone}`)._newline();
    if (gstNumber) this._text(`GSTIN: ${gstNumber}`)._newline();
    if (drugLicenseNo) this._text(`D.L.No: ${drugLicenseNo}`)._newline();

    this._cmd(CMD.ALIGN_LEFT);
    return this.doubleSeparator();
  }

  /**
   * Print bill metadata (bill number, date, cashier, patient)
   */
  billInfo({
    billNumber,
    date,
    cashier,
    patientName,
    doctorName,
    paymentMode,
  }) {
    this._cmd(CMD.BOLD_ON);
    this._text('TAX INVOICE')._newline();
    this._cmd(CMD.BOLD_OFF);

    this._twoCol(`Bill: ${billNumber}`, `Date: ${date}`);
    if (cashier) this._twoCol('Cashier:', cashier);
    if (patientName) this._twoCol('Patient:', patientName);
    if (doctorName) this._twoCol('Dr.:', doctorName);
    if (paymentMode) this._twoCol('Payment:', paymentMode);

    return this.separator();
  }

  /**
   * Print item table header row
   */
  itemHeader() {
    this._cmd(CMD.BOLD_ON);
    if (this.charsPerLine >= 48) {
      // 80mm: Medicine | Batch | Qty | MRP | Amt
      this._text(
        this._pad('Item', 16) +
        this._pad('Batch', 10) +
        this._pad('Qty', 4, 'right') +
        this._pad('MRP', 8, 'right') +
        this._pad('Amt', 9, 'right')
      );
    } else {
      // 58mm: compact layout
      this._text(
        this._pad('Item', 12) +
        this._pad('Qty', 4, 'right') +
        this._pad('MRP', 7, 'right') +
        this._pad('Amt', 8, 'right')
      );
    }
    this._newline();
    this._cmd(CMD.BOLD_OFF);
    return this.separator();
  }

  /**
   * Print a single sale item row
   */
  addItem({
    name,
    batchNumber,
    quantity,
    mrp,
    amount,
    expiryDate,
  }) {
    if (this.charsPerLine >= 48) {
      this._text(
        this._pad(name, 16) +
        this._pad(batchNumber || '', 10) +
        this._pad(String(quantity), 4, 'right') +
        this._pad(Number(mrp).toFixed(2), 8, 'right') +
        this._pad(Number(amount).toFixed(2), 9, 'right')
      );
      this._newline();
      // Second line: expiry (if available)
      if (expiryDate) {
        this._text(`  Exp: ${expiryDate}`)._newline();
      }
    } else {
      // 58mm: name on first line, numbers on second
      this._text(this._pad(name, this.charsPerLine))._newline();
      this._text(
        '  ' +
        this._pad(String(quantity), 3, 'right') + 'x' +
        this._pad(Number(mrp).toFixed(2), 8, 'right') +
        this._pad(Number(amount).toFixed(2), 10, 'right')
      );
      this._newline();
    }
    return this;
  }

  /**
   * Print totals section
   */
  totals({
    subTotal,
    discount,
    cgst,
    sgst,
    roundOff,
    grandTotal,
  }) {
    this.separator();
    this._twoCol('Sub Total:', `Rs.${Number(subTotal).toFixed(2)}`);
    if (discount && Number(discount) > 0) {
      this._twoCol('Discount:', `-Rs.${Number(discount).toFixed(2)}`);
    }
    if (cgst && Number(cgst) > 0) {
      this._twoCol('CGST:', `Rs.${Number(cgst).toFixed(2)}`);
    }
    if (sgst && Number(sgst) > 0) {
      this._twoCol('SGST:', `Rs.${Number(sgst).toFixed(2)}`);
    }
    if (roundOff && Number(roundOff) !== 0) {
      this._twoCol('Round Off:', `Rs.${Number(roundOff).toFixed(2)}`);
    }

    this.doubleSeparator();
    this._cmd(CMD.BOLD_ON);
    this._cmd(CMD.DOUBLE_HEIGHT);
    this._twoCol('GRAND TOTAL:', `Rs.${Number(grandTotal).toFixed(2)}`);
    this._cmd(CMD.NORMAL_SIZE);
    this._cmd(CMD.BOLD_OFF);

    return this.doubleSeparator();
  }

  /**
   * Print footer with thank you message and regulatory notes
   */
  footer({ amountInWords, thankYouMessage } = {}) {
    this._cmd(CMD.ALIGN_CENTER);

    if (amountInWords) {
      this._text(`(${amountInWords})`)._newline();
      this.emptyLine();
    }

    this._text(thankYouMessage || 'Thank you! Get well soon.')._newline();
    this._text('Goods once sold will not be taken back')._newline();
    this._text('Subject to local jurisdiction')._newline();

    this._cmd(CMD.ALIGN_LEFT);
    return this;
  }

  /**
   * Build and return the final ESC/POS buffer
   */
  build() {
    // Feed extra lines and cut paper
    this._cmd(CMD.FEED_LINES(4));
    this._cmd(CMD.PARTIAL_CUT);

    return Buffer.concat(this.buffers);
  }
}

/**
 * Convenience function: Build a complete thermal receipt from a sale invoice object
 * @param {Object} invoice - Full sale invoice data
 * @param {Object} branch - Branch metadata
 * @param {58|80} [paperWidth=80] - Paper width
 * @returns {Buffer} ESC/POS binary buffer
 */
export const buildThermalReceipt = (invoice, branch, paperWidth = 80) => {
  const receipt = new ReceiptBuilder({ width: paperWidth });

  receipt.header({
    storeName: branch.name || 'Kiara Medicals',
    address: branch.address,
    phone: branch.phone,
    gstNumber: branch.gstNumber,
    drugLicenseNo: branch.drugLicenseNo,
  });

  receipt.billInfo({
    billNumber: invoice.billNumber,
    date: new Date(invoice.saleDate).toLocaleDateString('en-IN'),
    cashier: invoice.billedBy?.name,
    patientName: invoice.customer?.name,
    doctorName: invoice.customer?.doctorName,
    paymentMode: invoice.paymentMode,
  });

  receipt.itemHeader();

  for (const item of invoice.items || []) {
    receipt.addItem({
      name: item.medicine?.name || 'Unknown',
      batchNumber: item.batchNumber,
      quantity: item.quantity,
      mrp: item.mrp,
      amount: item.netAmount,
      expiryDate: item.expiryDate
        ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })
        : undefined,
    });
  }

  receipt.totals({
    subTotal: invoice.subTotal,
    discount: invoice.discountAmount,
    cgst: invoice.cgstAmount,
    sgst: invoice.sgstAmount,
    roundOff: invoice.roundOff,
    grandTotal: invoice.grandTotal,
  });

  receipt.footer({
    amountInWords: invoice.amountInWords,
  });

  return receipt.build();
};
