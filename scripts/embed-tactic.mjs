#!/usr/bin/env node
/**
 * tactics/<id>.json 내용을 prototype/index.html 의
 * <script id="tactic-data" type="application/json"> 블록에 삽입한다.
 *
 * 프로토타입은 file:// 로 더블클릭해도 열리도록 데이터를 HTML 안에 내장한다.
 * JSON 파일이 원본(single source of truth)이고, 이 스크립트가 복사본을 갱신한다.
 *
 * 사용법: node scripts/embed-tactic.mjs [tactics/serve-3rd-ball-pivot-fh.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = resolve(root, process.argv[2] ?? 'tactics/serve-3rd-ball-pivot-fh.json');
const htmlPath = resolve(root, 'prototype/index.html');

const data = JSON.parse(readFileSync(jsonPath, 'utf8')); // 유효성 검사 겸
// </script> 가 JSON 문자열 안에 들어 있어도 안전하도록 이스케이프
const payload = JSON.stringify(data, null, 2).replace(/<\/script/gi, '<\\/script');

const html = readFileSync(htmlPath, 'utf8');
const re = /(<script id="tactic-data" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) {
  console.error('prototype/index.html 에 <script id="tactic-data"> 블록이 없습니다.');
  process.exit(1);
}
writeFileSync(htmlPath, html.replace(re, `$1\n${payload}\n$2`));
console.log(`embedded ${jsonPath} → ${htmlPath} (${data.shots.length} shots)`);
