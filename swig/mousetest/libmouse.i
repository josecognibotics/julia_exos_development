%module libmouse

%{
#include "exos_mouse.h"
#include "libmouse.h"


/*
libMouse_t *init_test()
{
    libMouse_t *t = (libMouse_t*) malloc(sizeof(libMouse_t));

    t->publish = libMouse_publish;
    t->libButtons.publish = libMouse_publish;
    // and so on
    return t;
}
*/
%}
/*
TODO: int16_t etc.

function pointers:;
https://stackoverflow.com/questions/1583293/using-swig-with-pointer-to-function-in-c-struct


https://stackoverflow.com/questions/53414931/swig-how-to-make-a-typedef-function-pointer-in-a-struct-callable-from-python
*/



// %constant void libMouse_publish(void);

// %ignore libMouse_publish;

//%rename(%s) libMouse_publish_fn;

%include "exos_mouse.h"

//%include "libmouse.h"
/* copy of libmouse.h with:
    libMouse_publish_fn publish;
renamed to 
    void publish(void);
*/
typedef struct libMouse libMouse_t;

//void libMouse_onchange_cb(libMouse_t *libMouse);
typedef void (*libMouse_onchange_cb)(libMouse_t *libMouse);
typedef void (*libMouse_publish_fn)(void);

typedef struct libMouseResetXY
{
    bool reset;
} libMouseResetXY_t;

typedef struct libMouseMovement
{
    void publish(void);
    MouseMovement Movement;
} libMouseMovement_t;

typedef struct libMouseButtons
{
    void publish(void);
    MouseButtons Buttons;
} libMouseButtons_t;

typedef struct libMouse
{
    void publish(void);
    libMouseResetXY_t libResetXY;
    libMouseMovement_t libMovement;
    libMouseButtons_t libButtons;

} libMouse_t;

void libMouse_init(libMouse_t *mouse);
void libMouse_process(libMouse_t *mouse);
void libMouse_exit(libMouse_t *mouse);


/*
typedef struct libMouseButtons
{
    void publish(void);
} libMouseButtons_t;

typedef struct libMouse {
    void publish(void);

} libMouse_t;
*/
//libMouse_t *init_test();

