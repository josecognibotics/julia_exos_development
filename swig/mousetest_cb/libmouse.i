%module libmouse

%{
#include "libmouse.h"
%}
%pythoncallback;
typedef void (*libMouse_onchange_cb)(libMouse_t *libMouse);
%nopythoncallback;

%ignore libMouse_onchange_cb;
%include "libmouse.h"
