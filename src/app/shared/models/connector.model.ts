import { Switch } from './switch.model';

export interface Connector {
  ip: string;
  connectionType: 'eth1' | 'eth2';
  castType: 'out' | null;
  // nodes: (Switch | Connector)[];
}
