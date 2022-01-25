
TYPE
	ExComponentLink : 	STRUCT  (*Unique identification of an exOS Component.*)
		internal : UDINT;
	END_STRUCT;
	ExLogConfigFilterType : 	STRUCT  (*exOS Logger message filter settings.*)
		User : BOOL; (*Log user-application specific messages.*)
		System : BOOL; (*Log system messages of the Data Message Router.*)
		Verbose : BOOL; (*Log verbose messages.*)
	END_STRUCT;
	ExLogConfigType : 	STRUCT  (*exOS Logger configuration.*)
		Level : ExLogLevelEnum; (*Log level setting.*)
		Filter : ExLogConfigFilterType; (*exOS Logger message filter settings.*)
		ExcludeModule : ARRAY[0..19]OF STRING[35]; (*List of exOS Logger modules that are excluded from logging.*)
	END_STRUCT;
	ExLogLevelEnum : 
		( (*Log levels of the exOS Logger.*)
		exOS_LOG_LEVEL_ERROR, (*Log only errors.*)
		exOS_LOG_LEVEL_WARNING, (*Log errors and warnings.*)
		exOS_LOG_LEVEL_SUCCESS, (*Log errors, warnings, and success events.*)
		exOS_LOG_LEVEL_INFO, (*Log errors, warnings, success events and further information.*)
		exOS_LOG_LEVEL_DEBUG (*Log everything (incl. debug messages).*)
		);
	ExProcessSyncTargetType : 	STRUCT  (*Process synchronization information of a specific target.*)
		CycleTime : UDINT; (*Cycle time of the Data Message Router in microseconds.*)
		ProcessTime : UDINT; (*Process time of the Data Message Router in microseconds.*)
		IdleTime : UDINT; (*Idle time of the Data Message Router in microseconds.*)
		CycleTimeViolations : UDINT; (*Number of cycle time violations (always 0 on AR).*)
		MissedCycles : UDINT; (*Number of missed cycles (always 0 on AR).*)
	END_STRUCT;
	ExProcessSyncType : 	STRUCT  (*Process synchronization information.*)
		Local : ExProcessSyncTargetType; (*Process synchronization information for the local system.*)
		Remote : ExProcessSyncTargetType; (*Process synchronization information for the remote system.*)
	END_STRUCT;
	ExTimeSyncType : 	STRUCT  (*Time synchronization information.*)
		TargetResponsive : BOOL; (*The exOS Target is responding (i.e. answering a request within the timeout interval).*)
		PrecisionReached : BOOL; (*The exOS Target has reached the configured precision of synchronization.*)
		PrecisionError : DINT; (*Deviation of the target clock to the set precision in microseconds.*)
	END_STRUCT;
	ExErrorEnum : 
		( (*exOS error numbers.*)
		exOS_ERR_OK := 0, (*No error.*)
		exOS_ERR_BAD_TARGET_LINK := 4482, (*The provided ExTargetLink is invalid.*)
		exOS_ERR_BAD_COMPONENT_LINK := 4483, (*The provided ExComponentLink is invalid.*)
		exOS_ERR_INVALID_DATAMODEL := 4484, (*The provided datamodel is invalid.*)
		exOS_ERR_NOT_CONNECTED := 4485, (*The exOS Target is not connected.*)
		exOS_ERR_NOT_SYNCHRONIZED := 4485, (*The exOS Target is not synchronized.*)
		exOS_ERR_NOT_CONFIGURED := 4486, (*The exOS Target is not configured.*)
		exOS_ERR_OVERFLOW := 4487 (*An overflow occurred.*)
		);
	ExTargetLink : 	STRUCT  (*Unique identification of an exOS Target.*)
		internal : UDINT;
	END_STRUCT;
	ExDataConnectionDiagTargetType : 	STRUCT  (*Diagnostic data of the data connection of a specific target.*)
		DatamodelsConfigured : UDINT; (*Number of configured datamodels.*)
		DatamodelsActive : UDINT; (*Number of active datamodels.*)
		DatamodelErrors : UDINT; (*Counter of datamodel errors.*)
	END_STRUCT;
	ExDataConnectionDiagType : 	STRUCT  (*Diagnostic data of the data connection.*)
		Local : ExDataConnectionDiagTargetType; (*Diagnostic data of the data connection for the local system.*)
		Remote : ExDataConnectionDiagTargetType; (*Diagnostic data of the data connection for the remote system.*)
		DataTransmitted : ExDataTransferType; (*Counter of overall transmitted data to the remote system.*)
		DataReceived : ExDataTransferType; (*Counter of overall received data from the remote system.*)
	END_STRUCT;
	ExDataTransferType : 	STRUCT  (*Counter of transferred data.*)
		Bytes : UDINT; (*Number of Bytes (0..1023).*)
		KiB : UDINT; (*Number of Kibibytes (0..1023).*)
		MiB : UDINT; (*Number of Mebibytes (0..1023).*)
		GiB : UDINT; (*Number of Gibibytes.*)
	END_STRUCT;
	ExTargetCounterType : 	STRUCT  (*Number of conencted peers.*)
		Local : UDINT; (*Number of local connections.*)
		Remote : UDINT; (*Number of remote connections.*)
	END_STRUCT;
	ExTargetDiagComponentType : 	STRUCT  (*Diagnostic data of the exOS Components of an exOS Target.*)
		Configured : UDINT; (*Number of configured components.*)
		Deploying : UDINT; (*Number of deploying components.*)
		Operational : UDINT; (*Number of operational components.*)
		Stopped : UDINT; (*Number of stopped components.*)
		Aborted : UDINT; (*Number of aborted components.*)
	END_STRUCT;
	ExTargetDiagType : 	STRUCT  (*Diagnostic data of an exOS Target.*)
		Components : ExTargetDiagComponentType; (*Diagnostic data of the exOS Components of an exOS Target.*)
	END_STRUCT;
	ExDatamodelDiagTargetType : 	STRUCT  (*Diagnostic data of the datamodel of a specific target.*)
		DatasetsActive : UDINT; (*Number of active datasets.*)
		DatasetErrors : UDINT; (*Counter of dataset errors.*)
	END_STRUCT;
	ExDatamodelDiagType : 	STRUCT  (*Diagnostic data of the datamodel.*)
		Local : ExDatamodelDiagTargetType; (*Diagnostic data of the datamodel of the local system.*)
		Remote : ExDatamodelDiagTargetType; (*Diagnostic data of the datamodel of the remote system.*)
		DataTransmitted : ExDataTransferType; (*Counter of transmitted data to the remote system.*)
		DataReceived : ExDataTransferType; (*Counter of received data from the remote system.*)
	END_STRUCT;
	ExComponenInfoDiagFilesType : 	STRUCT  (*Diagnostic data of the files of an exOS Component.*)
		Configured : UDINT; (*Number of configured files.*)
		Deployed : UDINT; (*Number of deployed files.*)
		Failed : UDINT; (*Number of failed files.*)
	END_STRUCT;
	ExComponenInfoDiagStartSvcType : 	STRUCT  (*Diagnostic data of the startup services of an exOS Component.*)
		Configured : UDINT; (*Number of configured startup services.*)
		Finished : UDINT; (*Number of finished startup services.*)
		Failed : UDINT; (*Number of failed startup services.*)
	END_STRUCT;
	ExComponenInfoDiagRunSvcType : 	STRUCT  (*Diagnostic data of the runtime services of an exOS Component.*)
		Configured : UDINT; (*Number of configured services.*)
		Running : UDINT; (*Number of running services.*)
		Stopped : UDINT; (*Number of stopped services.*)
		Failed : UDINT; (*Number of failed services.*)
	END_STRUCT;
	ExComponenInfoDiagType : 	STRUCT  (*Diagnostic data of an exOS Component.*)
		Files : ExComponenInfoDiagFilesType; (*Diagnostic data of the files of an exOS Component.*)
		StartupServices : ExComponenInfoDiagStartSvcType; (*Diagnostic data of the startup services of an exOS Component.*)
		RuntimeServices : ExComponenInfoDiagRunSvcType; (*Diagnostic data of the runtime services of an exOS Component.*)
	END_STRUCT;
END_TYPE
