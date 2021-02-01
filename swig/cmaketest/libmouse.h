#ifndef _LIBMOUSE_H_
#define _LIBMOUSE_H_

#include "exos_mouse.h"

typedef void (*libMouse_event_cb)(void);
typedef void (*libMouse_method_fn)(void);

typedef struct libMouseResetXY
{
    libMouse_event_cb on_change;
    bool value;
} libMouseResetXY_t;

typedef struct libMouseMovement
{
    libMouse_method_fn publish;
    MouseMovement value;
} libMouseMovement_t;

typedef struct libMouseButtons
{
    libMouse_method_fn publish;
    MouseButtons value;
} libMouseButtons_t;

typedef struct libMouse
{
    libMouse_method_fn connect;
    libMouse_method_fn disconnect;
    libMouse_method_fn process;
    libMouse_method_fn set_operational;
    libMouse_method_fn dispose;
    libMouse_event_cb on_connected;
    libMouse_event_cb on_disconnected;
    libMouse_event_cb on_operational;
    bool is_connected;
    bool is_operational;
    libMouseResetXY_t ResetXY;
    libMouseMovement_t Movement;
    libMouseButtons_t Buttons;
} libMouse_t;

// To avoid c++ mangling when using swig in c++ mode
#ifdef __cplusplus
extern "C" {
#endif
    libMouse_t *libMouse_init(void);
#ifdef __cplusplus
}
#endif

#endif // _LIBMOUSE_H_
