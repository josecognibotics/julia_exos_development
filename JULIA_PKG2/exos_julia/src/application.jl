using .exos_julia

#Initialise @enums to be used in the functions call
state = EXOS_CONNECTION_STATE(1)
err = EXOS_ERROR_CODE(0)
type = EXOS_DATASET_TYPE(1)
event = EXOS_DATAMODEL_EVENT_TYPE(0)
inf = C_NULL
process_mode = EXOS_DATAMODEL_PROCESS_MODE(1)
event_type = EXOS_DATAMODEL_EVENT_TYPE(1)
level = EXOS_LOG_LEVEL(3)

const config_stringandarray = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"dataType\":\"exos_julia\",\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt1\",\"dataType\":\"UDINT\",\"comment\":\"PUB\",\"info\":\"<infoId1>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt3\",\"dataType\":\"USINT\",\"comment\":\"PUB SUB\",\"arraySize\":5,\"info\":\"<infoId2>\",\"info2\":\"<infoId3>\"}}]}"

json_obj = JSON.Parser.parse(config_stringandarray)
JSON.print(stdout, json_obj, 2)  # The '2' is for indentation

mutable struct StringAndArray
    MyInt1::Cuint #PUB
    MyInt3::MVector{5, UInt8} #PUB SUB
end

# Test to use CString convertion for strings in functions call
datamodel_instance_name = Base.unsafe_convert(Cstring,"StringAndArray_0")::Cstring
user_alias = Base.unsafe_convert(Cstring, "gStringAndArray_0")::Cstring
log_string = Base.unsafe_convert(Cstring, "gStringAndArray_0")::Cstring

NAME = Base.unsafe_convert(Cstring, "<NAME>")::Cstring

empty_string = Base.unsafe_convert(Cstring, "")::Cstring
config_Cstring = Base.unsafe_convert(Cstring, config_stringandarray)::Cstring
stringAndArray_Cstring = Base.unsafe_convert(Cstring, "stringandarray")::Cstring
MyInt1_Cstring = Base.unsafe_convert(Cstring, "MyInt1")::Cstring
MyInt3_Cstring = Base.unsafe_convert(Cstring, "MyInt3")::Cstring
MyInt3_0_Cstring = Base.unsafe_convert(Cstring, "MyInt3[0]")::Cstring

# ------------------------------------LOG INITIALIZATIONS: ------------------------------------ #
log_private = julia_exos_log_private(
	0,
	C_NULL,
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL))
)

log_handle = julia_exos_log_handle(
	empty_string,
	Cuchar(0),
	Cuchar(0),
	Cuchar(0),
	config_change_cb,
	C_NULL,
	(Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0)),
	(Cuint(0),Cuint(0),Cuint(0),Cuint(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	log_private
)
log_config_type = julia_exos_log_config_type(
	0,
	0,
	0,
	(Cuchar(0), Cuchar(0), Cuchar(0), Cuchar(0), Cuchar(0), Cuchar(0), Cuchar(0), Cuchar(0))
)

log_config = julia_exos_log_config(
    level,
    log_config_type,
    (Cuint(0),Cuint(0),Cuint(0),Cuint(0)),
    (Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0))
)
# ------------------------------------API INITIALIZATIONS: ------------------------------------ #


# INITIALIZATION: julia_exos_datamodel_sync_info #
datamodel_sync_info = julia_exos_datamodel_sync_info(
	0,
	(Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0)),
	0,
	10,
	process_mode,
	(Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0))
)
# INITIALIZATION: julia_exos_datamodel_private #
datamodel_private = julia_exos_datamodel_private(
	0,
	C_NULL,
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
)
# INITIALIZATION: julia_exos_buffer_info #
buffer_info = julia_exos_buffer_info(
	0,
	0,
	0
)
# INITIALIZATION: julia_exos_dataset_private #
dataset_private = julia_exos_dataset_private(
	0,
	C_NULL,
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
)

data = StringAndArray(
	3,
	[1,2,3,4,5]
)
ptr_data = pointer_from_objref(data)
name = Base.unsafe_convert(Cstring,"PEPE")::Cstring

# INITIALIZATION: julia_exos_datamodel_handle #
stringandarray = julia_exos_datamodel_handle(
	empty_string,
	state,
	err,
	C_NULL,
	0,
	empty_string,
	datamodel_event_callback,
	datamodel_sync_info,
	(Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0)),
	(Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	datamodel_private
)

# INITIALIZATION: julia_exos_dataset_handle #
myint1 = julia_exos_dataset_handle(
	empty_string,
	type,
	stringandarray,
	C_NULL,
	0,
	err,
	state,
	buffer_info,
	0,
	0,
	C_NULL,
	datamodel_event_callback,
	(Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0)),
	(Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	dataset_private
)
myint3 = julia_exos_dataset_handle(
	empty_string,
	type,
	stringandarray,
	C_NULL,
	0,
	err,
	state,
	buffer_info,
	0,
	0,
	C_NULL,
	datamodel_event_callback,
	(Bool(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0)),
	(Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	dataset_private
)

# ------------------------------------ Julia FUNCTIONS: ------------------------------------ #

println("Starting communication with AS...")
println("----------------------------------------------------------------\n")
#= Initialize the log
* 
* This function intializes (resets) a datamodel handle and gives it a `user_alias` via a `datamodel_instance_name`.
* The datamodel handle is then used for receiving incoming messages using the `exos_datamodel_process()`
=#
#=t = @ccall libexos_api.exos_log_init(log_handle::Ref{julia_exos_log_handle}, "gStringAndArray_0"::Cstring)::Cint
log_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(log_init)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("log_init\t\t\t-> ERROR_CODE: $log_init: $log_init_string")



log_delete = @ccall libexos_api.exos_log_delete(log_handle::Ref{julia_exos_log_handle})::Cint
log_delete_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(log_init)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("log_delete\t\t\t-> ERROR_CODE: $log_delete: $log_delete_string")
=#
#= Initialize the datamodel handle
* 
* This function intializes (resets) a datamodel handle and gives it a `user_alias` via a `datamodel_instance_name`.
* The datamodel handle is then used for receiving incoming messages using the `exos_datamodel_process()`
=#

datamodel_init = @ccall libexos_api.exos_datamodel_init(stringandarray::Ref{julia_exos_datamodel_handle}, "StringAndArray_0"::Cstring, "gStringAndArray_0"::Cstring)::Cint
datamodel_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_init)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_init\t\t\t-> ERROR_CODE: $datamodel_init: $datamodel_init_string")

stringandarray.user_context = C_NULL
stringandarray.user_tag = 0
#=
 * Initialize a dataset handle and attach it to a datamodel
 * 
 * This function initializes the `exos_dataset_handle_t` structure, meaning it zeroes all members and sets artefact, data and size members.
=#
dataset_init = @ccall libexos_api.exos_dataset_init(myint1::Ref{julia_exos_dataset_handle}, stringandarray::Ref{julia_exos_datamodel_handle}, "MyInt1"::Cstring, ptr_data::Ptr{Cvoid}, sizeof(data.MyInt1)::Csize_t)::Cint
dataset_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_init)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_init\t\t\t-> ERROR_CODE: $dataset_init: $dataset_init_string")

myint1.user_context = C_NULL
myint1.user_tag = 0
#=
 * Initialize a dataset handle and attach it to a datamodel
 * 
 * This function initializes the `exos_dataset_handle_t` structure, meaning it zeroes all members and sets artefact, data and size members.
=#
dataset_init = @ccall libexos_api.exos_dataset_init(myint3::Ref{julia_exos_dataset_handle}, stringandarray::Ref{julia_exos_datamodel_handle}, "MyInt3"::Cstring, ptr_data::Ptr{Cvoid}, sizeof(data.MyInt3)::Csize_t)::Cint
dataset_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_init)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_init\t\t\t-> ERROR_CODE: $dataset_init: $dataset_init_string")

myint3.user_context = C_NULL
myint3.user_tag = 0

# INITIALIZATION: DATASETS & julia_exos_dataset_info #
# dataset1
name_1 = NAME
adr = C_NULL
size_1 = Csize_t(sizeof(data))
offset = Clong(0)
dataset1 = julia_exos_dataset_info(name_1, adr, size_1, offset)

#dataset2
name_2 = MyInt1_Cstring
size_2 = Csize_t(sizeof(data.MyInt1))
dataset2 = julia_exos_dataset_info(name_2, adr, size_2, offset)

# dataset3
name_3 = MyInt3_Cstring
adr = C_NULL
size_3 = Csize_t(sizeof(data.MyInt3))
offset_3 = Clong(4)
dataset3 = julia_exos_dataset_info(name_3, adr, size_3, offset_3)

#dataset4
name_4 = MyInt3_0_Cstring
size_4 = Csize_t(sizeof(data.MyInt3[1]))
offset_4 = Clong(4)
dataset4 = julia_exos_dataset_info(name_4, adr, size_4, offset_4)

#datasets = [julia_exos_dataset_info(myInt1_cstring, ptr_data, size, offset), julia_exos_dataset_info(myInt3_cstring, ptr_data, size, offset)]
datasets = [dataset1, dataset2, dataset3, dataset4]

# Define a custom function to print julia_exos_dataset_info
function print_julia_exos_dataset_info(dataset)
    println("Name: ", dataset.name)
    println("Address: ", dataset.adr)
    println("Size: ", dataset.size)
    println("Offset: ", dataset.offset)
    println("Array Items: ", dataset.arrayItems)
    println()
end

# Iterate through datasets and print each one
println("THESE ARE THE DATASETS:")
for dataset in datasets
    print_julia_exos_dataset_info(dataset)
end
#=
 * (internal) Calculate dataset_info_t offsets from the EXOS_DATASET_BROWSE_NAME macros
 * 
 * The offsets of the various datasets of a datamodel are entered in a exos_dataset_info_t list, basically pointing out the start address of the given dataset.
 * This function creates offsets of the absolute addresses by subtracting the first (info[0]) dataset info from the absolute address
 * The function is "internal" meaning it shouldnt be used in an application unless there are specific reasons to do so. Applications should refer to the automatically generated headerfile.
=#

datamodel_calc_dataset_info = @ccall libexos_api.exos_datamodel_calc_dataset_info(datasets::Ref{julia_exos_dataset_info}, sizeof(datasets)::Csize_t)::Cint
datamodel_calc_dataset_info_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_calc_dataset_info)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_calc_dataset_info\t-> ERROR_CODE: $datamodel_calc_dataset_info: $datamodel_calc_dataset_info_string")

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
datamodel_connect = @ccall libexos_api.exos_datamodel_connect(stringandarray::Ref{julia_exos_datamodel_handle}, config_stringandarray::Cstring, datasets::Ref{julia_exos_dataset_info}, sizeof(datasets)::Csize_t, datamodel_event_callback::Ptr{Cvoid})::Cint
datamodel_connect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_connect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_connect\t\t-> ERROR_CODE: $datamodel_connect: $datamodel_connect_string")

#=
* Set the datamodel into OPERATIONAL state
* 
* The `EXOS_STATE_OPERATIONAL` is merely to provide a built-in feature to distinguish between an operational and a preoperational state from an application perspective.
* If there is no need for this distinction, then an application can suffice with using the `EXOS_STATE_CONNECTED` as "active" state. 
* 
=#
datamodel_set_operational = @ccall libexos_api.exos_datamodel_set_operational(stringandarray::Ref{julia_exos_datamodel_handle})::Cint
datamodel_set_operational_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_set_operational)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_set_operational\t-> ERROR_CODE: $datamodel_set_operational: $datamodel_set_operational_string")

#=
 * Disconnect a datamodel from the Dataset Message Router
 * 
 * Triggers the `EXOS_STATE_DISCONNECTED` event on the datamodel before removing the callback instruction.
 * Here all internal ZMQ sockets are closed and there is no data transfer between the application and the server after this function has been called.
 * Before closing, however, the application sends a disconnection message to the *Dataset Message Router*.
 * 
 * All datasets assigned to the datamodel will be automatically disconnected (and receive a respective `EXOS_STATE_DISCONNECTED` event) 
=#
datamodel_disconnect = @ccall libexos_api.exos_datamodel_disconnect(stringandarray::Ref{julia_exos_datamodel_handle})::Cint
datamodel_disconnect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_disconnect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_disconnect\t\t-> ERROR_CODE: $datamodel_disconnect: $datamodel_disconnect_string")

#=
 * Release all resources from a datamodel (and disconnect from the Dataset Message Router)
 * 
 * This function will free up all allocated memory allocated for this datamodel, including all assigned datasets.
 * If a connection to the *Dataset Message Router* is active, it will be disconnected, independent of the current datamodel state.
=#
datamodel_delete = @ccall libexos_api.exos_datamodel_disconnect(stringandarray::Ref{julia_exos_datamodel_handle})::Cint
datamodel_delete_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_delete)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_delete\t\t-> ERROR_CODE: $datamodel_delete: $datamodel_delete_string")

#=
 * Cyclic main function - poll datamodel for incoming messages
 * 
 * The `exos_datamodel_process()` polls incoming messages in a blocking manner in Linux, where it synchronizes with the loop of the *Dataset Message Router*, 
 * which - in a shared memory connection - is synchronized with a configured AR task class. 
 * 
 * If there are many incoming messages, for example a lot of dataset updates, the `exos_datamodel_process()` will read out all pending messages and 
 * call the registered callbacks from the context it is called, until there are no more messages.
=#
datamodel_process = @ccall libexos_api.exos_datamodel_process(stringandarray::Ref{julia_exos_datamodel_handle})::Cint
datamodel_process_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_process)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_process\t\t-> ERROR_CODE: $datamodel_process: $datamodel_process_string")

#=
 * Get the current AR NETTIME (synchronized)
 * 
 * This function returns the current AR NETTIME (extrapolated in Linux)
=#
datamodel_get_nettime = @ccall libexos_api.exos_datamodel_get_nettime(stringandarray::Ref{julia_exos_datamodel_handle})::Int32
println("datamodel_get_nettime\t\t-> AR NETTIME: $datamodel_get_nettime")

#=
 * Initialize a dataset handle and attach it to a datamodel
 * 
 * This function initializes the `exos_dataset_handle_t` structure, meaning it zeroes all members and sets artefact, data and size members.

dataset_init = @ccall libexos_api.exos_dataset_init(myint1::Ref{julia_exos_dataset_handle}, stringandarray::Ref{julia_exos_datamodel_handle}, "BROWSE_NAME"::Cstring, ptr_data::Ptr{Cvoid}, sizeof(data.MyInt1)::Csize_t)::Cint
dataset_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_init)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_init\t\t\t-> ERROR_CODE: $dataset_init_string")
=#
#=
 * Initialize a dataset handle and attach it to a datamodel
 * 
 * This function initializes the `exos_dataset_handle_t` structure, meaning it zeroes all members and sets artefact, data and size members.

dataset_init = @ccall libexos_api.exos_dataset_init(myint3::Ref{julia_exos_dataset_handle}, stringandarray::Ref{julia_exos_datamodel_handle}, "BROWSE_NAME"::Cstring, ptr_data::Ptr{Cvoid}, sizeof(data.MyInt1)::Csize_t)::Cint
dataset_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_init)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_init\t\t\t-> ERROR_CODE: $dataset_init_string")
=#
#=
 * Connect a dataset to the Dataset Message Router and register an event callback
=#

dataset_connect = @ccall libexos_api.exos_dataset_connect(myint1::Ref{julia_exos_dataset_handle}, type::EXOS_DATASET_TYPE, datamodel_event_callback::Ptr{Cvoid})::Cint
dataset_connect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_connect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_connect\t\t\t-> ERROR_CODE: $dataset_connect: $dataset_connect_string")

dataset_connect = @ccall libexos_api.exos_dataset_connect(myint3::Ref{julia_exos_dataset_handle}, type::EXOS_DATASET_TYPE, datamodel_event_callback::Ptr{Cvoid})::Cint
dataset_connect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_connect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_connect\t\t\t-> ERROR_CODE: $dataset_connect: $dataset_connect_string")

#=
dataset_publish = @ccall libexos_api.exos_dataset_publish(myint1::Ref{julia_exos_dataset_handle})::Cint
dataset_publish_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_publish)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_publish\t\t\t-> ERROR_CODE: $dataset_publish_string")
=#

#=
 * Disconnect a dataset from the Dataset Message Router
 * 
 * This will disconnect the datasetEvent from the dataset (after receiving an `EXOS_STATE_DISCONNECTED` event), and no values can be published using this dataset. 
 * This function should be called in case the datamodel should stay connected, but the individual dataset should be disconnected
 =#
dataset_disconnect = @ccall libexos_api.exos_dataset_disconnect(myint1::Ref{julia_exos_dataset_handle})::Cint
dataset_disconnect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_disconnect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_disconnect\t\t-> ERROR_CODE: $dataset_disconnect: $dataset_disconnect_string")

#=
 * Release all resources from a dataset (and disconnect from the Dataset Message Router)
 * 
 * Delete (and disconnect) a dataset and free up all allocated resources.
 * If the dataset is connected, it will be disconnected before being deleted.
=#
dataset_delete = @ccall libexos_api.exos_dataset_delete(myint1::Ref{julia_exos_dataset_handle})::Cint
dataset_delete_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_delete)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_delete\t\t\t-> ERROR_CODE: $dataset_delete: $dataset_delete_string")
println("----------------------------------------------------------------\n")
