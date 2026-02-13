/**
 * Prompt Evaluation Suite
 *
 * Tests the system + user prompts against realistic scenarios and grades
 * the LLM responses on correctness, safety, and quality.
 *
 * Run:
 *   OPENAI_API_KEY=sk-xxx npx vitest run src/services/openai/prompt-eval.test.ts
 *
 * Set EVAL_MODEL to override the default model (gpt-5-mini):
 *   EVAL_MODEL=gpt-4.1-mini OPENAI_API_KEY=sk-xxx npx vitest run src/services/openai/prompt-eval.test.ts
 */

import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { callOpenAI, parseJSONResponse, OpenAIModel } from './client';
import {
  buildSystemPrompt,
  buildExercisePrompt,
  buildTrainingGuidance,
  SuggestionContext,
  ExerciseSuggestionInput,
} from './suggestions';
import { BUILD_5_WEEK_CYCLE } from '../../types/cycles';

// ── Config ────────────────────────────────────────────────────────────

// Load API key from .env.local or environment
const loadApiKey = (): string => {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try {
    const envFile = readFileSync(resolve(__dirname, '../../../.env.local'), 'utf-8');
    const match = envFile.match(/^OPENAI_API_KEY=(.+)$/m);
    return match?.[1]?.trim() ?? '';
  } catch {
    return '';
  }
};

const API_KEY = loadApiKey();
const MODEL: OpenAIModel = (process.env.EVAL_MODEL as OpenAIModel) || 'gpt-5-mini';
const TIMEOUT = 30_000; // 30s per test (API latency)

// Skip everything if no API key
const run = API_KEY ? describe : describe.skip;

// ── Grading Types ─────────────────────────────────────────────────────

interface Check {
  name: string;
  passed: boolean;
  detail: string;
  weight: number; // how important this check is (1-3)
}

interface EvalCriteria {
  weightRange: [number, number];
  repsRange: [number, number];
  expectedStatus?: string[];
  requireTechniqueTip?: boolean;
  requireRepRangeChange?: boolean;
  expectedConfidence?: string[];
  weightUnit: 'lbs' | 'kg';
  rounding: number; // 2.5 for lbs, 1.25 for kg
}

interface EvalResult {
  scenario: string;
  score: number;
  maxScore: number;
  passed: boolean;
  checks: Check[];
  rawResponse: string;
  suggestion: Record<string, unknown> | null;
}

// Accumulate results for summary
const allResults: EvalResult[] = [];

// ── Grading Logic ─────────────────────────────────────────────────────

const grade = (
  scenarioName: string,
  rawResponse: string,
  parsed: { suggestion?: Record<string, unknown> },
  criteria: EvalCriteria
): EvalResult => {
  const s = parsed?.suggestion;
  const checks: Check[] = [];

  // 1. Valid JSON structure
  checks.push({
    name: 'valid_json',
    passed: !!s && typeof s.suggestedWeight === 'number' && typeof s.suggestedReps === 'number',
    detail: s ? `weight=${s.suggestedWeight}, reps=${s.suggestedReps}` : 'null/invalid response',
    weight: 3,
  });

  // 2. Has exerciseId
  checks.push({
    name: 'has_exercise_id',
    passed: !!s?.exerciseId,
    detail: `exerciseId=${s?.exerciseId ?? 'missing'}`,
    weight: 1,
  });

  // 3. Weight in expected range
  const w = s?.suggestedWeight as number | undefined;
  checks.push({
    name: 'weight_range',
    passed: w != null && w >= criteria.weightRange[0] && w <= criteria.weightRange[1],
    detail: `${w ?? 'N/A'} ${criteria.weightUnit} (expected ${criteria.weightRange[0]}-${criteria.weightRange[1]})`,
    weight: 3,
  });

  // 4. Reps in expected range
  const r = s?.suggestedReps as number | undefined;
  checks.push({
    name: 'reps_range',
    passed: r != null && r >= criteria.repsRange[0] && r <= criteria.repsRange[1],
    detail: `${r ?? 'N/A'} reps (expected ${criteria.repsRange[0]}-${criteria.repsRange[1]})`,
    weight: 2,
  });

  // 5. Weight properly rounded
  if (w != null) {
    const remainder = Math.abs(w % criteria.rounding);
    const isRounded = remainder < 0.01 || Math.abs(remainder - criteria.rounding) < 0.01;
    checks.push({
      name: 'weight_rounding',
      passed: isRounded,
      detail: `${w} % ${criteria.rounding} = ${remainder.toFixed(3)}`,
      weight: 2,
    });
  }

  // 6. Progress status matches expected
  if (criteria.expectedStatus) {
    checks.push({
      name: 'progress_status',
      passed: criteria.expectedStatus.includes(s?.progressStatus as string),
      detail: `"${s?.progressStatus}" (expected one of: ${criteria.expectedStatus.join(', ')})`,
      weight: 2,
    });
  }

  // 7. Confidence level
  if (criteria.expectedConfidence) {
    checks.push({
      name: 'confidence',
      passed: criteria.expectedConfidence.includes(s?.confidence as string),
      detail: `"${s?.confidence}" (expected one of: ${criteria.expectedConfidence.join(', ')})`,
      weight: 1,
    });
  }

  // 8. Technique tip for plateau
  if (criteria.requireTechniqueTip) {
    const tip = s?.techniqueTip as string | undefined;
    checks.push({
      name: 'technique_tip',
      passed: !!tip && tip.length > 5,
      detail: tip ? `"${tip.slice(0, 60)}..."` : 'missing',
      weight: 2,
    });
  }

  // 9. Rep range change for plateau
  if (criteria.requireRepRangeChange) {
    const change = s?.repRangeChange as Record<string, unknown> | undefined;
    checks.push({
      name: 'rep_range_change',
      passed: !!change?.from && !!change?.to && !!change?.reason,
      detail: change ? `${change.from} -> ${change.to}` : 'missing',
      weight: 2,
    });
  }

  // 10. Has reasoning
  const reasoning = s?.reasoning as string | undefined;
  checks.push({
    name: 'has_reasoning',
    passed: !!reasoning && reasoning.length > 10,
    detail: reasoning ? `"${reasoning.slice(0, 80)}..."` : 'missing',
    weight: 1,
  });

  // Calculate weighted score
  const maxScore = checks.reduce((sum, c) => sum + c.weight, 0);
  const score = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);

  const result: EvalResult = {
    scenario: scenarioName,
    score,
    maxScore,
    passed: score >= maxScore * 0.7, // 70% threshold
    checks,
    rawResponse,
    suggestion: s as Record<string, unknown> | null,
  };

  allResults.push(result);
  return result;
};

// ── Helper: Call LLM and Grade ────────────────────────────────────────

const evalScenario = async (
  name: string,
  exerciseId: string,
  weightUnit: 'lbs' | 'kg',
  context: SuggestionContext,
  exercise: ExerciseSuggestionInput,
  criteria: EvalCriteria
): Promise<EvalResult> => {
  const systemPrompt = buildSystemPrompt(exerciseId, weightUnit);
  const userPrompt = buildExercisePrompt(context, exercise);

  let rawResponse: string;
  try {
    rawResponse = await callOpenAI({
      apiKey: API_KEY,
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 400,
      temperature: 0.3,
    });
  } catch (err) {
    // API error → grade as total failure
    const errorMsg = err instanceof Error ? err.message : String(err);
    const result: EvalResult = {
      scenario: name,
      score: 0,
      maxScore: 1,
      passed: false,
      checks: [{ name: 'api_call', passed: false, detail: `API Error: ${errorMsg}`, weight: 3 }],
      rawResponse: errorMsg,
      suggestion: null,
    };
    allResults.push(result);
    return result;
  }

  const parsed = parseJSONResponse<{ suggestion?: Record<string, unknown> }>(
    rawResponse,
    { suggestion: undefined }
  );

  return grade(name, rawResponse, parsed, criteria);
};

// ── Helper: Build Context ─────────────────────────────────────────────

const makeContext = (
  overrides: Partial<SuggestionContext> = {}
): SuggestionContext => ({
  trainingGuidance: buildTrainingGuidance('build', 'intermediate'),
  weightContext: '',
  weightUnit: 'lbs',
  experienceLevel: 'intermediate',
  workoutGoal: 'build',
  ...overrides,
});

// ── Scenarios ─────────────────────────────────────────────────────────

run('Prompt Evaluation Suite', () => {

  afterAll(() => {
    // Print summary report
    console.log('\n' + '='.repeat(70));
    console.log('PROMPT EVAL SUMMARY');
    console.log('='.repeat(70));
    console.log(`Model: ${MODEL}`);
    console.log(`Total: ${allResults.length} scenarios`);
    console.log(`Passed: ${allResults.filter((r) => r.passed).length}/${allResults.length}`);
    console.log(
      `Avg Score: ${(
        (allResults.reduce((sum, r) => sum + r.score / r.maxScore, 0) /
          allResults.length) *
        100
      ).toFixed(1)}%`
    );
    console.log('-'.repeat(70));

    for (const r of allResults) {
      const pct = ((r.score / r.maxScore) * 100).toFixed(0);
      const icon = r.passed ? 'PASS' : 'FAIL';
      console.log(`[${icon}] ${r.scenario} — ${pct}% (${r.score}/${r.maxScore})`);

      const failed = r.checks.filter((c) => !c.passed);
      if (failed.length > 0) {
        for (const f of failed) {
          console.log(`       x ${f.name}: ${f.detail}`);
        }
      }
    }

    console.log('='.repeat(70) + '\n');
  });

  // ─── 1. Steady Improvement ───────────────────────────────────────

  it('1. Steady improvement - should suggest small weight increase', async () => {
    const result = await evalScenario(
      'Steady Improvement (Bench, Build, Wk1)',
      'bench-press',
      'lbs',
      makeContext({
        trainingGuidance: buildTrainingGuidance('build', 'intermediate'),
      }),
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 10,
        recentSets: [
          { date: '2025-02-10', weight: 140, reps: 10 },
          { date: '2025-02-07', weight: 137.5, reps: 9 },
          { date: '2025-02-03', weight: 135, reps: 10 },
        ],
        analysis: {
          progressStatus: 'improving',
          estimated1RMTrend: 3.7,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 140, avgReps: 10, estimated1RM: 187 },
            { date: '2025-02-07', maxWeight: 137.5, avgReps: 9, estimated1RM: 179 },
            { date: '2025-02-03', maxWeight: 135, avgReps: 10, estimated1RM: 180 },
          ],
        },
        personalization: {
          baseline: 138.5,
          increment: 2.5,
          compositeMultiplier: 1.0,
          factors: [],
          confidence: 'high',
        },
      },
      {
        weightRange: [137.5, 147.5],
        repsRange: [8, 12],
        expectedStatus: ['improving'],
        expectedConfidence: ['high', 'medium'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 2. Plateau Detection ────────────────────────────────────────

  it('2. Plateau - should suggest technique change and rep range change', async () => {
    const result = await evalScenario(
      'Plateau (Squat, Build, Wk0)',
      'squat',
      'lbs',
      makeContext({
        trainingGuidance: buildTrainingGuidance('build', 'intermediate'),
      }),
      {
        exerciseId: 'squat',
        exerciseName: 'Barbell Squat',
        targetSets: 3,
        targetReps: 8,
        recentSets: [
          { date: '2025-02-10', weight: 225, reps: 7 },
          { date: '2025-02-07', weight: 225, reps: 7 },
          { date: '2025-02-03', weight: 225, reps: 6 },
          { date: '2025-01-30', weight: 225, reps: 7 },
          { date: '2025-01-27', weight: 225, reps: 7 },
        ],
        analysis: {
          progressStatus: 'plateau',
          estimated1RMTrend: 0,
          plateauSignals: {
            sameWeight3Sessions: true,
            failedRepTargets: true,
            stalled1RM: true,
          },
          recentSessions: [
            { date: '2025-02-10', maxWeight: 225, avgReps: 7, estimated1RM: 278 },
            { date: '2025-02-07', maxWeight: 225, avgReps: 7, estimated1RM: 278 },
            { date: '2025-02-03', maxWeight: 225, avgReps: 6, estimated1RM: 270 },
            { date: '2025-01-30', maxWeight: 225, avgReps: 7, estimated1RM: 278 },
            { date: '2025-01-27', maxWeight: 225, avgReps: 7, estimated1RM: 278 },
          ],
        },
      },
      {
        weightRange: [195, 235],
        repsRange: [4, 12],
        expectedStatus: ['plateau'],
        requireTechniqueTip: true,
        requireRepRangeChange: true,
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 3. Deload Week ──────────────────────────────────────────────

  it('3. Deload week - should reduce weight 20-30%', async () => {
    const result = await evalScenario(
      'Deload Week (Bench, Build, Wk4)',
      'bench-press',
      'lbs',
      makeContext({
        trainingGuidance: buildTrainingGuidance('build', 'intermediate', BUILD_5_WEEK_CYCLE.phases[4]),
      }),
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 10,
        recentSets: [
          { date: '2025-02-10', weight: 155, reps: 6 },
          { date: '2025-02-07', weight: 150, reps: 7 },
        ],
        analysis: {
          progressStatus: 'improving',
          estimated1RMTrend: 5,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 155, avgReps: 6, estimated1RM: 186 },
            { date: '2025-02-07', maxWeight: 150, avgReps: 7, estimated1RM: 185 },
          ],
        },
      },
      {
        // 20-30% reduction from 155 = 108.5-124 → rounded: 107.5-125
        weightRange: [105, 127.5],
        repsRange: [8, 15],
        expectedStatus: ['improving'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 4. Brand New Exercise ───────────────────────────────────────

  it('4. New exercise - should suggest conservative start', async () => {
    const result = await evalScenario(
      'New Exercise (OHP, No History)',
      'overhead-press',
      'lbs',
      makeContext(),
      {
        exerciseId: 'overhead-press',
        exerciseName: 'Overhead Press',
        targetSets: 3,
        targetReps: 10,
        // No recentSets, no analysis
      },
      {
        weightRange: [0, 75],
        repsRange: [8, 12],
        expectedStatus: ['new'],
        expectedConfidence: ['low', 'medium'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 5. Declining Performance ────────────────────────────────────

  it('5. Declining - should maintain or reduce weight', async () => {
    const result = await evalScenario(
      'Declining (Deadlift, Build, Wk0)',
      'deadlift',
      'lbs',
      makeContext(),
      {
        exerciseId: 'deadlift',
        exerciseName: 'Deadlift',
        targetSets: 3,
        targetReps: 8,
        recentSets: [
          { date: '2025-02-10', weight: 295, reps: 6 },
          { date: '2025-02-07', weight: 305, reps: 6 },
          { date: '2025-02-03', weight: 315, reps: 7 },
        ],
        analysis: {
          progressStatus: 'declining',
          estimated1RMTrend: -6.5,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 295, avgReps: 6, estimated1RM: 354 },
            { date: '2025-02-07', maxWeight: 305, avgReps: 6, estimated1RM: 366 },
            { date: '2025-02-03', maxWeight: 315, avgReps: 7, estimated1RM: 389 },
          ],
        },
      },
      {
        // Should NOT increase; maintain or reduce from 295
        weightRange: [265, 305],
        repsRange: [6, 10],
        expectedStatus: ['declining', 'plateau'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 6. Weight Loss Goal ─────────────────────────────────────────

  it('6. Weight loss goal - should maintain, not increase', async () => {
    const result = await evalScenario(
      'Weight Loss (Bench, Lose, Wk0)',
      'bench-press',
      'lbs',
      makeContext({
        trainingGuidance: buildTrainingGuidance('lose', 'intermediate'),
        workoutGoal: 'lose',
        weightContext: 'Body weight: 210.0 lbs (lost 5.0 lbs over 60 days)',
      }),
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 8,
        recentSets: [
          { date: '2025-02-10', weight: 185, reps: 8 },
          { date: '2025-02-07', weight: 185, reps: 8 },
          { date: '2025-02-03', weight: 185, reps: 9 },
        ],
        analysis: {
          progressStatus: 'improving',
          estimated1RMTrend: 1,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 185, avgReps: 8, estimated1RM: 234 },
            { date: '2025-02-07', maxWeight: 185, avgReps: 8, estimated1RM: 234 },
            { date: '2025-02-03', maxWeight: 185, avgReps: 9, estimated1RM: 241 },
          ],
        },
      },
      {
        // Lose goal = maintain strength, no increases expected
        weightRange: [175, 190],
        repsRange: [6, 10],
        expectedStatus: ['improving', 'plateau'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 7. Beginner ─────────────────────────────────────────────────

  it('7. Beginner - should use larger increments', async () => {
    const result = await evalScenario(
      'Beginner (Bench, Build, Wk1)',
      'bench-press',
      'lbs',
      makeContext({
        trainingGuidance: buildTrainingGuidance('build', 'beginner', BUILD_5_WEEK_CYCLE.phases[1]),
        experienceLevel: 'beginner',
      }),
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 10,
        recentSets: [
          { date: '2025-02-10', weight: 95, reps: 10 },
          { date: '2025-02-07', weight: 90, reps: 10 },
        ],
        analysis: {
          progressStatus: 'improving',
          estimated1RMTrend: 5.5,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 95, avgReps: 10, estimated1RM: 127 },
            { date: '2025-02-07', maxWeight: 90, avgReps: 10, estimated1RM: 120 },
          ],
        },
        personalization: {
          baseline: 93,
          increment: 5,
          compositeMultiplier: 1.0,
          factors: [],
          confidence: 'medium',
        },
      },
      {
        // Beginner + week 2 overload → 95 + 5-10 = 100-105
        weightRange: [95, 110],
        repsRange: [6, 10],
        expectedStatus: ['improving'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 8. Advanced Lifter ──────────────────────────────────────────

  it('8. Advanced - should use small increments', async () => {
    const result = await evalScenario(
      'Advanced (Bench, Build, Wk0)',
      'bench-press',
      'lbs',
      makeContext({
        trainingGuidance: buildTrainingGuidance('build', 'advanced'),
        experienceLevel: 'advanced',
      }),
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 8,
        recentSets: [
          { date: '2025-02-10', weight: 315, reps: 8 },
          { date: '2025-02-07', weight: 315, reps: 7 },
          { date: '2025-02-03', weight: 312.5, reps: 8 },
        ],
        analysis: {
          progressStatus: 'improving',
          estimated1RMTrend: 1.2,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 315, avgReps: 8, estimated1RM: 399 },
            { date: '2025-02-07', maxWeight: 315, avgReps: 7, estimated1RM: 389 },
            { date: '2025-02-03', maxWeight: 312.5, avgReps: 8, estimated1RM: 396 },
          ],
        },
        personalization: {
          baseline: 314.2,
          increment: 2.5,
          compositeMultiplier: 1.0,
          factors: [],
          confidence: 'high',
        },
      },
      {
        // Advanced: max 1-2.5% increase → 315 + 2.5-5 = 315-320
        weightRange: [312.5, 322.5],
        repsRange: [6, 10],
        expectedStatus: ['improving'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 9. Personalization Anchor ───────────────────────────────────

  it('9. Personalization anchor - should stay near algorithm recommendation', async () => {
    const result = await evalScenario(
      'Personalization Anchor (Bench, Build)',
      'bench-press',
      'lbs',
      makeContext(),
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 10,
        recentSets: [
          { date: '2025-02-10', weight: 140, reps: 10 },
          { date: '2025-02-07', weight: 137.5, reps: 10 },
          { date: '2025-02-03', weight: 135, reps: 10 },
        ],
        analysis: {
          progressStatus: 'improving',
          estimated1RMTrend: 3.5,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 140, avgReps: 10, estimated1RM: 187 },
            { date: '2025-02-07', maxWeight: 137.5, avgReps: 10, estimated1RM: 183 },
            { date: '2025-02-03', maxWeight: 135, avgReps: 10, estimated1RM: 180 },
          ],
        },
        personalization: {
          baseline: 138.8,
          increment: 3.0,
          compositeMultiplier: 1.15,
          factors: [
            { name: 'Success Rate', value: 1.2, reasoning: 'Hit target 100% of the time' },
            { name: 'Mood Trend', value: 1.1, reasoning: 'Average mood: 4.5/5' },
          ],
          confidence: 'high',
        },
      },
      {
        // Algorithm says: 138.8 + 3.0 * 1.15 = ~142.3 → should be near 142.5
        weightRange: [140, 150],
        repsRange: [8, 12],
        expectedStatus: ['improving'],
        expectedConfidence: ['high', 'medium'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 10. KG Units ────────────────────────────────────────────────

  it('10. KG units - should use kg and round to 1.25', async () => {
    const result = await evalScenario(
      'KG Units (Squat, Build)',
      'squat',
      'kg',
      makeContext({
        weightUnit: 'kg',
        trainingGuidance: buildTrainingGuidance('build', 'intermediate'),
      }),
      {
        exerciseId: 'squat',
        exerciseName: 'Barbell Squat',
        targetSets: 3,
        targetReps: 8,
        recentSets: [
          { date: '2025-02-10', weight: 100, reps: 8 },
          { date: '2025-02-07', weight: 97.5, reps: 8 },
        ],
        analysis: {
          progressStatus: 'improving',
          estimated1RMTrend: 2.5,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 100, avgReps: 8, estimated1RM: 127 },
            { date: '2025-02-07', maxWeight: 97.5, avgReps: 8, estimated1RM: 123 },
          ],
        },
      },
      {
        weightRange: [97.5, 105],
        repsRange: [8, 10],
        expectedStatus: ['improving'],
        weightUnit: 'kg',
        rounding: 1.25,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 11. Strength Push Week ──────────────────────────────────────

  it('11. Strength push week - should push heavier, fewer reps', async () => {
    const result = await evalScenario(
      'Strength Push (Bench, Build, Wk3)',
      'bench-press',
      'lbs',
      makeContext({
        trainingGuidance: buildTrainingGuidance('build', 'intermediate', BUILD_5_WEEK_CYCLE.phases[3]),
      }),
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 6,
        recentSets: [
          { date: '2025-02-10', weight: 145, reps: 8 },
          { date: '2025-02-07', weight: 145, reps: 7 },
        ],
        analysis: {
          progressStatus: 'improving',
          estimated1RMTrend: 4,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 145, avgReps: 8, estimated1RM: 184 },
            { date: '2025-02-07', maxWeight: 145, avgReps: 7, estimated1RM: 179 },
          ],
        },
      },
      {
        // Week 3 = push heavier: should be >= 145, up to ~160
        weightRange: [145, 165],
        repsRange: [4, 8],
        expectedStatus: ['improving'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

  // ─── 12. Volume Focus Week ───────────────────────────────────────

  it('12. Volume focus week - should keep weight, build reps', async () => {
    const result = await evalScenario(
      'Volume Focus (Bench, Build, Wk2)',
      'bench-press',
      'lbs',
      makeContext({
        trainingGuidance: buildTrainingGuidance('build', 'intermediate', BUILD_5_WEEK_CYCLE.phases[2]),
      }),
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 9,
        recentSets: [
          { date: '2025-02-10', weight: 145, reps: 7 },
          { date: '2025-02-07', weight: 140, reps: 9 },
        ],
        analysis: {
          progressStatus: 'improving',
          estimated1RMTrend: 3,
          recentSessions: [
            { date: '2025-02-10', maxWeight: 145, avgReps: 7, estimated1RM: 179 },
            { date: '2025-02-07', maxWeight: 140, avgReps: 9, estimated1RM: 182 },
          ],
        },
      },
      {
        // Week 2 = keep week 1 weight (145), build reps to 7-9
        weightRange: [140, 150],
        repsRange: [7, 10],
        expectedStatus: ['improving'],
        weightUnit: 'lbs',
        rounding: 2.5,
      }
    );

    expect(result.passed).toBe(true);
  }, TIMEOUT);

});
