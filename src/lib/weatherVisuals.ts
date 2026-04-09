type WeatherVisual = {
  label: string;
  accent: string;
  icon: string;
};

function toDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const icons = {
  sun: toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="11" fill="#FFD36E"/>
      <g stroke="#FFD36E" stroke-width="4" stroke-linecap="round">
        <path d="M32 7v9"/>
        <path d="M32 48v9"/>
        <path d="M7 32h9"/>
        <path d="M48 32h9"/>
        <path d="M14.5 14.5l6.5 6.5"/>
        <path d="M43 43l6.5 6.5"/>
        <path d="M14.5 49.5L21 43"/>
        <path d="M43 21l6.5-6.5"/>
      </g>
    </svg>
  `),
  cloud: toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <path fill="#D8E7FF" d="M21 50c-7.18 0-13-5.82-13-13 0-6.3 4.48-11.55 10.43-12.73C20.93 16.17 27.9 10 36.3 10c9.55 0 17.39 7.93 17.39 17.61l-.02.73c4.85 1.26 8.33 5.67 8.33 10.85C62 45 56.85 50 50.5 50H21Z"/>
    </svg>
  `),
  rain: toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <path fill="#D8E7FF" d="M48.3 26.5c-.9-8.3-7.8-14.5-16.1-14.5-7.6 0-14.2 5.2-15.8 12.4C9.5 25.3 4 31.1 4 38.2 4 46.1 10.4 52 18.1 52h30.2c6.5 0 11.7-5 11.7-11.4 0-6.2-4.9-11.3-11.7-12.1Z"/>
      <g stroke="#76C8FF" stroke-width="4" stroke-linecap="round">
        <path d="M21 49l-4 8"/>
        <path d="M33 49l-4 8"/>
        <path d="M45 49l-4 8"/>
      </g>
    </svg>
  `),
  storm: toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <path fill="#D8E7FF" d="M49.2 25.8C47.8 17.1 40.9 11 32.4 11c-7.3 0-13.6 4.5-16.2 11.1C9.4 22.7 4 28.5 4 35.9 4 44.8 11 52 19.7 52h28.1c6.8 0 12.2-5.2 12.2-11.8 0-6.3-5-11.7-10.8-14.4Z"/>
      <path fill="#FFC16F" d="M34.7 32 24 47h8.2L28.8 58 42 40.8h-8.1L34.7 32Z"/>
    </svg>
  `),
  fog: toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <path fill="#D8E7FF" opacity=".35" d="M46 23c-.6-6.3-5.8-11-12.1-11-5.7 0-10.5 3.6-12.1 8.7C16.6 21.3 12 25.7 12 31.4 12 37.8 17 43 23.2 43H45c5 0 9-3.9 9-8.6 0-4.9-3.4-9.2-8-11.4Z"/>
      <g stroke="#C5D7E8" stroke-width="4" stroke-linecap="round">
        <path d="M10 24h44"/>
        <path d="M6 34h52"/>
        <path d="M14 44h36"/>
      </g>
    </svg>
  `),
  snow: toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <path fill="#D8E7FF" d="M48.3 26.5c-.9-8.3-7.8-14.5-16.1-14.5-7.6 0-14.2 5.2-15.8 12.4C9.5 25.3 4 31.1 4 38.2 4 46.1 10.4 52 18.1 52h30.2c6.5 0 11.7-5 11.7-11.4 0-6.2-4.9-11.3-11.7-12.1Z"/>
      <g stroke="#9DE4FF" stroke-width="3.2" stroke-linecap="round">
        <path d="M20 49v9"/><path d="M15.5 53.5h9"/><path d="M17 50.5l6 6"/><path d="M17 56.5l6-6"/>
        <path d="M32 49v9"/><path d="M27.5 53.5h9"/><path d="M29 50.5l6 6"/><path d="M29 56.5l6-6"/>
        <path d="M44 49v9"/><path d="M39.5 53.5h9"/><path d="M41 50.5l6 6"/><path d="M41 56.5l6-6"/>
      </g>
    </svg>
  `),
};

export function getWeatherVisual(code: number, isDay = true): WeatherVisual {
  if (code === 0) {
    return {
      label: isDay ? 'Clear sky' : 'Clear night',
      accent: isDay ? 'sunrise' : 'night',
      icon: icons.sun,
    };
  }

  if ([1, 2, 3].includes(code)) {
    return {
      label: 'Partly cloudy',
      accent: 'cloud',
      icon: icons.cloud,
    };
  }

  if ([45, 48].includes(code)) {
    return {
      label: 'Foggy',
      accent: 'mist',
      icon: icons.fog,
    };
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      label: 'Rain showers',
      accent: 'rain',
      icon: icons.rain,
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      label: 'Snowfall',
      accent: 'frost',
      icon: icons.snow,
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      label: 'Thunderstorm',
      accent: 'storm',
      icon: icons.storm,
    };
  }

  return {
    label: 'Variable weather',
    accent: 'cloud',
    icon: icons.cloud,
  };
}
