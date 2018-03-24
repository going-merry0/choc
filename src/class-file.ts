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

export class ClassFile {
  magic: number;
  minorVersion: number;
  majorVersion: number;
  constantPoolCount: number;
  accessFlag: number;
}
