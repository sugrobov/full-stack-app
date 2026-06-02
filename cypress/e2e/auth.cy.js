describe('Auth E2E', () => {
  beforeEach(() => {
    // Полная очистка и загрузка главной страницы перед каждым тестом
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.sessionStorage.clear();
        if (win.indexedDB) {
          win.indexedDB.deleteDatabase('shoppingCart');
        }
      },
    });

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 401,
      body: { error: 'Not authenticated' },
    });
    cy.intercept('POST', '/api/auth/register').as('register');
    cy.intercept('POST', '/api/auth/login').as('login');
  });

  it('should register a new user and redirect to home', () => {
    const email = `reg-${Date.now()}@example.com`;
    cy.visit('/register');
    cy.get('input[type="text"]').should('be.visible').type('E2E User');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type('password123');
    cy.contains('button', 'Зарегистрироваться').click();
    cy.wait('@register').its('response.statusCode').should('eq', 201);
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should login with existing user', () => {
    const email = `login-${Date.now()}@example.com`;

    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/register',
      body: { name: 'Login User', email, password: 'password123' },
      failOnStatusCode: false,
    });

    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('input[type="email"]').should('be.visible').type(email);
    cy.get('input[type="password"]').should('be.visible').type('password123');
    cy.contains('button', 'Войти').click();
    cy.wait('@login').its('response.statusCode').should('eq', 200);
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});