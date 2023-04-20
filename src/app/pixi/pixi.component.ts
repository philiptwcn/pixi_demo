import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import {
  Application,
  Assets,
  Container,
  Graphics,
  SCALE_MODES,
  Sprite,
  Text,
} from 'pixi.js';
import { MatDialog } from '@angular/material/dialog';
import { AddNodeDialogComponent } from './add-node-dialog/add-node-dialog.component';
import { Connector } from '../shared/models/connector.model';
import { Connection } from '../shared/models/connection.model';
import { PixiService } from '../shared/pixi.service';

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

  constructor(private dialog: MatDialog, private pixiService: PixiService) {}
  async ngAfterViewInit() {
    this.pixiService.app = this.app;
    this.pixiView?.nativeElement.appendChild(this.app.view as any);
    this.app.stage.eventMode = 'dynamic';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerup', () =>
      this.pixiService.onDragEnd(this.assets)
    );
    this.app.stage.on('pointerupoutside', () =>
      this.pixiService.onDragEnd(this.assets)
    );
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
        if (
          this.assets
            .find((asset) => asset.ip === toIp)!
            .connections.find(
              (connection) => connection.toIp === result.data.ip
            )
        ) {
          this.assets
            .find((asset) => asset.ip === toIp)!
            .connections.find(
              (connection) => connection.toIp === result.data.ip
            )!.fromIp = toIp;
          this.assets
            .find((asset) => asset.ip === toIp)!
            .connections.find(
              (connection) => connection.toIp === result.data.ip
            )!.toIp = result.data.ip;
          this.assets
            .find((asset) => asset.ip === toIp)!
            .connections.find(
              (connection) => connection.toIp === result.data.ip
            )!.fromHub = result.data.connections[0].toHub;
          this.assets
            .find((asset) => asset.ip === toIp)!
            .connections.find(
              (connection) => connection.toIp === result.data.ip
            )!.toHub = result.data.connections[0].fromHub;
        } else {
          this.assets
            .find((asset) => asset.ip === toIp)!
            .connections.push({
              fromIp: toIp,
              toIp: result.data.ip,
              fromHub: result.data.connections[0].toHub,
              toHub: result.data.connections[0].fromHub,
            } as Connection);
        }

        loadAssets.push(toIp);
      }
      const texturePromise = Assets.load(loadAssets);

      texturePromise.then((texture) => {
        const hub = Sprite.from(texture[asset.ip]);
        if (result.data.type === 'router') {
          borders.lineStyle(2, 0x000000, 1);
          this.pixiService.regularpolygon(borders, result.data.nodeCount);
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
          () => this.pixiService.onDragStart(container),
          container
        );
        container.cursor = 'pointer';
        container.addChild(hub, text, borders);
        container.name = asset.ip;

        if (toIp) {
          connection.lineStyle(2, 0x000000, 1);
          if (result.data.type === 'router') {
            const moveTo = this.pixiService.lineToPoint(
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
            const lineTo = this.pixiService.lineToPoint(
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
}
