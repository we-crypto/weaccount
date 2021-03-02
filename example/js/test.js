/* eslint-disable no-console */
!(function (window) {
  if (!window.Weaccount) {
    console.error('lost Weaccount package.');
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      console.log(window.Weaccount);
      initDomLoaded();
    });
  }

  /**
   *
   */
  function initDomLoaded() {
    const opts = {
      idPrefix: 'Did',
      remembered: true,
      useSigned: true,
    };
    window.Weaccount.init(opts);
    initLib();
    bindGenerator();
    bindOpenWallet();
    bindImportOpen();
    bindGenEnDeAll();
  }

  /**
   *
   */
  function initLib() {
    // console.log(window.Weaccount);
    if (window.Weaccount) {
      const {helper, tools} = window.Weaccount;

      // Account.bufUtil && (window.bufUtil = Account.bufUtil);
      helper && (window.helper = helper);
      tools && (window.tools = tools);

      tools && tools.enc && (window.Enc = tools.enc);
      tools && tools.CryptoJS && (window.CryptoJS = tools.CryptoJS);
      tools && tools.Buffer && (window.Buffer = tools.Buffer);
      // Account.cryptoJS && (window.cryptoJS = Account.cryptoJS);
    }
  }

  /**
   *
   */
  function bindGenerator() {
    document.querySelector('#createBtn').addEventListener('click', () => {
      try {
        clickHandler();
      } catch (e) {
        showError(e.message, 8000);
      }
    });

    /**
     *
     */
    function clickHandler() {
      const $pwd = document.querySelector('input[name="password"]');
      if (!$pwd || !$pwd.value || $pwd.value.toString().trim().length < 3) {
        throw new Error('password must more than 3 letters.');
      }

      const modal = Weaccount.create($pwd.value);
      window.$modal = modal;

      fillText('keystoreJson', modal.keyStoreJsonfy());
    }
  }

  /**
   *
   */
  function bindOpenWallet() {
    document.querySelector('#openWalletBtn').addEventListener('click', () => {
      try {
        clickHandler();
      } catch (e) {
        console.error(e);
        showError(e.message, 8000);
      }
    });

    /**
     *
     */
    function clickHandler() {
      if (!window.$modal) {
        throw new Error('no wallet,please create first. click Create button');
      }
      const password = document.querySelector('#password').value;
      if (!password) {
        throw new Error('password must more than 3 letters.');
      }

      const modal = window.$modal;

      const owallet = modal.open(password);

      const jsonStr = JSON.stringify(
        owallet,
        (k, v) => {
          return v instanceof Uint8Array ? tools.buf2hex(v) : v;
        },
        2,
      );

      fillContent('#openKeystoreJson', jsonStr);
    }
  }

  /** ========================== Import Test: keyEncrypt & keyDecrypt ========================== */
  function bindImportOpen() {
    document.querySelector('#importOpenBtn').addEventListener('click', () => {
      try {
        clickHandler();
      } catch (e) {
        showError(e.message, 8000);
      }
    });

    /**
     *
     */
    function clickHandler() {
      const jsontext = document.querySelector(
        '#importSection textarea[name="keystoreJson"]',
      ).value;
      const pwd = document.querySelector('#password1').value;

      const modal = Weaccount.importKeyStore(jsontext, pwd, {
        remembered: false,
      });

      const jsonStr = JSON.stringify(
        modal.wallet,
        (k, v) => {
          return v instanceof Uint8Array ? tools.buf2hex(v) : v;
        },
        2,
      );

      fillContent('#importSection p.importOpenKeyJson', jsonStr);

      console.log('jsontext>>>>', jsontext, pwd);
    }
  }

  /**
   * keyEncrypt & keyDecrypt
   */
  function bindGenEnDeAll() {
    /**
     * {
        "version": 1,
        "did": "didBU7LnkT6u1QiFcHYvGY1LEWk85arjapBYBDkLz4nKBSm",
        "cipher_txt": "gAkz8aoGKt7CY6586u8d3TMqaEPQyYTTaTHXnmahvN5K1R8cPuP8q5DSEGMQ4aSaBFiPa8hYtAb4fHqwC1jQmm7BSrzEWUW641vEgYhA99iZ2"
      }
     **/
    document.querySelector('#genEnDeAll').addEventListener('click', () => {
      const $pwd = document.querySelector('input[name="password"]');
      if ($pwd && $pwd.value && $pwd.value.toString().trim().length >= 3) {
        try {
          const tools = Weaccount.tools,
            helper = Weaccount.helper;

          const aeshex =
              '92fdd8030533b6fdd37cc7fc6559d062728d4d2f3740b3439aa792968dee0c1b',
            prihex =
              '234df8d00d6f77aec596bfa76f6d7b7027639a8c1b017cf826ce8837f8ae8ce09b86b89aae0f622efbe13f35fb23270a68f8856b397f658ff98a07555de79b7e',
            pubhex =
              '9b86b89aae0f622efbe13f35fb23270a68f8856b397f658ff98a07555de79b7e';

          fillContent('#endeSection .aeskey-arr', tools.hex2buf(aeshex));
          fillContent('#endeSection .aeskey-hex', aeshex);

          fillContent('#endeSection .pubkey-arr', tools.hex2buf(pubhex));
          fillContent('#endeSection .pubkey-hex', pubhex);

          fillContent('#endeSection .prikey-arr', tools.hex2buf(prihex));
          fillContent('#endeSection .prikey-hex', prihex);
          fillContent('#endeSection p.before-plaintxt-hex', prihex);

          const aeskey = tools.hex2buf(aeshex);
          const plaintxtbuf = tools.hex2buf(prihex);

          // encrypt
          const encrypted = helper.keyEncrypt(plaintxtbuf, aeskey);
          console.log('>encrypted>>>>>>>>>>>>>>', encrypted);
          const ciphertextHex = encrypted.ciphertext.toString();
          const ivhex = encrypted.iv.toString();
          const deAeskeyHex = encrypted.key.toString();
          const sumCipherbuf = helper.comboxHexBuf(ivhex, ciphertextHex);
          const sumCipherhex = tools.buf2hex(sumCipherbuf);

          fillContent('#endeSection p.aeskeyhex-text', deAeskeyHex);
          fillContent('#endeSection p.ivhex-text', ivhex);
          fillContent('#endeSection p.encrpted-hex', ciphertextHex);
          fillContent('#endeSection p.encrypted-text', encrypted.toString());
          fillContent('#endeSection p.combox-hex', sumCipherhex);

          // decrypt
          const decrypted = helper.keyDecrypt(sumCipherbuf, aeskey);

          console.log(decrypted.toString());
          fillContent('#endeSection p.decrypted-hex', decrypted.toString());
          fillContent(
            '#endeSection p.prikey-decrypted-len',
            decrypted.toString().length,
          );
        } catch (e) {
          console.error(e);
        }
      } else {
        showError('password must more than 3 letters.', 6000);
      }
    });
  }

  /**
   * @param id
   * @param content
   */
  function fillText(id, content) {
    const $el = document.querySelector(`#${id}`);
    if ($el) {
      $el.textContent = content;
    }
  }

  /**
   * @param selector
   * @param content
   */
  function fillContent(selector, content) {
    const $el = document.querySelector(selector);
    if ($el) {
      $el.textContent = content;
    }
  }

  /**
   * @param text
   * @param ts
   */
  function showError(text, ts) {
    if (!ts || ts < 2000) ts = 2000;
    document.querySelector('.v-error>p').textContent = text || 'error';
    setTimeout(() => {
      document.querySelector('.v-error>p').textContent = '';
    }, ts);
  }
})(window);
