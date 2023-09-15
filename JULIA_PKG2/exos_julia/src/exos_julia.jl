module exos_julia

using StaticArrays
using Test

using JSON

export libexos_api,
EXOS_ARRAY_DEPTH,
EXOS_LOG_EXCLUDE_LIST_LEN,
EXOS_LOG_MAX_NAME_LENGTH,
EXOS_LOG_MESSAGE_LENGTH,
empty_string,
EXOS_LOG_FACILITY,
EXOS_LOG_LEVEL,
EXOS_LOG_TYPE,
julia_exos_log_private,
julia_exos_log_handle,
julia_exos_log_config_type,
julia_exos_dataset_info,
EXOS_ERROR_CODE,
EXOS_CONNECTION_STATE,
EXOS_DATAMODEL_EVENT_TYPE,
EXOS_DATAMODEL_PROCESS_MODE,
julia_exos_datamodel_sync_info,
julia_exos_datamodel_private,
julia_exos_datamodel_handle,
exos_datamodel_event_cb,
EXOS_DATASET_EVENT_TYPE,
julia_exos_buffer_info,
EXOS_DATASET_TYPE,
julia_exos_dataset_private,
julia_exos_dataset_handle,
datamodel_event_callback,
julia_exos_dataset_info

function greet()
	return "Hello World"
end

const libexos_api = "/usr/lib/libexos-api.so"
#const libexos_api = "//wsl.localhost/Debian/usr/lib"

#----------------- EXOS_API CONSTANTS -----------------
const EXOS_ARRAY_DEPTH          = 10

#----------------- EXOS_LOG CONSTANTS -----------------
const EXOS_LOG_EXCLUDE_LIST_LEN = 20    # The current maximum number of modules that can be excluded (filtered at the source) using exos_log_config is 20, let us know why you would need more*/
const EXOS_LOG_MAX_NAME_LENGTH  = 35   # Object Names (used in exos_log_init) cannot preceed 35 characters as a limitation in the AR logger */
const EXOS_LOG_MESSAGE_LENGTH   = 256   # Messages cannot preceed 256 characters as a limitation in the AR logger*/


empty_string = Base.unsafe_convert(Cstring, "")::Cstring

# ------------------------------------ EXOS LOG: ------------------------------------ #

@enum EXOS_LOG_FACILITY begin
	EXOS_LOG_FACILITY_AR   = 0
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
	EXOS_LOG_TYPE_ALWAYS  = 0
	EXOS_LOG_TYPE_USER    = 1
	EXOS_LOG_TYPE_SYSTEM  = 2
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
	_reserved::NTuple{4, Ptr{Cvoid}}
	_private::julia_exos_log_private
end

mutable struct julia_exos_log_config_type
	user::Cuchar
	system::Cuchar
	verbose::Cuchar
	_reserved_bool::NTuple{8, Cuchar}
end

mutable struct julia_exos_log_config
	level::EXOS_LOG_LEVEL
	type::julia_exos_log_config_type
	_reserved_int32::NTuple{4,Cuint}
	_reserved_bool::NTuple{4, Cuchar}
    exclude::NTuple{EXOS_LOG_EXCLUDE_LIST_LEN, Cchar}

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
function exos_datamodel_event_cb(datamodel::julia_exos_datamodel_handle, event_type::EXOS_DATAMODEL_EVENT_TYPE, info::Ptr{Cvoid})
	println("\nI am a very nice datamodel callback function, you are calling me\n")

	#println(event_type)
	#println(info)
	#println(unsafe_string(datamodel.name))
	
    #println(datamodel.connection_state)
	
	#println(datamodel.error)
    #println(datamodel.user_context)
    #println(datamodel.user_tag)
    #println(datamodel.user_alias)
    #println(datamodel.datamodel_event_callback)
    #println(datamodel.sync_info)
    #println(datamodel._reserved_bool)
    #println(datamodel._reserved_uint32)
    #println(datamodel._reserved_void)
    #println(datamodel._private)
	println("")
	
end

function exos_config_change_cb(log::julia_exos_log_handle, new_config::julia_exos_log_config, user_context::Ptr{Cvoid})
    println("\nI am a very nice log callback function, you are calling me\n")
end

function julia_exos_log_config(level::EXOS_LOG_LEVEL, type::julia_exos_log_config_type, _reserved_int32::NTuple{4,Cuint}, _reserved_bool::NTuple{4, Cuchar})
    return julia_exos_log_config(level, type, _reserved_int32, _reserved_bool, ntuple(x->Cchar(0), EXOS_LOG_EXCLUDE_LIST_LEN))
end

function julia_exos_dataset_info(name::Cstring, adr::Ptr{Cvoid}, size::Csize_t, offset::Clong) 
	return  julia_exos_dataset_info(name, adr, size, offset, ntuple(x->Cuint(0), EXOS_ARRAY_DEPTH))	
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

# Callback function
datamodel_event_callback = @cfunction(exos_datamodel_event_cb, Cvoid, (julia_exos_datamodel_handle, EXOS_DATAMODEL_EVENT_TYPE, Ptr{Cvoid}))

# Log function
config_change_cb = @cfunction(exos_config_change_cb, Cvoid, (julia_exos_log_handle, julia_exos_log_config, Ptr{Cvoid}))

include("application.jl")

end # module
