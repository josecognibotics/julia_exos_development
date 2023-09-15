/*Automatically generated header file from test.typ*/

#ifndef _EXOS_COMP_EXOS_JULIA_H_
#define _EXOS_COMP_EXOS_JULIA_H_

#include "exos_api.h"

#if defined(_SG4)
#include <exos_julia.h>
#else
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

typedef struct exos_julia
{
    uint32_t MyInt1; //PUB
    uint8_t MyInt3[5]; //PUB SUB

} exos_julia;

#endif // _SG4

EXOS_ERROR_CODE exos_datamodel_connect_exos_julia(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback);

#endif // _EXOS_COMP_EXOS_JULIA_H_
