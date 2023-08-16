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
    virtual void on_change_MyString() {}
    virtual void on_change_MyInt2() {}
    virtual void on_change_MyIntStruct() {}
    virtual void on_change_MyIntStruct1() {}
    virtual void on_change_MyIntStruct2() {}

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
static void libStringAndArray_on_change_MyString()
{
    pStringAndArrayEventHandler->on_change_MyString();
}
static void libStringAndArray_on_change_MyInt2()
{
    pStringAndArrayEventHandler->on_change_MyInt2();
}
static void libStringAndArray_on_change_MyIntStruct()
{
    pStringAndArrayEventHandler->on_change_MyIntStruct();
}
static void libStringAndArray_on_change_MyIntStruct1()
{
    pStringAndArrayEventHandler->on_change_MyIntStruct1();
}
static void libStringAndArray_on_change_MyIntStruct2()
{
    pStringAndArrayEventHandler->on_change_MyIntStruct2();
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
    stringandarray->MyString.on_change = &libStringAndArray_on_change_MyString;
    stringandarray->MyInt2.on_change = &libStringAndArray_on_change_MyInt2;
    stringandarray->MyIntStruct.on_change = &libStringAndArray_on_change_MyIntStruct;
    stringandarray->MyIntStruct1.on_change = &libStringAndArray_on_change_MyIntStruct1;
    stringandarray->MyIntStruct2.on_change = &libStringAndArray_on_change_MyIntStruct2;
    
    pStringAndArrayEventHandler->stringandarray = stringandarray;
    handler = NULL;
}
%}

%include "stdint.i"

/* Handle arrays in substructures, structs could be exposed using these two lines:
     %include "exos_stringandarray.h"
   But we need to disable the array members and add them again with the wrapped_array
*/
%immutable;
%inline %{
struct IntStruct2_typ_MyInt24_wrapped_array {
    uint8_t (&data)[4];
    IntStruct2_typ_MyInt24_wrapped_array(uint8_t (&data)[4]) : data(data) { }
};
%}
%mutable;

%extend IntStruct2_typ_MyInt24_wrapped_array {
    inline size_t __len__() const { return 4; }

    inline const uint8_t& __getitem__(size_t i) const throw(std::out_of_range) {
        if (i >= 4 || i < 0)
            throw std::out_of_range("out of bounds");
        return $self->data[i];
    }

    inline void __setitem__(size_t i, const uint8_t& v) throw(std::out_of_range) {
        if (i >= 4 || i < 0)
            throw std::out_of_range("out of bounds");
        $self->data[i] = v; 
    }
}

typedef struct IntStruct2_typ
{
    uint32_t MyInt23;
    // array not exposed directly:    uint8_t MyInt24[4];
    uint32_t MyInt25;

} IntStruct2_typ;

%extend IntStruct2_typ {
    IntStruct2_typ_MyInt24_wrapped_array get_IntStruct2_typ_MyInt24(){
        return IntStruct2_typ_MyInt24_wrapped_array($self->MyInt24);
    }
    void set_IntStruct2_typ_MyInt24(IntStruct2_typ_MyInt24_wrapped_array val) throw (std::invalid_argument) {
        throw std::invalid_argument("cant set array, use [] instead");
    }

    %pythoncode %{
        __swig_getmethods__["MyInt24"] = get_IntStruct2_typ_MyInt24
        __swig_setmethods__["MyInt24"] = set_IntStruct2_typ_MyInt24
        if _newclass: MyInt24 = property(get_IntStruct2_typ_MyInt24, set_IntStruct2_typ_MyInt24)
    %}
}

%immutable;
%inline %{
struct IntStruct_typ_MyInt14_wrapped_array {
    uint8_t (&data)[3];
    IntStruct_typ_MyInt14_wrapped_array(uint8_t (&data)[3]) : data(data) { }
};
%}
%mutable;

%extend IntStruct_typ_MyInt14_wrapped_array {
    inline size_t __len__() const { return 3; }

    inline const uint8_t& __getitem__(size_t i) const throw(std::out_of_range) {
        if (i >= 3 || i < 0)
            throw std::out_of_range("out of bounds");
        return $self->data[i];
    }

    inline void __setitem__(size_t i, const uint8_t& v) throw(std::out_of_range) {
        if (i >= 3 || i < 0)
            throw std::out_of_range("out of bounds");
        $self->data[i] = v; 
    }
}

%immutable;
%inline %{
struct IntStruct_typ_MyInt124_wrapped_array {
    uint8_t (&data)[3];
    IntStruct_typ_MyInt124_wrapped_array(uint8_t (&data)[3]) : data(data) { }
};
%}
%mutable;

%extend IntStruct_typ_MyInt124_wrapped_array {
    inline size_t __len__() const { return 3; }

    inline const uint8_t& __getitem__(size_t i) const throw(std::out_of_range) {
        if (i >= 3 || i < 0)
            throw std::out_of_range("out of bounds");
        return $self->data[i];
    }

    inline void __setitem__(size_t i, const uint8_t& v) throw(std::out_of_range) {
        if (i >= 3 || i < 0)
            throw std::out_of_range("out of bounds");
        $self->data[i] = v; 
    }
}

typedef struct IntStruct1_typ
{
    uint32_t MyInt13;

} IntStruct1_typ;

typedef struct IntStruct_typ
{
    uint32_t MyInt13;
    // array not exposed directly:    uint8_t MyInt14[3];
    uint32_t MyInt133;
    // array not exposed directly:    uint8_t MyInt124[3];

} IntStruct_typ;

%extend IntStruct_typ {
    IntStruct_typ_MyInt14_wrapped_array get_IntStruct_typ_MyInt14(){
        return IntStruct_typ_MyInt14_wrapped_array($self->MyInt14);
    }
    void set_IntStruct_typ_MyInt14(IntStruct_typ_MyInt14_wrapped_array val) throw (std::invalid_argument) {
        throw std::invalid_argument("cant set array, use [] instead");
    }

    %pythoncode %{
        __swig_getmethods__["MyInt14"] = get_IntStruct_typ_MyInt14
        __swig_setmethods__["MyInt14"] = set_IntStruct_typ_MyInt14
        if _newclass: MyInt14 = property(get_IntStruct_typ_MyInt14, set_IntStruct_typ_MyInt14)
    %}
}

%extend IntStruct_typ {
    IntStruct_typ_MyInt124_wrapped_array get_IntStruct_typ_MyInt124(){
        return IntStruct_typ_MyInt124_wrapped_array($self->MyInt124);
    }
    void set_IntStruct_typ_MyInt124(IntStruct_typ_MyInt124_wrapped_array val) throw (std::invalid_argument) {
        throw std::invalid_argument("cant set array, use [] instead");
    }

    %pythoncode %{
        __swig_getmethods__["MyInt124"] = get_IntStruct_typ_MyInt124
        __swig_setmethods__["MyInt124"] = set_IntStruct_typ_MyInt124
        if _newclass: MyInt124 = property(get_IntStruct_typ_MyInt124, set_IntStruct_typ_MyInt124)
    %}
}

typedef struct libStringAndArrayMyInt1
{
    void on_change(void);
    int32_t nettime;
    uint32_t value;
} libStringAndArrayMyInt1_t;

%immutable;
%inline %{
struct libStringAndArrayMyString_value_wrapped_array {
    char (&data)[3][81];
    libStringAndArrayMyString_value_wrapped_array(char (&data)[3][81]) : data(data) { }
};
%}
%mutable;

%extend libStringAndArrayMyString_value_wrapped_array {
    inline size_t __len__() const { return 3; }

    inline const char* __getitem__(size_t i) const throw(std::out_of_range) {
        if (i >= 3 || i < 0)
            throw std::out_of_range("out of bounds");
        return &($self->data[i][0]);
    }

    inline void __setitem__(size_t i, const char* v) throw(std::out_of_range) {
        if (i >= 3 || i < 0)
            throw std::out_of_range("out of bounds");
        memcpy($self->data[i], v, 80); 
    }
}

typedef struct libStringAndArrayMyString
{
    void on_change(void);
    int32_t nettime;
    // array not exposed directly:    char value[3][81];
} libStringAndArrayMyString_t;

%extend libStringAndArrayMyString {
    libStringAndArrayMyString_value_wrapped_array get_libStringAndArrayMyString_value(){
        return libStringAndArrayMyString_value_wrapped_array($self->value);
    }
    void set_libStringAndArrayMyString_value(libStringAndArrayMyString_value_wrapped_array val) throw (std::invalid_argument) {
        throw std::invalid_argument("cant set array, use [] instead");
    }

    %pythoncode %{
        __swig_getmethods__["value"] = get_libStringAndArrayMyString_value
        __swig_setmethods__["value"] = set_libStringAndArrayMyString_value
        if _newclass: value = property(get_libStringAndArrayMyString_value, set_libStringAndArrayMyString_value)
    %}
}

%immutable;
%inline %{
struct libStringAndArrayMyInt2_value_wrapped_array {
    uint8_t (&data)[5];
    libStringAndArrayMyInt2_value_wrapped_array(uint8_t (&data)[5]) : data(data) { }
};
%}
%mutable;

%extend libStringAndArrayMyInt2_value_wrapped_array {
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

typedef struct libStringAndArrayMyInt2
{
    void publish(void);
    void on_change(void);
    int32_t nettime;
    // array not exposed directly:    uint8_t value[5];
} libStringAndArrayMyInt2_t;

%extend libStringAndArrayMyInt2 {
    libStringAndArrayMyInt2_value_wrapped_array get_libStringAndArrayMyInt2_value(){
        return libStringAndArrayMyInt2_value_wrapped_array($self->value);
    }
    void set_libStringAndArrayMyInt2_value(libStringAndArrayMyInt2_value_wrapped_array val) throw (std::invalid_argument) {
        throw std::invalid_argument("cant set array, use [] instead");
    }

    %pythoncode %{
        __swig_getmethods__["value"] = get_libStringAndArrayMyInt2_value
        __swig_setmethods__["value"] = set_libStringAndArrayMyInt2_value
        if _newclass: value = property(get_libStringAndArrayMyInt2_value, set_libStringAndArrayMyInt2_value)
    %}
}

%immutable;
%inline %{
struct libStringAndArrayMyIntStruct_value_wrapped_array {
    IntStruct_typ (&data)[6];
    libStringAndArrayMyIntStruct_value_wrapped_array(IntStruct_typ (&data)[6]) : data(data) { }
};
%}
%mutable;

%extend libStringAndArrayMyIntStruct_value_wrapped_array {
    inline size_t __len__() const { return 6; }

    inline const IntStruct_typ& __getitem__(size_t i) const throw(std::out_of_range) {
        if (i >= 6 || i < 0)
            throw std::out_of_range("out of bounds");
        return $self->data[i];
    }

    inline void __setitem__(size_t i, const IntStruct_typ& v) throw(std::out_of_range) {
        if (i >= 6 || i < 0)
            throw std::out_of_range("out of bounds");
        $self->data[i] = v; 
    }
}

typedef struct libStringAndArrayMyIntStruct
{
    void publish(void);
    void on_change(void);
    int32_t nettime;
    // array not exposed directly:    IntStruct_typ value[6];
} libStringAndArrayMyIntStruct_t;

%extend libStringAndArrayMyIntStruct {
    libStringAndArrayMyIntStruct_value_wrapped_array get_libStringAndArrayMyIntStruct_value(){
        return libStringAndArrayMyIntStruct_value_wrapped_array($self->value);
    }
    void set_libStringAndArrayMyIntStruct_value(libStringAndArrayMyIntStruct_value_wrapped_array val) throw (std::invalid_argument) {
        throw std::invalid_argument("cant set array, use [] instead");
    }

    %pythoncode %{
        __swig_getmethods__["value"] = get_libStringAndArrayMyIntStruct_value
        __swig_setmethods__["value"] = set_libStringAndArrayMyIntStruct_value
        if _newclass: value = property(get_libStringAndArrayMyIntStruct_value, set_libStringAndArrayMyIntStruct_value)
    %}
}

typedef struct libStringAndArrayMyIntStruct1
{
    void publish(void);
    void on_change(void);
    int32_t nettime;
    IntStruct1_typ value;
} libStringAndArrayMyIntStruct1_t;

typedef struct libStringAndArrayMyIntStruct2
{
    void publish(void);
    void on_change(void);
    int32_t nettime;
    IntStruct2_typ value;
} libStringAndArrayMyIntStruct2_t;

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
    libStringAndArrayMyString_t MyString;
    libStringAndArrayMyInt2_t MyInt2;
    libStringAndArrayMyIntStruct_t MyIntStruct;
    libStringAndArrayMyIntStruct1_t MyIntStruct1;
    libStringAndArrayMyIntStruct2_t MyIntStruct2;
} libStringAndArray_t;

libStringAndArray_t *libStringAndArray_init(void);
