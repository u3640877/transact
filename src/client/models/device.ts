export class DeviceType {
  name: string;
  description: string;
  icon_svg: string;
  constructor(name: string, description: string, icon_svg: string) {
    this.name = name;
    this.description = description;
    this.icon_svg = icon_svg;
  }
}

export const Robot = new DeviceType(
  'Robot',
  'A robot that can move around',
  '/src/client/assets/logo.svg'
);

export class Capability {
  id: string;
  displayName: string;
  route: string | null;
  icon: React.ComponentType | null;
  props?: Record<string, any>; // Props to be passed to TransitiveCapability
};

export class Device {
  constructor(
    public id: string,
    public name: string,
    public os: string,
    public heartbeat: Date,
    public capabilities: Capability[],
    public robot: Robot,
    public health: string = 'Unknown', // Add health property
    public lastUpdated: Date | null = null // Add lastUpdated property
  ) {}
}

export default {
  DeviceType,
  Robot,
  Device
}