import { Link } from 'react-router-dom';
import styles from './Home.module.css';

const portals = [
  {
    path: '/super-admin',
    title: 'Super Admin',
    subtitle: 'Manage organizations across the platform',
    tags: ['Create Orgs', 'View Stats'],
    color: '#FFA500',
  },
  {
    path: '/admin',
    title: 'Org Admin',
    subtitle: 'Manage feature flags for your organization',
    tags: ['Create Flags', 'Toggle', 'Delete'],
    color: '#FFA500',
  },
  {
    path: '/user',
    title: 'End User',
    subtitle: 'Check feature flag status for your account',
    tags: ['Flag Lookup', 'History'],
    color: '#FFA500',
  },
  {
    path: '/api-tester',
    title: 'Developer SDK Tools',
    subtitle: 'Simulate API requests to fetch feature flags programmatically',
    tags: ['API Tester', 'JSON Payload'],
    color: '#FFA500',
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.logoRow}>
          <span className={styles.logoText}>BYEPO</span>
          <span className={styles.logoSub}>flag system</span>
        </div>
        <h1 className={styles.heading}>Multi-Tenant <span className={styles.headingHighlight}>Feature Flag</span> Management</h1>
        <p className={styles.subheading}>
          Control feature rollouts across organizations with role-based access.
          Select your portal below to get started.
        </p>
      </div>

      <div className={styles.cards}>
        {portals.map((p) => (
          <Link key={p.path} to={p.path} className={styles.portalCard} style={{ borderTop: `4px solid ${p.color}` }}>
            <div className={styles.cardTitle}>{p.title}</div>
            <div className={styles.cardSubtitle}>{p.subtitle}</div>
            <div className={styles.tags}>
              {p.tags.map((t) => (
                <span key={t} className={styles.tag} style={{ color: p.color, borderColor: p.color + '40', background: p.color + '14' }}>
                  {t}
                </span>
              ))}
            </div>
            <div className={styles.arrow}>Enter →</div>
          </Link>
        ))}
      </div>

      <div className={styles.footer}>
        Built with Node.js · Express · Prisma · PostgreSQL · React
      </div>
    </div>
  );
}
