import useConsoleLogProduction from './hooks/useConsoleLogProduction';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'sonner';

function App() {
  useConsoleLogProduction();
  return (
    <>
      <AppRoutes />
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
