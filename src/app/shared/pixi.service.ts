import { Injectable } from '@angular/core';
import {
  Application,
  DisplayObject,
  FederatedPointerEvent,
  Graphics,
  Text,
} from 'pixi.js';
import { Connector } from './models/connector.model';

@Injectable({ providedIn: 'root' })
export class PixiService {
  app: Application | undefined;
  dragTarget: DisplayObject | undefined;

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
    this.app!.stage.on('pointermove', (event) => this.onDragMove(event));
  }

  onDragEnd(assets: Connector[]) {
    if (this.dragTarget) {
      this.app!.stage.off('pointermove', (event) => this.onDragMove(event));
      this.reDrawConnection(assets);
      this.dragTarget.alpha = 1;
      this.dragTarget = undefined;
    }
  }

  private reDrawConnection(assets: Connector[]) {
    const target = assets.find((asset) => asset.ip === this.dragTarget?.name)!;
    target?.connections.forEach((connection) => {
      const toIp = connection.toIp;
      if (
        this.app!.stage.getChildByName(`{toIp:${toIp},fromIp:${target!.ip}}`)
      ) {
        this.app!.stage.removeChild(
          this.app!.stage.getChildByName(`{toIp:${toIp},fromIp:${target!.ip}}`)!
        );
      }
      if (
        this.app!.stage.getChildByName(`{toIp:${target!.ip},fromIp:${toIp}}`)
      ) {
        this.app!.stage.removeChild(
          this.app!.stage.getChildByName(`{toIp:${target!.ip},fromIp:${toIp}}`)!
        );
      }
      if (toIp) {
        const connect = new Graphics();
        connect.lineStyle(2, 0x000000, 1);
        if (target.type === 'router') {
          const moveTo = this.lineToPoint(
            connect,
            target.nodeCount,
            this.dragTarget!.position.x,
            this.dragTarget!.position.y,
            connection.fromHub ?? 0
          );
          connect.moveTo(moveTo.x, moveTo.y);
        } else {
          connect.moveTo(
            this.dragTarget!.position.x,
            this.dragTarget!.position.y
          );
        }
        const toContainer = this.app!.stage.getChildByName(toIp);
        const toAsset = assets.find((asset) => asset.ip === toIp);

        if (toAsset?.nodeCount) {
          const lineTo = this.lineToPoint(
            connect,
            toAsset.nodeCount,
            toContainer!.position.x,
            toContainer!.position.y,
            connection.toHub ?? 0
          );
          connect.lineTo(lineTo.x, lineTo.y);
        } else {
          connect.lineTo(toContainer!.position.x, toContainer!.position.y);
        }
        connect.name = `{toIp:${toIp},fromIp:${target.ip}}`;
        this.app!.stage.addChild(connect);
      }
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
}
