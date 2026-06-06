import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import TemplateEditor from './pages/TemplateEditor';
import ProcessDocument from './pages/ProcessDocument';
import DocumentResult from './pages/DocumentResult';
import History from './pages/History';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
            <Route path="/templates/:id/edit" element={<TemplateEditor />} />
            <Route path="/upload" element={<ProcessDocument />} />
            <Route path="/documents/:id" element={<DocumentResult />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
