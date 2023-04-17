export interface Connection {
  fromIp: string;
  toIp: string;
  fromHub?: number;
  toHub?: number;
  type?: string;
}
