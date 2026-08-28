import test from "node:test";
import assert from "node:assert/strict";
import { albumOverlapsMonth, albumOverlapsYear, filterAlbums, sortAlbums } from "../js/filter.js";
const sample={id:"20261231-01",title:"송구영신 예배",startDate:"2025-12-31",endDate:"2026-01-02",events:["worship"]};
test("기간이 걸친 앨범은 양쪽 연도에 포함된다",()=>{ assert.equal(albumOverlapsYear(sample,"2025"),true); assert.equal(albumOverlapsYear(sample,"2026"),true); assert.equal(albumOverlapsYear(sample,"2024"),false); });
test("분류와 키워드를 함께 필터링한다",()=>{ assert.equal(filterAlbums([sample],{event:"worship",year:"2026",month:"",keyword:"송구"}).length,1); });
test("날짜순 정렬이 동작한다",()=>{ const older={...sample,id:"old",startDate:"2024-01-01"}; assert.equal(sortAlbums([older,sample],"newest")[0].id,sample.id); assert.equal(sortAlbums([older,sample],"oldest")[0].id,older.id); });

test("월이 겹치는 앨범을 찾는다",()=>{ assert.equal(albumOverlapsMonth(sample,"12","2025"),true); assert.equal(albumOverlapsMonth(sample,"1","2026"),true); assert.equal(albumOverlapsMonth(sample,"2","2026"),false); });
