"use client";

// style
import styles from "./page.module.scss";
// グローバルな状態管理
import { useGlobalContext } from '@/app/_context/GlobalState';
// UI component
import Button from '@mui/material/Button';

export default function SelectBackgroundImg() {
  const { state, setState } = useGlobalContext();
  const incrementHandler = () => {
    setState(prevState => ({
      ...prevState,
      count: prevState.count + 1,
    }));
  }
  const decrementHandler = () => {
    setState((prevState) => ({
      ...prevState,
      count: prevState.count -1
    }))
  }
  return (
    <main className="main">
      <section>
        <h2>SelectBackgroungImg</h2>
        <p>Current Value: {state.value}</p>
        <p>Current Conunt: {state.count}</p>
        <Button
        onClick={incrementHandler}
        color="primary"
        variant="contained"
        >increment</Button>
        <Button
        onClick={decrementHandler}
        color="primary"
        variant="contained"
        >decrement</Button>
      </section>
    </main>
  )
}
