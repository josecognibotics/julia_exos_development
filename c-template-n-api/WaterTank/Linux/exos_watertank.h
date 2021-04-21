/*Automatically generated header file from WaterTank.typ*/

#ifndef _EXOS_COMP_WATERTANK_H_
#define _EXOS_COMP_WATERTANK_H_

#ifndef EXOS_INCLUDE_ONLY_DATATYPE
#include "exos_api_internal.h"
#endif

#if defined(_SG4) && !defined(EXOS_STATIC_INCLUDE)
#include <WaterTank.h>
#else
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

typedef struct WaterTankHeaterConfig
{
    float MaxTemperature;
    float MaxPower;

} WaterTankHeaterConfig;

typedef struct WaterTankHeaterStatus
{
    float WaterTemperature;
    bool HeatingActive;

} WaterTankHeaterStatus;

typedef struct WaterTankStatus
{
    bool LevelHigh;
    bool LevelLow;
    uint32_t WaterLevel;
    int32_t FillValveDelay;
    struct WaterTankHeaterStatus Heater;

} WaterTankStatus;

typedef struct ExtraParams
{
    uint32_t Speed;

} ExtraParams;

typedef struct WaterTank
{
    uint32_t FillValve;
    bool EnableHeater[3]; //PUB
    struct WaterTankHeaterConfig HeaterConfig[3]; //PUB
    struct WaterTankStatus Status; //SUB
    struct ExtraParams Extra; //PUB

} WaterTank;

#endif // _SG4 && !EXOS_STATIC_INCLUDE

#ifndef EXOS_INCLUDE_ONLY_DATATYPE
#ifdef EXOS_STATIC_INCLUDE
EXOS_ERROR_CODE exos_datamodel_connect_watertank(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback);
#else
const char config_watertank[] = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"nodeId\":\"\",\"dataType\":\"WaterTank\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"FillValve\",\"nodeId\":\"\",\"dataType\":\"UDINT\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId1>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"EnableHeater\",\"nodeId\":\"\",\"dataType\":\"BOOL\",\"comment\":\"PUB\",\"arraySize\":3,\"info\":\"<infoId2>\",\"info2\":\"<infoId3>\"}},{\"name\":\"struct\",\"attributes\":{\"name\":\"HeaterConfig\",\"nodeId\":\"\",\"dataType\":\"WaterTankHeaterConfig\",\"comment\":\"PUB\",\"arraySize\":3,\"info\":\"<infoId4>\",\"info2\":\"<infoId5>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"MaxTemperature\",\"nodeId\":\"\",\"dataType\":\"REAL\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId6>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"MaxPower\",\"nodeId\":\"\",\"dataType\":\"REAL\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId7>\"}}]},{\"name\":\"struct\",\"attributes\":{\"name\":\"Status\",\"nodeId\":\"\",\"dataType\":\"WaterTankStatus\",\"comment\":\"SUB\",\"arraySize\":0,\"info\":\"<infoId8>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"LevelHigh\",\"nodeId\":\"\",\"dataType\":\"BOOL\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId9>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"LevelLow\",\"nodeId\":\"\",\"dataType\":\"BOOL\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId10>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"WaterLevel\",\"nodeId\":\"\",\"dataType\":\"UDINT\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId11>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"FillValveDelay\",\"nodeId\":\"\",\"dataType\":\"DINT\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId12>\"}},{\"name\":\"struct\",\"attributes\":{\"name\":\"Heater\",\"nodeId\":\"\",\"dataType\":\"WaterTankHeaterStatus\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId13>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"WaterTemperature\",\"nodeId\":\"\",\"dataType\":\"REAL\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId14>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"HeatingActive\",\"nodeId\":\"\",\"dataType\":\"BOOL\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId15>\"}}]}]},{\"name\":\"struct\",\"attributes\":{\"name\":\"Extra\",\"nodeId\":\"\",\"dataType\":\"ExtraParams\",\"comment\":\"PUB\",\"arraySize\":0,\"info\":\"<infoId16>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"Speed\",\"nodeId\":\"\",\"dataType\":\"UDINT\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId17>\"}}]}]}";

/*Connect the WaterTank datamodel to the server*/
EXOS_ERROR_CODE exos_datamodel_connect_watertank(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback)
{
    WaterTank data;
    exos_dataset_info_t datasets[] = {
        {EXOS_DATASET_BROWSE_NAME_INIT,{}},
        {EXOS_DATASET_BROWSE_NAME(FillValve),{}},
        {EXOS_DATASET_BROWSE_NAME(EnableHeater),{}},
        {EXOS_DATASET_BROWSE_NAME(EnableHeater[0]),{3}},
        {EXOS_DATASET_BROWSE_NAME(HeaterConfig),{}},
        {EXOS_DATASET_BROWSE_NAME(HeaterConfig[0]),{3}},
        {EXOS_DATASET_BROWSE_NAME(HeaterConfig[0].MaxTemperature),{3}},
        {EXOS_DATASET_BROWSE_NAME(HeaterConfig[0].MaxPower),{3}},
        {EXOS_DATASET_BROWSE_NAME(Status),{}},
        {EXOS_DATASET_BROWSE_NAME(Status.LevelHigh),{}},
        {EXOS_DATASET_BROWSE_NAME(Status.LevelLow),{}},
        {EXOS_DATASET_BROWSE_NAME(Status.WaterLevel),{}},
        {EXOS_DATASET_BROWSE_NAME(Status.FillValveDelay),{}},
        {EXOS_DATASET_BROWSE_NAME(Status.Heater),{}},
        {EXOS_DATASET_BROWSE_NAME(Status.Heater.WaterTemperature),{}},
        {EXOS_DATASET_BROWSE_NAME(Status.Heater.HeatingActive),{}},
        {EXOS_DATASET_BROWSE_NAME(Extra),{}},
        {EXOS_DATASET_BROWSE_NAME(Extra.Speed),{}}
    };

    _exos_internal_calc_offsets(datasets,sizeof(datasets));

    return _exos_internal_datamodel_connect(datamodel, config_watertank, datasets, sizeof(datasets), datamodel_event_callback);
}

#endif // EXOS_STATIC_INCLUDE
#endif // EXOS_INCLUDE_ONLY_DATATYPE
#endif // _EXOS_COMP_WATERTANK_H_
