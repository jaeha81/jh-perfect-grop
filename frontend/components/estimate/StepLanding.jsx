'use client';

export default function StepLanding({ onStart }) {
  const FEATURES = [
    {
      icon: '🏗',
      title: '18년 현장 경험 기반',
      desc: '실무 시공/견적/설계 경력을 VALIDATOR에 내재화하여 이상치·누락을 잡습니다.',
    },
    {
      icon: '🤖',
      title: '5 에이전트 파이프라인',
      desc: 'SCANNER·ESTIMATOR·PRICER·VALIDATOR·REPORTER가 순차/병렬로 견적을 분석합니다.',
    },
    {
      icon: '📋',
      title: '비교 견적 + 세부 내역',
      desc: '저가/표준/고급 3등급 + 공종별 세부견적서 + 공사일정 + 공정계획까지 한 번에.',
    },
    {
      icon: '📄',
      title: '상담 연계 가능',
      desc: 'PDF 저장, 현장 방문 상담 예약, 견적 수정까지 이어집니다.',
    },
  ];

  return (
    <div>
      {/* 히어로 */}
      <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-8 sm:p-10 mb-5 text-center">
        <h1
          className="text-[2.4rem] sm:text-[3rem] font-extrabold m-0 leading-[1.15]"
          style={{
            background: 'linear-gradient(135deg,#7c6af7,#22d3a0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          JH EstimateAI
        </h1>
        <p className="text-[#c4c2d8] text-[1rem] sm:text-[1.05rem] mt-3 leading-[1.55]">
          18년 현장 경험 기반 · 인테리어/건설 견적 자동화 AI
        </p>
        <p className="text-[#6b6a80] text-[0.88rem] mt-2 leading-[1.6] max-w-[520px] mx-auto">
          공간 유형과 공사 범위만 입력하면, 5개 에이전트가 저가·표준·고급 비교견적과
          공종별 세부 내역, 공사일정·공정계획까지 자동으로 정리해 드립니다.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-6 px-8 py-4 rounded-xl text-white text-[1.05rem] font-bold"
          style={{
            background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(124,106,247,0.35)',
          }}
        >
          견적 시작하기 →
        </button>
        <div className="text-[#555] text-[0.78rem] mt-3 leading-[1.55]">
          입력하신 정보가 구체적일수록 견적 정확도가 높아집니다.
          <br className="hidden sm:block" />
          사진 및 도면을 함께 올리면 더 정밀한 분석이 가능합니다.
        </div>
      </div>

      {/* 특징 4종 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl p-5"
            style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="text-[1.6rem] mb-1">{f.icon}</div>
            <div className="text-[#e8e6f0] font-semibold text-[0.95rem] mb-1">{f.title}</div>
            <div className="text-[#8b8a9e] text-[0.82rem] leading-[1.55]">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* 신뢰 문구 */}
      <div
        className="rounded-xl px-5 py-4 text-[0.82rem] leading-[1.6]"
        style={{
          background: 'rgba(124,106,247,0.06)',
          border: '1px solid rgba(124,106,247,0.18)',
          color: '#a09eb8',
        }}
      >
        <div className="text-[#a78bfa] font-semibold mb-1">안내</div>
        본 서비스의 견적은 입력 정보 기반 자동 분석 결과이며, 최종 견적은 현장 확인 후 확정됩니다.
        현장 실측·사진 분석 후 자재와 일정 조건에 따라 변동이 발생할 수 있습니다.
      </div>
    </div>
  );
}
