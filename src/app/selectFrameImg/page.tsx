"use client";

// style
import styles from "./page.module.scss";
// グローバルな状態管理
import { useGlobalContext } from '@/app/_context/GlobalState';
// UI component
import Button from '@mui/material/Button';

export default function SelectFrameImg() {
  const { state, setState } = useGlobalContext();
  const updateHandler = (newValue: string) => {
    setState((prevState) => ({
      ...prevState,
      value: newValue
    }))
  }

  return (
    <main className="main">
      <section>
        <div>SelectFrameImg</div>
        <p>Current Value: {state.value}</p>
        <p>Current Conunt: {state.count}</p>
        <Button
          onClick={()=> {updateHandler('hoge')}}
          color="primary"
          variant="contained"
        >Update Value</Button>
      </section>
    </main>
  )
}
