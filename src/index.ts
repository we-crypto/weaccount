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

import {
  validHex,
  buf2hex,
  hex2buf,
  str2buf,
  // decodeUTF8,
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
  splitBuf,
  splitBuf2Hex,
  comboxBuf,
  comboxHexBuf,
} from './crypto-helper';

import {bs58Decode, bs58Encode} from './bs58';
import {
  generate,
  walletJsonfy,
  openWallet,
  importFromKeystore,
} from './generator';

export const Weaccount = ((): WeaccountType => {
  /**
   * Modal window
   */
  class Modal {
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
     */
    constructor({idPrefix = '', remembered = false}: ConstructorType) {
      this.idPrefix = idPrefix;
      this.remembered = remembered;
    }

    /**
     *
     * @param {ConfigType} config
     */
    setConfig(config: ConfigType) {
      const {idPrefix, remembered} = config;
      if (!this.hasWallet()) {
        this.idPrefix = idPrefix || DEF_ACC_CONFIG.idPrefix;
      }

      this.remembered = remembered;
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

      this.wallet = generate(auth);
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
      pub2id,
      id2pub,
      comboxBuf,
      comboxHexBuf,
      splitBuf,
      splitBuf2Hex,
    },
    tools: {
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

// window.Weaccount = Weaccount;
