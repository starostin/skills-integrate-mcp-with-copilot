# Mergington High School Activities API

A super simple FastAPI application that allows teachers to manage extracurricular activity registration while students can still view activities and participants.

## Features

- View all available extracurricular activities
- Teacher login for registration management
- Sign up students for activities
- Remove students from activities

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/login`                                                     | Start a teacher session                                             |
| POST   | `/auth/logout`                                                    | End the current teacher session                                     |
| GET    | `/auth/session`                                                   | Check whether the current teacher session is valid                  |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up a student for an activity                                   |
| DELETE | `/activities/{activity_name}/unregister?email=student@...`        | Remove a student from an activity                                   |

The signup and unregister endpoints require a teacher session token.

## Teacher Credentials

Seeded teacher accounts are stored in `teachers.json` and loaded by the backend at startup.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
