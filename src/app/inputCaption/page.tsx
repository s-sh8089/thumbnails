"use client";

// style
import styles from "./page.module.scss";
// グローバルな状態管理
import { useGlobalContext } from '@/app/_context/GlobalState';

export default function InputCaption() {
  const { state, setState } = useGlobalContext();
  return (
    <main className="main">
      <section>
        <div>InputCaption</div>
        <p>Current Value: {state.value}</p>
        <p>Current Conunt: {state.count}</p>
      </section>
    </main>

  )
}