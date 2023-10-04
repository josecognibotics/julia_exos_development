const libexos_api_test = "/home/user/exOS-ComponentExtension/JULIA_PK4/stringandarray/src/libexos_test.so"
#gcc -shared -o libexos_test.so test_exos.c -I/home/user/exOS-ComponentExtension/JULIA_PK4/stringandarray/src/ -lexos-api -L/usr/lib/libexos-api.so
println(@ccall libexos_api_test.addNumbers(2::Cint, 2::Cint)::Cint)
