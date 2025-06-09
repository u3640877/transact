import React, { useContext, useState } from 'react';
import _ from 'lodash';

import { Link, useParams } from 'react-router-dom';
import { Capability, Device } from '@models/device';
import { Heartbeat } from '@components/heartbeat';
import { FleetContext } from '@components/fleet-context';
import { CircleArrowLeftIcon } from 'lucide-react';
import { JWTCapability } from '@components/jwt-capability';
import { BatteryIcon } from '@components/battery-icon';

import { MapComponent } from '@components/map-component';
import { getLogger} from '@transitive-sdk/utils-web';
import { TriggerServiceButton } from '@components/trigger-service-button';
import { useTheme } from '@components/theme-provider';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@components/ui/accordion';

const log = getLogger('DeviceSection');
log.setLevel('debug');

function Blackboard({ capability }: { capability: string }) {
  const { theme } = useTheme(); // Get the current theme from ThemeProvider

  // Determine the background color based on the theme
  const backgroundColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200';
  const textColor = theme === 'dark' ? 'text-white' : 'text-black';

  return (
    <div
      className={`w-full h-full flex items-center justify-center rounded-lg border border-dashed shadow-sm ${backgroundColor} ${textColor} text-lg`}
    >
      Blackboard: No input available for <b>{capability}</b> capability.
    </div>
  );
}

function hasInput(capability: Capability) {
  // Adjust this logic based on your actual capability structure
  return Object.keys(capability).some(key =>
    key.toLowerCase().includes('input')
  );
}

export function DeviceSection() {
  const { deviceId } = useParams();
  const { fleet, mqttSync } = useContext(FleetContext);

  const device = _.find(fleet, { id: deviceId }) as Device;
  const [command, setCommand] = useState('');

  console.log(device);

  if (!device) {
    return <div>Loading Device section</div>;
  }

  const handleSendCommand = (command: string) => {
    if (!mqttSync || !mqttSync.mqtt.connected) {
      log.error('MQTT is not connected');
      return;
    }

    const topic = `/${deviceId}/@transitive-robotics/terminal/command`;
    mqttSync.publish(topic, command, (err) => {
      if (err) {
        log.error(`Failed to send command: ${err.message}`);
      } else {
        log.debug(`Command sent: ${command}`);
      }
    });
  };

  return (
    <>
      <header className="relative flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <h1 className="text-xl font-bold">{device.name}</h1>
        <Heartbeat heartbeat={device.heartbeat} refresh={true} />
        <BatteryIcon deviceId={device.id} />
        <Link to="/dashboard/devices" className="flex-grow">
          <CircleArrowLeftIcon className="h-6 w-6 float-right" />
        </Link>
      </header>

      {/* Main content with CSS Grid */}
      <main className="grid grid-cols-2 gap-6 p-6 lg:p-8 overflow-y-auto">
        {/* Map Section */}
        <div
          className="relative border rounded-lg shadow-md overflow-hidden"
          style={{
            width: '100%', // Full width of the grid column
            height: '37.5vh', // 50% longer in vertical direction
          }}
        >
          <MapComponent deviceId={deviceId} />
        </div>

        {/* Video Capability Section */}
        <div
          className="relative border rounded-lg shadow-md overflow-hidden"
          style={{
            width: '100%', // Full width of the grid column
            height: '37.5vh', // 50% longer in vertical direction
          }}
        >
          {_.some(device.capabilities, c => c.id === 'video') ? (
            hasInput(_.find(device.capabilities, c => c.id === 'video')!) ? (
              <div className="relative z-10">
                <JWTCapability
                  device={deviceId}
                  capability={'@transitive-robotics/webrtc-video'}
                  count="1"
                  type="videotestsrc"
                />
              </div>
            ) : (
              <Blackboard capability="video" />
            )
          ) : (
            <Blackboard capability="video" />
          )}
        </div>

        {/* Terminal Capability Section */}
        <div className="relative border rounded-lg shadow-md overflow-hidden h-48 col-start-1">
          <div className="flex flex-col h-full">
            {/* Terminal Logs */}
            <div className="flex-grow overflow-y-auto p-4 bg-black text-white">
              {_.some(device.capabilities, capability => capability.id === 'terminal') ? (
                <JWTCapability
                  device={deviceId}
                  capability={'@transitive-robotics/terminal'}
                />
              ) : (
                <div>No terminal logs available.</div>
              )}
            </div>

            {/* Input Field for Commands */}
            <div className="flex items-center p-2 border-t bg-gray-800">
              <input
                type="text"
                className="flex-grow p-2 rounded bg-gray-700 text-white"
                placeholder="Enter command..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
              />
              <button
                className="ml-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => handleSendCommand(command)}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Battery, CPU, GPU, and Working Time Section */}
        <div className="relative border rounded-lg shadow-md overflow-hidden h-48 col-start-2">
          <div className="flex flex-col h-full p-4 bg-gray-100">
            <h2 className="text-lg font-bold mb-2">Device Metrics</h2>
            {mqttSync && mqttSync.mqtt.connected ? (
              <div className="flex flex-col gap-2">
                <p><b>Battery Power:</b> {device?.metrics?.battery || 'Unknown'}%</p>
                <p><b>CPU Usage:</b> {device?.metrics?.cpu || 'Unknown'}%</p>
                <p><b>GPU Usage:</b> {device?.metrics?.gpu || 'Unknown'}%</p>
                <p><b>Working Time:</b> {device?.metrics?.workingTime || 'Unknown'} hours</p>
              </div>
            ) : (
              <p>Metrics data unavailable. Ensure MQTT is connected.</p>
            )}
          </div>
        </div>

        {/* Accordion Section */}
        <div className="col-span-2">
          <Accordion type="single" collapsible>
            <AccordionItem value="health">
              <AccordionTrigger>Health</AccordionTrigger>
              <AccordionContent>
                <div className="p-4">
                  <h2 className="text-lg font-bold">Device Health</h2>
                  <p className="text-sm text-muted">
                    {device?.health === 'Unknown' ? 'Health data unavailable' : `Health Status: ${device.health}`}
                  </p>
                  <p className="text-sm text-muted">
                    Last Updated: {device?.lastUpdated ? new Date(device.lastUpdated).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="configuration">
              <AccordionTrigger>Configuration</AccordionTrigger>
              <AccordionContent>
                <div className="p-4">
                  <p>Device configuration options and settings will be displayed here.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="teleoperation">
              <AccordionTrigger>Teleoperation</AccordionTrigger>
              <AccordionContent>
                <div className="p-4">
                  <p>Teleoperation controls and logs will be displayed here.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
    </>
  );
}