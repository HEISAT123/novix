import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../context/useAuth'
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
  const navigate = useNavigate()
  const { user, logout, isLoading } = useAuth()
  const { title, showBack } = getHeaderMeta(pathname)

  if (isLoading) {
    return null
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.appTopBar}>
        <div className={styles.appTopBarLeft}>
          {showBack && (
            <Link to="/" className={styles.appTopBarBack} aria-label="На главную">
              <span style={{ fontSize: '30px', paddingBottom:'5px' }}>←</span>
            </Link>
          )}
          {pathname === '/' && <img src={mainIcon} width={32} height={32} className={styles.appLogo} alt="" aria-hidden />}
          <h1 className={styles.appTopBarTitle}>{title}</h1>
        </div>
        <div className={styles.appTopBarActions}>
          {user ? (
            <>
              <span className={styles.userName}>{user.username}</span>
              <img
                src={profileIcon}
                width={36}
                height={36}
                className={styles.appTopBarAvatar}
                alt=""
                aria-hidden
              />
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                aria-label="Выйти"
              >
                Выйти
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.loginBtn}>
              Войти
            </Link>
          )}
        </div>
      </header>

      <div className={styles.appMain}>
        <div className={styles.appMainBody}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
