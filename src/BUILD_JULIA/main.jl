# main.jl

include("my_module.jl")

# Use the module and its functions/structures
using .MyModule

a = MyStruct(5, 10)
result = add_numbers(a.x, a.y)

println("Result: $result")