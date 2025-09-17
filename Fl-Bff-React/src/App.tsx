import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FormPage from './components/FormPage';
import GitHubPage from './components/GitHubPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">Fl-Bff React App</h1>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">表单管理</Link>
              </li>
              <li className="nav-item">
                <Link to="/github" className="nav-link">GitHub信息</Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<FormPage />} />
            <Route path="/github" element={<GitHubPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
