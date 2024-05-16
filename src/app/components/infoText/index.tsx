import styles from './infoText.module.scss'

export default function InfoText () {
  return (
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
  )
}