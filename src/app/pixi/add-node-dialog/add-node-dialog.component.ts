import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Connector } from 'src/app/shared/models/connector.model';
import { Switch } from 'src/app/shared/models/switch.model';

interface SwitchForm {
  ip: FormControl<string>;
  nodeCount: FormControl<number>;
}

interface ConnectorForm {
  ip: FormControl<string>;
  connectionType: FormControl<'eth1' | 'eth2'>;
  castType: FormControl<'out' | null>;
}
@Component({
  selector: 'add-node-dialog',
  templateUrl: './add-node-dialog.component.html',
})
export class AddNodeDialogComponent {
  type = '0';
  switchForm = this.fb.group<SwitchForm>({
    ip: new FormControl<string>('', { nonNullable: true }),
    nodeCount: new FormControl<number>(0, { nonNullable: true }),
    // nodes: [],
  });
  connectorForm = this.fb.group<ConnectorForm>({
    ip: new FormControl<string>('', { nonNullable: true }),
    connectionType: new FormControl<'eth1' | 'eth2'>('eth1', {
      nonNullable: true,
    }),
    castType: new FormControl<'out' | null>('out'),
    // nodes: [],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddNodeDialogComponent>,
    private fb: FormBuilder
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit() {
    this.data = (
      this.type === '0' ? this.switchForm : this.connectorForm
    ).getRawValue() as Switch | Connector;

    this.dialogRef.close({ type: this.type, data: this.data });
  }
}
