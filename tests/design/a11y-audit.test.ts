import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Phase 9: Accessibility Audit (Module H4)', () => {
  it('verifies modal dialogs implement standard ARIA semantics and aria-modal', () => {
    const componentModal = readFileSync(
      'src/components/system-design/ComponentReferenceModal.tsx',
      'utf8',
    );
    expect(componentModal).toContain('role="dialog"');
    expect(componentModal).toContain('aria-modal="true"');
    expect(componentModal).toContain('aria-labelledby="reference-modal-title"');
    expect(componentModal).toContain('useFocusTrap');

    const scorecardModal = readFileSync(
      'src/components/interview/MockScorecardModal.tsx',
      'utf8',
    );
    expect(scorecardModal).toContain('role="dialog"');
    expect(scorecardModal).toContain('aria-modal="true"');
    expect(scorecardModal).toContain('aria-labelledby="scorecard-title"');
    expect(scorecardModal).toContain('useFocusTrap');

    const failureModal = readFileSync(
      'src/components/system-design/FailureDecisionModal.tsx',
      'utf8',
    );
    expect(failureModal).toContain('role="dialog"');
    expect(failureModal).toContain('aria-modal="true"');
    expect(failureModal).toContain('aria-labelledby="failure-dialog-title"');
    expect(failureModal).toContain('useFocusTrap');
  });

  it('verifies live timer has polite milestone announcer and timer role', () => {
    const stageTimer = readFileSync('src/components/interview/StageTimer.tsx', 'utf8');
    expect(stageTimer).toContain('aria-live="polite"');
    expect(stageTimer).toContain('role="timer"');
    expect(stageTimer).toContain('role="region"');
    expect(stageTimer).toContain('aria-label=');
  });

  it('verifies simulation bottleneck alerts declare assertive live regions', () => {
    const simPanel = readFileSync('src/components/system-design/SimulationPanel.tsx', 'utf8');
    expect(simPanel).toContain('role="alert"');
    expect(simPanel).toContain('aria-live="assertive"');
  });

  it('verifies mobile responsive pane switches in mock interview workspaces', () => {
    const dsaWorkspace = readFileSync('src/components/interview/DsaMockWorkspace.tsx', 'utf8');
    expect(dsaWorkspace).toContain('mobilePane');
    expect(dsaWorkspace).toContain('lg:hidden');
    expect(dsaWorkspace).toContain('hidden lg:flex');

    const sysDesignWorkspace = readFileSync(
      'src/components/interview/SystemDesignMockWorkspace.tsx',
      'utf8',
    );
    expect(sysDesignWorkspace).toContain('mobilePane');
    expect(sysDesignWorkspace).toContain('lg:hidden');
    expect(sysDesignWorkspace).toContain('hidden lg:flex');
  });
});
