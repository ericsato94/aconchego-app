import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import logo from './assets/logo.webp'
import { AppLayout } from './layout/AppLayout'
import { ScrollToTop } from './layout/ScrollToTop'
import { useApp } from './store/appContext'

const Welcome = lazy(() => import('./pages/auth/Welcome'))
const SignUp = lazy(() => import('./pages/auth/SignUp'))
const Login = lazy(() => import('./pages/auth/Login'))
const Consent = lazy(() => import('./pages/auth/Consent'))
const Home = lazy(() => import('./pages/home/Home'))
const Library = lazy(() => import('./pages/library/Library'))
const Favorites = lazy(() => import('./pages/library/Favorites'))
const StoryPage = lazy(() => import('./pages/story/StoryPage'))
const Sleep = lazy(() => import('./pages/sleep/Sleep'))
const Progress = lazy(() => import('./pages/progress/Progress'))
const Profile = lazy(() => import('./pages/profile/Profile'))
const RecordVoice = lazy(() => import('./pages/voice/RecordVoice'))
const VoicePreparing = lazy(() => import('./pages/voice/VoicePreparing'))
const VoiceTest = lazy(() => import('./pages/voice/VoiceTest'))
const Plans = lazy(() => import('./pages/info/Plans'))
const Privacy = lazy(() => import('./pages/info/Privacy'))
const Help = lazy(() => import('./pages/info/Help'))
const NotFound = lazy(() => import('./pages/info/NotFound'))
const QuizIntro = lazy(() => import('./pages/quiz/QuizIntro'))
const QuizQuestion = lazy(() => import('./pages/quiz/QuizQuestion'))
const QuizLoading = lazy(() => import('./pages/quiz/QuizLoading'))
const QuizLead = lazy(() => import('./pages/quiz/QuizLead'))
const QuizResult = lazy(() => import('./pages/quiz/QuizResult'))
const SalesPage = lazy(() => import('./pages/quiz/SalesPage'))
const Thanks = lazy(() => import('./pages/quiz/Thanks'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))

/** Exige sessão e consentimento LGPD registrado. */
function RequireAuth() {
  const { user, data } = useApp()
  const { pathname } = useLocation()
  if (!user) return <Navigate to="/bem-vindo" replace />
  if (!data.consent) return <Navigate to="/consentimento" replace state={{ from: pathname }} />
  return <AppLayout />
}

function PublicOnly() {
  const { user } = useApp()
  return user ? <Navigate to="/" replace /> : <Outlet />
}

function RequireSession({ children }: { children: ReactNode }) {
  const { user } = useApp()
  return user ? children : <Navigate to="/bem-vindo" replace />
}

/** Páginas informativas: dentro do app quando logado, avulsas quando não. */
function MaybeAppLayout() {
  const { user, data } = useApp()
  return user && data.consent ? <AppLayout /> : <Outlet />
}

function PageFallback() {
  return <div className="page-loading" aria-busy="true" aria-label="Carregando" />
}

/** Enquanto a sessão salva é verificada (fração de segundo), evita piscar a tela de boas-vindas. */
function Splash() {
  return (
    <div className="splash" aria-busy="true" aria-label="Carregando">
      <img src={logo} alt="Aconchego" />
    </div>
  )
}

export default function App() {
  const { status } = useApp()
  if (status === 'loading') return <Splash />
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Quiz de vendas e painel: abertos, fora do login do app. */}
          <Route path="/quiz" element={<QuizIntro />} />
          <Route path="/quiz/analisando" element={<QuizLoading />} />
          <Route path="/quiz/cadastro" element={<QuizLead />} />
          <Route path="/quiz/resultado" element={<QuizResult />} />
          <Route path="/quiz/:step" element={<QuizQuestion />} />
          <Route path="/oferta" element={<SalesPage />} />
          <Route path="/oferta/obrigado" element={<Thanks />} />
          <Route path="/admin" element={<AdminPage />} />

          <Route element={<PublicOnly />}>
            <Route path="/bem-vindo" element={<Welcome />} />
            <Route path="/cadastro" element={<SignUp />} />
            <Route path="/entrar" element={<Login />} />
          </Route>
          <Route
            path="/consentimento"
            element={
              <RequireSession>
                <Consent />
              </RequireSession>
            }
          />
          <Route element={<RequireAuth />}>
            <Route index element={<Home />} />
            <Route path="/historias" element={<Library />} />
            <Route path="/historias/:id" element={<StoryPage />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/sono" element={<Sleep />} />
            <Route path="/progresso" element={<Progress />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/planos" element={<Plans />} />
            <Route path="/gravar-voz" element={<RecordVoice />} />
            <Route path="/voz/preparando" element={<VoicePreparing />} />
            <Route path="/voz/teste" element={<VoiceTest />} />
          </Route>
          <Route element={<MaybeAppLayout />}>
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/ajuda" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
