import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="content-container">
        {/* Announcement Box */}
        <div className="box">
          <h2 style={{ color: '#ff6b6b', textAlign: 'left', letterSpacing: '2px' }}>
            ANNOUNCEMENT
          </h2>
          <h1 style={{ fontSize: '2.5rem', textAlign: 'left', marginTop: '20px' }}>
            Latest Updates
          </h1>
          <p style={{ textAlign: 'left', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Stay updated with the latest news and important announcements.
          </p>
          <hr style={{ borderColor: 'rgba(255, 255, 255, 0.3)', margin: '20px 0' }} />
          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No announcements available.</p>
          </div>
          <button style={{
            background: 'none',
            border: '2px solid #ff6b6b',
            color: '#ff6b6b',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}>
            + Add First Announcement
          </button>
          <p style={{ marginTop: '30px', color: 'rgba(255, 255, 255, 0.7)' }}>
            View All Announcements →
          </p>
        </div>

        {/* Knowledge Box */}
        <div className="box">
          <h2 style={{ color: '#ff6b6b', textAlign: 'right', letterSpacing: '2px' }}>
            KNOWLEDGE
          </h2>
          <h1 style={{ fontSize: '2.5rem', textAlign: 'right', marginTop: '20px' }}>
            Knowledge
          </h1>
          <p style={{ textAlign: 'right', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Search for information and company resources.
          </p>
          <hr style={{ borderColor: 'rgba(255, 255, 255, 0.3)', margin: '20px 0' }} />
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>what is sun</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Hello! I'm **WALASTIK AI**, your assistant from the WALASTIK Information Center.
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', lineHeight: '1.6', marginTop: '10px' }}>
              The **Sun** is the star at the center of our Solar System. It is the most important source of energy for life on Earth.
            </p>
          </div>
          <button style={{
            background: 'none',
            border: '2px solid #61dafb',
            color: '#61dafb',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginTop: '20px'
          }}>
            📖 Open
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
