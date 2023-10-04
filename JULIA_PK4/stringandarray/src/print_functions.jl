using .stringandarray

function print_data(data::StringAndArray)
    println("----------------------------------------------")
    println("MyInt1:", data.MyInt1[])
    println("MyInt2:", data.MyInt2[])
    println("ptr_data:", ptr_data)
    println("ptr_MyInt1:", ptr_MyInt1)
    println("ptr_MyInt2:", ptr_MyInt2)
    println("----------------------------------------------")
end

function print_datamodel(datamodel_handel::julia_exos_datamodel_handle)
    println("----------------------------------------------")
    println("Name:\t\t\t\t", unsafe_string(datamodel_handel.name))
    println("Connection state:\t\t", datamodel_handel.connection_state)
    println("Error:\t\t\t\t", datamodel_handel.error)
    println("User context:\t\t\t", datamodel_handel.user_context)
    println("User tag:\t\t\t", datamodel_handel.user_tag)
    println("User alias:\t\t\t", unsafe_string(datamodel_handel.user_alias))
    println("datamodel_event_callback:\t", datamodel_handel.datamodel_event_callback)
    println("sync_info:\t\t\t", datamodel_handel.sync_info)
    println("_reserved_bool:\t\t\t", datamodel_handel._reserved_bool)
    println("_reserved_uint32:\t\t", datamodel_handel._reserved_uint32)
    println("_reserved_void:\t\t\t", datamodel_handel._reserved_void)
    println("_private:\t\t\t", datamodel_handel._private)
    println("----------------------------------------------")
end

function print_log(log_handle::julia_exos_log_handle)
    println("----------------------------------------------")
    println("Name:\t\t\t\t", unsafe_string(log_handle.name))
    println("Ready:\t\t\t\t", log_handle.ready)
    println("Excluded:\t\t\t", log_handle.excluded)
    println("Console:\t\t\t", log_handle.console)
    println("Config_change_cb:\t\t", log_handle.config_change_cb)
    println("Config_change_user_context:\t", log_handle.config_change_user_context)
    println("Reserve_bool:\t\t\t", log_handle._reserved_bool)
    println("Reserve_uint32:\t\t\t", log_handle._reserved_uint32)
    println("Reserved:\t\t\t", log_handle._reserved)
    println("Private:\t\t\t", log_handle._private)
    println("----------------------------------------------")
end

function print_dataset(dataset::julia_exos_dataset_handle)
    println("----------------------------------------------")
    println("Name:\t\t\t", unsafe_string(dataset.name))
    println("Type:\t\t\t", dataset.type)
    println("Datamodel:\t\t", dataset.datamodel)
    println("Data:\t\t\t", dataset.data)
    println("Size:\t\t\t", dataset.size)
    println("Error:\t\t\t", dataset.error)
    println("Connection_state:\t", dataset.connection_state)
    println("Send_buffer:\t\t", dataset.send_buffer)
    println("Nettime:\t\t", dataset.nettime)
    println("User_tag:\t\t", dataset.user_tag)
    println("User_context:\t\t", dataset.user_context)
    println("Dataset_event_callback:\t", dataset.dataset_event_callback)
    println("----------------------------------------------")
end

function print_datasetinfo(datasets::NTuple{4, julia_exos_dataset_info})
    println("----------------------------------------------")
    for dataset in datasets
        println("name: ", unsafe_string(dataset.name))
        println("adr: ", dataset.adr)
        println("size: ", dataset.size)
        println("offset: ", dataset.offset)
        println("arrayItems: ", dataset.arrayItems)
        println()
    end
    println("----------------------------------------------")

end