import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/widgets/app-layout'
import { SurveyProvider } from '../context/SurveyProvider'
import MySurveysPage from '../components/pages/my-surveys'
import PublicSurveyPage from '../components/pages/public-survey'
import ResultsPage from '../components/pages/results'
import SurveyEditorRoute from '../features/survey-editor/SurveyEditorRoute'
import ThankYouPage from '../components/pages/thank-you'

export default function App() {
  return (
    <SurveyProvider>
      <BrowserRouter>
        <Routes>
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
  )
}
