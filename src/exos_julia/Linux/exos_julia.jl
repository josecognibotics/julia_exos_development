module exos_exos_julia

using StaticArrays

const libexos_api = "/usr/lib/libexos-api.so"
const EXOS_ARRAY_DEPTH          = 10
const EXOS_LOG_EXCLUDE_LIST_LEN = 20
const EXOS_LOG_MAX_NAME_LENGTH  = 35
const EXOS_LOG_MESSAGE_LENGTH   = 256
const config_exos_julia = "{\"name\":\"struct\",\"attributes\":{\"name\":\"<NAME>\",\"dataType\":\"exos_julia\",\"info\":\"<infoId0>\"},\"children\":[{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt1\",\"dataType\":\"UDINT\",\"comment\":\"PUB\",\"info\":\"<infoId1>\"}},{\"name\":\"variable\",\"attributes\":{\"name\":\"MyInt3\",\"dataType\":\"USINT\",\"comment\":\"PUB SUB\",\"arraySize\":5,\"info\":\"<infoId2>\",\"info2\":\"<infoId3>\"}}]}"

export
	MyInt1,
	MyInt3

	struct exos_julia
		MyInt1::UInt32 #PUB
		MyInt3::MVector{5, UInt8} #PUB SUB
	end

function test()
	println("HELLO")
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

struct julia_exos_log_private
	_magic::UInt32
	_log::Ptr{Cvoid}
	_reserved::NTuple{4, Ptr{Cvoid}}
end

# INITIALIZATION: julia_exos_log_private #
log_private = julia_exos_log_private(
	0,
	C_NULL,
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL))
)

struct julia_exos_log_handle
	name::Ptr{Cchar} 
	ready::Bool
	excluded::Bool 
	console::Bool
	config_change_cb::Function
	config_change_user_context::Ptr{Cvoid}
	_reserved_bool::NTuple{4, Bool} 
	_reserved_uint32::NTuple{4, UInt32}
	_reserved::NTuple{4, UInt32}
	_private::julia_exos_log_private
end

# INITIALIZATION: julia_exos_log_handle #
log_handle = julia_exos_log_handle(
	C_NULL,
	0,
	0,
	0,
	test,
	C_NULL,
	(Bool(0), Bool(0), Bool(0) , Bool(0)),
	(UInt32(0), UInt32(0), UInt32(0), UInt32(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	log_private
)

struct julia_exos_log_config_type
	user::Bool
	system::Bool
	verbose::Bool
	_reserved_bool::NTuple{8, Bool}
end

# INITIALIZATION: julia_exos_log_config_type #
log_config_type = julia_exos_log_config_type(
	0,
	0,
	0,
	(Bool(0), Bool(0), Bool(0) , Bool(0), Bool(0), Bool(0), Bool(0) , Bool(0))
)

struct julia_exos_log_config
	level::Bool
	type::Bool
	_reserved_int32::Bool
	_reserved_boo::NTuple{8, Bool}
	exclude::Matrix{Cchar}
end

# ----------------------------- DECLARATIONS ----------------------------- #

struct julia_exos_dataset_info
	name::Ptr{UInt8}
	adr::Ptr{Cvoid}
	size::Csize_t
	offset::Clong
	arrayItems::NTuple{EXOS_ARRAY_DEPTH, UInt32}
end

# INITIALIZATION: julia_exos_dataset_info #
dataset_info = julia_exos_dataset_info(
	C_NULL,
	C_NULL,
	0,
	0,
	(UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0))
)
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

struct julia_exos_datamodel_sync_info
	in_sync::Bool
	_reserved_bool::NTuple{8, Bool}
	missed_dmr_cycles::UInt32
	missed_ar_cycles::UInt32
	_reserved_uint32::NTuple{7, UInt32}
end

# INITIALIZATION: julia_exos_datamodel_sync_info #
datamodel_sync_info = julia_exos_datamodel_sync_info(
	0,
	(Bool(0), Bool(0), Bool(0), Bool(0), Bool(0), Bool(0), Bool(0), Bool(0)),
	0,
	0,
	(UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0))
)

struct julia_exos_datamodel_private
	_magic::UInt32
	_artefact::Ptr{Cvoid}
	_reserved::NTuple{8, Ptr{Cvoid}}
end

# INITIALIZATION: julia_exos_datamodel_private #
datamodel_private = julia_exos_datamodel_private(
	0,
	C_NULL,
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
)

struct julia_exos_datamodel_handle
	name::Ptr{UInt8}
	connection_state::EXOS_CONNECTION_STATE
	error::EXOS_ERROR_CODE
	user_context::Ptr{Cvoid}
	user_tag::Clong
	user_alias::Ptr{Cchar}
	datamodel_event_callback::Function
	sync_info::julia_exos_datamodel_sync_info
	_reserved_bool::NTuple{8, Bool}
	_reserved_uint32::NTuple{8, UInt32}
	_reserved_void::NTuple{8, Ptr{Cvoid}}
	_private::julia_exos_datamodel_private
end

state = EXOS_CONNECTION_STATE(0)
err = EXOS_ERROR_CODE(0)

# INITIALIZATION: julia_exos_datamodel_handle #
datamodel_handle = julia_exos_datamodel_handle(
	C_NULL,
	state,
	err,
	C_NULL,
	0,
	C_NULL,
	test,
	datamodel_sync_info,
	(Bool(0), Bool(0), Bool(0), Bool(0), Bool(0), Bool(0), Bool(0), Bool(0)),
	(UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	datamodel_private
)

@enum EXOS_DATASET_EVENT_TYPE begin
	EXOS_DATASET_EVENT_CONNECTION_CHANGED
	EXOS_DATASET_EVENT_UPDATED
	EXOS_DATASET_EVENT_PUBLISHED
	EXOS_DATASET_EVENT_DELIVERED
	#EXOS_DATASET_RECIEVED
end

struct julia_exos_buffer_info
	size::UInt32
	free::UInt32
	used::UInt32
end

# INITIALIZATION: julia_exos_buffer_info #
buffer_info = julia_exos_buffer_info(
	0,
	0,
	0
)

@enum EXOS_DATASET_TYPE begin
	EXOS_DATASET_SUBSCRIBE = 1
	EXOS_DATASET_PUBLISH = 16
end

struct julia_exos_dataset_private
	_magic::UInt32
	_value::Ptr{Cvoid}
	_reserved::NTuple{8, Ptr{Cvoid}}
end

# INITIALIZATION: julia_exos_dataset_private #
dataset_private = julia_exos_dataset_private(
	0,
	C_NULL,
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
)

struct julia_exos_dataset_handle
	name::Ptr{Cchar}
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
	dataset_event_callback::Function
	_reserved_bool::NTuple{8, Bool}
	_reserved_uint32::NTuple{8, UInt32}
	_reserved_void::NTuple{8, Ptr{Cvoid}}
	_private::julia_exos_dataset_private
 end

type = EXOS_DATASET_TYPE(1)

# INITIALIZATION: julia_exos_dataset_handle #
dataset_handle = julia_exos_dataset_handle(
	C_NULL,
	type,
	datamodel_handle,
	C_NULL,
	0,
	err,
	state,
	buffer_info,
	0,
	0,
	C_NULL,
	test,
	(Bool(0), Bool(0), Bool(0), Bool(0), Bool(0), Bool(0), Bool(0), Bool(0)),
	(UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0)),
	(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),
	dataset_private
)

@enum EXOS_DATAMODEL_PROCESS_MODE begin
	EXOS_DATAMODEL_PROCESS_BLOCKING
	EXOS_DATAMODEL_PROCESS_NON_BLOCKING
end

# ------------------------------------ Julia FUNCTIONS: ------------------------------------ #

get_error_string = @ccall libexos_api.exos_get_error_string(err::EXOS_ERROR_CODE)::Ptr{Cchar}
@show unsafe_string(get_error_string)

get_state_string = @ccall libexos_api.exos_get_state_string(state::EXOS_CONNECTION_STATE)::Ptr{Cchar}
@show unsafe_string(get_state_string)

println("\n---------------- DATAMODEL FUNCTION CALLS ----------------\n")
datamodel_init = @ccall libexos_api.exos_datamodel_init(datamodel_handle::Ref{julia_exos_datamodel_handle}, C_NULL::Ref{Cchar}, C_NULL::Ref{Cchar})::Cint
datamodel_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_init)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_init\t\t\t-> ERROR_CODE: $datamodel_init_string")

datamodel_calc_dataset_info = @ccall libexos_api.exos_datamodel_calc_dataset_info(dataset_info::Ref{julia_exos_dataset_info}, 0::Csize_t)::Cint
datamodel_calc_dataset_info_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_calc_dataset_info)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_calc_dataset_info\t-> ERROR_CODE: $datamodel_calc_dataset_info_string")

datamodel_connect = @ccall libexos_api.exos_datamodel_connect(datamodel_handle::Ref{julia_exos_datamodel_handle}, C_NULL::Ref{Cchar}, dataset_info::Ref{julia_exos_dataset_info}, 0::Csize_t, test::Function)::Cint
datamodel_connect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_connect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_connect\t\t-> ERROR_CODE: $datamodel_connect_string")

datamodel_set_operational = @ccall libexos_api.exos_datamodel_set_operational(datamodel_handle::Ref{julia_exos_datamodel_handle})::Cint
datamodel_set_operational_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_set_operational)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_set_operational\t-> ERROR_CODE: $datamodel_set_operational_string")

datamodel_disconnect = @ccall libexos_api.exos_datamodel_disconnect(datamodel_handle::Ref{julia_exos_datamodel_handle})::Cint
datamodel_disconnect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_disconnect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_disconnect\t\t-> ERROR_CODE: $datamodel_disconnect_string")

datamodel_delete = @ccall libexos_api.exos_datamodel_disconnect(datamodel_handle::Ref{julia_exos_datamodel_handle})::Cint
datamodel_delete_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_delete)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_delete\t\t-> ERROR_CODE: $datamodel_delete_string")

datamodel_process = @ccall libexos_api.exos_datamodel_process(datamodel_handle::Ref{julia_exos_datamodel_handle})::Cint
datamodel_process_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_process)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("datamodel_process\t\t-> ERROR_CODE: $datamodel_process_string")

datamodel_get_nettime = @ccall libexos_api.exos_datamodel_get_nettime(datamodel_handle::Ref{julia_exos_datamodel_handle})::Int32
println("datamodel_get_nettime\t\t-> AR NETTIME: $datamodel_get_nettime")

println("\n---------------- DATASET FUNCTION CALLS ----------------\n")
dataset_init = @ccall libexos_api.exos_dataset_init(dataset_handle::Ref{julia_exos_dataset_handle}, datamodel_handle::Ref{julia_exos_datamodel_handle}, C_NULL::Ref{Cchar}, C_NULL::Ref{Cvoid}, 0::Csize_t)::Cint
dataset_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_init)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_init\t\t\t-> ERROR_CODE: $dataset_init_string")

dataset_connect = @ccall libexos_api.exos_dataset_connect(dataset_handle::Ref{julia_exos_dataset_handle}, type::EXOS_DATASET_TYPE, test::Function)::Cint
dataset_connect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_connect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_connect\t\t\t-> ERROR_CODE: $dataset_connect_string")

dataset_publish = @ccall libexos_api.exos_dataset_publish(dataset_handle::Ref{julia_exos_dataset_handle})::Cint
dataset_publish_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_publish)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_publish\t\t\t-> ERROR_CODE: $dataset_publish_string")

dataset_disconnect = @ccall libexos_api.exos_dataset_disconnect(dataset_handle::Ref{julia_exos_dataset_handle})::Cint
dataset_disconnect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_disconnect)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_disconnect\t\t-> ERROR_CODE: $dataset_disconnect_string")

dataset_delete = @ccall libexos_api.exos_dataset_disconnect(dataset_handle::Ref{julia_exos_dataset_handle})::Cint
dataset_delete_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_delete)::EXOS_ERROR_CODE)::Ptr{Cchar})
println("dataset_delete\t\t\t-> ERROR_CODE: $dataset_delete_string")
println("")
end
