%module(directors="1") libmouse
%{
#define EXOS_INCLUDE_ONLY_DATATYPE
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>
#include "exos_mouse.h"
#include "libmouse.h"
%}

/*The goal is to have a target language function that gets called by on_change_executer.
The target language function should have the equivalent signature as the C/C++ function pointer void (*callback)(void).
As we are using directors, we need a C++ virtual method with this signature,
so let's define the C++ class and pure virtual method first and make it a director class via the director feature:*/
%feature("director") OnChangeExecuter;
%inline %{
struct OnChangeExecuter {
  virtual void handle() = 0;
  virtual ~OnChangeExecuter() {}
};
%}

/*The following handler_helper function and on_change_connect function completes the code needed in the C++/SWIG layer.
The on_change_connect function is wrapped by SWIG and it takes a pointer to the director base class OnChangeExecuter instead of a C/C++ function pointer.*/
%{
static OnChangeExecuter *handler_ptr = NULL;
static void handler_helper() {
  // Make the call up to the target language when handler_ptr
  // is an instance of a target language director class
  handler_ptr->handle();
}
// If desired, handler_ptr above could be changed to a thread-local variable in order to make thread-safe
%}

%inline %{
void on_change_connect(libMouse_t *mouse, OnChangeExecuter *handler) {
  handler_ptr = handler;
  mouse->ResetXY.on_change = &handler_helper;
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

libMouse_t *libMouse_init(void);
