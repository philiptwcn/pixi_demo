import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Connection } from 'src/app/shared/models/connection.model';
import { Connector } from 'src/app/shared/models/connector.model';

interface ConnectorForm {
  type: FormControl<'router' | 'switch'>;
  ip: FormControl<string>;
  nodeCount: FormControl<number | null>;
  connectionType: FormControl<'eth1' | 'eth2'>;
  castType: FormControl<'out' | null>;
  toIp: FormControl<string | null>;
  fromHub: FormControl<number | null>;
  toHub: FormControl<number | null>;
}
@Component({
  selector: 'add-node-dialog',
  templateUrl: './add-node-dialog.component.html',
})
export class AddNodeDialogComponent {
  connectorForm = this.fb.group<ConnectorForm>({
    type: new FormControl<'router' | 'switch'>('router', { nonNullable: true }),
    ip: new FormControl<string>('', { nonNullable: true }),

    nodeCount: new FormControl<number | null>(0),
    connectionType: new FormControl<'eth1' | 'eth2'>('eth1', {
      nonNullable: true,
    }),
    castType: new FormControl<'out' | null>('out'),
    toIp: new FormControl<string | null>(''),
    fromHub: new FormControl<number | null>(0),
    toHub: new FormControl<number | null>(0),
  });
  nodeCount: number[] = [];
  hubCount: number[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { assets: Connector[] },
    public dialogRef: MatDialogRef<AddNodeDialogComponent>,
    private fb: FormBuilder
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
  onSelectToIp(event: any) {
    this.connectorForm.patchValue({ toIp: event.value });
    const count =
      this.data.assets.find((asset) => asset.ip === event.value)?.nodeCount ??
      0;
    this.hubCount = Array.from({ length: count }, (_, i) => i + 1);
  }

  onNodeCountChange(event: any) {
    this.nodeCount = Array.from({ length: event.data }, (_, i) => i + 1);
  }

  onSubmit() {
    const FormValue = this.connectorForm.getRawValue();
    const value = {
      type: FormValue.type,
      ip: FormValue.ip,
      nodeCount: FormValue.nodeCount,
      connectionType: FormValue.connectionType,
      castType: FormValue.castType,
      connections: [
        {
          fromIp: FormValue.ip,
          toIp: FormValue.toIp,
          fromHub: FormValue.fromHub,
          toHub: FormValue.toHub,
        } as Connection,
      ],
    } as Connector;

    this.data.assets.push(value);

    this.dialogRef.close({ data: this.data.assets.pop() });
  }
}
