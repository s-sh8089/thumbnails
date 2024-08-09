import styles from './header.module.scss'
import Link from 'next/link'

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.navigation}>
        <ul>
          <li><Link href='/selectBackgroungImg'>selectBackgroungImg</Link></li>
          <li><Link href='/selectFrameImg'>selectFrameImg</Link></li>
          <li><Link href='/combinedImg'>combinedImg</Link></li>
          <li><Link href='/inputCaption'>InputCaption</Link></li>
        </ul>
      </nav>
    </header>
  )
}