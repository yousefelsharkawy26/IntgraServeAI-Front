import useConsoleLogProduction from './hooks/useConsoleLogProduction';
import AppRoutes from './routes/AppRoutes';

function App() {
  useConsoleLogProduction();
  console.log('App component');
  return <AppRoutes />;
}

export default App;
