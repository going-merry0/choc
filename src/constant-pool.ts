import { AutoOffsetBuffer } from "./auto-offset-buffer";

export class ConstantPool {
  private _table = new Map<number, IConstantInfo>();
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
    const info = new ClassInfo();
    info.nameIndex = this._buf.readUInt16BE();
    return info;
  }

  private readFieldref() {
    const info = new FieldrefInfo();
    info.classIndex = this._buf.readUInt16BE();
    info.nameAndTypeIndex = this._buf.readUInt16BE();
    return info;
  }

  private readMethodref() {
    const info = new MethodrefInfo();
    info.classIndex = this._buf.readUInt16BE();
    info.nameAndTypeIndex = this._buf.readUInt16BE();
    return info;
  }

  private readInterfaceMethodref() {
    const info = new InterfaceMethodrefInfo();
    info.classIndex = this._buf.readUInt16BE();
    info.nameAndTypeIndex = this._buf.readUInt16BE();
    return info;
  }

  private readString() {
    const info = new StringInfo();
    info.stringIndex = this._buf.readUInt16BE();
    return info;
  }

  private readInteger() {
    const info = new IntegerInfo();
    info.bytes = this._buf.forward(4);
    return info;
  }

  private readFloat() {
    const info = new FloatInfo();
    info.bytes = this._buf.forward(4);
    return info;
  }

  private readLong() {
    const info = new LongInfo();
    info.highBytes = this._buf.forward(4);
    info.lowBytes = this._buf.forward(4);
    return info;
  }

  private readDouble() {
    const info = new DoubleInfo();
    info.highBytes = this._buf.forward(4);
    info.lowBytes = this._buf.forward(4);
    return info;
  }

  private readNameAndType() {
    const info = new NameAndTypeInfo();
    info.nameIndex = this._buf.readUInt16BE();
    info.descriptorIndex = this._buf.readUInt16BE();
    return info;
  }

  private readUtf8() {
    const info = new Utf8Info();
    info.length = this._buf.readUInt16BE();
    info.bytes = this._buf.forward(info.length);
    return info;
  }

  private readMethodHandle() {
    const info = new MethodHandleInfo();
    info.referenceKind = this._buf.readUInt8();
    info.referenceIndex = this._buf.readUInt16BE();
    return info;
  }

  private readMethodType() {
    const info = new MethodTypeInfo();
    info.descriptorIndex = this._buf.readUInt16BE();
    return info;
  }

  private readInvokeDynamic() {
    const info = new InvokeDynamicInfo();
    info.bootstrapMethodAttrIndex = this._buf.readUInt16BE();
    info.nameAndTypeIndex = this._buf.readUInt16BE();
    return info;
  }

  private readModule() {
    const info = new ModuleInfo();
    info.nameIndex = this._buf.readUInt16BE();
    return info;
  }

  private readPackage() {
    const info = new PackageInfo();
    info.nameIndex = this._buf.readUInt16BE();
    return info;
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

export interface IConstantInfo {
  readonly tag: number;
}

export class ClassInfo implements IConstantInfo {
  tag = ConstantType.Class;
  nameIndex: number;
}

export class FieldrefInfo implements IConstantInfo {
  tag = ConstantType.Fieldref;
  classIndex: number;
  nameAndTypeIndex: number;
}

export class MethodrefInfo implements IConstantInfo {
  tag = ConstantType.Fieldref;
  classIndex: number;
  nameAndTypeIndex: number;
}

export class InterfaceMethodrefInfo implements IConstantInfo {
  tag = ConstantType.InterfaceMethodref;
  classIndex: number;
  nameAndTypeIndex: number;
}

export class StringInfo implements IConstantInfo {
  tag = ConstantType.String;
  stringIndex: number;
}

export class IntegerInfo implements IConstantInfo {
  tag = ConstantType.Integer;
  bytes: Buffer;
}

export class FloatInfo implements IConstantInfo {
  tag = ConstantType.Float;
  bytes: Buffer;
}

export class LongInfo implements IConstantInfo {
  tag = ConstantType.Long;
  highBytes: Buffer;
  lowBytes: Buffer;
}

export class DoubleInfo implements IConstantInfo {
  tag = ConstantType.Double;
  highBytes: Buffer;
  lowBytes: Buffer;
}

export class NameAndTypeInfo implements IConstantInfo {
  tag = ConstantType.NameAndType;
  nameIndex: number;
  descriptorIndex: number;
}

export class Utf8Info implements IConstantInfo {
  tag = ConstantType.Utf8;
  length: number;
  bytes: Buffer;
}

export class MethodHandleInfo implements IConstantInfo {
  tag = ConstantType.MethodHandle;
  referenceKind: number;
  referenceIndex: number;
}

export class MethodTypeInfo implements IConstantInfo {
  tag = ConstantType.MethodType;
  descriptorIndex: number;
}

export class InvokeDynamicInfo implements IConstantInfo {
  tag = ConstantType.InvokeDynamic;
  bootstrapMethodAttrIndex: number;
  nameAndTypeIndex: number;
}

export class ModuleInfo implements IConstantInfo {
  tag = ConstantType.Module;
  nameIndex: number;
}

export class PackageInfo implements IConstantInfo {
  tag = ConstantType.Package;
  nameIndex: number;
}
