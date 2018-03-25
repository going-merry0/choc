import { ConstantPool } from "./constant-pool";

export enum AccessFlag {
  PUBLIC = 0x0001,
  FINAL = 0x0010,
  SUPER = 0x0020,
  INTERFACE = 0x0200,
  ABSTRACT = 0x0400,
  SYNTHETIC = 0x1000,
  ANNOTATION = 0x2000,
  ENUM = 0x4000,
  MODULE = 0x8000
}

export class AttributeInfo {
  nameIndex: number;
  length: number;
  info: Buffer;
}

export class FieldInfo {
  accessFlags: number;
  nameIndex: number;
  descriptorIndex: number;
  attributesCount: number;
  attributes: AttributeInfo[];
}

export class MethodInfo {
  accessFlags: number;
  nameIndex: number;
  descriptorIndex: number;
  attributesCount: number;
  attributes: AttributeInfo[];
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
}
