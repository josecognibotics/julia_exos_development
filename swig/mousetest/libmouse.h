#include "exos_mouse.h"

typedef struct libMouse libMouse_t;

//void libMouse_onchange_cb(libMouse_t *libMouse);
typedef void (*libMouse_onchange_cb)(libMouse_t *libMouse);
typedef void (*libMouse_publish_fn)(void);

void libMouse_publish(void);

typedef struct libMouseResetXY
{
    libMouse_onchange_cb on_change;
    bool reset;
} libMouseResetXY_t;

typedef struct libMouseMovement
{
    libMouse_publish_fn publish;
    MouseMovement Movement;
} libMouseMovement_t;

typedef struct libMouseButtons
{
    libMouse_publish_fn publish;
    MouseButtons Buttons;
} libMouseButtons_t;

typedef struct libMouse
{
    libMouse_publish_fn publish;
    libMouseResetXY_t libResetXY;
    libMouseMovement_t libMovement;
    libMouseButtons_t libButtons;

} libMouse_t;

void libMouse_init(libMouse_t *mouse);
void libMouse_process(libMouse_t *mouse);
void libMouse_exit(libMouse_t *mouse);
