import { useParams } from 'react-router-dom'
import SurveyEditorPage from './SurveyEditorPage'

export default function SurveyEditorRoute() {
  const { id } = useParams<{ id: string }>()
  return <SurveyEditorPage key={id} />
}
