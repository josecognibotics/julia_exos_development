mutable struct MyStruct
    field1::Int
    field2::Float64
end

# Create an instance of MyStruct
my_instance = MyStruct(42, 3.14)

# Get the address of the structure
address = pointer(my_instance)

# Print the address
println("Address of MyStruct instance: ", address)