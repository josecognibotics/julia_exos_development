%module libMouse
%{
#define EXOS_INCLUDE_ONLY_DATATYPE
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>
#include "exos_mouse.h"
#include "libmouse.h"
%}
#define EXOS_INCLUDE_ONLY_DATATYPE
%include "stdint.i"
%include "exos_mouse.h"

typedef struct libMouseResetXY
{
    bool value;
} libMouseResetXY_t;

typedef struct libMouseMovement
{
    void publish(void);
    MouseMovement value;
} libMouseMovement_t;

typedef struct libMouseButtons
{
    void publish(void);
    MouseButtons value;
} libMouseButtons_t;

typedef struct libMouse
{
    void connect(void);
    void disconnect(void);
    void process(void);
    void set_operational(void);
    void dispose(void);
    bool is_connected;
    bool is_operational;
    libMouseResetXY_t ResetXY;
    libMouseMovement_t Movement;
    libMouseButtons_t Buttons;
} libMouse_t;

libMouse_t *libMouse_init(void);
