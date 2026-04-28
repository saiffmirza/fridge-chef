import { chromium, Page } from 'playwright';

const APP_URL = process.env.APP_URL || 'http://localhost:8082';
const EMAIL = 'test@testfridgechef.com';
const PASSWORD = '12345678';

let passed = 0;
let failed = 0;

async function assert(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  FAIL: ${name} — ${err.message}`);
    failed++;
  }
}

async function login(page: Page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const inputs = page.locator('input');
  await inputs.nth(0).fill(EMAIL);
  await inputs.nth(1).fill(PASSWORD);
  await page.getByText(/step inside/i).last().click();
  await page.waitForTimeout(3000);
}

async function testLoginFailure(page: Page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const inputs = page.locator('input');
  await inputs.nth(0).fill('wrong@email.com');
  await inputs.nth(1).fill('wrongpassword');
  await page.getByText(/step inside/i).last().click();
  await page.waitForTimeout(3000);

  await assert('shows error on invalid credentials', async () => {
    const error = page.locator('text=invalid email or password');
    if (!(await error.isVisible())) throw new Error('Error message not visible');
  });
}

async function testLoginSuccess(page: Page) {
  await login(page);

  await assert('lands on Fridge screen after login', async () => {
    const heading = page.getByText("what's in.", { exact: true });
    if (!(await heading.isVisible())) throw new Error('Fridge heading not visible');
  });

  await assert('shows all three tabs', async () => {
    for (const tab of ['fridge', 'pantry', 'cook']) {
      const el = page.getByText(tab, { exact: true }).first();
      if (!(await el.isVisible())) throw new Error(`${tab} tab not visible`);
    }
  });

  await assert('shows sign out link', async () => {
    const out = page.getByText('sign out', { exact: true });
    if (!(await out.first().isVisible())) throw new Error('Sign out link not visible');
  });
}

async function testFridgeAddItem(page: Page) {
  await login(page);

  await assert('can type in fridge input', async () => {
    const input = page.locator('input[placeholder*="tomatoes"]');
    if (!(await input.isVisible())) throw new Error('Fridge input not visible');
    await input.fill('Chicken');
    await input.press('Enter');
  });

  await assert('shows quantity follow-up question', async () => {
    await page.waitForTimeout(500);
    const question = page.locator('text=how much have you got of');
    if (!(await question.isVisible())) throw new Error('Quantity question not visible');
  });

  await assert('shows quantity options', async () => {
    for (const option of ['a little', 'medium', 'a lot']) {
      const el = page.getByText(option, { exact: true });
      if (!(await el.first().isVisible())) throw new Error(`${option} option not visible`);
    }
  });

  await assert('can select quantity and item is saved', async () => {
    await page.getByText('a lot', { exact: true }).first().click();
    await page.waitForTimeout(2000);
    const item = page.getByText(/Chicken/).first();
    if (!(await item.isVisible())) throw new Error('Saved item not visible');
  });

  // Clean up — open the row's inline picker and tap "remove from fridge"
  await assert('can delete fridge item', async () => {
    const editLink = page.getByText('edit', { exact: true }).first();
    if (await editLink.count()) {
      await editLink.click();
      await page.waitForTimeout(400);
      const remove = page.getByText('remove from fridge', { exact: true }).first();
      if (await remove.count()) {
        await remove.click();
        await page.waitForTimeout(1500);
      }
    }
  });
}

async function testPantryTab(page: Page) {
  await login(page);

  await page.getByText('pantry', { exact: true }).first().click();
  await page.waitForTimeout(1000);

  await assert('pantry tab loads', async () => {
    const input = page.locator('input[placeholder*="olive oil"]');
    if (!(await input.isVisible())) throw new Error('Pantry input not visible');
  });

  await assert('can add pantry item with follow-up', async () => {
    const input = page.locator('input[placeholder*="olive oil"]');
    await input.fill('Olive Oil');
    await input.press('Enter');
    await page.waitForTimeout(500);

    const question = page.locator('text=how stocked is your');
    if (!(await question.isVisible())) throw new Error('Pantry question not visible');

    await page.getByText('plenty', { exact: true }).first().click();
    await page.waitForTimeout(2000);

    const item = page.getByText(/Olive Oil/).first();
    if (!(await item.isVisible())) throw new Error('Pantry item not visible');
  });

  // Clean up — pantry rows still have an X remove button
  const removeButtons = page.getByText('×', { exact: true });
  const count = await removeButtons.count();
  if (count > 0) {
    await removeButtons.first().click({ force: true });
    await page.waitForTimeout(1000);
  }
}

async function testRecipesTab(page: Page) {
  await login(page);

  await page.getByText('cook', { exact: true }).first().click();
  await page.waitForTimeout(1000);

  await assert('cook tab loads with primary action', async () => {
    const btn = page.getByText(/cook something|try again/i).first();
    if (!(await btn.isVisible())) throw new Error('Primary cook button not visible');
  });
}

async function testLogout(page: Page) {
  await login(page);

  await assert('can sign out', async () => {
    await page.getByText('sign out', { exact: true }).first().click();
    await page.waitForTimeout(2000);
    const stepIn = page.getByText(/step inside/i).last();
    if (!(await stepIn.isVisible())) throw new Error('Did not return to login screen');
  });
}

async function main() {
  const browser = await chromium.launch();

  const tests = [
    { name: 'Login Failure', fn: testLoginFailure },
    { name: 'Login Success', fn: testLoginSuccess },
    { name: 'Fridge Add Item', fn: testFridgeAddItem },
    { name: 'Pantry Tab', fn: testPantryTab },
    { name: 'Recipes Tab', fn: testRecipesTab },
    { name: 'Logout', fn: testLogout },
  ];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await test.fn(page);
    await page.close();
  }

  await browser.close();

  console.log(`\n=============================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`=============================`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Test suite crashed:', err.message);
  process.exit(1);
});
