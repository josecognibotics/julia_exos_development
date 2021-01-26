/*Automatically generated header file from Mouse.typ*/

#ifndef _MOUSE_H_
#define _MOUSE_H_

#ifndef EXOS_INCLUDE_ONLY_DATATYPE
#include "exos_api_internal.h"
#endif

#if defined(_SG4) && !defined(EXOS_STATIC_INCLUDE)
#include <mouseTYP.h>
#else
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

typedef struct MouseMovement
{
    int16_t Xrel;
    int16_t Yrel;
    int16_t X;
    int16_t Y;

} MouseMovement;

typedef struct MouseButtons
{
    bool LeftButton;
    bool RightButton;

} MouseButtons;

typedef struct Mouse
{
    bool ResetXY; //PUB
    struct MouseMovement Movement; //SUB
    struct MouseButtons Buttons; //SUB

} Mouse;

#endif // _SG4 && !EXOS_STATIC_INCLUDE

#ifndef EXOS_INCLUDE_ONLY_DATATYPE
#ifdef EXOS_STATIC_INCLUDE
EXOS_ERROR_CODE exos_datamodel_connect_mouse(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback);
#else
const char config_mouse[] = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"nodeId\":\"\",\"dataType\":\"Mouse\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"ResetXY\",\"nodeId\":\"\",\"dataType\":\"BOOL\",\"comment\":\"PUB\",\"arraySize\":0,\"info\":\"<infoId1>\"}},{\"name\":\"struct\",\"attributes\":{\"name\":\"Movement\",\"nodeId\":\"\",\"dataType\":\"MouseMovement\",\"comment\":\"SUB\",\"arraySize\":0,\"info\":\"<infoId2>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"Xrel\",\"nodeId\":\"\",\"dataType\":\"INT\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId3>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"Yrel\",\"nodeId\":\"\",\"dataType\":\"INT\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId4>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"X\",\"nodeId\":\"\",\"dataType\":\"INT\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId5>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"Y\",\"nodeId\":\"\",\"dataType\":\"INT\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId6>\"}}]},{\"name\":\"struct\",\"attributes\":{\"name\":\"Buttons\",\"nodeId\":\"\",\"dataType\":\"MouseButtons\",\"comment\":\"SUB\",\"arraySize\":0,\"info\":\"<infoId7>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"LeftButton\",\"nodeId\":\"\",\"dataType\":\"BOOL\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId8>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"RightButton\",\"nodeId\":\"\",\"dataType\":\"BOOL\",\"comment\":\"\",\"arraySize\":0,\"info\":\"<infoId9>\"}}]}]}";

/*Connect the Mouse datamodel to the server*/
EXOS_ERROR_CODE exos_datamodel_connect_mouse(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback)
{
    Mouse data;
    exos_dataset_info_t datasets[] = {
        {EXOS_DATASET_BROWSE_NAME_INIT,{}},
        {EXOS_DATASET_BROWSE_NAME(ResetXY),{}},
        {EXOS_DATASET_BROWSE_NAME(Movement),{}},
        {EXOS_DATASET_BROWSE_NAME(Movement.Xrel),{}},
        {EXOS_DATASET_BROWSE_NAME(Movement.Yrel),{}},
        {EXOS_DATASET_BROWSE_NAME(Movement.X),{}},
        {EXOS_DATASET_BROWSE_NAME(Movement.Y),{}},
        {EXOS_DATASET_BROWSE_NAME(Buttons),{}},
        {EXOS_DATASET_BROWSE_NAME(Buttons.LeftButton),{}},
        {EXOS_DATASET_BROWSE_NAME(Buttons.RightButton),{}}
    };

    _exos_internal_calc_offsets(datasets,sizeof(datasets));

    return _exos_internal_datamodel_connect(datamodel, config_mouse, datasets, sizeof(datasets), datamodel_event_callback);
}

#endif // EXOS_STATIC_INCLUDE
#endif
#endif // _MOUSE_H_
