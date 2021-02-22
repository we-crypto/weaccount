import {WordArray} from 'crypto-js';

export type ConfigType = {
  idPrefix?: string; // Invalid configuration,future extend
  remembered?: boolean;
  useSigned?: boolean;
};

export type WalletKeyType = {
  PubKey: string; //hex
  cipherTxt: string; //base64
};

export type KeystoreType = {
  version: string;
  did: string; //base58
  cipher_txt: string;
  key: WalletKeyType;
};

export type KeypairType = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  lockedKey: Uint8Array;
};

export type PWalletType = {
  version: string;
  did: string; //base58
  cipher_txt: string;
  key?: KeypairType | undefined;
};

export type WalletFormatter = {
  stringfy: (wallet: any) => string;
  parse: (keystore: string) => PWalletType;
};

export type CIvType = {
  iv: Uint8Array;
  cipher: Uint8Array;
  pos?: number | undefined;
};

export type CIvHexType = {
  ivhex: string;
  cipherhex: string;
  pos?: number | undefined;
};

export type SignDataType = {
  time_stamp: number;
  latitude: number;
  longitude: number;
  signature?: string;
  did: string;
};

export type ModalType = {
  hasWallet: () => boolean;
  hasOpen: () => boolean;
  create: (auth: string, config?: ConfigType) => boolean;
  keyStoreJsonfy: () => string;
  // wallet: (auth: string) => KeystoreType;
  // open: (auth: string) => boolean;
  // sign: (signData: SignDataType, auth?: string) => SignDataType;
};

export type ConstructorType = {
  idPrefix?: string;
  remembered?: boolean;
  useSigned?: boolean;
};

export type UtilsType = {
  decodeUTF8: (s: string) => Uint8Array;
  buf2hex: (buf: Uint8Array, hexPrefix?: boolean) => string;
};

export type HelperType = {
  generateKeypair: (auth: string) => KeypairType;
  generateWallet: (auth: string, useSigned?: boolean) => PWalletType;
  AESKeySync: (pub: Uint8Array, password: string) => Uint8Array;
  keyEncrypt: (plainbuf: Uint8Array, aeskey: Uint8Array) => WordArray;
  keyDecrypt: (cipherbuf: Uint8Array, aeskey: Uint8Array) => any;
  signMessage: (message: string, keybuf: Uint8Array) => string;
  verifyMessage: (
    signature: string,
    message: string,
    pubkey: Uint8Array,
  ) => boolean;
  pub2id: (buf: Uint8Array, prefix?: string) => string;
  id2pub: (bs58Id: string, prefix?: string) => Uint8Array;
  comboxBuf: (ivbuf: Uint8Array, cipherbuf: Uint8Array) => Uint8Array;
  comboxHexBuf: (ivhex: string, cipherhex: string) => Uint8Array;
  splitBuf: (buf: Uint8Array, pos: number) => CIvType;
  splitBuf2Hex: (buf: Uint8Array, pos: number) => CIvHexType;
  msgToUint8Array: (message: string) => Uint8Array;
  bs64ToUint8Array: (bs64: string) => Uint8Array;
  uint8ArrayToBase64: (buf: Uint8Array) => string;
};

export type WeaccountType = {
  init: (config?: ConfigType) => void;
  create: (auth: string, config?: ConfigType) => any;
  importKeyStore: (keystore: string, auth: string, config?: ConfigType) => any;
  helper: HelperType;
  tools: any;
};
