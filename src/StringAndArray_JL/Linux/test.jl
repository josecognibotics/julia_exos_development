
EXOS_ARRAY_DEPTH = 7
mutable struct julia_exos_dataset_info
	name::Cstring
	adr::Ptr{Cvoid}
	size::Csize_t
	offset::Clong
	arrayItems::NTuple{EXOS_ARRAY_DEPTH, Cuint}
end

mutable struct StringAndArray
    MyInt1::Cuint #PUB
    MyInt3::Cuint #PUB SUB
end

data = StringAndArray(
    5,
    56
)

empty_string = Base.unsafe_convert(Cstring, "")::Cstring


size = Csize_t(0)
offset = Clong(0)

function julia_exos_dataset_info(name::Cstring, adr::Ptr{Cvoid}, size::Csize_t, offset::Clong) 
	return  julia_exos_dataset_info(name, adr, size, offset, ntuple(x->Cuint(0), EXOS_ARRAY_DEPTH))	
end

dataset = [julia_exos_dataset_info(empty_string, C_NULL, size, offset),
julia_exos_dataset_info(empty_string, C_NULL, size, offset)]