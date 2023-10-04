using Test
import stringandarray

# Define a test set
@testset "CallBack Pointers" begin
    @test isa(stringandarray.datamodel_event_callback, Ptr{Cvoid})
    @test isa(stringandarray.config_change_cb, Ptr{Cvoid})
end

@testset "Structures initialisations type" begin
    @test isa(stringandarray.datamodel_private, stringandarray.julia_exos_datamodel_private)
    @test isa(stringandarray.datamodel_sync_info, stringandarray.julia_exos_datamodel_sync_info)
    @test isa(stringandarray.buffer_info, stringandarray.julia_exos_buffer_info)
    @test isa(stringandarray.dataset_private, stringandarray.julia_exos_dataset_private)
    @test isa(stringandarray.log_private, stringandarray.julia_exos_log_private)
    @test isa(stringandarray.log_handle, stringandarray.julia_exos_log_handle)
    @test isa(stringandarray.log_config_type, stringandarray.julia_exos_log_config_type)
    @test isa(stringandarray.log_config, stringandarray.julia_exos_log_config)
end

@testset "Test main initialisations" begin
    @test isa(stringandarray.data, stringandarray.StringAndArray)
    @test isa(stringandarray.ptr_MyInt1, Ptr{Cvoid})
    @test isa(stringandarray.ptr_MyInt2, Ptr{Cvoid})
    @test isa(stringandarray.stringandarray_handle, stringandarray.julia_exos_datamodel_handle)
    @test isa(stringandarray.myint1, stringandarray.julia_exos_dataset_handle)
    @test isa(stringandarray.myint2, stringandarray.julia_exos_dataset_handle)
end

@testset "Test ccalls" begin
    @test isa(stringandarray.datamodel_init, Cint)
    @test isa(stringandarray.dataset_init1, Cint)
    @test isa(stringandarray.dataset_init2, Cint)
    @test isa(stringandarray.data_connect, Cint)
    
end
