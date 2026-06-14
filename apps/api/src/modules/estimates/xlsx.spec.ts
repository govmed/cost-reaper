import { describe, it, expect } from 'vitest';
import { inflateRawSync } from 'node:zlib';
import { buildXlsx, colRef, crc32, zip } from './xlsx';

describe('crc32', () => {
  it('matches the standard CRC-32 check vector', () => {
    // CRC32("123456789") === 0xCBF43926
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
  });
});

describe('colRef', () => {
  it('maps 0-based indexes to A1 column letters', () => {
    expect(colRef(0)).toBe('A');
    expect(colRef(25)).toBe('Z');
    expect(colRef(26)).toBe('AA');
    expect(colRef(27)).toBe('AB');
  });
});

describe('zip', () => {
  it('produces a valid archive whose entries inflate back to their content', () => {
    const buf = zip([{ name: 'hello.txt', data: Buffer.from('hi there') }]);
    // ZIP local file header magic.
    expect(buf.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    // End-of-central-directory signature is present.
    expect(buf.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]))).toBe(true);
    // The deflated payload round-trips back to the original content.
    const compSize = buf.readUInt32LE(18);
    const nameLen = buf.readUInt16LE(26);
    const extraLen = buf.readUInt16LE(28);
    const dataStart = 30 + nameLen + extraLen;
    const inflated = inflateRawSync(buf.subarray(dataStart, dataStart + compSize));
    expect(inflated.toString('utf8')).toBe('hi there');
  });
});

describe('buildXlsx', () => {
  const xlsx = buildXlsx('Estimate', [
    ['Estimate', 'My Estimate'],
    [],
    ['Type', 'Line total'],
    ['Labor', '1234.5600'],
  ]);

  it('is a ZIP starting with the PK magic', () => {
    expect(xlsx.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('contains the required OOXML parts (filenames stored in headers)', () => {
    const s = xlsx.toString('latin1');
    expect(s).toContain('[Content_Types].xml');
    expect(s).toContain('xl/workbook.xml');
    expect(s).toContain('xl/worksheets/sheet1.xml');
    expect(s).toContain('_rels/.rels');
  });

  it('round-trips the sheet XML with numeric and inline-string cells', () => {
    // Locate and inflate the sheet1.xml entry to verify cell encoding.
    const marker = Buffer.from('xl/worksheets/sheet1.xml');
    const idx = xlsx.indexOf(marker);
    expect(idx).toBeGreaterThan(0);
    // Find any deflate stream after the first local header and confirm content.
    // Simpler: rebuild the sheet payload and confirm the workbook embeds the sheet name.
    expect(xlsx.toString('latin1')).toContain('PK');
    // The numeric value is written as a number cell, the label as an inline string.
    const sheet = inflateSheet(xlsx);
    expect(sheet).toContain(
      '<c r="A1" t="inlineStr"><is><t xml:space="preserve">Estimate</t></is></c>',
    );
    expect(sheet).toContain('<c r="B4"><v>1234.5600</v></c>');
  });
});

/** Inflate the sheet1.xml entry from a generated xlsx for assertions. */
function inflateSheet(xlsx: Buffer): string {
  // Walk local file headers (PK\x03\x04) and inflate the one named worksheets/sheet1.xml.
  let p = 0;
  while (p + 30 <= xlsx.length && xlsx.readUInt32LE(p) === 0x04034b50) {
    const compSize = xlsx.readUInt32LE(p + 18);
    const nameLen = xlsx.readUInt16LE(p + 26);
    const extraLen = xlsx.readUInt16LE(p + 28);
    const name = xlsx.subarray(p + 30, p + 30 + nameLen).toString('utf8');
    const dataStart = p + 30 + nameLen + extraLen;
    const data = xlsx.subarray(dataStart, dataStart + compSize);
    if (name === 'xl/worksheets/sheet1.xml') return inflateRawSync(data).toString('utf8');
    p = dataStart + compSize;
  }
  return '';
}
