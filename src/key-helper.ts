import {Buffer} from 'buffer/';
import {scrypt, ProgressCallback, syncScrypt} from 'scrypt-js';

import * as nacl from '@wecrpto/nacl';

import {KP} from './consts';
import {KeypairType, OpenParamType} from './types';
import {bs58Decode, bs58Encode} from './bs58';

/**
 *
 * @param pub [Uint8Array]
 * @param password [string]
 * @param round
 * @returns key Uint8Array
 */
export const AESKeySync = (
  pub: Uint8Array,
  password: string,
  round: number,
): Uint8Array => {
  if (!pub || pub.length < 8) throw new Error('salt required more than 8');
  if (!password) throw new Error('password is required.');
  const pwdBuf = Buffer.from(password);

  round = validRound(round);

  const key = syncScrypt(
    pwdBuf,
    pub.slice(0, KP.S),
    1 << round,
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
  auth: string,
  {useSigned = true, round = KP.round}: OpenParamType,
): KeypairType => {
  if (!auth) throw new Error('auth is required.');
  const kp = useSigned ? nacl.sign.keyPair() : nacl.sign.keyPair();
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    lockedKey: AESKeySync(kp.publicKey, auth, round),
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

/**
 * round only in 6~15,else 15
 *
 * @param round
 * @returns round
 */
export function validRound(round: number): number {
  if (round <= 6 || round > 15) {
    return KP.round;
  } else {
    return round;
  }
}
