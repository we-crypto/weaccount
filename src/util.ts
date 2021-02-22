import {Buffer} from 'buffer/';

/**
 *
 * @param s
 *
 * @returns {Uint8Array} buffer
 */
export const decodeUTF8 = (s: string): Uint8Array => {
  if (typeof s !== 'string') throw new TypeError('expected string');
  let i;
  const d = unescape(encodeURIComponent(s)),
    b = new Uint8Array(d.length);
  for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
  return b;
};

/**
 *
 * @param {Uint8Array} arr
 *
 * @returns {string}
 */
export const encodeUTF8 = (arr: Uint8Array): string => {
  const s = [];
  let i;
  for (i = 0; i < arr.length; i++) s.push(String.fromCharCode(arr[i]));
  return decodeURIComponent(escape(s.join('')));
};

/**
 *
 * @param buf
 * @param hexPrefix
 * @returns string hex
 */
export const buf2hex = (buf: Uint8Array, hexPrefix?: boolean): string => {
  // eslint-disable-next-line prettier/prettier
  const hexStr = Buffer.from(buf).toString('hex')
  return !hexPrefix ? hexStr : '0x' + hexStr;
};

export const hex2buf = (hex: string): Uint8Array => {
  hex = hex.replace(/^0x/, '');

  if (hex.length % 2 !== 0) throw new Error('invalid hexString.');
  if (hex.match(/[G-Z\s]/i)) {
    throw new Error(
      `convert hex string ${hex} has incorrect characters or npn-hex.`,
    );
  }

  return Uint8Array.from(Buffer.from(hex, 'hex'));
};

export const str2buf = (str: string, encoding?: string): Uint8Array => {
  return Buffer.from(str, encoding);
};

export const paddingLeft = (hexkey: string, len?: number): string => {
  let _l = 16;
  if (len === 24 || len === 32) _l = len;

  let pKey = hexkey.toString();
  const keyLen = hexkey.length;
  if (keyLen < _l) {
    pKey = new Array(_l - keyLen + 1).join('0') + pKey;
  } else if (keyLen > _l) {
    pKey = pKey.slice(0, keyLen);
  }

  if (pKey.length > _l * 2) {
    pKey = pKey.slice(0, _l * 2);
  }
  return pKey;
};

/**
 * @param buf
 * @param len
 * @returns {string}
 */
export function paddingLZero(buf: Uint8Array, len?: number): string {
  const l = len === 24 || len === 32 ? len : 16;

  const inlen = buf.length;

  if (inlen >= l) {
    return Buffer.from(buf.slice(0, l)).toString('hex');
  }

  const leftbuf = Buffer.alloc(l - inlen, '00', 'hex');
  const padbuf = Buffer.concat([leftbuf, buf]);

  return padbuf.toString('hex');
}

/**
 * @param ivbuf
 * @param cipherbuf
 * @returns append buf Uint8Array
 */
export function concatBuf(
  ivbuf: Uint8Array,
  cipherbuf: Uint8Array,
): Uint8Array {
  const total = ivbuf.byteLength + cipherbuf.byteLength;
  return Buffer.concat([ivbuf, cipherbuf], total);
}

/**
 * validate hexadecimal
 *
 * @param hex
 * @returns boolean
 */
export function validHex(hex: string): boolean {
  return /^[0-9a-fA-F]+$/.test(hex);
}

/**
 * @param buffer
 * @returns Uint8Array buffer
 */
export function convertBuf2Uint8buf(buffer: Buffer): Uint8Array {
  return Uint8Array.from(buffer);
}

/**
 * checked string base64 encoding
 *
 * @param s
 */
export function validBase64(s: string): void {
  if (
    !/^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(
      s,
    )
  ) {
    throw new TypeError('invalid encoding');
  }
}
