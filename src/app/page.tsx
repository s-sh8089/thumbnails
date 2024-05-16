"use client";

// style
import styles from "./page.module.scss";
// React
import { useRef, useEffect, useState } from "react";
// UI component
import { Button } from '@nextui-org/button';
// Next component
import Image from "next/image";
// my component
import Footer from "@/app/components/footer";


export default function Thumbnails () {
  // 定数
  const imageWidth = 1280;
  const imageHeight = 720;
  // 状態管理
  const [caputuredImage, setCaputuredImage] = useState<string|undefined>(undefined)
  const [selectedDesign, setSelectedDesign] = useState<string|undefined>(undefined)
  const [generatedFlag, setgeneratedFlag] = useState<boolean>(false)
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
    }else {
      if (event.target.id === "caputuredImage") {
        setCaputuredImage(undefined);
      }
      if (event.target.id === "selectedDesign") {
        setSelectedDesign(undefined);
      }
    }
  }

  // 作成ボタンの処理
  const generateHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    if(!canvasRef.current) return;
    if (caputuredImage && selectedDesign) {
      // 出力先のキャンバスサイズを指定
      canvasRef.current.width = imageWidth;
      canvasRef.current.height = imageHeight;
      const ctx = canvasRef.current.getContext('2d');
      // img要素(キャプチャ)を指定してcanvasに描画
      const caputuredImageFile = document.createElement('img');
      caputuredImageFile.src = caputuredImage;
      ctx?.drawImage(caputuredImageFile, 0, 0, canvasRef.current.width, canvasRef.current.height)
      // img要素(デザイン)を指定してcanvasに描画
      const selectedDesignFile = document.createElement('img');
      selectedDesignFile.src = selectedDesign;
      ctx?.drawImage(selectedDesignFile, 0, 0, canvasRef.current.width, canvasRef.current.height);
      // 生成済みフラグを更新
      setgeneratedFlag(true);
    }
    else {
      alert('ファイルを選択してください');
    }
  }

  // Canvas要素を保存するボタンの処理
  const fileSaveHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!canvasRef.current) return;
    const date = new Date();
    const day = date.toLocaleDateString('ja-JP');
    const timestamp = date.toLocaleTimeString('ja-JP')
    let link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/jpg');
    link.download = `${day}_${timestamp}_thumbnail.jpg`;
    link.click();
  }
  const resetHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
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
  }
  return (
    <main className={styles.main}>
      <h1>サムネイル作成</h1>
      <section className={styles.infoTextArea}>
        <h2>■ Info</h2>
        <div className={styles.textBox}>
          <h3>● 推奨している画像仕様</h3>
          <ul>
            <li>アスペクト比が16:9であるもの</li>
            <li>解像度が横1280×縦720</li>
            <li>キャプチャ画像はJPEG,PNG,BMPを想定</li>
            <li>デザインの方は透過が設定されているPNGのみ対応</li>
          </ul>
        </div>
        <div className={styles.textBox}>
        <h3>● 出力される画像仕様</h3>
        <ul>
          <li>解像度は横1280×縦720</li>
          <li>特に圧縮処理はしていないが、概ね1MB以下のJPEG形式</li>
        </ul>
        </div>
        <div className={styles.textBox}>
        <h3>● 注意事項</h3>
        <ul>
          <li>個人が作成したものなので、意図しないエラーが発生することもあります。</li>
          <li>アスペクト比が16:9でない場合、出力された画像が意図しない結果になる可能性があります。</li>
          <li>選択された画像の解像度が低い場合、引き伸ばされて表示されるため出力時の解像度が荒くなります。</li>
        </ul>
        </div>
      </section>
      <div className={styles.inputArea}>
        <dl className={styles.inputImage}>
          <dt>キャプチャ</dt>
          <dd><input ref={caputuredImageRef} id="caputuredImage" type="file" accept="image/*" onChange={selectedFileHandler}/></dd>
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
          <dt>デザイン選択</dt>
          <dd><input ref={selectedDesignRef} id="selectedDesign" type="file" accept="image/png" onChange={selectedFileHandler}/></dd>
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
          <dt>出力</dt>
          <dd className={styles.outputImageBox}>
            <canvas ref={canvasRef} id="canvas" width='0' height='0'></canvas>
          </dd>
        </dl>
        <ul className={styles.buttonArea}>
            <li className={styles.buttonBox}>
              <Button onClick={generateHandler} color="primary" size="lg" variant="ghost">作成</Button>
            </li>
          {generatedFlag && (
            <li className={styles.buttonBox}>
              <Button onClick={fileSaveHandler} color="primary" size="lg" variant="ghost">保存</Button>
            </li>
          )}
          <li>
            <Button onClick={resetHandler} color="primary" size="lg">リセット</Button>
          </li>
        </ul>
      </div>
      <Footer/>
    </main>
  )
}