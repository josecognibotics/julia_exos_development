module stringandarray_test

# Packages needed to run the file

export 
libexos_api,
EXOS_ARRAY_DEPTH,
EXOS_LOG_EXCLUDE_LIST_LEN,
EXOS_LOG_MAX_NAME_LENGTH,
EXOS_LOG_MESSAGE_LENGTH,
EXOS_LOG_FACILITY,
EXOS_LOG_LEVEL,
EXOS_LOG_TYPE,
EXOS_ERROR_CODE,
EXOS_CONNECTION_STATE,
EXOS_DATAMODEL_EVENT_TYPE,
EXOS_DATAMODEL_PROCESS_MODE,
EXOS_DATASET_EVENT_TYPE,
EXOS_DATASET_TYPE,
julia_exos_log_private,
julia_exos_log_handle,
julia_exos_log_config_type,
julia_exos_log_config,
julia_exos_dataset_info,
julia_exos_datamodel_sync_info,
julia_exos_datamodel_private,
julia_exos_datamodel_handle,
julia_exos_buffer_info,
julia_exos_dataset_private,
julia_exos_dataset_handle

#----------------- Shared library path -----------------
const libexos_api_test = "/home/user/exOS-ComponentExtension/JULIA_PK4/stringandarray/src/libexos_test.so"

#----------------- EXOS_API CONSTANTS -----------------
const EXOS_ARRAY_DEPTH          = 10
#----------------- EXOS_LOG CONSTANTS -----------------
const EXOS_LOG_EXCLUDE_LIST_LEN = 20    # The current maximum number of modules that can be excluded (filtered at the source) using exos_log_config is 20, let us know why you would need more*/
const EXOS_LOG_MAX_NAME_LENGTH  = 35    # Object Names (used in exos_log_init) cannot preceed 35 characters as a limitation in the AR logger */
const EXOS_LOG_MESSAGE_LENGTH   = 256   # Messages cannot preceed 256 characters as a limijutation in the AR logger*/
# ------------------------- EXOS LOG DECLARATIONS: ------------------------- #

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

@enum EXOS_DATASET_EVENT_TYPE begin
	EXOS_DATASET_EVENT_CONNECTION_CHANGED
	EXOS_DATASET_EVENT_UPDATED
	EXOS_DATASET_EVENT_PUBLISHED
	EXOS_DATASET_EVENT_DELIVERED
end

@enum EXOS_DATASET_TYPE begin
	EXOS_DATASET_SUBSCRIBE = 1
	EXOS_DATASET_PUBLISH = 16
end

#=
-------------------------------------
 C type						Julia type
 unsigned char				Cuchar
 bool(_Bool in C99+)		Cuchar
 int, BOOL (C, typical)		Cint
 unsigned int				Cuint
 void						Cvoid
 void*						Ptr{Cvoid}
 char*						Cstring if null-terminated, or Ptr{UInt8} if not
 long 						Clong
 size_t						Csize_t
-------------------------------------
=#
# -----------------------------LOGS STRUCTURES, ENUMS & FUNCTIONS DECLARATIONS ----------------------------- #

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
	_reserved_bool::NTuple{4, Cuchar} 
	_reserved_uint32::NTuple{4, Cint}
	_reserved::NTuple{4, Ptr{Cvoid}}
	_private::Ptr{julia_exos_log_private}
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
	_reserved_int32::NTuple{4,Cint}
	_reserved_bool::NTuple{4, Cuchar}
	exclude::NTuple{EXOS_LOG_EXCLUDE_LIST_LEN, NTuple{EXOS_LOG_MAX_NAME_LENGTH + 1, Cchar}}
end

# -----------------------------STRUCTURES, ENUMS & FUNCTIONS DECLARATIONS ----------------------------- #
mutable struct julia_exos_dataset_info
	name::Cstring
	adr::Ptr{Cvoid}
	size::Csize_t
	offset::Clong
	arrayItems::NTuple{EXOS_ARRAY_DEPTH, Cuint}
end

mutable struct julia_exos_datamodel_sync_info
	in_sync::Cuchar
	_reserved_bool::NTuple{8, Cuchar}
	missed_dmr_cycles::Cuint
	missed_ar_cycles::Cuint
	process_mode::EXOS_DATAMODEL_PROCESS_MODE
	_reserved_uint32::NTuple{7, Cuint}
end

mutable struct julia_exos_datamodel_private
	_magic::Cuint
	_artefact::Ptr{Cvoid}
	_reserved::Ref{NTuple{8, Ptr{Cvoid}}}
end

mutable struct julia_exos_datamodel_handle
	name::Cstring
	connection_state::EXOS_CONNECTION_STATE
	error::EXOS_ERROR_CODE
	user_context::Ptr{Cvoid}
	user_tag::Clong
	user_alias::Cstring
	datamodel_event_callback::Ptr{Cvoid}
	sync_info::Ptr{julia_exos_datamodel_sync_info}
	_reserved_bool::NTuple{8, Cuchar}
	_reserved_uint32::NTuple{8, Cuint}
	_reserved_void::NTuple{8, Ptr{Cvoid}}
	_private::Ptr{julia_exos_datamodel_private}
end

mutable struct julia_exos_buffer_info
	size::Cuint
	free::Cuint
	used::Cuint
end

mutable struct julia_exos_dataset_private
	_magic::Cuint
	_value::Ptr{Cvoid}
	_reserved::NTuple{8, Ptr{Cvoid}}
end

mutable struct julia_exos_dataset_handle
	name::Cstring
	type::Cint
	datamodel::Ptr{julia_exos_datamodel_handle}
	data::Ptr{Cvoid}
	size::Csize_t
	error::EXOS_ERROR_CODE
	connection_state::EXOS_CONNECTION_STATE
	send_buffer::Ptr{julia_exos_buffer_info}
	nettime::Cint
	user_tag::Cint
	user_context::Ptr{Cvoid}
	dataset_event_callback::Ptr{Cvoid}
	_reserved_bool::NTuple{8,Cuchar}
	_reserved_uint32::NTuple{8,Cuint}
	_reserved_void::NTuple{8, Ptr{Cvoid}}
	_private::Ptr{julia_exos_dataset_private}
 end

 # Define INFO, SUCCESS, and ERROR functions as needed.
INFO(msg::String) = println("INFO: $msg")
SUCCESS(msg::String) = println("SUCCESS: $msg")
ERROR(msg::String) = println("ERROR: $msg")

include("TEST_app_declaration.jl")
include("TEST_print_functions.jl")

include("TEST_app_main.jl")

end # module
