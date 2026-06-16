"use client";

// style
import styles from "./page.module.scss";
// React
import { useRef, useEffect, useState } from "react";
// Next
import { useRouter } from "next/navigation";
import Image from "next/image";
// UI component
import Button from '@mui/material/Button';
// my component
import Footer from "@/app/components/footer";
import InfoText from "@/app/components/infoText";
// context
import { useThumbnail } from "@/app/_context/ThumbnailContext";

/** 選択可能なアスペクト比（背景用） */
type AspectRatio = "original" | "1:1" | "4:3" | "16:9";

const ASPECT_RATIO_OPTIONS: Array<{ value: AspectRatio; label: string }> = [
  { value: "original", label: "Original" },
  { value: "1:1",      label: "1:1" },
  { value: "4:3",      label: "4:3" },
  { value: "16:9",     label: "16:9" },
];

/** 枠画像の描画モード */
type DesignFitMode = "stretch" | "contain";

const DESIGN_FIT_OPTIONS: Array<{ value: DesignFitMode; label: string }> = [
  { value: "stretch", label: "引き延ばし" },
  { value: "contain", label: "中央配置" },
];

/** Canvas の基準幅（px） */
const BASE_WIDTH = 1280;

/**
 * アスペクト比指定から Canvas サイズを計算する
 * Original の場合は背景画像の自然サイズのアスペクト比を使用する
 */
function calcCanvasSize(
  ratio: AspectRatio,
  naturalWidth?: number,
  naturalHeight?: number,
): { width: number; height: number } {
  if (ratio === "1:1")  return { width: BASE_WIDTH, height: BASE_WIDTH };
  if (ratio === "4:3")  return { width: BASE_WIDTH, height: Math.round(BASE_WIDTH * 3 / 4) };
  if (ratio === "16:9") return { width: BASE_WIDTH, height: Math.round(BASE_WIDTH * 9 / 16) };
  // original
  if (naturalWidth && naturalHeight) {
    return { width: BASE_WIDTH, height: Math.round(BASE_WIDTH * naturalHeight / naturalWidth) };
  }
  return { width: BASE_WIDTH, height: Math.round(BASE_WIDTH * 9 / 16) };
}

/**
 * 背景画像を Canvas に cover 描画する（中央クリッピング）
 * 短辺側を Canvas に合わせてスケールし、長辺側のはみ出しを切り捨てる
 */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
): void {
  const scale = Math.max(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
  const drawW = img.naturalWidth  * scale;
  const drawH = img.naturalHeight * scale;
  const drawX = (canvasW - drawW) / 2;
  const drawY = (canvasH - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}


export default function Thumbnails () {
  // context
  const { canvasDataUrl, setCanvasDataUrl } = useThumbnail();
  const router = useRouter();
  // 状態管理（戻ってきたときにコンテキストから復元フラグを初期化）
  const [caputuredImage, setCaputuredImage] = useState<string|undefined>(undefined);
  const [selectedDesign, setSelectedDesign] = useState<string|undefined>(undefined);
  // Canvas復元が完了するまで false にしてボタン表示を保留する
  const [generatedFlag, setgeneratedFlag] = useState<boolean>(false);
  const [bgAspectRatio,  setBgAspectRatio]  = useState<AspectRatio>("16:9");
  const [designFitMode, setDesignFitMode] = useState<DesignFitMode>("stretch");
  // ref
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const caputuredImageRef = useRef<HTMLInputElement>(null!);
  const selectedDesignRef = useRef<HTMLInputElement>(null!);

  // 値が差し替わったときのみ古い ObjectURL を revoke する（毎レンダリングで revoke しない）
  useEffect(() => {
    return () => { if (caputuredImage) URL.revokeObjectURL(caputuredImage); };
  }, [caputuredImage]);

  useEffect(() => {
    return () => { if (selectedDesign) URL.revokeObjectURL(selectedDesign); };
  }, [selectedDesign]);

  // 文字編集ページから戻ってきたときにキャンバスを復元
  useEffect(() => {
    if (!canvasDataUrl || !canvasRef.current) return;
    // next/image の Image と衝突しないよう document.createElement を使用
    const img = document.createElement('img');
    // onload を src より先に登録してイベント取りこぼしを防ぐ
    img.onload = () => {
      if (!canvasRef.current) return;
      // 保存済み画像の実寸でキャンバスを復元する
      canvasRef.current.width  = img.naturalWidth;
      canvasRef.current.height = img.naturalHeight;
      const ctx = canvasRef.current.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      // Canvas 描画完了後にボタンを表示（空白状態でのダウンロードを防ぐ）
      setgeneratedFlag(true);
    };
    img.src = canvasDataUrl;
  // マウント時のみ実行（依存配列を空にすることで初回のみ復元）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ファイル選択ボタンが押下されたら input 要素にイベントを伝播する */
  const fileInputHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    const targetId = event.currentTarget.id;
    switch (targetId) {
      case 'caputuredImageBtn':
          caputuredImageRef.current.click();
          break;
      case 'selectedDesignBtn':
          selectedDesignRef.current.click();
          break;
    }
  }

  /** ローカルの画像ファイルを選択する際の処理 */
  const selectedFileHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    // files が null または空 FileList の場合は undefined を設定する
    const fileObject = event.target.files?.[0];
    if (event.target.id === "caputuredImage") {
      setCaputuredImage(fileObject ? URL.createObjectURL(fileObject) : undefined);
    }
    if (event.target.id === "selectedDesign") {
      setSelectedDesign(fileObject ? URL.createObjectURL(fileObject) : undefined);
    }
  }

  /**
   * 作成ボタンの処理
   * 背景はアスペクト比指定でキャンバスサイズを決定しcover描画（中央クリッピング）
   * 枠は描画モードに従ってストレッチまたは中央配置で描画する
   */
  const generateHandler = async (_event: React.MouseEvent<HTMLButtonElement>) => {
    if(!canvasRef.current) return;
    if (caputuredImage && selectedDesign) {
      try {
        const canvas = canvasRef.current;

        // onload/onerrorをsrc設定より先に登録してイベント取りこぼしを防ぐ
        const loadImage = (src: string): Promise<HTMLImageElement> =>
          new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });

        const [bgImg, designImg] = await Promise.all([
          loadImage(caputuredImage),
          loadImage(selectedDesign),
        ]);

        // 背景のアスペクト比に従って Canvas サイズを決定してからコンテキストを取得
        const { width: canvasW, height: canvasH } = calcCanvasSize(
          bgAspectRatio,
          bgImg.naturalWidth,
          bgImg.naturalHeight,
        );
        canvas.width  = canvasW;
        canvas.height = canvasH;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 背景は cover（中央クリッピング）で描画
        drawCover(ctx, bgImg, canvasW, canvasH);

        // 枠はモード指定に従って描画
        if (designFitMode === "stretch") {
          // キャンバス全体にストレッチ
          ctx.drawImage(designImg, 0, 0, canvasW, canvasH);
        } else {
          // Original比率を保ちキャンバスに収まる最大サイズで中央配置
          const scale = Math.min(canvasW / designImg.naturalWidth, canvasH / designImg.naturalHeight);
          const drawW = Math.round(designImg.naturalWidth  * scale);
          const drawH = Math.round(designImg.naturalHeight * scale);
          const drawX = Math.round((canvasW - drawW) / 2);
          const drawY = Math.round((canvasH - drawH) / 2);
          ctx.drawImage(designImg, drawX, drawY, drawW, drawH);
        }

        // コンテキストにキャンバスデータを保存（文字編集ページで使用）
        setCanvasDataUrl(canvas.toDataURL('image/png'));
        setgeneratedFlag(true);
      } catch {
        alert('画像の読み込みに失敗しました。ファイルを確認してください。');
      }
    }
    else {
      alert('ファイルを選択してください');
    }
  }

  /** Canvas 要素を保存するボタンの処理 */
  const fileSaveHandler = (_event: React.MouseEvent<HTMLButtonElement>) => {
    if (!canvasRef.current) return;
    const date = new Date();
    const day = date.toLocaleDateString('ja-JP');
    const timestamp = date.toLocaleTimeString('ja-JP');
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.7);
    link.download = `${day}_${timestamp}_thumbnail.jpeg`;
    link.click();
  }

  /** 文字を入れるボタンの処理 */
  const navigateToTextEditor = () => {
    router.push('/text-editor');
  }

  /** リセットボタンの処理 */
  const resetHandler = (_event: React.MouseEvent<HTMLButtonElement>) => {
    // キャンバス周りをリセット
    canvasRef.current.width = 0;
    canvasRef.current.height = 0;
    // ファイル指定をリセット
    caputuredImageRef.current.value = '';
    selectedDesignRef.current.value = '';
    // 状態をリセット
    setCaputuredImage(undefined);
    setSelectedDesign(undefined);
    setgeneratedFlag(false);
    // コンテキストをリセット
    setCanvasDataUrl(undefined);
  }

  return (
    <main className={styles.main}>
      <h1>Thumbnail Generator</h1>
      <InfoText/>
      <div className={styles.inputArea}>
        <dl className={styles.inputImage}>
          <dt>Base photo</dt>
          <dd>
            <Button
              onClick={fileInputHandler}
              id="caputuredImageBtn"
              color="primary"
              size="large"
              variant="contained"
            >ファイル選択</Button>
            <input
              ref={caputuredImageRef}
              id="caputuredImage"
              type="file"
              accept="image/*"
              onChange={selectedFileHandler}
              hidden
            />
          </dd>
          {/* アスペクト比選択ラジオボタン */}
          <dd>
            <span className={styles.aspectRatioLabel}>アスペクト比</span>
            <div className={styles.aspectRatioGroup}>
              {ASPECT_RATIO_OPTIONS.map(({ value, label }) => (
                <label key={value} className={styles.aspectRatioOption}>
                  <input
                    type="radio"
                    name="bgAspectRatio"
                    value={value}
                    checked={bgAspectRatio === value}
                    onChange={() => setBgAspectRatio(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </dd>
          {/* イメージ要素はファイルが選択されている場合のみ表示 */}
          {caputuredImage && (
            <dd className={styles.inputImageBox}>
              <Image
                id="caputuredImageFile"
                src={caputuredImage}
                alt="キャプチャ画像"
                width={160}
                height={90}
              />
            </dd>
          )}
        </dl>
        <dl className={styles.inputImage}>
          <dt>Decorative image</dt>
          <dd>
            <Button
              onClick={fileInputHandler}
              id="selectedDesignBtn"
              color="primary"
              size="large"
              variant="contained"
            >ファイル選択</Button>
            <input
              ref={selectedDesignRef}
              id="selectedDesign"
              type="file"
              accept="image/png"
              onChange={selectedFileHandler}
              hidden
            />
          </dd>
          {/* 描画モード選択ラジオボタン */}
          <dd>
            <span className={styles.aspectRatioLabel}>描画モード</span>
            <div className={styles.aspectRatioGroup}>
              {DESIGN_FIT_OPTIONS.map(({ value, label }) => (
                <label key={value} className={styles.aspectRatioOption}>
                  <input
                    type="radio"
                    name="designFitMode"
                    value={value}
                    checked={designFitMode === value}
                    onChange={() => setDesignFitMode(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </dd>
          {/* イメージ要素はファイルが選択されている場合のみ表示 */}
          {selectedDesign && (
            <dd className={styles.inputImageBox}>
              <Image
                id="selectedDesignFile"
                src={selectedDesign}
                alt="デザイン"
                width={160}
                height={90}
              />
            </dd>
          )}
        </dl>
      </div>

      <div className={styles.outputArea}>
        <dl className={styles.outputImage}>
          <dt>Output</dt>
          <dd className={styles.outputImageBox}>
            <canvas ref={canvasRef} id="canvas" width='0' height='0'></canvas>
          </dd>
        </dl>
        <ul className={styles.buttonArea}>
          {!generatedFlag &&(
            <li className={styles.buttonBox}>
              <Button onClick={generateHandler} color="secondary" size="large" variant="contained">作成</Button>
            </li>
          )}
          {generatedFlag && (
            <>
              <li className={styles.buttonBox}>
                <Button onClick={fileSaveHandler} color="primary" size="large" variant="contained">ダウンロード</Button>
              </li>
              <li className={styles.buttonBox}>
                <Button onClick={navigateToTextEditor} color="secondary" size="large" variant="contained">文字を入れる</Button>
              </li>
            </>
          )}
          <li>
            <Button onClick={resetHandler} color="primary" size="large" variant="outlined">リセット</Button>
          </li>
        </ul>
      </div>
      <Footer/>
    </main>
  )
}
