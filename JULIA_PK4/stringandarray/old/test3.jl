x = [1, 2, 3]

GC.@preserve x begin
    # Access and use x here
    println("Inside GC.@preserve block:")
    println(x[1])  # Prints 1
end

# Attempt to access x again outside the GC.@preserve block
println("\nOutside GC.@preserve block:")
println(x[2])  # Prints 2