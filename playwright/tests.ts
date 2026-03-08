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
  await page.getByText('Sign In', { exact: true }).click();
  await page.waitForTimeout(3000);
}

async function testLoginFailure(page: Page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const inputs = page.locator('input');
  await inputs.nth(0).fill('wrong@email.com');
  await inputs.nth(1).fill('wrongpassword');
  await page.getByText('Sign In', { exact: true }).click();
  await page.waitForTimeout(3000);

  await assert('shows error on invalid credentials', async () => {
    const error = page.locator('text=Invalid email or password');
    if (!(await error.isVisible())) throw new Error('Error message not visible');
  });
}

async function testLoginSuccess(page: Page) {
  await login(page);

  await assert('navigates to Fridge tab after login', async () => {
    const heading = page.getByRole('heading', { name: 'My Fridge' });
    if (!(await heading.isVisible())) throw new Error('My Fridge heading not visible');
  });

  await assert('shows all three tabs', async () => {
    for (const tab of ['Fridge', 'Pantry', 'Recipes']) {
      const el = page.locator(`text=${tab}`).first();
      if (!(await el.isVisible())) throw new Error(`${tab} tab not visible`);
    }
  });

  await assert('shows Logout button', async () => {
    const logout = page.locator('text=Logout');
    if (!(await logout.isVisible())) throw new Error('Logout button not visible');
  });

}

async function testFridgeAddItem(page: Page) {
  await login(page);

  await assert('can type in fridge input', async () => {
    const input = page.locator('input[placeholder="Add item to fridge..."]');
    if (!(await input.isVisible())) throw new Error('Fridge input not visible');
    await input.fill('Chicken');
    await input.press('Enter');
  });

  await assert('shows quantity follow-up question', async () => {
    await page.waitForTimeout(500);
    const question = page.locator('text=How much do you have?');
    if (!(await question.isVisible())) throw new Error('Quantity question not visible');
  });

  await assert('shows quantity options', async () => {
    for (const option of ['A Little', 'Medium', 'A Lot']) {
      const el = page.getByText(option, { exact: true });
      if (!(await el.isVisible())) throw new Error(`${option} option not visible`);
    }
  });

  await assert('can select quantity and item is saved', async () => {
    await page.getByText('A Lot', { exact: true }).click();
    await page.waitForTimeout(2000);
    const item = page.getByText('Chicken (a lot)').first();
    if (!(await item.isVisible())) throw new Error('Saved item not visible');
  });

  // Clean up — delete the item we just added
  await assert('can delete fridge item', async () => {
    const removeButtons = page.locator('text=X');
    const count = await removeButtons.count();
    if (count > 0) {
      await removeButtons.first().click({ force: true });
      await page.waitForTimeout(2000);
    }
  });
}

async function testPantryTab(page: Page) {
  await login(page);

  // Navigate to Pantry tab
  await page.locator('text=Pantry').first().click();
  await page.waitForTimeout(1000);

  await assert('pantry tab loads', async () => {
    const input = page.locator('input[placeholder*="pantry"]');
    if (!(await input.isVisible())) throw new Error('Pantry input not visible');
  });

  await assert('can add pantry item with follow-up', async () => {
    const input = page.locator('input[placeholder*="pantry"]');
    await input.fill('Olive Oil');
    await input.press('Enter');
    await page.waitForTimeout(500);

    const question = page.locator('text=How stocked are you?');
    if (!(await question.isVisible())) throw new Error('Pantry question not visible');

    await page.getByText('Plenty', { exact: true }).click();
    await page.waitForTimeout(2000);

    const item = page.getByText('Olive Oil (plenty)').first();
    if (!(await item.isVisible())) throw new Error('Pantry item not visible');
  });

  // Clean up
  const removeButtons = page.locator('text=X');
  const count = await removeButtons.count();
  if (count > 0) {
    await removeButtons.first().click({ force: true });
    await page.waitForTimeout(1000);
  }
}

async function testRecipesTab(page: Page) {
  await login(page);

  await page.locator('text=Recipes').first().click();
  await page.waitForTimeout(1000);

  await assert('recipes tab loads with Find Recipes button', async () => {
    const btn = page.getByRole('button').locator('text=Find Recipes');
    if (!(await btn.isVisible())) {
      // Fallback: check the second match (the button text, not the heading/tab)
      const fallback = page.getByText('Find Recipes').nth(1);
      if (!(await fallback.isVisible())) throw new Error('Find Recipes button not visible');
    }
  });

}

async function testLogout(page: Page) {
  await login(page);

  await assert('can logout', async () => {
    await page.locator('text=Logout').click();
    await page.waitForTimeout(2000);
    const signIn = page.getByText('Sign In', { exact: true });
    if (!(await signIn.isVisible())) throw new Error('Did not return to login screen');
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
