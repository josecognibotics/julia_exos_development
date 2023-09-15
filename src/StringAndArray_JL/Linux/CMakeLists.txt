cmake_minimum_required(VERSION 3.0)

project(stringandarray)

set(CMAKE_BUILD_TYPE Debug)
find_package(julia)

include_directories(${/home/user/julia-1.6.7/bin})
include_directories(${CMAKE_CURRENT_SOURCE_DIR})


# Add a custom target to build the Julia files
add_custom_target(julia_target
    COMMAND julia ${JULIA_SOURCE_FILES}
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Building Julia files"
)

add_dependencies(julia_target stringandarray)

install(CODE "execute_process(COMMAND julia ${CMAKE_SOURCE_DIR}/main_exos.jl)")

set(CPACK_GENERATOR "DEB")
set(CPACK_PACKAGE_NAME exos-comp-stringandarray)
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "StringAndArray summary")
set(CPACK_PACKAGE_DESCRIPTION "Some description")
set(CPACK_PACKAGE_VENDOR "Your Company")
set(CPACK_PACKAGE_VERSION_MAJOR 1)
set(CPACK_PACKAGE_VERSION_MINOR 0)
set(CPACK_PACKAGE_VERSION_PATCH 0)
set(CPACK_PACKAGE_FILE_NAME exos-comp-stringandarray_1.0.0_amd64)
set(CPACK_DEBIAN_PACKAGE_MAINTAINER "Your Name")
set(CPACK_DEBIAN_PACKAGE_SHLIBDEPS ON)

include(CPack)
