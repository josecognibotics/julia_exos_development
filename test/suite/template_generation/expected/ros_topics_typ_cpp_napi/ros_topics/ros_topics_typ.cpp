#include <string.h>
#include <stdbool.h>
#include "ros_topics_typDatamodel.hpp"

/* datamodel features:

main methods:
    ros_topics_typ_datamodel->connect()
    ros_topics_typ_datamodel->disconnect()
    ros_topics_typ_datamodel->process()
    ros_topics_typ_datamodel->setOperational()
    ros_topics_typ_datamodel->dispose()
    ros_topics_typ_datamodel->getNettime() : (int32_t) get current nettime

void(void) user lambda callback:
    ros_topics_typ_datamodel->onConnectionChange([&] () {
        // ros_topics_typ_datamodel->connectionState ...
    })

boolean values:
    ros_topics_typ_datamodel->isConnected
    ros_topics_typ_datamodel->isOperational

logging methods:
    ros_topics_typ_datamodel->log.error << "some value:" << 1 << std::endl;
    ros_topics_typ_datamodel->log.warning << "some value:" << 1 << std::endl;
    ros_topics_typ_datamodel->log.success << "some value:" << 1 << std::endl;
    ros_topics_typ_datamodel->log.info << "some value:" << 1 << std::endl;
    ros_topics_typ_datamodel->log.debug << "some value:" << 1 << std::endl;
    ros_topics_typ_datamodel->log.verbose << "some value:" << 1 << std::endl;

dataset odemetry:
    ros_topics_typ_datamodel->odemetry.publish()
    ros_topics_typ_datamodel->odemetry.value : (ros_topic_odemety_typ)  actual dataset values

dataset twist:
    ros_topics_typ_datamodel->twist.onChange([&] () {
        ros_topics_typ_datamodel->twist.value ...
    })
    ros_topics_typ_datamodel->twist.nettime : (int32_t) nettime @ time of publish
    ros_topics_typ_datamodel->twist.value : (ros_topic_twist_typ)  actual dataset values

dataset config:
    ros_topics_typ_datamodel->config.onChange([&] () {
        ros_topics_typ_datamodel->config.value ...
    })
    ros_topics_typ_datamodel->config.nettime : (int32_t) nettime @ time of publish
    ros_topics_typ_datamodel->config.value : (ros_config_typ)  actual dataset values
*/


_BUR_PUBLIC void ros_topics_typInit(struct ros_topics_typInit *inst)
{
    ros_topics_typDatamodel* ros_topics_typ_datamodel = new ros_topics_typDatamodel();
    if (NULL == ros_topics_typ_datamodel)
    {
        inst->Handle = 0;
        return;
    }
    inst->Handle = (UDINT)ros_topics_typ_datamodel;
}

_BUR_PUBLIC void ros_topics_typCyclic(struct ros_topics_typCyclic *inst)
{
    // return error if reference to structure is not set on function block
    if(NULL == (void*)inst->Handle || NULL == inst->pros_topics_typ)
    {
        inst->Operational = false;
        inst->Connected = false;
        inst->Error = true;
        return;
    }
    ros_topics_typDatamodel* ros_topics_typ_datamodel = static_cast<ros_topics_typDatamodel*>((void*)inst->Handle);
    if (inst->Enable && !inst->_Enable)
    {
        ros_topics_typ_datamodel->twist.onChange([&] () {
            memcpy(&inst->pros_topics_typ->twist, &ros_topics_typ_datamodel->twist.value, sizeof(inst->pros_topics_typ->twist));
        });
        ros_topics_typ_datamodel->config.onChange([&] () {
            memcpy(&inst->pros_topics_typ->config, &ros_topics_typ_datamodel->config.value, sizeof(inst->pros_topics_typ->config));
        });
        ros_topics_typ_datamodel->connect();
    }
    if (!inst->Enable && inst->_Enable)
    {
        ros_topics_typ_datamodel->disconnect();
    }
    inst->_Enable = inst->Enable;

    if(inst->Start && !inst->_Start && ros_topics_typ_datamodel->isConnected)
    {
        ros_topics_typ_datamodel->setOperational();
        inst->_Start = inst->Start;
    }
    if(!inst->Start)
    {
        inst->_Start = false;
    }

    //trigger callbacks
    ros_topics_typ_datamodel->process();

    if (ros_topics_typ_datamodel->isConnected)
    {
        //publish the odemetry dataset as soon as there are changes
        if (0 != memcmp(&inst->pros_topics_typ->odemetry, &ros_topics_typ_datamodel->odemetry.value, sizeof(ros_topics_typ_datamodel->odemetry.value)))
        {
            memcpy(&ros_topics_typ_datamodel->odemetry.value, &inst->pros_topics_typ->odemetry, sizeof(ros_topics_typ_datamodel->odemetry.value));
            ros_topics_typ_datamodel->odemetry.publish();
        }
        // Your code here...
    }

    inst->Connected = ros_topics_typ_datamodel->isConnected;
    inst->Operational = ros_topics_typ_datamodel->isOperational;
}

_BUR_PUBLIC void ros_topics_typExit(struct ros_topics_typExit *inst)
{
    ros_topics_typDatamodel* ros_topics_typ_datamodel = static_cast<ros_topics_typDatamodel*>((void*)inst->Handle);
    delete ros_topics_typ_datamodel;
}

