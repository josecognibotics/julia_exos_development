using .stringandarray

GC.enable(false)


const config_stringandarray  = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"dataType\":\"StringAndArray\",\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt1\",\"dataType\":\"UDINT\",\"comment\":\"PUB\",\"info\":\"<infoId1>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt2\",\"dataType\":\"USINT\",\"comment\":\"PUB SUB\",\"arraySize\":5,\"info\":\"<infoId2>\",\"info2\":\"<infoId3>\"}}]}"

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

# Define LOG - CALLBACK function
function exos_config_change_cb(dataset::Ptr{julia_exos_dataset_handle}, event_type::EXOS_DATAMODEL_EVENT_TYPE, info::Ptr{Cvoid})
    println("\nI am a very nice log callback function, you are calling me")
end
#Pointer to callback function
config_change_cb = @cfunction(exos_config_change_cb, Cvoid, (Ptr{julia_exos_dataset_handle}, EXOS_DATAMODEL_EVENT_TYPE, Ptr{Cvoid}))

#Initialise @enums to be used in the functions calls
state = EXOS_CONNECTION_STATE(1)
err = EXOS_ERROR_CODE(0)
EXOS_DATASET_SUBSCRIBE = EXOS_DATASET_TYPE(1)
EXOS_DATASET_PUBLISH = EXOS_DATASET_TYPE(16)
event = EXOS_DATAMODEL_EVENT_TYPE(0)
process_mode = EXOS_DATAMODEL_PROCESS_MODE(1)
event_type = EXOS_DATAMODEL_EVENT_TYPE(1)
level = EXOS_LOG_LEVEL(3)
#=
println("state:\t\t\t$state")
println("err:\t\t\t$err")
println("EXOS_DATASET_SUBSCRIBE:\t$EXOS_DATASET_SUBSCRIBE")
println("EXOS_DATASET_PUBLISH:\t$EXOS_DATASET_PUBLISH")
println("event:\t\t\t$event")
println("process_mode:\t\t$process_mode")
println("event_type:\t\t$event_type")
println("level:\t\t\t$level")
println("----------------------------------------------")
=#
# Test to use CString convertion for strings in functions call

empty_string                  = Base.unsafe_convert(Cstring, "")::Cstring
config_stringandarray_Cstring = Base.unsafe_convert(Cstring, config_stringandarray)::Cstring
MyInt1_Cstring                = Base.unsafe_convert(Cstring, "MyInt1")::Cstring
MyInt2_Cstring                = Base.unsafe_convert(Cstring, "MyInt2")::Cstring
MyInt2_0_Cstring              = Base.unsafe_convert(Cstring, "MyInt2[0]")::Cstring
StringAndArray_0_C            = Base.unsafe_convert(Cstring, "StringAndArray_0")::Cstring
println("CSTRING IS: ", StringAndArray_0_C)
println("Unload CSTRING: ", unsafe_string(StringAndArray_0_C))
gStringAndArray_0_C           = Base.unsafe_convert(Cstring, "gStringAndArray_0")::Cstring
#=
println("empty_string:\t\t\t$empty_string")
println("config_stringandarray_Cstring:\t$config_stringandarray_Cstring")
println("MyInt1_Cstring:\t\t\t$MyInt1_Cstring")
println("MyInt2_Cstring:\t\t\t$MyInt2_Cstring")
println("MyInt2_0_Cstring:\t\t$MyInt2_0_Cstring")
println("----------------------------------------------")
=#

# INITIALIZATION: julia_exos_datamodel_private #
datamodel_private = Ref{julia_exos_datamodel_private}(julia_exos_datamodel_private(
                                                                                    Cuint(0),
                                                                                    C_NULL,
                                                                                    ntuple(x->Ptr{Cvoid}(C_NULL), 8)
                                                                                    ))
                    
# INITIALIZATION: julia_exos_datamodel_sync_info #
datamodel_sync_info = Ref{julia_exos_datamodel_sync_info}(julia_exos_datamodel_sync_info(
                                                                                            Cuchar(0),
                                                                                            ntuple(x->Cuchar(0), 8),
                                                                                            Cuint(0),
                                                                                            Cuint(0),
                                                                                            process_mode,
                                                                                            ntuple(x->Cuint(0), 7)
                                                                                            ))	
# INITIALIZATION: julia_exos_buffer_info #
buffer_info = Ref{julia_exos_buffer_info}(julia_exos_buffer_info(Cuint(0), Cuint(0), Cuint(0)))

# INITIALIZATION: julia_exos_dataset_private #
dataset_private = Ref{julia_exos_dataset_private}(julia_exos_dataset_private(
                                                                                Cuint(0),
                                                                                C_NULL,
                                                                                ntuple(x->Ptr{Cvoid}(C_NULL), 8)
                                                                                ))


# LOG INITIALIZATIONS: #
log_private = Ref{julia_exos_log_private}(julia_exos_log_private(
                                                                    Cuint(0),
                                                                    C_NULL,
                                                                    ntuple(x->Ptr{Cvoid}(C_NULL), 4)
                                                                    ))
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
                                                                log_private[]
                                                                ))
 
log_config_type = Ref{julia_exos_log_config_type}(julia_exos_log_config_type(
                                                                                Cuchar(0),
                                                                                Cuchar(0),
                                                                                Cuchar(0),
                                                                                ntuple(x->Cuchar(0), 8),
                                                                                ))
log_config = Ref{julia_exos_log_config}(julia_exos_log_config(
                                                                level,
                                                                log_config_type[],
                                                                ntuple(x->Cuint(0), 4),
                                                                ntuple(x->Cuchar(0), 4),
                                                                ntuple(x->ntuple(x->Cuchar(0), EXOS_LOG_MAX_NAME_LENGTH + 1), EXOS_LOG_EXCLUDE_LIST_LEN)
                                                                ))
function julia_datamodel_connect_stringarray(datamodel::Ref{julia_exos_datamodel_handle}, datamodel_event_cb::Ptr{Cvoid})
    println("StringAndArray ptr: $datamodel")
    println("Callback pointer: ", datamodel_event_cb)

    datasets = julia_exos_dataset_info[]
    data = Ref{StringAndArray}(StringAndArray(Cuint(0), ntuple(x-> Cuchar(0), 5)))
    GC.@preserve data
    ptr_data   = Base.unsafe_convert(Ptr{StringAndArray}, data)::Ptr{StringAndArray}
    ptr_MyInt1 = Base.unsafe_convert(Ptr{Cuint}, data[].MyInt1)::Ptr{Cuint}
    ptr_MyInt2 = Base.unsafe_convert(Ptr{NTuple{5, Cuchar}}, data[].MyInt2)::Ptr{NTuple{5, Cuchar}}

    # dataset1
    name_1 = empty_string
    adr = ptr_data
    size_1 = Csize_t(sizeof(data[]))
    offset_1 = Clong(0)
    array_items = ntuple(x->Cuint(0), EXOS_ARRAY_DEPTH)
    dataset1 = julia_exos_dataset_info(name_1, adr, size_1, offset_1, array_items)
    push!(datasets, dataset1)

    #dataset2
    name_2 = MyInt1_Cstring
    adr_2 = ptr_MyInt1
    size_2 = Csize_t(sizeof(data[].MyInt1))
    offset_2 = Clong(0)
    dataset2 = julia_exos_dataset_info(name_2, adr_2, size_2, offset_2, array_items)
    push!(datasets, dataset2)

    # dataset3
    name_3 = MyInt2_Cstring
    adr_3 = ptr_MyInt2
    size_3 = Csize_t(sizeof(data[].MyInt2[]))
    offset_3 = Clong(0)
    dataset3 = julia_exos_dataset_info(name_3, adr_3, size_3, offset_3, array_items)
    push!(datasets, dataset3)

    #dataset4
    name_4 = MyInt2_0_Cstring
    adr_4 = ptr_MyInt2
    size_4 = Csize_t(sizeof(data[].MyInt2[][1]))
    offset_4 = Clong(0)
    array_items_5 = ntuple(i -> i == 1 ? 5 : 0, 10)
    dataset4 = julia_exos_dataset_info(name_4, adr_4, size_4, offset_4, array_items_5)
    push!(datasets, dataset4)

    
    datasets_size = sum(sizeof.(datasets))
    println("Datasets size: ", datasets_size)
    println("DATASETS")
    println("----------------------------------------")
#=
    for dataset in datasets
        println("name: ", string(dataset.name))
        println("adr: ", dataset.adr)
        println("size: ", dataset.size)
        println("offset: ", dataset.offset)
        println("arrayItems: ", dataset.arrayItems)
        println()
    end
  =#  

    
    #=
	* (internal) Calculate dataset_info_t offsets from the EXOS_DATASET_BROWSE_NAME macros
	* 
	* The offsets of the various datasets of a datamodel are entered in a exos_dataset_info_t list, basically pointing out the start address of the given dataset.
	* This function creates offsets of the absolute addresses by subtracting the first (info[0]) dataset info from the absolute address
	* The function is "internal" meaning it shouldnt be used in an application unless there are specific reasons to do so. Applications should refer to the automatically generated headerfile.
	=#
	@ccall libexos_api.exos_datamodel_calc_dataset_info(datasets::Ref{julia_exos_dataset_info}, datasets_size::Csize_t)::Cvoid

	#=
	* (internal) Connect a datamodel to the Dataset Message Router
	* 
	* The connect function used in an application is code generated from a `.typ` file and will have the name of the specified main data structure of the datamodel.
	* 
	* For example, lets say the MyApp datamodel uses a MyApp.typ file, and in that file, the main datamodel structure is called MyApplication.
	* In that case the generated header (`exos_myapplication.h`) will declare the function `exos_datamodel_connect_myapplication()`
	* 
	* This function is the "raw" version, which provides a JSON template (describing the datamodel) and a list of exos_dataset_info_t describing the offsets of the datasets within the datamodel
	* The function is "internal" meaning it shouldnt be used in an application unless there are specific reasons to do so. Applications should refer to the automatically generated headerfile.
	=#
    println("StringAndArray ptr: $datamodel")
    struct_string = unsafe_load(datamodel)
    println("DATAMODEL HANDEL")
    println(unsafe_string(struct_string.name))
    println(struct_string.connection_state)
    println(struct_string.error)
    println(struct_string.user_context)
    println(struct_string.user_tag)
    println(struct_string.user_alias)
    println(struct_string.datamodel_event_callback)
    #println(struct_string.sync_info[])
    # println(struct_string._reserved_bool)
    # println(struct_string._reserved_uint32)
    # println(struct_string._reserved_void)
    # println(struct_string._private)


    datamodel_connect = @ccall libexos_api.exos_datamodel_connect(datamodel::Ref{julia_exos_datamodel_handle}, Ref{Cstring}(StringAndArray_0_C)::Ref{Cstring}, Ref{Cstring}(gStringAndArray_0_C)::Ref{Cstring})::Cint
	#datamodel_connect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_connect)::EXOS_ERROR_CODE)::Cstring)
	println("Datamodel_connect\t\t-> ERROR_CODE: $datamodel_connect")    #=
	return @ccall libexos_api.exos_datamodel_connect(datamodel::Ref{julia_exos_datamodel_handle}, Ref{Cstring}(config_stringandarray_Cstring)::Ref{Cstring}, datasets::Ref{julia_exos_dataset_info}, sizeof(datasets)::Csize_t, datamodel_event_cb::Ptr{Cvoid})::Cint
=#
    
end
function main()
    println("Starting process...")
	println("----------------------------------------------")
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
                                                                                            datamodel_sync_info[],
                                                                                            ntuple(x->Cuchar(0), 8),
                                                                                            ntuple(x->Cuint(0), 8),
                                                                                            ntuple(x->Ptr{Cvoid}(C_NULL), 8),
                                                                                            datamodel_private[]
                                                                                            ))                
    println("Pointer to callback is: ", datamodel_event_cb)  
    println("Pointer to callback is: ", stringandarray_handle[].datamodel_event_callback)        
    println("SYNC INFO: ",  stringandarray_handle[].sync_info)                                                         
    ptr_stringandarray_handle = Base.unsafe_convert(Ptr{julia_exos_datamodel_handle}, stringandarray_handle)::Ptr{julia_exos_datamodel_handle}

    println("The pointer inside of the handle 1 is: ", unsafe_load(ptr_stringandarray_handle).datamodel_event_callback)
    # INITIALIZATION: julia_exos_dataset_handle #
    myint1 = Ref{julia_exos_dataset_handle}(julia_exos_dataset_handle(
                                                                        empty_string,
                                                                        EXOS_DATASET_SUBSCRIBE,
                                                                        ptr_stringandarray_handle,
                                                                        C_NULL,
                                                                        Csize_t(0),
                                                                        err,
                                                                        state,
                                                                        buffer_info[],
                                                                        Cint(0),
                                                                        Cint(0),
                                                                        C_NULL,
                                                                        datamodel_event_cb,
                                                                        ntuple(x->Cuchar(0), 8),
                                                                        ntuple(x->Cuint(0), 8),
                                                                        ntuple(x->Ptr{Cvoid}(C_NULL), 8),
                                                                        dataset_private[]
                                                                        ))
    
   myint2 = Ref{julia_exos_dataset_handle}(julia_exos_dataset_handle(
                                                                        empty_string,
                                                                        EXOS_DATASET_PUBLISH,
                                                                        ptr_stringandarray_handle,
                                                                        C_NULL,
                                                                        Csize_t(0),
                                                                        err,
                                                                        state,
                                                                        buffer_info[],
                                                                        Cint(0),
                                                                        Cint(0),
                                                                        C_NULL,
                                                                        datamodel_event_cb,
                                                                        ntuple(x->Cuchar(0), 8),
                                                                        ntuple(x->Cuint(0), 8),
                                                                        ntuple(x->Ptr{Cvoid}(C_NULL), 8),
                                                                        dataset_private[]
                                                                        ))
                                                                                                                              
#=  
    println("Starting StringAndArray application...")
	println("----------------------------------------------")
    log_init = @ccall libexos_api.exos_log_init(log_handle::Ref{julia_exos_log_handle}, Ref{Cstring}(gStringAndArray_0_C)::Ref{Cstring})::Cint
    println("log_init\t\t\t-> ERROR_CODE: $log_init")
=#

    #log_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(log_init)::Ref{EXOS_ERROR_CODE})::Cstring)
    #log_delete = @ccall libexos_api.exos_log_delete(pointer(blobs_log_handle[1])::Ptr{julia_exos_log_handle})::Cint

    #= Initialize the datamodel handle
	* 
	* This function intializes (resets) a datamodel handle and gives it a `user_alias` via a `datamodel_instance_name`.
	* The datamodel handle is then used for receiving incoming messages using the `exos_datamodel_process()`
	=#

    struct_string = unsafe_load(ptr_stringandarray_handle)
    println("------------------ DATAMODEL HANDEL BEFORE INIT ------------------")
    println(unsafe_string(struct_string.name))
    println(struct_string.connection_state)
    println(struct_string.error)
    println(struct_string.user_context)
    println(struct_string.user_tag)
    println(unsafe_string(struct_string.user_alias))
    println(struct_string.datamodel_event_callback)
    println(struct_string.sync_info)
    println(struct_string._reserved_bool)
    println(struct_string._reserved_uint32)
    println(struct_string._reserved_void)
    println(struct_string._private)
    println("----------------------------------------------")

    datamodel_init = @ccall libexos_api.exos_datamodel_init(stringandarray_handle::Ref{julia_exos_datamodel_handle}, "StringAndArray_0"::Cstring, "gStringAndArray_0"::Cstring)::Cint
    datamodel_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_init)::EXOS_ERROR_CODE)::Cstring)
    println("datamodel_init\t\t\t-> ERROR_CODE: $datamodel_init $datamodel_init_string")
    
    struct_string = unsafe_load(ptr_stringandarray_handle)
    println("------------------ DATAMODEL HANDEL BEFORE INIT ------------------")
    println(struct_string)
    println(unsafe_string(struct_string.name))
    println(struct_string.connection_state)
    println(struct_string.error)
    println(struct_string.user_context)
    println(struct_string.user_tag)
    println(unsafe_string(struct_string.user_alias))
    println(struct_string.datamodel_event_callback)
    #println(struct_string.sync_info)
    println(struct_string._reserved_bool)
    println(struct_string._reserved_uint32)
    println(struct_string._reserved_void)
    #println(struct_string._private)
    println("----------------------------------------------")

    stringandarray_handle[].user_context = C_NULL
    stringandarray_handle[].user_tag = Clong(0)

    #=
    * Initialize a dataset handle and attach it to a datamodel
    * 
    * This function initializes the `exos_dataset_handle_t` structure, meaning it zeroes all members and sets artefact, data and size members.
    =#
    dataset_init1 = @ccall libexos_api.exos_dataset_init(myint1::Ref{julia_exos_dataset_handle}, ptr_stringandarray_handle::Ref{julia_exos_datamodel_handle}, "MyInt1"::Cstring, ptr_MyInt1::Ptr{Cvoid}, sizeof(data[].MyInt1)::Csize_t)::Cint
    println("The pointer inside of the handle 4 is: ", unsafe_load(ptr_stringandarray_handle).datamodel_event_callback)

    #dataset_init_string1 = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_init1)::EXOS_ERROR_CODE)::Cstring)
    println("MyInt1 - dataset_init\t\t-> ERROR_CODE: $dataset_init1")

    myint1[].user_context = C_NULL
    myint1[].user_tag = Cint(0)
    #=
    * Release all resources from a dataset (and disconnect from the Dataset Message Router)
    * 
    * Delete (and disconnect) a dataset and free up all allocated resources.
    * If the dataset is connected, it will be disconnected before being deleted.
    =#       
    
    dataset_init2 = @ccall libexos_api.exos_dataset_init(myint2::Ref{julia_exos_dataset_handle}, ptr_stringandarray_handle::Ref{julia_exos_datamodel_handle}, "MyInt2"::Cstring, ptr_MyInt2::Ptr{Cvoid}, sizeof(data[].MyInt2)::Csize_t)::Cint
    #dataset_init_string2 = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_init2)::EXOS_ERROR_CODE)::Cstring)
    println("MyInt2 - dataset_init\t\t-> ERROR_CODE: $dataset_init2")

    myint2[].user_context = C_NULL
    myint2[].user_tag = Cint(0)
    println("The pointer inside of the handle 5 is: ", unsafe_load(ptr_stringandarray_handle).datamodel_event_callback)

    julia_datamodel_connect_stringarray(ptr_stringandarray_handle, datamodel_event_cb)

end
main()


println("------------------ DATASET 1 HANDEL BEFORE INIT ------------------")
println(unsafe_string(myint1[].name))
println(myint2[].type[])
println(myint2[].datamodel)
println(myint2[].data)
println(myint2[].size)
println(myint2[].error)
println(myint2[].connection_state)
println(myint2[].send_buffer)
println(myint2[].nettime)
println(myint2[].user_tag)
println(myint2[].user_context)
println(myint2[].dataset_event_callback)
println(myint2[]._reserved_bool)
println(myint2[]._reserved_void)
println(myint2[]._private)
println("----------------------------------------------")

    # struct_string = unsafe_load(ptr_stringandarray_handle)
    # println("------------------ DATAMODEL HANDEL AFTER INIT ------------------")
    # println(unsafe_string(struct_string.name))
    # println(struct_string.connection_state)
    # println(struct_string.error)
    # println(struct_string.user_context)
    # println(struct_string.user_tag)
    # println(unsafe_string(struct_string.user_alias))
    # println(struct_string.datamodel_event_callback)
    # println(struct_string.sync_info)
    # println(struct_string._reserved_bool)
    # println(struct_string._reserved_uint32)
    # println(struct_string._reserved_void)
    # println(struct_string._private)
    # println("----------------------------------------------")
   