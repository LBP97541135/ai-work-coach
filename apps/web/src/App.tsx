import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import TodayPage from './routes/TodayPage';
import ProfilePage from './routes/ProfilePage';
import HistoryPage from './routes/HistoryPage';
import SettingsPage from './routes/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
