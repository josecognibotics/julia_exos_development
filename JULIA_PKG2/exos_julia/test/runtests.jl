using exos_julia
using Test

@testset "exos_julia.jl" begin
    @test exos_julia.datamodel_init == 0
    @test exos_julia.dataset_init == 0
    @test exos_julia.datamodel_calc_dataset_info == 0
    @test exos_julia.datamodel_connect == 0 || exos_julia.datamodel_connect == 5008
    @test exos_julia.datamodel_set_operational == 0 || exos_julia.datamodel_set_operational == 5022
    @test exos_julia.datamodel_disconnect == 0
    @test exos_julia.datamodel_delete == 0
    @test exos_julia.datamodel_process == 0
    @test exos_julia.datamodel_get_nettime == 0 || exos_julia.datamodel_get_nettime < 0
    @test exos_julia.dataset_connect == 0 || exos_julia.dataset_connect == 5006
    @test exos_julia.dataset_disconnect == 0
    @test exos_julia.dataset_delete == 0

end