import { ConstantPool, ClassInfo } from "./constant-pool";
import { Utf8Info } from "../dist/src/constant-pool";
import * as assert from "assert";
import { AutoOffsetBuffer } from "./auto-offset-buffer";

export enum ClassAccessFlag {
  Public = 0x0001,
  Final = 0x0010,
  Super = 0x0020,
  Interface = 0x0200,
  Abstract = 0x0400,
  Synthetic = 0x1000,
  Annotation = 0x2000,
  Enum = 0x4000,
  Module = 0x8000
}

export enum FieldAccessFlag {
  Public = 0x0001,
  Private = 0x0002,
  Protected = 0x0004,
  Static = 0x0008,
  Final = 0x0010,
  Volatile = 0x0040,
  Transient = 0x0080,
  Synthetic = 0x1000,
  Enum = 0x4000
}

export enum MethodAccessFlag {
  Public = 0x0001,
  Private = 0x0002,
  Protected = 0x0004,
  Static = 0x0008,
  Final = 0x0010,
  Synchronized = 0x0020,
  Bridge = 0x0040,
  Varargs = 0x0080,
  Native = 0x0100,
  Abstract = 0x0400,
  Strict = 0x0800,
  Synthetic = 0x1000
}

export enum AttributeInfoType {
  Unspecified = "unspecified",
  ConstantValue = "ConstantValue",
  Code = "Code",
  StackMapTable = "StackMapTable",
  Exceptions = "Exceptions",
  BootstrapMethods = "BootstrapMethods",
  InnerClasses = "InnerClasses",
  EnclosingMethod = "EnclosingMethod",
  Synthetic = "Synthetic",
  Signature = "Signature",
  SourceFile = "SourceFile",
  LineNumberTable = "LineNumberTable",
  LocalVariableTable = "LocalVariableTable",
  LocalVariableTypeTable = "LocalVariableTypeTable",
  SourceDebugExtension = "SourceDebugExtension",
  Deprecated = "Deprecated",
  RuntimeVisibleAnnotations = "RuntimeVisibleAnnotations",
  RuntimeInvisibleAnnotations = "RuntimeInvisibleAnnotations",
  RuntimeVisibleParameterAnnotations = "RuntimeVisibleParameterAnnotations",
  RuntimeInvisibleParameterAnnotations = "RuntimeInvisibleParameterAnnotations",
  RuntimeVisibleTypeAnnotations = "RuntimeVisibleTypeAnnotations",
  RuntimeInvisibleTypeAnnotations = "RuntimeInvisibleTypeAnnotations",
  AnnotationDefault = "AnnotationDefault",
  MethodParameters = "MethodParameters",
  Module = "Module",
  ModulePackages = "ModulePackages",
  ModuleMainClass = "ModuleMainClass"
}

export class AttributeInfo {
  type = AttributeInfoType.Unspecified;
  nameIndex: number;
  length: number;
  info: Buffer;
  constantPool: ConstantPool;

  constructor(attr?: AttributeInfo) {
    if (attr instanceof AttributeInfo) {
      this.nameIndex = attr.nameIndex;
      this.length = attr.length;
      this.info = attr.info;
      this.constantPool = attr.constantPool;
    }
  }

  get name() {
    return this.constantPool.getEntry<Utf8Info>(this.nameIndex).string;
  }

  getType() {
    return this.name;
  }

  get isConstantValue() {
    return this.name === AttributeInfoType.ConstantValue;
  }

  get isCode() {
    return this.name === AttributeInfoType.Code;
  }

  get isSignature() {
    return this.name === AttributeInfoType.Signature;
  }

  get isMethodParameters() {
    return this.name === AttributeInfoType.MethodParameters;
  }

  satisfy() {
    this.type = this.name as any;
  }

  to<T extends AttributeInfo>(ctor: new (...args: any[]) => T) {
    const attr = new ctor(this);
    attr.satisfy();
    return attr;
  }
}

export class ConstantValueAttr extends AttributeInfo {
  type = AttributeInfoType.ConstantValue;
  constantValueIndex: number;

  satisfy() {
    this.constantValueIndex = this.info.readUInt16BE(0);
  }
}

export class CodeAttrExceptionTableEntry {
  startPC: number;
  endPC: number;
  handlerPC: number;
  catchType: number;
}

export class CodeAttr extends AttributeInfo {
  type = AttributeInfoType.Code;
  maxStack: number;
  maxLocals: number;
  codeLength: number;
  code: Buffer;
  exceptionTableLength: number;
  exceptionTable: CodeAttrExceptionTableEntry[];
  attributesCount: number;
  attributes: AttributeInfo[];

  satisfy() {
    const buf = new AutoOffsetBuffer(this.info, 0);
    this.maxStack = buf.readUInt16BE();
    this.maxLocals = buf.readUInt16BE();
    this.codeLength = buf.readUInt32BE();
    this.code = buf.forward(this.codeLength);
    this.exceptionTableLength = buf.readUInt16BE();
    this.exceptionTable = [];
    for (let i = 0, len = this.exceptionTableLength; i < len; ++i) {
      const entry = new CodeAttrExceptionTableEntry();
      entry.startPC = buf.readUInt16BE();
      entry.endPC = buf.readUInt16BE();
      entry.handlerPC = buf.readUInt16BE();
      entry.catchType = buf.readUInt16BE();
      this.exceptionTable.push(entry);
    }
    this.attributesCount = buf.readUInt16BE();
    this.attributes = [];
    for (let i = 0, len = this.attributesCount; i < len; ++i) {
      const attr = new AttributeInfo();
      attr.nameIndex = buf.readUInt16BE();
      attr.length = buf.readUInt32BE();
      attr.info = buf.forward(attr.length);
      this.attributes.push(attr);
    }
  }
}

export class SourceFileAttr extends AttributeInfo {
  type = AttributeInfoType.SourceFile;
  sourceFileIndex: number;

  satisfy() {
    this.sourceFileIndex = this.info.readUInt16BE(0);
  }

  get sourceFile() {
    return this.constantPool.getEntry<Utf8Info>(this.sourceFileIndex).string;
  }
}

export class InnerClassTableEntry {
  innerClassInfoIndex: number;
  outerClassInfoIndex: number;
  innerNameIndex: number;
  innerClassAccessFlags: number;
}

export class InnerClassesAttr extends AttributeInfo {
  type = AttributeInfoType.InnerClasses;
  numberOfClasses: number;
  classTable: InnerClassTableEntry[];

  satisfy() {
    const buf = new AutoOffsetBuffer(this.info, 0);
    this.numberOfClasses = buf.readUInt16BE();
    this.classTable = [];
    for (let i = 0, len = this.numberOfClasses; i < len; ++i) {
      const entry = new InnerClassTableEntry();
      entry.innerClassInfoIndex = buf.readUInt16BE();
      entry.outerClassInfoIndex = buf.readUInt16BE();
      entry.innerNameIndex = buf.readUInt16BE();
      entry.innerClassAccessFlags = buf.readUInt16BE();
      this.classTable.push(entry);
    }
  }
}

export class MethodParameterTableEntry {
  nameIndex: number;
  accessFlags: number;
}

export class MethodParameters extends AttributeInfo {
  type = AttributeInfoType.MethodParameters;
  parametersCount: number;
  parameterTable: MethodParameterTableEntry[];

  satisfy() {
    const buf = new AutoOffsetBuffer(this.info, 0);
    this.parametersCount = buf.readUInt8();
    this.parameterTable = [];
    for (let i = 0, len = this.parametersCount; i < len; ++i) {
      const entry = new MethodParameterTableEntry();
      entry.nameIndex = buf.readUInt16BE();
      entry.accessFlags = buf.readUInt16BE();
      this.parameterTable.push(entry);
    }
  }

  get formalParams() {
    return this.parameterTable.map(p => this.constantPool.getEntry<Utf8Info>(p.nameIndex).string);
  }
}

export class SignatureAttr extends AttributeInfo {
  type = AttributeInfoType.Signature;
  signatureIndex: number;

  satisfy() {
    this.signatureIndex = this.info.readUInt16BE(0);
  }

  get signature() {
    return this.constantPool.getEntry<Utf8Info>(this.signatureIndex).string;
  }
}

export class FieldInfo {
  accessFlags: number;
  nameIndex: number;
  descriptorIndex: number;
  attributesCount: number;
  attributes: AttributeInfo[];
  constantPool: ConstantPool;
  constructor(constantPool: ConstantPool) {
    this.constantPool = constantPool;
  }

  get name() {
    return this.constantPool.getEntry<Utf8Info>(this.nameIndex).string;
  }

  get descriptor() {
    return this.constantPool.getEntry<Utf8Info>(this.descriptorIndex).string;
  }

  get signature() {
    const attrs = this.attributes.filter(attr => attr.isSignature);
    if (attrs.length === 1) return attrs[0].to<SignatureAttr>(SignatureAttr);
    return null;
  }
}

export class MethodInfo {
  accessFlags: number;
  nameIndex: number;
  descriptorIndex: number;
  attributesCount: number;
  attributes: AttributeInfo[];
  constantPool: ConstantPool;
  constructor(constantPool: ConstantPool) {
    this.constantPool = constantPool;
  }

  get name() {
    return this.constantPool.getEntry<Utf8Info>(this.nameIndex).string;
  }

  get descriptor() {
    return this.constantPool.getEntry<Utf8Info>(this.descriptorIndex).string;
  }

  get signature() {
    const attrs = this.attributes.filter(attr => attr.isSignature);
    if (attrs.length === 1) return attrs[0].to<SignatureAttr>(SignatureAttr);
    return null;
  }

  get formalParams() {
    const attrs = this.attributes.filter(attr => attr.isMethodParameters);
    if (attrs.length === 1) return attrs[0].to<MethodParameters>(MethodParameters).formalParams;
    return [];
  }
}

export class ClassFile {
  magic: number;
  minorVersion: number;
  majorVersion: number;
  constantPoolCount: number;
  constantPool: ConstantPool;
  accessFlag: number;
  thisClass: number;
  superClass: number;
  interfacesCount: number;
  interfaces: number[];
  fieldsCount: number;
  fields: FieldInfo[];
  methodsCount: number;
  methods: MethodInfo[];
  attributesCount: number;
  attributes: AttributeInfo[];

  get name() {
    return this.constantPool.getEntry<ClassInfo>(this.thisClass).name;
  }

  getSuperClass() {
    return this.constantPool.getEntry<ClassInfo>(this.superClass).name;
  }

  getInterfaces() {
    return this.interfaces.map(itf => this.constantPool.getEntry<ClassInfo>(itf).name);
  }
}
