import React, { useState } from "react";
import "./App.css";

function App() {
  // ANNOUNCEMENT FUNCTION
  const [announcements, setAnnouncements] = useState([
    {
      title: "Welcome!",
      content: "Welcome to our announcement and knowledge center.",
    },
  ]);

  // KNOWLEDGE FUNCTION
  const [knowledge, setKnowledge] = useState([
    {
      title: "What is Knowledge?",
      content: "This section contains helpful information and guides.",
    },
  ]);

  // INPUT STATES
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeContent, setKnowledgeContent] = useState("");

  // ADD ANNOUNCEMENT
  const addAnnouncement = () => {
    if (
      announcementTitle.trim() === "" ||
      announcementContent.trim() === ""
    ) {
      alert("Please complete the announcement.");
      return;
    }

    const newAnnouncement = {
      title: announcementTitle,
      content: announcementContent,
    };

    setAnnouncements([
      newAnnouncement,
      ...announcements,
    ]);

    setAnnouncementTitle("");
    setAnnouncementContent("");
  };

  // ADD KNOWLEDGE
  const addKnowledge = () => {
    if (
      knowledgeTitle.trim() === "" ||
      knowledgeContent.trim() === ""
    ) {
      alert("Please complete the knowledge information.");
      return;
    }

    const newKnowledge = {
      title: knowledgeTitle,
      content: knowledgeContent,
    };

    setKnowledge([
      newKnowledge,
      ...knowledge,
    ]);

    setKnowledgeTitle("");
    setKnowledgeContent("");
   
    // DELETE ANNOUNCEMENT
const deleteAnnouncement = (indexToDelete) => {
  setAnnouncements(
    announcements.filter((_, index) => index !== indexToDelete)
  );
};


// DELETE KNOWLEDGE
const deleteKnowledge = (indexToDelete) => {
  setKnowledge(
    knowledge.filter((_, index) => index !== indexToDelete)
  );
};
  };

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <h1>INFORMATION CENTER</h1>
        <p>Announcements and Knowledge</p>
      </header>


      {/* MAIN TWO COLUMN PAGE */}
      <div className="main-container">


        {/* =========================
            LEFT SIDE ANNOUNCEMENT
        ========================= */}
        <div className="announcement-side">

          <div className="section-title">
            <h2>📢 ANNOUNCEMENTS</h2>
            <p>Latest news and important updates</p>
          </div>


          {/* ADD ANNOUNCEMENT */}
          <div className="form-box">

            <input
              type="text"
              placeholder="Announcement Title"
              value={announcementTitle}
              onChange={(e) =>
                setAnnouncementTitle(e.target.value)
              }
            />

            <textarea
              placeholder="Announcement Content"
              value={announcementContent}
              onChange={(e) =>
                setAnnouncementContent(e.target.value)
              }
            />

            <button onClick={addAnnouncement}>
              ADD ANNOUNCEMENT
            </button>

          </div>


          {/* DISPLAY ANNOUNCEMENTS */}
          <div className="content-list">

            {announcements.map((announcement, index) => (

              <div
                className="announcement-card"
                key={index}
              >

                <h3>
                  {announcement.title}
                </h3>

                <p>
                  {announcement.content}
                </p>

              </div>

            ))}

          </div>

        </div>



        {/* =========================
            RIGHT SIDE KNOWLEDGE
        ========================= */}
        <div className="knowledge-side">

          <div className="section-title">
            <h2>📚 KNOWLEDGE</h2>
            <p>Helpful information and guides</p>
          </div>


          {/* ADD KNOWLEDGE */}
          <div className="form-box">

            <input
              type="text"
              placeholder="Knowledge Title"
              value={knowledgeTitle}
              onChange={(e) =>
                setKnowledgeTitle(e.target.value)
              }
            />

            <textarea
              placeholder="Knowledge Content"
              value={knowledgeContent}
              onChange={(e) =>
                setKnowledgeContent(e.target.value)
              }
            />

            <button
              <div className="content-list">

  {knowledge.map((item, index) => (

    <div
      className="knowledge-card"
      key={index}
    >

      <h3>{item.title}</h3>

      <p>{item.content}</p>

      <button
        className="delete-button"
        onClick={() => deleteKnowledge(index)}
      >
        DELETE
      </button>

    </div>

  ))}

</div>
);
{"}"}

export default App;