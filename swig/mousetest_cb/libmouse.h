#include "exos_mouse.h"

typedef struct libMouse libMouse_t;

//void libMouse_onchange_cb(libMouse_t *libMouse);
typedef void (*libMouse_onchange_cb)(libMouse_t *libMouse);
typedef void (*libMouse_publish_fn)(void);

void on_change_connect(libMouse_t *mouse, libMouse_onchange_cb callback);

typedef struct libMouseResetXY
{
    libMouse_onchange_cb on_change;
    bool reset;
} libMouseResetXY_t;

typedef struct libMouseMouseMovement
{
    libMouse_publish_fn publish;
    MouseMovement Movement;
} libMouseMovement_t;

typedef struct libMouseMouseButtons
{
    libMouse_publish_fn publish;
    MouseButtons Buttons;
} libMouseButtons_t;

typedef struct libMouse
{
    libMouseResetXY_t libResetXY;
    libMouseMovement_t libMovement;
    libMouseButtons_t libButtons;

} libMouse_t;

int get_left_button(libMouse_t *mouse);
void set_left_button(libMouse_t *mouse, int val);

void libMouse_init(libMouse_t *mouse);
void libMouse_process(libMouse_t *mouse);
void libMouse_exit(libMouse_t *mouse);
