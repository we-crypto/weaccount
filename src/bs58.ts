const BS58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const createBs58Map = () => {
  const bs58Map = Array(256).fill(-1);
  for (let i = 0; i < BS58_CHARS.length; ++i)
    bs58Map[BS58_CHARS.charCodeAt(i)] = i;

  return bs58Map;
};

const base58Map = createBs58Map()

export const bs58Encode = (arr:Uint8Array):string => {
  const result: number[] = []
  for (const byte of arr) {
    let carry = byte
    for (let j = 0; j < result.length; ++j) {
      const x = (base58Map[result[j]] << 8) + carry
      result[j] = BS58_CHARS.charCodeAt(x % 58)
      carry = (x / 58) | 0
    }
    while (carry) {
      result.push(BS58_CHARS.charCodeAt(carry % 58))
      carry = (carry / 58) | 0
    }
  }

  for (const byte of arr)
    if (byte) break
    else result.push('1'.charCodeAt(0))

  result.reverse()
  return String.fromCharCode(...result)
}

export const bs58Decode = (bs58: string): Uint8Array => {
  if (!bs58 || typeof bs58 !== 'string')
    throw new Error(`Expected base58 string but got "${bs58}".`);
  if (bs58.match(/[IOl0]/gm))
    throw new Error(`Invalid base58 character "${bs58.match(/[IOl0]/gm)}"`);

  const lz = bs58.match(/^1+/gm);
  const psz = lz ? lz[0].length : 0;
  const size = ((bs58.length - psz) * (Math.log(58) / Math.log(256)) + 1) >>> 0;

  const matches = bs58.match(/.{1}/g);
  let ss = new Uint8Array();
  if(matches!==null){
    ss = matches.map((i) => BS58_CHARS.indexOf(i))
    .reduce((acc, i) => {
      acc = acc.map((j) => {
        const x = j * 58 + i;
        i = x >> 8;
        return x;
      });
      return acc;
    }, new Uint8Array(size))
    .reverse()
    .filter(
      ((lastValue) => (value:any) => (lastValue = lastValue || value))(false),
    );
  }

  return new Uint8Array([
    ...new Uint8Array(psz),...ss
  ]);
};
