/*Automatically generated c file from StringAndArray.typ*/

// #include "exos_stringandarray.h"

// const char config_stringandarray[] = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"dataType\":\"StringAndArray\",\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt1\",\"dataType\":\"UDINT\",\"comment\":\"PUB\",\"info\":\"<infoId1>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt2\",\"dataType\":\"USINT\",\"comment\":\"PUB SUB\",\"arraySize\":5,\"info\":\"<infoId2>\",\"info2\":\"<infoId3>\"}}]}";

// /*Connect the StringAndArray datamodel to the server*/
// exos_dataset_info_t* exos_datamodel_connect_stringandarray(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback, StringAndArray *data1)
// {
//     StringAndArray data = *data1;
//     //StringAndArray data;

//     exos_dataset_info_t datasets[] = {
//         {EXOS_DATASET_BROWSE_NAME_INIT,{}},
//         {EXOS_DATASET_BROWSE_NAME(MyInt1),{}},
//         {EXOS_DATASET_BROWSE_NAME(MyInt2),{}},
//         {EXOS_DATASET_BROWSE_NAME(MyInt2[0]),{5}}
//     };
//     exos_dataset_info_t *datasets1 = (exos_dataset_info_t*)malloc(sizeof(exos_dataset_info_t) * 4);
//     memcpy(datasets1, datasets, sizeof(datasets));    
//     return datasets1+8;
// }
