/* eslint-disable no-console */
import {Buffer} from 'buffer/';
import {AESKeySync, id2pub} from './key-helper';
import {mode, AES, enc, LibWordArray, pad, WordArray} from 'crypto-js';

import {hex2buf, buf2hex, paddingLeft, paddingLZero, validHex} from './util';

import {bs58Decode, bs58Encode} from './bs58';
import {DEF_ACC_CONFIG} from 'consts';
import {CIvType, CIvHexType} from './types';

// export const Encrypt = (plaintext: string, key: string): WordArray => {

// };

export const convert2Words = (btyes: Uint8Array): LibWordArray => {
  return enc.Hex.parse(buf2hex(btyes));
};

/**
 *
 * @param aeskey
 * @param plainText
 * @returns any
 */
export const aesEncrypt = (aeskey: Uint8Array, plainText: Uint8Array): any => {
  // aeskey [uint8array]->[hex string]
  const hexkey = Buffer.from(aeskey).toString('hex');
  const hexIv = paddingLeft(hexkey, 16);
  const kwords = enc.Hex.parse(hexkey);

  const hexPlain = buf2hex(plainText);
  const pwords = enc.Hex.parse(hexPlain);

  const encrypted = AES.encrypt(pwords, kwords, {
    iv: enc.Hex.parse(hexIv),
    mode: mode.CFB,
    padding: pad.Pkcs7,
  });

  return encrypted;
  // return {
  //   hexPlain,
  //   encrypted,
  //   cipherTxt: encrypted.toString(),
  // };
};

/**
 *
 * @param aeskey
 * @param cipherText
 * @returns CryptoJS.DecryptedMessage
 */
export const aesDecrypt = (aeskey: Uint8Array, cipherText: string): any => {
  const hexkey = buf2hex(aeskey);
  const hexIv = paddingLeft(hexkey, 16);
  const kwords = enc.Hex.parse(hexkey);

  const decrypted = AES.decrypt(cipherText, kwords, {
    iv: enc.Hex.parse(hexIv),
    mode: mode.CFB,
    padding: pad.Pkcs7,
  });

  return decrypted;
  // return {
  //   decrypted,
  //   plainText: enc.Hex.stringify(decrypted),
  // };
};

export const encryptPriKey = (
  prikey: Uint8Array,
  pubkey: Uint8Array,
  auth: string,
): any => {
  const aeskey = AESKeySync(pubkey, auth);

  const encrypted = aesEncrypt(aeskey, prikey);
  const cipherBuf = words2buf(encrypted);
  const cipherTxt = bs58Encode(cipherBuf);

  return {
    encrypted,
    cipherTxt,
  };
};

export const decryptPriKey = (
  did: string,
  cipherTxt: string,
  auth: string,
): any => {
  const pubkey = id2pub(did, DEF_ACC_CONFIG.idPrefix);

  const aeskey = AESKeySync(pubkey, auth);
  const prikey = bs58Decode(cipherTxt);

  const decrypted = aesDecrypt(aeskey, buf2hex(prikey));
  return decrypted;
};

/**
 * @param words
 * @returns buffer
 */
function words2buf(words: LibWordArray): Uint8Array {
  return hex2buf(enc.Hex.stringify(words));
}

/**
 * @param plianText hex string
 * @param aeskey hex
 * @returns encrypted WordArray
 *  encrypted.toString() ==> base64 ==> Base64.parse(encrypted.toString()).toString(Hex) same with ↓
 *  encWords.ciphertext.toString():hexstring same with up ↑
 */
export function hexEncrypt(plianText: string, aeskey: string): WordArray {
  const keywords = enc.Hex.parse(aeskey);

  const plainWords = enc.Hex.parse(plianText);

  const encrypted = AES.encrypt(plainWords, keywords, {
    mode: mode.CFB,
    // iv: ivwords,
    padding: pad.Pkcs7,
  });

  return encrypted;
}

/**
 * @param plainTxt required hex string
 * @param hexkey required hex string
 * @returns WordArray
 */
export function hexDecrypt(plainTxt: string, hexkey: string): any {
  const keywords = enc.Hex.parse(hexkey);
  const hexIV = paddingLeft(hexkey, 16);
  const ivwords = enc.Hex.parse(hexIV);

  const plainWords = enc.Hex.parse(plainTxt);

  const decrypted = AES.decrypt(plainWords, keywords, {
    mode: mode.CFB,
    iv: ivwords,
    padding: pad.Pkcs7,
  });

  return decrypted;
}

/**
 * @param plainbuf
 * @param aeskey
 * @returns WordArray
 */
export function keyEncrypt(
  plainbuf: Uint8Array,
  aeskey: Uint8Array,
): WordArray {
  const pwords = enc.Hex.parse(buf2hex(plainbuf));
  const keywords = enc.Hex.parse(buf2hex(aeskey));
  const ivhex = paddingLZero(aeskey, 16);
  const encrypted = AES.encrypt(pwords, keywords, {
    mode: mode.CFB,
    iv: enc.Hex.parse(ivhex),
    padding: pad.Pkcs7,
  });

  return encrypted;
}

// encrypted.ciphertext ===> base64 enc.Base64.stringfy(encrypted.ciphertext)

/**
 * decrypt from combox buffer
 *
 * @param {Uint8Array} cipherbuf : [iv+cipher]:hex string
 * @param {Uint8Array} aeskey
 * @returns {Object} the decrypt result
 */
export function keyDecrypt(cipherbuf: Uint8Array, aeskey: Uint8Array): any {
  const civObj: CIvHexType = splitBuf2Hex(cipherbuf, 16);

  const keywords = enc.Hex.parse(buf2hex(aeskey));

  const cipherhex = civObj.cipherhex;
  const cipher = enc.Base64.stringify(enc.Hex.parse(cipherhex));

  const ivwords = enc.Hex.parse(civObj.ivhex);

  const decrypted = AES.decrypt(cipher, keywords, {
    mode: mode.CFB,
    iv: ivwords,
    padding: pad.Pkcs7,
  });

  return decrypted;
}

// export function keyDecrypt(
//   cipher: Uint8Array,
//   aeskey: Uint8Array,
// ): WordArray {
//   const pwords = enc.Hex.parse(buf2hex(plainbuf));
//   const keywords = enc.Hex.parse(buf2hex(aeskey));
//   const ivhex = paddingLZero(aeskey, 16);
//   const encrypted = AES.encrypt(pwords, keywords, {
//     mode: mode.CFB,
//     iv: enc.Hex.parse(ivhex),
//     padding: pad.Pkcs7,
//   });

//   return encrypted;
// }

/**
 * @param buf
 * @param pos
 * @returns [iv,cipher,pos] iv,cipher is Uint8Array
 */
export function splitBuf(buf: Uint8Array, pos: number): CIvType {
  if (buf.byteLength <= pos)
    throw new Error(
      `entry buf length only ${buf.byteLength}, not enought split by ${pos}.`,
    );

  return {
    iv: buf.slice(0, pos),
    cipher: buf.slice(pos, buf.byteLength),
    pos: pos,
  };
}

/**
 * @param buf
 * @param pos
 * @returns [ivhex,cipherhex,pos] hex string
 */
export function splitBuf2Hex(buf: Uint8Array, pos: number): CIvHexType {
  const civObj: CIvType = splitBuf(buf, pos);

  return {
    ivhex: Buffer.from(civObj.iv).toString('hex'),
    cipherhex: Buffer.from(civObj.cipher).toString('hex'),
    pos: civObj?.pos || civObj.iv.byteLength,
  };
}

/**
 * @param ivbuf
 * @param cipherbuf
 * @returns buf Uint8Array
 */
export function comboxBuf(
  ivbuf: Uint8Array,
  cipherbuf: Uint8Array,
): Uint8Array {
  const total = ivbuf.byteLength + cipherbuf.byteLength;
  const buf = Buffer.concat([ivbuf, cipherbuf], total);
  return Uint8Array.from(buf);
}

/**
 * @param ivhex
 * @param cipherhex
 * @returns Concatenation buffer Uint8Array
 */
export function comboxHexBuf(ivhex: string, cipherhex: string): Uint8Array {
  if (!validHex(ivhex))
    throw new Error(`entry ivhex ,Invalid hexadecimal string : ${ivhex}.`);
  if (!validHex(cipherhex))
    throw new Error(
      `entry cipherhex, Invalid hexadecimal string: ${cipherhex}.`,
    );

  const ivbuf = Buffer.from(ivhex, 'hex');
  const cipherbuf = Buffer.from(cipherhex, 'hex');
  const total = ivbuf.byteLength + cipherbuf.byteLength;

  const buf = Buffer.concat([ivbuf, cipherbuf], total);

  return buf;
}
