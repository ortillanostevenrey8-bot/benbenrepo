import './App.css';

function App() {
  return (
    <div className="App">
      <div className="content-container">
        {/* Announcement Box */}
        <div className="box">
          <h2 style={{ color: '#ff6b6b', textAlign: 'left', letterSpacing: '2px', fontSize: '0.9rem' }}>
            ANNOUNCEMENT
          </h2>
          <h1 style={{ fontSize: '2.5rem', textAlign: 'left', marginTop: '20px', marginBottom: '15px' }}>
            Latest Updates
          </h1>
          <p style={{ textAlign: 'left', fontSize: '1rem', lineHeight: '1.6', marginBottom: '15px' }}>
            Stay updated with the latest news and important announcements.
          </p>
          <hr style={{ borderColor: 'rgba(255, 255, 255, 0.3)', margin: '20px 0', border: 'none', borderTop: '1px solid rgba(255, 100, 100, 0.5)' }} />
          <div style={{ textAlign: 'center', margin: '60px 0' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>No announcements available.</p>
          </div>
          <button style={{
            background: 'none',
            border: '2px solid #ff6b6b',
            color: '#ff6b6b',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 'bold'
          }}>
            + Add First Announcement
          </button>
          <p style={{ marginTop: '30px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
            View All Announcements →
          </p>
        </div>

        {/* Knowledge Box */}
        <div className="box">
          <h2 style={{ color: '#ff6b6b', textAlign: 'right', letterSpacing: '2px', fontSize: '0.9rem' }}>
            KNOWLEDGE
          </h2>
          <h1 style={{ fontSize: '2.5rem', textAlign: 'right', marginTop: '20px', marginBottom: '15px' }}>
            Knowledge
          </h1>
          <p style={{ textAlign: 'right', fontSize: '1rem', lineHeight: '1.6', marginBottom: '15px' }}>
            Search for information and company resources.
          </p>
          <hr style={{ borderColor: 'rgba(255, 255, 255, 0.3)', margin: '20px 0', border: 'none', borderTop: '1px solid rgba(255, 100, 100, 0.5)' }} />
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>what is rene baterbonia</h3>
              <button style={{
                background: 'none',
                border: '1px solid #ff6b6b',
                color: '#ff6b6b',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                📌 PINNED
              </button>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Hello! I'm **WALASTIK AI**, your assistant from the WALASTIK Information Center.
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '10px' }}>
              **Rene Baterbonia** is a person's name (most commonly found in the Philippines).
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '10px' }}>
              While specific details about this individual are not in the WALASTIK internal database, here is some general context:
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '10px' }}>
              **Name Origin:** "Rene" is a given name derived from Latin/French meaning "reborn."
            </p>
          </div>
          <button style={{
            background: 'none',
            border: '2px solid #61dafb',
            color: '#61dafb',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 'bold',
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
