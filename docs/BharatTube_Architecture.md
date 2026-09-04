# 🇮🇳 BharatTube Architecture v1.0

## Vision

BharatTube is an Indian video-sharing platform where users can watch videos, create channels, upload videos, build communities, and earn through monetization.

---

# Tech Stack

Frontend
- React.js
- Redux Toolkit
- React Router
- Axios

Backend
- Node.js
- Express.js

Database
- MongoDB
- Mongoose

Storage
- Cloudinary

Authentication
- JWT
- bcrypt

---

# Folder Structure

server/

src/

config/

controllers/

middlewares/

models/

routes/

services/

utils/

uploads/

app.js

server.js

---

# Models

User

Channel

Video

Comment

Playlist

Notification

History

---

# User

- name
- email
- password
- profilePhoto
- isAdmin

---

# Channel

- owner
- channelName
- handle
- logo
- banner
- description
- subscribers
- totalVideos
- totalViews
- verified

---

# Video

- channel
- title
- description
- videoUrl
- thumbnail
- duration
- category
- language
- tags
- visibility
- views
- likes
- dislikes
- commentsCount

---

# APIs

Authentication

POST /signup

POST /login

GET /me

POST /logout

---

Channel

POST /channel

GET /channel/me

PUT /channel

DELETE /channel

---

Video

POST /videos

GET /videos

GET /videos/:id

PUT /videos/:id

DELETE /videos/:id

---

Comment

POST /comments

GET /comments/:videoId

PUT /comments/:id

DELETE /comments/:id

---

Subscribe

POST /subscribe/:channelId

DELETE /subscribe/:channelId

---

Like

POST /like/:videoId

DELETE /like/:videoId

---

Upload Flow

User

↓

Backend

↓

Cloudinary

↓

MongoDB

↓

Frontend

---

Development Order

Authentication

Channel

Upload System

Video

Comment

Like

Subscribe

Playlist

History

Notification

Search

Home Feed

Creator Dashboard

Admin Panel

Live Streaming

Monetization