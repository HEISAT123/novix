import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthProvider'
import { AppLayout } from '../components/widgets/app-layout'
import { SurveyProvider } from '../context/SurveyProvider'
import LoginPage from '../components/pages/login'
import MySurveysPage from '../components/pages/my-surveys'
import PublicSurveyPage from '../components/pages/public-survey'
import RegisterPage from '../components/pages/register'
import ResultsPage from '../components/pages/results'
import SurveyEditorRoute from '../components/pages/survey-editor/SurveyEditorRoute'
import ThankYouPage from '../components/pages/thank-you'

export default function App() {
  return (
    <AuthProvider>
      <SurveyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<AppLayout />}>
              <Route index element={<MySurveysPage />} />
              <Route path="edit/:id" element={<SurveyEditorRoute />} />
              <Route path="results/:id" element={<ResultsPage />} />
            </Route>
            <Route path="survey/:id" element={<PublicSurveyPage />} />
            <Route path="survey/:id/thanks" element={<ThankYouPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SurveyProvider>
    </AuthProvider>
  )
}
