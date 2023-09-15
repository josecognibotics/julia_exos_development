# CMakeLists.txt

cmake_minimum_required(VERSION 3.12)
project(JuliaCIntegration)

# Set the path to the Julia executable (replace with your Julia executable path)
set(JULIA_EXECUTABLE /home/user/julia-1.6.7/bin/julia)

# Create a shared library from the Julia module
add_custom_command(
    OUTPUT my_module.so
    COMMAND ${JULIA_EXECUTABLE} --startup-file=no --project=${CMAKE_SOURCE_DIR} -e "using Pkg; Pkg.instantiate(); include(\"my_module.jl\"); using MyModule; ccall((:jl_compile, Julia.Library), Cvoid, (Cstring,), \"my_module.jl\")"
    DEPENDS my_module.jl
)

# Add the Julia include directory
include_directories(${JULIA_HOME}/include/julia)

# Create an executable that uses the Julia module
add_executable(julia_app main.c)
add_dependencies(julia_app my_module.so)
target_link_libraries(julia_app PRIVATE ${CMAKE_BINARY_DIR}/my_module.so)
