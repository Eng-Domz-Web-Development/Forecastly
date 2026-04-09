# Forecastly

Forecastly is a fullstack weather application built for a web-first experience. It lets users search for weather by flexible location input, view current conditions and a five-day forecast, save date-range weather requests to a database, manage saved records, and export stored data in multiple formats.

## Live Demo

Frontend showcase:

- https://eng-domz-web-development.github.io/Forecastly/

## Overview

Forecastly supports:

- Current weather lookup by:
  - City
  - Town
  - Landmark
  - ZIP/postal code
  - GPS coordinates
- Current-location weather using browser geolocation
- Five-day forecast display
- Persistent weather history with full CRUD operations
- Date-range weather requests with validation
- Data export in `JSON`, `CSV`, `XML`, and `Markdown`
- Extra integrations for:
  - Google Maps
  - YouTube location-related videos
  - Wikipedia location summaries

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Custom CSS

### Backend

- Node.js
- Express
- TypeScript
- SQLite via Node's built-in `node:sqlite`

### External APIs

- Open-Meteo API for weather data
- OpenStreetMap Nominatim for geocoding and reverse geocoding
- Wikipedia API for location summaries
- Google Maps search links
- YouTube search links

## Key Features

### 1. Flexible Location Search

Users can search with a single input that accepts:

- City names
- Landmarks
- ZIP/postal codes
- Latitude/longitude coordinates

The backend validates and resolves the location before weather data is returned or saved.

### 2. Current Weather and Forecast

Forecastly displays:

- Current temperature
- Feels-like temperature
- Humidity
- Wind speed
- Rain/precipitation
- Sunrise and sunset
- Five-day forecast

### 3. Persistent Saved Forecasts

Users can create records using:

- A location
- A start date
- An end date

Each saved record stores:

- Original query
- Resolved location
- Coordinates
- Current weather snapshot
- Five-day forecast
- Date-range daily temperature data
- External links and enrichments
- Timestamps

### 4. CRUD Operations

Forecastly supports:

- `Create` new saved weather records
- `Read` previously stored records
- `Update` an existing saved record by revalidating the input and refreshing the data
- `Delete` saved records

### 5. Data Export

Stored records can be exported as:

- `JSON`
- `CSV`
- `XML`
- `Markdown`

CSV export includes UTF-8 BOM support for better compatibility with spreadsheet apps when opening multilingual text.

## Project Structure

```text
Forecastly/
├── server/
│   ├── index.ts
│   ├── lib/
│   │   ├── db.ts
│   │   └── types.ts
│   └── services/
│       ├── exportService.ts
│       ├── recordService.ts
│       ├── validation.ts
│       └── weatherService.ts
├── src/
│   ├── lib/
│   │   ├── weather.ts
│   │   └── weatherVisuals.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── types.ts
├── data/
│   └── forecastly.sqlite
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 22+ recommended
- npm

### Install Dependencies

```powershell
npm install
```

### Run in Development

Run frontend and backend together:

```powershell
npm run dev:full
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8787
```

### Build for Production

```powershell
npm.cmd run build
```

### Start Production Server

```powershell
npm.cmd start
```

Production app:

```text
http://localhost:8787
```

## Available Scripts

- `npm.cmd run dev`  
  Starts the Vite frontend

- `npm.cmd run dev:server`  
  Starts the backend in watch mode

- `npm.cmd run dev:full`  
  Starts frontend and backend together

- `npm.cmd run build`  
  Builds frontend and backend

- `npm.cmd run preview`  
  Previews the frontend build

- `npm.cmd start`  
  Runs the compiled backend server

## Backend API

### Health

- `GET /api/health`

### Weather

- `GET /api/weather/current?query=<location>`
- `GET /api/weather/current-location?lat=<latitude>&lon=<longitude>`

### Records

- `GET /api/records`
- `GET /api/records/:id`
- `POST /api/records`
- `PUT /api/records/:id`
- `DELETE /api/records/:id`

### Export

- `GET /api/records/export/json`
- `GET /api/records/export/csv`
- `GET /api/records/export/xml`
- `GET /api/records/export/md`

## Example Record Payload

### Create Record

```json
{
  "query": "Cairo",
  "startDate": "2026-04-09",
  "endDate": "2026-04-13"
}
```

### Update Record

```json
{
  "query": "Alexandria",
  "startDate": "2026-04-10",
  "endDate": "2026-04-14"
}
```

## Validation Rules

- Location must not be empty
- Date format must be `YYYY-MM-DD`
- Start date must be before or equal to end date
- Date range must not exceed 31 days
- Location must be resolvable by the backend geocoding flow

## Database Notes

Forecastly uses a local SQLite database stored at:

```text
data/forecastly.sqlite
```

This database persists:

- Saved weather records
- Location metadata
- Date-range request data
- Current weather snapshots
- Forecast snapshots
- Exportable history

## Design Notes

The frontend is designed to feel polished and web-first:

- Strong visual hierarchy
- Responsive layout
- Animated loading states
- Weather iconography
- Clean card-based forecast presentation
- Reduced-motion-friendly animation handling

## Submission Notes

This project demonstrates:

- Frontend weather experience
- Backend API architecture
- Database persistence
- Input validation
- CRUD operations
- External API integration
- Multi-format export support

## Future Improvements

- Authentication and user-specific saved records
- Search/filter for saved forecasts
- Paginated record browsing
- PDF export
- More advanced charts for date-range weather trends
- Automated tests for backend routes and frontend flows
