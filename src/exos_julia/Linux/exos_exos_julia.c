/*Automatically generated c file from test.typ*/

#include "exos_exos_julia.h"

const char config_exos_julia[] = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"dataType\":\"exos_julia\",\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt1\",\"dataType\":\"UDINT\",\"comment\":\"PUB\",\"info\":\"<infoId1>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt3\",\"dataType\":\"USINT\",\"comment\":\"PUB SUB\",\"arraySize\":5,\"info\":\"<infoId2>\",\"info2\":\"<infoId3>\"}}]}";

/*Connect the exos_julia datamodel to the server*/
EXOS_ERROR_CODE exos_datamodel_connect_exos_julia(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback)
{
    exos_julia data;
    exos_dataset_info_t datasets[] = {
        {EXOS_DATASET_BROWSE_NAME_INIT,{}},
        {EXOS_DATASET_BROWSE_NAME(MyInt1),{}},
        {EXOS_DATASET_BROWSE_NAME(MyInt3),{}},
        {EXOS_DATASET_BROWSE_NAME(MyInt3[0]),{5}}
    };

    exos_datamodel_calc_dataset_info(datasets, sizeof(datasets));

    return exos_datamodel_connect(datamodel, config_exos_julia, datasets, sizeof(datasets), datamodel_event_callback);
}
