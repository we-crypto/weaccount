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
    initPrams();
    initLib();

    //Binding Event
    bindSign();

    bindVerify();
    bindClean();
  }

  /**
   *
   */
  function initLib() {
    // console.log(window.Weaccount);
    if (window.Weaccount) {
      const {helper, tools} = window.Weaccount;
      helper && (window.helper = helper);
      tools && (window.tools = tools);
      tools && tools.enc && (window.Enc = tools.enc);
      tools && tools.nacl && (window.nacl = tools.nacl);
    }
  }

  /**
   *
   */
  function initPrams() {
    const pwd = 'abc3&$_';
    const pubBS64 = 'E3RNrFIWCMe/LNS9RnmhYCRWb5u9nHvq0nGxf1MAoMQ=';

    //[75, 10, 172, 215, 130, 1, 202, 215, 156, 36, 37, 99, 132, 5, 87, 126, 187, 23, 225, 201, 36, 143, 250, 88,
    //52, 62, 48, 146, 224, 63, 234, 197, 19, 116, 77, 172, 82, 22, 8, 199, 191, 44, 212, 189, 70, 121, 161, 96,
    //36, 86, 111, 155, 189, 156, 123, 234, 210, 113, 177, 127, 83, 0, 160, 196]
    //length:64
    // hex: 4b0aacd78201cad79c2425638405577ebb17e1c9248ffa58343e3092e03feac513744dac521608c7bf2cd4bd4679a16024566f9bbd9c7bead271b17f5300a0c4
    const priBS64 =
      'Swqs14IBytecJCVjhAVXfrsX4ckkj/pYND4wkuA/6sUTdE2sUhYIx78s1L1GeaFgJFZvm72ce+rScbF/UwCgxA==';

    fillValue('#password', pwd);
    fillValue('#pubkeyBase64', pubBS64);
    fillValue('#prikeyBase64', priBS64);

    const msg = '科室的%sdf▇';
    fillValue('#message', msg);
  }

  /**  */
  function bindSign() {
    document.querySelector('#signBtn').addEventListener('click', () => {
      try {
        clickHandler();
      } catch (e) {
        console.log(e);
        showError(e.message, 6000);
      }
    });

    /**
     *
     */
    function clickHandler() {
      const params = getParams();

      console.log('Params: ', params);

      // Uint8Array
      const msgUtf8 = helper.msgToUint8Array(params.message);

      // Uint8Array
      const privkeyBuf = helper.bs64ToUint8Array(params.priBase64);
      console.log('Coding: ', msgUtf8, privkeyBuf, privkeyBuf.length);

      const sig = nacl.sign.detached(msgUtf8, privkeyBuf);
      const signatureBs58 = helper.signMessage(params.message, privkeyBuf);

      const signature = helper.uint8ArrayToBase64(sig);

      console.log('sig: ', sig, signature);
      fillContent('p.message-base64-text', msgUtf8);
      fillContent('p.message-signature-text', signature);
      fillContent('p.message-base58-text', signatureBs58);

      // showError(JSON.stringify(params, null, 2), 5000);
    }
  }

  /**
   *
   */
  function bindVerify() {
    document.querySelector('#verifyBtn').addEventListener('click', () => {
      try {
        clickHandler();
      } catch (e) {
        console.log(e);
        showError(e.message, 6000);
      }
    });

    /**
     *
     */
    function clickHandler() {
      const params = getParams();
      console.log('Params: ', params);

      // Uint8Array
      const msgUtf8 = helper.msgToUint8Array(params.message);

      // Uint8Array
      const privkeyBuf = helper.bs64ToUint8Array(params.priBase64);
      console.log('Coding: ', msgUtf8, privkeyBuf, privkeyBuf.length);
      const keypair = nacl.sign.keyPair.fromSecretKey(privkeyBuf);

      const sigBs64 = document.querySelector('p.message-signature-text')
        .textContent;

      const sigBuf = helper.bs64ToUint8Array(sigBs64);

      console.log('Signature: ', sigBs64, sigBuf);

      // nacl.sign.detached.verify(nacl.util.decodeUTF8(this.message()), s, pk)
      let vb = nacl.sign.detached.verify(msgUtf8, sigBuf, keypair.publicKey);

      const sig58 = document.querySelector('p.message-base58-text').textContent;
      let verifyRes = helper.verifyMessage(
        sig58,
        params.message,
        keypair.publicKey,
      );

      console.log('>>>>>>>>>>>>>>>verify58>>>>>', verifyRes);
      const verified = verifyRes ? 'passed.' : 'bad verify';
      setVerifiedRes(verified, vb);
      // fillContent('p.inner-verify-passed', verified);
    }
  }

  /**
   *
   */
  function bindClean() {
    document.querySelector('#cleanBtn').addEventListener('click', () => {
      fillValue('#password', '');
      fillValue('#pubkeyBase64', '');
      fillValue('#prikeyBase64', '');
      fillValue('#message', '');

      fillContent('p.message-base64-text', '');
      fillContent('p.message-signature-text', '');
      fillContent('p.inner-verify-passed', '');

      setVerifiedRes('');
    });
  }

  /** =========================================================== */

  /**
   * @returns {Object}
   */
  function getParams() {
    const params = {
      auth: document.querySelector('#password').value,
      pubBase64: document.querySelector('#pubkeyBase64').value,
      priBase64: document.querySelector('#prikeyBase64').value,
      message: document.querySelector('#message').value,
    };

    return params;
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
   * @param selector
   * @param value
   */
  function fillValue(selector, value) {
    const $el = document.querySelector(selector);
    if ($el) {
      $el.value = value;
    }
  }

  /**
   * @param text
   * @param verified
   */
  function setVerifiedRes(text, verified) {
    if (!text) {
      document.querySelector('p.inner-verify-passed').textContent = '';
    } else {
      document
        .querySelector('p.inner-verify-passed')
        .setAttribute(
          'style',
          !!verified ? 'color:green;font-size:1.5rem;' : 'color:green',
        );
      document.querySelector('p.inner-verify-passed').textContent = text;
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
