let
    my_struct = Ref{Int}(101)
    p = Base.unsafe_convert(Ptr{Int}, my_struct)
    GC.@preserve my_struct unsafe_load(p)
end

mutable struct MyStruct
    a::Ref{Cint}
    b::Ref{NTuple{5, Cuchar}}
end

my_struct = Ref{MyStruct}(MyStruct(Cint(0), ntuple(my_struct->2*my_struct, 5)))
#my_struct_set = Ref{MyStruct}(MyStruct(Cint(0), ntuple(my_struct->2*my_struct, 5)))

#my_struct = Ref{MyStruct}(my_struct)
println(my_struct[].a)
println(my_struct[].b)
println("---------------------------------")
println(my_struct[])
ptr_struct = Base.unsafe_convert(Ptr{MyStruct}, my_struct)::Ptr{MyStruct}
ptr_a = Base.unsafe_convert(Ptr{Cint}, my_struct[].a)::Ptr{Cint}
ptr_b = Base.unsafe_convert(Ptr{NTuple{5, Cuchar}}, my_struct[].b)::Ptr{NTuple{5, Cuchar}}
#ptr_b_1 = Base.unsafe_convert(Ptr{Cuchar}, my_struct[].b[][1])

println(ptr_struct)
println(ptr_a)
println(ptr_b)
new_ptr = ptr_b
println(new_ptr)
println("---------------------------------")

GC.@preserve my_struct test=unsafe_load(ptr_struct).a

dataset = MyStruct[]
push!(dataset, my_struct[])