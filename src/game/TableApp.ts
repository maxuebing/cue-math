import { Application, Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import {
  TABLE_W,
  TABLE_H,
  RAIL_WIDTH,
  CORNER_POCKET_R,
  MID_POCKET_R,
  BALL_RADIUS,
  DIAMONDS_PER_SIDE,
  COLORS,
  ANIM_SPEED,
} from './constants';
import { tweenAlongPath, type PathAnimationHandle } from './animator';
import type { Cushion, Point, Question } from './types';

/** 库边点击回调：参数为用户点击投影到库边上的撞点 */
export type PickPointCallback = (pt: Point) => void;

/** 点击热区沿库边法线方向的容错厚度（像素） */
const HIT_BAND = 46;

/** 当前撞库边高亮带宽度（像素） */
const HIGHLIGHT_WIDTH = 6;

/** 画布设计尺寸（含库边） */
const DESIGN_W = TABLE_W + RAIL_WIDTH * 2;
const DESIGN_H = TABLE_H + RAIL_WIDTH * 2;

/**
 * PixiJS 渲染层封装 —— 中式八球桌（竖向）
 *
 * 职责：
 * - 初始化 / 销毁 Application
 * - 绘制蓝台呢、6 袋口（4 角 + 2 中袋）、每边颗星刻度点
 * - 渲染母球 / 目标球 / 障碍球
 * - 高亮当前撞库边（第一库），库边点击热区
 * - 母球沿折线的 Tween 动画（由内部 ticker 驱动）
 */
export class TableApp {
  private readonly app = new Application();

  private readonly world = new Container();
  private readonly tableLayer = new Container();
  private readonly highlightLayer = new Container();
  private readonly trackLayer = new Container();
  private readonly ballLayer = new Container();
  private readonly hitLayer = new Container();

  private cueBall: Graphics | null = null;
  private currentAnim: PathAnimationHandle | null = null;
  private onPick: PickPointCallback | null = null;
  private mounted = false;
  private resizeObserver: ResizeObserver | null = null;

  /** 初始化并挂载到 DOM 容器 */
  async mount(container: HTMLElement): Promise<void> {
    await this.app.init({
      width: DESIGN_W,
      height: DESIGN_H,
      background: COLORS.rail,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    const canvas = this.app.canvas;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '8px';
    container.appendChild(canvas);

    /* 按容器尺寸 contain 缩放，并监听容器尺寸变化自适应 */
    this.fit(container);
    this.resizeObserver = new ResizeObserver(() => this.fit(container));
    this.resizeObserver.observe(container);

    this.world.x = RAIL_WIDTH;
    this.world.y = RAIL_WIDTH;
    this.app.stage.addChild(this.world);
    this.world.addChild(
      this.tableLayer,
      this.highlightLayer,
      this.trackLayer,
      this.ballLayer,
      this.hitLayer,
    );

    this.drawCloth();
    this.drawPockets();
    this.drawDiamonds();

    this.app.ticker.add(() => {
      if (this.currentAnim) {
        this.currentAnim.update(performance.now());
      }
    });

    /* stage 参与事件系统，确保 pointer 事件向下传播到库边热区 */
    this.app.stage.eventMode = 'static';

    this.mounted = true;
  }

  /** 设置库边点击回调 */
  setOnPick(cb: PickPointCallback): void {
    this.onPick = cb;
  }

  /** 启用 / 禁用库边点击热区（仅 Wait_Input 状态启用） */
  enableInput(enabled: boolean): void {
    this.hitLayer.interactiveChildren = enabled;
  }

  /** 渲染一道题：放置母球 / 目标球 / 障碍球，高亮第一库，建立热区 */
  renderQuestion(q: Question): void {
    this.clearTrack();
    this.ballLayer.removeChildren();
    this.cueBall = this.makeBall(q.cueBall, COLORS.cueBall, 0x999999);
    const targetBall = this.makeBall(q.targetBall, COLORS.targetBall, 0xb45309);
    const obstacle = this.makeBall(q.obstacle, COLORS.obstacle, 0x374151);
    this.ballLayer.addChild(this.cueBall, targetBall, obstacle);

    this.drawHighlight(q.cushions[0]);
    this.setupHitArea(q.cushions[0]);
  }

  /** 播放命中动画：绿色实线轨迹 + 母球沿正确路径滑行 */
  playCorrect(path: Point[], onDone: () => void): void {
    this.clearTrack();
    this.trackLayer.addChild(this.drawPath(path, COLORS.trackCorrect, 0.85, false));
    this.runAnim(path, onDone);
  }

  /**
   * 播放错误动画：先画红色虚线用户路线 + 母球沿之滑行，
   * 完成后叠加绿色实线正确轨迹
   */
  playWrong(userPath: Point[], realPath: Point[], onDone: () => void): void {
    this.clearTrack();
    this.trackLayer.addChild(this.drawPath(userPath, COLORS.trackWrong, 0.6, true));
    this.runAnim(userPath, () => {
      this.trackLayer.addChild(this.drawPath(realPath, COLORS.trackCorrect, 0.85, false));
      onDone();
    });
  }

  /** 销毁应用，释放资源 */
  destroy(): void {
    if (!this.mounted) {
      return;
    }
    this.stopAnim();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.app.destroy({ removeView: true }, { children: true });
    this.mounted = false;
  }

  /* ---------- 私有：响应式缩放 ---------- */

  /** 按容器尺寸 contain 缩放画布（保持比例，不溢出） */
  private fit(container: HTMLElement): void {
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw === 0 || ch === 0) {
      return;
    }
    const scale = Math.min(cw / DESIGN_W, ch / DESIGN_H);
    const canvas = this.app.canvas;
    canvas.style.width = `${Math.floor(DESIGN_W * scale)}px`;
    canvas.style.height = `${Math.floor(DESIGN_H * scale)}px`;
  }

  /* ---------- 私有：球桌绘制 ---------- */

  /** 蓝色台呢 */
  private drawCloth(): void {
    const felt = new Graphics();
    felt.rect(0, 0, TABLE_W, TABLE_H).fill(COLORS.cloth);
    this.tableLayer.addChild(felt);
  }

  /** 6 个袋口：4 角袋 + 左右中袋 */
  private drawPockets(): void {
    const g = new Graphics();
    const corners: Point[] = [
      { x: 0, y: 0 },
      { x: TABLE_W, y: 0 },
      { x: 0, y: TABLE_H },
      { x: TABLE_W, y: TABLE_H },
    ];
    for (const c of corners) {
      g.circle(c.x, c.y, CORNER_POCKET_R).fill(COLORS.pocket);
    }
    g.circle(0, TABLE_H / 2, MID_POCKET_R).fill(COLORS.pocket);
    g.circle(TABLE_W, TABLE_H / 2, MID_POCKET_R).fill(COLORS.pocket);
    this.tableLayer.addChild(g);
  }

  /** 每条库边 6 颗星（长边避开中袋） */
  private drawDiamonds(): void {
    const g = new Graphics();
    /* 顶 / 底短边：均匀 6 颗 */
    for (let i = 1; i <= DIAMONDS_PER_SIDE; i++) {
      const x = (TABLE_W * i) / (DIAMONDS_PER_SIDE + 1);
      g.circle(x, 0, 3).fill(COLORS.diamond);
      g.circle(x, TABLE_H, 3).fill(COLORS.diamond);
    }
    /* 左 / 右长边：避开中袋（y = TABLE_H/2），上下各 3 颗 */
    const ratios = [1 / 8, 2 / 8, 3 / 8, 5 / 8, 6 / 8, 7 / 8];
    for (const r of ratios) {
      const y = TABLE_H * r;
      g.circle(0, y, 3).fill(COLORS.diamond);
      g.circle(TABLE_W, y, 3).fill(COLORS.diamond);
    }
    this.tableLayer.addChild(g);
  }

  /** 高亮当前第一库边（金色带） */
  private drawHighlight(cushion: Cushion): void {
    this.highlightLayer.removeChildren();
    const g = new Graphics();
    const fill = { color: COLORS.cushionHighlight, alpha: 0.65 };
    switch (cushion) {
      case 'top':
        g.rect(0, 0, TABLE_W, HIGHLIGHT_WIDTH).fill(fill);
        break;
      case 'bottom':
        g.rect(0, TABLE_H - HIGHLIGHT_WIDTH, TABLE_W, HIGHLIGHT_WIDTH).fill(fill);
        break;
      case 'left':
        g.rect(0, 0, HIGHLIGHT_WIDTH, TABLE_H).fill(fill);
        break;
      case 'right':
        g.rect(TABLE_W - HIGHLIGHT_WIDTH, 0, HIGHLIGHT_WIDTH, TABLE_H).fill(fill);
        break;
    }
    this.highlightLayer.addChild(g);
  }

  /** 在第一库上建立点击热区 */
  private setupHitArea(cushion: Cushion): void {
    this.hitLayer.removeChildren();
    const area = new Graphics();
    const fill = { color: 0xffffff, alpha: 0 };
    switch (cushion) {
      case 'top':
        area.rect(0, 0, TABLE_W, HIT_BAND).fill(fill);
        break;
      case 'bottom':
        area.rect(0, TABLE_H - HIT_BAND, TABLE_W, HIT_BAND).fill(fill);
        break;
      case 'left':
        area.rect(0, 0, HIT_BAND, TABLE_H).fill(fill);
        break;
      case 'right':
        area.rect(TABLE_W - HIT_BAND, 0, HIT_BAND, TABLE_H).fill(fill);
        break;
    }
    area.eventMode = 'static';
    area.cursor = 'crosshair';
    area.on('pointerdown', (e: FederatedPointerEvent) => {
      /* event.global 是 stage 坐标，需减去 world 偏移得到台呢内坐标 */
      const wx = e.global.x - RAIL_WIDTH;
      const wy = e.global.y - RAIL_WIDTH;
      this.onPick?.(projectToCushion({ x: wx, y: wy }, cushion));
    });
    this.hitLayer.addChild(area);
    /* 默认禁用，等进入 Wait_Input 状态再开启 */
    this.hitLayer.interactiveChildren = false;
  }

  /* ---------- 私有：球与轨迹 ---------- */

  /** 创建球 Graphics（本地圆心在原点，用 position 定位） */
  private makeBall(pos: Point, color: number, strokeColor: number): Graphics {
    const g = new Graphics();
    g.circle(0, 0, BALL_RADIUS).fill(color);
    g.circle(0, 0, BALL_RADIUS).stroke({ color: strokeColor, width: 1.5 });
    g.position.set(pos.x, pos.y);
    return g;
  }

  /** 绘制折线轨迹：实线或虚线 */
  private drawPath(path: Point[], color: number, alpha: number, dashed: boolean): Graphics {
    const g = new Graphics();
    g.alpha = alpha;
    if (!dashed) {
      g.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        g.lineTo(path[i].x, path[i].y);
      }
      g.stroke({ color, width: 3 });
    } else {
      this.strokeDashedPolyline(g, path, color);
    }
    return g;
  }

  /** 沿折线绘制虚线（dash=10 / gap=8，最后统一 stroke） */
  private strokeDashedPolyline(g: Graphics, path: Point[], color: number): void {
    const dashLen = 10;
    const gapLen = 8;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) {
        continue;
      }
      const ux = dx / len;
      const uy = dy / len;
      let d = 0;
      while (d < len) {
        const sx = a.x + ux * d;
        const sy = a.y + uy * d;
        const e = Math.min(d + dashLen, len);
        const ex = a.x + ux * e;
        const ey = a.y + uy * e;
        g.moveTo(sx, sy);
        g.lineTo(ex, ey);
        d += dashLen + gapLen;
      }
    }
    g.stroke({ color, width: 3 });
  }

  /* ---------- 私有：动画 ---------- */

  private clearTrack(): void {
    this.stopAnim();
    this.trackLayer.removeChildren();
  }

  private runAnim(path: Point[], onDone: () => void): void {
    this.stopAnim();
    const ball = this.cueBall;
    if (!ball) {
      onDone();
      return;
    }
    this.currentAnim = tweenAlongPath(
      path,
      ANIM_SPEED,
      (pos) => {
        ball.position.set(pos.x, pos.y);
      },
      () => {
        this.currentAnim = null;
        onDone();
      },
    );
    this.currentAnim.start();
  }

  private stopAnim(): void {
    if (this.currentAnim) {
      this.currentAnim.stop();
      this.currentAnim = null;
    }
  }
}

/**
 * 把点击坐标投影到指定库边上（取库边方向坐标，法线方向归零）
 */
function projectToCushion(pt: Point, cushion: Cushion): Point {
  switch (cushion) {
    case 'top':
      return { x: clamp(pt.x, 0, TABLE_W), y: 0 };
    case 'bottom':
      return { x: clamp(pt.x, 0, TABLE_W), y: TABLE_H };
    case 'left':
      return { x: 0, y: clamp(pt.y, 0, TABLE_H) };
    case 'right':
      return { x: TABLE_W, y: clamp(pt.y, 0, TABLE_H) };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
