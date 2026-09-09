# Numio

**Tus cuentas, claras.**

Aplicación de escritorio para la gestión de finanzas personales (gastos e ingresos),
construida con Electron + React + TypeScript + Firebase.

- Gestión de transacciones (ingresos y gastos) con búsqueda, filtros y paginación
- Categorías personalizables con color, separadas por tipo
- Transacciones e ingresos recurrentes (diario, semanal, mensual, anual) con recuperación de periodos vencidos
- Presupuestos por categoría con plantilla mensual recurrente y excepciones por mes: define un límite por defecto que se aplica automáticamente cada mes y personalízalo para meses concretos cuando sea necesario; barra de progreso (verde / ámbar / rojo)
- Dashboard con gráficas (pastel + línea), resumen mensual y tabla por categoría
- Sincronización en tiempo real y multidispositivo con Firebase
- Autenticación por email y contraseña
- Tema claro / oscuro persistente

---

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Una cuenta de Google (para crear tu proyecto de Firebase)

---

## Configuración de Firebase (obligatorio)

Numio **no incluye credenciales**. Cada persona que use la app debe crear su
**propio** proyecto de Firebase gratuito; así tus datos son tuyos y solo tuyos.

### 1. Crear el proyecto

1. Entra en [Firebase Console](https://console.firebase.google.com/).
2. **Agregar proyecto** → ponle un nombre (p. ej. `numio`) → puedes desactivar Google Analytics → **Crear proyecto**.

### 2. Activar Authentication

1. Menú lateral → **Compilación → Authentication** → **Comenzar**.
2. Pestaña **Método de acceso** → **Correo electrónico/contraseña** → **Habilitar** → **Guardar**.
   (Deja "Vínculo del correo electrónico" desactivado.)

### 3. Crear la base de datos Firestore

1. Menú lateral → **Compilación → Firestore Database** → **Crear base de datos**.
2. Edición **Standard**.
3. Ubicación: elige la más cercana (p. ej. `eur3 (Europe)`). **No se puede cambiar después.**
4. Modo: **Iniciar en modo de producción**.
5. **Crear**.

### 4. Publicar las reglas de seguridad

1. En **Firestore Database** → pestaña **Reglas**.
2. Sustituye todo el contenido por el del archivo [`firestore.rules`](./firestore.rules) de este repo.
3. **Publicar**.

Estas reglas garantizan que cada usuario solo puede leer y escribir sus propios datos.

### 5. Registrar la app web y copiar la configuración

1. **Configuración del proyecto** (rueda dentada, arriba a la izquierda) → pestaña **General**.
2. Baja a **Tus apps** → icono **`</>`** (Web) → alias `Numio` → **Registrar app**.
3. Copia el objeto `firebaseConfig` que aparece. Lo necesitas en el paso siguiente.

---

## Configuración del `.env`

Copia la plantilla y rellénala con los valores de tu `firebaseConfig`:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=            # apiKey
VITE_FIREBASE_AUTH_DOMAIN=        # authDomain  (tu-proyecto.firebaseapp.com)
VITE_FIREBASE_PROJECT_ID=         # projectId
VITE_FIREBASE_STORAGE_BUCKET=     # storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=# messagingSenderId
VITE_FIREBASE_APP_ID=             # appId
```

> El archivo `.env` está en `.gitignore` y **nunca** se sube al repositorio.
> La API key web de Firebase no es un secreto (es un identificador público); la
> seguridad la aportan las reglas de Firestore y Authentication.

---

## Uso

```bash
npm install      # instalar dependencias
npm run dev      # ejecutar en modo desarrollo (abre la ventana de Numio)
```

La primera vez, pulsa **"Regístrate"** en la pantalla de inicio: se crea tu perfil
y se generan automáticamente unas categorías por defecto.

---

## Compilar y empaquetar

```bash
npm run build    # build de producción (salida en out/)
npm run dist     # build + instalador Windows (salida en dist/)
```

El instalador `Numio-Setup-<versión>.exe` se genera en `dist/`.

---

## Estructura

```
src/
├── main/        proceso principal de Electron (ventana + IPC de tema)
├── preload/     puente seguro (contextBridge)
└── renderer/    aplicación React
    ├── firebase/     config, seeds de categorías, motor de recurrencias
    ├── stores/       estado global (Zustand): auth, datos, tema
    ├── components/    ui, layout, auth, transactions, categories,
    │                  recurrences, budgets, dashboard
    └── pages/         Dashboard, Transacciones, Presupuestos, Configuración
firestore.rules  reglas de seguridad para desplegar en tu proyecto
```

---

## Tecnología

Electron · electron-vite · React 18 · TypeScript · Tailwind CSS · Recharts ·
Firebase (Firestore + Auth) · Zustand · React Router · date-fns
