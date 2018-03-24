import { Deserializer } from "../../src";
import * as path from "path";
import * as assert from "assert";

(async () => {
  const dec = await Deserializer.fromFile(path.resolve(__dirname, "World.class"));
  const cf = dec.process();
  assert.equal(cf.magic, 0xcafebabe, "magic");
  console.log(cf);
})();
