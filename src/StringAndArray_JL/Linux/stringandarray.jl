module exos_stringandarray

using StaticArrays

const libexos_api = "/usr/lib/libexos-api.so"
const EXOS_ARRAY_DEPTH          = 10
const EXOS_LOG_EXCLUDE_LIST_LEN = 20
const EXOS_LOG_MAX_NAME_LENGTH  = 35
const EXOS_LOG_MESSAGE_LENGTH   = 256
config_stringandarray = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"dataType\":\"StringAndArray\",\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt1\",\"dataType\":\"UDINT\",\"comment\":\"PUB\",\"info\":\"<infoId1>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt3\",\"dataType\":\"USINT\",\"comment\":\"PUB SUB\",\"arraySize\":5,\"info\":\"<infoId2>\",\"info2\":\"<infoId3>\"}}]}"

export
	MyInt1,
	MyString,
	MyInt2,
	MyIntStruct,
	MyIntStruct1,
	MyIntStruct2

	struct IntStruct2_typ
		MyInt23::Cuint
		MyInt24::MVector{4, UInt8}
		MyInt25::Cuint
	end

	struct IntStruct1_typ
		MyInt13::Cuint
	end

	struct IntStruct_typ
		MyInt13::Cuint
		MyInt14::MVector{3, UInt8}
		MyInt133::Cuint
		MyInt124::MVector{3, UInt8}
	end

	mutable struct StringAndArray
		MyInt1::Cuint #PUB
		MyInt3::Cuint #PUB SUB
		#MyString::MVector{3, String} #PUB
		#MyInt2::MVector{5, UInt8} #PUB SUB
		#MyIntStruct::MVector{6, IntStruct_typ} #PUB SUB
		#MyIntStruct1::IntStruct1_typ #PUB SUB
		#MyIntStruct2::IntStruct2_typ #PUB SUB
	end


# ------------------------------------ EXOS LOG: ------------------------------------ #

@enum EXOS_LOG_FACILITY begin
	EXOS_LOG_FACILITY_AR = 0
	EXOS_LOG_FACILITY_GPOS = 1
end

@enum EXOS_LOG_LEVEL begin
	EXOS_LOG_LEVEL_ERROR
	EXOS_LOG_LEVEL_WARNING
	EXOS_LOG_LEVEL_SUCCESS
	EXOS_LOG_LEVEL_INFO
	EXOS_LOG_LEVEL_DEBUG
end

@enum EXOS_LOG_TYPE begin
	EXOS_LOG_TYPE_ALWAYS = 0
	EXOS_LOG_TYPE_USER = 1
	EXOS_LOG_TYPE_SYSTEM = 2
	EXOS_LOG_TYPE_VERBOSE = 4
end

mutable struct julia_exos_log_private
	_magic::Cuint
	_log::Ptr{Cvoid}
	_reserved::NTuple{4, Ptr{Cvoid}}
end

mutable struct julia_exos_log_handle
	name::Cstring
	ready::Cuchar
	excluded::Cuchar 
	console::Cuchar
	config_change_cb::Ptr{Cvoid}
	config_change_user_context::Ptr{Cvoid}
	_reserved_bool::NTuple{4,Cuchar} 
	_reserved_uint32::NTuple{4,Cuint}
	_reserved::NTuple{4,Cuint}
	_private::julia_exos_log_private
end
mutable struct julia_exos_log_config_type
	user::Bool
	system::Bool
	verbose::Bool
	_reserved_bool::NTuple{8,Cuchar}
end

# -----------------------------STRUCTURES, ENUMS & FUNCTIONS DECLARATIONS ----------------------------- #

mutable struct julia_exos_dataset_info
	name::Cstring
	adr::Ptr{Cvoid}
	size::Csize_t
	offset::Clong
	arrayItems::NTuple{EXOS_ARRAY_DEPTH, Cuint}
end

@enum EXOS_ERROR_CODE begin
	EXOS_ERROR_OK = 0
	EXOS_ERROR_NOT_IMPLEMENTED = 5000
	EXOS_ERROR_PARAMETER_NULL
	EXOS_ERROR_BAD_DATAMODEL_HANDLE
	EXOS_ERROR_BAD_DATASET_HANDLE
	EXOS_ERROR_BAD_LOG_HANDLE
	EXOS_ERROR_BAD_SYNC_HANDLE
	EXOS_ERROR_NOT_ALLOWED
	EXOS_ERROR_NOT_FOUND
	EXOS_ERROR_STRING_FORMAT
	EXOS_ERROR_MESSAGE_FORMAT
	EXOS_ERROR_NO_DATA
	EXOS_ERROR_BUFFER_OVERFLOW
	EXOS_ERROR_TIMEOUT
	EXOS_ERROR_BAD_DATASET_SIZE
	EXOS_ERROR_USER
	EXOS_ERROR_SYSTEM
	EXOS_ERROR_SYSTEM_SOCKET
	EXOS_ERROR_SYSTEM_SOCKET_USAGE
	EXOS_ERROR_SYSTEM_MALLOC
	EXOS_ERROR_SYSTEM_LXI
	EXOS_ERROR_DMR_NOT_READY
	EXOS_ERROR_DMR_SHUTDOWN
	EXOS_ERROR_BAD_STATE
end

@enum EXOS_CONNECTION_STATE begin
	EXOS_STATE_DISCONNECTED
	EXOS_STATE_CONNECTED
	EXOS_STATE_OPERATIONAL
	EXOS_STATE_ABORTED
end

@enum EXOS_DATAMODEL_EVENT_TYPE begin
	EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED
	EXOS_DATAMODEL_EVENT_SYNC_STATE_CHANGED
end

@enum EXOS_DATAMODEL_PROCESS_MODE begin
	EXOS_DATAMODEL_PROCESS_BLOCKING
	EXOS_DATAMODEL_PROCESS_NON_BLOCKING
end

mutable struct julia_exos_datamodel_sync_info
	in_sync::Cuchar
	_reserved_bool::NTuple{8,Cuchar}
	missed_dmr_cycles::Cuint
	missed_ar_cycles::Cuint
	process::EXOS_DATAMODEL_PROCESS_MODE
	_reserved_uint32::NTuple{7,Cuint}
end

mutable struct julia_exos_datamodel_private
	_magic::Cuint
	_artefact::Ptr{Cvoid}
	_reserved::NTuple{8, Ptr{Cvoid}}
end

mutable struct julia_exos_datamodel_handle
	name::Cstring
	connection_state::EXOS_CONNECTION_STATE
	error::EXOS_ERROR_CODE
	user_context::Ptr{Cvoid}
	user_tag::Clong
	user_alias::Cstring
	datamodel_event_callback::Ptr{Cvoid}
	sync_info::julia_exos_datamodel_sync_info
	_reserved_bool::NTuple{8,Cuchar}
	_reserved_uint32::NTuple{8,Cuint}
	_reserved_void::NTuple{8, Ptr{Cvoid}}
	_private::julia_exos_datamodel_private
end

# JULIA callback function
function my_callback(datamodel::julia_exos_datamodel_handle, event_type::EXOS_DATAMODEL_EVENT_TYPE, info::Ptr{Cvoid})
    println("\nI am a very nice callback function, you are calling me\n")
end

@enum EXOS_DATASET_EVENT_TYPE begin
	EXOS_DATASET_EVENT_CONNECTION_CHANGED
	EXOS_DATASET_EVENT_UPDATED
	EXOS_DATASET_EVENT_PUBLISHED
	EXOS_DATASET_EVENT_DELIVERED
	#EXOS_DATASET_RECIEVED
end

mutable struct julia_exos_buffer_info
	size::Cuint
	free::Cuint
	used::Cuint
end

@enum EXOS_DATASET_TYPE begin
	EXOS_DATASET_SUBSCRIBE = 1
	EXOS_DATASET_PUBLISH = 16
end

mutable struct julia_exos_dataset_private
	_magic::Cuint
	_value::Ptr{Cvoid}
	_reserved::NTuple{8, Ptr{Cvoid}}
end

mutable struct julia_exos_dataset_handle
	name::Cstring
	type::EXOS_DATASET_TYPE
	datamodel::julia_exos_datamodel_handle
	data::Ptr{Cvoid}
	size::Csize_t
	error::EXOS_ERROR_CODE
	connection_state::EXOS_CONNECTION_STATE
	send_buffer::julia_exos_buffer_info
	nettime::Int32
	user_tag::Int32
	user_context::Ptr{Cvoid}
	dataset_event_callback::Ptr{Cvoid}
	_reserved_bool::NTuple{8,Cuchar}
	_reserved_uint32::NTuple{8,Cuint}
	_reserved_void::NTuple{8, Ptr{Cvoid}}
	_private::julia_exos_dataset_private
 end

# ------------------------------------ INITIALIZATIONS: ------------------------------------ #


# Test to use CString convertion for strings in functions call
datamodel_instance_name = Base.unsafe_convert(Cstring,"StringAndArray_0")::Cstring
user_alias = Base.unsafe_convert(Cstring, "gStringAndArray_0")::Cstring
empty_string = Base.unsafe_convert(Cstring, "")::Cstring
config_Cstring = Base.unsafe_convert(Cstring, config_stringandarray)::Cstring
stringAndArray_Cstring = Base.unsafe_convert(Cstring, "stringandarray")::Cstring

MyInt1_Cstring = Base.unsafe_convert(Cstring, "MyInt1")::Cstring
MyInt3_Cstring = Base.unsafe_convert(Cstring, "MyInt3")::Cstring

#Initialise @enums to be used in the functions call
state = EXOS_CONNECTION_STATE(1)
err = EXOS_ERROR_CODE(0)
type = EXOS_DATASET_TYPE(1)
event = EXOS_DATAMODEL_EVENT_TYPE(0)
inf = C_NULL
process_mode = EXOS_DATAMODEL_PROCESS_MODE(1)
event_type = EXOS_DATAMODEL_EVENT_TYPE(0)

# Callback function
my_c_callback = @cfunction(my_callback, Cvoid, (julia_exos_datamodel_handle, EXOS_DATAMODEL_EVENT_TYPE, Ptr{Cvoid} ))

#Log callback
my_c_log = @cfucntion(my_callback, Cvoid, (julia_exos_log_handle, EXOS_DATAMODEL_EVENT_TYPE, Ptr{Cvoid} ) )
# INITIALIZATION: julia_exos_log_private #
log_private = julia_exos_log_private(
	0,
	C_NULL,
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL))
)
# INITIALIZATION: julia_exos_log_config_type #
log_config_type = julia_exos_log_config_type(
	0,
	0,
	0,
	(Cuchar(0),Cuchar(0),Cuchar(0) ,Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0) ,Cuchar(0))
)
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
	3
)
ptr_data = pointer_from_objref(data)

# INITIALIZATION: julia_exos_datamodel_handle #
stringandarray = julia_exos_datamodel_handle(
	empty_string,
	state,
	err,
	C_NULL,
	0,
	empty_string,
	my_c_callback,
	datamodel_sync_info,
	(Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0)),
	(Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	datamodel_private
)

exos_log_init = julia_exos_log_handle(
	empty_string,
	0,
	0,
	0,
	my_c_callback,
	C_NULL,
	(Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0)),
	(Cuint(0),Cuint(0),Cuint(0),Cuint(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	log_private
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
	my_c_callback,
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
	my_c_callback,
	(Bool(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0),Cuchar(0)),
	(Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0),Cuint(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	dataset_private
)

println(" SUCCESS(\"starting StringAndArray application..\")\n")

# ------------------------------------ Julia FUNCTIONS: ------------------------------------ #
println("Test for printing back strings")
println("----------------------------------------------------------------")
# Returns a string when passing an ERROR CODE
get_error_string = @ccall libexos_api.exos_get_error_string(err::EXOS_ERROR_CODE)::Ptr{Cchar}
@show unsafe_string(get_error_string)

# Returns a string when passing an ERROR CODE
get_state_string = @ccall libexos_api.exos_get_state_string(state::EXOS_CONNECTION_STATE)::Ptr{Cchar}
@show unsafe_string(get_state_string)
println("----------------------------------------------------------------\n")

println("Starting communication with AS...\n")
println("----------------------------------------------------------------\n")

exos_log_init = @ccall libexos_api.exos_log_init(stringandarray::Ref{julia_exos_log_handle}, "StringAndArray_0"::Cstring)::Cint

#log_init = @ccall libexos_api.exos_
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

function julia_exos_dataset_info(name::Cstring, adr::Ptr{Cvoid}, size::Csize_t, offset::Clong) 
	return  julia_exos_dataset_info(name, adr, size, offset, ntuple(x->Cuint(0), EXOS_ARRAY_DEPTH))	
end

size = Csize_t(0)
offset = Clong(0)
myInt1_cstring = Base.unsafe_convert(Cstring, "MyInt1")::Cstring
myInt2_cstring = Base.unsafe_convert(Cstring, "MyInt2")::Cstring

datasets = [julia_exos_dataset_info(myInt1_cstring, ptr_data, size, offset), julia_exos_dataset_info(myInt2_cstring, ptr_data, size, offset)]
	
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
datamodel_connect = @ccall libexos_api.exos_datamodel_connect(stringandarray::Ref{julia_exos_datamodel_handle}, config_stringandarray::Cstring, datasets::Ref{julia_exos_dataset_info}, sizeof(datasets)::Csize_t, my_c_callback::Ptr{Cvoid})::Cint
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

dataset_connect = @ccall libexos_api.exos_dataset_connect(myint1::Ref{julia_exos_dataset_handle}, type::EXOS_DATASET_TYPE, my_c_callback::Ptr{Cvoid})::Cint
dataset_connect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_connect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_connect\t\t\t-> ERROR_CODE: $dataset_connect: $dataset_connect_string")

dataset_connect = @ccall libexos_api.exos_dataset_connect(myint3::Ref{julia_exos_dataset_handle}, type::EXOS_DATASET_TYPE, my_c_callback::Ptr{Cvoid})::Cint
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

end
