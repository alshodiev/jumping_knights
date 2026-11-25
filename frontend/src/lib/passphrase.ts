const WORDS = ("amber apple arrow badge beach berry bishop blaze bloom board breeze bridge castle cedar check cherry cloud clover comet coral crane crown dawn delta drift eagle ember falcon fern field flame forest frost garden ginger glade globe grove harbor hazel honey island jade jungle kernel knight lantern lemon lilac lotus maple meadow mint moon mosaic oak ocean olive orchid panda pearl pine plum pond queen rabbit raven river robin rook sage sailor silver spark spruce stone summer swan tiger tulip valley velvet violet willow winter zebra").split(" ");

/** e.g. "maple-rook-ember-pearl-482". Easy to read out loud, hard to guess. */
export function generatePassphrase(): string {
  const r = new Uint32Array(5);
  crypto.getRandomValues(r);
  const words = [0, 1, 2, 3].map((i) => WORDS[r[i] % WORDS.length]);
  return `${words.join("-")}-${100 + (r[4] % 900)}`;
}
