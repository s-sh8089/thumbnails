"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import { useThumbnail } from "@/app/_context/ThumbnailContext";
import Footer from "@/app/components/footer";
import styles from "./page.module.scss";

// テキストの端からのパディング（px）
const PADDING = 50;

// テキスト配置位置の型（垂直-水平の組み合わせ）
type TextPosition =
  | "top-left"    | "top-center"    | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

// フォント選択肢（Canvas APIで使用するfont-family名）
const FONT_OPTIONS = [
  { label: "Noto Sans JP",        value: '"Noto Sans JP"' },
  { label: "Noto Serif JP",       value: '"Noto Serif JP"' },
  { label: "Dela Gothic One",     value: '"Dela Gothic One"' },
  { label: "M PLUS Rounded 1c",  value: '"M PLUS Rounded 1c"' },
  { label: "Zen Kaku Gothic New", value: '"Zen Kaku Gothic New"' },
] as const;

// 位置プリセットグリッド（3×3）
const POSITION_GRID: Array<{ value: TextPosition; label: string; title: string }> = [
  { value: "top-left",      label: "↖", title: "左上" },
  { value: "top-center",    label: "↑", title: "中央上" },
  { value: "top-right",     label: "↗", title: "右上" },
  { value: "middle-left",   label: "←", title: "左中央" },
  { value: "middle-center", label: "●", title: "中央" },
  { value: "middle-right",  label: "→", title: "右中央" },
  { value: "bottom-left",   label: "↙", title: "左下" },
  { value: "bottom-center", label: "↓", title: "中央下" },
  { value: "bottom-right",  label: "↘", title: "右下" },
];

export default function TextEditor() {
  const router = useRouter();
  const { canvasDataUrl } = useThumbnail();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [text, setText] = useState<string>("");
  const [fontFamily, setFontFamily] = useState<string>('"Noto Sans JP"');
  const [fontSize, setFontSize] = useState<number>(80);
  const [color, setColor] = useState<string>("#ffffff");
  const [position, setPosition] = useState<TextPosition>("middle-center");

  // ベース画像がない場合はメインページにリダイレクト
  useEffect(() => {
    if (!canvasDataUrl) {
      router.replace("/");
    }
  }, [canvasDataUrl, router]);

  /**
   * テキスト・スタイル・位置が変わるたびにCanvasを再描画する
   * ベース画像の自然サイズをキャンバスサイズとして使用し、テキストを合成する
   */
  const drawCanvas = useCallback(async () => {
    if (!canvasRef.current || !canvasDataUrl) return;
    const canvas = canvasRef.current;

    // ベース画像を読み込んでからキャンバスサイズを確定する（onload → src の順）
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = canvasDataUrl;
    });

    // ベース画像の自然サイズをそのままキャンバスサイズとして使用
    const canvasW = img.naturalWidth;
    const canvasH = img.naturalHeight;
    canvas.width  = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, canvasW, canvasH);

    if (!text.trim()) return;

    // フォントが読み込まれるまで待機
    await document.fonts.ready;

    const lines = text.split("\n");
    const lineHeight = fontSize * 1.4;
    // テキストブロック全体の高さ（先頭文字上端から末尾文字上端＋fontSize分まで）
    const totalHeight = (lines.length - 1) * lineHeight + fontSize;

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    // Y座標の基準を文字上端に統一することでtop/bottomの余白を対称にする
    ctx.textBaseline = "top";

    // 水平位置・textAlign の設定
    const [vertPart, horizPart] = position.split("-");
    let x: number;
    if (horizPart === "left") {
      ctx.textAlign = "left";
      x = PADDING;
    } else if (horizPart === "center") {
      ctx.textAlign = "center";
      x = canvasW / 2;
    } else {
      ctx.textAlign = "right";
      x = canvasW - PADDING;
    }

    // 垂直位置の先頭行上端Y座標を計算（textBaseline="top"基準）
    let startY: number;
    if (vertPart === "top") {
      startY = PADDING;
    } else if (vertPart === "middle") {
      startY = (canvasH - totalHeight) / 2;
    } else {
      startY = canvasH - PADDING - totalHeight;
    }

    lines.forEach((line, i) => {
      ctx.fillText(line, x, startY + i * lineHeight);
    });
  }, [canvasDataUrl, text, fontFamily, fontSize, color, position]);

  useEffect(() => {
    // 未処理のPromise rejectionを防ぐため void で明示的に破棄する
    void drawCanvas();
  }, [drawCanvas]);

  /** タイムスタンプ（ISO形式）をファイル名にしてJPEGをダウンロードする */
  const downloadHandler = () => {
    if (!canvasRef.current) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/jpeg", 0.7);
    link.download = `${timestamp}.jpeg`;
    link.click();
  };

  /** メインページに戻る（コンテキストのキャンバスデータは保持） */
  const backHandler = () => {
    router.push("/");
  };

  return (
    <main className={styles.main}>
      <h1>Writing</h1>

      {/* フォントをブラウザにプリロードさせるための非表示要素（FONT_OPTIONSから生成） */}
      <div className={styles.fontPreloader} aria-hidden="true">
        {FONT_OPTIONS.map((opt) => (
          <span key={opt.value} style={{ fontFamily: opt.value }}>a</span>
        ))}
      </div>

      {/* プレビュー（上部・フル幅） */}
      <dl className={styles.previewArea}>
        <dt>Preview</dt>
        <dd>
          <canvas ref={canvasRef} className={styles.canvas} />
        </dd>
      </dl>

      {/* コントロールパネル（下部・横並び） */}
      <section className={styles.controlPanel}>

        {/* テキスト入力 */}
        <div className={styles.controlGroupText}>
          <label className={styles.label} htmlFor="text-input">テキスト</label>
          <textarea
            id="text-input"
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={"テキストを入力\n改行で複数行"}
          />
        </div>

        {/* スタイル設定（フォント・サイズ・色） */}
        <div className={styles.controlGroupStyle}>
          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="font-select">フォント</label>
            <select
              id="font-select"
              className={styles.select}
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              style={{ fontFamily: fontFamily }}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="font-size">
              フォントサイズ: <span className={styles.valueDisplay}>{fontSize}px</span>
            </label>
            <input
              id="font-size"
              type="range"
              className={styles.range}
              min={20}
              max={300}
              step={2}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="color-input">文字色</label>
            <div className={styles.colorPickerRow}>
              <input
                id="color-input"
                type="color"
                className={styles.colorPicker}
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span className={styles.colorValue}>{color}</span>
            </div>
          </div>
        </div>

        {/* テキスト位置（9パターンプリセット） */}
        <div className={styles.controlGroupPosition}>
          <span className={styles.label}>テキスト位置</span>
          <div className={styles.positionGrid}>
            {POSITION_GRID.map(({ value, label, title }) => (
              <button
                key={value}
                type="button"
                className={`${styles.positionBtn} ${position === value ? styles.positionBtnActive : ""}`}
                onClick={() => setPosition(value)}
                title={title}
                aria-label={title}
                aria-pressed={position === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {/* アクションボタン（コントロールパネルとは独立したセクション） */}
        <div className={styles.buttonSection}>
          <Button
            onClick={downloadHandler}
            color="primary"
            size="large"
            variant="contained"
          >
            ダウンロード
          </Button>
          <Button
            onClick={backHandler}
            color="primary"
            size="large"
            variant="outlined"
          >
            戻る
          </Button>
        </div>
      </section>



      <Footer />
    </main>
  );
}
