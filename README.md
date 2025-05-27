# Email Marketing App

Una aplicación completa de email marketing construida con Next.js, TypeScript, Supabase y Tailwind CSS.

## 🚀 Características

- **Autenticación**: Sistema completo con Supabase Auth
- **Gestión de Campañas**: CRUD completo con estados (borrador, enviada, programada, pausada)
- **Gestión de Contactos**: CRUD completo con importación masiva CSV
- **Gestión de Grupos**: Organización de contactos en grupos
- **Dashboard de Métricas**: KPIs en tiempo real con gráficas
- **Configuración**: Gestión de variables de entorno para servicios externos
- **Responsive**: Diseño mobile-first completamente responsive

## 🛠️ Tecnologías

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Estado Global**: Zustand
- **Validación**: React Hook Form + Zod
- **Backend**: Supabase (Auth + Database + RLS)
- **Gráficas**: Recharts
- **Iconos**: Lucide React

## 📁 Estructura del Proyecto

\`\`\`
/
├── app/                    # Páginas de Next.js App Router
│   ├── campaigns/         # Gestión de campañas
│   ├── contacts/          # Gestión de contactos
│   ├── dashboard/         # Dashboard principal
│   ├── groups/            # Gestión de grupos
│   ├── login/             # Autenticación
│   └── settings/          # Configuración
├── components/            # Componentes reutilizables
│   ├── auth/             # Componentes de autenticación
│   ├── campaigns/        # Componentes de campañas
│   ├── contacts/         # Componentes de contactos
│   ├── dashboard/        # Componentes del dashboard
│   ├── groups/           # Componentes de grupos
│   ├── layout/           # Layout y navegación
│   ├── settings/         # Componentes de configuración
│   └── ui/               # Componentes UI base (shadcn)
├── lib/                  # Utilidades y configuración
│   ├── api.ts           # Funciones de API
│   ├── auth.ts          # Funciones de autenticación
│   ├── store.ts         # Estado global (Zustand)
│   ├── supabase.ts      # Cliente de Supabase
│   ├── types.ts         # Tipos TypeScript
│   └── validations.ts   # Esquemas de validación (Zod)
└── hooks/               # Custom hooks
\`\`\`

## 🗄️ Base de Datos

### Tablas Principales

- **profiles**: Perfiles de usuario extendidos
- **campaigns**: Campañas de email marketing
- **contacts**: Lista de contactos
- **groups**: Grupos de contactos
- **contact_groups**: Relación many-to-many contactos ↔ grupos
- **campaign_groups**: Relación many-to-many campañas ↔ grupos
- **email_metrics**: Métricas de emails (aperturas, clics, rebotes)
- **config**: Variables de configuración

### Políticas RLS

Todas las tablas tienen políticas de Row Level Security configuradas para:
- Usuarios solo pueden ver/editar sus propios datos
- Configuraciones restringidas a usuarios admin
- Protección completa de datos entre usuarios

## ⚙️ Configuración

### 1. Supabase Setup

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta las migraciones SQL proporcionadas en el proyecto
3. Configura las variables de entorno:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
\`\`\`

### 2. Amazon SES (Opcional)

Para envío real de emails, configura Amazon SES:

1. Crea una cuenta AWS y configura SES
2. Obtén las credenciales de acceso
3. Agrega las configuraciones en la app:
   - `AWS_SES_ACCESS_KEY`
   - `AWS_SES_SECRET_KEY`
   - `AWS_SES_REGION`

### 3. Instalación Local

\`\`\`bash
# Clonar el repositorio
git clone <repository-url>
cd email-marketing-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
npm run dev
\`\`\`

## 🎨 Paleta de Colores TDX

- **Navy**: `#0f172a` (slate-900)
- **Teal**: `#0f766e` (teal-700)
- **Turquoise**: `#06b6d4` (cyan-500)

## 📱 Responsive Design

La aplicación está diseñada mobile-first con breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔐 Seguridad

- **RLS**: Row Level Security en todas las tablas
- **Autenticación**: JWT tokens con Supabase Auth
- **Validación**: Validación client-side y server-side
- **Sanitización**: Datos sanitizados antes de almacenar

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

### Otras Plataformas

La aplicación es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 📊 Métricas y Analytics

La aplicación rastrea automáticamente:
- Emails enviados
- Tasas de apertura
- Tasas de clics
- Tasas de rebote
- Desuscripciones

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte y preguntas:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

---

**Desarrollado con ❤️ usando Next.js y Supabase**
