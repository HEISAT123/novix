import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import bellIcon from '../../../../assets/bell.svg'
import mainIcon from '../../../../assets/mainIcon.svg'
import profileIcon from '../../../../assets/profileIcon.png'
import styles from './AppLayout.module.scss'

function getHeaderMeta(pathname: string): { title: string; showBack: boolean } {
  if (pathname === '/') return { title: 'Мои опросы', showBack: false }
  if (pathname.startsWith('/edit')) return { title: 'Создание опроса', showBack: true }
  if (pathname.startsWith('/results')) return { title: 'Результаты', showBack: true }
  return { title: 'Опросы', showBack: false }
}

export function AppLayout() {
  const { pathname } = useLocation()
  const { title, showBack } = getHeaderMeta(pathname)

  return (
    <div className={styles.appShell}>
      <header className={styles.appTopBar}>
        <div className={styles.appTopBarLeft}>
          {showBack && (
            <Link to="/" className={styles.appTopBarBack} aria-label="На главную">
              <span style={{ fontSize: '30px', paddingBottom:'5px' }}>←</span>
            </Link>
          )}
          <h1 className={styles.appTopBarTitle}>{title}</h1>
        </div>
        <div className={styles.appTopBarActions}>
          <button type="button" className={styles.appTopBarIconBtn} aria-label="Уведомления">
            <img src={bellIcon} width={20} height={20} alt="" aria-hidden />
          </button>
          <img
            src={profileIcon}
            width={36}
            height={36}
            className={styles.appTopBarAvatar}
            alt=""
            aria-hidden
          />
        </div>
      </header>

      <div className={styles.appShellRow}>
        <aside className={styles.sidebar} aria-label="Навигация">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`.trim()
            }
            title="Мои опросы"
          >
            <img src={mainIcon} width={30} height={30} alt="" aria-hidden />
          </NavLink>
        </aside>
        <div className={styles.appMain}>
          <div className={styles.appMainBody}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
