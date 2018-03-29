import * as assert from "assert";
import * as path from "path";
import { Deserializer } from "../../src";
import { LongInfo, DoubleInfo,Utf8Info } from "../../src/constant-pool";

(async () => {
  const dec = await Deserializer.fromFile(path.resolve(__dirname, "World.class"));
  const cf = dec.satisfy();
  assert.equal(cf.magic, 0xcafebabe, "magic");
  console.log(cf.constantPool.getEntry<DoubleInfo>(13).number.toString());
  console.log(cf.constantPool.getEntry<LongInfo>(17).number.toString());
  console.log(cf.constantPool.getEntry<Utf8Info>(40).toString());
})();
