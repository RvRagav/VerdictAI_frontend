import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PageLayout from './components/layout/PageLayout'
import Dashboard from './pages/Dashboard'
import TenderUpload from './pages/TenderUpload'
import SchemaReview from './pages/SchemaReview'
import EvaluationView from './pages/EvaluationView'
import HITLQueue from './pages/HITLQueue'
import HITLReviewCard from './pages/HITLReviewCard'
import ReportExport from './pages/ReportExport'
import AuditTrail from './pages/AuditTrail'

function App() {
  return (
    <BrowserRouter>
      <PageLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<TenderUpload />} />
          <Route path="/schema-review" element={<SchemaReview />} />
          <Route path="/evaluation" element={<EvaluationView />} />
          <Route path="/hitl" element={<HITLQueue />} />
          <Route path="/hitl/:evaluationId" element={<HITLReviewCard />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/reports" element={<ReportExport />} />
        </Routes>
      </PageLayout>
    </BrowserRouter>
  )
}

export default App
