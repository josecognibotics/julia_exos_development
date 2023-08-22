# Define your structure
mutable struct MyStruct
    x::Int
    y::Float64
end

# Create an instance of your structure
my_instance = MyStruct(10, 3.14)

# Get a pointer to the instance using pointer_from_objref
ptr = pointer_from_objref(my_instance)
println(ptr)

# Calculate the offset to the desired field
offset_x = fieldoffset(MyStruct, 1)

# Use unsafe_load to access the field through the pointer
x_value = unsafe_load(Ptr{Int}(ptr + offset_x))

println("Value of x:", x_value)