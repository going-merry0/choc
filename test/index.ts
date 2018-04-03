import * as assert from "assert";
import * as path from "path";
import { Deserializer } from "../src";
import { LongInfo, DoubleInfo, Utf8Info } from "../src/constant-pool";

(async () => {
  const dec = await Deserializer.fromFile(path.resolve(__dirname, "case1/ClassA.class"));
  const cf = dec.satisfy();
  console.log("Class: " + cf.name);

  console.log("SuperClass: " + cf.getSuperClass());

  console.log("Interfaces: " + cf.getInterfaces());

  console.log("\nfields(name|descriptor|signature):");
  cf.fields.forEach(f => console.log(`  ${f.name}  ${f.descriptor}  ${f.signature}`));

  console.log("\nmethods(name|descriptor|signature|formalParams):");
  cf.methods.forEach(m =>
    console.log(`  ${m.name}  ${m.descriptor}  ${m.signature}  ${m.formalParams}`)
  );
})();
