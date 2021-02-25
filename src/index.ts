/* eslint-disable no-console */
import {
  PWalletType,
  ConstructorType,
  KeystoreType,
  ConfigType,
  WeaccountType,
  KeypairType,
  SafeWallet,
} from './types';

import {AESKeySync, generateKeypair, pub2id, id2pub} from './key-helper';

import {DEF_ACC_CONFIG} from './consts';

import {enc} from 'crypto-js';

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
  openWalletByAeskey,
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
      const {idPrefix, remembered = true, useSigned = true} = config;
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
    generate(auth: string): Modal {
      if (auth === undefined || auth.trim().length < 3) {
        throw new Error('auth must more than 3 characters.');
      }

      if (this.hasWallet())
        throw new Error(
          'wallet exists.if your need a new,please use reset first',
        );
      this.wallet = generate(auth, this.useSigned);
      !!this.remembered && (this.lockedkey = this.wallet.key?.lockedKey);
      this.wallet.key !== undefined && (this.keypair = this.wallet.key);

      return this;
    }

    /**
     * reset wallet
     */
    reset(): void {
      this.wallet = undefined;
      this.keypair = undefined;
      this.keystore = undefined;
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
     *
     * @param aeshex
     */

    // eslint-disable-next-line require-jsdoc
    openByAeskey(aeshex: string): PWalletType {
      const aeskey = hex2buf(aeshex);

      if (this.wallet !== undefined) {
        const wallet: PWalletType = openWalletByAeskey(this.wallet, aeskey);

        return wallet;
      } else {
        throw UnfoundWalletError();
      }
    }

    /**
     *
     * @param auth
     * @returns {string} aeskeyHex
     */
    getAesHex(auth: string): string {
      checkAuth(auth);

      if (this.wallet) {
        let aeshex = '';
        const wallet: PWalletType = openWallet(this.wallet, auth);
        const lockedKey = wallet.key?.lockedKey;
        lockedKey && (aeshex = buf2hex(lockedKey));
        return aeshex;
      } else {
        throw UnfoundWalletError();
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
     * load SafeWallet in
     *
     * @param safeWallet load
     */
    loadSafeWallet(safeWallet: SafeWallet): void {
      if (this.hasWallet()) return;
      this.wallet = {
        version: safeWallet.version,
        did: safeWallet.did,
        cipher_txt: safeWallet.cipher_txt,
      };
    }

    /**
     * get the wallet object no keypair
     *
     * @returns SafeWallet or undefined
     */
    getSafeWallet(): SafeWallet | undefined {
      if (this.wallet !== undefined) {
        return {
          version: this.wallet?.version,
          did: this.wallet?.did,
          cipher_txt: this.wallet?.cipher_txt,
        };
      }
      return undefined;
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
        throw new Error('wallet unfound,please generate first.');
      if (!this.hasOpened())
        throw new Error('wallet locked,please open first.');

      return this.keypair;
    }

    /**
     * @returns json string
     */
    keyStoreJsonfy() {
      if (!this.hasWallet())
        throw new Error('wallet unfound,please generate first.');
      return JSON.stringify(this.wallet, walletJsonfy, 2);
    }

    /**
     *
     * @param json
     * @param auth
     * @returns {PWalletType}
     */
    parseJson(json: string, auth: string): PWalletType {
      const wallet: PWalletType = importFromKeystore(
        json,
        auth,
        this.remembered,
      );
      this.setWallet(wallet);
      return wallet;
    }

    // /**
    //  * sign message with wallet secret key
    //  *
    //  * @param {string} message if message from object or multiple concat ,make sure the order
    //  * @returns {string} signature
    //  */
    // sign(message: string): string {
    //   if (this.keypair === undefined || !this.keypair.secretKey)
    //     throw new Error('miss privateKey.');
    //   throw new Error('this method invalid,please used helper.signMessage.');
    //   return message;
    // }

    // /**
    //  * verified signature used wallet public key
    //  *
    //  * @param {string} signature base64 string
    //  * @param message string
    //  */
    // verify(signature: string, message: string): void {
    //   const signbuf = bs64ToUint8Array(signature);
    //   const msgbuf = utf8ToUint8Array(message);

    //   let pub: Uint8Array | undefined = this.keypair?.publicKey || undefined;
    //   if (pub === undefined && this.wallet !== undefined) {
    //     const did: string = this.wallet.did;
    //     pub = id2pub(did);
    //   }

    //   if (!pub || pub.byteLength !== naclSign.publicKeyLength) {
    //     throw new Error('miss public key or bad public key size.');
    //   }

    //   throw new Error('this method invalid,please used helper.verifyMessage.');
    //   // return naclSign.detached.verify(msgbuf, signbuf, pub);
    // }
  }

  /**
   * @returns Error
   */
  function UnfoundWalletError(): Error {
    return new Error('Not found wallet,you can use generate create.');
  }

  /**
   * check auth
   *
   * @param auth
   */
  function checkAuth(auth: string): void {
    if (auth === undefined || !auth.length)
      throw new Error(`Parameter auth required. [auth:${auth || 'undefined'}]`);
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
    const wallet: PWalletType = importFromKeystore(json, auth, remembered);

    modal.setWallet(wallet);

    return modal;
  };

  return {
    version: '0.1.6',
    init,
    create,
    importKeyStore,
    helper: {
      generateKeypair,
      generateWallet: generate,
      AESKeySync,
      keyEncrypt,
      keyDecrypt,
      openWalletByAeskey,
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
