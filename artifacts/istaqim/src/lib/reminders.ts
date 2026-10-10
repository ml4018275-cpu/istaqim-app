import { readLocal, writeLocal } from './local-storage';

const REMINDER_PREFERENCE_KEY = 'istaqim:reminders-enabled';
const REMINDER_INTERVAL_MS = 15 * 60 * 1000;

const reminders = [
  { kind: 'الصلاة على النبي', text: 'اللهم صل وسلم على نبينا محمد' },
  { kind: 'ذكر', text: 'سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر' },
  { kind: 'تذكير قرآني', text: 'صلوات الله وسلامه على النبي ﷺ' },
] as const;

export function isReminderEnabled() {
  return readLocal(REMINDER_PREFERENCE_KEY, false);
}

export async function setReminderEnabled(enabled: boolean) {
  if (enabled && 'Notification' in window && Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') return false;
  }
  if (enabled && !('Notification' in window)) return false;
  return writeLocal(REMINDER_PREFERENCE_KEY, enabled);
}

/**
 * Delivers while the app is open and this timer is running. Browser
 * notifications in the background require a push service and server.
 */
export function startReminderTimer(onReminder: (kind: string) => void) {
  if (!isReminderEnabled()) return () => undefined;
  let index = 0;
  const timer = window.setInterval(() => {
    const reminder = reminders[index % reminders.length];
    onReminder(reminder.kind);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`استقم · ${reminder.kind}`, {
        body: reminder.text,
        icon: '/favicon.svg',
      });
    }
    index += 1;
  }, REMINDER_INTERVAL_MS);
  return () => window.clearInterval(timer);
}
