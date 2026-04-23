'use client';
import { useEffect, useReducer, useRef, useState } from 'react';

import { createInitialState, estimateReducer, STEPS } from '@/lib/estimate-state';
import { buildBackendDescription } from '@/lib/estimate-description';
import { enrichEstimate, generateCommentary } from '@/lib/estimate-engine';
import { buildScheduleInfo } from '@/lib/estimate-schedule';
import { mapSpaceTypeToBackend } from '@/data/estimate-options';
import { saveDraft, loadDraft, clearDraft, isMeaningfulDraft } from '@/lib/estimate-storage';

import StepHeader from '@/components/estimate/StepHeader';
import StepLanding from '@/components/estimate/StepLanding';
import StepCustomerInfo from '@/components/estimate/StepCustomerInfo';
import StepSpaceInfo from '@/components/estimate/StepSpaceInfo';
import StepSiteConditions from '@/components/estimate/StepSiteConditions';
import StepScopes from '@/components/estimate/StepScopes';
import StepFinishOptions from '@/components/estimate/StepFinishOptions';
import StepScheduleUpload from '@/components/estimate/StepScheduleUpload';
import AnalysisLoading from '@/components/estimate/AnalysisLoading';

import ResultSummary from '@/components/estimate/ResultSummary';
import ResultComparisonCards from '@/components/estimate/ResultComparisonCards';
import ResultDetailEstimate from '@/components/estimate/ResultDetailEstimate';
import ResultInclusions from '@/components/estimate/ResultInclusions';
import ResultSchedule from '@/components/estimate/ResultSchedule';
import ResultProcessPlan from '@/components/estimate/ResultProcessPlan';
import ResultCommentary from '@/components/estimate/ResultCommentary';
import ResultDisclaimers from '@/components/estimate/ResultDisclaimers';
import ResultActions from '@/components/estimate/ResultActions';
import ResumeBanner from '@/components/estimate/ResumeBanner';

export default function Home() {
  const [state, dispatch] = useReducer(estimateReducer, undefined, createInitialState);
  const scrollAnchor = useRef(null);
  const [draft, setDraft] = useState(null);
  const saveTimer = useRef(null);

  // 초기 마운트 — draft 감지
  useEffect(() => {
    const d = loadDraft();
    if (d && isMeaningfulDraft(d)) setDraft(d);
  }, []);

  // 단계 이동 시 스크롤 상단
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.step]);

  // 폼 변경 시 debounced 자동저장 (분석/결과 단계는 제외)
  useEffect(() => {
    if (state.step === STEPS.ANALYZING || state.step === STEPS.RESULT) return;
    if (state.step === STEPS.LANDING) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(state);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.step, state.customer, state.space, state.site, state.scopes, state.finish, state.schedule, state.additionalRequests]);

  // 견적 완료 시 draft 제거
  useEffect(() => {
    if (state.step === STEPS.RESULT && state.result) {
      clearDraft();
      setDraft(null);
    }
  }, [state.step, state.result]);

  function resumeDraft() {
    if (!draft) return;
    dispatch({ type: 'HYDRATE', draft });
    setDraft(null);
  }

  function discardDraft() {
    clearDraft();
    setDraft(null);
  }

  function nextStep() {
    dispatch({ type: 'NEXT_STEP' });
  }

  async function runAnalysis() {
    dispatch({ type: 'SET_ERROR', message: '' });
    dispatch({ type: 'SET_LOADING', value: true });
    dispatch({ type: 'AGENT_RESET' });
    dispatch({ type: 'GOTO_STEP', step: STEPS.ANALYZING });

    const backendType = mapSpaceTypeToBackend(state.space.spaceType);
    const description = buildBackendDescription(state);
    const firstPhoto = state.uploads.photos[0];

    const body = {
      type: backendType,
      area: parseFloat(state.space.totalArea),
      description,
      ...(firstPhoto ? { image_base64: firstPhoto.base64 } : {}),
      // v2 optional 메타 — 백엔드가 수용하지 않아도 무해
      customer_name: state.customer.customerName || null,
      customer_phone: state.customer.phone || null,
      address: state.customer.address || null,
      inquiry_id: state.inquiryId || null,
    };

    try {
      const res = await fetch('/api/estimate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`서버 오류 ${res.status} — 분석 요청을 다시 시도해 주세요.`);
      if (!res.body) throw new Error('스트리밍 응답이 지원되지 않습니다.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          try {
            const parsed = JSON.parse(t.slice(5).trim());
            const { event, step, parallel, data, message } = parsed;
            if (event === 'agent_start') {
              dispatch({ type: 'AGENT_START', step, parallel: !!parallel });
            } else if (event === 'agent_done') {
              dispatch({ type: 'AGENT_DONE', step });
            } else if (event === 'complete') {
              finalData = data;
            } else if (event === 'error') {
              throw new Error(message || '분석 중 오류가 발생했습니다.');
            }
          } catch (err) {
            // SSE 파싱 실패는 무시
            if (err?.message) console.warn('[SSE parse]', err.message);
          }
        }
      }

      if (!finalData) throw new Error('분석 결과가 수신되지 않았습니다. 다시 시도해 주세요.');

      // 보정 엔진 통과
      const enriched = enrichEstimate(
        { ...finalData, inquiryId: state.inquiryId },
        state,
      );
      enriched.schedule = buildScheduleInfo(state);
      enriched.commentary = generateCommentary(state, enriched);

      dispatch({ type: 'SET_RESULT', raw: finalData, enriched });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err?.message || '알 수 없는 오류' });
      dispatch({ type: 'GOTO_STEP', step: STEPS.SCHEDULE });
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }

  function reset() {
    if (typeof window !== 'undefined') {
      if (!window.confirm('처음부터 다시 시작할까요? 입력하신 정보는 삭제됩니다.')) return;
    }
    clearDraft();
    setDraft(null);
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-3 sm:px-6 py-6 sm:py-8 bg-[#0a0a0f]">
      <div className="w-full max-w-[760px] mx-auto" ref={scrollAnchor}>
        {state.step >= STEPS.CUSTOMER && state.step <= STEPS.SCHEDULE && (
          <StepHeader
            currentStep={state.step}
            onPrev={() => dispatch({ type: 'PREV_STEP' })}
            onReset={reset}
            inquiryId={state.inquiryId}
          />
        )}

        {state.step === STEPS.LANDING && (
          <>
            {draft && (
              <ResumeBanner draft={draft} onResume={resumeDraft} onDiscard={discardDraft} />
            )}
            <StepLanding onStart={() => dispatch({ type: 'GOTO_STEP', step: STEPS.CUSTOMER })} />
          </>
        )}

        {state.step === STEPS.CUSTOMER && (
          <StepCustomerInfo state={state} dispatch={dispatch} onNext={nextStep} />
        )}

        {state.step === STEPS.SPACE && (
          <StepSpaceInfo state={state} dispatch={dispatch} onNext={nextStep} />
        )}

        {state.step === STEPS.SITE && (
          <StepSiteConditions state={state} dispatch={dispatch} onNext={nextStep} />
        )}

        {state.step === STEPS.SCOPES && (
          <StepScopes state={state} dispatch={dispatch} onNext={nextStep} />
        )}

        {state.step === STEPS.FINISH && (
          <StepFinishOptions state={state} dispatch={dispatch} onNext={nextStep} />
        )}

        {state.step === STEPS.SCHEDULE && (
          <StepScheduleUpload
            state={state}
            dispatch={dispatch}
            onSubmit={runAnalysis}
            submitting={state.loading}
          />
        )}

        {state.step === STEPS.ANALYZING && (
          <AnalysisLoading
            activeStep={state.agentProgress.activeStep}
            doneSteps={state.agentProgress.doneSteps}
            parallelSteps={state.agentProgress.parallelSteps}
          />
        )}

        {state.step === STEPS.RESULT && state.result && (
          <>
            <ResultSummary form={state} enriched={state.result} />
            <ResultComparisonCards tiers={state.result.tiers} />
            <ResultDetailEstimate
              breakdown={state.result.detailedBreakdown}
              workItems={state.result.workItems}
            />
            <ResultInclusions
              included={state.result.inclusions.included}
              separate={state.result.inclusions.separate}
              excluded={state.result.inclusions.excluded}
            />
            <ResultSchedule schedule={state.result.schedule} />
            <ResultProcessPlan phases={state.result.schedule?.phases} />
            <ResultCommentary
              validatorFlags={state.result.validatorFlags}
              expertComment={state.result.expertComment}
              commentary={state.result.commentary}
              adjustments={state.result.adjustments}
            />
            <ResultDisclaimers />
            <ResultActions
              enriched={state.result}
              onReset={reset}
              customer={state.customer}
            />
          </>
        )}

        {state.error && state.step !== STEPS.ANALYZING && (
          <div
            className="mt-4 rounded-xl px-4 py-3 text-[0.85rem]"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
          >
            ⚠ {state.error}
          </div>
        )}

        <div className="text-center text-[#444] text-[0.72rem] mt-8 mb-4">
          JH EstimateAI · 2026 전국민 AI 챔피언 대회 출품작 · 18년 현장 경험 기반
        </div>
      </div>
    </div>
  );
}
