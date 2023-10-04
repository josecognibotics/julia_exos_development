/*Automatically generated header file from StringAndArray.typ*/

#ifndef _EXOS_COMP_STRINGANDARRAY_H_
#define _EXOS_COMP_STRINGANDARRAY_H_

#include "exos_api.h"

#if defined(_SG4)
#include <StringAndA.h>
#else
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

typedef struct StringAndArray
{
    uint32_t MyInt1; //PUB
    uint8_t MyInt2[5]; //PUB SUB

} StringAndArray;

#endif // _SG4

EXOS_ERROR_CODE exos_datamodel_connect_stringandarray(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback);

#endif // _EXOS_COMP_STRINGANDARRAY_H_
