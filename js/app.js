import { DATA_BASE_URL } from "./config.js";
import { filterAlbums, sortAlbums } from "./filter.js";

const state = { event:"", year:"", month:"", openMode:"new-window", keyword:"", sort:"newest" };
let albums = [];
const elements = {
  events:document.querySelector("#event-filters"), years:document.querySelector("#year-filters"), months:document.querySelector("#month-filters"), openMode:document.querySelector("#open-mode-toggle"),
  keyword:document.querySelector("#keyword-input"), sort:document.querySelector("#sort-toggle"), summary:document.querySelector("#result-summary"), totalAlbums:document.querySelector("#total-albums"), totalPhotos:document.querySelector("#total-photos"),
  grid:document.querySelector("#album-grid"), empty:document.querySelector("#empty-state"), error:document.querySelector("#error-state"), template:document.querySelector("#album-card-template")
};
document.querySelectorAll("[data-icon]").forEach((icon)=>{ icon.src=`${DATA_BASE_URL}/icons/${icon.dataset.icon}`; });
document.querySelectorAll("[data-asset]").forEach((asset)=>{ asset.src=`${DATA_BASE_URL}/${asset.dataset.asset}`; });
async function loadJson(path) { const response=await fetch(`${DATA_BASE_URL}/${path}`); if(!response.ok) throw new Error(`${path}: ${response.status}`); return response.json(); }
function formatKoreanDate(dateString, includeYear=true) {
  const [year,month,day]=dateString.split("-");
  return includeYear ? `${year}년 ${month}월 ${day}일` : `${month}월 ${day}일`;
}
function formatAlbumPeriod(album) {
  const start=formatKoreanDate(album.startDate);
  if(!album.endDate || album.endDate===album.startDate) return start;
  const sameYear=album.startDate.slice(0,4)===album.endDate.slice(0,4);
  return `${start} ~ ${formatKoreanDate(album.endDate,!sameYear)}`;
}
function makeFilterButton(label,group,value) {
  const button=document.createElement("button"); button.type="button"; button.className="filter-button"; button.textContent=label; button.dataset.group=group; button.dataset.value=value;
  button.setAttribute("aria-pressed",String(state[group]===value));
  button.addEventListener("click",()=>{ state[group]=state[group]===value?"":value; updatePressedStates(); render(); });
  return button;
}
function updatePressedStates() { document.querySelectorAll(".filter-button").forEach((button)=>button.setAttribute("aria-pressed",String(state[button.dataset.group]===button.dataset.value))); }
function renderFilters(categories) {
  [...categories.events].sort((a,b)=>a.order-b.order).forEach((item)=>elements.events.append(makeFilterButton(item.name,"event",item.id)));
  const years=[...new Set(albums.flatMap((album)=>{ const first=Number(album.startDate.slice(0,4)); const last=Number((album.endDate??album.startDate).slice(0,4)); return Array.from({length:last-first+1},(_,index)=>first+index); }))].sort((a,b)=>b-a);
  years.forEach((year)=>elements.years.append(makeFilterButton(String(year),"year",String(year))));
  Array.from({length:12},(_,index)=>index+1).forEach((month)=>elements.months.append(makeFilterButton(`${month}월`,"month",String(month))));
}
function updateStats() {
  const photos=albums.reduce((sum,album)=>sum+album.photoCount,0);
  elements.totalAlbums.textContent=`총 ${albums.length.toLocaleString("ko-KR")}개의 앨범`;
  elements.totalPhotos.textContent=`총 ${photos.toLocaleString("ko-KR")}장`;
}
function openAlbumPopup(url) {
  const width=Math.min(1280,window.screen.availWidth-80);
  const height=Math.min(860,window.screen.availHeight-80);
  const left=Math.max(0,Math.round(window.screenX+(window.outerWidth-width)/2));
  const top=Math.max(0,Math.round(window.screenY+(window.outerHeight-height)/2));
  return window.open(url,"robinphotoAlbumPopup",`popup=yes,width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
}
function render() {
  const visible=sortAlbums(filterAlbums(albums,state),state.sort); elements.grid.replaceChildren();
  visible.forEach((album)=>{ const card=elements.template.content.cloneNode(true); const link=card.querySelector(".album-card__link"); const image=card.querySelector(".album-card__image"); const year=card.querySelector(".album-card__year"); const photoCount=card.querySelector(".album-card__photo-count"); link.href=album.googlePhotosUrl; link.addEventListener("click",(event)=>{ if(state.openMode!=="popup"||window.innerWidth<1024) return; event.preventDefault(); const popup=openAlbumPopup(album.googlePhotosUrl); if(!popup) window.open(album.googlePhotosUrl,"_blank","noopener,noreferrer"); }); image.src=`${DATA_BASE_URL}/${album.cover}`; image.alt=`${album.title} 앨범 표지`; year.textContent=album.startDate.slice(0,4); photoCount.textContent=`${album.photoCount.toLocaleString("ko-KR")}장`; card.querySelector(".album-card__title").textContent=album.title.replace(/^\d{8}\s+/,""); card.querySelector(".album-card__meta").textContent=formatAlbumPeriod(album); elements.grid.append(card); });
  const photos=visible.reduce((sum,album)=>sum+album.photoCount,0); elements.summary.textContent=`검색결과 ${visible.length.toLocaleString("ko-KR")}개 앨범, ${photos.toLocaleString("ko-KR")}장`; elements.empty.hidden=visible.length!==0;
}
async function initialize() {
  try { const [albumData,categories,index]=await Promise.all([loadJson("albums.json"),loadJson("juniors-categories.json"),loadJson("juniors-index.json")]); albums=albumData.filter((album)=>album.sites.includes("juniors") && Object.hasOwn(index,album.id)).map((album)=>({...album,events:index[album.id].events ?? []})); updateStats(); renderFilters(categories); render(); }
  catch(error) { console.error(error); elements.summary.textContent="앨범 데이터를 불러오지 못했습니다."; elements.error.hidden=false; }
}
elements.keyword.addEventListener("input",(event)=>{ state.keyword=event.target.value; render(); });
elements.openMode.addEventListener("click",()=>{
  state.openMode=state.openMode==="new-window"?"popup":"new-window";
  const popup=state.openMode==="popup";
  const icon=elements.openMode.querySelector("img");
  icon.dataset.icon=popup?"panels-top-left.svg":"external-link.svg";
  icon.src=`${DATA_BASE_URL}/icons/${icon.dataset.icon}`;
  elements.openMode.querySelector("span").textContent=popup?"팝업창":"새창";
  elements.openMode.setAttribute("aria-label",popup?"현재 팝업창으로 열기, 새창으로 변경":"현재 새창으로 열기, 팝업창으로 변경");
});
elements.sort.addEventListener("click",()=>{
  state.sort=state.sort==="newest"?"oldest":"newest";
  const newest=state.sort==="newest";
  const icon=elements.sort.querySelector("img");
  const label=elements.sort.querySelector("span");
  icon.dataset.icon=newest?"clock-arrow-down.svg":"clock-arrow-up.svg";
  icon.src=`${DATA_BASE_URL}/icons/${icon.dataset.icon}`;
  label.textContent=newest?"최근순":"오래된순";
  elements.sort.setAttribute("aria-label",newest?"현재 최근순, 오래된순으로 변경":"현재 오래된순, 최근순으로 변경");
  render();
});
initialize();
