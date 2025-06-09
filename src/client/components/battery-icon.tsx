import React, { useContext, useEffect, useState } from 'react';
import { FleetContext } from '@components/fleet-context';
import { CapabilityContext, getLogger} from '@transitive-sdk/utils-web';

import { BatteryWarning, BatteryCharging, BatteryFull, BatteryMedium, BatteryLow, Battery } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/ui/tooltip';

const log = getLogger('BatteryIcon');
log.setLevel('debug');


/**
 * BatteryIcon component displays the battery status of a device.
 * It subscribes to the `/battery_status` topic for the given device ID
 * and displays the battery icon based on the charge level.
 *
 * @component
 * @param {string} deviceId - The ID of the device to get the battery status for
 *
 * @example
 * // Usage example:
 * <BatteryIcon deviceId="device123" />
 *
 * @returns {JSX.Element} The rendered BatteryIcon component
 */
export const BatteryIcon = ({deviceId}) => {
  const capabilityContext = useContext(CapabilityContext);
  const { mqttSync } = useContext(FleetContext);
  const [api, setApi] = useState();

  useEffect(() => {
    if (!capabilityContext.ready || !mqttSync?.mqtt.connected) {
      console.warn('MQTT is not connected or CapabilityContext is not ready.');
      return;
    }
    const _api = capabilityContext.getAPI(deviceId);
    log.debug('Subscribing to topic: /battery_status for device', deviceId);
    _api?.subscribe(1, '/battery_status');
    setApi(_api);

    return () => {
      log.debug('Unsubscribing from topic: /battery_status for device', deviceId);
      _api?.unsubscribe?.(1, '/battery_status');
    };
  }, [capabilityContext?.ready, mqttSync?.mqtt.connected, deviceId]);

  const batteryStatus = api?.deviceData?.ros?.[1].messages?.battery_status;

  if (!mqttSync || !mqttSync.mqtt.connected) {
    console.warn('MQTT is not connected. Battery data cannot be retrieved.');
    return <div className="text-red-500">Battery data unavailable</div>;
  }

  // Logic to fetch and display battery data
  try {
    const batteryData = mqttSync.publish(`/battery/${deviceId}`, {}, (err) => {
      if (err) {
        console.error('Failed to fetch battery data:', err);
      }
    });

    const device_data = api?.deviceData?.ros?.[1]?.messages;

    const health = device_data?.status?.health || 'Unknown';
    const lastUpdated = device_data?.status?.lastUpdated || new Date().toISOString();

    return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {!batteryStatus ? <BatteryWarning style={{color: '#777'}}/> :
              batteryStatus.power_supply_status === 1 ? <BatteryCharging /> :
              batteryStatus.charge > 90 ? <BatteryFull /> :
              batteryStatus.charge <= 90 && batteryStatus.charge > 50 ? <BatteryMedium /> :
              batteryStatus.charge <= 50 && batteryStatus.charge > 20 ? <BatteryLow /> :
            <Battery />
          }
        </TooltipTrigger>
        <TooltipContent>
          <p>{!batteryStatus ? 'Not available' : batteryStatus.charge}</p>
          <p>{!batteryStatus ? 'Not available' : batteryStatus.power_supply_status === 1 ? 'Charging' : 'Discharging'}</p>
          <p>Health: {health}</p>
          <p>Last Updated: {lastUpdated}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  } catch (error) {
    console.error('Error fetching battery data:', error);
    return <div className="text-red-500">Battery data unavailable</div>;
  }
}