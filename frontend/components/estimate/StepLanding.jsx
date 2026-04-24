'use client';

export default function StepLanding({ onStart }) {
  const FEATURES = [
    {
      icon: '🏗',
      title: '18년 현장 경험 기반',
      desc: '실무 시공/견적/설계 경력을 VALIDATOR에 내재화하여 이상치·누락을 잡습니다.',
      color: '#7c6af7',
    },
    {
      icon: '🤖',
      title: '5 에이전트 파이프라인',
      desc: 'SCANNER·ESTIMATOR·PRICER·VALIDATOR·REPORTER가 순차/병렬로 견적을 분석합니다.',
      color: '#22d3a0',
    },
    {
      icon: '📋',
      title: '비교 견적 + 세부 내역',
      desc: '저가/표준/고급 3등급 + 공종별 세부견적서 + 공사일정 + 공정계획까지 한 번에.',
      color: '#f59e0b',
    },
    {
      icon: '📄',
      title: '상담 연계 가능',
      desc: 'PDF 저장, 현장 방문 상담 예약, 견적 수정까지 이어집니다.',
      color: '#ec4899',
    },
  ];

  return (
    <div>
      {/* 히어로 카드 */}
      <div
        className="animate-fade-in-up relative overflow-hidden rounded-3xl p-10 sm:p-14 mb-6 text-center"
        style={{
          background: 'linear-gradient(160deg,#16162a 0%,#13131a 60%,#0e1520 100%)',
          border: '1px solid rgba(124,106,247,0.2)',
          boxShadow: '0 4px 60px rgba(124,106,247,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* 배경 오브 */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: '-60px', left: '-60px',
            width: '280px', height: '280px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,106,247,0.18) 0%, transparent 70%)',
            animation: 'orb 12s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: '-40px', right: '-40px',
            width: '220px', height: '220px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,211,160,0.15) 0%, transparent 70%)',
            animation: 'orb 15s ease-in-out infinite reverse',
            pointerEvents: 'none',
          }}
        />

        {/* AI 배지 */}
        <div className="animate-fade-in delay-100 inline-flex items-center gap-2 mb-5">
          <span
            style={{
              background: 'rgba(124,106,247,0.12)',
              border: '1px solid rgba(124,106,247,0.3)',
              borderRadius: '9999px',
              padding: '4px 14px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#a78bfa',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            ✦ AI 기반 견적 자동화
          </span>
        </div>

        {/* 타이틀 */}
        <h1
          className="animate-fade-in-up delay-100 text-[2.6rem] sm:text-[3.4rem] font-extrabold leading-[1.1] mb-0"
          style={{
            background: 'linear-gradient(135deg,#a78bfa 0%,#7c6af7 40%,#22d3a0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
          }}
        >
          JH EstimateAI
        </h1>

        <p className="animate-fade-in-up delay-200 text-[#c4c2d8] text-[1.05rem] sm:text-[1.1rem] mt-4 leading-[1.6] font-medium">
          18년 현장 경험 기반 · 인테리어/건설 견적 자동화 AI
        </p>

        <p className="animate-fade-in-up delay-250 text-[#6b6a80] text-[0.9rem] mt-3 leading-[1.7] max-w-[500px] mx-auto">
          공간 유형과 공사 범위만 입력하면, 5개 에이전트가 저가·표준·고급
          비교견적과 공종별 세부 내역, 공사일정·공정계획까지 자동으로 정리해 드립니다.
        </p>

        {/* CTA 버튼 */}
        <div className="animate-scale-in delay-350 mt-8">
          <button
            type="button"
            onClick={onStart}
            className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-white text-[1.1rem] font-bold"
            style={{
              background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(124,106,247,0.4)',
              animation: 'pulseGlow 3s ease-in-out infinite',
            }}
          >
            <span>견적 시작하기</span>
            <span style={{ fontSize: '1.2rem' }}>→</span>
          </button>
        </div>

        <div className="animate-fade-in delay-500 text-[#4a4960] text-[0.78rem] mt-5 leading-[1.6]">
          입력하신 정보가 구체적일수록 견적 정확도가 높아집니다.
          <br className="hidden sm:block" />
          사진 및 도면을 함께 올리면 더 정밀한 분석이 가능합니다.
        </div>
      </div>

      {/* 특징 4종 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`card-hover animate-fade-in-up rounded-2xl p-6`}
            style={{
              background: '#13131a',
              border: '1px solid rgba(255,255,255,0.07)',
              animationDelay: `${0.1 + i * 0.08}s`,
            }}
          >
            <div
              className="text-[1.8rem] mb-3 inline-flex items-center justify-center w-12 h-12 rounded-xl"
              style={{ background: `${f.color}18` }}
            >
              {f.icon}
            </div>
            <div
              className="font-semibold text-[0.97rem] mb-2"
              style={{ color: '#e8e6f0' }}
            >
              {f.title}
            </div>
            <div className="text-[#8b8a9e] text-[0.84rem] leading-[1.65]">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* 신뢰 문구 */}
      <div
        className="animate-fade-in-up delay-400 rounded-2xl px-6 py-5 text-[0.84rem] leading-[1.65]"
        style={{
          background: 'rgba(124,106,247,0.05)',
          border: '1px solid rgba(124,106,247,0.16)',
          color: '#a09eb8',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#a78bfa', display: 'inline-block', flexShrink: 0,
            }}
          />
          <span className="text-[#a78bfa] font-semibold text-[0.88rem]">안내</span>
        </div>
        본 서비스의 견적은 입력 정보 기반 자동 분석 결과이며, 최종 견적은 현장 확인 후 확정됩니다.
        현장 실측·사진 분석 후 자재와 일정 조건에 따라 변동이 발생할 수 있습니다.
      </div>
    </div>
  );
}
