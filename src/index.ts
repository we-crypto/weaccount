/* eslint-disable no-console */
import {
  PWalletType,
  KeystoreType,
  ConfigType,
  WeaccountType,
  KeypairType,
  SafeWallet,
  OpenParamType,
} from './types';

import {
  AESKeySync,
  generateKeypair,
  pub2id,
  id2pub,
  validRound,
} from './key-helper';

import {DEF_ACC_CONFIG, KP} from './consts';

import {enc} from 'crypto-js';
import {Buffer} from 'buffer/';
// import * as CryptoJS from 'crypto-js';

import {
  validHex,
  buf2hex,
  hex2buf,
  str2buf,
  paddingLeft,
  paddingLZero,
} from './util';

import {
  Encrypt,
  // aesDecrypt,
  keyEncrypt,
  keyDecrypt,
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
  openSafeWallet,
} from './generator';

const libVer = '__WEACC_VERSION__';
/**
 *
 */
export default (function (): WeaccountType {
  /**
   * Modal window
   */
  class Modal {
    version: string | undefined;
    weaked: boolean;
    lockedkey: Uint8Array | undefined;
    keystore: KeystoreType | undefined;
    wallet: PWalletType | undefined;
    keypair: KeypairType | undefined;

    keyparams: OpenParamType;

    /**
     *
     * @param config
     * @param config.idPrefix
     * @param config.useSigned
     * @param config.weaked
     * @param config.round
     */
    constructor({
      idPrefix = DEF_ACC_CONFIG.idPrefix,
      weaked = false,
      useSigned = true,
      round = KP.round,
    }: ConfigType) {
      this.version = libVer;
      this.weaked = weaked;

      this.keyparams = {
        idPrefix: idPrefix,
        useSigned: useSigned,
        round: round,
      };
    }

    /**
     *
     * @param config
     */
    setConfig(config: ConfigType): void {
      if (this.hasWallet())
        throw new Error(
          'wallet exist,can not changed config.please reset first.',
        );
      const {idPrefix, weaked, useSigned, round} = config;
      idPrefix && (this.keyparams.idPrefix = idPrefix);
      typeof weaked === 'boolean' && (this.weaked = weaked);
      typeof useSigned === 'boolean' && (this.keyparams.useSigned = useSigned);

      this.weaked &&
        typeof round === 'number' &&
        (this.keyparams.round = validRound(round));
    }

    /**
     * idPrefix,weaked,useSigned,round
     *
     * @returns ConfigType
     */
    getCurrentConfig(): ConfigType {
      const keyparams = this.getSafeKeyparams();
      const config: ConfigType = {
        idPrefix: keyparams.idPrefix,
        weaked: this.weaked,
        useSigned: keyparams.useSigned,
        round: keyparams.round,
      };

      return config;
    }

    /**
     * get instance safe OpenParamType
     * if weaked false keep round default 15
     *
     * @returns OpenParamType
     */
    getSafeKeyparams(): OpenParamType {
      const nkp: OpenParamType = {
        idPrefix: this.keyparams.idPrefix || '',
        useSigned: this.keyparams.useSigned,
        round: this.weaked ? this.keyparams.round : KP.round,
      };
      return nkp;
    }

    /**
     * change modal use weaked key
     * used default weaked 7 round(256)
     */
    changeWeaked(): void {
      if (this.hasWallet())
        throw new Error('wallet exist,can not changed.please reset first.');

      this.weaked = true;
      this.keyparams.round = KP.weakRound;
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
      // this.wallet = generate(auth, this.useSigned);

      this.wallet = generate(auth, this.getSafeKeyparams());

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
        const owallet: PWalletType = openWallet(
          this.wallet,
          auth,
          this.getSafeKeyparams(),
        );
        this.wallet = owallet;
        if (owallet.key) {
          this.keypair = owallet.key;
        }
        return owallet;
      } else {
        throw new Error(
          'Please create a wallet first, uesed Weaccount.create or generate.',
        );
      }
    }

    /**
     *
     * @param aeskey
     * @returns wallet;
     */
    openByAeskey(aeskey: Uint8Array): PWalletType {
      if (this.wallet !== undefined) {
        const nkp = this.getSafeKeyparams();
        const wallet: PWalletType = openWalletByAeskey(
          this.wallet,
          aeskey,
          nkp,
        );
        if (wallet.key) {
          this.keypair = wallet.key;
        }
        return wallet;
      } else {
        throw OpenWalletError('OPEN_FAIL_AESKEY', 'open wallet fail.');
      }
    }

    /**
     *
     * @param auth
     * @returns {string} aeskeyHex
     */
    getAesHex(auth?: string): string {
      if (auth === undefined && this.wallet && this.wallet.key) {
        return buf2hex(this.wallet.key.lockedKey);
      } else {
        checkAuth(auth || '');
      }

      if (this.wallet && auth) {
        let aeshex = '';
        const wallet: PWalletType = openWallet(
          this.wallet,
          auth,
          this.getSafeKeyparams(),
        );
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
      if (wallet.key !== undefined) {
        this.keypair = wallet.key;
      } else {
        this.keypair = undefined;
      }
    }

    /**
     *
     * @param safeWallet
     * @returns Modal
     */
    setSafeWallet(safeWallet: SafeWallet): Modal {
      if (this.hasWallet()) throw new Error('wallet exist,can not set new.');
      this.wallet = {
        version: safeWallet.version,
        did: safeWallet.did,
        cipher_txt: safeWallet.cipher_txt,
      };
      return this;
    }

    /**
     * load SafeWallet in
     *
     * @param safeWallet load
     * @param auth
     */
    loadSafeWallet(safeWallet: SafeWallet, auth: string): void {
      if (this.hasWallet())
        throw new Error('Wallet has exist,please reset first.');
      checkAuth(auth);

      const keypair: KeypairType = openSafeWallet(
        safeWallet,
        auth,
        this.getSafeKeyparams(),
      );
      const wallet: PWalletType = {
        version: safeWallet.version,
        did: safeWallet.did,
        cipher_txt: safeWallet.cipher_txt,
        key: keypair,
      };
      this.wallet = wallet;
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
     * import from JSON this do not change instance wallet
     *
     * @param json
     * @param auth
     * @param config
     * @returns {PWalletType}
     */
    parseJson(json: string, auth: string, config?: ConfigType): PWalletType {
      const {
        idPrefix = DEF_ACC_CONFIG.idPrefix,
        weaked = false,
        useSigned = true,
        round = KP.round,
      } = config || {};

      const nkp: OpenParamType = {
        idPrefix,
        useSigned,
        round: weaked ? round : KP.round,
      };
      const wallet: PWalletType = importFromKeystore(json, auth, nkp);
      if (wallet.key) {
        this.keypair = wallet.key;
      }
      return wallet;
    }
  }

  /**
   * @returns Error
   */
  function UnfoundWalletError(): Error {
    return new Error('Not found wallet,you can use generate create.');
  }

  /**
   *
   * @param errCode
   * @param message
   * @returns {Object}
   */
  function OpenWalletError(errCode: string, message: string): any {
    return {
      errCode: errCode || 'OPEN_FAIL',
      message: message || 'open wallet fail',
    };
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
    !config &&
      (config = {
        idPrefix: DEF_ACC_CONFIG.idPrefix,
        weaked: false,
        useSigned: true,
        round: KP.round,
      });
    modal = new Modal(config);
    return modal;
  };

  /**
   *
   * @param json
   * @param auth
   * @param config [idPrefix,weaked,useSigned,round] optinal
   * @returns wallet instance
   */
  const importKeyStore = (
    json: string,
    auth: string,
    config?: ConfigType,
  ): Modal => {
    const modal = new Modal(config || {});

    const wallet: PWalletType = importFromKeystore(
      json,
      auth,
      modal.getSafeKeyparams(),
    );

    modal.setWallet(wallet);

    return modal;
  };

  return {
    version: libVer,
    Encrypt,
    init,
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
      // CryptoJS,
      Buffer,
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
