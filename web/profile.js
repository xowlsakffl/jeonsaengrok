const seasonNames = ['겨울','겨울','봄','봄','봄','여름','여름','여름','가을','가을','가을','겨울'];

export function birthDate(input, now = new Date()) {
  if (!/^[0-9]{6}$/.test(input)) return null;
  const yy = Number(input.slice(0,2)), month = Number(input.slice(2,4)), day = Number(input.slice(4,6));
  let year = Math.floor(now.getFullYear()/100)*100 + yy;
  const dayCode = (y,m,d) => y*10000 + m*100 + d;
  if (dayCode(year,month,day) > dayCode(now.getFullYear(), now.getMonth()+1, now.getDate())) year -= 100;
  const date = new Date(Date.UTC(year,month-1,day));
  if (date.getUTCMonth() !== month-1 || date.getUTCDate() !== day) return null;
  return { iso: date.toISOString().slice(0,10), label: year+'년 '+month+'월 '+day+'일', season: seasonNames[month-1] };
}

export function describeProfile(profile) {
  return {
    job:profile.job, personality:profile.personality, season:profile.season, surname:profile.surname, clan:profile.clan,
    wealth:profile.wealthLabel, family:profile.familyLabel,
    face:profile.face.observations.map(o => o.reading)
  };
}

