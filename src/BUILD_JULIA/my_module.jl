# my_module.jl

module MyModule
    export MyStruct, add_numbers

    # Define a simple structure
    struct MyStruct
        x::Int
        y::Int
    end

    # Define a function that adds two numbers
    function add_numbers(a::Int, b::Int)
        return a + b
    end
end