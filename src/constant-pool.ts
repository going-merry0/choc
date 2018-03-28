import { AutoOffsetBuffer } from "./auto-offset-buffer";
import * as bigInt from "big-integer";
import { BigNumber } from "bignumber.js";

export class ConstantPool {
  private _table = new Map<number, ConstantInfo>();
  private _buf: AutoOffsetBuffer;
  private _entryCount: number;
  private _count: number;

  constructor(buf: AutoOffsetBuffer, entryCount: number) {
    this._buf = buf;
    this._entryCount = entryCount;
    this._count = 0;
  }

  satisfy() {
    for (let i = 1, len = this._entryCount; i < len; ++i) {
      const tag = this._buf.readUInt8();
      const info = this.readInfo(tag);
      this._table.set(i, info);
      ++this._count;
      if (tag === ConstantType.Long || tag === ConstantType.Double) i += 1;
    }
  }

  getEntry<T>(index: number): T {
    if (this._table.has(index)) return this._table.get(index)! as any;
    return new UnusableConstantInfo() as any;
  }

  private readInfo(tag: number) {
    switch (tag) {
      case ConstantType.Class:
        return this.readClass();
      case ConstantType.Fieldref:
        return this.readFieldref();
      case ConstantType.Methodref:
        return this.readMethodref();
      case ConstantType.InterfaceMethodref:
        return this.readInterfaceMethodref();
      case ConstantType.String:
        return this.readString();
      case ConstantType.Integer:
        return this.readInteger();
      case ConstantType.Float:
        return this.readFloat();
      case ConstantType.Long:
        return this.readLong();
      case ConstantType.Double:
        return this.readDouble();
      case ConstantType.NameAndType:
        return this.readNameAndType();
      case ConstantType.Utf8:
        return this.readUtf8();
      case ConstantType.MethodHandle:
        return this.readMethodHandle();
      case ConstantType.MethodType:
        return this.readMethodType();
      case ConstantType.InvokeDynamic:
        return this.readInvokeDynamic();
      case ConstantType.Module:
        return this.readModule();
      case ConstantType.Package:
        return this.readPackage();
      default:
        throw new Error("unreachable");
    }
  }

  private readClass() {
    const nameIndex = this._buf.readUInt16BE();
    return new ClassInfo(this, nameIndex);
  }

  private readFieldref() {
    const classIndex = this._buf.readUInt16BE();
    const nameAndTypeIndex = this._buf.readUInt16BE();
    return new FieldrefInfo(this, classIndex, nameAndTypeIndex);
  }

  private readMethodref() {
    const classIndex = this._buf.readUInt16BE();
    const nameAndTypeIndex = this._buf.readUInt16BE();
    return new MethodrefInfo(this, classIndex, nameAndTypeIndex);
  }

  private readInterfaceMethodref() {
    const classIndex = this._buf.readUInt16BE();
    const nameAndTypeIndex = this._buf.readUInt16BE();
    return new InterfaceMethodrefInfo(this, classIndex, nameAndTypeIndex);
  }

  private readString() {
    const stringIndex = this._buf.readUInt16BE();
    return new StringInfo(this, stringIndex);
  }

  private readInteger() {
    const bytes = this._buf.forward(4);
    return new IntegerInfo(this, bytes);
  }

  private readFloat() {
    const bytes = this._buf.forward(4);
    return new FloatInfo(this, bytes);
  }

  private readLong() {
    const highBytes = this._buf.forward(4);
    const lowBytes = this._buf.forward(4);
    return new LongInfo(this, highBytes, lowBytes);
  }

  private readDouble() {
    const highBytes = this._buf.forward(4);
    const lowBytes = this._buf.forward(4);
    return new DoubleInfo(this, highBytes, lowBytes);
  }

  private readNameAndType() {
    const nameIndex = this._buf.readUInt16BE();
    const descriptorIndex = this._buf.readUInt16BE();
    return new NameAndTypeInfo(this, nameIndex, descriptorIndex);
  }

  private readUtf8() {
    const length = this._buf.readUInt16BE();
    const bytes = this._buf.forward(length);
    return new Utf8Info(this, length, bytes);
  }

  private readMethodHandle() {
    const referenceKind = this._buf.readUInt8();
    const referenceIndex = this._buf.readUInt16BE();
    return new MethodHandleInfo(this, referenceKind, referenceIndex);
  }

  private readMethodType() {
    const descriptorIndex = this._buf.readUInt16BE();
    return new MethodTypeInfo(this, descriptorIndex);
  }

  private readInvokeDynamic() {
    const bootstrapMethodAttrIndex = this._buf.readUInt16BE();
    const nameAndTypeIndex = this._buf.readUInt16BE();
    return new InvokeDynamicInfo(this, bootstrapMethodAttrIndex, nameAndTypeIndex);
  }

  private readModule() {
    const nameIndex = this._buf.readUInt16BE();
    return new ModuleInfo(this, nameIndex);
  }

  private readPackage() {
    const nameIndex = this._buf.readUInt16BE();
    return new PackageInfo(this, nameIndex);
  }
}

export enum ConstantType {
  Unusable = -1,
  Class = 7,
  Fieldref = 9,
  Methodref = 10,
  InterfaceMethodref = 11,
  String = 8,
  Integer = 3,
  Float = 4,
  Long = 5,
  Double = 6,
  NameAndType = 12,
  Utf8 = 1,
  MethodHandle = 15,
  MethodType = 16,
  InvokeDynamic = 18,
  Module = 19,
  Package = 20
}

export class ConstantInfo {
  readonly tag: number;
  readonly pool: ConstantPool;
  constructor(tag: number, pool: ConstantPool) {
    this.tag = tag;
    this.pool = pool;
  }

  get usable() {
    return true;
  }
}

export class UnusableConstantInfo extends ConstantInfo {
  readonly tag = ConstantType.Unusable;

  constructor() {
    super(ConstantType.Unusable, null as any);
  }

  get usable() {
    return false;
  }
}

export class ClassInfo extends ConstantInfo {
  readonly nameIndex: number;
  constructor(pool: ConstantPool, nameIndex: number) {
    super(ConstantType.Class, pool);
    this.nameIndex = nameIndex;
  }

  get name() {
    return (this.pool.getEntry(this.nameIndex) as Utf8Info).string;
  }
}

export class FieldrefInfo extends ConstantInfo {
  readonly classIndex: number;
  readonly nameAndTypeIndex: number;
  constructor(pool: ConstantPool, classIndex: number, nameAndTypeIndex: number) {
    super(ConstantType.Fieldref, pool);
    this.classIndex = classIndex;
    this.nameAndTypeIndex = nameAndTypeIndex;
  }

  get clazz() {
    return this.pool.getEntry(this.classIndex) as ClassInfo;
  }

  get nameAndType() {
    return this.pool.getEntry(this.nameAndTypeIndex) as NameAndTypeInfo;
  }
}

export class MethodrefInfo extends ConstantInfo {
  readonly classIndex: number;
  readonly nameAndTypeIndex: number;
  constructor(pool: ConstantPool, classIndex: number, nameAndTypeIndex: number) {
    super(ConstantType.Methodref, pool);
    this.classIndex = classIndex;
    this.nameAndTypeIndex = nameAndTypeIndex;
  }

  get clazz() {
    return this.pool.getEntry(this.classIndex) as ClassInfo;
  }

  get nameAndType() {
    return this.pool.getEntry(this.nameAndTypeIndex) as NameAndTypeInfo;
  }
}

export class InterfaceMethodrefInfo extends ConstantInfo {
  readonly classIndex: number;
  readonly nameAndTypeIndex: number;
  constructor(pool: ConstantPool, classIndex: number, nameAndTypeIndex: number) {
    super(ConstantType.InterfaceMethodref, pool);
    this.classIndex = classIndex;
    this.nameAndTypeIndex = nameAndTypeIndex;
  }

  get clazz() {
    return this.pool.getEntry(this.classIndex) as ClassInfo;
  }

  get nameAndType() {
    return this.pool.getEntry(this.nameAndTypeIndex) as NameAndTypeInfo;
  }
}

export class StringInfo extends ConstantInfo {
  readonly stringIndex: number;
  constructor(pool: ConstantPool, stringIndex: number) {
    super(ConstantType.String, pool);
    this.stringIndex = stringIndex;
  }

  get string() {
    return (this.pool.getEntry(this.stringIndex) as Utf8Info).string;
  }
}

export class IntegerInfo extends ConstantInfo {
  readonly bytes: Buffer;
  constructor(pool: ConstantPool, bytes: Buffer) {
    super(ConstantType.Integer, pool);
    this.bytes = bytes;
  }

  get number() {
    return this.bytes.readInt32BE(0);
  }
}

export class FloatInfo extends ConstantInfo {
  readonly bytes: Buffer;
  constructor(pool: ConstantPool, bytes: Buffer) {
    super(ConstantType.Float, pool);
    this.bytes = bytes;
  }

  get number() {
    const bits = this.bytes.readUInt32BE(0);

    if (bits === 0x7f800000) return Number.POSITIVE_INFINITY;
    if (bits === 0xff800000) return Number.NEGATIVE_INFINITY;
    if ((bits >= 0x7f800001 && bits <= 0x7fffffff) || (bits >= 0xff800001 && bits <= 0xffffffff))
      return NaN;

    const s = bits >> 31 == 0 ? 1 : -1;
    const e = (bits >> 23) & 0xff;
    const m = e == 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
    return s * m * Math.pow(2, e - 150);
  }
}

export class LongInfo extends ConstantInfo {
  readonly highBytes: Buffer;
  readonly lowBytes: Buffer;
  constructor(pool: ConstantPool, highBytes: Buffer, lowBytes: Buffer) {
    super(ConstantType.Long, pool);
    this.highBytes = highBytes;
    this.lowBytes = lowBytes;
  }

  get number() {
    const h = bigInt(this.highBytes.readUInt32BE(0));
    const l = bigInt(this.lowBytes.readUInt32BE(0));
    return new BigNumber(
      h
        .shiftLeft(32)
        .plus(l)
        .toString()
    );
  }
}

export class DoubleInfo extends ConstantInfo {
  readonly highBytes: Buffer;
  readonly lowBytes: Buffer;
  constructor(pool: ConstantPool, highBytes: Buffer, lowBytes: Buffer) {
    super(ConstantType.Double, pool);
    this.highBytes = highBytes;
    this.lowBytes = lowBytes;
  }

  get number() {
    const h = bigInt(this.highBytes.readUInt32BE(0));
    const l = bigInt(this.lowBytes.readUInt32BE(0));
    const bits = h.shiftLeft(32).plus(l);

    if (bits.eq(bigInt(0x7ff0000000000000))) return Number.POSITIVE_INFINITY;
    if (bits.eq(bigInt(0xfff0000000000000))) return Number.NEGATIVE_INFINITY;
    if (
      (bits.geq(bigInt(0x7ff0000000000001)) && bits.leq(bigInt(0x7fffffffffffffff))) ||
      (bits.geq(bigInt(0xfff0000000000001)) && bits.leq(bigInt(0xffffffffffffffff)))
    )
      return NaN;

    const s = bits.shiftRight(63).eq(bigInt.zero) ? bigInt(1) : bigInt(-1);
    const e = bits.shiftRight(52).and(bigInt(0x7ff));
    const m = e.eq(bigInt.zero)
      ? bits.and(bigInt(0xfffffffffffff)).shiftLeft(1)
      : bits.and(bigInt(0xfffffffffffff)).or(bigInt(0x10000000000000));
    const bs = new BigNumber(s.toString());
    // pow operation of BigNumber lose the precision?
    return bs.multipliedBy(m.toString()).multipliedBy(Math.pow(2, e.toJSNumber() - 1075).toString());
  }
}

export class NameAndTypeInfo extends ConstantInfo {
  readonly nameIndex: number;
  readonly descriptorIndex: number;
  constructor(pool: ConstantPool, nameIndex: number, descriptorIndex: number) {
    super(ConstantType.NameAndType, pool);
    this.nameIndex = nameIndex;
    this.descriptorIndex = descriptorIndex;
  }
}

export class Utf8Info extends ConstantInfo {
  readonly length: number;
  readonly bytes: Buffer;

  constructor(pool: ConstantPool, length: number, bytes: Buffer) {
    super(ConstantType.Utf8, pool);
    this.length = length;
    this.bytes = bytes;
  }

  private _str: string | null = null;

  private deserialize() {
    let str = "";
    for (let i = 0, len = this.length; i < len; ++i) {
      const byt = this.bytes.readUInt8(i);
      if (byt >= 0x01 && byt <= 0x7f) {
        str += String.fromCharCode(byt);
      } else if (byt === 0x0 || (byt >= 0x80 && byt <= 0x7ff)) {
        const x = this.bytes.readUInt8(i);
        const y = this.bytes.readUInt8(++i);
        str += String.fromCharCode(((x & 0x1f) << 6) + (y & 0x3f));
      } else if (byt >= 0x800 && byt <= 0xffff) {
        const x = this.bytes.readUInt8(i);
        const y = this.bytes.readUInt8(++i);
        const z = this.bytes.readUInt8(++i);
        str += String.fromCharCode(((x & 0x1f) << 6) + (y & 0x3f));
      } else {
        const u = this.bytes.readUInt8(i);
        const v = this.bytes.readUInt8(++i);
        const w = this.bytes.readUInt8(++i);
        const x = this.bytes.readUInt8(++i);
        const y = this.bytes.readUInt8(++i);
        const z = this.bytes.readUInt8(++i);
        str += String.fromCodePoint(
          0x10000 + ((v & 0x0f) << 16) + ((w & 0x3f) << 10) + ((y & 0x0f) << 6) + (z & 0x3f)
        );
      }
    }
    return str;
  }

  get string() {
    if (this._str === null) this._str = this.deserialize();
    return this._str;
  }

  toString() {
    return this.string;
  }
}

export class MethodHandleInfo extends ConstantInfo {
  readonly referenceKind: number;
  readonly referenceIndex: number;
  constructor(pool: ConstantPool, referenceKind: number, referenceIndex: number) {
    super(ConstantType.MethodHandle, pool);
    this.referenceKind = referenceKind;
    this.referenceIndex = referenceIndex;
  }
}

export class MethodTypeInfo extends ConstantInfo {
  readonly descriptorIndex: number;
  constructor(pool: ConstantPool, descriptorIndex: number) {
    super(ConstantType.MethodType, pool);
    this.descriptorIndex = descriptorIndex;
  }
}

export class InvokeDynamicInfo extends ConstantInfo {
  readonly bootstrapMethodAttrIndex: number;
  readonly nameAndTypeIndex: number;
  constructor(pool: ConstantPool, bootstrapMethodAttrIndex: number, nameAndTypeIndex: number) {
    super(ConstantType.InvokeDynamic, pool);
    this.bootstrapMethodAttrIndex = bootstrapMethodAttrIndex;
    this.nameAndTypeIndex = nameAndTypeIndex;
  }
}

export class ModuleInfo extends ConstantInfo {
  readonly nameIndex: number;
  constructor(pool: ConstantPool, nameIndex: number) {
    super(ConstantType.Module, pool);
    this.nameIndex = nameIndex;
  }
}

export class PackageInfo extends ConstantInfo {
  readonly nameIndex: number;
  constructor(pool: ConstantPool, nameIndex: number) {
    super(ConstantType.Package, pool);
    this.nameIndex = nameIndex;
  }
}
