const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

describe('when logged in', async () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a.btn-floating');
  });

  test('can see blog create form', async () => {
    const label = await page.$eval('form label', (el) => el.innerHTML);
    expect(label).toEqual('Blog Title');
  });

  describe('And using valid inputs', async () => {
    beforeEach(async () => {
      await page.type('.title input', 'My title');
      await page.type('.content input', 'My content');
      await page.click('button[type="submit"]');
    });

    test('Submitting takes the user to review screen', async () => {
      const text = await page.$eval('h5', (el) => el.innerHTML);
      expect(text).toEqual('Please confirm your entries');
    });

    test('Submitting then saving adds to blog to index page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');
      const title = await page.$eval('.card-title', (el) => el.innerHTML);
      const content = await page.$eval('p', (el) => el.innerHTML);

      expect(title).toEqual('My title');
      expect(content).toEqual('My content');
    });
  });

  describe('And using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('button[type="submit"]');
    });

    test('the form shows an error message', async () => {
      const titleError = await page.$eval(
        '.title .red-text',
        (el) => el.innerHTML
      );
      const contentError = await page.$eval(
        '.content .red-text',
        (el) => el.innerHTML
      );

      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });
});

describe('User is not logged in', async () => {
  const actions = [
    {
      method: 'get',
      path: '/api/blogs',
    },
    {
      method: 'post',
      path: '/api/blogs',
      data: {
        title: 'My title',
        content: 'My content',
      },
    },
  ];

  test('blog related action prohibited', async () => {
    const results = await page.executeRequests(actions);
    results.forEach((res) => {
      expect(res).toEqual({ error: 'You must log in!' });
    });
  });
});
