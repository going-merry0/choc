import * as fs from "fs";
import { promisify } from "util";
import { ClassFile } from "./class-file";

const readFile = promisify(fs.readFile);

export class Deserializer {
  buf: Buffer;
  idx: number;

  static async fromFile(file: string) {
    const buf = await readFile(file);
    return new Deserializer(buf);
  }

  constructor(buf: Buffer) {
    this.buf = buf;
    this.idx = 0;
  }

  process() {
    const cf = new ClassFile();
    cf.magic = this.read32();
    cf.minorVersion = this.read16();
    cf.majorVersion = this.read16();
    cf.constantPoolCount = this.read16();
    return cf;
  }

  private read32() {
    const n = this.buf.readUInt32BE(this.idx);
    this.idx += 4;
    return n;
  }

  private read16() {
    const n = this.buf.readUInt16BE(this.idx);
    this.idx += 2;
    return n;
  }
}
