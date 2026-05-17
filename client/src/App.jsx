// import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
// import { useDispatch } from 'react-redux';
import Header from './components/Header';
// import { fetchProducts } from './store/productsSlice';
import routes from './routes';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';

function App() {
  // const dispatch = useDispatch();
  const location = useLocation();

  // useEffect(() => {
  //   dispatch(fetchProducts());
  // }, [dispatch]);

  return (

    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {routes.map(route => (
              <Route key={route.path} path={route.path} element={<PageTransition>{route.element}</PageTransition>} />
            ))}
          </Routes>
        </AnimatePresence>
      </main>
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 Интернет Магазин. Все права защищены.</p>
        </div>
      </footer>
    </div>

  );
}

export default App;
