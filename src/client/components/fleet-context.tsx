import React, { createContext, useEffect, useContext } from 'react';
import _ from 'lodash';

import { JWTContext, JWTContextProvider } from '@components/jwt-context';

import { useMqttSync, mergeVersions, CapabilityContextProvider }
  from '@transitive-sdk/utils-web';
import { Capability, Device, Robot } from '@models/device';
import { capabilities } from '@config/config';
import { getLogger } from '@transitive-sdk/utils-web';
import { UserContext } from "@components/user-context";

const log = getLogger('FleetContext');
log.setLevel('debug');

const host = import.meta.env.VITE_HOST; // Transitive deployment
const secure = !import.meta.env.VITE_INSECURE;
const transitiveId = import.meta.env.VITE_TRANSITIVE_USER;
const SSLs = import.meta.env.VITE_INSECURE ? '' : 's';
const mqttUrl = `ws${SSLs}://mqtt.${host}`;

export const FleetContext = createContext({});

const ProviderWithRosTool = ({ children }) => {
  const jwt = useContext(JWTContext);

  const { mqttSync, data, ready } = useMqttSync({ jwt, id: transitiveId, mqttUrl });

  useEffect(() => {
    if (mqttSync?.mqtt.connected) {
      mqttSync.subscribe(
        `/${transitiveId}/+/@transitive-robotics/_robot-agent/+/info`,
        (err) => {
          if (err) {
            console.warn('Failed to subscribe to info topic:', err);
          }
        }
      );
      mqttSync.subscribe(
        `/${transitiveId}/+/@transitive-robotics/_robot-agent/+/status`,
        (err) => {
          if (err) {
            console.warn('Failed to subscribe to status topic:', err);
          }
        }
      );
    } else {
      console.error('MQTT is not connected');
    }
  }, [mqttSync]);

  const fleet = _.map(data?.[transitiveId], (device, id) => {
    const device_data = mergeVersions(device['@transitive-robotics']['_robot-agent']);
    const running = device_data?.status?.runningPackages?.['@transitive-robotics'];
    const deviceCapabilities = running
      ? Object.keys(_.pickBy(running, versions => Object.values(versions).some(Boolean)))
      : [];

    // Extract health and lastUpdated data
    const health = device_data?.status?.health || 'Unknown';
    const lastUpdated = device_data?.status?.lastUpdated || new Date().toISOString();

    if (!device_data?.status?.health) {
      log.warn(`Health data missing for device ${id}`);
    }
    if (!device_data?.status?.lastUpdated) {
      log.warn(`Last updated data missing for device ${id}`);
    }

    const deviceInstance = new Device(
      id,
      device_data?.info?.os?.hostname || id,
      device_data?.info?.os?.lsb?.Description || 'Unknown',
      device_data?.status?.heartbeat || new Date(),
      deviceCapabilities.map((capability: Capability) => {
        if (capabilities.hasOwnProperty(capability)) {
          return capabilities[capability];
        } else {
          return new Capability(capability, capability);
        }
      }),
      Robot,
      health, // Add health property
      lastUpdated // Add lastUpdated property
    );

    return deviceInstance;
  });

  // Sort fleet
  fleet.sort((a, b) => a.name.localeCompare(b.name));

  return <FleetContext.Provider value={{ mqttSync, fleet }}>
    {children}
  </FleetContext.Provider>;
};

const ProviderWithJwt = ({ children }) => {
  const jwt = useContext(JWTContext);
  return (
    <CapabilityContextProvider jwt={jwt} host={host} ssl={secure}>
      {children}
    </CapabilityContextProvider>
  );
};

/** A context with basic fleet data (names, status of devices). */
export const FleetContextProvider = ({ children }) => {
  const { session } = useContext(UserContext);
  return session?.user ? (
    <JWTContextProvider device='_fleet' capability={'@transitive-robotics/ros-tool'}>
      <ProviderWithJwt>
        <ProviderWithRosTool>
          {children}
        </ProviderWithRosTool>
      </ProviderWithJwt>
    </JWTContextProvider>
  ) : (
    <div>
      <h1>Not logged in</h1>
    </div>
  );
};
