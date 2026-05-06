import styles from './Alert.module.css';

export default function Alert({ type = 'error', message }) {
  if (!message) return null;
  return (
    <div className={`${styles.alert} ${type === 'success' ? styles.success : styles.error}`}>
      {message}
    </div>
  );
}
