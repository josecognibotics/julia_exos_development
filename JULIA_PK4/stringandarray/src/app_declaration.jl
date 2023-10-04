using .stringandarray

GC.enable(false)

const config_stringandarray = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"dataType\":\"StringAndArray\",\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt1\",\"dataType\":\"UDINT\",\"comment\":\"PUB\",\"info\":\"<infoId1>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt2\",\"dataType\":\"USINT\",\"comment\":\"PUB SUB\",\"arraySize\":5,\"info\":\"<infoId2>\",\"info2\":\"<infoId3>\"}}]}"

mutable struct StringAndArray
    MyInt1::Ref{Cuint} #SUB
    MyInt2::Ref{NTuple{5, Cuchar}} #PUB SUB
end
# Define APPLICATION - CALLBACK function
function datamodelEvent(datamodel::Ptr{julia_exos_datamodel_handle}, event_type::EXOS_DATAMODEL_EVENT_TYPE, info::Ptr{Cvoid})
    # Handle the event_type
    println("\nI am a very nice general callback function, you are calling me")
end
#Pointer to callback function
datamodel_event_cb = @cfunction(datamodelEvent, Cvoid, (Ptr{julia_exos_datamodel_handle}, EXOS_DATAMODEL_EVENT_TYPE, Ptr{Cvoid}))

function datasetEvent(dataset::Ptr{julia_exos_dataset_handle}, event_type::EXOS_DATASET_EVENT_TYPE, info::Ptr{Cvoid})
    # Handle the event_type
    println("\nI am a very nice general callback function, you are calling me")
end
#Pointer to callback function
dataset_event_cb = @cfunction(datasetEvent, Cvoid, (Ptr{julia_exos_dataset_handle}, EXOS_DATAMODEL_EVENT_TYPE, Ptr{Cvoid}))


# Define LOG - CALLBACK function
function exos_config_change_cb(dataset::Ptr{julia_exos_dataset_handle}, event_type::EXOS_DATAMODEL_EVENT_TYPE, info::Ptr{Cvoid})
    println("\nI am a very nice log callback function, you are calling me")
end
#Pointer to callback function
config_change_cb = @cfunction(exos_config_change_cb, Cvoid, (Ptr{julia_exos_dataset_handle}, EXOS_DATAMODEL_EVENT_TYPE, Ptr{Cvoid}))

#Initialise @enums to be used in the functions calls
state = EXOS_CONNECTION_STATE(1)
err = EXOS_ERROR_CODE(0)
#EXOS_DATASET_SUBSCRIBE = EXOS_DATASET_TYPE(1)
EXOS_DATASET_PUBLISH = EXOS_DATASET_TYPE(16)
event = EXOS_DATAMODEL_EVENT_TYPE(0)
process_mode = EXOS_DATAMODEL_PROCESS_MODE(1)
event_type = EXOS_DATAMODEL_EVENT_TYPE(1)
level = EXOS_LOG_LEVEL(3)

# Test to use CString convertion for strings in functions call

empty_string                  = Base.unsafe_convert(Cstring, "")::Cstring
config_stringandarray_Cstring = Base.unsafe_convert(Cstring, config_stringandarray)::Cstring
MyInt1_Cstring                = Base.unsafe_convert(Cstring, "MyInt1")::Cstring
MyInt2_Cstring                = Base.unsafe_convert(Cstring, "MyInt2")::Cstring
MyInt2_0_Cstring              = Base.unsafe_convert(Cstring, "MyInt2[0]")::Cstring
StringAndArray_0_C            = Base.unsafe_convert(Cstring, "StringAndArray_0")::Cstring
gStringAndArray_0_C           = Base.unsafe_convert(Cstring, "gStringAndArray_0")::Cstring

# INITIALIZATION: julia_exos_datamodel_private #
datamodel_private = Ref{julia_exos_datamodel_private}(julia_exos_datamodel_private(
                                                Cuint(0),
                                                C_NULL,
                                                ntuple(x->Ptr{Cvoid}(C_NULL), 8)
                                                ))

ptr_datamodel_private = Base.unsafe_convert(Ptr{julia_exos_datamodel_private}, datamodel_private)::Ptr{julia_exos_datamodel_private}

# INITIALIZATION: julia_exos_datamodel_sync_info #
datamodel_sync_info = Ref{julia_exos_datamodel_sync_info}(julia_exos_datamodel_sync_info(
                                                    Cuchar(0),
                                                    ntuple(x->Cuchar(0), 8),
                                                    Cuint(0),
                                                    Cuint(0),
                                                    process_mode,
                                                    ntuple(x->Cuint(0), 7)
                                                    ))	
ptr_datamodel_sync_info = Base.unsafe_convert(Ptr{julia_exos_datamodel_sync_info}, datamodel_sync_info)::Ptr{julia_exos_datamodel_sync_info}

# INITIALIZATION: julia_exos_buffer_info #
buffer_info = Ref{julia_exos_buffer_info}(julia_exos_buffer_info(Cuint(0), Cuint(0), Cuint(0)))
ptr_buffer_info = Base.unsafe_convert(Ptr{julia_exos_buffer_info}, buffer_info)::Ptr{julia_exos_buffer_info}

# INITIALIZATION: julia_exos_dataset_private #
dataset_private = Ref{julia_exos_dataset_private}(julia_exos_dataset_private(
                                            Cuint(0),
                                            C_NULL,
                                            ntuple(x->Ptr{Cvoid}(C_NULL), 8)
                                            ))
ptr_dataset_private = Base.unsafe_convert(Ptr{julia_exos_dataset_private}, dataset_private)::Ptr{julia_exos_dataset_private}

# LOG INITIALIZATIONS: #
log_private = Ref{julia_exos_log_private}(julia_exos_log_private(
                                                                Cuint(0),
                                                                C_NULL,
                                                                ntuple(x->Ptr{Cvoid}(C_NULL), 4)
                                                                ))
                                                                
ptr_log_private = Base.unsafe_convert(Ptr{julia_exos_log_private}, log_private)::Ptr{julia_exos_log_private}

log_handle = Ref{julia_exos_log_handle}(julia_exos_log_handle(
                                                                empty_string,
                                                                Cuchar(0),
                                                                Cuchar(0),
                                                                Cuchar(0),
                                                                config_change_cb,
                                                                C_NULL,
                                                                ntuple(x->Cuchar(0), 4),
                                                                ntuple(x->Cuint(0), 4),
                                                                ntuple(x->Ptr{Cvoid}(C_NULL), 4),
                                                                ptr_log_private
                                                                ))

ptr_log_handle = Base.unsafe_convert(Ptr{julia_exos_log_handle}, log_handle)::Ptr{julia_exos_log_handle}

log_config_type = julia_exos_log_config_type(
                                            Cuchar(0),
                                            Cuchar(0),
                                            Cuchar(0),
                                            ntuple(x->Cuchar(0), 8),
                                            )
log_config = julia_exos_log_config(
                                    level,
                                    log_config_type,
                                    ntuple(x->Cuint(0), 4),
                                    ntuple(x->Cuchar(0), 4),
                                    ntuple(x->ntuple(x->Cuchar(0), EXOS_LOG_MAX_NAME_LENGTH + 1), EXOS_LOG_EXCLUDE_LIST_LEN)
                                    )


#Initialising StringAndArray
data = Ref{StringAndArray}(StringAndArray(Cuint(0), ntuple(x-> Cuchar(0), 5)))

ptr_data   = Base.unsafe_convert(Ptr{StringAndArray}, data)::Ptr{StringAndArray}
ptr_MyInt1 = Base.unsafe_convert(Ptr{Cuint}, data[].MyInt1)::Ptr{Cuint}
ptr_MyInt2 = Base.unsafe_convert(Ptr{NTuple{5, Cuchar}}, data[].MyInt2)::Ptr{NTuple{5, Cuchar}}

# INITIALIZATION: julia_exos_datamodel_handle #
stringandarray_handle = Ref{julia_exos_datamodel_handle}(julia_exos_datamodel_handle(
                                                                                        empty_string,
                                                                                        state,
                                                                                        err,
                                                                                        C_NULL,
                                                                                        Clong(0),
                                                                                        empty_string,
                                                                                        datamodel_event_cb,
                                                                                        ptr_datamodel_sync_info,
                                                                                        ntuple(x->Cuchar(0), 8),
                                                                                        ntuple(x->Cuint(0), 8),
                                                                                        ntuple(x->Ptr{Cvoid}(C_NULL), 8),
                                                                                        ptr_datamodel_private
                                                                                        ))                

ptr_stringandarray_handle = Base.unsafe_convert(Ptr{julia_exos_datamodel_handle}, stringandarray_handle)::Ptr{julia_exos_datamodel_handle}

# INITIALIZATION: julia_exos_dataset_handle #
myint1 = Ref{julia_exos_dataset_handle}(julia_exos_dataset_handle(
                                                                    empty_string,
                                                                    Cint(0),
                                                                    ptr_stringandarray_handle,
                                                                    C_NULL,
                                                                    Csize_t(0),
                                                                    err,
                                                                    state,
                                                                    ptr_buffer_info,
                                                                    Cint(0),
                                                                    Cint(0),
                                                                    C_NULL,
                                                                    datamodel_event_cb,
                                                                    ntuple(x->Cuchar(0), 8),
                                                                    ntuple(x->Cuint(0), 8),
                                                                    ntuple(x->Ptr{Cvoid}(C_NULL), 8),
                                                                    ptr_dataset_private
                                                                    ))

myint2 = Ref{julia_exos_dataset_handle}(julia_exos_dataset_handle(
                                                                    empty_string,
                                                                    Cint(0),
                                                                    ptr_stringandarray_handle,
                                                                    C_NULL,
                                                                    Csize_t(0),
                                                                    err,
                                                                    state,
                                                                    ptr_buffer_info,
                                                                    Cint(0),
                                                                    Cint(0),
                                                                    C_NULL,
                                                                    datamodel_event_cb,
                                                                    ntuple(x->Cuchar(0), 8),
                                                                    ntuple(x->Cuint(0), 8),
                                                                    ntuple(x->Ptr{Cvoid}(C_NULL), 8),
                                                                    ptr_dataset_private
                                                                    ))

                                                                    