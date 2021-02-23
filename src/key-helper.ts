import {Buffer} from 'buffer/';
import {scrypt, ProgressCallback, syncScrypt} from 'scrypt-js';

import * as nacl from '@wecrpto/nacl';

import {KP} from './consts';
import {KeypairType} from './types';
import {bs58Decode, bs58Encode} from './bs58';

/**
 *
 * @param pub [Uint8Array]
 * @param password [string]
 * @returns key Uint8Array
 */
export const AESKeySync = (pub: Uint8Array, password: string): Uint8Array => {
  if (!pub || pub.length < 8) throw new Error('salt required more than 8');
  if (!password) throw new Error('password is required.');
  const pwdBuf = Buffer.from(password);
  const key = syncScrypt(
    pwdBuf,
    pub.slice(0, KP.S),
    KP.N,
    KP.R,
    KP.P,
    KP.DKLen,
  );

  return key;
};

/**
 *
 * @param pub {Uint8Array}
 * @param password {string}
 * @param stateCallback {function:optional}
 * @returns Promise<Uint8Array>
 */
export const AESKey = async (
  pub: Uint8Array,
  password: string,
  stateCallback?: ProgressCallback,
): Promise<Uint8Array> => {
  if (!pub || pub.length < 8) throw new Error('Public key must more than 8.');
  if (!password) throw new Error('password is required.');
  const pwdBuf = Buffer.from(password);
  if (stateCallback === undefined) stateCallback = () => {};
  return scrypt(
    pwdBuf,
    pub.slice(0, KP.S),
    KP.N,
    KP.R,
    KP.P,
    KP.DKLen,
    stateCallback,
  );
};

export const generateKeypair = (
  auth?: string,
  useSigned?: boolean,
): KeypairType => {
  if (!auth) auth = '';
  const kp = useSigned ? nacl.sign.keyPair() : nacl.box.keyPair();
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    lockedKey: AESKeySync(kp.publicKey, auth),
  };
};

/**
 * @param buf
 * @param prefix
 * @returns base58 string
 */
export function pub2id(buf: Uint8Array, prefix?: string): string {
  const id = bs58Encode(buf);
  return prefix?.length ? `${prefix}${id}` : id;
}

/**
 * @param bs58Id
 * @param prefix
 * @returns buffer
 */
export function id2pub(bs58Id: string, prefix?: string): Uint8Array {
  if (!bs58Id || !bs58Id.trim().length) throw new Error('id illegal.');
  if (prefix && !new RegExp(`^${prefix}`).test(bs58Id))
    throw new Error(`id illegal, ${bs58Id}`);

  let id = bs58Id;
  if (prefix && prefix.length) {
    id = bs58Id.substring(prefix.length);
  }

  return bs58Decode(id);
}
