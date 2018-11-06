
import MQTT

# Send a command to the device to take a picture.  Expect to recieve a base64 format string back from the device.
if (IONode.get_input('in1')['event_data']['value']):
    MQTT.publish_event_to_client('s5d9', 'C')
    log ('Sent the command.')