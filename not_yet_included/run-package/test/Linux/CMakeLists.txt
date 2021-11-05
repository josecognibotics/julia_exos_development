cmake_minimum_required(VERSION 3.0)

project(types1 C)

# set(CMAKE_BUILD_TYPE RelWithDebInfo)
set(CMAKE_BUILD_TYPE Debug)

add_executable(types1 termination.c)
target_include_directories(types1 PUBLIC ..)

install(TARGETS types1 RUNTIME DESTINATION /home/user)

set(CPACK_GENERATOR "DEB")
set(CPACK_PACKAGE_NAME exos-comp-types1)
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "types1 summary")
set(CPACK_PACKAGE_DESCRIPTION "Some description")
set(CPACK_PACKAGE_VENDOR "Your Organization")

set(CPACK_PACKAGE_VERSION_MAJOR 1)
set(CPACK_PACKAGE_VERSION_MINOR 0)
set(CPACK_PACKAGE_VERSION_PATCH 0)
set(CPACK_PACKAGE_FILE_NAME exos-comp-types1-${CPACK_PACKAGE_VERSION_MAJOR}.${CPACK_PACKAGE_VERSION_MINOR}.${CPACK_PACKAGE_VERSION_PATCH})
set(CPACK_DEBIAN_PACKAGE_MAINTAINER "your name")

set(CPACK_DEBIAN_PACKAGE_SHLIBDEPS ON)

include(CPack)

