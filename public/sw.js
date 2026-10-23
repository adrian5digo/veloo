// Service worker de Veloo: instalación (P2) y avisos (P3).
// Los avisos nunca llevan fotos ni precios: solo texto y un link.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let datos = {};
  try {
    datos = e.data ? e.data.json() : {};
  } catch {
    datos = { titulo: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(datos.titulo || "Bóveda", {
      body: datos.cuerpo || "Toca para verlo",
      icon: "/icono-192.png",
      badge: "/icono-192.png",
      data: { url: datos.url || "/abrir" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/abrir";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => new URL(v.url).origin === self.location.origin);
      if (abierta) return abierta.navigate(url).then((v) => v && v.focus());
      return self.clients.openWindow(url);
    }),
  );
});
