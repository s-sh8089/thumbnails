import styles from './footer.module.scss'
import Link from 'next/link'

export default function Footer() {
    const date = new Date();
    let year = date.getFullYear();
    return(
        <footer className={styles.footer}>&copy; {year} 芹沢(s_s)h</footer>
    )
}