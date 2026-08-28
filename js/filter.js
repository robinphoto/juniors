export function normalizeDateRange(album) {
  const start = new Date(`${album.startDate}T00:00:00`);
  const end = new Date(`${album.endDate ?? album.startDate}T23:59:59`);
  return { start, end };
}
export function albumOverlapsYear(album, year) {
  if (!year) return true;
  const { start, end } = normalizeDateRange(album);
  const rangeStart = new Date(`${year}-01-01T00:00:00`);
  const rangeEnd = new Date(`${year}-12-31T23:59:59`);
  return start <= rangeEnd && end >= rangeStart;
}
export function albumOverlapsMonth(album, month, year) {
  if (!month) return true;
  const { start, end } = normalizeDateRange(album);
  const targetMonth = Number(month) - 1;
  const firstYear = year ? Number(year) : start.getFullYear();
  const lastYear = year ? Number(year) : end.getFullYear();
  for (let targetYear = firstYear; targetYear <= lastYear; targetYear += 1) {
    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    if (start <= monthEnd && end >= monthStart) return true;
  }
  return false;
}
export function filterAlbums(albums, state) {
  const keyword = state.keyword.trim().toLocaleLowerCase("ko-KR");
  return albums.filter((album) => {
    const eventMatch = !state.event || album.events.includes(state.event);
    const yearMatch = albumOverlapsYear(album, state.year);
    const monthMatch = albumOverlapsMonth(album, state.month, state.year);
    const keywordMatch = !keyword || album.title.toLocaleLowerCase("ko-KR").includes(keyword);
    return eventMatch && yearMatch && monthMatch && keywordMatch;
  });
}
export function sortAlbums(albums, direction) {
  const multiplier = direction === "oldest" ? 1 : -1;
  return [...albums].sort((a,b) => a.startDate.localeCompare(b.startDate) * multiplier);
}
