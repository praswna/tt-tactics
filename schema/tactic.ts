/**
 * TT Tactics 전술 데이터 모델 (v0.1, 초안)
 *
 * 한 전술(Tactic)은 "구(Shot)"들의 의사결정 트리다.
 * 선형 시퀀스가 아니라 트리인 이유: 상대의 반응에 따라 내 다음 행동이 갈린다.
 * (예: 3구 피벗 공격 뒤 상대 블록이 포핸드 쪽으로 오면 스텝 + 포핸드 루핑,
 *      다시 백쪽으로 오면 제자리 포핸드 연속 공격)
 *
 * 좌표계
 *  - 단위: 미터
 *  - 원점: 테이블 중심(네트 중앙)
 *  - +x: 내 오른쪽 (오른손 선수의 포핸드 쪽), +y: 상대 방향
 *  - 테이블: x ∈ [-0.7625, 0.7625], y ∈ [-1.37, 1.37]
 *  - 선수 몸 위치는 테이블 밖(|y| > 1.37)에 놓인다.
 *
 * 높이(z)는 데이터에 거의 쓰지 않는다. 3D 렌더러가 스트로크 종류로 임팩트 높이를,
 * 네트 위 여유 높이로 공의 포물선을 계산한다(테이블 0.76 m, 네트 위 0.9125 m).
 *
 * 렌더러는 이 좌표를 그대로 그린다. 왼손 선수나 다른 시점(상대 시점)은
 * 렌더 단계에서 x 반전으로 처리하고, 데이터는 항상 "오른손 기준 내 시점"으로 저장한다.
 * (v0.2에서 좌표 대신 존 이름(`zone`)으로도 쓸 수 있게 확장 예정 — DESIGN.md 참고)
 */

export interface Point {
  x: number;
  y: number;
}

/** 치는 사람. me = 전술의 주인공(나), opp = 상대 */
export type Actor = 'me' | 'opp';

export type Hand = 'R' | 'L';

export type Side = 'FH' | 'BH';

/** 공의 회전. 복수 지정 가능(예: 하회전과 너클을 섞어 쓰는 서브) */
export type Spin = '하회전' | '상회전' | '너클' | '횡회전' | '횡하회전' | '횡상회전';

/** 공의 길이. 테이블 각 코트를 세 구간(쇼트/하프롱/롱)으로 나눈다 */
export type Length = '쇼트' | '하프롱' | '롱';

export type FootworkType =
  | '피벗'        // 돌아서기
  | '사이드스텝'
  | '크로스오버'
  | '한발스텝'
  | '인앤아웃'    // 테이블 안으로 들어가고 나오기(짧은 공)
  | '복귀';       // 중앙 복귀

export interface Footwork {
  type: FootworkType;
  /** 보드에 표시할 짧은 설명. 없으면 type을 그대로 쓴다 */
  label?: string;
}

/**
 * 치고 난 뒤의 복귀 스텝. 공이 날아가는 동안 실행된다.
 * 다음 내 구의 풋워크는 body가 아니라 recover.to 에서 시작한다.
 * (예: 서브 직후 기본 자세로 돌아오는 스텝)
 */
export interface Recover {
  type: FootworkType;
  /** 복귀 후 몸 중심 위치 */
  to: Point;
  label?: string;
}

export interface Explain {
  /** 무엇을 하는가 (1~2문장) */
  what: string;
  /** 왜 이렇게 하는가: 의도, 유도하려는 상대 반응 */
  why?: string;
  /** 체크포인트(내 구) 또는 읽기 포인트(상대 구) */
  keys?: string[];
  /** 흔한 실수 */
  mistakes?: string[];
}

export interface Branch {
  /** 분기 식별자. UI에서 A/B/C 버튼으로 표시 */
  key: string;
  /** 분기 조건을 사람 말로: "비어 있는 내 포핸드 사이드로 블록" */
  label: string;
  /** 실전에서 이 분기가 나올 대략적 비율(0~1). 연습 비중·퀴즈 가중치에 사용 */
  share?: number;
  /** 다음 Shot id */
  next: string;
}

export interface Shot {
  id: string;
  /** 구 번호 (1구 서브, 2구 리시브, 3구 ...) */
  n: number;
  actor: Actor;
  /** 스테퍼 버튼용 짧은 이름: "서브", "리시브", "피벗 FH" */
  short: string;
  /** 카드 제목 한 줄 */
  title: string;
  /** 스트로크 이름: "FH 루프 드라이브", "BH 블록" */
  stroke: string;
  side: Side;
  spin: Spin[];
  length: Length;
  /** 코스를 사람 말로: "상대 백핸드 깊은 크로스" */
  target: string;
  /**
   * 이 구를 치기 전 이동. 2D는 이전 위치 → body 화살표,
   * 3D는 type 별 규칙으로 발 하나하나의 스텝 순서를 계산해 발자국으로 보여준다.
   */
  footwork?: Footwork;
  /** 치고 난 뒤 복귀 스텝 */
  recover?: Recover;
  /** 임팩트 높이(m). 없으면 스트로크 종류로 추정(서브 0.84, 푸시 0.88, 루프 0.86, 드라이브·블록 0.95~0.98) */
  contactZ?: number;
  /** 임팩트 순간 치는 사람의 몸 위치 */
  body: Point;
  /** 임팩트 지점(라켓 위치) */
  contact: Point;
  /** 바운드 지점들. 서브는 2개(내 코트, 상대 코트), 그 외는 1개 */
  bounces: Point[];
  explain: Explain;
  /**
   * 다음 구. 문자열이면 단일 연결, 객체면 상대 반응에 따른 분기.
   * 없으면 이 구로 패턴이 끝난다(결정구).
   */
  next?: string | { branches: Branch[] };
}

export interface PlayerProfile {
  hand: Hand;
  grip?: '셰이크핸드' | '펜홀더' | string;
}

export interface Tactic {
  id: string;
  title: string;
  /** 라이브러리 분류: "서브·3구", "리시브·4구", "랠리", "상대 유형별" */
  category: string;
  level: '초급' | '중급' | '상급' | string;
  tags?: string[];
  players: { me: PlayerProfile; opp: PlayerProfile };
  /** 좌표계 설명(문서용) */
  coords?: string;
  /** 1구 전 두 선수의 시작 위치 */
  start: { me: Point; opp: Point };
  summary: string;
  /** 루트 Shot id (보통 1구 서브 또는 상대 서브) */
  root: string;
  /** 분기 선택 UI의 기본값 */
  defaultBranch?: string;
  shots: Shot[];
}
