/* eslint-disable no-console */
import {sign, box} from '@wecrpto/nacl';
import {KeypairType, PWalletType, SafeWallet, OpenParamType} from './types';
import {DEF_ACC_CONFIG} from './consts';
import {AESKeySync, generateKeypair, id2pub, pub2id} from './key-helper';

import {comboxHexBuf, keyDecrypt, keyEncrypt} from './crypto-helper';
import {bs58Decode, bs58Encode} from './bs58';
import {buf2hex, hex2buf} from './util';

/**
 * @param auth
 * @param keyparams OpenParamType
 * @param keyparams.useSigned
 * @returns wallet PWalletType
 */
export function generate(auth: string, keyparams: OpenParamType): PWalletType {
  const keypair: KeypairType = generateKeypair(auth, keyparams);
  const aeskey = keypair.lockedKey;
  const plainbuf = keypair.secretKey;

  const encrypted = keyEncrypt(plainbuf, aeskey);

  const ivhex = encrypted.iv.toString();
  const cipherhex = encrypted.ciphertext.toString();

  const cipherSumBuffer = comboxHexBuf(ivhex, cipherhex);

  const cipherBs58 = bs58Encode(cipherSumBuffer);

  const id = pub2id(keypair.publicKey, keyparams.idPrefix || '');

  const pwallet: PWalletType = {
    version: DEF_ACC_CONFIG.version,
    cipher_txt: cipherBs58,
    did: id,
    key: keypair,
  };

  return pwallet;
}

export const walletFormatter = {
  stringfy: (wallet: PWalletType): string => {
    return JSON.stringify(wallet, walletJsonfy, 2);
  },
  parse: (keystore: string): PWalletType => {
    if (!keystore || !keystore.trim().length) {
      throw new Error('keystore string non-character');
    }

    const parseObj = JSON.parse(keystore);
    if (
      typeof parseObj !== 'object' ||
      !parseObj.hasOwnProperty('version') ||
      !parseObj.hasOwnProperty('did') ||
      !parseObj.hasOwnProperty('cipher_txt')
    ) {
      throw new TypeError(
        'keystore json illegal,it must contain keys [version,did,cipher_txt].',
      );
    }

    const keystoreVersion =
      typeof parseObj.version === 'string'
        ? parseInt(parseObj.version)
        : parseObj.version;
    if (keystoreVersion > DEF_ACC_CONFIG.version) {
      throw new Error(
        `keystore version illegal. version must ${DEF_ACC_CONFIG.version} or less`,
      );
    }
    const wallet: PWalletType = {
      version: keystoreVersion,
      did: parseObj.did,
      cipher_txt: parseObj.cipher_txt,
      key: undefined,
    };
    return wallet;
  },
};

/**
 * open wallet
 *
 * @param wallet
 * @param auth
 * @param keyparams
 * @returns wallet opened contains key
 */
export function openWallet(
  wallet: PWalletType,
  auth: string,
  keyparams: OpenParamType,
): PWalletType {
  const id = wallet.did;

  const {idPrefix, round, useSigned} = keyparams;

  const pubkey = id2pub(id, idPrefix);
  const aeskey = AESKeySync(pubkey, auth, round);

  const cipherBs58 = wallet.cipher_txt;
  if (!cipherBs58 || !cipherBs58.trim().length) {
    throw new Error(`cipher_txt non-string. ${cipherBs58}.`);
  }

  const cipherSumBuf = bs58Decode(cipherBs58);
  const decrypted = keyDecrypt(cipherSumBuf, aeskey);

  const plainhex = decrypted.toString();

  if (!plainhex || !plainhex.length) {
    throw new Error(
      `open wallet fail. make sure your password incorrect. password [ ${auth} ]`,
    );
  }

  const secretKey: Uint8Array = hex2buf(plainhex);

  const transPubkey = pri2pub(secretKey, useSigned);

  if (!bufEqual(transPubkey, pubkey)) {
    throw new Error(
      `open wallet fail. make sure your password incorrect. password [ ${auth} ]`,
    );
  }

  const keypair: KeypairType = {
    publicKey: pubkey,
    secretKey: secretKey,
    lockedKey: aeskey,
  };

  wallet.key = keypair;

  return wallet;
}

/**
 * open wallet by keystore and aeshex
 *
 * @param wallet
 * @param aeskey
 * @param keyparams
 * @returns {PWalletType} an wallet contains keypair
 */
export function openWalletByAeskey(
  wallet: PWalletType,
  aeskey: Uint8Array,
  keyparams: OpenParamType,
): PWalletType {
  const did = wallet.did;

  const {idPrefix, round, useSigned} = keyparams;

  const pubkey = id2pub(did, idPrefix);
  const cipherBs58 = wallet.cipher_txt;

  if (!cipherBs58 || !cipherBs58.trim().length) {
    throw new Error(`cipher_txt non-string. ${cipherBs58}.`);
  }

  const cipherSumBuf = bs58Decode(cipherBs58);
  const decrypted = keyDecrypt(cipherSumBuf, aeskey);
  validHexForDecrypted(decrypted.toString());

  const secretKey: Uint8Array = hex2buf(decrypted.toString());

  const transPubkey: Uint8Array = pri2pub(secretKey, useSigned);
  if (!bufEqual(transPubkey, pubkey)) {
    throw new Error('open wallet fail. Please make sure your lockedkey.');
  }
  const keypair: KeypairType = {
    publicKey: pubkey,
    secretKey: secretKey,
    lockedKey: aeskey,
  };

  wallet.key = keypair;

  return wallet;
}

/**
 *
 * @param [SafeWallet] wallet
 * @param wallet
 * @param auth
 * @param keyparams
 * @returns KeypairType
 */
export function openSafeWallet(
  wallet: SafeWallet,
  auth: string,
  keyparams: OpenParamType,
): KeypairType {
  const did = wallet.did;

  const {idPrefix, round, useSigned} = keyparams;

  const pubkey = id2pub(did, idPrefix);
  const aeskey = AESKeySync(pubkey, auth, round);

  const cipherBs58 = wallet.cipher_txt;
  if (!cipherBs58 || !cipherBs58.trim().length) {
    throw new Error(`cipher_txt non-string. ${cipherBs58}.`);
  }
  const cipherSumBuf = bs58Decode(cipherBs58);
  const decrypted = keyDecrypt(cipherSumBuf, aeskey);

  const plainhex = decrypted.toString();

  if (!plainhex || !plainhex.length) {
    throw new Error(
      `open wallet fail. make sure your password incorrect. password [ ${auth} ]`,
    );
  }

  const prikey = hex2buf(plainhex);

  const transPubkey = pri2pub(prikey, useSigned);
  if (!bufEqual(transPubkey, pubkey)) {
    throw new Error(
      `open wallet fail. make sure your password incorrect. password [ ${auth} ]`,
    );
  }

  const keypair: KeypairType = {
    publicKey: pubkey,
    secretKey: prikey,
    lockedKey: aeskey,
  };

  return keypair;
}

/**
 * @param keystore json string
 * @param auth
 * @param keyparams OpenParamType
 * @returns wallet
 */
export function importFromKeystore(
  keystore: string,
  auth: string,
  keyparams: OpenParamType,
): PWalletType {
  const keystoreObj = walletFormatter.parse(keystore);
  const id: string = keystoreObj.did.toString();
  if (!id.trim().length) {
    throw new Error(`keystore json did illegal. did: [${id}]`);
  }

  const {idPrefix, round, useSigned} = keyparams;

  const pubkey = id2pub(id, idPrefix);
  const aeskey = AESKeySync(pubkey, auth, round);

  const cipherBs58 = keystoreObj.cipher_txt;
  if (!cipherBs58 || !cipherBs58.trim().length) {
    throw new Error(`cipher_txt non-string. ${cipherBs58}.`);
  }

  const cipherSumBuf = bs58Decode(cipherBs58);
  const decrypted = keyDecrypt(cipherSumBuf, aeskey);

  const plainhex = decrypted.toString();

  if (!plainhex || !plainhex.length) {
    throw new Error(
      `open wallet fail. make sure your password incorrect. password [ ${auth} ]`,
    );
  }

  const prikey = hex2buf(plainhex);
  const transPubkey: Uint8Array = pri2pub(prikey, useSigned);
  if (!bufEqual(transPubkey, pubkey)) {
    throw new Error(
      `open wallet fail. make sure your password incorrect. password [ ${auth} ]`,
    );
  }
  const wallet: PWalletType = {
    version:
      typeof keystoreObj.version === 'string'
        ? parseInt(keystoreObj.version)
        : keystoreObj.version,
    cipher_txt: keystoreObj.cipher_txt,
    did: keystoreObj.did,
    key: undefined,
  };

  wallet.key = {
    publicKey: pubkey,
    secretKey: prikey,
    lockedKey: aeskey,
  };

  return wallet;
}

/**
 * @param plainhex
 * @param auth
 */
function validHexForDecrypted(plainhex: string, auth?: string) {
  if (!plainhex || !plainhex.length) {
    throw new Error(
      auth
        ? `open wallet fail. make sure your password incorrect. password [ ${auth} ]`
        : 'open wallet fail. make sure your password incorrect',
    );
  }
}

/**
 * @param k
 * @param v
 * @returns convert v
 */
export function walletJsonfy(k: string, v: any | undefined): any {
  if (k === 'key') {
    return undefined;
  }
  if (v instanceof Uint8Array) {
    return buf2hex(v);
  }
  return v;
}

/**
 *
 * @param prikey
 * @param useSigned
 * @returns Uint8Array
 */
export function pri2pub(prikey: Uint8Array, useSigned: boolean): Uint8Array {
  if (useSigned && prikey.length !== 64)
    throw new Error('PrivateKey must 64 length buf.');

  if (!useSigned && prikey.length !== 32)
    throw new Error('PrivateKey must 32 length buf.');

  const kp = !useSigned
    ? box.keyPair.fromSecretKey(prikey)
    : sign.keyPair.fromSecretKey(prikey);

  return kp.publicKey;
}

/**
 *
 * @param abuf
 * @param bbuf
 * @returns equal
 */
export function bufEqual(abuf: Uint8Array, bbuf: Uint8Array): boolean {
  return buf2hex(abuf) === buf2hex(bbuf);
}
