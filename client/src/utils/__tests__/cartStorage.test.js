import { saveCartState, loadCartState, clearCartStorage } from '../cartStorage';
import localforage from 'localforage';

vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const mockedLocalforage = localforage;

describe('cartStorage', () => {
  const cartState = { items: [{ id: 1, quantity: 2 }] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saveCartState calls localforage.setItem', async () => {
    await saveCartState(cartState);
    expect(mockedLocalforage.setItem).toHaveBeenCalledWith('cartState', cartState);
  });

  it('loadCartState returns state when exists', async () => {
    mockedLocalforage.getItem.mockResolvedValue(cartState);
    const result = await loadCartState();
    expect(result).toEqual(cartState);
    expect(mockedLocalforage.getItem).toHaveBeenCalledWith('cartState');
  });

  it('loadCartState returns null when not found', async () => {
    mockedLocalforage.getItem.mockResolvedValue(null);
    const result = await loadCartState();
    expect(result).toBeNull();
  });

  it('clearCartStorage removes item', async () => {
    await clearCartStorage();
    expect(mockedLocalforage.removeItem).toHaveBeenCalledWith('cartState');
  });

  it('handles errors gracefully in save', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedLocalforage.setItem.mockRejectedValue(new Error('quota exceeded'));
    await saveCartState(cartState);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Ошибка сохранения корзины:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});