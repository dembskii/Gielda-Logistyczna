# Projekt protokoły sieci web: gielda-logistyczna

Dominik Dembski

## Technologies

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB (mongoose)
  - Socket.IO
  - MQTT
  - JWT Authentication

- **Frontend:**
  - EJS Templates
  - SCSS
  - Socket.IO Client
  - JavaScript

## Features

### User System
- User authentication (JWT)
- Real-time online/offline status
- Role-based access (Drivers/Freight Forwarders)

### Job Management
- Create and manage transport jobs
- Real-time job status updates
- Job assignment system

### Team Management
- Freight forwarders can invite drivers
- Drivers can accept/reject invitations
- Real-time team updates

### Real-time Communication
- WebSocket-based notifications
- MQTT integration for job status updates
- Real-time status changes