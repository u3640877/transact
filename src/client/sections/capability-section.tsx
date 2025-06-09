import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DeviceSelector from '@components/device-selector';
import { JWTCapability } from '@components/jwt-capability';

// Simple blackboard component
function Blackboard() {
  return (
    <div
      className="w-full h-64 flex items-center justify-center rounded-lg border border-dashed shadow-sm bg-black text-white text-xl"
      style={{ minHeight: 200 }}
    >
      Blackboard: No input available for this capability.
    </div>
  );
}

interface SectionProps {
  capability: string;
  route: string;
  additionalProps?: Record<string, any>; // Props to be passed to JWTCapability
}

/** A reusable Section component, wrapping a given Transitive capability
* component and embedding props.
*
* Example:
*     <CapabilitySection
*       capability="webrtc-video"
*       route="/dashboard/video"
*       additionalProps={{ count: '1', type: 'videotestsrc' }}
*     />
* */
export function CapabilitySection({ capability, route, additionalProps = {} }: SectionProps) {
  const { deviceId } = useParams();
  const navigate = useNavigate();

  // Check if there is any input-related prop
  const hasInput =
    additionalProps &&
    Object.keys(additionalProps).some((key) =>
      key.toLowerCase().includes('input')
    );

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4
        lg:h-[60px] lg:px-6">
        <div className="w-full flex-1">
          <div className="relative">
            <DeviceSelector
              deviceId={deviceId}
              capability={capability}
              onChange={(id: string) => navigate(`${route}/${id}`)}
            />
          </div>
        </div>
        {/* Add this sentence to show where you are */}
        <span className="text-xs text-muted-foreground ml-4">
          You are viewing the CapabilitySection for <b>{capability}</b>
        </span>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex flex-1 items-center justify-center rounded-lg
          border border-dashed shadow-sm">
          {deviceId && (
            <>
              <JWTCapability
                device={deviceId}
                capability={`@transitive-robotics/${capability}`}
                {...additionalProps}
              />
              {!hasInput && <Blackboard />}
            </>
          )}
        </div>
      </main>
    </>
  );
}