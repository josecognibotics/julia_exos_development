%module(directors="1") libStringAndArray
%{
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>
#include "exos_stringandarray.h"
#include "libstringandarray.h"
%}

%include "typemaps.i"
%include "std_except.i"

%feature("director") StringAndArrayEventHandler;
%inline %{
struct StringAndArrayEventHandler
{
    virtual void on_connected(void) {}
    virtual void on_disconnected(void) {}
    virtual void on_operational(void) {}

    virtual void on_change_MyInt1() {}
    virtual void on_change_MyInt3() {}

    virtual ~StringAndArrayEventHandler() {}
    libStringAndArray_t *stringandarray;
};
%}

%{
static StringAndArrayEventHandler *pStringAndArrayEventHandler = NULL;

static void libStringAndArray_on_connected()
{
    pStringAndArrayEventHandler->on_connected();
}

static void libStringAndArray_on_disconnected()
{
    pStringAndArrayEventHandler->on_disconnected();
}

static void libStringAndArray_on_operational()
{
    pStringAndArrayEventHandler->on_operational();
}

static void libStringAndArray_on_change_MyInt1()
{
    pStringAndArrayEventHandler->on_change_MyInt1();
}
static void libStringAndArray_on_change_MyInt3()
{
    pStringAndArrayEventHandler->on_change_MyInt3();
}
%}

%inline %{
void add_event_handler(libStringAndArray_t *stringandarray, StringAndArrayEventHandler *handler)
{
    pStringAndArrayEventHandler = handler;

    stringandarray->on_connected = &libStringAndArray_on_connected;
    stringandarray->on_disconnected = &libStringAndArray_on_disconnected;
    stringandarray->on_operational = &libStringAndArray_on_operational;
    
    stringandarray->MyInt1.on_change = &libStringAndArray_on_change_MyInt1;
    stringandarray->MyInt3.on_change = &libStringAndArray_on_change_MyInt3;
    
    pStringAndArrayEventHandler->stringandarray = stringandarray;
    handler = NULL;
}
%}

%include "stdint.i"

/* Handle arrays in substructures, structs could be exposed using these two lines:
     %include "exos_stringandarray.h"
   But we need to disable the array members and add them again with the wrapped_array
*/
typedef struct libStringAndArrayMyInt1
{
    void on_change(void);
    int32_t nettime;
    uint32_t value;
} libStringAndArrayMyInt1_t;

%immutable;
%inline %{
struct libStringAndArrayMyInt3_value_wrapped_array {
    uint8_t (&data)[5];
    libStringAndArrayMyInt3_value_wrapped_array(uint8_t (&data)[5]) : data(data) { }
};
%}
%mutable;

%extend libStringAndArrayMyInt3_value_wrapped_array {
    inline size_t __len__() const { return 5; }

    inline const uint8_t& __getitem__(size_t i) const throw(std::out_of_range) {
        if (i >= 5 || i < 0)
            throw std::out_of_range("out of bounds");
        return $self->data[i];
    }

    inline void __setitem__(size_t i, const uint8_t& v) throw(std::out_of_range) {
        if (i >= 5 || i < 0)
            throw std::out_of_range("out of bounds");
        $self->data[i] = v; 
    }
}

typedef struct libStringAndArrayMyInt3
{
    void publish(void);
    void on_change(void);
    int32_t nettime;
    // array not exposed directly:    uint8_t value[5];
} libStringAndArrayMyInt3_t;

%extend libStringAndArrayMyInt3 {
    libStringAndArrayMyInt3_value_wrapped_array get_libStringAndArrayMyInt3_value(){
        return libStringAndArrayMyInt3_value_wrapped_array($self->value);
    }
    void set_libStringAndArrayMyInt3_value(libStringAndArrayMyInt3_value_wrapped_array val) throw (std::invalid_argument) {
        throw std::invalid_argument("cant set array, use [] instead");
    }

    %pythoncode %{
        __swig_getmethods__["value"] = get_libStringAndArrayMyInt3_value
        __swig_setmethods__["value"] = set_libStringAndArrayMyInt3_value
        if _newclass: value = property(get_libStringAndArrayMyInt3_value, set_libStringAndArrayMyInt3_value)
    %}
}

typedef struct libStringAndArray_log
{
    void error(char *log_entry);
    void warning(char *log_entry);
    void success(char *log_entry);
    void info(char *log_entry);
    void debug(char *log_entry);
    void verbose(char *log_entry);
} libStringAndArray_log_t;

typedef struct libStringAndArray
{
    void connect(void);
    void disconnect(void);
    void process(void);
    void set_operational(void);
    void dispose(void);
    int32_t get_nettime(void);
    libStringAndArray_log_t log;
    void on_connected(void);
    void on_disconnected(void);
    void on_operational(void);
    bool is_connected;
    bool is_operational;
    libStringAndArrayMyInt1_t MyInt1;
    libStringAndArrayMyInt3_t MyInt3;
} libStringAndArray_t;

libStringAndArray_t *libStringAndArray_init(void);
