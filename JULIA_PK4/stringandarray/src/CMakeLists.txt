#DONT USE THE CMAKE LIST, USE THIS COMMAND INSTEAD
## gcc -shared -o libexos_test.so test_exos.c -I/home/user/exOS-ComponentExtension/JULIA_PK4/stringandarray/src/ -lexos-api -L/usr/lib/libexos-api.so



# cmake_minimum_required(VERSION 3.10)

# project(MyLibrary)

# # Add existing .so file
# find_library(EXOS_API_LIBRARY libexos-api.so PATHS /usr/lib/libexos-api REQUIRED)

# if(NOT EXOS_API_LIBRARY)
#     message(FATAL_ERROR "libexos-api.so library not found")
# else()
#     message("libexos-api.so library found: ${EXOS_API_LIBRARY}")
# endif()

# # Add your additional .c and .h files
# add_library(libexos_test SHARED
#     test_exos.c
#     test_exos.h
# )

# # Link the existing .so file with your additional files
# target_link_libraries(libexos_test ${EXOS_API_LIBRARY})

# # Set the output directory for the shared library
# set_target_properties(libexos_test PROPERTIES LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/output_directory)
