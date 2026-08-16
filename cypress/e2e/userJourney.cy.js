describe('Основной пользовательский сценарий', () => {
  const testUser = {
    name: 'Е2Е Тест',
    email: `e2e_${Date.now()}@test.com`,
    password: 'Password123!',
  };

  before(() => {
    // Очищаем куки и localStorage перед тестами
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('Регистрация нового пользователя', () => {
    cy.visit('/register');
    cy.get('[data-testid="register-name"]').type(testUser.name);
    cy.get('[data-testid="register-email"]').type(testUser.email);
    cy.get('[data-testid="register-password"]').type(testUser.password);
    cy.get('[data-testid="register-submit"]').click();

    // Ожидаем редирект на главную и приветствие
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains(`Добро пожаловать, ${testUser.name}`).should('be.visible');
  });

  it('Выход из системы', () => {
    cy.visit('/');
    cy.get('[data-testid="logout-button"]').click();
    cy.contains('Вход').should('be.visible');
  });

  it('Вход под зарегистрированным пользователем', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type(testUser.email);
    cy.get('[data-testid="login-password"]').type(testUser.password);
    cy.get('[data-testid="login-submit"]').click();

    cy.url().should('include', '/');
    cy.contains(testUser.name).should('be.visible');
  });

  it('Поиск товара и добавление в корзину', () => {
    cy.visit('/shop');
    // Вводим поисковый запрос
    cy.get('[data-testid="search-input"]').type('Футболка');
    // Дожидаемся результатов (debounce)
    cy.contains('.product-card', 'Футболка', { timeout: 5000 }).should('be.visible');
    // Добавляем первый товар в корзину
    cy.get('[data-testid="add-to-cart-button"]').first().click();
    // Проверяем, что иконка корзины обновилась (например, badge с количеством)
    cy.get('[data-testid="cart-badge"]').should('contain', '1');
  });

  it('Оформление заказа', () => {
    cy.visit('/cart');
    cy.contains('Футболка').should('be.visible');
    // Переход к оформлению
    cy.get('[data-testid="checkout-button"]').click();
    cy.url().should('include', '/checkout');

    // Заполняем обязательные поля
    cy.get('[data-testid="checkout-name"]').type(testUser.name);
    cy.get('[data-testid="checkout-address"]').type('ул. Тестовая, 1');
    cy.get('[data-testid="checkout-phone"]').type('+79991234567');
    // Кнопка должна стать активной
    cy.get('[data-testid="submit-order"]').should('not.be.disabled');
    cy.get('[data-testid="submit-order"]').click();

    // После успешного заказа редирект на главную с сообщением
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains('Заказ успешно оформлен').should('be.visible');
  });
});

describe('Валидация формы оформления заказа', () => {
beforeEach(() => {
  // Полный сброс авторизации...
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
    if (win.indexedDB) {
      win.indexedDB.deleteDatabase('shoppingCart');
    }
  });
  cy.clearCookies();
  cy.reload();

  cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/auth/register',
    body: { name: 'Test User', email: 'test@example.com', password: 'password123' },
    failOnStatusCode: false,
  });
  cy.visit('/login');
  cy.get('[data-testid="login-email"]').type('test@example.com');
  cy.get('[data-testid="login-password"]').type('password123');
  cy.get('[data-testid="login-submit"]').click();

  cy.url().should('eq', Cypress.config().baseUrl + '/');
  cy.get('a[href="/shop"]').first().click();
  cy.get('[data-testid="add-to-cart-button"]').first().click();
  cy.get('[data-testid="cart-badge"]').should('contain', '1');
  cy.get('a[href="/cart"]').first().click();
  cy.get('[data-testid="checkout-button"]').click();
  cy.url().should('include', '/checkout');

  // Очищаем предзаполненные поля
  cy.get('[data-testid="checkout-name"]').clear();
  cy.get('[data-testid="checkout-email"]').clear();
  cy.get('[data-testid="checkout-address"]').clear();
  cy.get('[data-testid="checkout-phone"]').clear();
});

  it('Показывает ошибки при пустых обязательных полях', () => {
    cy.get('[data-testid="submit-order"]').click();
    cy.contains('Имя обязательно').should('be.visible');
    cy.contains('Адрес обязателен').should('be.visible');
    cy.contains('Телефон обязателен').should('be.visible');
  });

  it('Не отправляет форму при незаполненных полях', () => {
    cy.get('[data-testid="checkout-name"]').clear();
    cy.get('[data-testid="submit-order"]').click();
    // Форма не отправляется и не покидает /checkout
    cy.url().should('include', '/checkout');
    cy.contains('Имя обязательно').should('be.visible');
  });

  it('Проверяет формат email', () => {
    cy.get('[data-testid="checkout-email"]').type('invalid-email');
    cy.get('[data-testid="submit-order"]').click();
    cy.contains('Некорректный email').should('be.visible');
  });

  it('Кнопка становится активной после заполнения всех полей', () => {
    cy.get('[data-testid="checkout-name"]').type('Иван');
    cy.get('[data-testid="checkout-address"]').type('ул. Ленина');
    cy.get('[data-testid="checkout-phone"]').type('+79991112233');
    cy.get('[data-testid="checkout-email"]').clear().type('ivan@test.com');
    cy.get('[data-testid="submit-order"]').should('not.be.disabled');
  });
});

describe('Защита маршрутов', () => {
  it('Редирект на /login при попытке доступа к /checkout без авторизации', () => {
    // Полный сброс авторизации: localStorage, sessionStorage, IndexedDB (redux-persist), cookies
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
      if (win.indexedDB) {
        win.indexedDB.deleteDatabase('shoppingCart');
      }
    });
    cy.clearCookies();
    cy.reload();
    cy.visit('/checkout');
    cy.url().should('include', '/login');
    cy.contains('Вход').should('be.visible');
  });
});