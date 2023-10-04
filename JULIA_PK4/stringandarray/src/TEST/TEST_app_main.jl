using .stringandarray_test
#GC.enable(false)

function julia_datamodel_connect_stringarray(datamodel::Ref{julia_exos_datamodel_handle}, datamodel_event_cb::Ptr{Cvoid})
    println("Data in the function")
    print_data(data[])

    # dataset1
    name_1 = empty_string
    adr = ptr_data
    size_1 = Csize_t(sizeof(data[]))
    offset_1 = Clong(0)
    array_items = ntuple(x->Cuint(0), EXOS_ARRAY_DEPTH)
    dataset1 = julia_exos_dataset_info(name_1, adr, size_1, offset_1, array_items)

    #dataset2
    name_2 = MyInt1_Cstring
    adr_2 = ptr_MyInt1
    size_2 = Csize_t(sizeof(data[].MyInt1))
    offset_2 = Clong(0)
    dataset2 = julia_exos_dataset_info(name_2, adr_2, size_2, offset_2, array_items)

    # dataset3
    name_3 = MyInt2_Cstring
    adr_3 = ptr_MyInt2
    size_3 = Csize_t(sizeof(data[].MyInt2[]))
    offset_3 = Clong(0)
    dataset3 = julia_exos_dataset_info(name_3, adr_3, size_3, offset_3, array_items)

    #dataset4
    name_4 = MyInt2_0_Cstring
    adr_4 = ptr_MyInt2
    size_4 = Csize_t(sizeof(data[].MyInt2[][1]))
    offset_4 = Clong(0)
    array_items_4 = ntuple(i -> i == 1 ? 5 : 0, 10)
    dataset4 = julia_exos_dataset_info(name_4, adr_4, size_4, offset_4, array_items_4)

    datasets = (dataset1, dataset2, dataset3, dataset4)

    println("Datasets array before calc")
    print_datasetinfo(datasets)

    #ref_datasets = Ref(datasets)
    #ptr_datasets = Base.unsafe_convert(Ptr{NTuple{4, julia_exos_dataset_info}}, ref_datasets)::Ptr{NTuple{4, julia_exos_dataset_info}}
    datasets_size = Csize_t(sum(sizeof.(datasets)))
    println("Datasets size: ", datasets_size)
   
	@ccall libexos_api_test.exos_datamodel_calc_dataset_info(datasets::Ref{NTuple{4, julia_exos_dataset_info}}, datasets_size::Csize_t)::Cvoid
    
    println("Datasets array after calc")
    print_datasetinfo(datasets)

    return @ccall libexos_api_test.exos_datamodel_connect(datamodel::Ref{julia_exos_datamodel_handle}, config_stringandarray::Cstring, datasets::Ref{NTuple{4, julia_exos_dataset_info}}, datasets_size::Csize_t, datamodel_event_cb::Ptr{Cvoid})::Cint
end

function main()                                                                                                                       
    println("Starting StringAndArray application...")
    println("DATA stringandarray")
    print_data(data[])
    
    #= Initialize the datamodel handle
	* 
	* This function intializes (resets) a datamodel handle and gives it a `user_alias` via a `datamodel_instance_name`.
	* The datamodel handle is then used for receiving incoming messages using the `exos_datamodel_process()`
	=#
    println("Julia datamodel pointer: ", ptr_stringandarray_handle)
    @ccall libexos_api_test.test_datamodel_handle(ptr_stringandarray_handle::Ref{julia_exos_datamodel_handle})::Cvoid
    println("DATAMODEL HANDLE before INIT")
    print_datamodel(stringandarray_handle[])

    datamodel_init = @ccall libexos_api_test.exos_datamodel_init(stringandarray_handle::Ref{julia_exos_datamodel_handle}, "StringAndArray_0"::Cstring, "gStringAndArray_0"::Cstring)::Cint
    datamodel_init_string = unsafe_string(@ccall libexos_api_test.exos_get_error_string(EXOS_ERROR_CODE(datamodel_init)::EXOS_ERROR_CODE)::Cstring)
    println("datamodel_init\t\t\t-> ERROR_CODE: $datamodel_init $datamodel_init_string")
    println("----------------------------------------------")
    
    @ccall libexos_api_test.test_datamodel_handle(ptr_stringandarray_handle::Ref{julia_exos_datamodel_handle})::Cvoid

    println("DATAMODEL HANDLE after INIT")
    print_datamodel(stringandarray_handle[])

    stringandarray_handle[].user_context = C_NULL
    stringandarray_handle[].user_tag = Clong(0)

    #=
    * Initialize a dataset handle and attach it to a datamodel
    * 
    * This function initializes the `exos_dataset_handle_t` structure, meaning it zeroes all members and sets artefact, data and size members.
    =#
    #struct_string = unsafe_load(ptr_stringandarray_handle)
    println("MYINT1 HANDLE before INIT")
    @ccall libexos_api_test.print_exos_dataset_handle(myint1::Ref{julia_exos_dataset_handle})::Cvoid

    print_dataset(myint1[])

    dataset_init1 = @ccall libexos_api_test.exos_dataset_init(myint1::Ref{julia_exos_dataset_handle}, stringandarray_handle::Ref{julia_exos_datamodel_handle}, "MyInt1"::Cstring, ptr_MyInt1::Ptr{Cvoid}, sizeof(data[].MyInt1)::Csize_t)::Cint
    dataset_init_string1 = unsafe_string(@ccall libexos_api_test.exos_get_error_string(EXOS_ERROR_CODE(dataset_init1)::EXOS_ERROR_CODE)::Cstring)
    println("MyInt1 - dataset_init\t\t-> ERROR_CODE: $dataset_init1 $dataset_init_string1")
    println("----------------------------------------------")

    myint1[].user_context = C_NULL
    myint1[].user_tag = Cint(0)

    println("MYINT1 HANDLE after INIT")
    @ccall libexos_api_test.print_exos_dataset_handle(myint1::Ref{julia_exos_dataset_handle})::Cvoid

    print_dataset(myint1[])
#=
    #=
    * Release all resources from a dataset (and disconnect from the Dataset Message Router)
    * 
    * Delete (and disconnect) a dataset and free up all allocated resources.
    * If the dataset is connected, it will be disconnected before being deleted.
    =#       
    println("MYINT2 HANDLE before INIT")
    print_dataset(myint2[])

    dataset_init2 = @ccall libexos_api_test.exos_dataset_init(myint2::Ref{julia_exos_dataset_handle}, stringandarray_handle::Ref{julia_exos_datamodel_handle}, "MyInt2"::Cstring, ptr_MyInt2::Ptr{Cvoid}, sizeof(data[].MyInt2)::Csize_t)::Cint
    dataset_init_string2 = unsafe_string(@ccall libexos_api_test.exos_get_error_string(EXOS_ERROR_CODE(dataset_init2)::EXOS_ERROR_CODE)::Cstring)
    println("MyInt2 - dataset_init\t\t-> ERROR_CODE: $dataset_init2  $dataset_init_string2")
    println("----------------------------------------------")

    myint2[].user_context = C_NULL
    myint2[].user_tag = Cint(0)

    println("MYINT2 HANDLE after INIT")
    print_dataset(myint2[])

    datamodel_connect = julia_datamodel_connect_stringarray(stringandarray_handle, datamodel_event_cb)
    datamodel_connect_string = unsafe_string(@ccall libexos_api_test.exos_get_error_string(EXOS_ERROR_CODE(datamodel_connect)::Ref{EXOS_ERROR_CODE})::Cstring)
    println("datamodel_connect\t\t\t-> ERROR_CODE: $datamodel_connect $datamodel_connect_string")

	#=
	* Connect a dataset to the Dataset Message Router and register an event callback
	=#
	#dataset_connect_MyInt1 = @ccall libexos_api_test.exos_dataset_connect(myint1::Ref{julia_exos_dataset_handle}, EXOS_DATASET_SUBSCRIBE::Cint, dataset_event_cb::Ptr{Cvoid})::Cint
	#dataset_connect_string1 = unsafe_string(@ccall libexos_api_test.exos_get_error_string(EXOS_ERROR_CODE(dataset_connect_MyInt1)::EXOS_ERROR_CODE)::Ptr{Cchar})
	#println("dataset_connect_MyInt1\t\t\t-> ERROR_CODE: $dataset_connect: $dataset_connect_string1")

	# dataset_connect_MyInt2 = @ccall libexos_api_test.exos_dataset_connect(myint2::Ref{julia_exos_dataset_handle}, EXOS_DATASET_PUBLISH::EXOS_DATASET_TYPE, datamodel_event_cb::Ptr{Cvoid})::Cint
	# dataset_connect_string2 = unsafe_string(@ccall libexos_api_test.exos_get_error_string(EXOS_ERROR_CODE(dataset_connect_MyInt2)::EXOS_ERROR_CODE)::Ptr{Cchar})
	# println("dataset_connect_MyInt2\t\t\t-> ERROR_CODE: $dataset_connect_MyInt2: $dataset_connect_string2")
=#
end

main()



