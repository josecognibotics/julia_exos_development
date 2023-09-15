#!/bin/bash

# Build the Julia code into a shared library
cmake .
make

# Run the Julia code
julia main.jl
