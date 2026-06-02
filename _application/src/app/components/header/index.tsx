import styles from './header.module.scss'
import Link from 'next/link'

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.navigation}>
        <ul>
          <li><Link href='/'>TOP</Link></li>
          <li><Link href='/hoge'>HOGE</Link></li>
          <li><Link href='/contextsample'>context</Link></li>
        </ul>
      </nav>
    </header>
  )
}