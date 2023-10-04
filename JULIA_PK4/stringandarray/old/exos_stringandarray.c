/*Automatically generated c file from StringAndArray.typ*/

#include "exos_stringandarray.h"

const char config_stringandarray[] = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"dataType\":\"StringAndArray\",\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt1\",\"dataType\":\"UDINT\",\"comment\":\"PUB\",\"info\":\"<infoId1>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt2\",\"dataType\":\"USINT\",\"comment\":\"PUB SUB\",\"arraySize\":5,\"info\":\"<infoId2>\",\"info2\":\"<infoId3>\"}}]}";

/*Connect the StringAndArray datamodel to the server*/
EXOS_ERROR_CODE exos_datamodel_connect_stringandarray(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback)
{
    StringAndArray data;
    exos_dataset_info_t datasets[] = {
        {EXOS_DATASET_BROWSE_NAME_INIT,{}},
        {EXOS_DATASET_BROWSE_NAME(MyInt1),{}},
        {EXOS_DATASET_BROWSE_NAME(MyInt2),{}},
        {EXOS_DATASET_BROWSE_NAME(MyInt2[0]),{5}}
    };

    exos_datamodel_calc_dataset_info(datasets, sizeof(datasets));

    return exos_datamodel_connect(datamodel, config_stringandarray, datasets, sizeof(datasets), datamodel_event_callback);
}
