import { useState } from 'react';
import './App.css';

function App() {
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "System Maintenance",
      date: "9/15/2026, 10:23 AM",
      author: "admin"
    }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [pinnedKnowledge, setPinnedKnowledge] = useState(true);

  const handleAddAnnouncement = () => {
    if (newTitle.trim()) {
      setAnnouncements([...announcements, {
        id: announcements.length + 1,
        title: newTitle,
        date: new Date().toLocaleString(),
        author: "user"
      }]);
      setNewTitle('');
      setShowAddForm(false);
    }
  };

  const handleTogglePin = () => {
    setPinnedKnowledge(!pinnedKnowledge);
  };

  const handleOpenKnowledge = () => {
    window.open('#knowledge-detail', '_blank');
  };

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
          
          {/* Announcements List */}
          <div style={{ margin: '30px 0', maxHeight: '200px', overflowY: 'auto' }}>
            {announcements.length > 0 ? (
              announcements.map(ann => (
                <div key={ann.id} style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  border: '1px solid rgba(255, 107, 107, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h4 style={{ color: '#fff', margin: '0 0 5px 0', fontSize: '1rem' }}>{ann.title}</h4>
                    <button style={{
                      background: 'none',
                      border: '1px solid #ff6b6b',
                      color: '#ff6b6b',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      📌 PINNED
                    </button>
                  </div>
                  <small style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {ann.date} • Pinned by: {ann.author}
                  </small>
                </div>
              ))
            ) : (
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontSize: '0.95rem' }}>
                No announcements available.
              </p>
            )}
          </div>

          {/* Add Announcement Form */}
          {showAddForm && (
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '15px',
              border: '1px solid rgba(255, 107, 107, 0.3)'
            }}>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter announcement title..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ff6b6b',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  color: '#fff',
                  fontFamily: 'inherit',
                  marginBottom: '10px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAddAnnouncement}
                  style={{
                    background: '#ff6b6b',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    flex: 1
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    background: 'none',
                    border: '1px solid #ff6b6b',
                    color: '#ff6b6b',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    flex: 1
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: 'none',
              border: '2px solid #ff6b6b',
              color: '#ff6b6b',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            + Add First Announcement
          </button>
          <p 
            onClick={() => alert(`Total Announcements: ${announcements.length}`)}
            style={{ marginTop: '15px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', cursor: 'pointer' }}
          >
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
          
          {/* Knowledge Card */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>what is rene baterbonia</h3>
              <button
                onClick={handleTogglePin}
                style={{
                  background: 'none',
                  border: '1px solid #ff6b6b',
                  color: '#ff6b6b',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                {pinnedKnowledge ? '📌 PINNED' : '📌 Unpin'}
              </button>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 10px 0' }}>
              Hello! I'm **WALASTIK AI**, your assistant from the WALASTIK Information Center.
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 10px 0' }}>
              **Rene Baterbonia** is a person's name (most commonly found in the Philippines).
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 10px 0' }}>
              While specific details about this individual are not in the WALASTIK internal database, here is some general context:
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0' }}>
              **Name Origin:** "Rene" is a given name derived from Latin/French meaning "reborn."
            </p>
            <small style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginTop: '10px' }}>
              9/15/2026, 10:06:17 AM • 📌 Pinned by: mammaaa
            </small>
          </div>

          <button
            onClick={handleOpenKnowledge}
            style={{
              background: 'none',
              border: '2px solid #61dafb',
              color: '#61dafb',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              marginTop: '20px',
              width: '100%'
            }}
          >
            📖 Open
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
