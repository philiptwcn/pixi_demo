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
  assets: Connector[] = [];
  dragTarget: DisplayObject | undefined;

  constructor(private dialog: MatDialog) {}
  async ngAfterViewInit() {
    this.pixiView?.nativeElement.appendChild(this.app.view as any);
    this.app.stage.eventMode = 'dynamic';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerup', () => this.onDragEnd());
    this.app.stage.on('pointerupoutside', () => this.onDragEnd());
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AddNodeDialogComponent, {
      data: { assets: this.assets },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: { data: Connector }) => this.onAdd(result));
  }

  onAdd(result: { data: Connector }) {
    if (!result) {
      return;
    }
    this.assets.push(result.data);
    this.assets.forEach((asset, index) => {
      if (Assets.cache.has(asset.ip)) {
        return;
      }
      Assets.add(
        asset.ip,
        result.data.type === 'router'
          ? 'assets/hub.png'
          : 'assets/data-storage.png',
        {
          scaleMode: SCALE_MODES.NEAREST,
        }
      );
      const container = new Container();
      const borders = new Graphics();
      const connection = new Graphics();
      const text = new Text(asset.ip);
      const toIp: string | undefined = result.data.connections[0]?.toIp;
      const loadAssets = [asset.ip];

      if (toIp) {
        loadAssets.push(toIp);
      }
      const texturePromise = Assets.load(loadAssets);

      texturePromise.then((texture) => {
        const hub = Sprite.from(texture[asset.ip]);
        if (result.data.type === 'router') {
          borders.lineStyle(2, 0x000000, 1);
          this.regularpolygon(borders, result.data.nodeCount);
        }
        container.pivot = { x: container.width / 2, y: container.height / 2 };
        container.position = {
          x: this.app.screen.width / 2,
          y: this.app.screen.height / 2,
        };
        // graphics.height = container.height;
        // graphics.width = container.width;
        borders.pivot.x = container.pivot.x;
        borders.pivot.y = container.pivot.y;
        borders.name = `borders${asset.ip}`;

        text.anchor.set(0.5);
        hub.anchor.set(0.5);
        hub.width = 50;
        hub.height = 50;
        text.position = {
          x: container.width / 2,
          y: container.height / 2 + 50,
        };
        hub.position = {
          x: container.width / 2,
          y: container.height / 2,
        };
        container.eventMode = 'dynamic';
        container.on(
          'pointerdown',
          () => this.onDragStart(container),
          container
        );
        container.cursor = 'pointer';
        container.addChild(hub, text, borders);
        container.name = asset.ip;

        if (toIp) {
          connection.lineStyle(2, 0x000000, 1);
          if (result.data.type === 'router') {
            const moveTo = this.lineToPoint(
              connection,
              result.data.nodeCount,
              container.position.x,
              container.position.y,
              result.data.connections[0].fromHub ?? 0
            );
            connection.moveTo(moveTo.x, moveTo.y);
          } else {
            connection.moveTo(container.position.x, container.position.y);
          }
          const toContainer = this.app.stage.getChildByName(toIp);
          const toAsset = this.assets.find((asset) => asset.ip === toIp);

          if (toAsset?.nodeCount) {
            const lineTo = this.lineToPoint(
              connection,
              toAsset.nodeCount,
              toContainer!.position.x,
              toContainer!.position.y,
              result.data.connections[0].toHub ?? 0
            );
            connection.lineTo(lineTo.x, lineTo.y);
          } else {
            connection.lineTo(toContainer!.position.x, toContainer!.position.y);
          }
          connection.name = `{toIp:${toIp},fromIp:${asset.ip}}`;
          this.app.stage.addChild(connection);
        }
        this.app.stage.addChild(container);
      });
    });
  }
  lineToPoint(
    graphics: Graphics,
    sides: number,
    toX: number,
    toY: number,
    hub: number
  ) {
    let a = (Math.PI * 2) / sides;
    return {
      x: toX + 100 * Math.cos(a * (hub - 1)),
      y: toY + 100 * Math.sin(a * (hub - 1)),
    };
  }
  regularpolygon(graphics: Graphics, sides: number) {
    if (sides < 3) return;

    let a = (Math.PI * 2) / sides;

    const text = new Text(1);
    text.position = { x: 100, y: 0 };
    graphics.addChild(text);
    graphics.moveTo(100, 0);
    graphics.drawCircle(100, 0, 5);

    for (let i = 1; i < sides; i++) {
      const text = new Text(i + 1);
      text.position = {
        x: 100 * Math.cos(a * i) + 10,
        y: 100 * Math.sin(a * i) + 10,
      };
      graphics.lineTo(100 * Math.cos(a * i), 100 * Math.sin(a * i));
      graphics.drawCircle(100 * Math.cos(a * i), 100 * Math.sin(a * i), 5);
      graphics.addChild(text);
    }

    graphics.closePath();
  }

  onDragMove(event: FederatedPointerEvent) {
    if (this.dragTarget) {
      this.dragTarget.parent.toLocal(
        event.global,
        undefined,
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
      this.dragTarget = undefined;
    }
  }
}
