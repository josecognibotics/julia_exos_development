mutable struct StringAndArray
    MyInt1::Ref{Cuint} #SUB
    MyInt2::Ref{NTuple{5, Ref{Cuchar}}}#PUB SUB
end

my_test = StringAndArray(Cuint(0), ntuple(x-> Cuchar(2*x), 5))                    
println(my_test)
ptr_MyInt2 = pointer_from_objref(my_test.MyInt2)
myint2 = unsafe_pointer_to_objref(ptr_MyInt2)
println(myint2)

ptr_MyInt2_1 = pointer_from_objref(my_test.MyInt2[][1])
ptr_MyInt2_2 = pointer_from_objref(my_test.MyInt2[][2])
ptr_MyInt2_3 = pointer_from_objref(my_test.MyInt2[][3])
ptr_MyInt2_4 = pointer_from_objref(my_test.MyInt2[][4])
ptr_MyInt2_5 = pointer_from_objref(my_test.MyInt2[][5])

myint2_1 = unsafe_pointer_to_objref(ptr_MyInt2_1)
println(myint2_1)

println("Pointer   MyInt2: ", ptr_MyInt2)
println("Pointer MyInt2_1: ", ptr_MyInt2_1)
println("Pointer MyInt2_2: ", ptr_MyInt2_2)
println("Pointer MyInt2_3: ", ptr_MyInt2_3)
println("Pointer MyInt2_4: ", ptr_MyInt2_4)
println("Pointer MyInt2_5: ", ptr_MyInt2_5)

println(ptr_MyInt2_5-ptr_MyInt2_4)
println(ptr_MyInt2_4-ptr_MyInt2_3)
println(ptr_MyInt2_3-ptr_MyInt2_2)
println(ptr_MyInt2_2-ptr_MyInt2_1)
println(ptr_MyInt2-ptr_MyInt2_1)
println("-----------------------------")
println(my_test)
println(sizeof(my_test))
println(sizeof(my_test.MyInt1))
println(my_test.MyInt2[][])
