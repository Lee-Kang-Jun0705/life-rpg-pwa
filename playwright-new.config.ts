import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e-new',
  testMatch: '**/*.spec.ts',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on first retry */
    video: 'on-first-retry',
    
    /* Maximum time each action can take */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 20000,
  },

  /* Global timeout for each test */
  timeout: 60000,

  /* Global setup and teardown */
  globalSetup: require.resolve('./e2e-new/global-setup.ts'),
  globalTeardown: require.resolve('./e2e-new/global-teardown.ts'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 콘솔 에러 수집
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against specific viewports for responsive design */
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },

    /* Performance testing configuration */
    {
      name: 'performance',
      testMatch: '**/quality/performance.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // CPU throttling
        launchOptions: {
          args: ['--enable-precise-memory-info']
        },
      },
    },

    /* Accessibility testing configuration */
    {
      name: 'accessibility',
      testMatch: '**/quality/accessibility.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Force color scheme for contrast testing
        colorScheme: 'light',
      },
    },

    /* Offline testing configuration */
    {
      name: 'offline',
      testMatch: '**/integration/offline-pwa.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        offline: true,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});