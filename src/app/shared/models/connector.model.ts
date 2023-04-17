import { Connection } from './connection.model';

export interface Connector {
  type: 'router' | 'switch';
  ip: string;
  nodeCount: number;
  connectionType: 'eth1' | 'eth2';
  castType: 'out' | null;
  connections: Connection[];
}
