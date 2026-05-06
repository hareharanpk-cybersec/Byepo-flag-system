import styles from './Nav.module.css';

export default function Nav({ loggedIn = false, role = '', onLogout }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>B</div>
          <span className={styles.logoText}>BYEPO</span>
          <span className={styles.logoSubtext}>Flag System</span>
        </div>
        <div className={styles.right}>
          {role && <span className={styles.rolePill}>{role}</span>}
          {loggedIn && (
            <button className={styles.logoutBtn} onClick={onLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
