%module(directors="1") libmouse
%{
#define EXOS_INCLUDE_ONLY_DATATYPE
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>
#include "exos_mouse.h"
#include "libmouse.h"
%}

/*
https://rawgit.com/swig/swig/master/Doc/Manual/SWIGPlus.html#SWIGPlus_target_language_callbacks

The goal is to have a target language function that gets called by on_change_executer.
The target language function should have the equivalent signature as the C/C++ function pointer void (*callback)(void).
As we are using directors, we need a C++ virtual method with this signature,
so let's define the C++ class and pure virtual method first and make it a director class via the director feature:*/
%feature("director") MouseEventHandler;
%inline %{
struct MouseEventHandler {
  virtual void on_change_ResetXY() {}
  virtual ~MouseEventHandler() {}
  libMouse_t *mouse;
};
%}

/*The following handler_helper function and on_change_connect function completes the code needed in the C++/SWIG layer.
The on_change_connect function is wrapped by SWIG and it takes a pointer to the director base class OnChangeExecuter instead of a C/C++ function pointer.*/
%{
static MouseEventHandler *pMouseEventHandler = NULL;
static void libMouse_on_change_ResetXY() {
  // Make the call up to the target language when handler_ptr
  // is an instance of a target language director class
  pMouseEventHandler->on_change_ResetXY();
}
// If desired, handler_ptr above could be changed to a thread-local variable in order to make thread-safe
%}

%inline %{
void add_event_handler(libMouse_t *mouse, MouseEventHandler *handler) {
  pMouseEventHandler = handler;
  mouse->ResetXY.on_change = &libMouse_on_change_ResetXY;
  pMouseEventHandler->mouse = mouse;
  handler = NULL;
}
%}
/*On the target language side, we need to derive a class from OnChangeExecuter and override the handle method.*/


#define EXOS_INCLUDE_ONLY_DATATYPE
%include "stdint.i"
%include "exos_mouse.h"

typedef struct libMouseResetXY
{
    void on_change(void);
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

// To avoid c++ mangling when using swig in c++ mode
// remember to use 'extern "C"' in header
libMouse_t *libMouse_init(void);
