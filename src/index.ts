/* eslint-disable no-console */
import {
  PWalletType,
  ConstructorType,
  KeystoreType,
  ConfigType,
  WeaccountType,
  KeypairType,
} from './types';

import {AESKeySync, generateKeypair, pub2id, id2pub} from './key-helper';

import {DEF_ACC_CONFIG} from './consts';

import {enc} from 'crypto-js';
import * as nacl from '@wecrpto/nacl';

import {
  validHex,
  buf2hex,
  hex2buf,
  str2buf,
  paddingLeft,
  paddingLZero,
} from './util';

import {
  // aesEncrypt,
  // aesDecrypt,
  keyEncrypt,
  keyDecrypt,
  // encryptPriKey,
  // decryptPriKey,
  signMessage,
  verifyMessage,
  buf2Words,
  words2buf,
  splitBuf,
  splitBuf2Hex,
  comboxBuf,
  comboxHexBuf,
  utf8ToUint8Array,
  bs64ToUint8Array,
  uint8ArrayToBase64,
} from './crypto-helper';

import {bs58Decode, bs58Encode} from './bs58';
import {
  generate,
  walletJsonfy,
  openWallet,
  importFromKeystore,
} from './generator';

/**
 *
 */
export default (function (): WeaccountType {
  /**
   * Modal window
   */
  class Modal {
    useSigned: boolean;
    remembered: boolean | undefined;
    idPrefix: string;
    lockedkey: Uint8Array | undefined;
    keystore: KeystoreType | undefined;
    wallet: PWalletType | undefined;
    keypair: KeypairType | undefined;

    /**
     *
     * @param config
     * @param config.idPrefix
     * @param config.remembered
     * @param config.useSigned
     */
    constructor({
      idPrefix = '',
      remembered = false,
      useSigned = false,
    }: ConstructorType) {
      this.idPrefix = idPrefix;
      this.remembered = remembered;
      this.useSigned = useSigned;
    }

    /**
     *
     * @param {ConfigType} config
     */
    setConfig(config: ConfigType) {
      const {idPrefix, remembered = false, useSigned = false} = config;
      if (!this.hasWallet()) {
        this.idPrefix = idPrefix || DEF_ACC_CONFIG.idPrefix;
      }

      this.remembered = remembered;
      this.useSigned = useSigned;
    }

    /**
     *
     * @param auth {string}
     * @returns modal
     */
    async generate(auth: string) {
      if (auth === undefined || auth.trim().length < 3) {
        throw new Error('auth must more than 3 characters.');
      }

      this.wallet = generate(auth, this.useSigned);
      !!this.remembered && (this.lockedkey = this.wallet.key?.lockedKey);

      return this;
    }

    /**
     *
     * @param auth password
     * @returns wallet
     */
    open(auth: string): PWalletType {
      if (this.wallet !== undefined) {
        const owallet: PWalletType = openWallet(this.wallet, auth);
        this.wallet = owallet;
        return owallet;
      } else {
        throw new Error(
          'Please create a wallet first, uesed Weaccount.create or generate.',
        );
      }
    }

    /**
     * locked wallet if wallet not exist will throw error
     */
    lock(): void {
      if (!this.hasWallet()) {
        throw new Error('unfound wallet.');
      }

      this.keypair = undefined;
      this.wallet?.key && (this.wallet.key = undefined);
    }

    /**
     *
     * @param wallet
     */
    setWallet(wallet: PWalletType): void {
      this.wallet = wallet;
      if (this.remembered && wallet.key !== undefined) {
        this.keypair = wallet.key;
      } else {
        this.keypair = undefined;
      }
    }

    /**
     * assert wallet has created
     *
     * @returns boolean
     */
    hasWallet(): boolean {
      return this.wallet !== undefined;
    }

    /**
     * assert wallet open
     *
     * @returns boolean
     */
    hasOpened(): boolean {
      return this.wallet !== undefined && this.keypair !== undefined;
    }

    /**
     *
     * @returns keypair
     */
    getKeypair(): KeypairType | undefined {
      if (!this.hasWallet())
        throw new Error('wallet unfound,please create first.');
      if (!this.hasOpened())
        throw new Error('wallet locked,please open first.');

      return this.keypair;
    }

    /**
     * @returns json string
     */
    keyStoreJsonfy() {
      if (!this.hasWallet())
        throw new Error('wallet unfound,please create first.');
      return JSON.stringify(this.wallet, walletJsonfy, 2);
    }

    /**
     * sign message with wallet secret key
     *
     * @param {string} message if message from object or multiple concat ,make sure the order
     * @returns {string} signature
     */
    sign(message: string): string {
      if (this.keypair === undefined || !this.keypair.secretKey)
        throw new Error('miss privateKey.');

      const privateKey = this.keypair.secretKey;
      if (privateKey.length !== nacl.sign.secretKeyLength) {
        throw Error(
          `bad secret key size,required ${nacl.sign.secretKeyLength} `,
        );
      }

      const msgbuf = utf8ToUint8Array(message);

      const sign = nacl.sign.detached(msgbuf, privateKey);
      return uint8ArrayToBase64(sign);
    }

    /**
     * verified signature used wallet public key
     *
     * @param {string} signature base64 string
     * @param message string
     * @returns {boolean} verified
     */
    verify(signature: string, message: string): boolean {
      const signbuf = bs64ToUint8Array(signature);
      const msgbuf = utf8ToUint8Array(message);

      let pub: Uint8Array | undefined = this.keypair?.publicKey || undefined;
      if (pub === undefined && this.wallet !== undefined) {
        const did: string = this.wallet.did;
        pub = id2pub(did);
      }

      if (!pub || pub.byteLength !== nacl.sign.publicKeyLength) {
        throw new Error('miss public key or bad public key size.');
      }

      return nacl.sign.detached.verify(msgbuf, signbuf, pub);
    }
  }

  let modal: Modal;

  const init = (config?: ConfigType) => {
    modal = new Modal({...config});
    return modal;
  };

  const create = (auth: string, config?: ConfigType): Modal => {
    if (!modal) {
      throw new Error('Weaccount do not initialization, please init first.');
    }

    modal.setConfig(config || {});
    modal.generate(auth);
    return modal;
  };

  /**
   *
   * @param json
   * @param auth
   * @param config [idPrefix,remembered] optinal
   * @returns wallet instance
   */
  const importKeyStore = (
    json: string,
    auth: string,
    config?: ConfigType,
  ): Modal => {
    const modal = new Modal({...config});
    const remembered = modal.remembered;
    console.log('auth>>', auth);
    const wallet: PWalletType = importFromKeystore(json, auth, remembered);

    modal.setWallet(wallet);

    return modal;
  };

  return {
    init,
    create,
    importKeyStore,
    helper: {
      generateKeypair,
      generateWallet: generate,
      AESKeySync,
      keyEncrypt,
      keyDecrypt,
      signMessage,
      verifyMessage,
      pub2id,
      id2pub,
      comboxBuf,
      comboxHexBuf,
      splitBuf,
      splitBuf2Hex,
      msgToUint8Array: utf8ToUint8Array,
      bs64ToUint8Array,
      uint8ArrayToBase64,
    },
    tools: {
      nacl,
      enc,
      buf2Words,
      words2buf,
      validHex,
      hex2buf,
      buf2hex,
      str2buf,
      bs58Decode,
      bs58Encode,
      paddingLeft,
      paddingLZero,
    },
  };
})();

// export default Account;
