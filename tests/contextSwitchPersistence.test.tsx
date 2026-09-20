/**
 * contextSwitchPersistence.test.tsx
 *
 * Test-driven verification for Step 9 — Context Switch Persistence.
 *
 * Requirements:
 * 1. Initial load: ContextSelector defaults to Small Business Tenant + Financial Exposure.
 * 2. Persistence: When returning to ContextSelector from the dashboard, the previous
 *    role and concern remain selected (e.g. Landlord + Exit/Renewal).
 * 3. User control: User can change either dimension independently without resetting the other.
 * 4. In-session UI state only: no localStorage, sessionStorage, cookies, or URL params.
 * 5. Regression: Supported demo flows and Step 8 unsupported-context guards remain fully intact.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContextSelector } from '../src/components/context/ContextSelector';
import App from '../src/App';

// Mock CSS modules
vi.mock('../src/components/landing/LandingScreen.module.css', () => ({ default: {} }));
vi.mock('../src/components/context/ContextSelector.module.css', () => ({ default: {} }));
vi.mock('../src/components/dashboard/TwoPaneLayout.module.css', () => ({ default: {} }));
vi.mock('../src/components/dashboard/LeftPane.module.css', () => ({ default: {} }));
vi.mock('../src/components/dashboard/ContextBar.module.css', () => ({ default: {} }));
vi.mock('../src/components/dashboard/AttentionItemCard.module.css', () => ({ default: {} }));
vi.mock('../src/components/dashboard/GuidedActions.module.css', () => ({ default: {} }));
vi.mock('../src/components/common/LegalDisclaimer.module.css', () => ({ default: {} }));
vi.mock('../src/components/pdf/PDFViewer.module.css', () => ({ default: {} }));

describe('ContextSelector — Initial Selection & Prop Persistence', () => {
  it('A. defaults to Small Business Tenant and Financial Exposure when no initial props passed', () => {
    render(<ContextSelector onStartAnalysis={vi.fn()} isDemoMode={true} />);

    const tenantChip = screen.getByTestId('role-chip-small-business-tenant');
    const landlordChip = screen.getByTestId('role-chip-landlord');
    const financeChip = screen.getByTestId('concern-chip-financial-exposure');
    const exitChip = screen.getByTestId('concern-chip-exit-renewal');

    expect(tenantChip.getAttribute('aria-pressed')).toBe('true');
    expect(landlordChip.getAttribute('aria-pressed')).toBe('false');
    expect(financeChip.getAttribute('aria-pressed')).toBe('true');
    expect(exitChip.getAttribute('aria-pressed')).toBe('false');

    expect(screen.getByText(/Analysing as:/i).textContent).toContain('Small Business Tenant');
    expect(screen.getByText(/Analysing as:/i).textContent).toContain('Financial Exposure');
  });

  it('B. initializes with initialRoleId and initialConcernId when provided', () => {
    render(
      <ContextSelector
        onStartAnalysis={vi.fn()}
        isDemoMode={true}
        initialRoleId="landlord"
        initialConcernId="exit-renewal"
      />
    );

    const tenantChip = screen.getByTestId('role-chip-small-business-tenant');
    const landlordChip = screen.getByTestId('role-chip-landlord');
    const financeChip = screen.getByTestId('concern-chip-financial-exposure');
    const exitChip = screen.getByTestId('concern-chip-exit-renewal');

    expect(landlordChip.getAttribute('aria-pressed')).toBe('true');
    expect(tenantChip.getAttribute('aria-pressed')).toBe('false');
    expect(exitChip.getAttribute('aria-pressed')).toBe('true');
    expect(financeChip.getAttribute('aria-pressed')).toBe('false');

    expect(screen.getByText(/Analysing as:/i).textContent).toContain('Landlord');
    expect(screen.getByText(/Analysing as:/i).textContent).toContain('Exit / Renewal Obligations');
  });

  it('C. allows user to change role independently without resetting concern', () => {
    const onStartAnalysis = vi.fn();
    render(
      <ContextSelector
        onStartAnalysis={onStartAnalysis}
        isDemoMode={true}
        initialRoleId="landlord"
        initialConcernId="exit-renewal"
      />
    );

    // Switch role to Employee
    fireEvent.click(screen.getByTestId('role-chip-employee'));

    expect(screen.getByTestId('role-chip-employee').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('role-chip-landlord').getAttribute('aria-pressed')).toBe('false');
    // Concern should remain Exit / Renewal
    expect(screen.getByTestId('concern-chip-exit-renewal').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByTestId('start-analysis-btn'));
    expect(onStartAnalysis).toHaveBeenCalledWith('employee', 'exit-renewal');
  });

  it('C. allows user to change concern independently without resetting role', () => {
    const onStartAnalysis = vi.fn();
    render(
      <ContextSelector
        onStartAnalysis={onStartAnalysis}
        isDemoMode={true}
        initialRoleId="landlord"
        initialConcernId="exit-renewal"
      />
    );

    // Switch concern to Liability and Risk
    fireEvent.click(screen.getByTestId('concern-chip-liability-risk'));

    expect(screen.getByTestId('concern-chip-liability-risk').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('concern-chip-exit-renewal').getAttribute('aria-pressed')).toBe('false');
    // Role should remain Landlord
    expect(screen.getByTestId('role-chip-landlord').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByTestId('start-analysis-btn'));
    expect(onStartAnalysis).toHaveBeenCalledWith('landlord', 'liability-risk');
  });
});

describe('App — Context Switch Persistence Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves Landlord + Exit/Renewal context when clicking Change on dashboard', async () => {
    const dummyBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(dummyBlob),
    }));

    render(<App />);

    // 1. Enter demo
    fireEvent.click(screen.getByTestId('explore-demo-btn'));
    expect(screen.getByText(/Choose your demo context/i)).toBeTruthy();

    // 2. Select Landlord + Exit / Renewal
    fireEvent.click(screen.getByTestId('role-chip-landlord'));
    fireEvent.click(screen.getByTestId('concern-chip-exit-renewal'));

    // 3. Run Demo Analysis
    fireEvent.click(screen.getByTestId('start-analysis-btn'));

    // 4. Await deterministic rendered state of lazy-loaded dashboard
    expect(await screen.findByTestId('pdf-viewer')).toBeTruthy();
    expect(await screen.findByText(/Strict Renewal Window/i)).toBeTruthy();

    // 5. Click "Change" button on ContextBar
    const changeBtn = screen.getByRole('button', { name: /Switch context/i });
    fireEvent.click(changeBtn);

    // 6. Should be back on ContextSelector
    expect(await screen.findByText(/Choose your demo context/i)).toBeTruthy();

    // 7. Verify Landlord and Exit / Renewal are still selected!
    const landlordChip = screen.getByTestId('role-chip-landlord');
    const tenantChip = screen.getByTestId('role-chip-small-business-tenant');
    const exitChip = screen.getByTestId('concern-chip-exit-renewal');
    const financeChip = screen.getByTestId('concern-chip-financial-exposure');

    expect(landlordChip.getAttribute('aria-pressed')).toBe('true');
    expect(tenantChip.getAttribute('aria-pressed')).toBe('false');
    expect(exitChip.getAttribute('aria-pressed')).toBe('true');
    expect(financeChip.getAttribute('aria-pressed')).toBe('false');

    const preview = screen.getByText(/Analysing as:/i);
    expect(preview.textContent).toContain('Landlord');
    expect(preview.textContent).toContain('Exit / Renewal Obligations');
  });

  it('D. Step 8 guard regression: switching from Landlord to unsupported concern still triggers error alert', async () => {
    const dummyBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(dummyBlob),
    }));

    render(<App />);

    // 1. Enter demo
    fireEvent.click(screen.getByTestId('explore-demo-btn'));

    // 2. Select Landlord + Exit / Renewal
    fireEvent.click(screen.getByTestId('role-chip-landlord'));
    fireEvent.click(screen.getByTestId('concern-chip-exit-renewal'));
    fireEvent.click(screen.getByTestId('start-analysis-btn'));

    // 3. Await deterministic rendered state of lazy-loaded dashboard
    expect(await screen.findByTestId('pdf-viewer')).toBeTruthy();

    // 4. Click Change
    fireEvent.click(screen.getByRole('button', { name: /Switch context/i }));

    expect(await screen.findByText(/Choose your demo context/i)).toBeTruthy();

    // 5. Switch concern to Financial Exposure (Landlord + Financial Exposure is unsupported in demo)
    fireEvent.click(screen.getByTestId('concern-chip-financial-exposure'));
    fireEvent.click(screen.getByTestId('start-analysis-btn'));

    // 6. Should trigger Step 8 unsupported demo context alert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText(/Demo mode supports the Tenant and Landlord lenses for this document/i)).toBeTruthy();
    });

    // Dashboard not shown
    expect(screen.queryByTestId('pdf-viewer')).toBeNull();
  });
});
