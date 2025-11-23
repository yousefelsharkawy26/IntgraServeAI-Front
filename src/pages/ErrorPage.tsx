import { useMoveBack } from '@/hooks/useMoveBack';
import { useRouteError } from 'react-router';
import metaTags from '../metaTags.json';

const ErrorPage = () => {
  // const navigate = useNavigate();
  const error = useRouteError();
  const moveBack = useMoveBack();

  const errorMessage =
    (error as { message: string })?.message ||
    'An unexpected error occurred ＞︿＜';

  return (
    <div>
      <title>{metaTags.ErrorPage.title}</title>
      <meta name="description" content={metaTags.ErrorPage.description} />
      <meta name="keywords" content={metaTags.ErrorPage.keywords} />
      <button onClick={moveBack}>Back</button>
      <h1>Oops! Something went wrong.</h1>
      <p>{errorMessage}</p>
    </div>
  );
};

export default ErrorPage;
