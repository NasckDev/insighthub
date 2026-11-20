/**
 * Loads, once and outside any test's time budget, every module the app opens on demand. On a slow machine the
 * first transform of one of these chunks can take longer than a test is allowed to wait.
 */
export async function warmLazyModules(): Promise<void> {
  await Promise.all([
    import('../components/command-palette'),
    import('../components/shortcuts-modal'),
    import('../components/tour'),
    import('../components/mobile-menu'),
    import('../components/account-menu'),
    import('../components/connect-dialog'),
    import('../components/route-failure'),
    import('../components/charts/chart-tables'),
    import('../routes/survey-layout'),
    import('../ui/select-field'),
    import('../ui/date-picker-field'),
    import('../ui/toast-host'),
  ]);
}
