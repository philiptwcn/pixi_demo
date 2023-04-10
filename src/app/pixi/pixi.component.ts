import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  Application,
  Assets,
  Container,
  DisplayObject,
  FederatedPointerEvent,
  Graphics,
  SCALE_MODES,
  Sprite,
  Text,
} from 'pixi.js';
import { Switch } from '../shared/models/switch.model';
import { MatDialog } from '@angular/material/dialog';
import { AddNodeDialogComponent } from './add-node-dialog/add-node-dialog.component';
import { Connector } from '../shared/models/connector.model';

@Component({
  selector: 'app-pixi',
  templateUrl: './pixi.component.html',
  styleUrls: ['./pixi.component.scss'],
})
export class PixiComponent implements AfterViewInit {
  @ViewChild('pixiView') pixiView: ElementRef<HTMLDivElement> | undefined;
  app = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#ffffff',
  });
  assets: (Switch | Connector)[] = [];
  dragTarget: any = null;

  constructor(private dialog: MatDialog) {}
  async ngAfterViewInit() {
    this.pixiView?.nativeElement.appendChild(this.app.view as any);
    this.app.stage.interactive = true;
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerup', () => this.onDragEnd());
    this.app.stage.on('pointerupoutside', () => this.onDragEnd());
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AddNodeDialogComponent, {
      data: {},
    });
    dialogRef
      .afterClosed()
      .subscribe((result: { type: string; data: Switch | Connector }) =>
        this.onAdd(result)
      );
  }

  onAdd(result: { type: string; data: Switch | Connector }) {
    this.assets.push(result.data);
    this.assets.forEach((asset, index) => {
      if (Assets.cache.has(asset.ip + index)) {
        return;
      }
      Assets.add(
        asset.ip + index,
        result.type === '0' ? 'assets/hub.png' : 'assets/data-storage.png',
        {
          scaleMode: SCALE_MODES.NEAREST,
        }
      );
      const container = new Container();
      const graphics = new Graphics();
      const text = new Text(asset.ip);
      const texturePromise = Assets.load([asset.ip + index]);
      texturePromise.then((texture) => {
        const hub = Sprite.from(texture[asset.ip + index]);
        if (result.type === '0') {
          graphics.lineStyle(2, 0x000000, 1);
          this.regularpolygon(graphics, 100, (result.data as Switch).nodeCount);
        }
        container.pivot.x = container.width / 2;
        container.pivot.y = container.height / 2;
        container.x = this.app.screen.width / 2;
        container.y = this.app.screen.height / 2;
        // graphics.height = container.height;
        // graphics.width = container.width;
        graphics.pivot.x = container.pivot.x;
        graphics.pivot.y = container.pivot.y;

        text.anchor.set(0.5);
        hub.anchor.set(0.5);
        hub.width = 50;
        hub.height = 50;
        text.x = container.width / 2;
        text.y = container.height / 2 + 50;
        hub.x = container.width / 2;
        hub.y = container.height / 2;
        container.eventMode = 'dynamic';
        container.on(
          'pointerdown',
          () => this.onDragStart(container),
          container
        );
        container.cursor = 'pointer';
        container.addChild(hub, text, graphics);
        this.app.stage.addChild(container);
      });
    });
    // Assets.add('hub', 'assets/hub.png',{ scaleMode: SCALE_MODES.NEAREST });
  }
  regularpolygon(graphics: Graphics, radius: number, sides: number) {
    if (sides < 3) return;

    let a = (Math.PI * 2) / sides;

    graphics.moveTo(radius, 0);

    for (let i = 1; i < sides; i++) {
      graphics.lineTo(radius * Math.cos(a * i), radius * Math.sin(a * i));
    }

    graphics.closePath();
  }

  onDragMove(event: FederatedPointerEvent) {
    if (this.dragTarget) {
      this.dragTarget.parent.toLocal(
        event.global,
        null,
        this.dragTarget.position
      );
    }
  }

  onDragStart(displayObject: DisplayObject) {
    displayObject.alpha = 0.5;

    this.dragTarget = displayObject;
    this.app.stage.on('pointermove', (event) => this.onDragMove(event));
  }

  onDragEnd() {
    if (this.dragTarget) {
      this.app.stage.off('pointermove', (event) => this.onDragMove(event));
      this.dragTarget.alpha = 1;
      this.dragTarget = null;
    }
  }
}
