"""
Sends a command to the device to set the x or y of the camera position.

Command format is P{0}:{1}

{0}: X or Y coordinate
{1}: position value 
"""
import MQTT


if IONode.is_trigger('in2'):
    select = 0 #X position
    val = IONode.get_input('in2')['event_data']['value']
    log('camera x position trigger')
elif IONode.is_trigger('in3'):
    select = 1  #Y position
    val = IONode.get_input('in3')['event_data']['value']
    log('camera y position trigger')

MQTT.publish_event_to_client(IONode.get_input('in1')['event_data']['value'], 'P{}:{}'.format(select, str(val)))