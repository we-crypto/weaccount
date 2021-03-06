/* eslint-disable no-console */
import {sign} from '@wecrpto/nacl';
import {KeypairType, PWalletType} from './types';
import {DEF_ACC_CONFIG} from './consts';
import {AESKeySync, generateKeypair, id2pub, pub2id} from './key-helper';

import {comboxHexBuf, keyDecrypt, keyEncrypt} from './crypto-helper';
import {bs58Decode, bs58Encode} from './bs58';
import {buf2hex, hex2buf} from './util';

/**
 * @param auth
 * @param useSigned
 * @returns wallet PWalletType
 */
export function generate(auth: string, useSigned?: boolean): PWalletType {
  const keypair: KeypairType = generateKeypair(auth, useSigned);
  const aeskey = keypair.lockedKey;
  const plainbuf = keypair.secretKey;

  const encrypted = keyEncrypt(plainbuf, aeskey);

  const ivhex = encrypted.iv.toString();
  const cipherhex = encrypted.ciphertext.toString();

  const cipherSumBuffer = comboxHexBuf(ivhex, cipherhex);

  const cipherBs58 = bs58Encode(cipherSumBuffer);

  const id = pub2id(keypair.publicKey, DEF_ACC_CONFIG.idPrefix);

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
 * @returns wallet opened contains key
 */
export function openWallet(wallet: PWalletType, auth: string): PWalletType {
  const id = wallet.did;
  const pubkey = id2pub(id, DEF_ACC_CONFIG.idPrefix);
  const aeskey = AESKeySync(pubkey, auth);

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

  if (!verifyPrikey(hex2buf(plainhex), pubkey)) {
    throw new Error(
      `open wallet fail. make sure your password incorrect. password [ ${auth} ]`,
    );
  }

  const keypair: KeypairType = {
    publicKey: pubkey,
    secretKey: hex2buf(plainhex),
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
 * @returns {PWalletType} an wallet contains keypair
 */
export function openWalletByAeskey(
  wallet: PWalletType,
  aeskey: Uint8Array,
): PWalletType {
  const did = wallet.did;
  const pubkey = id2pub(did, DEF_ACC_CONFIG.idPrefix);
  const cipherBs58 = wallet.cipher_txt;

  if (!cipherBs58 || !cipherBs58.trim().length) {
    throw new Error(`cipher_txt non-string. ${cipherBs58}.`);
  }

  const cipherSumBuf = bs58Decode(cipherBs58);
  const decrypted = keyDecrypt(cipherSumBuf, aeskey);
  validHexForDecrypted(decrypted.toString());
  if (!verifyPrikey(hex2buf(decrypted.toString()), pubkey)) {
    throw new Error('open wallet fail. Please make sure your lockedkey.');
  }
  const keypair: KeypairType = {
    publicKey: pubkey,
    secretKey: hex2buf(decrypted.toString()),
    lockedKey: aeskey,
  };

  wallet.key = keypair;

  return wallet;
}

/**
 * @param keystore json string
 * @param auth
 * @param remembered boolean default false ,if true wallet will has key
 * @returns wallet
 */
export function importFromKeystore(
  keystore: string,
  auth: string,
  remembered?: boolean,
): PWalletType {
  const containKeypair = Boolean(remembered);

  const keystoreObj = walletFormatter.parse(keystore);
  const id: string = keystoreObj.did.toString();
  if (!id.trim().length) {
    throw new Error(`keystore json did illegal. did: [${id}]`);
  }
  const pubkey = id2pub(id, DEF_ACC_CONFIG.idPrefix);
  const aeskey = AESKeySync(pubkey, auth);

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
  if (!verifyPrikey(hex2buf(plainhex), pubkey)) {
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

  if (containKeypair) {
    wallet.key = {
      publicKey: pubkey,
      secretKey: hex2buf(plainhex),
      lockedKey: aeskey,
    };
  }

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
 * @param {Uint8Array} prikey
 * @param {Uint8Array} pubkey
 * @returns boolean
 */
export function verifyPrikey(prikey: Uint8Array, pubkey: Uint8Array): boolean {
  const kp = sign.keyPair.fromSecretKey(prikey);
  const readPubhex = buf2hex(kp.publicKey);
  const srcPubhex = buf2hex(pubkey);
  return readPubhex === srcPubhex;
}
