"use client";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showNotification(title: string, body: string, url: string = "/messages") {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url },
        vibrate: [200, 100, 200],
      } as NotificationOptions & { vibrate?: number[] });
    });
  } else {
    const n = new Notification(title, { body, icon: "/icons/icon-192.png" });
    n.onclick = () => { window.focus(); window.location.href = url; };
  }
}
