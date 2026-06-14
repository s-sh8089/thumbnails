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


export default function Thumbnails () {
  // 定数
  const imageWidth = 1280;
  const imageHeight = 720;
  // context
  const { canvasDataUrl, setCanvasDataUrl } = useThumbnail();
  const router = useRouter();
  // 状態管理（戻ってきたときにコンテキストから復元フラグを初期化）
  const [caputuredImage, setCaputuredImage] = useState<string|undefined>(undefined);
  const [selectedDesign, setSelectedDesign] = useState<string|undefined>(undefined);
  const [generatedFlag, setgeneratedFlag] = useState<boolean>(!!canvasDataUrl);
  // ref
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const caputuredImageRef = useRef<HTMLInputElement>(null!);
  const selectedDesignRef = useRef<HTMLInputElement>(null!);

  useEffect(()=> {
    return () => {
      // メモリリーク？の対策。おまじない。
      if (caputuredImage && selectedDesign) {
        URL.revokeObjectURL(caputuredImage);
        URL.revokeObjectURL(selectedDesign);
      }
    }
  })

  // 文字編集ページから戻ってきたときにキャンバスを復元
  useEffect(() => {
    if (!canvasDataUrl || !canvasRef.current) return;
    // next/image の Image と衝突しないよう document.createElement を使用
    const img = document.createElement('img');
    img.src = canvasDataUrl;
    img.onload = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = imageWidth;
      canvasRef.current.height = imageHeight;
      const ctx = canvasRef.current.getContext('2d');
      ctx?.drawImage(img, 0, 0);
    };
  // マウント時のみ実行（依存配列を空にすることで初回のみ復元）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ファイル選択ボタンが押下されたらinput要素にイベントを伝播する
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

  // ローカルの画像ファイルを選択する際の処理
  const selectedFileHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileObject = event.target.files[0];
      if (event.target.id === "caputuredImage") {
        setCaputuredImage(URL.createObjectURL(fileObject));
      }
      if (event.target.id === "selectedDesign") {
        setSelectedDesign(URL.createObjectURL(fileObject));
      }
    } else {
      if (event.target.id === "caputuredImage") {
        setCaputuredImage(undefined);
      }
      if (event.target.id === "selectedDesign") {
        setSelectedDesign(undefined);
      }
    }
  }

  // 作成ボタンの処理（画像の読み込みを待ってからCanvas描画）
  const generateHandler = async (_event: React.MouseEvent<HTMLButtonElement>) => {
    if(!canvasRef.current) return;
    if (caputuredImage && selectedDesign) {
      const canvas = canvasRef.current;
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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

      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(designImg, 0, 0, canvas.width, canvas.height);

      // コンテキストにキャンバスデータを保存（文字編集ページで使用）
      setCanvasDataUrl(canvas.toDataURL('image/png'));
      setgeneratedFlag(true);
    }
    else {
      alert('ファイルを選択してください');
    }
  }

  // Canvas要素を保存するボタンの処理
  const fileSaveHandler = (_event: React.MouseEvent<HTMLButtonElement>) => {
    if (!canvasRef.current) return;
    const date = new Date();
    const day = date.toLocaleDateString('ja-JP');
    const timestamp = date.toLocaleTimeString('ja-JP');
    let link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.7);
    link.download = `${day}_${timestamp}_thumbnail.jpeg`;
    link.click();
  }

  // 文字を入れるボタンの処理
  const navigateToTextEditor = () => {
    router.push('/text-editor');
  }

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
              <Button onClick={generateHandler} color="primary" size="large" variant="contained">作成</Button>
            </li>
          )}
          {generatedFlag && (
            <>
              <li className={styles.buttonBox}>
                <Button onClick={fileSaveHandler} color="primary" size="large" variant="contained">保存</Button>
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
