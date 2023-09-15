#ifndef _LIBSTRINGANDARRAY_H_
#define _LIBSTRINGANDARRAY_H_

#include "exos_stringandarray.h"

typedef void (*libStringAndArray_event_cb)(void);
typedef void (*libStringAndArray_method_fn)(void);
typedef int32_t (*libStringAndArray_get_nettime_fn)(void);
typedef void (*libStringAndArray_log_fn)(char *log_entry);

typedef struct libStringAndArrayMyInt1
{
    libStringAndArray_event_cb on_change;
    int32_t nettime;
    uint32_t value;
} libStringAndArrayMyInt1_t;

typedef struct libStringAndArrayMyInt3
{
    libStringAndArray_method_fn publish;
    libStringAndArray_event_cb on_change;
    int32_t nettime;
    uint8_t value[5];
} libStringAndArrayMyInt3_t;

typedef struct libStringAndArray_log
{
    libStringAndArray_log_fn error;
    libStringAndArray_log_fn warning;
    libStringAndArray_log_fn success;
    libStringAndArray_log_fn info;
    libStringAndArray_log_fn debug;
    libStringAndArray_log_fn verbose;
} libStringAndArray_log_t;

typedef struct libStringAndArray
{
    libStringAndArray_method_fn connect;
    libStringAndArray_method_fn disconnect;
    libStringAndArray_method_fn process;
    libStringAndArray_method_fn set_operational;
    libStringAndArray_method_fn dispose;
    libStringAndArray_get_nettime_fn get_nettime;
    libStringAndArray_log_t log;
    libStringAndArray_event_cb on_connected;
    libStringAndArray_event_cb on_disconnected;
    libStringAndArray_event_cb on_operational;
    bool is_connected;
    bool is_operational;
    libStringAndArrayMyInt1_t MyInt1;
    libStringAndArrayMyInt3_t MyInt3;
} libStringAndArray_t;

#ifdef __cplusplus
extern "C" {
#endif
libStringAndArray_t *libStringAndArray_init(void);
#ifdef __cplusplus
}
#endif
#endif // _LIBSTRINGANDARRAY_H_
