DATAMODEL
Datamodel {
  dataset: {
    name: 'struct',
    attributes: {
      name: '<NAME>',
      nodeId: '',
      dataType: 'StringAndArray',
      comment: '',
      arraySize: 0,
      info: '<infoId0>'
    },
    children: [ [Object], [Object], [Object], [Object], [Object], [Object] ]
  },
  fileLines: [
    '',
    'TYPE',
    '\tIntStruct_typ : \tSTRUCT ',
    '\t\tMyInt13 : UDINT',
    '\t\tMyInt14 : ARRAY[0..2]OF USINT',
    '\t\tMyInt133 : UDINT',
    '\t\tMyInt124 : ARRAY[0..2]OF USINT',
    '\tEND_STRUCT',
    '\tIntStruct1_typ : \tSTRUCT ',
    '\t\tMyInt13 : UDINT',
    '\tEND_STRUCT',
    '\tIntStruct2_typ : \tSTRUCT ',
    '\t\tMyInt23 : UDINT',
    '\t\tMyInt24 : ARRAY[0..3]OF USINT',
    '\t\tMyInt25 : UDINT',
    '\tEND_STRUCT',
    '\tStringAndArray : \tSTRUCT ',
    '\t\tMyInt1 : UDINT (*PUB*)',
    '\t\tMyString : ARRAY[0..2]OF STRING[80] (*PUB*)',
    '\t\tMyInt2 : ARRAY[0..4]OF USINT (*PUB SUB*)',
    '\t\tMyIntStruct : ARRAY[0..5]OF IntStruct_typ (*PUB SUB*)',
    '\t\tMyIntStruct1 : IntStruct1_typ (*PUB SUB*)',
    '\t\tMyIntStruct2 : IntStruct2_typ (*PUB SUB*)',
    '\tEND_STRUCT',
    'END_TYPE',
    ''
  ],
  dataTypeCode: 'typedef struct IntStruct2_typ\r\n' +
    '{\r\n' +
    '    uint32_t MyInt23;\r\n' +
    '    uint8_t MyInt24[4];\r\n' +
    '    uint32_t MyInt25;\r\n' +
    '\r\n' +
    '} IntStruct2_typ;\r\n' +
    '\r\n' +
    'typedef struct IntStruct1_typ\r\n' +
    '{\r\n' +
    '    uint32_t MyInt13;\r\n' +
    '\r\n' +
    '} IntStruct1_typ;\r\n' +
    '\r\n' +
    'typedef struct IntStruct_typ\r\n' +
    '{\r\n' +
    '    uint32_t MyInt13;\r\n' +
    '    uint8_t MyInt14[3];\r\n' +
    '    uint32_t MyInt133;\r\n' +
    '    uint8_t MyInt124[3];\r\n' +
    '\r\n' +
    '} IntStruct_typ;\r\n' +
    '\r\n' +
    'typedef struct StringAndArray\r\n' +
    '{\r\n' +
    '    uint32_t MyInt1; //PUB\r\n' +
    '    char MyString[3][81]; //PUB\r\n' +
    '    uint8_t MyInt2[5]; //PUB SUB\r\n' +
    '    struct IntStruct_typ MyIntStruct[6]; //PUB SUB\r\n' +
    '    struct IntStruct1_typ MyIntStruct1; //PUB SUB\r\n' +
    '    struct IntStruct2_typ MyIntStruct2; //PUB SUB\r\n' +
    '\r\n' +
    '} StringAndArray;\r\n' +
    '\r\n',
  dataTypeCodeSWIG: 'typedef struct IntStruct2_typ\r\n' +
    '{\r\n' +
    '    uint32_t MyInt23;\r\n' +
    '    // array not exposed directly:    uint8_t MyInt24[4];\r\n' +
    '    uint32_t MyInt25;\r\n' +
    '\r\n' +
    '} IntStruct2_typ;\r\n' +
    '\r\n' +
    '<sai>{"swiginfo": [{"structname": "IntStruct2_typ", "membername": "MyInt24", "datatype": "uint8_t", "arraysize": "4", "stringsize": "0"}]}</sai>typedef struct IntStruct1_typ\r\n' +
    '{\r\n' +
    '    uint32_t MyInt13;\r\n' +
    '\r\n' +
    '} IntStruct1_typ;\r\n' +
    '\r\n' +
    'typedef struct IntStruct_typ\r\n' +
    '{\r\n' +
    '    uint32_t MyInt13;\r\n' +
    '    // array not exposed directly:    uint8_t MyInt14[3];\r\n' +
    '    uint32_t MyInt133;\r\n' +
    '    // array not exposed directly:    uint8_t MyInt124[3];\r\n' +
    '\r\n' +
    '} IntStruct_typ;\r\n' +
    '\r\n' +
    '<sai>{"swiginfo": [{"structname": "IntStruct_typ", "membername": "MyInt14", "datatype": "uint8_t", "arraysize": "3", "stringsize": "0"},{"structname": "IntStruct_typ", "membername": "MyInt124", "datatype": "uint8_t", "arraysize": "3", "stringsize": "0"}]}</sai>',
  headerFile: {
    name: 'exos_stringandarray.h',
    contents: '/*Automatically generated header file from StringAndArray.typ*/\r\n' +
      '\r\n' +
      '#ifndef _EXOS_COMP_STRINGANDARRAY_H_\r\n' +
      '#define _EXOS_COMP_STRINGANDARRAY_H_\r\n' +
      '\r\n' +
      '#include "exos_api.h"\r\n' +
      '\r\n' +
      '#if defined(_SG4)\r\n' +
      '#include <StringAndArray.h>\r\n' +
      '#else\r\n' +
      '#include <stddef.h>\r\n' +
      '#include <stdint.h>\r\n' +
      '#include <stdbool.h>\r\n' +
      '\r\n' +
      'typedef struct IntStruct2_typ\r\n' +
      '{\r\n' +
      '    uint32_t MyInt23;\r\n' +
      '    uint8_t MyInt24[4];\r\n' +
      '    uint32_t MyInt25;\r\n' +
      '\r\n' +
      '} IntStruct2_typ;\r\n' +
      '\r\n' +
      'typedef struct IntStruct1_typ\r\n' +
      '{\r\n' +
      '    uint32_t MyInt13;\r\n' +
      '\r\n' +
      '} IntStruct1_typ;\r\n' +
      '\r\n' +
      'typedef struct IntStruct_typ\r\n' +
      '{\r\n' +
      '    uint32_t MyInt13;\r\n' +
      '    uint8_t MyInt14[3];\r\n' +
      '    uint32_t MyInt133;\r\n' +
      '    uint8_t MyInt124[3];\r\n' +
      '\r\n' +
      '} IntStruct_typ;\r\n' +
      '\r\n' +
      'typedef struct StringAndArray\r\n' +
      '{\r\n' +
      '    uint32_t MyInt1; //PUB\r\n' +
      '    char MyString[3][81]; //PUB\r\n' +
      '    uint8_t MyInt2[5]; //PUB SUB\r\n' +
      '    struct IntStruct_typ MyIntStruct[6]; //PUB SUB\r\n' +
      '    struct IntStruct1_typ MyIntStruct1; //PUB SUB\r\n' +
      '    struct IntStruct2_typ MyIntStruct2; //PUB SUB\r\n' +
      '\r\n' +
      '} StringAndArray;\r\n' +
      '\r\n' +
      '#endif // _SG4\r\n' +
      '\r\n' +
      'EXOS_ERROR_CODE exos_datamodel_connect_stringandarray(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback);\r\n' +
      '\r\n' +
      '#endif // _EXOS_COMP_STRINGANDARRAY_H_\r\n',
    description: 'Generated datamodel header for StringAndArray'
  },
  sourceFile: {
    name: 'exos_stringandarray.c',
    contents: '/*Automatically generated c file from StringAndArray.typ*/\r\n' +
      '\r\n' +
      '#include "exos_stringandarray.h"\r\n' +
      '\r\n' +
      'const char config_stringandarray[] = "{\\"name\\":\\"struct\\",\\"attributes\\":{\\"name\\":\\"<NAME>\\",\\"dataType\\":\\"StringAndArray\\",\\"info\\":\\"<infoId0>\\"},\\"children\\":[{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt1\\",\\"dataType\\":\\"UDINT\\",\\"comment\\":\\"PUB\\",\\"info\\":\\"<infoId1>\\"}},{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyString\\",\\"dataType\\":\\"STRING\\",\\"stringLength\\":81,\\"comment\\":\\"PUB\\",\\"arraySize\\":3,\\"info\\":\\"<infoId2>\\",\\"info2\\":\\"<infoId3>\\"}},{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt2\\",\\"dataType\\":\\"USINT\\",\\"comment\\":\\"PUB SUB\\",\\"arraySize\\":5,\\"info\\":\\"<infoId4>\\",\\"info2\\":\\"<infoId5>\\"}},{\\"name\\":\\"struct\\",\\"attributes\\":{\\"name\\":\\"MyIntStruct\\",\\"dataType\\":\\"IntStruct_typ\\",\\"comment\\":\\"PUB SUB\\",\\"arraySize\\":6,\\"info\\":\\"<infoId6>\\",\\"info2\\":\\"<infoId7>\\"},\\"children\\":[{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt13\\",\\"dataType\\":\\"UDINT\\",\\"info\\":\\"<infoId8>\\"}},{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt14\\",\\"dataType\\":\\"USINT\\",\\"arraySize\\":3,\\"info\\":\\"<infoId9>\\",\\"info2\\":\\"<infoId10>\\"}},{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt133\\",\\"dataType\\":\\"UDINT\\",\\"info\\":\\"<infoId11>\\"}},{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt124\\",\\"dataType\\":\\"USINT\\",\\"arraySize\\":3,\\"info\\":\\"<infoId12>\\",\\"info2\\":\\"<infoId13>\\"}}]},{\\"name\\":\\"struct\\",\\"attributes\\":{\\"name\\":\\"MyIntStruct1\\",\\"dataType\\":\\"IntStruct1_typ\\",\\"comment\\":\\"PUB SUB\\",\\"info\\":\\"<infoId14>\\"},\\"children\\":[{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt13\\",\\"dataType\\":\\"UDINT\\",\\"info\\":\\"<infoId15>\\"}}]},{\\"name\\":\\"struct\\",\\"attributes\\":{\\"name\\":\\"MyIntStruct2\\",\\"dataType\\":\\"IntStruct2_typ\\",\\"comment\\":\\"PUB SUB\\",\\"info\\":\\"<infoId16>\\"},\\"children\\":[{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt23\\",\\"dataType\\":\\"UDINT\\",\\"info\\":\\"<infoId17>\\"}},{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt24\\",\\"dataType\\":\\"USINT\\",\\"arraySize\\":4,\\"info\\":\\"<infoId18>\\",\\"info2\\":\\"<infoId19>\\"}},{\\"name\\":\\"variable\\",\\"attributes\\":{\\"name\\":\\"MyInt25\\",\\"dataType\\":\\"UDINT\\",\\"info\\":\\"<infoId20>\\"}}]}]}";\r\n' +
      '\r\n' +
      '/*Connect the StringAndArray datamodel to the server*/\r\n' +
      'EXOS_ERROR_CODE exos_datamodel_connect_stringandarray(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback)\r\n' +
      '{\r\n' +
      '    StringAndArray data;\r\n' +
      '    exos_dataset_info_t datasets[] = {\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME_INIT,{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyInt1),{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyString),{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyString[0]),{3}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyInt2),{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyInt2[0]),{5}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct),{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct[0]),{6}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct[0].MyInt13),{6}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct[0].MyInt14),{6}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct[0].MyInt14[0]),{6,3}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct[0].MyInt133),{6}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct[0].MyInt124),{6}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct[0].MyInt124[0]),{6,3}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct1),{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct1.MyInt13),{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct2),{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct2.MyInt23),{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct2.MyInt24),{}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct2.MyInt24[0]),{4}},\r\n' +
      '        {EXOS_DATASET_BROWSE_NAME(MyIntStruct2.MyInt25),{}}\r\n' +
      '    };\r\n' +
      '\r\n' +
      '    exos_datamodel_calc_dataset_info(datasets, sizeof(datasets));\r\n' +
      '\r\n' +
      '    return exos_datamodel_connect(datamodel, config_stringandarray, datasets, sizeof(datasets), datamodel_event_callback);\r\n' +
      '}\r\n',
    description: 'Generated datamodel source for StringAndArray'
  },
  fileName: 'StringAndArray.typ',
  typeName: 'StringAndArray',
  SG4Includes: [ 'StringAndArray.h' ],
  sortedStructs: [
    { name: 'IntStruct2_typ', dependencies: [] },
    { name: 'IntStruct1_typ', dependencies: [] },
    { name: 'IntStruct_typ', dependencies: [] },
    { name: 'StringAndArray', dependencies: [Array] }
  ]
}

---------------
DATAMODEL - DATASET
{
  name: 'struct',
  attributes: {
    name: '<NAME>',
    nodeId: '',
    dataType: 'StringAndArray',
    comment: '',
    arraySize: 0,
    info: '<infoId0>'
  },
  children: [
    { name: 'variable', attributes: [Object] },
    { name: 'variable', attributes: [Object] },
    { name: 'variable', attributes: [Object] },
    { name: 'struct', attributes: [Object], children: [Array] },
    { name: 'struct', attributes: [Object], children: [Array] },
    { name: 'struct', attributes: [Object], children: [Array] }
  ]
}