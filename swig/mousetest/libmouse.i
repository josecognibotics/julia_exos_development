%module libmouse

%{
#include "exos_mouse.h"
#include "libmouse.h"
%}
/*
TODO: int16_t etc.

function pointers:;
https://stackoverflow.com/questions/1583293/using-swig-with-pointer-to-function-in-c-struct


https://stackoverflow.com/questions/53414931/swig-how-to-make-a-typedef-function-pointer-in-a-struct-callable-from-python
*/

%pythoncallback;
void libMouse_publish(void);
%nopythoncallback;
%ignore libMouse_publish;

%include "exos_mouse.h"
%include "libmouse.h"


