# @wecrpto/weaccount

> an wechat miniProgram Crypto js lib
>
> Use this lib can create an account base on ed25519 & sign & verify
>
> Public-key authenticated Implements x25519-xsalsa20-poly1305.
>
> Secret-key Implements xsalsa20-poly1305.
>


# Documentation

> @wecrpto/weaccount dependency @wecrpto/nacl ,so need install it.

## Install

```bash
yarn add @wecrpto/nacl  @wecrpto/weaccount
```

or NPM

```bash
npm i --save @wecrpto/nacl  @wecrpto/weaccount
```

## Use

```js
let nacl = require('@wecrpto/nacl');

nacl.setPRNG(randomBytes);  //if lib use in wechat miniProgram ,this step required.

import {init,helper,tool} from '@wecrpto/weaccount'; // es6 import first

const config = {
  idPrefix:'ABC',
  weaked:false,
  useSigned:true,
  round:15
}

let account = init(config);
// account.create(password); v1.x remove

account.generate('123');

/**
 * get safe wallet
 */
account.getSafeWallet();

```

## API

> global methods:
>
> init(cfg)
>
> importKeyStore(json,password,config)


#### Account[modal]

  init account instance, this required.it will return an modal instance.

> Modal instance methods
>
> generate(password) : create an wallet account,only no wallet.
>
> reset(): clean wallet account.
>
> open(password):
>
> openByAeskey(aeskey):
>
> lock():
>
> loadSafeWallet(SafeWallet,password):
>
> getSafeWallet()
>
> hasWallet():
>
> hasOpened():
>
> getKeypair():
>
> keyStoreJsonfy()
>
> parseJson(keystoreJson,password)




```javascript
let modal = init({remembered:true});

let wallet = modal.generate('123'); // or let modal = create('123')


```

#### SafeWallet Struct

```json
{
  "version":1,
  "did":"didUKGP7FLByRwyRQHyD5t2TeWDsFXqBtHXemVWFfm5wZA",
  "cipher_txt":"2asU2U3W6XJ3gtKmShrUhYwucfWKFHLyVnPFEABJ11zScQwJqKgokNEobJseACTKp1KQXb5RzS2bdXLhy1ATgLx5Cvc71Q8rvdd1Yu2jonL7b4"
}
```


#### Keypair

```javascript
let keypair = modal.getKeypair()
```

```js
{
  "publicKey":Uint8Array,
  "secretKey":Uint8Array,
  "lockedKey":Uint8Array
}

```

### Import from safeWallet

> import from a safewallet JSON or object

```js
const safewallet = {...}; // safeWallet
const modal = init({idPrefix:'ok',weaked:true,round:8});  // weaked & round must same as generate safewallet

modal.loadSafeWallet(safewallet,password);

```
